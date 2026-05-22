"""Resolve mention IDs to display items for API responses."""

from __future__ import annotations

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.place import Place
from app.models.user import User
from app.schemas.mention import MentionPlaceItem, MentionUserItem
from app.services.mentions import MAX_MENTIONS_PER_TYPE


def resolve_place_mentions(
    db: Session,
    place_ids: list[str],
) -> list[MentionPlaceItem]:
    if not place_ids:
        return []
    unique = list(dict.fromkeys(place_ids))[:MAX_MENTIONS_PER_TYPE]
    rows = db.scalars(select(Place).where(Place.id.in_(unique))).all()
    by_id = {p.id: p for p in rows}
    return [
        MentionPlaceItem(place_id=pid, name=by_id[pid].name)
        for pid in unique
        if pid in by_id
    ]


def resolve_user_mentions(
    db: Session,
    user_ids: list[str],
) -> list[MentionUserItem]:
    if not user_ids:
        return []
    unique = list(dict.fromkeys(user_ids))[:MAX_MENTIONS_PER_TYPE]
    rows = db.scalars(select(User).where(User.id.in_(unique))).all()
    by_id = {u.id: u for u in rows}
    return [
        MentionUserItem(
            user_id=uid,
            name=by_id[uid].name,
            avatar_url=by_id[uid].avatar_url,
        )
        for uid in unique
        if uid in by_id
    ]
