# 모당 (Modang) — DB Design (Detailed)

> 실제 SQLAlchemy 모델 작성에 바로 옮길 수 있는 수준의 DB 설계 문서

**Status:** v1
**Last updated:** 2026-05-20
**DB Engine:** SQLite (dev) → PostgreSQL (production)
**ORM:** SQLAlchemy 2.0

---

## 목차

1. [설계 원칙](#1-설계-원칙)
2. [공통 규칙](#2-공통-규칙)
3. [테이블 상세 명세](#3-테이블-상세-명세)
4. [인덱스 전략](#4-인덱스-전략)
5. [트랜잭션 시나리오](#5-트랜잭션-시나리오)
6. [데이터 무결성·제약](#6-데이터-무결성-제약)
7. [확장성 고려](#7-확장성-고려)

---

## 1. 설계 원칙

### 1.1 핵심 결정

**A. 시그널 단일 테이블 (event sourcing 흉내)**
모든 시그널(선택/평가/멘션/리뷰)을 `place_signals` 한 테이블에 누적.
- 장점: 점수 계산이 단일 쿼리, 새 시그널 타입 추가 쉬움
- 단점: 다양한 source_ref 타입 → 외래키 강제 불가 (string으로 처리)

**B. 점수는 미리 계산 (Materialized)**
실시간 계산은 비싸므로 `place_score_snapshots` 에 시즌별로 저장.
- 시즌 종료 시점에 한 번 계산
- 현재 시즌은 active 동안 캐시 갱신 (Week 4에서 자세히)

**C. ID는 prefix + ULID/nanoid**
- `u_xxx` (user), `plc_xxx` (place), `mtg_xxx` (meeting) 등
- 디버깅·로그에서 한눈에 어떤 entity인지 식별
- v1엔 단순화해서 prefix + nanoid 8자

**D. Soft delete 대신 status 컬럼**
- 데이터 보존이 중요한 도메인 (시그널 이력)
- `is_void`, `status` 컬럼으로 표현

**E. Timestamps 통일**
- 모든 테이블에 `created_at` (자동 NOW)
- 변경 가능한 테이블에 `updated_at` (자동 갱신)

---

## 2. 공통 규칙

### 2.1 컬럼 명명
- snake_case (`user_id`, `created_at`)
- 외래키는 `{table_name}_id` 형식
- Boolean은 `is_xxx` 또는 `has_xxx`

### 2.2 데이터 타입 매핑 (SQLite ↔ PostgreSQL)

| 의미 | SQLite | PostgreSQL | SQLAlchemy |
|---|---|---|---|
| ID | TEXT | VARCHAR(32) | String(32) |
| 짧은 텍스트 | TEXT | VARCHAR(100) | String(100) |
| 긴 텍스트 | TEXT | TEXT | Text |
| 정수 | INTEGER | INTEGER | Integer |
| 실수 | REAL | DOUBLE PRECISION | Float |
| 불리언 | INTEGER (0/1) | BOOLEAN | Boolean |
| 시간 | TEXT (ISO 8601) | TIMESTAMPTZ | DateTime(timezone=True) |
| JSON | TEXT | JSONB | JSON |

### 2.3 외래키 정책
- 모든 외래키에 인덱스 자동
- `ON DELETE` 정책 (테이블별로 명시)
- nullable 여부 명시

### 2.4 ID 생성
```python
import nanoid

def generate_id(prefix: str) -> str:
    return f"{prefix}_{nanoid.generate(size=8)}"

# 예: u_a3F8x7Kp, plc_x9k2Mn4Q
```

---

## 3. 테이블 상세 명세

### 3.1 `users` — 사용자

| 컬럼 | 타입 | NULL | 기본값 | 설명 |
|---|---|---|---|---|
| id | String(32) | NO | - | PK, `u_` prefix |
| name | String(50) | NO | - | 표시 이름 |
| region | String(50) | NO | - | 사용자 동네 (예: "성수동") |
| avatar_url | String(500) | YES | NULL | 프로필 이미지 |
| created_at | DateTime | NO | NOW() | |
| updated_at | DateTime | NO | NOW() | |

**Indexes:**
- PK: `id`
- `idx_users_region` on `(region)` — 동네별 사용자 조회

**FK 정책:** N/A (root entity)

**제약:**
- `name` 길이 1-50

---

### 3.2 `businesses` — 비즈프로필 (가게 사장님 페이지)

| 컬럼 | 타입 | NULL | 기본값 | 설명 |
|---|---|---|---|---|
| id | String(32) | NO | - | PK, `biz_` prefix |
| name | String(100) | NO | - | 가게 이름 |
| owner_user_id | String(32) | YES | NULL | FK → users.id |
| category | String(30) | NO | - | cafe / restaurant / beauty / study_room / etc |
| verified | Boolean | NO | FALSE | 본인 인증 여부 |
| created_at | DateTime | NO | NOW() | |
| updated_at | DateTime | NO | NOW() | |

**Indexes:**
- PK: `id`
- `idx_businesses_owner` on `(owner_user_id)`
- `idx_businesses_category` on `(category)`

**FK 정책:**
- `owner_user_id` → `users.id` ON DELETE SET NULL

**비고:**
- v1에선 `category` enum 강제 안 함 (string)
- v2에 `business_categories` lookup 테이블로 정규화 가능

---

### 3.3 `places` — 장소 entity (시스템 핵심)

| 컬럼 | 타입 | NULL | 기본값 | 설명 |
|---|---|---|---|---|
| id | String(32) | NO | - | PK, `plc_` prefix |
| name | String(100) | NO | - | 장소 이름 |
| address | String(255) | NO | - | 주소 |
| lat | Float | NO | - | 위도 |
| lng | Float | NO | - | 경도 |
| district | String(50) | NO | - | 행정동 (예: "성수동") |
| category | String(30) | NO | - | 비즈니스와 동일 카테고리 체계 |
| business_id | String(32) | YES | NULL | FK → businesses.id (비즈프로필 연결 시) |
| external_provider | String(20) | YES | NULL | kakao / naver |
| external_id | String(100) | YES | NULL | 외부 지도의 ID |
| created_at | DateTime | NO | NOW() | |
| updated_at | DateTime | NO | NOW() | |

**Indexes:**
- PK: `id`
- `idx_places_district_category` on `(district, category)` — 랭킹 쿼리 핵심
- `idx_places_business` on `(business_id)`
- **UNIQUE** `uq_places_external` on `(external_provider, external_id)` WHERE both NOT NULL — 외부 장소 중복 방지

**FK 정책:**
- `business_id` → `businesses.id` ON DELETE SET NULL (사장님 탈퇴해도 장소 데이터 보존)

**제약:**
- `lat` BETWEEN -90 AND 90
- `lng` BETWEEN -180 AND 180

**Place Resolution 로직 (lazy creation):**
1. `external_provider` + `external_id`로 기존 place 검색 → 있으면 그것 반환
2. 없으면 좌표 50m 반경 + 이름 유사도 (Levenshtein ≥ 0.85) 후보 검색 → 있으면 외부 ID만 업데이트
3. 매칭 실패 시 신규 생성

---

### 3.4 `meetings` — 모임 (Book Club, Foodie 등)

| 컬럼 | 타입 | NULL | 기본값 | 설명 |
|---|---|---|---|---|
| id | String(32) | NO | - | PK, `mtg_` prefix |
| host_user_id | String(32) | NO | - | FK → users.id |
| name | String(100) | NO | - | 모임 이름 |
| category | String(30) | NO | - | book_club / foodie / running / etc |
| district | String(50) | NO | - | 모임 활동 동네 |
| member_count | Integer | NO | 1 | 현재 멤버 수 (캐시) |
| created_at | DateTime | NO | NOW() | |
| updated_at | DateTime | NO | NOW() | |

**Indexes:**
- PK: `id`
- `idx_meetings_host` on `(host_user_id)`
- `idx_meetings_district_category` on `(district, category)`

**FK 정책:**
- `host_user_id` → `users.id` ON DELETE RESTRICT (호스트가 있어야 모임 성립)

**비고:**
- `member_count` 는 `meeting_members` insert/delete 시 트리거 또는 애플리케이션에서 갱신

---

### 3.5 `meeting_members` — 모임 멤버십

| 컬럼 | 타입 | NULL | 기본값 | 설명 |
|---|---|---|---|---|
| id | String(32) | NO | - | PK, `mm_` prefix |
| meeting_id | String(32) | NO | - | FK → meetings.id |
| user_id | String(32) | NO | - | FK → users.id |
| role | String(10) | NO | 'member' | 'host' / 'member' |
| joined_at | DateTime | NO | NOW() | |

**Indexes:**
- PK: `id`
- **UNIQUE** `uq_meeting_members` on `(meeting_id, user_id)` — 중복 가입 방지
- `idx_meeting_members_user` on `(user_id)`

**FK 정책:**
- `meeting_id` → `meetings.id` ON DELETE CASCADE
- `user_id` → `users.id` ON DELETE CASCADE

**제약:**
- `role` IN ('host', 'member')

---

### 3.6 `meeting_events` — 모임 일정 (★ 핵심 entity)

| 컬럼 | 타입 | NULL | 기본값 | 설명 |
|---|---|---|---|---|
| id | String(32) | NO | - | PK, `evt_` prefix |
| meeting_id | String(32) | NO | - | FK → meetings.id |
| place_id | String(32) | NO | - | FK → places.id ★ 필수 |
| title | String(100) | NO | - | 일정 제목 |
| scheduled_at | DateTime | NO | - | 모임 예정 시각 |
| attendee_count | Integer | NO | - | 참석 예정 인원 |
| status | String(20) | NO | 'scheduled' | scheduled / in_progress / ended / cancelled |
| rating_dispatched_at | DateTime | YES | NULL | 평가 요청 발송 시점 |
| created_at | DateTime | NO | NOW() | |
| updated_at | DateTime | NO | NOW() | |

**Indexes:**
- PK: `id`
- `idx_events_meeting` on `(meeting_id)`
- `idx_events_place` on `(place_id)` — 가게 페이지에서 이 가게 방문 모임 조회
- `idx_events_scheduled` on `(scheduled_at)` — 다가올 일정 / 종료된 일정 필터
- `idx_events_status` on `(status, scheduled_at)` — 상태 변경 잡 (cron)

**FK 정책:**
- `meeting_id` → `meetings.id` ON DELETE CASCADE
- `place_id` → `places.id` ON DELETE RESTRICT (장소 삭제 막음, 시그널 보존)

**제약:**
- `status` IN ('scheduled', 'in_progress', 'ended', 'cancelled')
- `attendee_count` ≥ 1

**상태 머신:**
```
scheduled --[scheduled_at 도달]--> in_progress
in_progress --[+2h 경과]--> ended (이때 rating_dispatched_at 갱신)
scheduled --[호스트 취소]--> cancelled
```

---

### 3.7 `meeting_posts` — 모임 게시글 (@mention 발생지)

| 컬럼 | 타입 | NULL | 기본값 | 설명 |
|---|---|---|---|---|
| id | String(32) | NO | - | PK, `pst_` prefix |
| meeting_id | String(32) | NO | - | FK → meetings.id |
| author_user_id | String(32) | NO | - | FK → users.id |
| content | Text | NO | - | 본문 |
| created_at | DateTime | NO | NOW() | |
| updated_at | DateTime | NO | NOW() | |

**Indexes:**
- PK: `id`
- `idx_posts_meeting_time` on `(meeting_id, created_at DESC)` — 모임 피드

**FK 정책:**
- `meeting_id` → `meetings.id` ON DELETE CASCADE
- `author_user_id` → `users.id` ON DELETE SET NULL (탈퇴해도 글 보존)

---

### 3.8 `meeting_ratings` — 모임 후 평가

| 컬럼 | 타입 | NULL | 기본값 | 설명 |
|---|---|---|---|---|
| id | String(32) | NO | - | PK, `rtg_` prefix |
| event_id | String(32) | NO | - | FK → meeting_events.id |
| user_id | String(32) | NO | - | FK → users.id |
| rating | Integer | NO | - | 1-5 |
| would_revisit | Boolean | NO | - | |
| created_at | DateTime | NO | NOW() | |
| updated_at | DateTime | NO | NOW() | |

**Indexes:**
- PK: `id`
- **UNIQUE** `uq_ratings_event_user` on `(event_id, user_id)` — 한 사람당 1평가
- `idx_ratings_event` on `(event_id)` — 평가 집계

**FK 정책:**
- `event_id` → `meeting_events.id` ON DELETE CASCADE
- `user_id` → `users.id` ON DELETE CASCADE

**제약:**
- `rating` BETWEEN 1 AND 5

---

### 3.9 `place_signals` — ★ 모든 시그널 통합 로그

| 컬럼 | 타입 | NULL | 기본값 | 설명 |
|---|---|---|---|---|
| id | String(32) | NO | - | PK, `sig_` prefix |
| place_id | String(32) | NO | - | FK → places.id |
| signal_type | String(20) | NO | - | selected / rated / mention / review |
| weight | Float | NO | - | 점수 계산용 가중치 |
| source_ref | String(50) | YES | NULL | event_id / post_id / review_id |
| user_id | String(32) | YES | NULL | FK → users.id (시그널 생성자) |
| occurred_at | DateTime | NO | NOW() | 시그널 발생 시각 |
| is_void | Boolean | NO | FALSE | 취소된 시그널 (예: 일정 변경) |
| meta | JSON | YES | NULL | 추가 컨텍스트 (district, category 등) |
| created_at | DateTime | NO | NOW() | |

**Indexes:**
- PK: `id`
- `idx_signals_place_time` on `(place_id, occurred_at)` — 점수 집계 ★
- `idx_signals_type` on `(signal_type, is_void)` — 타입별 집계
- `idx_signals_source` on `(source_ref)` — void 처리 시 빠른 검색
- `idx_signals_user` on `(user_id)`

**FK 정책:**
- `place_id` → `places.id` ON DELETE RESTRICT
- `user_id` → `users.id` ON DELETE SET NULL

**제약:**
- `signal_type` IN ('selected', 'rated', 'mention', 'review')
- `weight` ≥ 0

**Append-only 정책:**
- DELETE 금지
- 취소는 `is_void = TRUE` 로만 표현
- 변경 시 새 row insert (옵션, v2)

**Weight 정책 (v1):**
| signal_type | weight | 근거 |
|---|---|---|
| selected | 1.0 | 약한 의도 |
| rated | rating value (1-5) | 만족도 정비례 |
| mention | 2.0 | 자발적 추천 |
| review | rating value (1-5) | 평가와 동일 |

---

### 3.10 `mentions` — @멘션 상세

| 컬럼 | 타입 | NULL | 기본값 | 설명 |
|---|---|---|---|---|
| id | String(32) | NO | - | PK, `mn_` prefix |
| post_id | String(32) | NO | - | FK → meeting_posts.id |
| place_id | String(32) | NO | - | FK → places.id |
| author_user_id | String(32) | NO | - | FK → users.id |
| context_text | String(200) | YES | NULL | 멘션 주변 텍스트 스니펫 |
| created_at | DateTime | NO | NOW() | |

**Indexes:**
- PK: `id`
- `idx_mentions_place_time` on `(place_id, created_at DESC)` — 가게 멘션 이력
- `idx_mentions_post` on `(post_id)`

**FK 정책:**
- `post_id` → `meeting_posts.id` ON DELETE CASCADE
- `place_id` → `places.id` ON DELETE RESTRICT
- `author_user_id` → `users.id` ON DELETE SET NULL

**연동:**
- 멘션 1건 생성 시 `place_signals` 에도 1건 생성 (signal_type='mention', weight=2.0)
- 트랜잭션으로 묶어서 처리

---

### 3.11 `seasons` — 어워드 시즌

| 컬럼 | 타입 | NULL | 기본값 | 설명 |
|---|---|---|---|---|
| id | String(32) | NO | - | PK, `season_` prefix |
| name | String(50) | NO | - | "Spring 2026" |
| starts_at | DateTime | NO | - | |
| ends_at | DateTime | NO | - | |
| status | String(20) | NO | 'upcoming' | upcoming / active / closed |
| created_at | DateTime | NO | NOW() | |
| updated_at | DateTime | NO | NOW() | |

**Indexes:**
- PK: `id`
- `idx_seasons_status` on `(status, starts_at)`

**제약:**
- `status` IN ('upcoming', 'active', 'closed')
- `ends_at` > `starts_at`

**상태 머신:**
```
upcoming --[starts_at 도달]--> active
active --[ends_at 도달 + 시상 처리]--> closed
```

---

### 3.12 `place_score_snapshots` — 시즌별 점수 스냅샷

| 컬럼 | 타입 | NULL | 기본값 | 설명 |
|---|---|---|---|---|
| id | String(32) | NO | - | PK, `snap_` prefix |
| place_id | String(32) | NO | - | FK → places.id |
| season_id | String(32) | NO | - | FK → seasons.id |
| total_score | Float | NO | 0 | 가중 합계 |
| meetup_signal_score | Float | NO | 0 | selected + rated 합 |
| mention_score | Float | NO | 0 | mention 합 |
| review_score | Float | NO | 0 | review 합 |
| signal_count | Integer | NO | 0 | 시그널 개수 (참고용) |
| rank_district | Integer | YES | NULL | 동 내 같은 카테고리 순위 |
| rank_category | Integer | YES | NULL | 시 전체 같은 카테고리 순위 |
| computed_at | DateTime | NO | NOW() | 계산 시각 |

**Indexes:**
- PK: `id`
- **UNIQUE** `uq_snapshots_place_season` on `(place_id, season_id)` — 한 시즌 한 장소 1행
- `idx_snapshots_season_rank` on `(season_id, total_score DESC)` — 랭킹 조회

**FK 정책:**
- `place_id` → `places.id` ON DELETE CASCADE
- `season_id` → `seasons.id` ON DELETE CASCADE

**계산 시점:**
- active 시즌: 시그널 추가될 때마다 갱신 (Week 4)
- closed 시즌: ends_at 도달 시 한 번 최종 계산 후 freeze

---

### 3.13 `awards` — 수상 기록

| 컬럼 | 타입 | NULL | 기본값 | 설명 |
|---|---|---|---|---|
| id | String(32) | NO | - | PK, `awd_` prefix |
| season_id | String(32) | NO | - | FK → seasons.id |
| place_id | String(32) | NO | - | FK → places.id |
| district | String(50) | NO | - | 수상 동네 |
| category | String(30) | NO | - | 수상 카테고리 |
| rank | Integer | NO | - | 1 / 2 / 3 |
| total_score | Float | NO | - | 수상 시점 점수 (스냅샷) |
| awarded_at | DateTime | NO | NOW() | |

**Indexes:**
- PK: `id`
- **UNIQUE** `uq_awards_season_district_category_rank` on `(season_id, district, category, rank)`
- `idx_awards_place` on `(place_id)` — 한 장소의 수상 이력 조회
- `idx_awards_season_district` on `(season_id, district)`

**FK 정책:**
- `season_id` → `seasons.id` ON DELETE CASCADE
- `place_id` → `places.id` ON DELETE CASCADE

**제약:**
- `rank` IN (1, 2, 3)

---

### 3.14 `settlements` — 정산 헤더

| 컬럼 | 타입 | NULL | 기본값 | 설명 |
|---|---|---|---|---|
| id | String(32) | NO | - | PK, `stl_` prefix |
| event_id | String(32) | NO | - | FK → meeting_events.id |
| total_amount | Integer | NO | - | 원 단위 |
| paid_by_user_id | String(32) | NO | - | FK → users.id (먼저 결제한 사람) |
| status | String(20) | NO | 'pending' | pending / completed / cancelled |
| created_at | DateTime | NO | NOW() | |
| updated_at | DateTime | NO | NOW() | |

**Indexes:**
- PK: `id`
- `idx_settlements_event` on `(event_id)`
- `idx_settlements_paid_by` on `(paid_by_user_id)`

**FK 정책:**
- `event_id` → `meeting_events.id` ON DELETE CASCADE
- `paid_by_user_id` → `users.id` ON DELETE RESTRICT

**제약:**
- `total_amount` ≥ 0
- `status` IN ('pending', 'completed', 'cancelled')

---

### 3.15 `settlement_transactions` — 송금 1건

| 컬럼 | 타입 | NULL | 기본값 | 설명 |
|---|---|---|---|---|
| id | String(32) | NO | - | PK, `tx_` prefix |
| settlement_id | String(32) | NO | - | FK → settlements.id |
| from_user_id | String(32) | NO | - | FK → users.id |
| to_user_id | String(32) | NO | - | FK → users.id |
| amount | Integer | NO | - | 원 단위 |
| is_simulated | Boolean | NO | TRUE | v1에선 항상 TRUE |
| created_at | DateTime | NO | NOW() | |

**Indexes:**
- PK: `id`
- `idx_tx_settlement` on `(settlement_id)`
- `idx_tx_from_user` on `(from_user_id)`
- `idx_tx_to_user` on `(to_user_id)`

**FK 정책:**
- `settlement_id` → `settlements.id` ON DELETE CASCADE
- `from_user_id`, `to_user_id` → `users.id` ON DELETE RESTRICT

**제약:**
- `amount` > 0
- `from_user_id` ≠ `to_user_id`

---

## 4. 인덱스 전략

### 4.1 자주 쓰는 쿼리 패턴

**A. 가게 페이지 — 모임 데이터 카드**
```sql
SELECT signal_type, COUNT(*), SUM(weight), AVG(weight)
FROM place_signals
WHERE place_id = ? AND is_void = FALSE
GROUP BY signal_type;
```
→ `idx_signals_place_time` 활용

**B. 가게 페이지 — 최근 모임 익명 표시**
```sql
SELECT m.category, e.attendee_count, e.scheduled_at, r.rating
FROM meeting_events e
JOIN meetings m ON e.meeting_id = m.id
LEFT JOIN meeting_ratings r ON r.event_id = e.id
WHERE e.place_id = ? AND e.status = 'ended'
ORDER BY e.scheduled_at DESC
LIMIT 5;
```
→ `idx_events_place` + `idx_events_status` 활용

**C. 동·카테고리 랭킹**
```sql
SELECT p.id, p.name, s.total_score
FROM place_score_snapshots s
JOIN places p ON s.place_id = p.id
WHERE s.season_id = ? AND p.district = ? AND p.category = ?
ORDER BY s.total_score DESC
LIMIT 10;
```
→ `idx_snapshots_season_rank` + `idx_places_district_category` 활용

**D. 모임 일정 검색 (다가올)**
```sql
SELECT * FROM meeting_events
WHERE meeting_id = ? AND status = 'scheduled' AND scheduled_at > NOW()
ORDER BY scheduled_at ASC;
```
→ `idx_events_meeting` + `idx_events_status` 활용

**E. 시즌 종료 시 점수 계산**
```sql
SELECT 
  ps.place_id,
  SUM(CASE WHEN ps.signal_type IN ('selected', 'rated') THEN ps.weight ELSE 0 END) AS meetup_score,
  SUM(CASE WHEN ps.signal_type = 'mention' THEN ps.weight ELSE 0 END) AS mention_score,
  SUM(CASE WHEN ps.signal_type = 'review' THEN ps.weight ELSE 0 END) AS review_score
FROM place_signals ps
WHERE ps.is_void = FALSE
  AND ps.occurred_at BETWEEN ? AND ?  -- season start/end
GROUP BY ps.place_id;
```
→ `idx_signals_place_time` + `idx_signals_type` 활용

### 4.2 인덱스 추가 가이드라인
- 자주 WHERE/JOIN/ORDER BY 되는 컬럼
- 외래키는 자동 (FK 제약과 별개로 명시)
- 복합 인덱스 컬럼 순서: 카디널리티 높은 것부터, 그러나 자주 쓰는 것 먼저

---

## 5. 트랜잭션 시나리오

### 5.1 모임 일정 등록 → 시그널 생성

```python
with db.transaction():
    # 1. event insert
    event = MeetingEvent(
        meeting_id=meeting_id,
        place_id=place_id,
        title=title,
        scheduled_at=scheduled_at,
        attendee_count=attendee_count,
        status='scheduled'
    )
    db.add(event)
    db.flush()  # event.id 확보
    
    # 2. signal insert (같은 트랜잭션)
    signal = PlaceSignal(
        place_id=place_id,
        signal_type='selected',
        weight=1.0,
        source_ref=event.id,
        user_id=current_user_id,
        meta={'district': place.district, 'category': place.category}
    )
    db.add(signal)
    
    # 트랜잭션 커밋 (둘 다 성공 or 둘 다 실패)
```

### 5.2 일정 장소 변경 → 시그널 정리

```python
with db.transaction():
    # 1. 기존 selected 시그널 void 처리
    db.query(PlaceSignal).filter(
        PlaceSignal.source_ref == event_id,
        PlaceSignal.signal_type == 'selected',
        PlaceSignal.is_void == False
    ).update({'is_void': True})
    
    # 2. event 갱신
    event.place_id = new_place_id
    
    # 3. 새 시그널 insert
    db.add(PlaceSignal(
        place_id=new_place_id,
        signal_type='selected',
        weight=1.0,
        source_ref=event.id,
        user_id=current_user_id
    ))
```

### 5.3 게시글 작성 → 멘션 + 시그널

```python
with db.transaction():
    # 1. post insert
    post = MeetingPost(...)
    db.add(post)
    db.flush()
    
    # 2. 각 mention에 대해 mentions + place_signals 둘 다 insert
    for m in mentions_payload:
        mention = Mention(
            post_id=post.id,
            place_id=m.place_id,
            author_user_id=current_user_id,
            context_text=m.context_text
        )
        db.add(mention)
        
        signal = PlaceSignal(
            place_id=m.place_id,
            signal_type='mention',
            weight=2.0,
            source_ref=post.id,
            user_id=current_user_id
        )
        db.add(signal)
```

### 5.4 평가 제출 → upsert + 시그널

```python
with db.transaction():
    # 1. upsert rating (UNIQUE constraint 활용)
    existing = db.query(MeetingRating).filter(
        event_id=event_id, user_id=current_user_id
    ).first()
    
    if existing:
        # 이미 있으면 update
        existing.rating = new_rating
        existing.would_revisit = would_revisit
        # 기존 시그널 void 처리
        db.query(PlaceSignal).filter(
            source_ref=existing.id,
            signal_type='rated'
        ).update({'is_void': True})
    else:
        existing = MeetingRating(...)
        db.add(existing)
        db.flush()
    
    # 2. 새 시그널
    db.add(PlaceSignal(
        place_id=event.place_id,
        signal_type='rated',
        weight=float(new_rating),
        source_ref=existing.id,
        user_id=current_user_id
    ))
```

### 5.5 시즌 종료 → 스냅샷 + 어워드

```python
with db.transaction():
    # 1. 시즌 종료
    season.status = 'closed'
    
    # 2. 모든 place에 대해 snapshot 계산 (집계 쿼리)
    results = db.execute("""
        SELECT 
            place_id,
            SUM(CASE WHEN signal_type IN ('selected','rated') THEN weight ELSE 0 END) AS meetup,
            SUM(CASE WHEN signal_type = 'mention' THEN weight ELSE 0 END) AS mention,
            SUM(CASE WHEN signal_type = 'review' THEN weight ELSE 0 END) AS review
        FROM place_signals
        WHERE is_void = FALSE
          AND occurred_at BETWEEN :start AND :end
        GROUP BY place_id
    """, {'start': season.starts_at, 'end': season.ends_at})
    
    for row in results:
        snapshot = PlaceScoreSnapshot(
            place_id=row.place_id,
            season_id=season.id,
            meetup_signal_score=row.meetup,
            mention_score=row.mention,
            review_score=row.review,
            total_score=row.meetup + row.mention + row.review
        )
        db.add(snapshot)
    
    db.flush()
    
    # 3. 동·카테고리별 rank 부여 + awards 생성
    # (동·카테고리 그룹별로 ORDER BY total_score DESC LIMIT 3)
    ...
```

---

## 6. 데이터 무결성·제약

### 6.1 어떤 제약을 DB가, 어떤 걸 애플리케이션이 처리하나

**DB 레벨 (UNIQUE, FK, CHECK)**
- 중복 방지 (UNIQUE)
- 참조 무결성 (FK)
- 단순 값 범위 (CHECK)

**애플리케이션 레벨**
- 비즈니스 로직 (예: "host만 일정 등록")
- 복잡한 검증 (예: "scheduled_at 이후만 평가")
- 외부 시스템 연동 시 멱등성

### 6.2 주요 멱등성 보장

**Place lazy creation (POST /places)**
- 같은 `external_provider + external_id` → 같은 `place_id` 반환
- UNIQUE 인덱스 + ON CONFLICT 처리

**Rating upsert (POST /events/{id}/rating)**
- 같은 user × event → 같은 row
- UNIQUE 인덱스 + UPSERT 로직

---

## 7. 확장성 고려

### 7.1 현재 결정의 트레이드오프

**A. `place_signals` 단일 테이블**
- 👍 점수 계산 단순, 새 시그널 타입 추가 쉬움
- 👎 매우 거대해질 수 있음 (1억 row+ 시 파티셔닝 필요)
- 대응: v2에서 시즌별 파티셔닝 (PostgreSQL native partitioning)

**B. `place_score_snapshots` 사전 계산**
- 👍 랭킹 조회 O(log n)
- 👎 active 시즌에선 신선도 유지 필요
- 대응: 시그널 insert 시 dirty flag → 백그라운드 워커가 N분 단위로 갱신

**C. `meta` JSON 컬럼**
- 👍 schema 변경 없이 확장
- 👎 JSON 인덱싱 약함 (PostgreSQL GIN으로 보완)
- 대응: 자주 쿼리되는 키는 별도 컬럼으로 승격

### 7.2 v2 후보

- **시간 감쇠 점수**: `place_score_snapshots`에 `decay_factor` 추가, 시그널별 `occurred_at` 보고 가중치 동적 계산
- **어뷰징 탐지**: `place_signals.meta`에 IP/디바이스 fingerprint 추가, 이상 패턴 자동 void
- **장소 멀티 카테고리**: `places.category` → 다대다 `place_categories` 테이블
- **모임원 attendance 검증**: `event_attendances` 신설 (현재 attendee_count는 숫자만)

---

## 8. 최종 ERD 다이어그램 (DBML)

dbdiagram.io에 붙여넣기용 코드는 별도 파일 (`W1_ERD.md`)에 있음.
이 문서는 그 ERD의 **구현 레벨 보강**.

---

## 부록 A. 마이그레이션 순서

테이블 간 의존성 고려한 생성 순서:

```
1. users
2. businesses (refs users)
3. places (refs businesses)
4. seasons
5. meetings (refs users)
6. meeting_members (refs meetings, users)
7. meeting_events (refs meetings, places)
8. meeting_posts (refs meetings, users)
9. meeting_ratings (refs meeting_events, users)
10. place_signals (refs places, users)
11. mentions (refs meeting_posts, places, users)
12. place_score_snapshots (refs places, seasons)
13. awards (refs seasons, places)
14. settlements (refs meeting_events, users)
15. settlement_transactions (refs settlements, users)
```

Alembic 마이그레이션 1개로 묶거나 영역별로 3-4개로 나누기 가능.

---

## 부록 B. 시드 데이터 sanity 체크

`W1_SEED_DATA.md` 시나리오와 일치 확인:

| 데이터 | 시드 양 | 비고 |
|---|---|---|
| users | 50 | 주요 6명 + 채움 44 |
| businesses | 12 | 비즈프로필 등록된 가게 |
| places | 30 | 12 비즈 + 18 외부 |
| meetings | 8 | |
| meeting_members | ~45 | |
| meeting_events | 40 | |
| meeting_posts | 25 | |
| meeting_ratings | 35 | |
| place_signals | ~155 | 40 selected + 35 rated + 60 mention + 20 review |
| mentions | 60 | |
| seasons | 2 | Winter 2025 (closed), Spring 2026 (active) |
| place_score_snapshots | 30 | Winter 2025만 |
| awards | ~24 | 3 동 × 4 카테고리 × 1-3위 |
| settlements | 1 | |
| settlement_transactions | 4 | |

**총 약 520건.**
