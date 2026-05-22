"""Meeting create and list routes."""

from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.db import get_db
from app.models.meeting import Meeting
from app.models.meeting_event import MeetingEvent
from app.models.meeting_member import MeetingMember
from app.models.meeting_post import MeetingPost
from app.models.meeting_rating import MeetingRating
from app.models.place import Place
from app.models.user import User
from app.schemas.meeting import (
    ALLOWED_MEETING_CATEGORIES,
    MeetingCreateRequest,
    MeetingDetailResponse,
    MeetingHostSummary,
    MeetingListResponse,
    MeetingMemberItem,
    MeetingPlaceHistoryResponse,
    MeetingResponse,
    PlaceHistoryItem,
    PlaceHistoryPlaceSummary,
)
from app.services.meeting_events import (
    event_rows_to_summaries,
    fetch_meeting_event_rows,
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


def _resolve_host_user_id(db: Session, requested: str | None) -> str:
    host_id = (requested or DEFAULT_HOST_USER_ID).strip()
    user = db.get(User, host_id)
    if user is None:
        raise _error(
            status.HTTP_400_BAD_REQUEST,
            "user_not_found",
            "사용자를 찾을 수 없어요.",
        )
    if user.role == "owner":
        raise _error(
            status.HTTP_400_BAD_REQUEST,
            "invalid_host",
            "사장 계정으로는 모임을 만들 수 없어요. 일반 멤버로 전환해 주세요.",
        )
    return host_id


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


def _get_meeting_or_404(db: Session, meeting_id: str) -> Meeting:
    meeting = db.get(Meeting, meeting_id)
    if meeting is None:
        raise _error(
            status.HTTP_404_NOT_FOUND,
            "meeting_not_found",
            "모임을 찾을 수 없어요.",
        )
    return meeting


@router.get("", response_model=MeetingListResponse)
def list_meetings(db: Session = Depends(get_db)) -> MeetingListResponse:
    stmt = select(Meeting).order_by(Meeting.created_at.desc())
    meetings = db.scalars(stmt).all()
    return MeetingListResponse(items=[_to_response(m) for m in meetings])


@router.get("/{meeting_id}", response_model=MeetingDetailResponse)
def get_meeting(
    meeting_id: str,
    db: Session = Depends(get_db),
) -> MeetingDetailResponse:
    meeting = _get_meeting_or_404(db, meeting_id)

    member_rows = db.execute(
        select(MeetingMember, User)
        .join(User, User.id == MeetingMember.user_id)
        .where(MeetingMember.meeting_id == meeting_id)
        .order_by(MeetingMember.joined_at.asc()),
    ).all()
    members = [
        MeetingMemberItem(user_id=user.id, name=user.name, role=member.role)
        for member, user in member_rows
    ]

    upcoming_rows = fetch_meeting_event_rows(
        db,
        meeting_id,
        upcoming_only=True,
        limit=5,
    )
    upcoming_events = event_rows_to_summaries(db, upcoming_rows)

    host_user = db.get(User, meeting.host_user_id)
    post_count = (
        db.scalar(
            select(func.count())
            .select_from(MeetingPost)
            .where(MeetingPost.meeting_id == meeting_id),
        )
        or 0
    )
    event_count = (
        db.scalar(
            select(func.count())
            .select_from(MeetingEvent)
            .where(
                MeetingEvent.meeting_id == meeting_id,
                MeetingEvent.status == "scheduled",
            ),
        )
        or 0
    )

    return MeetingDetailResponse(
        id=meeting.id,
        name=meeting.name,
        category=meeting.category,
        neighborhood=meeting.district,
        activity_range=meeting.activity_range,
        description=meeting.description,
        member_count=meeting.member_count,
        created_at=meeting.created_at,
        host=MeetingHostSummary(
            user_id=meeting.host_user_id,
            name=host_user.name if host_user else "",
            avatar_url=host_user.avatar_url if host_user else None,
        ),
        post_count=int(post_count),
        event_count=int(event_count),
        members=members,
        upcoming_events=upcoming_events,
    )


@router.get("/{meeting_id}/place_history", response_model=MeetingPlaceHistoryResponse)
def meeting_place_history(
    meeting_id: str,
    db: Session = Depends(get_db),
) -> MeetingPlaceHistoryResponse:
    _get_meeting_or_404(db, meeting_id)

    visit_rows = db.execute(
        select(
            Place.id,
            Place.name,
            func.count(MeetingEvent.id),
            func.max(MeetingEvent.scheduled_at),
        )
        .join(Place, Place.id == MeetingEvent.place_id)
        .where(MeetingEvent.meeting_id == meeting_id)
        .group_by(Place.id, Place.name)
        .order_by(func.max(MeetingEvent.scheduled_at).desc()),
    ).all()

    place_ids = [row[0] for row in visit_rows]
    rating_by_place: dict[str, float | None] = {}
    if place_ids:
        rating_rows = db.execute(
            select(
                MeetingEvent.place_id,
                func.avg(MeetingRating.rating),
            )
            .join(MeetingRating, MeetingRating.event_id == MeetingEvent.id)
            .where(MeetingEvent.meeting_id == meeting_id)
            .group_by(MeetingEvent.place_id),
        ).all()
        rating_by_place = {
            pid: round(float(avg), 1) if avg is not None else None
            for pid, avg in rating_rows
        }

    items = [
        PlaceHistoryItem(
            place=PlaceHistoryPlaceSummary(place_id=pid, name=name),
            visit_count=int(cnt),
            last_visited_at=last_at,
            avg_rating_from_us=rating_by_place.get(pid),
        )
        for pid, name, cnt, last_at in visit_rows
    ]
    return MeetingPlaceHistoryResponse(items=items)


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

    host_user_id = _resolve_host_user_id(db, body.host_user_id)
    meeting_id = generate_id("mtg")
    member_id = generate_id("mm")
    description = body.description.strip() or None

    meeting = Meeting(
        id=meeting_id,
        host_user_id=host_user_id,
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
        user_id=host_user_id,
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
