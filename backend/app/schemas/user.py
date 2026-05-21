from pydantic import BaseModel


class UserPersonaResponse(BaseModel):
    id: str
    name: str
    region: str
    role: str
    owned_place_id: str | None = None


class UserPersonaListResponse(BaseModel):
    items: list[UserPersonaResponse]
