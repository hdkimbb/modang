from pydantic import BaseModel, Field


class RankingPlaceSummary(BaseModel):
    place_id: str
    name: str
    thumbnail_url: str | None = None


class RankingScoreBreakdown(BaseModel):
    total: float
    meetup_signal: float
    mention: float
    review: float


class RankingPlaceStats(BaseModel):
    total_meetings_30d: int
    avg_rating: float | None = None


class RankingItem(BaseModel):
    rank: int
    place: RankingPlaceSummary
    score: RankingScoreBreakdown
    stats: RankingPlaceStats


class RankingResponse(BaseModel):
    district: str
    category: str
    season_label: str
    items: list[RankingItem]


class RankingFiltersResponse(BaseModel):
    districts: list[str]
    categories: list[str]
