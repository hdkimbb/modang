"""Owner (business) dashboard routes."""

from __future__ import annotations

from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import delete, func, or_, select
from sqlalchemy.orm import Session

from app.db import get_db
from app.models.meeting import Meeting
from app.models.meeting_event import MeetingEvent
from app.models.place import Place
from app.models.place_recommendation_target import PlaceRecommendationTarget
from app.models.place_signal import PlaceSignal
from app.models.user import User
from app.schemas.owner import (
    OwnerCategoryInsight,
    OwnerDashboardResponse,
    OwnerDashboardStats,
    OwnerInsightsResponse,
    OwnerMeetingVisit,
    OwnerMessageResponse,
    OwnerMessageUpdateRequest,
    OwnerPlaceSummary,
    OwnerRecommendationTargetsResponse,
    OwnerRecommendationTargetsUpdateRequest,
    OwnerTimeslotInsightsResponse,
    RecommendedAction,
    TimeslotInsight,
)
from app.services.id import generate_id
from app.services.owner_insights import (
    OWNER_RECOMMENDATION_CATEGORIES,
    category_display_label,
    recommended_action_for_category,
)
from app.services.owner_timeslots import (
    TIMESLOT_LABELS,
    TIMESLOT_ORDER,
    classify_timeslot,
    peak_recommendation_for_slot,
)

router = APIRouter(prefix="/api/v1/owner", tags=["owner"])


def _error(status_code: int, code: str, message: str) -> HTTPException:
    return HTTPException(
        status_code=status_code,
        detail={"error": {"code": code, "message": message, "details": {}}},
    )


def _require_owner(db: Session, user_id: str) -> tuple[User, Place]:
    user = db.get(User, user_id)
    if user is None:
        raise _error(
            status.HTTP_404_NOT_FOUND,
            "user_not_found",
            "사용자를 찾을 수 없어요.",
        )
    if user.role != "owner":
        raise _error(
            status.HTTP_403_FORBIDDEN,
            "not_owner",
            "업체 사장만 이용할 수 있어요.",
        )
    if not user.owned_place_id:
        raise _error(
            status.HTTP_400_BAD_REQUEST,
            "no_owned_place",
            "연결된 가게 정보가 없어요.",
        )

    place = db.get(Place, user.owned_place_id)
    if place is None:
        raise _error(
            status.HTTP_404_NOT_FOUND,
            "place_not_found",
            "가게 정보를 찾을 수 없어요.",
        )
    return user, place


def _month_bounds(now: datetime) -> tuple[datetime, datetime]:
    start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    if now.month == 12:
        end = start.replace(year=now.year + 1, month=1)
    else:
        end = start.replace(month=now.month + 1)
    return start, end


def _count_signals_for_meeting(
    db: Session,
    place_id: str,
    meeting_id: str,
    event_ids: list[str],
) -> int:
    conditions = [PlaceSignal.meta["meeting_id"].as_string() == meeting_id]
    if event_ids:
        conditions.append(PlaceSignal.source_ref.in_(event_ids))

    stmt = (
        select(func.count())
        .select_from(PlaceSignal)
        .where(
            PlaceSignal.place_id == place_id,
            PlaceSignal.is_void.is_(False),
            or_(*conditions),
        )
    )
    return db.scalar(stmt) or 0


@router.get("/dashboard", response_model=OwnerDashboardResponse)
def get_owner_dashboard(
    user_id: str = Query(..., min_length=1),
    db: Session = Depends(get_db),
) -> OwnerDashboardResponse:
    _, place = _require_owner(db, user_id)
    place_id = place.id
    now = datetime.now(timezone.utc)
    month_start, month_end = _month_bounds(now)

    events = db.scalars(
        select(MeetingEvent)
        .where(MeetingEvent.place_id == place_id)
        .order_by(MeetingEvent.scheduled_at.desc())
        .limit(20),
    ).all()

    total_visits = (
        db.scalar(
            select(func.count())
            .select_from(MeetingEvent)
            .where(MeetingEvent.place_id == place_id),
        )
        or 0
    )

    this_month_visits = (
        db.scalar(
            select(func.count())
            .select_from(MeetingEvent)
            .where(
                MeetingEvent.place_id == place_id,
                MeetingEvent.scheduled_at >= month_start,
                MeetingEvent.scheduled_at < month_end,
            ),
        )
        or 0
    )

    upcoming_count = (
        db.scalar(
            select(func.count())
            .select_from(MeetingEvent)
            .where(
                MeetingEvent.place_id == place_id,
                MeetingEvent.scheduled_at >= now,
            ),
        )
        or 0
    )

    meeting_ids = {e.meeting_id for e in events}
    meetings_by_id: dict[str, Meeting] = {}
    if meeting_ids:
        rows = db.scalars(
            select(Meeting).where(Meeting.id.in_(meeting_ids)),
        ).all()
        meetings_by_id = {m.id: m for m in rows}

    event_ids_by_meeting: dict[str, list[str]] = {}
    for event in events:
        event_ids_by_meeting.setdefault(event.meeting_id, []).append(event.id)

    visit_rows: list[OwnerMeetingVisit] = []
    for event in events:
        meeting = meetings_by_id.get(event.meeting_id)
        if meeting is None:
            continue

        scheduled = event.scheduled_at
        if scheduled.tzinfo is None:
            scheduled = scheduled.replace(tzinfo=timezone.utc)

        visit_rows.append(
            OwnerMeetingVisit(
                meeting_id=meeting.id,
                name=meeting.name,
                category=meeting.category,
                member_count=meeting.member_count,
                scheduled_at=scheduled,
                is_upcoming=scheduled >= now,
                place_signal_count=_count_signals_for_meeting(
                    db,
                    place_id,
                    meeting.id,
                    event_ids_by_meeting.get(meeting.id, []),
                ),
            ),
        )

    return OwnerDashboardResponse(
        place=OwnerPlaceSummary(
            id=place.id,
            name=place.name,
            address=place.address,
        ),
        stats=OwnerDashboardStats(
            total_visits=total_visits,
            this_month_visits=this_month_visits,
            upcoming_count=upcoming_count,
        ),
        meetings=visit_rows,
    )


@router.get("/insights/categories", response_model=OwnerInsightsResponse)
def get_owner_category_insights(
    user_id: str = Query(..., min_length=1),
    db: Session = Depends(get_db),
) -> OwnerInsightsResponse:
    _, place = _require_owner(db, user_id)
    place_id = place.id

    total_meetings = (
        db.scalar(
            select(func.count())
            .select_from(MeetingEvent)
            .where(MeetingEvent.place_id == place_id),
        )
        or 0
    )

    if total_meetings == 0:
        return OwnerInsightsResponse(total_meetings=0, top_categories=[])

    rows = db.execute(
        select(
            Meeting.category,
            func.count(MeetingEvent.id).label("visit_count"),
            func.avg(Meeting.member_count).label("avg_members"),
        )
        .join(Meeting, Meeting.id == MeetingEvent.meeting_id)
        .where(MeetingEvent.place_id == place_id)
        .group_by(Meeting.category)
        .order_by(func.count(MeetingEvent.id).desc())
        .limit(3),
    ).all()

    top_categories: list[OwnerCategoryInsight] = []
    for raw_category, visit_count, avg_members in rows:
        display = category_display_label(raw_category)
        count = int(visit_count)
        percentage = round(count / total_meetings * 100) if total_meetings else 0
        action_data = recommended_action_for_category(display)
        top_categories.append(
            OwnerCategoryInsight(
                category=display,
                count=count,
                percentage=percentage,
                avg_member_count=round(float(avg_members or 0)),
                recommended_action=RecommendedAction(**action_data),
            ),
        )

    return OwnerInsightsResponse(
        total_meetings=total_meetings,
        top_categories=top_categories,
    )


@router.get("/message", response_model=OwnerMessageResponse)
def get_owner_message(
    user_id: str = Query(..., min_length=1),
    db: Session = Depends(get_db),
) -> OwnerMessageResponse:
    _, place = _require_owner(db, user_id)
    return OwnerMessageResponse(
        message=place.owner_message or "",
        active=bool(place.owner_message_active),
    )


@router.patch("/message", response_model=OwnerMessageResponse)
def update_owner_message(
    body: OwnerMessageUpdateRequest,
    user_id: str = Query(..., min_length=1),
    db: Session = Depends(get_db),
) -> OwnerMessageResponse:
    _, place = _require_owner(db, user_id)

    message = body.message.strip()
    if len(message) > 100:
        raise _error(
            status.HTTP_400_BAD_REQUEST,
            "message_too_long",
            "메시지는 100자 이내로 작성해 주세요.",
        )

    if body.active and not message:
        raise _error(
            status.HTTP_400_BAD_REQUEST,
            "message_required",
            "노출하려면 메시지를 입력해 주세요.",
        )

    place.owner_message = message or None
    place.owner_message_active = body.active

    try:
        db.commit()
        db.refresh(place)
    except Exception:
        db.rollback()
        raise

    return OwnerMessageResponse(
        message=place.owner_message or "",
        active=bool(place.owner_message_active),
    )


@router.get("/insights/timeslots", response_model=OwnerTimeslotInsightsResponse)
def get_owner_timeslot_insights(
    user_id: str = Query(..., min_length=1),
    db: Session = Depends(get_db),
) -> OwnerTimeslotInsightsResponse:
    _, place = _require_owner(db, user_id)

    events = db.scalars(
        select(MeetingEvent.scheduled_at).where(
            MeetingEvent.place_id == place.id,
        ),
    ).all()

    total_events = len(events)
    if total_events == 0:
        return OwnerTimeslotInsightsResponse(
            total_events=0,
            slots=[],
            peak_slot=None,
            low_slot=None,
            peak_recommendation="",
        )

    counts = {key: 0 for key in TIMESLOT_ORDER}
    for scheduled_at in events:
        slot_key = classify_timeslot(scheduled_at)
        if slot_key is not None:
            counts[slot_key] += 1

    slots = [
        TimeslotInsight(
            key=key,
            label=TIMESLOT_LABELS[key],
            count=counts[key],
            percentage=round(counts[key] / total_events * 100),
        )
        for key in TIMESLOT_ORDER
    ]
    slots.sort(key=lambda s: s.count, reverse=True)

    peak_slot = max(TIMESLOT_ORDER, key=lambda k: counts[k])
    low_slot = min(TIMESLOT_ORDER, key=lambda k: counts[k])

    return OwnerTimeslotInsightsResponse(
        total_events=total_events,
        slots=slots,
        peak_slot=peak_slot,
        low_slot=low_slot,
        peak_recommendation=peak_recommendation_for_slot(peak_slot),
    )


@router.get(
    "/recommendation-targets",
    response_model=OwnerRecommendationTargetsResponse,
)
def get_recommendation_targets(
    user_id: str = Query(..., min_length=1),
    db: Session = Depends(get_db),
) -> OwnerRecommendationTargetsResponse:
    _, place = _require_owner(db, user_id)
    rows = db.scalars(
        select(PlaceRecommendationTarget.category)
        .where(PlaceRecommendationTarget.place_id == place.id)
        .order_by(PlaceRecommendationTarget.created_at),
    ).all()
    return OwnerRecommendationTargetsResponse(categories=list(rows))


@router.patch(
    "/recommendation-targets",
    response_model=OwnerRecommendationTargetsResponse,
)
def update_recommendation_targets(
    body: OwnerRecommendationTargetsUpdateRequest,
    user_id: str = Query(..., min_length=1),
    db: Session = Depends(get_db),
) -> OwnerRecommendationTargetsResponse:
    _, place = _require_owner(db, user_id)

    categories = list(dict.fromkeys(c.strip() for c in body.categories if c.strip()))

    if len(categories) > 3:
        raise _error(
            status.HTTP_400_BAD_REQUEST,
            "too_many_categories",
            "최대 3개까지 선택할 수 있어요.",
        )

    invalid = [c for c in categories if c not in OWNER_RECOMMENDATION_CATEGORIES]
    if invalid:
        raise _error(
            status.HTTP_400_BAD_REQUEST,
            "invalid_category",
            "선택할 수 없는 카테고리가 포함되어 있어요.",
        )

    db.execute(
        delete(PlaceRecommendationTarget).where(
            PlaceRecommendationTarget.place_id == place.id,
        ),
    )

    for category in categories:
        db.add(
            PlaceRecommendationTarget(
                id=generate_id("prt"),
                place_id=place.id,
                category=category,
            ),
        )

    try:
        db.commit()
    except Exception:
        db.rollback()
        raise

    return OwnerRecommendationTargetsResponse(categories=categories)
