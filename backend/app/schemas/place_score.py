from pydantic import BaseModel


class PlaceScoreBreakdown(BaseModel):
    total: float
    selected: float
    rated: float
    mentioned: float
    selected_share_pct: int
    rated_share_pct: int
    mentioned_share_pct: int


class PlaceScoreResponse(BaseModel):
    place_id: str
    score: PlaceScoreBreakdown
