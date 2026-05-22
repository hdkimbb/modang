from datetime import datetime

from pydantic import BaseModel, Field

from app.schemas.mention import MentionPlaceItem, MentionUserItem

CommentMentionPlace = MentionPlaceItem
CommentMentionUser = MentionUserItem


class CommentAuthor(BaseModel):
    user_id: str
    name: str
    avatar_url: str | None
    is_host: bool


class MeetingPostCommentItem(BaseModel):
    id: str
    author: CommentAuthor
    content: str
    mentions: list[CommentMentionPlace]
    mention_users: list[CommentMentionUser] = Field(default_factory=list)
    created_at: datetime
    relative_time: str


class MeetingPostCommentListResponse(BaseModel):
    items: list[MeetingPostCommentItem]
    total: int


class MeetingPostCommentCreateRequest(BaseModel):
    author_user_id: str = Field(..., min_length=1, max_length=32)
    content: str = Field(..., min_length=1, max_length=500)
    mention_place_ids: list[str] = Field(default_factory=list)
    mention_user_ids: list[str] = Field(default_factory=list)
