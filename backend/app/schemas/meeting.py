from datetime import datetime

from pydantic import BaseModel, Field

ALLOWED_MEETING_CATEGORIES = frozenset(
    {
        "운동",
        "동네친구",
        "아웃도어/여행",
        "자기계발",
        "가족·육아",
        "취미",
        "음식",
    }
)


class MeetingCreateRequest(BaseModel):
    name: str = Field(..., min_length=1, max_length=24)
    category: str = Field(..., min_length=1, max_length=30)
    neighborhood: str = Field(..., min_length=1, max_length=50)
    activity_range: int = Field(..., ge=1, le=5)
    description: str = Field(default="", max_length=500)
    host_user_id: str | None = Field(
        default=None,
        min_length=1,
        max_length=32,
        description="Dev: acting user when creating a meeting",
    )


class MeetingResponse(BaseModel):
    id: str
    name: str
    category: str
    neighborhood: str
    activity_range: int
    description: str | None
    member_count: int
    created_at: datetime

    model_config = {"from_attributes": True}


class MeetingListResponse(BaseModel):
    items: list[MeetingResponse]


class MeetingMemberItem(BaseModel):
    user_id: str
    name: str
    role: str


class MeetingHostSummary(BaseModel):
    user_id: str
    name: str
    avatar_url: str | None


class MeetingEventPlaceSummary(BaseModel):
    place_id: str
    name: str


class MeetingEventSummary(BaseModel):
    event_id: str
    title: str
    scheduled_at: datetime
    status: str
    attendee_count: int
    place: MeetingEventPlaceSummary
    avg_rating: float | None = None
    rating_count: int = 0


class MeetingDetailResponse(BaseModel):
    id: str
    name: str
    category: str
    neighborhood: str
    activity_range: int
    description: str | None
    member_count: int
    created_at: datetime
    host: MeetingHostSummary
    post_count: int
    event_count: int
    members: list[MeetingMemberItem]
    upcoming_events: list[MeetingEventSummary]


class MeetingEventsListResponse(BaseModel):
    items: list[MeetingEventSummary]


class PlaceHistoryPlaceSummary(BaseModel):
    place_id: str
    name: str


class PlaceHistoryItem(BaseModel):
    place: PlaceHistoryPlaceSummary
    visit_count: int
    last_visited_at: datetime
    avg_rating_from_us: float | None = None


class MeetingPlaceHistoryResponse(BaseModel):
    items: list[PlaceHistoryItem]
