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
    Place,
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

PLACES = [
    {
        "id": "plc_001",
        "name": "스타벅스 강남점",
        "address": "서울 강남구 강남대로 390",
        "lat": 37.4979,
        "lng": 127.0276,
        "district": "역삼동",
        "category": "cafe",
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


def _random_occurred_at() -> datetime:
    delta_seconds = int((SEASON_END - SEASON_START).total_seconds())
    offset = random.randint(0, delta_seconds)
    return SEASON_START + timedelta(seconds=offset)


def _build_signals_for_place(
    place: dict,
    count: int,
) -> list[PlaceSignal]:
    signals: list[PlaceSignal] = []
    selected_count = max(1, int(count * 0.35))

    for i in range(count):
        is_selected = i < selected_count
        signal_type = "selected" if is_selected else "rated"
        weight = 1.0 if is_selected else float(random.choice([3, 4, 4, 5, 5]))
        user_id = random.choice(USER_IDS)
        rating_meta = None if is_selected else {"rating": int(weight)}

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
                    **(rating_meta or {}),
                },
            ),
        )

    return signals


def clear_all(session) -> None:
    session.execute(delete(MeetingEvent))
    session.execute(delete(MeetingMember))
    session.execute(delete(Meeting))
    session.execute(delete(PlaceSignal))
    session.execute(delete(Place))
    session.execute(delete(User))
    session.flush()


def seed_users(session) -> int:
    for row in USERS:
        session.add(
            User(
                id=row["id"],
                name=row["name"],
                region=row["region"],
                avatar_url=None,
            ),
        )
    return len(USERS)


def seed_places(session) -> int:
    for row in PLACES:
        session.add(Place(**row))
    return len(PLACES)


def seed_meeting(session) -> int:
    session.add(Meeting(**MEETING))
    for row in MEETING_MEMBERS:
        session.add(MeetingMember(**row))
    return 1


def seed_signals(session) -> list[PlaceSignal]:
    all_signals: list[PlaceSignal] = []
    for place in PLACES:
        count = SIGNAL_COUNTS.get(place["id"], 0)
        if count > 0:
            batch = _build_signals_for_place(place, count)
            all_signals.extend(batch)
            session.add_all(batch)
    return all_signals


def print_summary(session, signal_count: int, meeting_count: int) -> None:
    user_count = session.scalar(select(func.count()).select_from(User)) or 0
    place_count = session.scalar(select(func.count()).select_from(Place)) or 0
    member_count = session.scalar(select(func.count()).select_from(MeetingMember)) or 0

    print(
        f"Seeded {user_count} users, {place_count} places, "
        f"{signal_count} signals, {meeting_count} meetings ({member_count} members)",
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
        meetings = seed_meeting(session)
        session.commit()
        print_summary(session, len(signals), meetings)
    except Exception:
        session.rollback()
        raise
    finally:
        session.close()


if __name__ == "__main__":
    main()
