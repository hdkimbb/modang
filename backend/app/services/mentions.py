"""Parse and serialize meeting post / comment mentions JSON."""

from __future__ import annotations

import json
from typing import TypedDict

MAX_MENTIONS_PER_TYPE = 10


class MentionsData(TypedDict):
    places: list[str]
    users: list[str]


def empty_mentions() -> MentionsData:
    return {"places": [], "users": []}


def parse_mentions_raw(raw: str | None) -> MentionsData:
    if not raw:
        return empty_mentions()
    try:
        data = json.loads(raw)
    except json.JSONDecodeError:
        return empty_mentions()
    if isinstance(data, list):
        return {
            "places": [str(pid) for pid in data if pid][:MAX_MENTIONS_PER_TYPE],
            "users": [],
        }
    if isinstance(data, dict):
        places = data.get("places") or []
        users = data.get("users") or []
        return {
            "places": [
                str(pid) for pid in places if pid
            ][:MAX_MENTIONS_PER_TYPE],
            "users": [
                str(uid) for uid in users if uid
            ][:MAX_MENTIONS_PER_TYPE],
        }
    return empty_mentions()


def dump_mentions(
    places: list[str] | None,
    users: list[str] | None = None,
) -> str | None:
    place_ids = list(dict.fromkeys(places or []))[:MAX_MENTIONS_PER_TYPE]
    user_ids = list(dict.fromkeys(users or []))[:MAX_MENTIONS_PER_TYPE]
    if not place_ids and not user_ids:
        return None
    return json.dumps({"places": place_ids, "users": user_ids})
