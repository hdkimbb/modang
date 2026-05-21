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
from app.models.place import Place
from app.models.place_signal import PlaceSignal
from app.schemas.place import PlaceSearchItem, PlaceSearchResponse
from app.services.kakao import KakaoApiError, parse_document, search_keyword

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


def _place_stats_subquery():
    return (
        select(
            PlaceSignal.place_id,
            func.count()
            .filter(
                PlaceSignal.is_void.is_(False),
                PlaceSignal.signal_type.in_(("selected", "rated")),
            )
            .label("meeting_count"),
            func.avg(PlaceSignal.weight)
            .filter(
                PlaceSignal.is_void.is_(False),
                PlaceSignal.signal_type == "rated",
            )
            .label("avg_rating"),
        )
        .group_by(PlaceSignal.place_id)
        .subquery()
    )


def _selected_count_subquery():
    return (
        select(
            PlaceSignal.place_id,
            func.count()
            .filter(
                PlaceSignal.is_void.is_(False),
                PlaceSignal.signal_type == "selected",
            )
            .label("selected_count"),
        )
        .group_by(PlaceSignal.place_id)
        .subquery()
    )


def _rated_avg_subquery():
    return (
        select(
            PlaceSignal.place_id,
            func.avg(PlaceSignal.weight)
            .filter(
                PlaceSignal.is_void.is_(False),
                PlaceSignal.signal_type == "rated",
            )
            .label("avg_rating"),
        )
        .group_by(PlaceSignal.place_id)
        .subquery()
    )


def _row_to_search_item(
    place: Place,
    meeting_count: int | None,
    avg_rating: float | None,
) -> PlaceSearchItem:
    count = int(meeting_count or 0)
    rating = round(float(avg_rating), 1) if avg_rating is not None else None
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
        distance=None,
        external_provider=place.external_provider,
        external_id=place.external_id,
        meeting_count=count,
        avg_rating=rating,
    )


def fetch_recommended_places(db: Session, limit: int) -> list[PlaceSearchItem]:
    selected = _selected_count_subquery()
    rated = _rated_avg_subquery()
    stmt = (
        select(
            Place,
            selected.c.selected_count,
            rated.c.avg_rating,
        )
        .join(selected, Place.id == selected.c.place_id)
        .outerjoin(rated, Place.id == rated.c.place_id)
        .order_by(selected.c.selected_count.desc())
        .limit(limit)
    )
    rows = db.execute(stmt).all()
    return [
        _row_to_search_item(place, meeting_count, avg_rating)
        for place, meeting_count, avg_rating in rows
    ]


def search_local_places(
    db: Session,
    q: str,
    district: str | None,
    category: str | None,
) -> list[PlaceSearchItem]:
    stats = _place_stats_subquery()
    pattern = f"%{q}%"
    stmt = (
        select(
            Place,
            stats.c.meeting_count,
            stats.c.avg_rating,
        )
        .outerjoin(stats, Place.id == stats.c.place_id)
        .where(
            or_(
                Place.name.ilike(pattern),
                Place.address.ilike(pattern),
            ),
        )
    )
    if district:
        stmt = stmt.where(Place.district == district)
    if category:
        stmt = stmt.where(Place.category == category)

    stmt = stmt.order_by(func.coalesce(stats.c.meeting_count, 0).desc())

    rows = db.execute(stmt).all()
    return [
        _row_to_search_item(place, meeting_count, avg_rating)
        for place, meeting_count, avg_rating in rows
    ]


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
    db: Session = Depends(get_db),
) -> PlaceSearchResponse:
    items = fetch_recommended_places(db, limit)
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
    db: Session = Depends(get_db),
) -> PlaceSearchResponse:
    kakao_page = decode_kakao_page(cursor)
    local_items: list[PlaceSearchItem] = []

    if kakao_page == 1:
        local_items = search_local_places(db, q, district, category)

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
    merged.sort(key=lambda item: item.meeting_count, reverse=True)
    items = merged[:limit]

    next_cursor = None
    if len(merged) > limit or kakao_has_next:
        next_cursor = encode_kakao_page(kakao_page + 1)

    return PlaceSearchResponse(items=items, next_cursor=next_cursor)
