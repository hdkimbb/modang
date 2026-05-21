from datetime import datetime

from pydantic import BaseModel, Field


class OwnerPlaceSummary(BaseModel):
    id: str
    name: str
    address: str


class OwnerDashboardStats(BaseModel):
    total_visits: int
    this_month_visits: int
    upcoming_count: int


class OwnerMeetingVisit(BaseModel):
    meeting_id: str
    name: str
    category: str
    member_count: int
    scheduled_at: datetime
    is_upcoming: bool
    place_signal_count: int


class OwnerDashboardResponse(BaseModel):
    place: OwnerPlaceSummary
    stats: OwnerDashboardStats
    meetings: list[OwnerMeetingVisit]


class RecommendedAction(BaseModel):
    type: str
    label: str
    template: str


class OwnerCategoryInsight(BaseModel):
    category: str
    count: int
    percentage: int
    avg_member_count: int
    recommended_action: RecommendedAction


class OwnerInsightsResponse(BaseModel):
    total_meetings: int
    top_categories: list[OwnerCategoryInsight]


class OwnerMessageResponse(BaseModel):
    message: str
    active: bool


class OwnerMessageUpdateRequest(BaseModel):
    message: str = Field(default="", max_length=100)
    active: bool = False


class TimeslotInsight(BaseModel):
    key: str
    label: str
    count: int
    percentage: int


class OwnerTimeslotInsightsResponse(BaseModel):
    total_events: int
    slots: list[TimeslotInsight]
    peak_slot: str | None = None
    low_slot: str | None = None
    peak_recommendation: str = ""


class OwnerRecommendationTargetsResponse(BaseModel):
    categories: list[str]


class OwnerRecommendationTargetsUpdateRequest(BaseModel):
    categories: list[str] = Field(default_factory=list)
