# 모당 (Modang)

> 모임 약속 장소가 곧 신뢰 데이터가 되는 동네 모임 플랫폼

## 데모

- 일반 사용자 데모: _(Vercel 배포 후 URL 추가)_
- 사장 데모: _(Vercel 배포 후 `/owner?user_id=usr_owner_001` 추가)_
- 테스트: 상단 페르소나 셀렉터에서 **김사장** 선택

## 스크린샷

_(배포 후 추가)_

## 컨셉

당근 모임 위에 더해진 "장소 신뢰 시그널" 컨셉. 사용자가 모임 약속 장소를 선택할 때마다 해당 장소에 N명 동의의 신뢰 데이터가 누적되고, 다음 사용자의 검색에 자동 반영된다. 사장은 자기 가게에 다녀간 모임 데이터로 인사이트를 얻고 마케팅 메시지를 노출할 수 있다.

## 페르소나

- **일반 사용자**: 모임 만들기, 일정 등록, 신뢰 시그널 기반 장소 추천
- **사장 (Owner Studio)**: 다녀간 모임 분석, 인사이트, 사장님 메시지 노출, 추천 카테고리 설정

## 기술 스택

- **Backend**: Python, FastAPI, SQLAlchemy, Alembic, PostgreSQL (로컬: SQLite)
- **Frontend**: Next.js 14, TypeScript, Tailwind, SEED Design System
- **외부**: 카카오 REST API (장소 검색), 카카오 JavaScript SDK (지도)
- **배포**: Railway (백엔드 + DB), Vercel (프론트)

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

API 문서: http://localhost:8000/docs

### 프론트엔드

```powershell
cd frontend
npm install
copy .env.local.example .env.local
# .env.local 에 카카오 JS 키 입력
npm run dev
```

http://localhost:3000

## 주요 화면

| 경로 | 설명 |
|------|------|
| `/meetings` | 모임 리스트 |
| `/meetings/new` | 모임 만들기 |
| `/meetings/[id]/events/new` | 일정 등록 + 장소 검색 |
| `/owner?user_id=usr_owner_001` | 사장 대시보드 |

## 데모 시나리오

1. 페르소나 셀렉터에서 일반 사용자 선택 → `/meetings`에서 모임 탐색
2. 모임 상세 → 일정 등록 → 장소 검색(카카오 + 시그널) → 일정 저장
3. 페르소나를 **김사장**으로 전환 → `/owner`에서 홈/인사이트/도구 탭 확인
4. 도구 탭에서 사장님 메시지 작성 후, 일반 사용자 장소 검색에서 노출 확인

## 프로덕션 배포 (Railway)

1. Root Directory: `backend`
2. PostgreSQL 서비스 추가 후 `DATABASE_URL` 연결
3. 환경 변수: `KAKAO_REST_API_KEY`, `ALLOWED_ORIGINS`(Vercel URL), `ENVIRONMENT=production`
4. 배포 후 Run command:
   - `alembic upgrade head`
   - `python scripts/seed_prod.py` _(빈 DB에 1회만)_

## 프로덕션 배포 (Vercel)

1. Root Directory: `frontend`
2. `NEXT_PUBLIC_API_URL` = Railway 백엔드 URL
3. `NEXT_PUBLIC_KAKAO_JS_KEY` = 카카오 JS 키
4. 카카오 개발자 콘솔 Web 도메인에 Vercel URL 등록

## 문서

- [PRD](./docs/01_PRD.md)
- [ERD](./docs/W1_ERD.md)
- [API Spec](./docs/W1_API_SPEC.md)

## 로드맵

- [x] 사용자: 모임 만들기, 일정 등록, 신뢰 시그널 누적
- [x] 사장: 대시보드, 인사이트, 메시지, 추천 노출
- [x] 페르소나 전환 UI
- [x] 별점 평가 (Phase G)
- [ ] 랭킹 페이지 (Phase H)
- [ ] 시즌 어워드 (PRD F9)
- [ ] PC 사장 대시보드 + 쿠폰 발행

## License

Apache 2.0
