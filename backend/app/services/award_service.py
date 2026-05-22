"""Season snapshot and TOP 3 award calculation (F9)."""

from __future__ import annotations

from collections import defaultdict
from datetime import datetime, timedelta, timezone

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models.award import Award
from app.models.place import Place
from app.models.place_score_snapshot import PlaceScoreSnapshot
from app.models.place_signal import PlaceSignal
from app.models.season import Season
from app.services.signal_resolve import resolve_signal_bucket

KST = timezone(timedelta(hours=9))
TOP_N = 3


def _ensure_aware(dt: datetime) -> datetime:
    if dt.tzinfo is None:
        return dt.replace(tzinfo=timezone.utc)
    return dt


def calculate_and_award_season(season_id: str, db: Session) -> dict[str, int]:
    """
    1. Load season window and in-range signals
    2. Aggregate score by place × meeting category × place district
    3. Upsert place_score_snapshots
    4. Award TOP 3 per (category, district); skip existing award rows
    """
    season = db.get(Season, season_id)
    if season is None:
        msg = f"Season not found: {season_id}"
        raise ValueError(msg)

    starts = _ensure_aware(season.starts_at)
    ends = _ensure_aware(season.ends_at)

    signals = db.scalars(
        select(PlaceSignal).where(
            PlaceSignal.is_void.is_(False),
            PlaceSignal.occurred_at >= starts,
            PlaceSignal.occurred_at <= ends,
        ),
    ).all()

    place_cache: dict[str, Place | None] = {}
    aggregates: dict[tuple[str, str, str], dict[str, float | int]] = defaultdict(
        lambda: {"score": 0.0, "signal_count": 0},
    )

    for signal in signals:
        place_id = signal.place_id
        if place_id not in place_cache:
            place_cache[place_id] = db.get(Place, place_id)

        bucket = resolve_signal_bucket(db, signal, place_cache[place_id])
        if bucket is None:
            continue

        category, district = bucket
        key = (place_id, category, district)
        aggregates[key]["score"] = float(aggregates[key]["score"]) + float(signal.weight)
        aggregates[key]["signal_count"] = int(aggregates[key]["signal_count"]) + 1

    snapshots_created = 0
    for (place_id, category, district), agg in aggregates.items():
        score = round(float(agg["score"]), 1)
        signal_count = int(agg["signal_count"])
        existing = db.scalar(
            select(PlaceScoreSnapshot).where(
                PlaceScoreSnapshot.season_id == season_id,
                PlaceScoreSnapshot.place_id == place_id,
                PlaceScoreSnapshot.category == category,
                PlaceScoreSnapshot.district == district,
            ),
        )
        if existing is None:
            db.add(
                PlaceScoreSnapshot(
                    season_id=season_id,
                    place_id=place_id,
                    category=category,
                    district=district,
                    score=score,
                    signal_count=signal_count,
                ),
            )
            snapshots_created += 1
        else:
            existing.score = score
            existing.signal_count = signal_count

    db.flush()

    snapshots = db.scalars(
        select(PlaceScoreSnapshot).where(PlaceScoreSnapshot.season_id == season_id),
    ).all()

    groups: dict[tuple[str, str], list[PlaceScoreSnapshot]] = defaultdict(list)
    for snap in snapshots:
        groups[(snap.category, snap.district)].append(snap)

    awards_created = 0
    now = datetime.now(KST)

    for group_snaps in groups.values():
        ranked = sorted(group_snaps, key=lambda s: (-s.score, s.place_id))
        for rank, snap in enumerate(ranked[:TOP_N], start=1):
            exists = db.scalar(
                select(Award.id).where(
                    Award.season_id == season_id,
                    Award.place_id == snap.place_id,
                    Award.category == snap.category,
                    Award.district == snap.district,
                ),
            )
            if exists is not None:
                continue
            db.add(
                Award(
                    season_id=season_id,
                    place_id=snap.place_id,
                    category=snap.category,
                    district=snap.district,
                    rank=rank,
                    score=snap.score,
                    awarded_at=now,
                ),
            )
            awards_created += 1

    db.commit()
    return {
        "snapshots_created": snapshots_created,
        "awards_created": awards_created,
    }


def count_season_awards(db: Session, season_id: str) -> int:
    total = db.scalar(
        select(func.count(Award.id)).where(Award.season_id == season_id),
    )
    return int(total or 0)
