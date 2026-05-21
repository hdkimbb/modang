"""Place search and CRUD routes."""

from __future__ import annotations

import base64
import json
import re
from typing import Annotated, Any

import httpx
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import func, or_, select
from sqlalchemy.orm import Session

from app.config import get_settings
from app.db import get_db
from app.models.meeting import Meeting
from app.models.meeting_event import MeetingEvent
from app.models.meeting_rating import MeetingRating
from app.models.place import Place
from app.models.place_recommendation_target import PlaceRecommendationTarget
from app.schemas.place import (
    PlaceDetailResponse,
    PlaceMeetingHistoryItem,
    PlaceMeetingHistoryResponse,
    PlaceSearchItem,
    PlaceSearchResponse,
)
from app.schemas.rating import PlaceRatingsResponse, RecentRatingItem
from app.services.kakao import KakaoApiError, parse_document, search_keyword
from app.services.owner_insights import meeting_category_match_labels
from app.services.place_stats import fetch_place_stats_map, stats_for_place

router = APIRouter(prefix="/api/v1/places", tags=["places"])

DISTRICT_PATTERN = re.compile(r"([가-힣]+동)")


def extract_district(address: str) -> str | None:
    match = DISTRICT_PATTERN.search(address)
    return match.group(1) if match else None


def decode_kakao_page(cursor: str | None) -> int:
    if not cursor:
        return 1
    try:
        payload = json.loads(base64.urlsafe_b64decode(cursor.encode()).decode())
        return max(1, int(payload.get("kp", 1)))
    except (json.JSONDecodeError, ValueError, TypeError):
        return 1


def encode_kakao_page(page: int) -> str:
    raw = json.dumps({"kp": page})
    return base64.urlsafe_b64encode(raw.encode()).decode()


def _owner_message_for_place(place: Place) -> str | None:
    if (
        place.owner_message_active
        and place.owner_message
        and place.owner_message.strip()
    ):
        return place.owner_message.strip()
    return None


def _recommended_place_ids(
    db: Session,
    meeting_category: str | None,
) -> set[str]:
    if not meeting_category:
        return set()
    labels = meeting_category_match_labels(meeting_category)
    rows = db.scalars(
        select(PlaceRecommendationTarget.place_id).where(
            PlaceRecommendationTarget.category.in_(labels),
        ),
    ).all()
    return set(rows)


def _row_to_search_item(
    place: Place,
    stats: dict | None = None,
    *,
    is_owner_recommended: bool = False,
    distance: str | None = None,
) -> PlaceSearchItem:
    st = stats or {}
    avg = st.get("avg_rating")
    return PlaceSearchItem(
        place_id=place.id,
        name=place.name,
        address=place.address,
        district=place.district,
        category=place.category,
        lat=place.lat,
        lng=place.lng,
        business_id=place.business_id,
        verified=place.business_id is not None,
        distance=distance,
        external_provider=place.external_provider,
        external_id=place.external_id,
        meeting_count=int(st.get("meeting_count", 0)),
        avg_rating=round(float(avg), 1) if avg is not None else None,
        rating_count=int(st.get("rating_count", 0)),
        would_revisit_rate=st.get("would_revisit_rate"),
        owner_message=_owner_message_for_place(place),
        is_owner_recommended=is_owner_recommended,
    )


def _enrich_and_sort_items(
    items: list[PlaceSearchItem],
    recommended_place_ids: set[str],
) -> list[PlaceSearchItem]:
    enriched: list[PlaceSearchItem] = []
    for item in items:
        is_rec = bool(item.place_id and item.place_id in recommended_place_ids)
        enriched.append(
            item.model_copy(update={"is_owner_recommended": is_rec}),
        )
    enriched.sort(
        key=lambda item: (not item.is_owner_recommended, -item.meeting_count),
    )
    return enriched


def fetch_recommended_places(
    db: Session,
    limit: int,
    meeting_category: str | None = None,
) -> list[PlaceSearchItem]:
    stats_map = fetch_place_stats_map(db)
    ranked = sorted(
        stats_map.items(),
        key=lambda item: item[1].get("meeting_count", 0),
        reverse=True,
    )
    place_ids = [pid for pid, _ in ranked[: limit * 3]]
    if not place_ids:
        places = db.scalars(select(Place).limit(limit)).all()
        recommended_ids = _recommended_place_ids(db, meeting_category)
        return _enrich_and_sort_items(
            [_row_to_search_item(p, stats_map.get(p.id)) for p in places],
            recommended_ids,
        )

    places = db.scalars(select(Place).where(Place.id.in_(place_ids))).all()
    place_by_id = {p.id: p for p in places}
    recommended_ids = _recommended_place_ids(db, meeting_category)

    items: list[PlaceSearchItem] = []
    for pid in place_ids:
        place = place_by_id.get(pid)
        if place is None:
            continue
        items.append(
            _row_to_search_item(
                place,
                stats_map.get(pid),
                is_owner_recommended=pid in recommended_ids,
            ),
        )
        if len(items) >= limit:
            break
    return _enrich_and_sort_items(items, recommended_ids)


def search_local_places(
    db: Session,
    q: str,
    district: str | None,
    category: str | None,
) -> list[PlaceSearchItem]:
    stats_map = fetch_place_stats_map(db)
    pattern = f"%{q}%"
    stmt = select(Place).where(
        or_(
            Place.name.ilike(pattern),
            Place.address.ilike(pattern),
        ),
    )
    if district:
        stmt = stmt.where(Place.district == district)
    if category:
        stmt = stmt.where(Place.category == category)

    places = db.scalars(stmt).all()
    places.sort(
        key=lambda p: stats_map.get(p.id, {}).get("meeting_count", 0),
        reverse=True,
    )
    return [_row_to_search_item(p, stats_map.get(p.id)) for p in places]


def _kakao_documents_to_items(
    documents: list[dict[str, Any]],
    district: str | None,
    category: str | None,
    known_external_ids: set[str],
) -> list[PlaceSearchItem]:
    items: list[PlaceSearchItem] = []
    for doc in documents:
        parsed = parse_document(doc)
        ext_id = parsed["external_id"]
        if not ext_id or ext_id in known_external_ids:
            continue

        doc_district = extract_district(parsed["address"])
        if district and doc_district != district and district not in parsed["address"]:
            continue
        if category and parsed["category"] != category:
            continue

        items.append(
            PlaceSearchItem(
                place_id=None,
                name=parsed["name"],
                address=parsed["address"],
                district=doc_district,
                category=parsed["category"],
                lat=parsed["lat"],
                lng=parsed["lng"],
                distance=parsed["distance"],
                external_provider="kakao",
                external_id=ext_id,
            ),
        )
    return items


@router.get("/recommendations", response_model=PlaceSearchResponse)
def places_recommendations(
    limit: Annotated[int, Query(ge=1, le=20)] = 2,
    meeting_category: Annotated[str | None, Query()] = None,
    db: Session = Depends(get_db),
) -> PlaceSearchResponse:
    items = fetch_recommended_places(db, limit, meeting_category)
    return PlaceSearchResponse(items=items, next_cursor=None)


@router.get("/search", response_model=PlaceSearchResponse)
def places_search(
    q: Annotated[str, Query(min_length=1, description="검색어")],
    district: Annotated[str | None, Query()] = None,
    category: Annotated[str | None, Query()] = None,
    lat: Annotated[float | None, Query()] = None,
    lng: Annotated[float | None, Query()] = None,
    cursor: Annotated[str | None, Query()] = None,
    limit: Annotated[int, Query(ge=1, le=50)] = 20,
    meeting_category: Annotated[str | None, Query()] = None,
    db: Session = Depends(get_db),
) -> PlaceSearchResponse:
    kakao_page = decode_kakao_page(cursor)
    local_items: list[PlaceSearchItem] = []
    recommended_ids = _recommended_place_ids(db, meeting_category)

    if kakao_page == 1:
        local_items = search_local_places(db, q, district, category)
        local_items = _enrich_and_sort_items(local_items, recommended_ids)

    known_external = {
        item.external_id for item in local_items if item.external_id
    }

    settings = get_settings()
    kakao_items: list[PlaceSearchItem] = []
    kakao_has_next = False

    if settings.kakao_enabled:
        try:
            with httpx.Client(timeout=10.0) as client:
                data = search_keyword(
                    q,
                    page=kakao_page,
                    size=min(limit, 15),
                    lat=lat,
                    lng=lng,
                    client=client,
                )
        except KakaoApiError as exc:
            raise HTTPException(
                status_code=502,
                detail={
                    "error": {
                        "code": "kakao_api_error",
                        "message": "장소 검색 서비스에 연결할 수 없어요.",
                        "details": {"status_code": exc.status_code},
                    }
                },
            ) from exc

        kakao_items = _kakao_documents_to_items(
            data.get("documents", []),
            district,
            category,
            known_external,
        )
        meta = data.get("meta", {})
        kakao_has_next = not meta.get("is_end", True)

    merged = local_items + kakao_items
    merged.sort(
        key=lambda item: (not item.is_owner_recommended, -item.meeting_count),
    )
    items = merged[:limit]

    next_cursor = None
    if len(merged) > limit or kakao_has_next:
        next_cursor = encode_kakao_page(kakao_page + 1)

    return PlaceSearchResponse(items=items, next_cursor=next_cursor)


@router.get("/{place_id}/ratings", response_model=PlaceRatingsResponse)
def place_ratings(
    place_id: str,
    db: Session = Depends(get_db),
) -> PlaceRatingsResponse:
    place = db.get(Place, place_id)
    if place is None:
        raise HTTPException(
            status_code=404,
            detail={
                "error": {
                    "code": "place_not_found",
                    "message": "장소를 찾을 수 없어요.",
                    "details": {},
                }
            },
        )

    rows = db.scalars(
        select(MeetingRating)
        .join(MeetingEvent, MeetingEvent.id == MeetingRating.event_id)
        .where(MeetingEvent.place_id == place_id)
        .order_by(MeetingRating.created_at.desc()),
    ).all()

    distribution = {str(i): 0 for i in range(5, 0, -1)}
    for row in rows:
        distribution[str(row.rating)] = distribution.get(str(row.rating), 0) + 1

    total = len(rows)
    if total == 0:
        return PlaceRatingsResponse(
            total_count=0,
            avg_rating=None,
            would_revisit_rate=None,
            distribution=distribution,
            recent=[],
        )

    avg_rating = sum(r.rating for r in rows) / total
    revisit_rate = sum(1 for r in rows if r.would_revisit) / total

    return PlaceRatingsResponse(
        total_count=total,
        avg_rating=round(avg_rating, 1),
        would_revisit_rate=round(revisit_rate, 2),
        distribution=distribution,
        recent=[
            RecentRatingItem(
                rating=r.rating,
                would_revisit=r.would_revisit,
                created_at=r.created_at,
            )
            for r in rows[:5]
        ],
    )


@router.get("/{place_id}/meeting-history", response_model=PlaceMeetingHistoryResponse)
def place_meeting_history(
    place_id: str,
    limit: Annotated[int, Query(ge=1, le=50)] = 20,
    db: Session = Depends(get_db),
) -> PlaceMeetingHistoryResponse:
    place = db.get(Place, place_id)
    if place is None:
        raise HTTPException(
            status_code=404,
            detail={
                "error": {
                    "code": "place_not_found",
                    "message": "장소를 찾을 수 없어요.",
                    "details": {},
                }
            },
        )

    rows = db.execute(
        select(MeetingEvent, Meeting)
        .join(Meeting, Meeting.id == MeetingEvent.meeting_id)
        .where(MeetingEvent.place_id == place_id)
        .order_by(MeetingEvent.scheduled_at.desc())
        .limit(limit),
    ).all()

    items = [
        PlaceMeetingHistoryItem(
            event_id=event.id,
            meeting_id=meeting.id,
            meeting_name=meeting.name,
            category=meeting.category,
            scheduled_at=event.scheduled_at,
            status=event.status,
            attendee_count=event.attendee_count,
        )
        for event, meeting in rows
    ]
    return PlaceMeetingHistoryResponse(items=items)


@router.get("/{place_id}", response_model=PlaceDetailResponse)
def get_place_detail(
    place_id: str,
    db: Session = Depends(get_db),
) -> PlaceDetailResponse:
    place = db.get(Place, place_id)
    if place is None:
        raise HTTPException(
            status_code=404,
            detail={
                "error": {
                    "code": "place_not_found",
                    "message": "장소를 찾을 수 없어요.",
                    "details": {},
                }
            },
        )

    st = stats_for_place(db, place_id)
    avg = st.get("avg_rating")
    return PlaceDetailResponse(
        id=place.id,
        name=place.name,
        address=place.address,
        district=place.district,
        category=place.category,
        lat=place.lat,
        lng=place.lng,
        meeting_count=int(st.get("meeting_count", 0)),
        avg_rating=round(float(avg), 1) if avg is not None else None,
        rating_count=int(st.get("rating_count", 0)),
        would_revisit_rate=st.get("would_revisit_rate"),
        owner_message=_owner_message_for_place(place),
    )
