"""Meeting event rating routes."""

from __future__ import annotations

from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.db import get_db
from app.models.meeting_event import MeetingEvent
from app.models.meeting_rating import MeetingRating
from app.models.place_signal import PlaceSignal
from app.schemas.rating import (
    EventRatingsListResponse,
    RatingCreateRequest,
    RatingResponse,
)
from app.services.id import generate_id
from app.services.pending_ratings import _event_ended_threshold_utc

router = APIRouter(prefix="/api/v1/events", tags=["ratings"])


def _error(status_code: int, code: str, message: str) -> HTTPException:
    return HTTPException(
        status_code=status_code,
        detail={"error": {"code": code, "message": message, "details": {}}},
    )


def _to_rating_response(row: MeetingRating) -> RatingResponse:
    return RatingResponse(
        id=row.id,
        event_id=row.event_id,
        user_id=row.user_id,
        rating=row.rating,
        would_revisit=row.would_revisit,
        created_at=row.created_at,
    )


@router.post(
    "/{event_id}/ratings",
    response_model=RatingResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_event_rating(
    event_id: str,
    body: RatingCreateRequest,
    db: Session = Depends(get_db),
) -> RatingResponse:
    event = db.get(MeetingEvent, event_id)
    if event is None:
        raise _error(
            status.HTTP_404_NOT_FOUND,
            "event_not_found",
            "일정을 찾을 수 없어요.",
        )
    scheduled = event.scheduled_at
    if scheduled.tzinfo is None:
        scheduled = scheduled.replace(tzinfo=timezone.utc)
    ended_by_time = scheduled < _event_ended_threshold_utc()
    if event.status != "ended" and not ended_by_time:
        raise _error(
            status.HTTP_400_BAD_REQUEST,
            "event_not_ended",
            "아직 종료되지 않은 모임이에요.",
        )

    existing = db.scalar(
        select(MeetingRating.id).where(
            MeetingRating.event_id == event_id,
            MeetingRating.user_id == body.user_id,
        ),
    )
    if existing is not None:
        raise _error(
            status.HTTP_400_BAD_REQUEST,
            "already_rated",
            "이미 평가하셨어요.",
        )

    now = datetime.now(timezone.utc)
    rating_id = generate_id("rtg")
    signal_id = generate_id("sig")

    rating_row = MeetingRating(
        id=rating_id,
        event_id=event_id,
        user_id=body.user_id,
        rating=body.rating,
        would_revisit=body.would_revisit,
    )
    signal = PlaceSignal(
        id=signal_id,
        place_id=event.place_id,
        signal_type="rated",
        weight=float(body.rating),
        source_ref=event_id,
        user_id=body.user_id,
        occurred_at=now,
        is_void=False,
        meta={"event_id": event_id, "rating": body.rating},
    )

    event.rating_dispatched_at = now

    try:
        db.add(rating_row)
        db.add(signal)
        db.commit()
        db.refresh(rating_row)
    except Exception:
        db.rollback()
        raise

    return _to_rating_response(rating_row)


@router.get("/{event_id}/ratings", response_model=EventRatingsListResponse)
def list_event_ratings(
    event_id: str,
    db: Session = Depends(get_db),
) -> EventRatingsListResponse:
    event = db.get(MeetingEvent, event_id)
    if event is None:
        raise _error(
            status.HTTP_404_NOT_FOUND,
            "event_not_found",
            "일정을 찾을 수 없어요.",
        )

    rows = db.scalars(
        select(MeetingRating)
        .where(MeetingRating.event_id == event_id)
        .order_by(MeetingRating.created_at.desc()),
    ).all()

    ratings = [_to_rating_response(row) for row in rows]
    if not ratings:
        return EventRatingsListResponse(ratings=[], avg_rating=None, would_revisit_rate=None)

    avg_rating = sum(r.rating for r in ratings) / len(ratings)
    revisit_rate = sum(1 for r in ratings if r.would_revisit) / len(ratings)

    return EventRatingsListResponse(
        ratings=ratings,
        avg_rating=round(avg_rating, 1),
        would_revisit_rate=round(revisit_rate, 2),
    )
