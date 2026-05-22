"""Meeting post comment routes."""

from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.orm import Session, joinedload

from app.db import get_db
from app.models.meeting import Meeting
from app.models.meeting_post import MeetingPost
from app.models.meeting_post_comment import MeetingPostComment
from app.models.place import Place
from app.models.user import User
from app.schemas.meeting_post_comment import (
    CommentAuthor,
    CommentMentionPlace,
    CommentMentionUser,
    MeetingPostCommentCreateRequest,
    MeetingPostCommentItem,
    MeetingPostCommentListResponse,
)
from app.services.id import generate_id
from app.services.mention_signals import record_comment_mention_signals
from app.services.mentions import MAX_MENTIONS_PER_TYPE
from app.services.relative_time import format_relative_time

router = APIRouter(prefix="/api/v1/meetings", tags=["meeting-post-comments"])


def _error(status_code: int, code: str, message: str) -> HTTPException:
    return HTTPException(
        status_code=status_code,
        detail={"error": {"code": code, "message": message, "details": {}}},
    )


def _get_meeting_or_404(db: Session, meeting_id: str) -> Meeting:
    meeting = db.get(Meeting, meeting_id)
    if meeting is None:
        raise _error(
            status.HTTP_404_NOT_FOUND,
            "meeting_not_found",
            "모임을 찾을 수 없어요.",
        )
    return meeting


def _get_post_or_404(
    db: Session,
    meeting_id: str,
    post_id: str,
) -> MeetingPost:
    _get_meeting_or_404(db, meeting_id)
    post = db.get(MeetingPost, post_id)
    if post is None or post.meeting_id != meeting_id:
        raise _error(
            status.HTTP_404_NOT_FOUND,
            "post_not_found",
            "게시글을 찾을 수 없어요.",
        )
    return post


def _resolve_mention_ids(requested: list[str]) -> list[str]:
    return list(dict.fromkeys(requested))[:MAX_MENTIONS_PER_TYPE]


def _validate_mentions(
    db: Session,
    *,
    place_ids: list[str],
    user_ids: list[str],
) -> tuple[list[str], list[str]]:
    for pid in place_ids:
        if db.get(Place, pid) is None:
            raise _error(
                status.HTTP_400_BAD_REQUEST,
                "place_not_found",
                f"장소를 찾을 수 없어요: {pid}",
            )
    for uid in user_ids:
        if db.get(User, uid) is None:
            raise _error(
                status.HTTP_400_BAD_REQUEST,
                "user_not_found",
                f"사용자를 찾을 수 없어요: {uid}",
            )
    return place_ids, user_ids


def _collect_comment_mentions(
    db: Session,
    comments: list[MeetingPostComment],
) -> tuple[dict[str, Place], dict[str, User]]:
    place_ids: list[str] = []
    user_ids: list[str] = []
    for comment in comments:
        data = comment.mentions
        place_ids.extend(data["places"])
        user_ids.extend(data["users"])
    unique_places = list(dict.fromkeys(place_ids))
    unique_users = list(dict.fromkeys(user_ids))
    places_by_id = {
        p.id: p
        for p in db.scalars(select(Place).where(Place.id.in_(unique_places))).all()
    } if unique_places else {}
    users_by_id = {
        u.id: u
        for u in db.scalars(select(User).where(User.id.in_(unique_users))).all()
    } if unique_users else {}
    return places_by_id, users_by_id


def _comment_to_item(
    comment: MeetingPostComment,
    host_user_id: str,
    places_by_id: dict[str, Place],
    users_by_id: dict[str, User],
) -> MeetingPostCommentItem:
    author = comment.author
    mention_data = comment.mentions
    mention_places = [
        CommentMentionPlace(place_id=pid, name=places_by_id[pid].name)
        for pid in mention_data["places"]
        if pid in places_by_id
    ]
    mention_users = [
        CommentMentionUser(
            user_id=uid,
            name=users_by_id[uid].name,
            avatar_url=users_by_id[uid].avatar_url,
        )
        for uid in mention_data["users"]
        if uid in users_by_id
    ]
    return MeetingPostCommentItem(
        id=comment.id,
        author=CommentAuthor(
            user_id=author.id,
            name=author.name,
            avatar_url=author.avatar_url,
            is_host=author.id == host_user_id,
        ),
        content=comment.content,
        mentions=mention_places,
        mention_users=mention_users,
        created_at=comment.created_at,
        relative_time=format_relative_time(comment.created_at),
    )


@router.get(
    "/{meeting_id}/posts/{post_id}/comments",
    response_model=MeetingPostCommentListResponse,
)
def list_post_comments(
    meeting_id: str,
    post_id: str,
    db: Session = Depends(get_db),
) -> MeetingPostCommentListResponse:
    meeting = _get_meeting_or_404(db, meeting_id)
    _get_post_or_404(db, meeting_id, post_id)

    stmt = (
        select(MeetingPostComment)
        .options(joinedload(MeetingPostComment.author))
        .where(MeetingPostComment.post_id == post_id)
        .order_by(MeetingPostComment.created_at.asc())
    )
    comments = db.scalars(stmt).all()

    places_by_id, users_by_id = _collect_comment_mentions(db, comments)
    items = [
        _comment_to_item(comment, meeting.host_user_id, places_by_id, users_by_id)
        for comment in comments
    ]

    total = db.scalar(
        select(func.count())
        .select_from(MeetingPostComment)
        .where(MeetingPostComment.post_id == post_id),
    ) or 0

    return MeetingPostCommentListResponse(items=items, total=int(total))


@router.post(
    "/{meeting_id}/posts/{post_id}/comments",
    response_model=MeetingPostCommentItem,
    status_code=status.HTTP_201_CREATED,
)
def create_post_comment(
    meeting_id: str,
    post_id: str,
    body: MeetingPostCommentCreateRequest,
    db: Session = Depends(get_db),
) -> MeetingPostCommentItem:
    meeting = _get_meeting_or_404(db, meeting_id)
    post = _get_post_or_404(db, meeting_id, post_id)

    content = body.content.strip()
    if not content or len(content) > 500:
        raise _error(
            status.HTTP_400_BAD_REQUEST,
            "invalid_content",
            "댓글은 1자 이상 500자 이하로 입력해 주세요.",
        )

    author = db.get(User, body.author_user_id.strip())
    if author is None:
        raise _error(
            status.HTTP_400_BAD_REQUEST,
            "user_not_found",
            "사용자를 찾을 수 없어요.",
        )

    place_ids, user_ids = _validate_mentions(
        db,
        place_ids=_resolve_mention_ids(body.mention_place_ids or []),
        user_ids=_resolve_mention_ids(body.mention_user_ids or []),
    )

    comment = MeetingPostComment(
        id=generate_id("mpcm"),
        post_id=post_id,
        author_user_id=author.id,
        content=content,
    )
    comment.mentions = {"places": place_ids, "users": user_ids}

    try:
        db.add(comment)
        post.comment_count = (post.comment_count or 0) + 1
        record_comment_mention_signals(
            db,
            meeting_id=meeting_id,
            post_id=post_id,
            comment_id=comment.id,
            user_id=author.id,
            place_ids=place_ids,
        )
        db.commit()
        db.refresh(comment)
        comment.author = author
    except Exception:
        db.rollback()
        raise

    places_by_id, users_by_id = _collect_comment_mentions(db, [comment])
    return _comment_to_item(comment, meeting.host_user_id, places_by_id, users_by_id)
