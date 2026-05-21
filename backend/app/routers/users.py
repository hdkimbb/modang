"""Dev persona list (no auth)."""

from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db import get_db
from app.models.user import User
from app.schemas.user import UserPersonaListResponse, UserPersonaResponse

router = APIRouter(prefix="/api/v1/users", tags=["users"])


@router.get("/personas", response_model=UserPersonaListResponse)
def list_personas(db: Session = Depends(get_db)) -> UserPersonaListResponse:
    users = db.scalars(
        select(User).order_by(User.role.desc(), User.name.asc()),
    ).all()
    return UserPersonaListResponse(
        items=[
            UserPersonaResponse(
                id=u.id,
                name=u.name,
                region=u.region,
                role=u.role,
                owned_place_id=u.owned_place_id,
            )
            for u in users
        ],
    )
