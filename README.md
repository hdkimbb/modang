# 모당 (Modang)

> 모임 약속 장소가 곧 신뢰 데이터가 되는 동네 모임 플랫폼

[![Deploy](https://img.shields.io/badge/demo-modang.vercel.app-FF6F0F)](https://modang.vercel.app)
[![Stack](https://img.shields.io/badge/stack-Next.js%2014%20%2B%20FastAPI-blue)](#기술-스택)
[![License](https://img.shields.io/badge/license-Apache--2.0-green)](LICENSE)

---

## 데모

- **일반 사용자**: <https://modang.vercel.app>
- **사장**: <https://modang.vercel.app/owner?user_id=usr_owner_001>
- 상단 페르소나 셀렉터에서 **김사장** 선택으로도 전환 가능

---

## 컨셉

당근 모임 위에 **"장소 신뢰 시그널"** 컨셉을 얹었다. 사용자가 모임 약속 장소를 선택할 때마다 해당 장소에 신뢰 데이터가 누적되고, 다음 사용자의 검색·추천에 자동 반영된다. 사장은 자기 가게에 다녀간 모임 데이터로 인사이트를 얻고 어워드/노출 KPI를 관리할 수 있다.

### 시그널 누적 방식

| 시그널 | 행동 | 가중치 |
|---|---|---|
| `selected` | 모임의 활동 장소로 선택됨 | 1.0 |
| `rated` | 별점 등록 | 0.8 |
| `mentioned` | 게시판/댓글에서 `@장소` 멘션됨 | 0.5 |

→ 카테고리 × 동네별 합산 점수 = 랭킹 + 시즌 어워드. 사장에게는 노출 KPI.

---

## 페르소나

- **일반 사용자**: 모임 만들기, 일정 등록, 게시판/멘션, 별점, 신뢰 시그널 기반 장소 추천
- **사장 (Owner Studio)**: 다녀간 모임 분석, 인사이트, 어워드 뱃지, 광고센터(디자인 모형)

---

## 기술 스택

| 영역 | 스택 |
|---|---|
| Frontend | Next.js 14 (App Router), TypeScript, Tailwind, SEED Design System (Pretendard) |
| Backend | Python, FastAPI, SQLAlchemy, Alembic |
| DB | PostgreSQL (Railway) / SQLite (로컬) |
| 외부 API | 카카오 REST API (장소 검색), 카카오 JavaScript SDK (지도) |
| 배포 | Railway (백엔드 + DB), Vercel (프론트) |

---

## 주요 기능

| 영역 | 기능 | 상태 |
|---|---|---|
| 사용자 | 모임 만들기 / 일정 등록 / 장소 검색 | ✅ |
| 사용자 | 신뢰 시그널 기반 장소 추천 | ✅ |
| 사용자 | 모임 게시판 + `@장소` 멘션 자동완성 | ✅ |
| 사용자 | 별점 평가 + 일정 종료 후 유도 카드 | ✅ |
| 사용자 | 장소 랭킹 페이지 (카테고리 × 동네) | ✅ |
| 사용자 | 시즌 어워드 (분기별 TOP 3 자동 선정) | ✅ |
| 사장 | 대시보드 (홈/인사이트/도구) | ✅ |
| 사장 | 어워드 뱃지 + 멘션 통계 | ✅ |
| 사장 | 광고센터 | ⚠️ 디자인 모형 |

---

## 핵심 설계 결정

### 1. 시그널 가중치를 행동의 비용으로 정의

`selected (1.0) > rated (0.8) > mentioned (0.5)`. 사용자가 그 행동에 들이는 의도성/노력 순서로 가중치를 매겼다. 단순 멘션보다 실제 모임 장소로 선택한 행동에 신뢰를 더 부여하는 방식.

### 2. 어워드 시즌은 스냅샷 기반

`place_score_snapshots` 테이블로 시즌 종료 시점 점수를 고정. 시즌 종료 후 점수가 변동해도 과거 어워드는 불변. 어워드의 역사적 무결성 확보.

### 3. 일정 종료 판단을 API 지연 계산으로

별도 cron/scheduler 없이 `scheduled_at + 2h` 조건을 쿼리 시점에 평가. 사이드 프로젝트 운영 부담 최소화. 별점 유도 카드는 이 방식으로 동작.

### 4. 페르소나 전환 UI

DB의 `user_id` 기반으로 일반 사용자 ↔ 사장 페르소나를 즉시 전환. 시연 시 흐름 끊김 최소화.

---

## 로컬 실행

### 백엔드

```powershell
cd backend
python -m venv venv
.\venv\Scripts\activate
pip install -r requirements.txt
copy .env.example .env
# .env 에 KAKAO_REST_API_KEY 입력
alembic upgrade head
python -m app.seed
uvicorn app.main:app --reload
```

API 문서: <http://localhost:8000/docs>

### 프론트엔드

```powershell
cd frontend
npm install
copy .env.local.example .env.local
# .env.local 에 카카오 JS 키 입력
npm run dev
```

<http://localhost:3000>

---

## 주요 화면

| 경로 | 설명 |
|---|---|
| `/meetings` | 모임 리스트 + 평가 대기 카드 |
| `/meetings/new` | 모임 만들기 |
| `/meetings/[id]` | 모임 상세 (게시글 / 일정 탭) |
| `/meetings/[id]/events/new` | 일정 등록 + 장소 검색 |
| `/places/[id]` | 장소 상세 + 별점 등록 |
| `/ranking` | 카테고리 × 동네 랭킹 |
| `/awards` | 시즌 어워드 |
| `/owner` | 사장 대시보드 (홈/인사이트/도구) |
| `/owner/ads` | 광고센터 (디자인 모형) |

---

## 데모 시나리오

### 일반 사용자 흐름

1. `/meetings`에서 모임 탐색
2. 평가 대기 카드에서 다녀온 장소에 별점 등록 → `rated` 시그널 누적
3. 모임 상세 → 일정 등록 → 장소 검색 → 선택 → `selected` 시그널 누적
4. 모임 게시판에서 `@장소명` 멘션 → `mentioned` 시그널 누적
5. `/ranking`에서 점수 변동 확인
6. `/awards`에서 시즌 TOP 3 어워드 확인

### 사장 흐름

1. 페르소나를 **김사장**으로 전환 → `/owner` 진입
2. 홈 탭: 어워드 뱃지 + 랭킹 노출
3. 인사이트 탭: 게시판 멘션 통계 + 카테고리 TOP 3 + 시간대 분석
4. 도구 탭: 사장님 메시지 작성 → 일반 사용자 장소 검색에서 노출 확인

---

## 프로덕션 배포

### Railway (백엔드 + DB)

1. Root Directory: `backend`
2. PostgreSQL 서비스 추가 후 `DATABASE_URL` 연결
3. 환경 변수: `KAKAO_REST_API_KEY`, `ALLOWED_ORIGINS` (Vercel URL), `ENVIRONMENT=production`
4. 배포 후 Run command:
   - `alembic upgrade head`
   - `python scripts/seed_prod.py` *(빈 DB에 1회만)*

### Vercel (프론트)

1. Root Directory: `frontend`
2. `NEXT_PUBLIC_API_URL` = Railway 백엔드 URL
3. `NEXT_PUBLIC_KAKAO_JS_KEY` = 카카오 JS 키
4. 카카오 개발자 콘솔 Web 도메인에 Vercel URL 등록

---

## 문서

- [PRD](docs/01_PRD.md)
- [ERD](docs/W1_ERD.md)
- [API Spec](docs/W1_API_SPEC.md)

---

## 로드맵

- [x] 사용자: 모임 만들기 / 일정 등록 / 신뢰 시그널 누적
- [x] 사장: 대시보드 / 인사이트 / 도구
- [x] 페르소나 전환 UI
- [x] 별점 평가
- [x] 모임 게시판 + `@장소` 멘션
- [x] 장소 랭킹 페이지
- [x] 시즌 어워드 + 사장 뱃지
- [x] SEED 디자인 시스템 적용
- [x] 일정 종료 후 별점 유도 카드
- [ ] F8: 추천 가중치 룰 강화
- [ ] F11: 카카오페이 정산 데모
- [ ] 사장 광고센터 기능 구현 (현재 디자인 모형)

---

## License

Apache 2.0
