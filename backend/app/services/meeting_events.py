"""Meeting event list enrichment."""

from __future__ import annotations

from datetime import datetime, timezone

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models.meeting_event import MeetingEvent
from app.models.meeting_rating import MeetingRating
from app.models.place import Place
from app.schemas.meeting import (
    MeetingEventPlaceSummary,
    MeetingEventSummary,
)
from app.services.rating_eligibility import (
    rated_event_ids_for_user,
    rating_flags_for_event,
    user_is_meeting_member,
)


def _rating_stats_for_events(
    db: Session,
    event_ids: list[str],
) -> dict[str, tuple[float | None, int]]:
    if not event_ids:
        return {}
    rows = db.execute(
        select(
            MeetingRating.event_id,
            func.avg(MeetingRating.rating),
            func.count(MeetingRating.id),
        )
        .where(MeetingRating.event_id.in_(event_ids))
        .group_by(MeetingRating.event_id),
    ).all()
    return {
        event_id: (
            round(float(avg), 1) if avg is not None else None,
            int(cnt),
        )
        for event_id, avg, cnt in rows
    }


def event_rows_to_summaries(
    db: Session,
    rows: list[tuple[MeetingEvent, Place]],
    *,
    meeting_id: str | None = None,
    user_id: str | None = None,
) -> list[MeetingEventSummary]:
    event_ids = [event.id for event, _ in rows]
    rating_map = _rating_stats_for_events(db, event_ids)
    rated_by_me: set[str] = set()
    is_member = False
    if user_id and meeting_id:
        is_member = user_is_meeting_member(db, meeting_id, user_id)
        rated_by_me = rated_event_ids_for_user(db, user_id, event_ids)

    items: list[MeetingEventSummary] = []
    for event, place in rows:
        avg_rating, rating_count = rating_map.get(event.id, (None, 0))
        has_rated = event.id in rated_by_me
        has_rated_by_me, can_rate = rating_flags_for_event(
            event,
            user_id=user_id,
            is_member=is_member,
            has_rated_by_me=has_rated,
        )
        items.append(
            MeetingEventSummary(
                event_id=event.id,
                title=event.title,
                scheduled_at=event.scheduled_at,
                status=event.status,
                attendee_count=event.attendee_count,
                place=MeetingEventPlaceSummary(
                    place_id=place.id,
                    name=place.name,
                ),
                avg_rating=avg_rating,
                rating_count=rating_count,
                has_rated_by_me=has_rated_by_me,
                can_rate=can_rate,
            ),
        )
    return items


def fetch_meeting_event_rows(
    db: Session,
    meeting_id: str,
    *,
    upcoming_only: bool = False,
    limit: int | None = None,
) -> list[tuple[MeetingEvent, Place]]:
    now = datetime.now(timezone.utc)
    stmt = (
        select(MeetingEvent, Place)
        .join(Place, Place.id == MeetingEvent.place_id)
        .where(MeetingEvent.meeting_id == meeting_id)
    )
    if upcoming_only:
        stmt = stmt.where(
            MeetingEvent.status == "scheduled",
            MeetingEvent.scheduled_at >= now,
        ).order_by(MeetingEvent.scheduled_at.asc())
    else:
        stmt = stmt.order_by(MeetingEvent.scheduled_at.desc())

    if limit is not None:
        stmt = stmt.limit(limit)
    return list(db.execute(stmt).all())
