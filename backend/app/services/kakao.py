"""Kakao Local API client (keyword search)."""

from __future__ import annotations

from typing import Any

import httpx

from app.config import get_settings

KAKAO_KEYWORD_URL = "https://dapi.kakao.com/v2/local/search/keyword.json"

# https://developers.kakao.com/docs/latest/ko/local/dev-guide#category-group-code
CATEGORY_GROUP_MAP: dict[str, str] = {
    "CE7": "cafe",
    "FD6": "restaurant",
    "CT1": "culture",
    "AT4": "attraction",
    "AD5": "hotel",
    "MT1": "market",
    "CS2": "convenience",
}


class KakaoApiError(Exception):
    def __init__(self, message: str, status_code: int | None = None) -> None:
        super().__init__(message)
        self.status_code = status_code


def map_category(category_group_code: str, category_name: str) -> str:
    if category_group_code in CATEGORY_GROUP_MAP:
        return CATEGORY_GROUP_MAP[category_group_code]
    if "카페" in category_name:
        return "cafe"
    if "음식점" in category_name:
        return "restaurant"
    return "etc"


def format_distance(meters: str | int | None) -> str | None:
    if meters is None or meters == "":
        return None
    try:
        m = int(meters)
    except (TypeError, ValueError):
        return None
    if m < 1000:
        return f"{m}m"
    km = m / 1000
    if km < 10:
        return f"{km:.1f}km".replace(".0km", "km")
    return f"{int(round(km))}km"


def search_keyword(
    query: str,
    *,
    page: int = 1,
    size: int = 15,
    lat: float | None = None,
    lng: float | None = None,
    radius: int | None = None,
    client: httpx.Client | None = None,
) -> dict[str, Any]:
    """
    Kakao keyword search. Returns raw JSON with meta + documents.
    """
    settings = get_settings()
    if not settings.kakao_enabled:
        return {"meta": {"is_end": True, "pageable_count": 0}, "documents": []}

    headers = {"Authorization": f"KakaoAK {settings.kakao_rest_api_key}"}
    params: dict[str, Any] = {
        "query": query,
        "page": page,
        "size": min(size, 15),
    }
    if lat is not None and lng is not None:
        params["y"] = lat
        params["x"] = lng
        params["sort"] = "distance"
        if radius is not None:
            params["radius"] = min(radius, 20000)

    own_client = client is None
    http = client or httpx.Client(timeout=10.0)
    try:
        response = http.get(KAKAO_KEYWORD_URL, headers=headers, params=params)
        if response.status_code != 200:
            raise KakaoApiError(
                f"Kakao API error: {response.status_code}",
                status_code=response.status_code,
            )
        return response.json()
    finally:
        if own_client:
            http.close()


def parse_document(doc: dict[str, Any]) -> dict[str, Any]:
    """Normalize a Kakao document to Modang search fields."""
    address = doc.get("road_address_name") or doc.get("address_name") or ""
    category_name = doc.get("category_name", "")
    group_code = doc.get("category_group_code", "")

    return {
        "external_provider": "kakao",
        "external_id": str(doc.get("id", "")),
        "name": doc.get("place_name", ""),
        "address": address,
        "lat": float(doc.get("y", 0)),
        "lng": float(doc.get("x", 0)),
        "category": map_category(group_code, category_name),
        "distance": format_distance(doc.get("distance")),
        "category_name": category_name,
    }
