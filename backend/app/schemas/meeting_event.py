from datetime import datetime

from pydantic import BaseModel, Field


class EventCreateRequest(BaseModel):
    title: str = Field(..., min_length=1, max_length=100)
    scheduled_at: datetime
    attendee_count: int = Field(..., ge=1)
    place_id: str = Field(..., min_length=1, max_length=32)


class EventResponse(BaseModel):
    event_id: str
    meeting_id: str
    place_id: str
    title: str
    scheduled_at: datetime
    attendee_count: int
    status: str
    created_at: datetime
    signal_id: str

    model_config = {"from_attributes": True}
