from pydantic import BaseModel


class MentionPlaceItem(BaseModel):
    place_id: str
    name: str


class MentionUserItem(BaseModel):
    user_id: str
    name: str
    avatar_url: str | None = None
