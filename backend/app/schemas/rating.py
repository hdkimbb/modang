from datetime import datetime

from pydantic import BaseModel, Field


class RatingCreateRequest(BaseModel):
    user_id: str = Field(..., min_length=1)
    rating: int = Field(..., ge=1, le=5)
    would_revisit: bool = False


class RatingResponse(BaseModel):
    id: str
    event_id: str
    user_id: str
    rating: int
    would_revisit: bool
    created_at: datetime


class EventRatingsListResponse(BaseModel):
    ratings: list[RatingResponse]
    avg_rating: float | None = None
    would_revisit_rate: float | None = None


class RecentRatingItem(BaseModel):
    rating: int
    would_revisit: bool
    created_at: datetime


class PlaceRatingsResponse(BaseModel):
    total_count: int
    avg_rating: float | None = None
    would_revisit_rate: float | None = None
    distribution: dict[str, int]
    recent: list[RecentRatingItem]
