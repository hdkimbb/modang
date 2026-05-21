"""Meeting create and list routes."""

from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db import get_db
from app.models.meeting import Meeting
from app.models.meeting_member import MeetingMember
from app.schemas.meeting import (
    ALLOWED_MEETING_CATEGORIES,
    MeetingCreateRequest,
    MeetingListResponse,
    MeetingResponse,
)
from app.services.id import generate_id

# Dev stub host until auth (matches seed user 민지)
DEFAULT_HOST_USER_ID = "u_001"

router = APIRouter(prefix="/api/v1/meetings", tags=["meetings"])


def _error(status_code: int, code: str, message: str) -> HTTPException:
    return HTTPException(
        status_code=status_code,
        detail={"error": {"code": code, "message": message, "details": {}}},
    )


def _to_response(meeting: Meeting) -> MeetingResponse:
    return MeetingResponse(
        id=meeting.id,
        name=meeting.name,
        category=meeting.category,
        neighborhood=meeting.district,
        activity_range=meeting.activity_range,
        description=meeting.description,
        member_count=meeting.member_count,
        created_at=meeting.created_at,
    )


@router.get("", response_model=MeetingListResponse)
def list_meetings(db: Session = Depends(get_db)) -> MeetingListResponse:
    stmt = select(Meeting).order_by(Meeting.created_at.desc())
    meetings = db.scalars(stmt).all()
    return MeetingListResponse(items=[_to_response(m) for m in meetings])


@router.post("", response_model=MeetingResponse, status_code=status.HTTP_201_CREATED)
def create_meeting(
    body: MeetingCreateRequest,
    db: Session = Depends(get_db),
) -> MeetingResponse:
    if body.category not in ALLOWED_MEETING_CATEGORIES:
        raise _error(
            status.HTTP_400_BAD_REQUEST,
            "invalid_category",
            "카테고리를 선택해 주세요.",
        )

    meeting_id = generate_id("mtg")
    member_id = generate_id("mm")
    description = body.description.strip() or None

    meeting = Meeting(
        id=meeting_id,
        host_user_id=DEFAULT_HOST_USER_ID,
        name=body.name.strip(),
        category=body.category,
        district=body.neighborhood.strip(),
        activity_range=body.activity_range,
        description=description,
        member_count=1,
    )
    member = MeetingMember(
        id=member_id,
        meeting_id=meeting_id,
        user_id=DEFAULT_HOST_USER_ID,
        role="host",
    )

    try:
        db.add(meeting)
        db.add(member)
        db.commit()
        db.refresh(meeting)
    except Exception:
        db.rollback()
        raise

    return _to_response(meeting)
