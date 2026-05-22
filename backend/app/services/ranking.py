"""Real-time district × category ranking from place signals."""

from __future__ import annotations

from datetime import datetime, timedelta, timezone

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models.meeting_event import MeetingEvent
from app.models.meeting_rating import MeetingRating
from app.models.place import Place
from app.models.season import Season
from app.services.place_scoring import calculate_place_score


def resolve_ranking_season(db: Session) -> tuple[str, str]:
    """Return (season name, status) from seasons table for ranking header."""
    active = db.scalars(
        select(Season)
        .where(Season.status == "active")
        .order_by(Season.starts_at.desc())
        .limit(1),
    ).first()
    if active is not None:
        return active.name, active.status

    latest = db.scalars(
        select(Season).order_by(Season.ends_at.desc()).limit(1),
    ).first()
    if latest is not None:
        return latest.name, latest.status

    return "시즌", "active"


def fetch_ranking_districts(db: Session) -> list[str]:
    rows = db.scalars(
        select(Place.district)
        .where(Place.district.is_not(None))
        .distinct()
        .order_by(Place.district.asc()),
    ).all()
    return [d for d in rows if d]


def fetch_ranking_categories(db: Session) -> list[str]:
    rows = db.scalars(
        select(Place.category)
        .where(Place.category.is_not(None))
        .distinct()
        .order_by(Place.category.asc()),
    ).all()
    return [c for c in rows if c]


def fetch_ranking(
    db: Session,
    district: str,
    category: str,
    limit: int = 10,
) -> list[dict]:
    now = datetime.now(timezone.utc)
    since_30d = now - timedelta(days=30)

    places = db.scalars(
        select(Place)
        .where(Place.district == district, Place.category == category)
        .order_by(Place.name.asc()),
    ).all()

    scored: list[tuple[Place, dict]] = []
    for place in places:
        breakdown = calculate_place_score(db, place.id)
        if breakdown["total"] <= 0:
            continue
        scored.append(
            (
                place,
                {
                    "meetup_signal": round(
                        breakdown["selected"] + breakdown["rated"],
                        1,
                    ),
                    "mention": breakdown["mentioned"],
                    "review": 0.0,
                    "total": breakdown["total"],
                },
            ),
        )

    scored.sort(key=lambda x: (-x[1]["total"], x[0].name))
    score_rows = [(p, s) for p, s in scored[:limit]]

    if not score_rows:
        return []

    place_ids = [place.id for place, _ in score_rows]

    meetings_30d = {
        pid: int(cnt)
        for pid, cnt in db.execute(
            select(MeetingEvent.place_id, func.count(MeetingEvent.id))
            .where(
                MeetingEvent.place_id.in_(place_ids),
                MeetingEvent.scheduled_at >= since_30d,
            )
            .group_by(MeetingEvent.place_id),
        ).all()
    }

    rating_rows = db.execute(
        select(
            MeetingEvent.place_id,
            func.avg(MeetingRating.rating),
        )
        .join(MeetingRating, MeetingRating.event_id == MeetingEvent.id)
        .where(MeetingEvent.place_id.in_(place_ids))
        .group_by(MeetingEvent.place_id),
    ).all()
    avg_by_place = {
        pid: round(float(avg), 1) if avg is not None else None
        for pid, avg in rating_rows
    }

    items: list[dict] = []
    for rank, (place, scores) in enumerate(score_rows, start=1):
        items.append(
            {
                "rank": rank,
                "place_id": place.id,
                "name": place.name,
                "meetup_signal": scores["meetup_signal"],
                "mention": scores["mention"],
                "review": scores["review"],
                "total": scores["total"],
                "total_meetings_30d": meetings_30d.get(place.id, 0),
                "avg_rating": avg_by_place.get(place.id),
            },
        )
    return items
