"""Meeting post list and create routes."""

from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func, select
from sqlalchemy.orm import Session, joinedload

from app.db import get_db
from app.models.meeting import Meeting
from app.models.meeting_post import MeetingPost
from app.models.place import Place
from app.models.user import User
from app.schemas.meeting_post import (
    MeetingPostAuthor,
    MeetingPostCreateRequest,
    MeetingPostItem,
    MeetingPostListResponse,
)
from app.schemas.mention import MentionPlaceItem, MentionUserItem
from app.services.id import generate_id
from app.services.mention_signals import record_post_mention_signals
from app.services.mentions import MAX_MENTIONS_PER_TYPE
from app.services.relative_time import format_relative_time

router = APIRouter(prefix="/api/v1/meetings", tags=["meeting-posts"])

MAX_IMAGE_URLS = 10


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


def _collect_post_mentions(
    db: Session,
    posts: list[MeetingPost],
) -> tuple[dict[str, Place], dict[str, User]]:
    place_ids: list[str] = []
    user_ids: list[str] = []
    for post in posts:
        data = post.mentions
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


def _post_to_item_resolved(
    post: MeetingPost,
    host_user_id: str,
    places_by_id: dict[str, Place],
    users_by_id: dict[str, User],
) -> MeetingPostItem:
    author = post.author
    mention_data = post.mentions
    mention_places = [
        MentionPlaceItem(place_id=pid, name=places_by_id[pid].name)
        for pid in mention_data["places"]
        if pid in places_by_id
    ]
    mention_users = [
        MentionUserItem(
            user_id=uid,
            name=users_by_id[uid].name,
            avatar_url=users_by_id[uid].avatar_url,
        )
        for uid in mention_data["users"]
        if uid in users_by_id
    ]
    return MeetingPostItem(
        id=post.id,
        author=MeetingPostAuthor(
            user_id=author.id,
            name=author.name,
            avatar_url=author.avatar_url,
            is_host=author.id == host_user_id,
        ),
        board_type=post.board_type,
        content=post.content,
        image_urls=post.image_urls,
        mention_places=mention_places,
        mention_users=mention_users,
        view_count=post.view_count,
        like_count=post.like_count,
        comment_count=post.comment_count,
        created_at=post.created_at,
        relative_time=format_relative_time(post.created_at),
    )


@router.get("/{meeting_id}/posts/{post_id}", response_model=MeetingPostItem)
def get_meeting_post(
    meeting_id: str,
    post_id: str,
    db: Session = Depends(get_db),
) -> MeetingPostItem:
    meeting = _get_meeting_or_404(db, meeting_id)
    post = db.scalars(
        select(MeetingPost)
        .options(joinedload(MeetingPost.author))
        .where(
            MeetingPost.id == post_id,
            MeetingPost.meeting_id == meeting_id,
        ),
    ).first()
    if post is None:
        raise _error(
            status.HTTP_404_NOT_FOUND,
            "post_not_found",
            "게시글을 찾을 수 없어요.",
        )
    places_by_id, users_by_id = _collect_post_mentions(db, [post])
    return _post_to_item_resolved(
        post,
        meeting.host_user_id,
        places_by_id,
        users_by_id,
    )


@router.get("/{meeting_id}/posts", response_model=MeetingPostListResponse)
def list_meeting_posts(
    meeting_id: str,
    board_type: str | None = Query(default=None),
    limit: int = Query(default=20, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
    db: Session = Depends(get_db),
) -> MeetingPostListResponse:
    meeting = _get_meeting_or_404(db, meeting_id)

    count_stmt = select(func.count()).select_from(MeetingPost).where(
        MeetingPost.meeting_id == meeting_id,
    )
    if board_type:
        count_stmt = count_stmt.where(MeetingPost.board_type == board_type)
    total = db.scalar(count_stmt) or 0

    board_rows = db.execute(
        select(MeetingPost.board_type, func.count())
        .where(MeetingPost.meeting_id == meeting_id)
        .group_by(MeetingPost.board_type),
    ).all()
    board_counts = {row[0]: int(row[1]) for row in board_rows}

    stmt = (
        select(MeetingPost)
        .options(joinedload(MeetingPost.author))
        .where(MeetingPost.meeting_id == meeting_id)
    )
    if board_type:
        stmt = stmt.where(MeetingPost.board_type == board_type)
    stmt = stmt.order_by(MeetingPost.created_at.desc()).offset(offset).limit(limit)
    posts = db.scalars(stmt).all()

    places_by_id, users_by_id = _collect_post_mentions(db, posts)
    items = [
        _post_to_item_resolved(p, meeting.host_user_id, places_by_id, users_by_id)
        for p in posts
    ]
    return MeetingPostListResponse(
        items=items,
        total=int(total),
        board_counts=board_counts,
    )


@router.post(
    "/{meeting_id}/posts",
    response_model=MeetingPostItem,
    status_code=status.HTTP_201_CREATED,
)
def create_meeting_post(
    meeting_id: str,
    body: MeetingPostCreateRequest,
    db: Session = Depends(get_db),
) -> MeetingPostItem:
    meeting = _get_meeting_or_404(db, meeting_id)

    content = body.content.strip()
    if not content:
        raise _error(
            status.HTTP_400_BAD_REQUEST,
            "invalid_content",
            "내용을 입력해 주세요.",
        )

    image_urls = body.image_urls or []
    if len(image_urls) > MAX_IMAGE_URLS:
        raise _error(
            status.HTTP_400_BAD_REQUEST,
            "too_many_images",
            f"이미지는 최대 {MAX_IMAGE_URLS}장까지 등록할 수 있어요.",
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

    post = MeetingPost(
        id=generate_id("mpst"),
        meeting_id=meeting_id,
        author_user_id=author.id,
        board_type=body.board_type.strip() or "free",
        content=content,
    )
    post.image_urls = image_urls
    post.mentions = {"places": place_ids, "users": user_ids}

    try:
        db.add(post)
        record_post_mention_signals(
            db,
            meeting_id=meeting_id,
            post_id=post.id,
            user_id=author.id,
            place_ids=place_ids,
        )
        db.commit()
        db.refresh(post)
        post.author = author
    except Exception:
        db.rollback()
        raise

    places_by_id, users_by_id = _collect_post_mentions(db, [post])
    return _post_to_item_resolved(
        post,
        meeting.host_user_id,
        places_by_id,
        users_by_id,
    )
