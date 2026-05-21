"""Owner dashboard time-slot classification and recommendations."""

from __future__ import annotations

from datetime import datetime, timedelta, timezone

KST = timezone(timedelta(hours=9))

TIMESLOT_ORDER = [
    "weekday_morning",
    "weekday_lunch",
    "weekday_evening",
    "weekend_afternoon",
    "weekend_evening",
]

TIMESLOT_LABELS: dict[str, str] = {
    "weekday_morning": "평일 오전 (6-12시)",
    "weekday_lunch": "평일 점심 (12-14시)",
    "weekday_evening": "평일 저녁 (18-22시)",
    "weekend_afternoon": "주말 오후 (12-18시)",
    "weekend_evening": "주말 저녁 (18-22시)",
}

PEAK_RECOMMENDATIONS: dict[str, str] = {
    "weekday_morning": (
        "평일 오전이 가장 인기 있어요. 오전 단체 예약 안내를 추가하면 "
        "더 많은 모임이 올 수 있어요."
    ),
    "weekday_lunch": (
        "평일 점심이 가장 인기 있어요. 점심 세트나 단체 메뉴 안내를 추가하면 "
        "더 많은 모임이 올 수 있어요."
    ),
    "weekday_evening": (
        "평일 저녁이 가장 인기 있어요. 단체석 사전 예약 안내를 추가하면 "
        "더 많은 모임이 올 수 있어요."
    ),
    "weekend_afternoon": (
        "주말 오후가 가장 인기 있어요. 주말 단체석 안내를 추가하면 "
        "더 많은 모임이 올 수 있어요."
    ),
    "weekend_evening": (
        "주말 저녁이 가장 인기 있어요. 저녁 단체 예약 안내를 추가하면 "
        "더 많은 모임이 올 수 있어요."
    ),
}

DEFAULT_PEAK_RECOMMENDATION = (
    "방문이 많은 시간대에 맞춰 단체 예약 안내를 추가하면 "
    "더 많은 모임이 올 수 있어요."
)


def classify_timeslot(scheduled_at: datetime) -> str | None:
    if scheduled_at.tzinfo is None:
        local = scheduled_at.replace(tzinfo=timezone.utc).astimezone(KST)
    else:
        local = scheduled_at.astimezone(KST)

    hour = local.hour
    is_weekend = local.weekday() >= 5

    if is_weekend:
        if 12 <= hour < 18:
            return "weekend_afternoon"
        if 18 <= hour < 22:
            return "weekend_evening"
        return None

    if 6 <= hour < 12:
        return "weekday_morning"
    if 12 <= hour < 14:
        return "weekday_lunch"
    if 18 <= hour < 22:
        return "weekday_evening"
    return None


def peak_recommendation_for_slot(slot_key: str | None) -> str:
    if slot_key is None:
        return DEFAULT_PEAK_RECOMMENDATION
    return PEAK_RECOMMENDATIONS.get(slot_key, DEFAULT_PEAK_RECOMMENDATION)
