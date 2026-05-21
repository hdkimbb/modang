# Week 1 — ERD Draft

> 모당 (Modang) 데이터 모델

---

## How to use this file

1. 아래 dbdiagram.io DBML 코드를 복사
2. https://dbdiagram.io/d 에 붙여넣기
3. 자동으로 ERD 다이어그램 생성됨
4. 수정·공유 가능

---

## Entity Overview

총 14개의 entity (테이블)가 있어. 4개 영역으로 묶임:

### 사용자·가게·장소 (Identity & Place)
- `users` — 사용자
- `businesses` — 비즈프로필 (가게 사장님 페이지)
- `places` — **장소 entity** (비즈프로필 + 외부 지도 통합)

### 모임 (Minimal Meeting System)
- `meetings` — 모임 (Book Club, Foodie 등)
- `meeting_members` — 모임 멤버십
- `meeting_events` — 모임 일정 (장소 연결)
- `meeting_posts` — 모임 게시글 (@mention 살아있는 곳)
- `meeting_ratings` — 모임 후 평가

### 시그널·점수·어워드 (Signals & Awards)
- `place_signals` — 모든 시그널 통합 로그
- `mentions` — @mention 전용 (post → place 링크)
- `seasons` — 시즌 (Spring 2026 등)
- `place_score_snapshots` — 시즌별 점수
- `awards` — 수상 기록

### 정산 데모 (Settlement Demo)
- `settlements` — 정산 1건
- `settlement_transactions` — 송금 1건 (시뮬레이션)

---

## Full DBML Code

```dbml
// =============================================
// 모당 (Modang) ERD
// Last updated: 2026-05-15
// =============================================

// ----- IDENTITY & PLACE -----

Table users {
  id varchar [pk]
  name varchar
  region varchar  // 사용자 동네 (예: "성수동")
  avatar_url varchar [null]
  created_at timestamp
}

Table businesses {
  id varchar [pk]
  name varchar
  owner_user_id varchar [ref: > users.id, null]  // 사장님 (옵션)
  category varchar  // cafe, restaurant, beauty, etc.
  verified boolean
}

Table places {
  id varchar [pk]
  name varchar
  address varchar
  lat float
  lng float
  district varchar  // 행정동 (예: "성수동")
  category varchar
  business_id varchar [ref: > businesses.id, null]  // 비즈프로필 연결 (있을 때만)
  external_provider varchar [null]  // kakao, naver, etc.
  external_id varchar [null]
  created_at timestamp
  
  Note: '비즈프로필이 있으면 business_id 연결, 없으면 외부 지도 정보만'
}

// ----- MEETING DOMAIN -----

Table meetings {
  id varchar [pk]
  host_user_id varchar [ref: > users.id]
  name varchar  // 모임 이름 (예: "성수 독서모임")
  category varchar  // book_club, foodie, study, etc.
  district varchar
  member_count int  // 현재 멤버 수
  created_at timestamp
}

Table meeting_members {
  id varchar [pk]
  meeting_id varchar [ref: > meetings.id]
  user_id varchar [ref: > users.id]
  role varchar  // host, member
  joined_at timestamp
  
  Note: '한 사용자는 여러 모임에 속할 수 있음 (다대다)'
}

Table meeting_events {
  id varchar [pk]
  meeting_id varchar [ref: > meetings.id]
  place_id varchar [ref: > places.id]
  title varchar
  scheduled_at timestamp
  attendee_count int
  status varchar  // scheduled, in_progress, ended
  rating_dispatched_at timestamp [null]  // 평가 요청 발송 시점
  created_at timestamp
  
  Note: '모임 일정 = 모임 × 장소 × 시간. 우리 시스템의 핵심 entity'
}

Table meeting_posts {
  id varchar [pk]
  meeting_id varchar [ref: > meetings.id]
  author_user_id varchar [ref: > users.id]
  content text
  created_at timestamp
  
  Note: '@mention이 살아있는 곳'
}

Table meeting_ratings {
  id varchar [pk]
  event_id varchar [ref: > meeting_events.id]
  user_id varchar [ref: > users.id]
  rating int  // 1-5
  would_revisit boolean
  created_at timestamp
  
  Note: '같은 event × user 조합은 1건만 (UNIQUE)'
}

// ----- SIGNALS & AWARDS -----

Table place_signals {
  id varchar [pk]
  place_id varchar [ref: > places.id]
  signal_type varchar  // selected, rated, mention, review
  weight float  // 시그널 가중치
  source_ref varchar  // event_id, post_id 등 원천 ID
  user_id varchar [ref: > users.id, null]
  occurred_at timestamp
  is_void boolean  // 취소된 시그널 (예: 일정 변경)
  
  Note: '모든 시그널이 모이는 append-only 로그. 점수 계산의 단일 소스'
}

Table mentions {
  id varchar [pk]
  post_id varchar [ref: > meeting_posts.id]
  place_id varchar [ref: > places.id]
  author_user_id varchar [ref: > users.id]
  context_text varchar  // 멘션 주변 텍스트 (스니펫)
  created_at timestamp
  
  Note: '멘션 1건 = place_signals에도 1건 추가됨'
}

Table seasons {
  id varchar [pk]
  name varchar  // "Spring 2026"
  starts_at timestamp
  ends_at timestamp
  status varchar  // active, closed
}

Table place_score_snapshots {
  id varchar [pk]
  place_id varchar [ref: > places.id]
  season_id varchar [ref: > seasons.id]
  total_score float
  meetup_signal_score float
  mention_score float
  review_score float
  rank_district int  // 동 내 같은 카테고리 순위
  rank_category int  // 시 내 같은 카테고리 순위
  computed_at timestamp
  
  Note: '시즌 종료 시점에 한 번 계산해서 저장 (snapshot)'
}

Table awards {
  id varchar [pk]
  season_id varchar [ref: > seasons.id]
  place_id varchar [ref: > places.id]
  district varchar
  category varchar
  rank int  // 1, 2, 3
  awarded_at timestamp
  
  Note: '시즌별 × 동별 × 카테고리별 1-3위 수상'
}

// ----- SETTLEMENT DEMO -----

Table settlements {
  id varchar [pk]
  event_id varchar [ref: > meeting_events.id]
  total_amount int  // 원
  paid_by_user_id varchar [ref: > users.id]  // 누가 먼저 결제했나
  status varchar  // pending, completed
  created_at timestamp
}

Table settlement_transactions {
  id varchar [pk]
  settlement_id varchar [ref: > settlements.id]
  from_user_id varchar [ref: > users.id]
  to_user_id varchar [ref: > users.id]
  amount int
  is_simulated boolean  // 항상 true (v1에선 실제 송금 X)
  
  Note: 'A→B 5천원, B→C 3천원 같은 최소 정산 트랜잭션'
}
```

---

## Key Relationships Explained

### A. `places`가 이 시스템의 중심
모든 시그널이 `place_id`로 연결됨. `business_id`는 nullable이라 비즈프로필 없는 장소도 시그널 쌓을 수 있음. 사장님이 나중에 비즈프로필 등록하면 `business_id` 연결만 추가하면 됨.

### B. `place_signals`는 single source of truth
점수 계산할 때 이 테이블만 쿼리하면 됨. `signal_type`으로 종류 구분 (selected/rated/mention/review). 가중치는 `weight` 컬럼에 저장.

### C. `mentions`는 왜 따로?
멘션 발생 시 두 테이블에 동시에 들어감:
1. `mentions` — 컨텍스트 텍스트, 어디서 멘션됐는지 등 상세 정보
2. `place_signals` — `signal_type='mention'` 으로 점수 집계용

쿼리할 때:
- "어떤 글에서 ○○카페가 멘션됐어?" → `mentions` 조회
- "○○카페의 총 점수는?" → `place_signals` 집계

### D. `meeting_events` → `place_signals` 연결
일정 등록되는 순간:
- `meeting_events` 1건 insert
- `place_signals` 1건 insert (signal_type='selected')

일정 변경되면:
- 기존 signal `is_void=true`
- 새 signal insert

### E. 점수 계산
시즌 종료 시점:
```sql
-- 간단히 표현하면
SELECT 
  place_id,
  SUM(weight) AS total_score
FROM place_signals
WHERE occurred_at BETWEEN season.starts_at AND season.ends_at
  AND is_void = false
GROUP BY place_id
```

결과를 `place_score_snapshots`에 저장. 그 다음 동·카테고리별로 1위 뽑아서 `awards` 생성.

---

## Indexes (Phase 1에서 추가할 것)

```sql
-- 자주 쓸 쿼리 가속용
CREATE INDEX idx_signals_place_time ON place_signals(place_id, occurred_at);
CREATE INDEX idx_events_place ON meeting_events(place_id);
CREATE INDEX idx_events_meeting ON meeting_events(meeting_id);
CREATE INDEX idx_places_district_category ON places(district, category);
CREATE INDEX idx_mentions_place ON mentions(place_id);

-- 중복 방지
CREATE UNIQUE INDEX idx_ratings_unique ON meeting_ratings(event_id, user_id);
CREATE UNIQUE INDEX idx_members_unique ON meeting_members(meeting_id, user_id);
```

---

## Migration Strategy

v1에선 SQLite로 시작 → Week 4-5쯤 PostgreSQL로 옮김.

이유:
- SQLite는 파일 하나라 로컬 개발 편함
- PostgreSQL은 Railway 배포할 때 자동 셋업
- SQLAlchemy 쓰면 DB 바꿔도 코드 거의 안 바뀜

---

## Next Steps

1. dbdiagram.io에 위 DBML 코드 붙여넣고 다이어그램 확인
2. 다이어그램 이미지 export 해서 `docs/images/erd.png` 로 저장
3. PRD의 ERD 섹션에서 이 이미지 참조
