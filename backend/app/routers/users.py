"""Dev persona list and mention search (no auth)."""

from fastapi import APIRouter, Depends, Query
from sqlalchemy import or_, select
from sqlalchemy.orm import Session

from app.db import get_db
from app.models.user import User
from app.schemas.user import (
    UserPersonaListResponse,
    UserPersonaResponse,
    UserSearchItem,
    UserSearchResponse,
)

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


@router.get("/search", response_model=UserSearchResponse)
def search_users(
    q: str = Query(default="", max_length=100),
    limit: int = Query(default=5, ge=1, le=10),
    db: Session = Depends(get_db),
) -> UserSearchResponse:
    stmt = select(User).order_by(User.name.asc())
    term = q.strip()
    if term:
        pattern = f"%{term}%"
        stmt = stmt.where(
            or_(
                User.name.like(pattern),
                User.region.like(pattern),
            ),
        )
    users = db.scalars(stmt.limit(limit)).all()
    return UserSearchResponse(
        items=[
            UserSearchItem(
                user_id=u.id,
                name=u.name,
                profile_image_url=u.avatar_url,
            )
            for u in users
        ],
    )
