# Week 1 — API Specification

> 모당 (Modang) 백엔드 API 명세

---

## Conventions

- Base URL: `/api/v1`
- Auth: Bearer token (v1에선 stub — `Authorization: Bearer demo-{user_id}`)
- Format: JSON
- Time: ISO 8601 UTC
- Pagination: cursor 기반 (`?cursor=...&limit=20`)
- Error 형식:
  ```json
  {
    "error": {
      "code": "place_required",
      "message": "장소를 선택해야 모임 일정을 등록할 수 있어요.",
      "details": {}
    }
  }
  ```

---

## 1. Users

### `GET /api/v1/me`
현재 로그인 사용자 정보.

**Response 200**:
```json
{
  "id": "u_001",
  "name": "민지",
  "region": "성수동",
  "avatar_url": "..."
}
```

### `GET /api/v1/users/{user_id}`
다른 사용자 기본 정보 (공개 정보만).

---

## 2. Places

### `GET /api/v1/places/search`
장소 검색 (모임 일정 등록 시).

**Query Params**:
- `q` (string, required) — 검색어
- `district` (string, optional) — 동 필터
- `category` (string, optional) — 카테고리 필터
- `lat`, `lng` (float, optional) — 위치 바이어스
- `cursor`, `limit` (default 20, max 50)

**Response 200**:
```json
{
  "items": [
    {
      "place_id": "plc_001",
      "name": "성수동 코너 카페",
      "address": "서울 성동구 성수동1가 ...",
      "district": "성수동",
      "category": "cafe",
      "lat": 37.544,
      "lng": 127.055,
      "business_id": "biz_001",
      "verified": true,
      "thumbnail_url": "..."
    }
  ],
  "next_cursor": "eyJvIjoyMH0="
}
```

### `POST /api/v1/places`
외부 지도 장소를 우리 DB에 lazy creation.

**Body**:
```json
{
  "name": "동네 분식",
  "address": "서울 성동구 ...",
  "lat": 37.544,
  "lng": 127.055,
  "district": "성수동",
  "category": "restaurant",
  "external_provider": "kakao",
  "external_id": "12345"
}
```

**Response 201**:
```json
{
  "place_id": "plc_002",
  "created": true
}
```

**Idempotency**: 같은 `external_provider` + `external_id` 들어오면 기존 `place_id` 반환 (`created: false`).

### `GET /api/v1/places/{place_id}`
장소 상세 + 모임 데이터 카드용 집계.

**Response 200**:
```json
{
  "place_id": "plc_001",
  "name": "성수동 코너 카페",
  "address": "...",
  "district": "성수동",
  "category": "cafe",
  "business_id": "biz_001",
  "lat": 37.544,
  "lng": 127.055,
  "meeting_stats": {
    "total_meetings_30d": 8,
    "total_meetings_all_time": 47,
    "avg_rating": 4.6,
    "revisit_rate": 0.72,
    "last_meeting_at": "2026-04-10T19:00:00Z"
  },
  "score": {
    "total": 142.5,
    "meetup_signal": 89.0,
    "mention": 38.5,
    "review": 15.0
  },
  "awards": [
    {
      "season_name": "Winter 2025",
      "district": "성수동",
      "category": "cafe",
      "rank": 1
    }
  ]
}
```

### `GET /api/v1/places/{place_id}/recent_meetings`
가게 페이지 모임 데이터 카드용 (익명화).

**Response 200**:
```json
{
  "items": [
    {
      "category": "book_club",
      "attendee_count": 6,
      "occurred_at": "2026-04-10",
      "rating": 5
    },
    {
      "category": "foodie",
      "attendee_count": 4,
      "occurred_at": "2026-04-08",
      "rating": 4
    }
  ]
}
```

**Privacy rule**: 5건 이상 있을 때만 노출 (k-익명성).

---

## 3. Meetings (Minimal Meeting System)

### `POST /api/v1/meetings`
모임 생성.

**Body**:
```json
{
  "name": "성수 독서모임",
  "category": "book_club",
  "district": "성수동",
  "member_count": 6
}
```

**Response 201**:
```json
{
  "meeting_id": "mtg_001",
  "host_user_id": "u_001",
  "created_at": "..."
}
```

### `GET /api/v1/meetings`
내가 속한 모임 목록.

### `GET /api/v1/meetings/{meeting_id}`
모임 상세 + 멤버 + 다가올 일정.

### `GET /api/v1/meetings/{meeting_id}/members`
멤버 목록.

### `POST /api/v1/meetings/{meeting_id}/members`
멤버 추가 (v1: 호스트가 직접 추가, 초대·승인 없음).

---

## 4. Meeting Events

### `POST /api/v1/meetings/{meeting_id}/events`
모임 일정 등록.

**Body**:
```json
{
  "title": "12월 정기 모임",
  "scheduled_at": "2026-12-20T19:00:00Z",
  "attendee_count": 5,
  "place_id": "plc_001"
}
```

**검증**:
- `place_id` 없으면 `400 place_required`
- 호스트만 등록 가능

**Side effects (서버 내부)**:
- `meeting_events` 1건 insert
- `place_signals` 1건 insert (`signal_type='selected'`, weight=1)

**Response 201**:
```json
{
  "event_id": "evt_001",
  "meeting_id": "mtg_001",
  "place": {
    "place_id": "plc_001",
    "name": "성수동 코너 카페"
  },
  "scheduled_at": "2026-12-20T19:00:00Z"
}
```

### `PATCH /api/v1/meetings/{meeting_id}/events/{event_id}`
일정 수정.

**Body** (변경 가능):
- `scheduled_at`
- `place_id` (장소 변경 시 시그널 재처리)
- `attendee_count`

### `GET /api/v1/meetings/{meeting_id}/events`
모임의 일정 목록.

### `GET /api/v1/meetings/{meeting_id}/place_history`
이 모임이 다녀간 장소 목록.

**Response 200**:
```json
{
  "items": [
    {
      "place": { "place_id": "plc_001", "name": "성수동 코너 카페" },
      "visit_count": 3,
      "last_visited_at": "2026-04-10",
      "avg_rating_from_us": 4.7
    }
  ]
}
```

---

## 5. Ratings

### `POST /api/v1/events/{event_id}/rating`
모임 후 평가 제출.

**Body**:
```json
{
  "rating": 5,
  "would_revisit": true
}
```

**검증**:
- attendee만 가능
- `scheduled_at` 이후만 가능
- 한 user 당 1건 (UPSERT)

**Side effects**:
- `meeting_ratings` insert/update
- `place_signals` insert (`signal_type='rated'`, weight=rating)

**Response 201**:
```json
{
  "rating_id": "rtg_001",
  "rating": 5,
  "would_revisit": true
}
```

### `GET /api/v1/events/{event_id}/rating`
내 평가 조회.

---

## 6. Meeting Posts & @Mentions

### `POST /api/v1/meetings/{meeting_id}/posts`
모임 게시글 작성.

**Body**:
```json
{
  "content": "어제 @성수동 코너 카페 다녀왔는데 너무 좋았어요!",
  "mentions": [
    {
      "place_id": "plc_001",
      "context_text": "어제 @성수동 코너 카페 다녀왔는데"
    }
  ]
}
```

**Note**: 멘션은 클라이언트에서 picker로 선택한 결과를 함께 보냄. 서버는 텍스트 파싱 X.

**Side effects**:
- `meeting_posts` insert
- 각 mention마다 `mentions` insert + `place_signals` insert (`signal_type='mention'`, weight=2)

**Response 201**:
```json
{
  "post_id": "pst_001",
  "mention_count": 1
}
```

### `GET /api/v1/places/autocomplete`
@멘션 picker용 장소 자동완성.

**Query**:
- `q` (string)
- `district` (string, optional) — 사용자 동네 우선

**Response 200**:
```json
{
  "items": [
    {
      "place_id": "plc_001",
      "name": "성수동 코너 카페",
      "category": "cafe",
      "district": "성수동"
    }
  ]
}
```

---

## 7. Ranking

### `GET /api/v1/ranking`
동·카테고리별 실시간 랭킹.

**Query**:
- `district` (string, required) — "성수동"
- `category` (string, required) — "cafe"
- `limit` (default 10)

**Response 200**:
```json
{
  "district": "성수동",
  "category": "cafe",
  "items": [
    {
      "rank": 1,
      "place": {
        "place_id": "plc_001",
        "name": "성수동 코너 카페",
        "thumbnail_url": "..."
      },
      "score": {
        "total": 142.5,
        "meetup_signal": 89.0,
        "mention": 38.5,
        "review": 15.0
      },
      "stats": {
        "total_meetings_30d": 8,
        "avg_rating": 4.6
      }
    }
  ]
}
```

---

## 8. Venue Recommendation

### `POST /api/v1/recommendations/venues`
모임 장소 추천.

**Body**:
```json
{
  "category": "book_club",
  "attendee_count": 5,
  "district": "성수동",
  "preferred_time_of_day": "evening"
}
```

**Response 200**:
```json
{
  "items": [
    {
      "place": {
        "place_id": "plc_001",
        "name": "성수동 코너 카페"
      },
      "match_score": 0.92,
      "reasons": [
        "독서모임 유사 모임 3건 다녀감",
        "평균 별점 4.6",
        "5인 모임 평균 인원과 매칭"
      ]
    }
  ]
}
```

**알고리즘 (v1, rule-based)**:
```
score = 
  0.4 * (같은 카테고리 모임 수 normalized) +
  0.3 * (평균 별점 / 5.0) +
  0.2 * (재방문율) +
  0.1 * (인원수 매칭도)
```

---

## 9. Seasons & Awards

### `GET /api/v1/seasons/current`
현재 활성 시즌.

**Response 200**:
```json
{
  "season_id": "season_2026_spring",
  "name": "Spring 2026",
  "starts_at": "2026-03-01T00:00:00Z",
  "ends_at": "2026-05-31T23:59:59Z",
  "status": "active"
}
```

### `POST /api/v1/seasons/{season_id}/close`
시즌 종료 (관리자 또는 데모용 트리거).

**Side effects**:
- `place_score_snapshots` 생성
- 동·카테고리별 1위 자동 선정 → `awards` 생성

### `GET /api/v1/awards`
어워드 조회.

**Query**:
- `season_id` (optional)
- `district` (optional)
- `category` (optional)

**Response 200**:
```json
{
  "items": [
    {
      "award_id": "awd_001",
      "season_name": "Spring 2026",
      "district": "성수동",
      "category": "cafe",
      "rank": 1,
      "place": {
        "place_id": "plc_001",
        "name": "성수동 코너 카페"
      },
      "awarded_at": "2026-06-01T00:00:00Z"
    }
  ]
}
```

---

## 10. Settlement Demo

### `POST /api/v1/events/{event_id}/settlements`
정산 시작.

**Body**:
```json
{
  "total_amount": 72000,
  "paid_by_user_id": "u_001",
  "attendee_user_ids": ["u_001", "u_002", "u_003", "u_004", "u_005"]
}
```

**Side effects (서버 내부 계산)**:
- 1/N = 14,400원
- paid_by 제외 N-1 명이 → paid_by 에게 14,400원씩
- `settlements` + `settlement_transactions` insert

**Response 201**:
```json
{
  "settlement_id": "stl_001",
  "total_amount": 72000,
  "per_person": 14400,
  "transactions": [
    { "from": "u_002", "to": "u_001", "amount": 14400, "is_simulated": true },
    { "from": "u_003", "to": "u_001", "amount": 14400, "is_simulated": true },
    { "from": "u_004", "to": "u_001", "amount": 14400, "is_simulated": true },
    { "from": "u_005", "to": "u_001", "amount": 14400, "is_simulated": true }
  ]
}
```

### `GET /api/v1/events/{event_id}/settlements`
이 일정의 정산 이력 조회.

---

## 11. Internal / Admin (개발 편의용)

### `POST /api/v1/admin/seed`
시드 데이터 일괄 적재.

### `POST /api/v1/admin/recompute_scores`
점수 재계산 강제 트리거.

### `POST /api/v1/admin/seasons`
시즌 생성.

---

## Implementation Priority (Week별)

### Week 2 — Phase 1 Core
- `POST/GET /me`
- `POST/GET /places`, `/places/search`, `/places/{id}`
- `POST/GET /meetings`, `/meetings/{id}/events`
- `POST/GET /events/{id}/rating`
- 시드 스크립트

### Week 4 — Phase 2
- `GET /places/{id}` 의 score 부분
- `GET /ranking`

### Week 5 — Phase 3 Mentions
- `POST /meetings/{id}/posts` (mention 처리)
- `GET /places/autocomplete`

### Week 6 — Phase 3 Recommendations + Phase 4 Awards
- `POST /recommendations/venues`
- `GET /seasons/current`
- `POST /seasons/{id}/close`
- `GET /awards`

### Week 7 — Settlement
- `POST /events/{id}/settlements`
- `GET /events/{id}/settlements`
