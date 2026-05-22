from datetime import datetime

from pydantic import BaseModel


class SeasonSummary(BaseModel):
    id: str
    name: str
    starts_at: datetime
    ends_at: datetime
    status: str
    total_awards: int = 0


class AwardTriggerResponse(BaseModel):
    awards_created: int
    snapshots_created: int


class AwardPlaceSummary(BaseModel):
    id: str
    name: str
    address: str
    district: str
    category: str


class SeasonAwardWinner(BaseModel):
    rank: int
    place: AwardPlaceSummary
    score: float
    signal_count: int


class SeasonAwardGroup(BaseModel):
    category: str
    district: str
    winners: list[SeasonAwardWinner]


class SeasonAwardsResponse(BaseModel):
    season: SeasonSummary
    groups: list[SeasonAwardGroup]


class PlaceAwardItem(BaseModel):
    season: SeasonSummary
    rank: int
    category: str
    district: str
    score: float


class PlaceAwardsResponse(BaseModel):
    items: list[PlaceAwardItem]
