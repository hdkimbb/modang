"""Place neighborhood score from place_signals (F5)."""

from __future__ import annotations

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models.place_signal import PlaceSignal

VALID_SIGNAL_TYPES = frozenset({"selected", "rated", "mentioned"})


def _sum_weight(
    db: Session,
    place_id: str,
    signal_type: str,
) -> float:
    total = db.scalar(
        select(func.coalesce(func.sum(PlaceSignal.weight), 0.0)).where(
            PlaceSignal.place_id == place_id,
            PlaceSignal.signal_type == signal_type,
            PlaceSignal.is_void.is_(False),
        ),
    )
    return float(total or 0.0)


def calculate_place_score(db: Session, place_id: str) -> dict:
    """v1: total = sum(weight) per signal type (no time decay)."""
    selected = _sum_weight(db, place_id, "selected")
    rated = _sum_weight(db, place_id, "rated")
    mentioned = _sum_weight(db, place_id, "mentioned")
    total = round(selected + rated + mentioned, 1)

    parts = [
        ("selected", selected),
        ("rated", rated),
        ("mentioned", mentioned),
    ]
    if total > 0:
        share = {
            key: round(value / total * 100)
            for key, value in parts
        }
    else:
        share = {key: 0 for key, _ in parts}

    return {
        "total": total,
        "selected": round(selected, 1),
        "rated": round(rated, 1),
        "mentioned": round(mentioned, 1),
        "selected_share_pct": share["selected"],
        "rated_share_pct": share["rated"],
        "mentioned_share_pct": share["mentioned"],
    }


def score_breakdown_for_ranking(db: Session, place_id: str) -> dict:
    """Ranking card: meetup = selected + rated, mention = mentioned."""
    breakdown = calculate_place_score(db, place_id)
    meetup = round(breakdown["selected"] + breakdown["rated"], 1)
    return {
        "total": breakdown["total"],
        "meetup_signal": meetup,
        "mention": breakdown["mentioned"],
        "review": 0.0,
    }
