"""Place mention trust signals from posts and comments."""

from __future__ import annotations

from datetime import datetime, timedelta, timezone

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.place import Place
from app.models.place_signal import PlaceSignal
from app.services.id import generate_id

KST = timezone(timedelta(hours=9))
MENTION_WEIGHT = 0.5


def _signal_matches_post_mention(
    sig: PlaceSignal,
    *,
    post_id: str,
    user_id: str,
    place_id: str,
) -> bool:
    if sig.place_id != place_id or sig.user_id != user_id:
        return False
    if sig.signal_type != "mentioned" or sig.is_void:
        return False
    meta = sig.meta or {}
    if meta.get("post_id") != post_id:
        return False
    if meta.get("comment_id"):
        return False
    return True


def _mention_exists_for_post_body(
    db: Session,
    *,
    post_id: str,
    user_id: str,
    place_id: str,
) -> bool:
    rows = db.scalars(
        select(PlaceSignal).where(
            PlaceSignal.place_id == place_id,
            PlaceSignal.user_id == user_id,
            PlaceSignal.signal_type == "mentioned",
            PlaceSignal.is_void.is_(False),
        ),
    ).all()
    return any(
        _signal_matches_post_mention(
            sig,
            post_id=post_id,
            user_id=user_id,
            place_id=place_id,
        )
        for sig in rows
    )


def _mention_exists_for_comment(
    db: Session,
    *,
    post_id: str,
    comment_id: str,
    user_id: str,
    place_id: str,
) -> bool:
    rows = db.scalars(
        select(PlaceSignal).where(
            PlaceSignal.place_id == place_id,
            PlaceSignal.user_id == user_id,
            PlaceSignal.signal_type == "mentioned",
            PlaceSignal.is_void.is_(False),
        ),
    ).all()
    for sig in rows:
        meta = sig.meta or {}
        if meta.get("post_id") == post_id and meta.get("comment_id") == comment_id:
            return True
    return False


def _insert_mentioned_signal(
    db: Session,
    *,
    place_id: str,
    user_id: str,
    source_ref: str,
    meeting_id: str,
    post_id: str,
    comment_id: str | None,
    district: str | None,
    category: str | None,
) -> None:
    now = datetime.now(KST)
    meta: dict = {
        "meeting_id": meeting_id,
        "post_id": post_id,
        "district": district,
        "category": category,
    }
    if comment_id:
        meta["comment_id"] = comment_id

    db.add(
        PlaceSignal(
            id=generate_id("sig"),
            place_id=place_id,
            signal_type="mentioned",
            weight=MENTION_WEIGHT,
            source_ref=source_ref,
            user_id=user_id,
            occurred_at=now,
            is_void=False,
            meta=meta,
        ),
    )


def record_post_mention_signals(
    db: Session,
    *,
    meeting_id: str,
    post_id: str,
    user_id: str,
    place_ids: list[str],
) -> None:
    unique_ids = list(dict.fromkeys(place_ids))
    if not unique_ids:
        return

    from app.models.meeting import Meeting

    meeting = db.get(Meeting, meeting_id)
    meeting_category = meeting.category if meeting else None

    for place_id in unique_ids:
        if _mention_exists_for_post_body(
            db,
            post_id=post_id,
            user_id=user_id,
            place_id=place_id,
        ):
            continue

        place = db.get(Place, place_id)
        if place is None:
            continue

        _insert_mentioned_signal(
            db,
            place_id=place_id,
            user_id=user_id,
            source_ref=post_id,
            meeting_id=meeting_id,
            post_id=post_id,
            comment_id=None,
            district=place.district,
            category=meeting_category or place.category,
        )


def record_comment_mention_signals(
    db: Session,
    *,
    meeting_id: str,
    post_id: str,
    comment_id: str,
    user_id: str,
    place_ids: list[str],
) -> None:
    unique_ids = list(dict.fromkeys(place_ids))
    if not unique_ids:
        return

    from app.models.meeting import Meeting

    meeting = db.get(Meeting, meeting_id)
    meeting_category = meeting.category if meeting else None

    for place_id in unique_ids:
        if _mention_exists_for_comment(
            db,
            post_id=post_id,
            comment_id=comment_id,
            user_id=user_id,
            place_id=place_id,
        ):
            continue

        place = db.get(Place, place_id)
        if place is None:
            continue

        _insert_mentioned_signal(
            db,
            place_id=place_id,
            user_id=user_id,
            source_ref=comment_id,
            meeting_id=meeting_id,
            post_id=post_id,
            comment_id=comment_id,
            district=place.district,
            category=meeting_category or place.category,
        )


# Backward-compatible alias for comment router
record_mention_signals = record_comment_mention_signals
