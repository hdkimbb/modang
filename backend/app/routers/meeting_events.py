"""Meeting event routes."""

from __future__ import annotations

from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.db import get_db
from app.models.meeting import Meeting
from app.models.meeting_event import MeetingEvent
from app.models.place import Place
from app.models.place_signal import PlaceSignal
from app.schemas.meeting import MeetingEventsListResponse
from app.schemas.meeting_event import EventCreateRequest, EventResponse
from app.services.id import generate_id
from app.services.meeting_events import (
    event_rows_to_summaries,
    fetch_meeting_event_rows,
)

router = APIRouter(prefix="/api/v1/meetings", tags=["meeting-events"])

DEFAULT_USER_ID = "u_001"


def _error(status_code: int, code: str, message: str) -> HTTPException:
    return HTTPException(
        status_code=status_code,
        detail={"error": {"code": code, "message": message, "details": {}}},
    )


@router.get("/{meeting_id}/events", response_model=MeetingEventsListResponse)
def list_meeting_events(
    meeting_id: str,
    user_id: str = Query(
        default=DEFAULT_USER_ID,
        min_length=1,
        max_length=32,
        description="Dev stub until auth",
    ),
    db: Session = Depends(get_db),
) -> MeetingEventsListResponse:
    meeting = db.get(Meeting, meeting_id)
    if meeting is None:
        raise _error(
            status.HTTP_404_NOT_FOUND,
            "meeting_not_found",
            "모임을 찾을 수 없어요.",
        )
    rows = fetch_meeting_event_rows(db, meeting_id)
    return MeetingEventsListResponse(
        items=event_rows_to_summaries(
            db,
            rows,
            meeting_id=meeting_id,
            user_id=user_id.strip(),
        ),
    )


@router.post(
    "/{meeting_id}/events",
    response_model=EventResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_meeting_event(
    meeting_id: str,
    body: EventCreateRequest,
    db: Session = Depends(get_db),
) -> EventResponse:
    if not body.place_id or not body.place_id.strip():
        raise _error(
            status.HTTP_400_BAD_REQUEST,
            "place_required",
            "장소를 선택해야 모임 일정을 등록할 수 있어요.",
        )

    meeting = db.get(Meeting, meeting_id)
    if meeting is None:
        raise _error(
            status.HTTP_404_NOT_FOUND,
            "meeting_not_found",
            "모임을 찾을 수 없어요.",
        )

    place = db.get(Place, body.place_id)
    if place is None:
        raise _error(
            status.HTTP_400_BAD_REQUEST,
            "place_not_found",
            "등록된 장소를 찾을 수 없어요. 장소를 먼저 선택해 주세요.",
        )

    now = datetime.now(timezone.utc)
    scheduled_at = body.scheduled_at
    if scheduled_at.tzinfo is None:
        scheduled_at = scheduled_at.replace(tzinfo=timezone.utc)
    else:
        scheduled_at = scheduled_at.astimezone(timezone.utc)

    if scheduled_at <= now:
        raise _error(
            status.HTTP_400_BAD_REQUEST,
            "invalid_scheduled_at",
            "모임 일정은 현재 시각 이후로만 등록할 수 있어요.",
        )

    event_id = generate_id("evt")
    signal_id = generate_id("sig")

    event = MeetingEvent(
        id=event_id,
        meeting_id=meeting_id,
        place_id=body.place_id,
        title=body.title,
        scheduled_at=scheduled_at,
        attendee_count=body.attendee_count,
        status="scheduled",
    )

    signal = PlaceSignal(
        id=signal_id,
        place_id=body.place_id,
        signal_type="selected",
        weight=1.0,
        source_ref=event_id,
        user_id=meeting.host_user_id,
        occurred_at=now,
        is_void=False,
        meta={
            "meeting_id": meeting_id,
            "category": meeting.category,
            "district": meeting.district,
        },
    )

    try:
        db.add(event)
        db.add(signal)
        db.commit()
        db.refresh(event)
    except Exception:
        db.rollback()
        raise

    return EventResponse(
        event_id=event.id,
        meeting_id=event.meeting_id,
        place_id=event.place_id,
        title=event.title,
        scheduled_at=event.scheduled_at,
        attendee_count=event.attendee_count,
        status=event.status,
        created_at=event.created_at,
        signal_id=signal_id,
    )
