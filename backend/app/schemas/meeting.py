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
