from datetime import datetime

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
    rating_count: int = 0
    would_revisit_rate: float | None = None
    owner_message: str | None = None
    is_owner_recommended: bool = False


class PlaceSearchResponse(BaseModel):
    items: list[PlaceSearchItem]
    next_cursor: str | None = None


class PlaceDetailResponse(BaseModel):
    id: str
    name: str
    address: str
    district: str
    category: str
    lat: float
    lng: float
    meeting_count: int = 0
    avg_rating: float | None = None
    rating_count: int = 0
    would_revisit_rate: float | None = None
    owner_message: str | None = None


class PlaceMeetingHistoryItem(BaseModel):
    event_id: str
    meeting_id: str
    meeting_name: str
    category: str
    scheduled_at: datetime
    status: str
    attendee_count: int


class PlaceMeetingHistoryResponse(BaseModel):
    items: list[PlaceMeetingHistoryItem]
