"""Owner insights: rating stats and regular meetings."""

from __future__ import annotations

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models.meeting import Meeting
from app.models.meeting_event import MeetingEvent
from app.models.meeting_rating import MeetingRating
from app.models.place_signal import PlaceSignal
from app.schemas.owner import (
    OwnerRatingStatsResponse,
    OwnerRegularMeetingItem,
    OwnerRegularMeetingsResponse,
)
from app.services.owner_insights import category_display_label


def fetch_owner_rating_stats(db: Session, place_id: str) -> OwnerRatingStatsResponse:
    rows = db.execute(
        select(MeetingRating.rating, func.count(MeetingRating.id))
        .join(MeetingEvent, MeetingEvent.id == MeetingRating.event_id)
        .where(MeetingEvent.place_id == place_id)
        .group_by(MeetingRating.rating),
    ).all()

    distribution = {str(star): 0 for star in range(1, 6)}
    total_count = 0
    rating_sum = 0
    for rating_value, count in rows:
        star = int(rating_value)
        if 1 <= star <= 5:
            distribution[str(star)] = int(count)
            total_count += int(count)
            rating_sum += star * int(count)

    average = round(rating_sum / total_count, 1) if total_count else None
    return OwnerRatingStatsResponse(
        average=average,
        total_count=total_count,
        distribution=distribution,
    )


def fetch_owner_regular_meetings(
    db: Session,
    place_id: str,
    *,
    limit: int = 5,
) -> OwnerRegularMeetingsResponse:
    meeting_id_expr = PlaceSignal.meta["meeting_id"].as_string()
    rows = db.execute(
        select(
            Meeting.id,
            Meeting.name,
            Meeting.category,
            func.count(PlaceSignal.id).label("visit_count"),
        )
        .select_from(PlaceSignal)
        .join(Meeting, Meeting.id == meeting_id_expr)
        .where(
            PlaceSignal.place_id == place_id,
            PlaceSignal.signal_type == "selected",
            PlaceSignal.is_void.is_(False),
            meeting_id_expr.isnot(None),
        )
        .group_by(Meeting.id, Meeting.name, Meeting.category)
        .order_by(func.count(PlaceSignal.id).desc())
        .limit(limit),
    ).all()

    items = [
        OwnerRegularMeetingItem(
            meeting_id=meeting_id,
            title=name,
            category=category_display_label(category),
            visit_count=int(visit_count),
        )
        for meeting_id, name, category, visit_count in rows
    ]
    return OwnerRegularMeetingsResponse(items=items)
