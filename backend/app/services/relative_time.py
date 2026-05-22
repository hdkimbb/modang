"""Relative time labels in Korean (KST)."""

from __future__ import annotations

from datetime import datetime, timedelta, timezone

KST = timezone(timedelta(hours=9))


def _to_kst(dt: datetime) -> datetime:
    if dt.tzinfo is None:
        return dt.replace(tzinfo=timezone.utc).astimezone(KST)
    return dt.astimezone(KST)


def format_relative_time(created_at: datetime, now: datetime | None = None) -> str:
    ref = _to_kst(now or datetime.now(KST))
    then = _to_kst(created_at)
    diff = ref - then
    seconds = int(diff.total_seconds())

    if seconds < 60:
        return "방금 전"
    minutes = seconds // 60
    if minutes < 60:
        return f"{minutes}분 전"
    hours = minutes // 60
    if hours < 24:
        return f"{hours}시간 전"
    if hours < 48:
        return "어제"
    days = hours // 24
    if days < 7:
        return f"{days}일 전"
    return then.strftime("%Y.%m.%d")
