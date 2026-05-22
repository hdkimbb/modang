from pydantic import BaseModel


class UserPersonaResponse(BaseModel):
    id: str
    name: str
    region: str
    role: str
    owned_place_id: str | None = None


class UserPersonaListResponse(BaseModel):
    items: list[UserPersonaResponse]


class UserSearchItem(BaseModel):
    user_id: str
    name: str
    profile_image_url: str | None = None


class UserSearchResponse(BaseModel):
    items: list[UserSearchItem]
