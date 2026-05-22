from datetime import datetime

from pydantic import BaseModel


class PendingRatingItem(BaseModel):
    event_id: str
    meeting_id: str
    meeting_title: str
    event_title: str
    place_id: str
    place_name: str
    place_category: str
    scheduled_at: datetime
    ended_at_calculated: datetime


class PendingRatingsListResponse(BaseModel):
    items: list[PendingRatingItem]
