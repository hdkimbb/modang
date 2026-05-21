"""Real-time district × category ranking from place signals."""

from __future__ import annotations

from datetime import datetime, timedelta, timezone

from sqlalchemy import case, func, select
from sqlalchemy.orm import Session

from app.models.meeting_event import MeetingEvent
from app.models.meeting_rating import MeetingRating
from app.models.place import Place
from app.models.place_signal import PlaceSignal

KST = timezone(timedelta(hours=9))

MEETUP_SIGNAL_TYPES = ("selected", "rated")
MENTION_SIGNAL_TYPES = ("mention",)
REVIEW_SIGNAL_TYPES = ("review",)


def current_season_label(now: datetime | None = None) -> str:
    ref = now or datetime.now(KST)
    if ref.tzinfo is None:
        ref = ref.replace(tzinfo=KST)
    else:
        ref = ref.astimezone(KST)
    month = ref.month
    year = ref.year
    if month in (3, 4, 5):
        season = "Spring"
    elif month in (6, 7, 8):
        season = "Summer"
    elif month in (9, 10, 11):
        season = "Fall"
    else:
        season = "Winter"
    return f"{season} {year}"


def fetch_ranking(
    db: Session,
    district: str,
    category: str,
    limit: int = 10,
) -> list[dict]:
    now = datetime.now(timezone.utc)
    since_30d = now - timedelta(days=30)

    meetup_score = func.coalesce(
        func.sum(
            case(
                (
                    PlaceSignal.signal_type.in_(MEETUP_SIGNAL_TYPES),
                    PlaceSignal.weight,
                ),
                else_=0.0,
            ),
        ),
        0.0,
    )
    mention_score = func.coalesce(
        func.sum(
            case(
                (
                    PlaceSignal.signal_type.in_(MENTION_SIGNAL_TYPES),
                    PlaceSignal.weight,
                ),
                else_=0.0,
            ),
        ),
        0.0,
    )
    review_score = func.coalesce(
        func.sum(
            case(
                (
                    PlaceSignal.signal_type.in_(REVIEW_SIGNAL_TYPES),
                    PlaceSignal.weight,
                ),
                else_=0.0,
            ),
        ),
        0.0,
    )
    total_score = meetup_score + mention_score + review_score

    score_rows = db.execute(
        select(
            Place.id,
            Place.name,
            meetup_score.label("meetup_signal"),
            mention_score.label("mention"),
            review_score.label("review"),
            total_score.label("total"),
        )
        .outerjoin(
            PlaceSignal,
            (PlaceSignal.place_id == Place.id) & (PlaceSignal.is_void.is_(False)),
        )
        .where(Place.district == district, Place.category == category)
        .group_by(Place.id, Place.name)
        .having(total_score > 0)
        .order_by(total_score.desc(), Place.name.asc())
        .limit(limit),
    ).all()

    if not score_rows:
        return []

    place_ids = [row.id for row in score_rows]

    meetings_30d = {
        pid: int(cnt)
        for pid, cnt in db.execute(
            select(MeetingEvent.place_id, func.count(MeetingEvent.id))
            .where(
                MeetingEvent.place_id.in_(place_ids),
                MeetingEvent.scheduled_at >= since_30d,
            )
            .group_by(MeetingEvent.place_id),
        ).all()
    }

    rating_rows = db.execute(
        select(
            MeetingEvent.place_id,
            func.avg(MeetingRating.rating),
        )
        .join(MeetingRating, MeetingRating.event_id == MeetingEvent.id)
        .where(MeetingEvent.place_id.in_(place_ids))
        .group_by(MeetingEvent.place_id),
    ).all()
    avg_by_place = {
        pid: round(float(avg), 1) if avg is not None else None
        for pid, avg in rating_rows
    }

    items: list[dict] = []
    for rank, row in enumerate(score_rows, start=1):
        items.append(
            {
                "rank": rank,
                "place_id": row.id,
                "name": row.name,
                "meetup_signal": round(float(row.meetup_signal), 1),
                "mention": round(float(row.mention), 1),
                "review": round(float(row.review), 1),
                "total": round(float(row.total), 1),
                "total_meetings_30d": meetings_30d.get(row.id, 0),
                "avg_rating": avg_by_place.get(row.id),
            },
        )
    return items
