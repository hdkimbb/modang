"""Place visit and rating aggregates for search and detail."""

from __future__ import annotations

from collections import defaultdict

from sqlalchemy import case, func, select
from sqlalchemy.orm import Session

from app.models.meeting_event import MeetingEvent
from app.models.meeting_rating import MeetingRating
from app.models.place_signal import PlaceSignal


def _empty_stats() -> dict:
    return {
        "meeting_count": 0,
        "rating_count": 0,
        "avg_rating": None,
        "would_revisit_rate": None,
    }


def fetch_place_stats_map(db: Session) -> dict[str, dict]:
    result: dict[str, dict] = defaultdict(_empty_stats)

    visit_rows = db.execute(
        select(MeetingEvent.place_id, func.count(MeetingEvent.id))
        .group_by(MeetingEvent.place_id),
    ).all()
    for place_id, count in visit_rows:
        result[place_id]["meeting_count"] = int(count)

    signal_rows = db.execute(
        select(PlaceSignal.place_id, func.count())
        .where(
            PlaceSignal.is_void.is_(False),
            PlaceSignal.signal_type == "selected",
        )
        .group_by(PlaceSignal.place_id),
    ).all()
    for place_id, count in signal_rows:
        if result[place_id]["meeting_count"] == 0:
            result[place_id]["meeting_count"] = int(count)

    revisit_score = case(
        (MeetingRating.would_revisit.is_(True), 1.0),
        else_=0.0,
    )
    rating_rows = db.execute(
        select(
            MeetingEvent.place_id,
            func.count(MeetingRating.id),
            func.avg(MeetingRating.rating),
            func.avg(revisit_score),
        )
        .join(MeetingEvent, MeetingEvent.id == MeetingRating.event_id)
        .group_by(MeetingEvent.place_id),
    ).all()
    for place_id, rating_count, avg_rating, revisit_rate in rating_rows:
        result[place_id]["rating_count"] = int(rating_count)
        result[place_id]["avg_rating"] = (
            float(avg_rating) if avg_rating is not None else None
        )
        result[place_id]["would_revisit_rate"] = (
            float(revisit_rate) if revisit_rate is not None else None
        )

    return dict(result)


def stats_for_place(db: Session, place_id: str) -> dict:
    stats_map = fetch_place_stats_map(db)
    return stats_map.get(place_id, _empty_stats())
