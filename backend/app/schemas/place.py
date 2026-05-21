from pydantic import BaseModel, Field


class PlaceSearchItem(BaseModel):
    place_id: str | None = None
    name: str
    address: str
    district: str | None = None
    category: str
    lat: float
    lng: float
    business_id: str | None = None
    verified: bool = False
    thumbnail_url: str | None = None
    distance: str | None = None
    external_provider: str | None = None
    external_id: str | None = None
    meeting_count: int = 0
    avg_rating: float | None = None


class PlaceSearchResponse(BaseModel):
    items: list[PlaceSearchItem]
    next_cursor: str | None = None
