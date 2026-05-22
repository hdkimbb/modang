from datetime import datetime

from pydantic import BaseModel, Field

from app.schemas.mention import MentionPlaceItem, MentionUserItem


class MeetingPostAuthor(BaseModel):
    user_id: str
    name: str
    avatar_url: str | None
    is_host: bool


class MeetingPostItem(BaseModel):
    id: str
    author: MeetingPostAuthor
    board_type: str
    content: str
    image_urls: list[str]
    mention_places: list[MentionPlaceItem] = Field(default_factory=list)
    mention_users: list[MentionUserItem] = Field(default_factory=list)
    view_count: int
    like_count: int
    comment_count: int
    created_at: datetime
    relative_time: str


class MeetingPostListResponse(BaseModel):
    items: list[MeetingPostItem]
    total: int
    board_counts: dict[str, int]


class MeetingPostCreateRequest(BaseModel):
    author_user_id: str = Field(..., min_length=1, max_length=32)
    board_type: str = Field(default="free", min_length=1, max_length=20)
    content: str = Field(..., min_length=1)
    image_urls: list[str] = Field(default_factory=list)
    mention_place_ids: list[str] = Field(default_factory=list)
    mention_user_ids: list[str] = Field(default_factory=list)
