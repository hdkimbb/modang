"""Seed development data: users, places, place_signals.

Run from backend/: python -m app.seed
"""

from __future__ import annotations

import random
from datetime import datetime, timedelta, timezone

from sqlalchemy import delete, func, select

from app.db import SessionLocal
from app.models import (
    Meeting,
    MeetingEvent,
    MeetingMember,
    MeetingPost,
    MeetingPostComment,
    MeetingRating,
    Place,
    PlaceRecommendationTarget,
    PlaceSignal,
    User,
)
from app.services.id import generate_id

USER_IDS = ["u_001", "u_002", "u_003", "u_004", "u_005"]

USERS = [
    {"id": "u_001", "name": "민지", "region": "성수동"},
    {"id": "u_002", "name": "준호", "region": "성수동"},
    {"id": "u_003", "name": "지영", "region": "성수동"},
    {"id": "u_004", "name": "태호", "region": "연남동"},
    {"id": "u_005", "name": "수민", "region": "역삼동"},
]

OWNER_USER = {
    "id": "usr_owner_001",
    "name": "김사장",
    "region": "역삼동",
    "role": "owner",
    "owned_place_id": "plc_001",
}

EXTRA_MEETINGS = [
    {
        "id": "mtg_002",
        "host_user_id": "u_002",
        "name": "역삼 러닝크루",
        "category": "운동",
        "district": "역삼동",
        "member_count": 12,
    },
    {
        "id": "mtg_003",
        "host_user_id": "u_005",
        "name": "강남 스터디",
        "category": "자기계발",
        "district": "역삼동",
        "member_count": 6,
    },
]

# Demo visits at 스타벅스 강남점 (plc_001) for owner dashboard
PLACE_VISIT_EVENTS = [
    {
        "id": "evt_own_001",
        "meeting_id": "mtg_001",
        "place_id": "plc_001",
        "title": "5월 정기 모임",
        "scheduled_at": datetime(2026, 5, 8, 19, 0, tzinfo=timezone.utc),
        "attendee_count": 5,
    },
    {
        "id": "evt_own_002",
        "meeting_id": "mtg_002",
        "place_id": "plc_001",
        "title": "러닝 후 커피",
        "scheduled_at": datetime(2026, 5, 12, 10, 0, tzinfo=timezone.utc),
        "attendee_count": 8,
    },
    {
        "id": "evt_own_003",
        "meeting_id": "mtg_003",
        "place_id": "plc_001",
        "title": "주간 스터디",
        "scheduled_at": datetime(2026, 5, 15, 14, 0, tzinfo=timezone.utc),
        "attendee_count": 6,
    },
    {
        "id": "evt_own_004",
        "meeting_id": "mtg_001",
        "place_id": "plc_001",
        "title": "독서 토론",
        "scheduled_at": datetime(2026, 5, 18, 19, 30, tzinfo=timezone.utc),
        "attendee_count": 5,
    },
    {
        "id": "evt_own_005",
        "meeting_id": "mtg_002",
        "place_id": "plc_001",
        "title": "이번 주 러닝 모임",
        "scheduled_at": datetime(2026, 5, 20, 9, 0, tzinfo=timezone.utc),
        "attendee_count": 10,
    },
    {
        "id": "evt_own_006",
        "meeting_id": "mtg_001",
        "place_id": "plc_001",
        "title": "5월 마무리 모임",
        "scheduled_at": datetime(2026, 5, 22, 19, 0, tzinfo=timezone.utc),
        "attendee_count": 5,
    },
    {
        "id": "evt_own_007",
        "meeting_id": "mtg_003",
        "place_id": "plc_001",
        "title": "시험 대비 스터디",
        "scheduled_at": datetime(2026, 5, 25, 14, 0, tzinfo=timezone.utc),
        "attendee_count": 6,
    },
    {
        "id": "evt_own_008",
        "meeting_id": "mtg_002",
        "place_id": "plc_001",
        "title": "주말 러닝",
        "scheduled_at": datetime(2026, 5, 28, 8, 0, tzinfo=timezone.utc),
        "attendee_count": 12,
    },
    {
        "id": "evt_own_009",
        "meeting_id": "mtg_001",
        "place_id": "plc_001",
        "title": "6월 첫 모임",
        "scheduled_at": datetime(2026, 6, 5, 19, 0, tzinfo=timezone.utc),
        "attendee_count": 5,
    },
    {
        "id": "evt_own_010",
        "meeting_id": "mtg_003",
        "place_id": "plc_001",
        "title": "6월 스터디",
        "scheduled_at": datetime(2026, 4, 20, 14, 0, tzinfo=timezone.utc),
        "attendee_count": 4,
    },
]

PLACES = [
    {
        "id": "plc_001",
        "name": "스타벅스 강남점",
        "address": "서울 강남구 강남대로 390",
        "lat": 37.4979,
        "lng": 127.0276,
        "district": "역삼동",
        "category": "cafe",
        "owner_message": (
            "독서모임 환영합니다! 조용한 2층 공간, 콘센트 완비, 음료 리필 가능합니다."
        ),
        "owner_message_active": True,
    },
    {
        "id": "plc_002",
        "name": "당근카페 역삼점",
        "address": "서울 강남구 역삼로 123",
        "lat": 37.5001,
        "lng": 127.0364,
        "district": "역삼동",
        "category": "cafe",
    },
    {
        "id": "plc_003",
        "name": "성수동 코너 카페",
        "address": "서울 성동구 성수동1가 12-3",
        "lat": 37.5445,
        "lng": 127.0559,
        "district": "성수동",
        "category": "cafe",
    },
    {
        "id": "plc_004",
        "name": "연남 브런치 카페",
        "address": "서울 마포구 연남동 223-14",
        "lat": 37.5651,
        "lng": 126.9253,
        "district": "연남동",
        "category": "cafe",
    },
    {
        "id": "plc_005",
        "name": "투썸플레이스 성수",
        "address": "서울 성동구 성수이로 118",
        "lat": 37.5412,
        "lng": 127.0591,
        "district": "성수동",
        "category": "cafe",
    },
    {
        "id": "plc_006",
        "name": "○○ 키친",
        "address": "서울 성동구 성수동2가 18-7",
        "lat": 37.5438,
        "lng": 127.0582,
        "district": "성수동",
        "category": "restaurant",
    },
    {
        "id": "plc_007",
        "name": "강남 곱창집",
        "address": "서울 강남구 테헤란로 152",
        "lat": 37.5012,
        "lng": 127.0396,
        "district": "역삼동",
        "category": "restaurant",
    },
    {
        "id": "plc_008",
        "name": "연남 파스타",
        "address": "서울 마포구 연남동 45-11",
        "lat": 37.5634,
        "lng": 126.9238,
        "district": "연남동",
        "category": "restaurant",
    },
    {
        "id": "plc_009",
        "name": "성수 와인바",
        "address": "서울 성동구 성수동1가 55-2",
        "lat": 37.5451,
        "lng": 127.0542,
        "district": "성수동",
        "category": "restaurant",
    },
    {
        "id": "plc_010",
        "name": "역삼 라멘",
        "address": "서울 강남구 역삼동 826-21",
        "lat": 37.4998,
        "lng": 127.0341,
        "district": "역삼동",
        "category": "restaurant",
    },
]

MEETING_ID = "mtg_001"

MEETING = {
    "id": MEETING_ID,
    "host_user_id": "u_001",
    "name": "성수 독서모임",
    "category": "book_club",
    "district": "성수동",
    "member_count": 5,
}

MEETING_MEMBERS = [
    {"id": "mm_001", "meeting_id": MEETING_ID, "user_id": "u_001", "role": "host"},
    {"id": "mm_002", "meeting_id": MEETING_ID, "user_id": "u_002", "role": "member"},
    {"id": "mm_003", "meeting_id": MEETING_ID, "user_id": "u_003", "role": "member"},
    {"id": "mm_004", "meeting_id": MEETING_ID, "user_id": "u_004", "role": "member"},
    {"id": "mm_005", "meeting_id": MEETING_ID, "user_id": "u_005", "role": "member"},
]

SIGNAL_COUNTS: dict[str, int] = {
    "plc_001": 47,
    "plc_002": 12,
    "plc_003": 8,
}

SEASON_START = datetime(2026, 3, 1, tzinfo=timezone.utc)
SEASON_END = datetime(2026, 5, 31, 23, 59, 59, tzinfo=timezone.utc)
KST = timezone(timedelta(hours=9))
SEED_REFERENCE_NOW = datetime(2026, 5, 21, 12, 0, tzinfo=KST)

MEETING_POSTS = [
    {
        "id": "mpst_001",
        "meeting_id": "mtg_001",
        "author_user_id": "u_001",
        "board_type": "free",
        "content": "사진도 글도 쓸 수 있어",
        "image_urls": ["https://picsum.photos/seed/post1/800/600"],
        "view_count": 7,
        "like_count": 3,
        "comment_count": 3,
        "minutes_ago": 2,
    },
    {
        "id": "mpst_002",
        "meeting_id": "mtg_001",
        "author_user_id": "u_002",
        "board_type": "free",
        "content": "이번 주 토요일 모임 잘 부탁드려요",
        "image_urls": None,
        "view_count": 4,
        "like_count": 1,
        "comment_count": 0,
        "minutes_ago": 180,
    },
    {
        "id": "mpst_003",
        "meeting_id": "mtg_001",
        "author_user_id": "u_003",
        "board_type": "free",
        "content": "다음 모임은 @성수동 코너 카페 에서 할까요?",
        "mention_places": ["plc_003"],
        "mention_users": [],
        "post_signal": True,
        "image_urls": ["https://picsum.photos/seed/post2/800/600"],
        "view_count": 9,
        "like_count": 5,
        "comment_count": 1,
        "minutes_ago": 1440,
    },
    {
        "id": "mpst_004",
        "meeting_id": "mtg_002",
        "author_user_id": "u_002",
        "board_type": "free",
        "content": "다음 모임 코스 추천",
        "image_urls": None,
        "view_count": 3,
        "like_count": 0,
        "comment_count": 0,
        "minutes_ago": 60,
    },
    {
        "id": "mpst_005",
        "meeting_id": "mtg_002",
        "author_user_id": "u_005",
        "board_type": "free",
        "content": "오늘 @투썸플레이스 성수 에서 만났는데 @준호 님도 오셨으면 좋겠어요",
        "mention_places": ["plc_005"],
        "mention_users": ["u_002"],
        "post_signal": True,
        "image_urls": ["https://picsum.photos/seed/post3/800/600"],
        "view_count": 10,
        "like_count": 4,
        "comment_count": 2,
        "minutes_ago": 30,
    },
]

MEETING_POST_COMMENTS = [
    {
        "id": "mpcm_001",
        "post_id": "mpst_001",
        "author_user_id": "u_002",
        "content": "사진 좋네요!",
        "mentions": [],
        "minutes_ago": 1,
        "signal": False,
    },
    {
        "id": "mpcm_002",
        "post_id": "mpst_001",
        "author_user_id": "u_003",
        "content": "@민지 님 어디서 찍으셨어요?",
        "mention_places": [],
        "mention_users": ["u_001"],
        "minutes_ago": 5,
        "signal": False,
    },
    {
        "id": "mpcm_003",
        "post_id": "mpst_001",
        "author_user_id": "u_004",
        "content": "장소 추천드려요 @당근카페 역삼점",
        "mention_places": ["plc_002"],
        "mention_users": [],
        "minutes_ago": 10,
        "signal": True,
    },
]


def _event_status_for(scheduled_at: datetime) -> str:
    scheduled = scheduled_at
    if scheduled.tzinfo is None:
        scheduled = scheduled.replace(tzinfo=timezone.utc)
    return "ended" if scheduled < SEED_REFERENCE_NOW else "scheduled"


def _random_occurred_at() -> datetime:
    delta_seconds = int((SEASON_END - SEASON_START).total_seconds())
    offset = random.randint(0, delta_seconds)
    return SEASON_START + timedelta(seconds=offset)


def _build_signals_for_place(
    place: dict,
    count: int,
) -> list[PlaceSignal]:
    signals: list[PlaceSignal] = []

    for i in range(count):
        signal_type = "selected"
        weight = 1.0
        user_id = random.choice(USER_IDS)
        signals.append(
            PlaceSignal(
                id=generate_id("sig"),
                place_id=place["id"],
                signal_type=signal_type,
                weight=weight,
                source_ref=f"evt_{place['id']}_{i + 1:03d}",
                user_id=user_id,
                occurred_at=_random_occurred_at(),
                is_void=False,
                meta={
                    "district": place["district"],
                    "category": place["category"],
                },
            ),
        )

    return signals


def clear_all(session) -> None:
    session.execute(delete(MeetingRating))
    session.execute(delete(MeetingPostComment))
    session.execute(delete(MeetingPost))
    session.execute(delete(MeetingEvent))
    session.execute(delete(MeetingMember))
    session.execute(delete(Meeting))
    session.execute(delete(PlaceRecommendationTarget))
    session.execute(delete(PlaceSignal))
    session.execute(delete(Place))
    session.execute(delete(User))
    session.flush()


def upsert_owner_user(session) -> None:
    """Insert or update owner user without wiping other data."""
    existing = session.get(User, OWNER_USER["id"])
    if existing is not None:
        existing.name = OWNER_USER["name"]
        existing.region = OWNER_USER["region"]
        existing.role = OWNER_USER["role"]
        existing.owned_place_id = OWNER_USER["owned_place_id"]
        return
    session.add(
        User(
            id=OWNER_USER["id"],
            name=OWNER_USER["name"],
            region=OWNER_USER["region"],
            avatar_url=None,
            role=OWNER_USER["role"],
            owned_place_id=OWNER_USER["owned_place_id"],
        ),
    )


def seed_users(session) -> int:
    for row in USERS:
        session.add(
            User(
                id=row["id"],
                name=row["name"],
                region=row["region"],
                avatar_url=None,
                role=row.get("role", "user"),
                owned_place_id=row.get("owned_place_id"),
            ),
        )
    session.add(
        User(
            id=OWNER_USER["id"],
            name=OWNER_USER["name"],
            region=OWNER_USER["region"],
            avatar_url=None,
            role=OWNER_USER["role"],
            owned_place_id=OWNER_USER["owned_place_id"],
        ),
    )
    return len(USERS) + 1


def seed_places(session) -> int:
    for row in PLACES:
        session.add(Place(**row))
    return len(PLACES)


def seed_meetings(session) -> int:
    session.add(Meeting(**MEETING))
    for row in MEETING_MEMBERS:
        session.add(MeetingMember(**row))
    for row in EXTRA_MEETINGS:
        session.add(Meeting(**row))
    return 1 + len(EXTRA_MEETINGS)


def seed_place_visit_events(session) -> int:
    for row in PLACE_VISIT_EVENTS:
        status = _event_status_for(row["scheduled_at"])
        session.add(
            MeetingEvent(
                id=row["id"],
                meeting_id=row["meeting_id"],
                place_id=row["place_id"],
                title=row["title"],
                scheduled_at=row["scheduled_at"],
                attendee_count=row["attendee_count"],
                status=status,
            ),
        )
        meeting = session.get(Meeting, row["meeting_id"])
        if meeting is not None:
            session.add(
                PlaceSignal(
                    id=generate_id("sig"),
                    place_id=row["place_id"],
                    signal_type="selected",
                    weight=1.0,
                    source_ref=row["id"],
                    user_id=meeting.host_user_id,
                    occurred_at=row["scheduled_at"],
                    is_void=False,
                    meta={
                        "meeting_id": row["meeting_id"],
                        "category": meeting.category,
                        "district": meeting.district,
                    },
                ),
            )
    return len(PLACE_VISIT_EVENTS)


def seed_meeting_post_comments(session) -> int:
    meeting = session.get(Meeting, MEETING_ID)
    for row in MEETING_POST_COMMENTS:
        created_at = SEED_REFERENCE_NOW - timedelta(minutes=row["minutes_ago"])
        comment = MeetingPostComment(
            id=row["id"],
            post_id=row["post_id"],
            author_user_id=row["author_user_id"],
            content=row["content"],
            created_at=created_at,
            updated_at=created_at,
        )
        comment.mentions = {
            "places": row.get("mention_places") or row.get("mentions") or [],
            "users": row.get("mention_users") or [],
        }
        session.add(comment)

        place_ids = comment.mention_place_ids
        if row.get("signal") and place_ids:
            for place_id in place_ids:
                place = session.get(Place, place_id)
                session.add(
                    PlaceSignal(
                        id=generate_id("sig"),
                        place_id=place_id,
                        signal_type="mentioned",
                        weight=0.5,
                        source_ref=row["id"],
                        user_id=row["author_user_id"],
                        occurred_at=created_at,
                        is_void=False,
                        meta={
                            "meeting_id": meeting.id if meeting else MEETING_ID,
                            "post_id": row["post_id"],
                            "comment_id": row["id"],
                            "district": place.district if place else None,
                            "category": meeting.category if meeting else None,
                        },
                    ),
                )
    return len(MEETING_POST_COMMENTS)


def seed_meeting_posts(session) -> int:
    for row in MEETING_POSTS:
        created_at = SEED_REFERENCE_NOW - timedelta(minutes=row["minutes_ago"])
        post = MeetingPost(
            id=row["id"],
            meeting_id=row["meeting_id"],
            author_user_id=row["author_user_id"],
            board_type=row["board_type"],
            content=row["content"],
            view_count=row["view_count"],
            like_count=row["like_count"],
            comment_count=row["comment_count"],
            created_at=created_at,
            updated_at=created_at,
        )
        post.image_urls = row.get("image_urls")
        post.mentions = {
            "places": row.get("mention_places") or [],
            "users": row.get("mention_users") or [],
        }
        session.add(post)

        if row.get("post_signal") and post.mention_place_ids:
            meeting = session.get(Meeting, row["meeting_id"])
            for place_id in post.mention_place_ids:
                place = session.get(Place, place_id)
                session.add(
                    PlaceSignal(
                        id=generate_id("sig"),
                        place_id=place_id,
                        signal_type="mentioned",
                        weight=0.5,
                        source_ref=row["id"],
                        user_id=row["author_user_id"],
                        occurred_at=created_at,
                        is_void=False,
                        meta={
                            "meeting_id": row["meeting_id"],
                            "post_id": row["id"],
                            "district": place.district if place else None,
                            "category": meeting.category if meeting else None,
                        },
                    ),
                )
    return len(MEETING_POSTS)


def seed_meeting_ratings(session) -> int:
    ended_events = session.scalars(
        select(MeetingEvent).where(MeetingEvent.status == "ended"),
    ).all()
    created = 0

    for event in ended_events:
        review_count = random.randint(2, min(5, len(USER_IDS)))
        reviewers = random.sample(USER_IDS, review_count)
        for user_id in reviewers:
            rating_value = random.randint(3, 5)
            would_revisit = random.random() < 0.7
            rating_id = generate_id("rtg")
            session.add(
                MeetingRating(
                    id=rating_id,
                    event_id=event.id,
                    user_id=user_id,
                    rating=rating_value,
                    would_revisit=would_revisit,
                ),
            )
            session.add(
                PlaceSignal(
                    id=generate_id("sig"),
                    place_id=event.place_id,
                    signal_type="rated",
                    weight=float(rating_value),
                    source_ref=event.id,
                    user_id=user_id,
                    occurred_at=event.scheduled_at,
                    is_void=False,
                    meta={"event_id": event.id, "rating": rating_value},
                ),
            )
            created += 1

    return created


def seed_signals(session) -> list[PlaceSignal]:
    all_signals: list[PlaceSignal] = []
    for place in PLACES:
        count = SIGNAL_COUNTS.get(place["id"], 0)
        if count > 0:
            batch = _build_signals_for_place(place, count)
            all_signals.extend(batch)
            session.add_all(batch)
    return all_signals


def print_summary(
    session,
    signal_count: int,
    meeting_count: int,
    event_count: int = 0,
    rating_count: int = 0,
    post_count: int = 0,
    comment_count: int = 0,
) -> None:
    user_count = session.scalar(select(func.count()).select_from(User)) or 0
    place_count = session.scalar(select(func.count()).select_from(Place)) or 0
    member_count = session.scalar(select(func.count()).select_from(MeetingMember)) or 0

    print(
        f"Seeded {user_count} users, {place_count} places, "
        f"{signal_count} signals, {meeting_count} meetings ({member_count} members), "
        f"{event_count} place visit events, {rating_count} ratings, "
        f"{post_count} posts, {comment_count} comments",
    )

    rows = session.execute(
        select(PlaceSignal.place_id, func.count())
        .where(PlaceSignal.is_void.is_(False))
        .group_by(PlaceSignal.place_id)
        .order_by(func.count().desc()),
    ).all()

    if rows:
        parts = [f"{place_id} ({cnt})" for place_id, cnt in rows]
        print(f"Top places by signals: {', '.join(parts)}")
    else:
        print("Top places by signals: (none)")


def main() -> None:
    random.seed(42)
    session = SessionLocal()
    try:
        clear_all(session)
        seed_users(session)
        seed_places(session)
        signals = seed_signals(session)
        meetings = seed_meetings(session)
        session.flush()
        events = seed_place_visit_events(session)
        session.flush()
        ratings_count = seed_meeting_ratings(session)
        posts_count = seed_meeting_posts(session)
        session.flush()
        comments_count = seed_meeting_post_comments(session)
        session.commit()
        print_summary(
            session,
            len(signals),
            meetings,
            events,
            ratings_count,
            posts_count,
            comments_count,
        )
    except Exception:
        session.rollback()
        raise
    finally:
        session.close()


if __name__ == "__main__":
    main()
