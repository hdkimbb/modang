# Week 1 — Seed Data Scenario

> 모당 (Modang) 데모용 시드 데이터 설계

---

## 시나리오 컨셉

> "Spring 2026 시즌, 성수동·연남동·역삼동 3개 동네에서 일어난 모임 활동. 시즌 종료 시 자동 시상되어 카페 부문 1위는 성수동 코너 카페."

이 시나리오 하나로 **모든 기능을 데모할 수 있어야** 함:
- F1 (장소 entity)
- F2 (일정 등록)
- F3 (모임 후 평가)
- F4 (가게 페이지 카드)
- F5 (점수)
- F6 (랭킹)
- F7 (@mention)
- F8 (추천)
- F9 (시즌·시상)
- F10 (어워드 이력)
- F11 (정산 데모)

---

## 시간 설정

| 항목 | 값 |
|---|---|
| 시즌 이름 | Spring 2026 |
| 시즌 기간 | 2026-03-01 ~ 2026-05-31 |
| 시즌 상태 | 시드 데이터에서는 `active`. 데모 중에 `/seasons/{id}/close` 호출하면 시상까지 진행 |
| 이전 시즌 | Winter 2025 (2025-12-01 ~ 2026-02-28), 상태 `closed`, 어워드 이력 있음 |

---

## 1. Users (총 50명)

3개 동네에 분산. 데모 주요 인물 6명 + 채움 44명.

### 주요 인물 (6명)

| id | name | region | 역할 |
|---|---|---|---|
| u_001 | 민지 | 성수동 | 성수 독서모임 호스트, 데모 주인공 |
| u_002 | 준호 | 성수동 | 성수 독서모임 멤버, 게시글 작성자 |
| u_003 | 지영 | 성수동 | 성수 푸디모임 호스트 |
| u_004 | 태호 | 연남동 | 연남 보드게임모임 호스트 |
| u_005 | 수민 | 역삼동 | 역삼 러닝모임 호스트 |
| u_006 | 하늘 | 성수동 | 비즈프로필 사장님 (성수동 코너 카페) |

### 나머지 44명
- 성수동 20명, 연남동 14명, 역삼동 10명
- `u_007 ~ u_050` 같은 형태
- 이름은 한국 흔한 이름 풀에서 랜덤

---

## 2. Businesses (총 12곳)

비즈프로필 등록된 가게만. 나머지 18곳은 비즈프로필 없는 외부 지도 장소.

| business_id | name | owner | category | district |
|---|---|---|---|---|
| biz_001 | 성수동 코너 카페 | u_006 | cafe | 성수동 |
| biz_002 | 성수 베이커리 | - | cafe | 성수동 |
| biz_003 | ○○ 키친 | - | restaurant | 성수동 |
| biz_004 | 성수 스터디룸 | - | study_room | 성수동 |
| biz_005 | 연남 책방 | - | cafe | 연남동 |
| biz_006 | 연남 라멘 | - | restaurant | 연남동 |
| biz_007 | 연남 헤어 | - | beauty | 연남동 |
| biz_008 | 역삼 커피하우스 | - | cafe | 역삼동 |
| biz_009 | 역삼 곱창집 | - | restaurant | 역삼동 |
| biz_010 | 역삼 네일 | - | beauty | 역삼동 |
| biz_011 | 성수 와인바 | - | restaurant | 성수동 |
| biz_012 | 성수 보드게임카페 | - | cafe | 성수동 |

---

## 3. Places (총 30곳)

12곳은 비즈프로필 연결, 18곳은 외부 지도만.

### 비즈프로필 연결 (12곳)
위 `businesses`와 1:1 매칭. `plc_001 ~ plc_012`.

### 외부 지도 only (18곳)
`plc_013 ~ plc_030`. `external_provider='kakao'`, `external_id` 적당히 부여.

| place_id | name | district | category | business_id |
|---|---|---|---|---|
| plc_013 | 성수 모카 | 성수동 | cafe | null |
| plc_014 | 성수 라떼하우스 | 성수동 | cafe | null |
| plc_015 | 성수 갈비집 | 성수동 | restaurant | null |
| plc_016 | 연남 디저트 | 연남동 | cafe | null |
| plc_017 | 연남 파스타 | 연남동 | restaurant | null |
| ... | ... | ... | ... | null |

### 분포
- 성수동: 12곳 (cafe 5, restaurant 4, study_room 1, beauty 1, etc 1)
- 연남동: 10곳
- 역삼동: 8곳

---

## 4. Meetings (총 8개)

### 주요 모임 4개 (데모 핵심)

| id | name | host | category | district | members |
|---|---|---|---|---|---|
| mtg_001 | 성수 독서모임 | u_001 | book_club | 성수동 | 6 |
| mtg_002 | 성수 푸디 클럽 | u_003 | foodie | 성수동 | 5 |
| mtg_003 | 연남 보드게임 | u_004 | board_game | 연남동 | 4 |
| mtg_004 | 역삼 러닝크루 | u_005 | running | 역삼동 | 8 |

### 추가 모임 4개

| id | name | category | district | members |
|---|---|---|---|---|
| mtg_005 | 성수 스터디 | study | 성수동 | 5 |
| mtg_006 | 성수 와인 클럽 | foodie | 성수동 | 4 |
| mtg_007 | 연남 카페 투어 | foodie | 연남동 | 6 |
| mtg_008 | 역삼 직장인 스터디 | study | 역삼동 | 7 |

---

## 5. Meeting Members

각 모임마다 호스트 + 멤버들. 총 약 45개 멤버십.
- 한 사용자가 여러 모임에 속할 수 있음 (실제 사용자처럼)
- `u_001`은 mtg_001 (host), mtg_002 (member)

---

## 6. Meeting Events (총 40건)

시즌 기간(2026-03-01 ~ 2026-05-31) 동안의 일정.

### 핵심 일정 분포

**성수동 코너 카페 (plc_001)** — 1위 후보, 8건
- mtg_001 (독서) × 3회: 3/15, 4/05, 4/26
- mtg_002 (푸디) × 2회: 3/22, 5/03
- mtg_005 (스터디) × 2회: 4/12, 5/10
- mtg_006 (와인) × 1회: 5/24

**○○ 키친 (plc_003, biz_003)** — 연남 카페 1위 후보 (사실 식당)
- mtg_002 × 2회
- mtg_006 × 1회

**나머지 30건**:
- 다른 가게들에 1-3건씩 분산
- 일부는 한 번도 안 간 가게 (점수 0)
- 미래 일정 5건 (5월 말~6월 초)

### 일정 상태
- 시드 데이터 시점에 따라:
  - 과거 일정: `status='ended'`
  - 미래 일정: `status='scheduled'`

---

## 7. Place Signals

각 일정마다 자동으로 시그널 생성:

### `selected` (40건)
- 일정 등록 = 1건씩
- weight: 1.0

### `rated` (35건, 평가율 87.5%)
- 종료된 일정 중 35건이 평가됨
- rating 분포:
  - 5점: 50% → weight 5.0
  - 4점: 30% → weight 4.0
  - 3점: 15% → weight 3.0
  - 2점: 5% → weight 2.0

### `mention` (60건)
- 18개 가게에 분산 (한 가게당 평균 3.3개)
- 성수동 코너 카페에 12개 (가장 많이 멘션)
- weight: 2.0 each

### `review` (20건, mocked)
- 시드로 직접 넣음
- weight: rating value (3-5)

---

## 8. Meeting Ratings (총 35건)

이벤트 종료 후 attendee들이 남긴 평가.
- 일정당 평균 3-4명이 평가
- 같은 user × event 조합은 1건만 (UNIQUE 제약)

---

## 9. Meeting Posts (총 25건)

모임 게시글. 일부는 @mention 포함.

| post_id | meeting | author | content | mentions |
|---|---|---|---|---|
| pst_001 | mtg_001 | u_002 | "어제 @성수동 코너 카페 다녀왔는데 너무 좋았어요" | [plc_001] |
| pst_002 | mtg_001 | u_001 | "다음 모임은 @성수 베이커리 어떠세요?" | [plc_002] |
| pst_003 | mtg_002 | u_003 | "@○○ 키친 강추합니다 🍽" | [plc_003] |
| ... | ... | ... | ... | ... |

---

## 10. Mentions (총 60건)

`meeting_posts`의 멘션이 `mentions` 테이블에 1건씩 들어감.
- 18개 가게에 멘션 분산
- 가장 많이 멘션된 가게: 성수동 코너 카페 (12건)

---

## 11. Seasons (총 2개)

| id | name | starts_at | ends_at | status |
|---|---|---|---|---|
| season_winter_2025 | Winter 2025 | 2025-12-01 | 2026-02-28 | closed |
| season_spring_2026 | Spring 2026 | 2026-03-01 | 2026-05-31 | active |

---

## 12. Place Score Snapshots (Winter 2025 시즌)

Winter 2025는 이미 종료된 시즌이라 snapshot 데이터 있음.

예시 (성수동 코너 카페, Winter 2025):
```json
{
  "place_id": "plc_001",
  "season_id": "season_winter_2025",
  "total_score": 98.5,
  "meetup_signal_score": 65.0,
  "mention_score": 18.0,
  "review_score": 15.5,
  "rank_district": 1,
  "rank_category": 3
}
```

Spring 2026 snapshot은 시즌이 active이라 시드에 없음. `/seasons/{id}/close` 호출하면 그때 계산됨.

---

## 13. Awards (Winter 2025만)

Winter 2025 시즌 수상 기록:

| award_id | season | district | category | rank | place |
|---|---|---|---|---|---|
| awd_001 | Winter 2025 | 성수동 | cafe | 1 | plc_013 (성수 모카) |
| awd_002 | Winter 2025 | 성수동 | cafe | 2 | plc_001 |
| awd_003 | Winter 2025 | 성수동 | cafe | 3 | plc_002 |
| awd_004 | Winter 2025 | 성수동 | restaurant | 1 | plc_003 |
| ... | ... | ... | ... | ... | ... |

**스토리**: Winter엔 성수 모카가 1위. Spring 2026엔 성수동 코너 카페가 떡상해서 1위 예정. 데모에서 `/seasons/close` 호출하면 이 결과 자동 생성됨.

---

## 14. Settlements (총 1건 — 데모용)

가장 명확한 정산 예시 1건만:

```json
{
  "settlement_id": "stl_001",
  "event_id": "evt_xxx",  // 성수 독서모임 마지막 일정
  "total_amount": 72000,
  "paid_by_user_id": "u_001",  // 민지가 결제
  "status": "completed",
  "transactions": [
    { "from": "u_002", "to": "u_001", "amount": 14400, "is_simulated": true },
    { "from": "u_007", "to": "u_001", "amount": 14400, "is_simulated": true },
    { "from": "u_008", "to": "u_001", "amount": 14400, "is_simulated": true },
    { "from": "u_009", "to": "u_001", "amount": 14400, "is_simulated": true }
  ]
}
```

---

## 시드 스크립트 구조

`backend/app/seed.py` 에서:

```python
def seed_all():
    seed_users()
    seed_businesses()
    seed_places()
    seed_meetings_and_members()
    seed_meeting_events()  # → place_signals 자동 생성
    seed_meeting_ratings()  # → place_signals 자동 추가
    seed_meeting_posts_and_mentions()  # → place_signals 자동 추가
    seed_mock_reviews()  # → place_signals 자동 추가
    seed_seasons()
    seed_winter_snapshot_and_awards()  # 지난 시즌 시상 결과
    seed_demo_settlement()
```

실행:
```bash
cd backend
python -m app.seed
```

---

## Demo Walk-through

데모 영상 또는 라이브 시나리오:

### 1분 30초 — "모임 일정 등록"
- 민지로 로그인
- 성수 독서모임 → 일정 등록
- 장소 검색: "성수동" → "성수동 코너 카페" 검색 결과에 **"모임 47건 다녀감"** 표시
- 선택 → 등록 완료

### 2분 — "가게 페이지"
- 성수동 코너 카페 페이지 진입
- 동네 점수 142.5점 표시
- 모임 데이터 카드: 47건, 평균 4.6, 재방문율 72%
- Winter 2025 수상 배지

### 3분 — "@mention"
- 모임 게시글 작성
- "어제 @" 입력 → 자동완성에 성수동 코너 카페 1위 노출
- 글 등록 → mention 시그널 +1

### 4분 — "랭킹"
- 랭킹 페이지 진입
- 성수동 × 카페 → 1위 성수동 코너 카페
- 점수 breakdown 표시

### 5분 — "추천받기"
- 독서모임 / 5명 / 성수동 / 저녁 입력
- 추천 결과: 92% 매치로 성수동 코너 카페 1위
- 이유: "독서모임 3건 다녀감", "평균 4.6"

### 6분 — "시즌 종료 + 시상"
- 관리자 화면에서 `/seasons/close` 트리거
- 자동으로 어워드 페이지 업데이트
- Spring 2026 성수동 카페 1위: 성수동 코너 카페

### 7분 — "정산 데모"
- 지난 모임 일정 진입
- 정산하기 → 72,000원 / 5명 = 14,400원
- 시뮬레이션 송금 카드 4건 표시

---

## 데이터 양 요약

| 테이블 | 건수 |
|---|---|
| users | 50 |
| businesses | 12 |
| places | 30 |
| meetings | 8 |
| meeting_members | ~45 |
| meeting_events | 40 |
| meeting_posts | 25 |
| meeting_ratings | 35 |
| place_signals | ~155 (40+35+60+20) |
| mentions | 60 |
| seasons | 2 |
| place_score_snapshots | 30 (Winter 2025만) |
| awards | ~24 (3개 동 × 4 카테고리 × 1-3위) |
| settlements | 1 |
| settlement_transactions | 4 |

**총 약 520건**의 데이터. 데모로는 충분, DB 부담 거의 없음.
