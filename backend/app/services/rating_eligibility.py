"""Shared rules for when a user may rate a meeting event."""

from __future__ import annotations

from datetime import datetime, timedelta, timezone

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.meeting_event import MeetingEvent
from app.models.meeting_member import MeetingMember
from app.models.meeting_rating import MeetingRating

KST = timezone(timedelta(hours=9))


def _now_kst() -> datetime:
    return datetime.now(timezone.utc).astimezone(KST)


def event_ended_threshold_utc() -> datetime:
    """scheduled_at before this (UTC) can be rated (KST now)."""
    return _now_kst().astimezone(timezone.utc)


def rating_window_start_utc() -> datetime:
    """Only events after this (UTC) are in the 7-day window (KST now - 7d)."""
    return (_now_kst() - timedelta(days=7)).astimezone(timezone.utc)


def _ensure_utc(dt: datetime) -> datetime:
    if dt.tzinfo is None:
        return dt.replace(tzinfo=timezone.utc)
    return dt


def is_event_ended_for_rating(event: MeetingEvent) -> bool:
    scheduled = _ensure_utc(event.scheduled_at)
    if event.status == "ended":
        return True
    return scheduled < event_ended_threshold_utc()


def is_within_rating_window(event: MeetingEvent) -> bool:
    scheduled = _ensure_utc(event.scheduled_at)
    return scheduled > rating_window_start_utc()


def user_is_meeting_member(db: Session, meeting_id: str, user_id: str) -> bool:
    member_id = db.scalar(
        select(MeetingMember.id).where(
            MeetingMember.meeting_id == meeting_id,
            MeetingMember.user_id == user_id,
        ),
    )
    return member_id is not None


def rated_event_ids_for_user(
    db: Session,
    user_id: str,
    event_ids: list[str],
) -> set[str]:
    if not event_ids:
        return set()
    rows = db.scalars(
        select(MeetingRating.event_id).where(
            MeetingRating.user_id == user_id,
            MeetingRating.event_id.in_(event_ids),
        ),
    ).all()
    return set(rows)


def rating_flags_for_event(
    event: MeetingEvent,
    *,
    user_id: str | None,
    is_member: bool,
    has_rated_by_me: bool,
) -> tuple[bool, bool]:
    """Return (has_rated_by_me, can_rate) for the given user and event."""
    if not user_id:
        return False, False
    has_rated = has_rated_by_me
    can_rate = (
        is_member
        and not has_rated
        and bool(event.place_id)
        and is_event_ended_for_rating(event)
        and is_within_rating_window(event)
    )
    return has_rated, can_rate
