"""Pending post-visit ratings for a user (option B: exclude existing meeting_ratings)."""

from __future__ import annotations

from datetime import datetime, timedelta, timezone

from sqlalchemy import exists, select
from sqlalchemy.orm import Session

from app.models.meeting import Meeting
from app.models.meeting_event import MeetingEvent
from app.models.meeting_member import MeetingMember
from app.models.meeting_rating import MeetingRating
from app.models.place import Place
from app.schemas.pending_rating import PendingRatingItem

KST = timezone(timedelta(hours=9))
EVENT_DURATION_HOURS = 2


def _now_kst() -> datetime:
    return datetime.now(timezone.utc).astimezone(KST)


def _event_ended_threshold_utc() -> datetime:
    """scheduled_at before this (UTC) counts as ended (KST now - 2h)."""
    return (_now_kst() - timedelta(hours=EVENT_DURATION_HOURS)).astimezone(
        timezone.utc,
    )


def _window_start_utc() -> datetime:
    """Only events after this (UTC) are in the 7-day window (KST now - 7d)."""
    return (_now_kst() - timedelta(days=7)).astimezone(timezone.utc)


def fetch_pending_ratings(db: Session, user_id: str) -> list[PendingRatingItem]:
    ended_before = _event_ended_threshold_utc()
    window_start = _window_start_utc()
    duration = timedelta(hours=EVENT_DURATION_HOURS)

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
        ended_at = scheduled + duration
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
                ended_at_calculated=ended_at,
            ),
        )
    return items
