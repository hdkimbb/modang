"""Pending post-visit ratings for a user (option B: exclude existing meeting_ratings)."""

from __future__ import annotations

from datetime import timezone

from sqlalchemy import exists, select
from sqlalchemy.orm import Session

from app.models.meeting import Meeting
from app.models.meeting_event import MeetingEvent
from app.models.meeting_member import MeetingMember
from app.models.meeting_rating import MeetingRating
from app.models.place import Place
from app.schemas.pending_rating import PendingRatingItem
from app.services.rating_eligibility import (
    event_ended_threshold_utc,
    rating_window_start_utc,
)


def fetch_pending_ratings(db: Session, user_id: str) -> list[PendingRatingItem]:
    ended_before = event_ended_threshold_utc()
    window_start = rating_window_start_utc()

    already_rated = exists(
        select(MeetingRating.id).where(
            MeetingRating.event_id == MeetingEvent.id,
            MeetingRating.user_id == user_id,
        ),
    )

    rows = db.execute(
        select(MeetingEvent, Meeting, Place)
        .join(Meeting, Meeting.id == MeetingEvent.meeting_id)
        .join(Place, Place.id == MeetingEvent.place_id)
        .join(MeetingMember, MeetingMember.meeting_id == MeetingEvent.meeting_id)
        .where(
            MeetingMember.user_id == user_id,
            MeetingEvent.scheduled_at < ended_before,
            MeetingEvent.scheduled_at > window_start,
            ~already_rated,
        )
        .order_by(MeetingEvent.scheduled_at.desc()),
    ).all()

    items: list[PendingRatingItem] = []
    for event, meeting, place in rows:
        scheduled = event.scheduled_at
        if scheduled.tzinfo is None:
            scheduled = scheduled.replace(tzinfo=timezone.utc)
        items.append(
            PendingRatingItem(
                event_id=event.id,
                meeting_id=meeting.id,
                meeting_title=meeting.name,
                event_title=event.title,
                place_id=place.id,
                place_name=place.name,
                place_category=place.category,
                scheduled_at=scheduled,
                ended_at_calculated=scheduled,
            ),
        )
    return items
