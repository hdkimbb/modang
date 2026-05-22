"""Resolve meeting category and place district for a place_signal."""

from __future__ import annotations

from sqlalchemy.orm import Session

from app.models.meeting import Meeting
from app.models.meeting_event import MeetingEvent
from app.models.meeting_post import MeetingPost
from app.models.meeting_post_comment import MeetingPostComment
from app.models.place import Place
from app.models.place_signal import PlaceSignal


def resolve_signal_bucket(
    db: Session,
    signal: PlaceSignal,
    place: Place | None,
) -> tuple[str, str] | None:
    """
    Return (meeting_category, place_district) for season scoring.

    Skips only when place is missing or district is empty.
    Category: meta → meeting via meta/source_ref → place.category fallback.
    """
    if place is None or not (place.district or "").strip():
        return None

    district = place.district.strip()
    meta = signal.meta or {}
    category: str | None = None

    raw_cat = meta.get("category")
    if isinstance(raw_cat, str) and raw_cat.strip():
        category = raw_cat.strip()

    if category is None:
        meeting_id = meta.get("meeting_id")
        if isinstance(meeting_id, str) and meeting_id:
            meeting = db.get(Meeting, meeting_id)
            if meeting is not None:
                category = meeting.category

    if category is None and signal.source_ref:
        ref = signal.source_ref
        event = db.get(MeetingEvent, ref)
        if event is not None:
            meeting = db.get(Meeting, event.meeting_id)
            if meeting is not None:
                category = meeting.category
        else:
            post = db.get(MeetingPost, ref)
            if post is not None:
                meeting = db.get(Meeting, post.meeting_id)
                if meeting is not None:
                    category = meeting.category
            else:
                comment = db.get(MeetingPostComment, ref)
                if comment is not None:
                    post = db.get(MeetingPost, comment.post_id)
                    if post is not None:
                        meeting = db.get(Meeting, post.meeting_id)
                        if meeting is not None:
                            category = meeting.category

    if category is None and place.category:
        category = place.category.strip()

    if not category:
        return None

    return category, district
