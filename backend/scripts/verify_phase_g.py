"""Phase G backend verification (tasks 1-5). Run from backend/: .venv\\Scripts\\python.exe scripts/verify_phase_g.py"""

from __future__ import annotations

import json
import sqlite3
import sys
import urllib.error
import urllib.parse
import urllib.request

BASE = "http://localhost:8000/api/v1"


def req(method: str, url: str, body: dict | None = None) -> tuple[int, dict]:
    data = json.dumps(body).encode() if body else None
    headers = {"Content-Type": "application/json"} if body else {}
    request = urllib.request.Request(url, data=data, method=method, headers=headers)
    try:
        with urllib.request.urlopen(request, timeout=10) as res:
            return res.status, json.loads(res.read().decode())
    except urllib.error.HTTPError as exc:
        return exc.code, json.loads(exc.read().decode())


def main() -> int:
    db = sqlite3.connect("modang.db")
    tables = {r[0] for r in db.execute("SELECT name FROM sqlite_master WHERE type='table'")}
    rating_count = db.execute("SELECT COUNT(*) FROM meeting_ratings").fetchone()[0]
    ended_count = db.execute(
        "SELECT COUNT(*) FROM meeting_events WHERE status='ended'",
    ).fetchone()[0]
    db.close()

    print("=== Task 1: meeting_ratings table ===")
    print(f"  table exists: {'meeting_ratings' in tables}")
    print(f"  ratings in DB: {rating_count}")
    print(f"  ended events: {ended_count}")

    print("\n=== Task 2: ratings API ===")
    events_status, events_body = req("GET", f"{BASE}/meetings/mtg_001/events")
    event_id = None
    if events_status == 200 and events_body:
        for ev in events_body if isinstance(events_body, list) else events_body.get("items", []):
            if ev.get("status") == "ended":
                event_id = ev["id"]
                break
    if not event_id:
        row = sqlite3.connect("modang.db").execute(
            "SELECT id FROM meeting_events WHERE status='ended' LIMIT 1",
        ).fetchone()
        event_id = row[0] if row else None

    print(f"  sample ended event_id: {event_id}")
    if event_id:
        s, body = req("GET", f"{BASE}/events/{event_id}/ratings")
        print(f"  GET event ratings: {s} avg={body.get('avg_rating')} count={len(body.get('ratings', []))}")

        s2, err = req(
            "POST",
            f"{BASE}/events/{event_id}/ratings",
            {"user_id": "u_099", "rating": 5, "would_revisit": True},
        )
        print(f"  POST new rating: {s2}")

        s3, err2 = req(
            "POST",
            f"{BASE}/events/{event_id}/ratings",
            {"user_id": "u_099", "rating": 5, "would_revisit": True},
        )
        msg = err2.get("detail", err2)
        if isinstance(msg, dict):
            msg = msg.get("error", msg).get("message", msg)
        print(f"  POST duplicate: {s3} message={msg}")

    print("\n=== Task 3: seed ===")
    print(f"  seeded ratings count (from last seed): {rating_count} (expect > 0)")

    sched_row = sqlite3.connect("modang.db").execute(
        "SELECT id FROM meeting_events WHERE status='scheduled' LIMIT 1",
    ).fetchone()
    if sched_row:
        s_sched, err_sched = req(
            "POST",
            f"{BASE}/events/{sched_row[0]}/ratings",
            {"user_id": "u_001", "rating": 4, "would_revisit": False},
        )
        msg_sched = err_sched.get("detail", err_sched)
        if isinstance(msg_sched, dict):
            msg_sched = msg_sched.get("error", msg_sched).get("message", msg_sched)
        print(f"  POST on scheduled event: {s_sched} message={msg_sched}")

    print("\n=== Task 4: search/recommendations ratings ===")
    search_qs = urllib.parse.urlencode({"q": "\uc2a4\ud0c0\ubc85\uc2a4", "limit": "10"})
    s, search = req("GET", f"{BASE}/places/search?{search_qs}")
    plc001 = next((i for i in search.get("items", []) if i.get("place_id") == "plc_001"), None)
    if plc001:
        print(
            f"  plc_001 search: avg_rating={plc001.get('avg_rating')} "
            f"rating_count={plc001.get('rating_count')} "
            f"would_revisit_rate={plc001.get('would_revisit_rate')}",
        )
    else:
        print(f"  search status={s} items={len(search.get('items', []))}")

    rec_qs = urllib.parse.urlencode({"meeting_category": "\ub3c5\uc11c", "limit": "10"})
    s, rec = req("GET", f"{BASE}/places/recommendations?{rec_qs}")
    rec_plc = next((i for i in rec.get("items", []) if i.get("place_id") == "plc_001"), None)
    if rec_plc:
        print(f"  plc_001 recommendations: avg_rating={rec_plc.get('avg_rating')}")

    print("\n=== Task 5: meeting-history ===")
    s, hist = req("GET", f"{BASE}/places/plc_001/meeting-history?limit=5")
    print(f"  GET meeting-history: {s} items={len(hist.get('items', []))}")
    if hist.get("items"):
        print(f"  first item: {hist['items'][0].get('meeting_name')} status={hist['items'][0].get('status')}")

    s, ratings = req("GET", f"{BASE}/places/plc_001/ratings")
    print(f"  GET place ratings: {s} total={ratings.get('total_count')} avg={ratings.get('avg_rating')}")

    return 0


if __name__ == "__main__":
    sys.exit(main())
