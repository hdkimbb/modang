# Week 1 — GitHub Repository Structure

> 모당 (Modang) 프로젝트의 GitHub 레포지토리 셋업 가이드

---

## 1. Create the Repository

GitHub에서 새 레포지토리 만들 때 설정:

| 항목 | 값 |
|---|---|
| Repository name | `modang` |
| Description | 모여라 당근으로 — A neighborhood awards system inspired by Karrot meetups |
| Visibility | **Public** (portfolio용) |
| Initialize with README | ✅ |
| .gitignore | Node + Python (둘 다 추가하거나, 일단 Node로 시작) |
| License | **Apache 2.0** (SEED와 동일한 라이선스) |

---

## 2. Repository Structure

Monorepo로 가자. 프론트엔드와 백엔드 한 레포에서 관리.

```
modang/
├── README.md                  # 프로젝트 소개, 페르소나, 인사이트, 데모 링크
├── LICENSE                    # Apache 2.0
├── .gitignore
│
├── docs/                      # 설계 문서
│   ├── 01_PRD.md             # 이 PRD
│   ├── 02_ERD.md             # 데이터 모델
│   ├── 03_API_SPEC.md        # API 명세
│   ├── 04_FRONTEND_WIRES.md  # 프론트 화면 설계
│   ├── 05_SEED_DATA.md       # 시드 데이터 시나리오
│   └── images/               # 다이어그램, 스크린샷
│
├── backend/                   # FastAPI 백엔드
│   ├── app/
│   │   ├── main.py           # FastAPI 진입점
│   │   ├── models/           # SQLAlchemy 모델
│   │   ├── routers/          # API 엔드포인트
│   │   ├── schemas/          # Pydantic 스키마
│   │   ├── services/         # 비즈니스 로직 (점수 계산 등)
│   │   ├── db.py             # DB 연결
│   │   └── seed.py           # 시드 데이터 스크립트
│   ├── tests/
│   ├── requirements.txt
│   ├── .env.example
│   └── README.md             # 백엔드 셋업·실행 방법
│
├── frontend/                  # Next.js 프론트엔드
│   ├── app/                  # App Router
│   │   ├── (home)/           # 홈
│   │   ├── places/[id]/      # 가게 상세
│   │   ├── meetings/         # 모임 페이지들
│   │   ├── ranking/          # 랭킹
│   │   ├── awards/           # 어워드
│   │   └── layout.tsx
│   ├── components/           # 공통 컴포넌트
│   ├── lib/                  # API 클라이언트, 유틸
│   ├── public/
│   ├── package.json
│   ├── tailwind.config.ts
│   ├── tsconfig.json
│   ├── .env.example
│   └── README.md             # 프론트 셋업·실행 방법
│
└── .github/
    └── workflows/            # CI/CD (선택, 나중에)
```

---

## 3. README.md Template (최상위)

```markdown
# 모당 (Modang)

> **모여라 당근으로** — 동네 모임 데이터로 우리 동네의 사랑받는 가게를 발굴하는 시스템

[![Live Demo](https://img.shields.io/badge/Live-Demo-orange)](https://modang.vercel.app)
[![API Docs](https://img.shields.io/badge/API-Docs-blue)](https://modang-api.railway.app/docs)

## What is Modang?

당근 모임이 약속 장소로 선택하고 평가한 데이터를 누적해서, 
동네·카테고리별 우리동네 베스트 가게를 자동으로 시상하는 시스템.

## Key Features

- 🗺️ **Place Entity System** — 비즈프로필 + 외부 지도 장소 통합
- 📅 **Meetup ↔ Place** — 모임 일정에 장소 entity 연결
- ⭐ **Post-Meetup Rating** — 모임 후 자동 평가
- 🏆 **Neighborhood Awards** — 분기별 동네 베스트 가게 시상
- 💬 **@Mentions** — 글에서 가게 멘션 = 추천 신호
- 🎯 **Venue Recommendation** — 데이터 기반 모임 장소 추천
- 💸 **Karrot Pay Settlement Demo** — 모임 후 1/N 정산 시뮬레이션

## Tech Stack

- **Frontend**: Next.js 14 + Tailwind CSS + SEED Design System
- **Backend**: FastAPI + PostgreSQL
- **Deploy**: Vercel (frontend) + Railway (backend, DB)

## Documentation

- [📄 PRD](./docs/01_PRD.md)
- [🗂️ ERD](./docs/02_ERD.md)
- [🔌 API Spec](./docs/03_API_SPEC.md)
- [🖼️ Frontend Wires](./docs/04_FRONTEND_WIRES.md)
- [🌱 Seed Data](./docs/05_SEED_DATA.md)

## Inspiration

- [Nextdoor Neighborhood Faves Awards](https://about.nextdoor.com)
- [Karrot (당근)](https://www.daangn.com)
- [SEED Design System](https://github.com/daangn/seed-design)

## License

Apache 2.0
```

---

## 4. .gitignore (최상위)

```gitignore
# Dependencies
node_modules/
.pnp/
.pnp.js

# Python
__pycache__/
*.py[cod]
*$py.class
.venv/
venv/
*.egg-info/

# Build outputs
.next/
out/
dist/
build/

# Environment
.env
.env.local
.env.*.local

# IDE
.vscode/
.idea/
*.swp
*.swo

# OS
.DS_Store
Thumbs.db

# Logs
*.log
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# Testing
coverage/
.pytest_cache/

# Database
*.db
*.sqlite
*.sqlite3
```

---

## 5. Branch Strategy

심플하게:

- `main` — 항상 배포 가능한 상태
- `dev` — 개발 통합 브랜치 (선택)
- `feature/*` — 기능 단위 브랜치

학습용이라 너무 복잡하게 안 가도 됨. 처음엔 `main`에 직접 푸시해도 OK.

---

## 6. Recommended Commits Convention

Conventional Commits 가볍게 따라가자:

```
feat: 새 기능 추가
fix: 버그 수정
docs: 문서 변경
style: 코드 스타일 (포맷팅)
refactor: 리팩토링
chore: 빌드·설정 변경
seed: 시드 데이터 변경
```

예시:
```
feat(places): add place entity model and CRUD
docs(prd): add settlement feature spec
seed: add 30 places for Spring 2026 demo
```

---

## 7. Initial Setup Checklist

Week 1 끝까지 해야 할 것:

- [ ] GitHub 레포 `modang` 생성 (Public, Apache 2.0)
- [ ] README.md 작성
- [ ] docs/ 폴더에 PRD·ERD·API spec 추가
- [ ] backend/ FastAPI 기본 셋업 (Hello World 작동)
- [ ] frontend/ Next.js 기본 셋업 (Hello World 작동)
- [ ] frontend에 SEED 설치 (`@seed-design/react`, `@seed-design/css`, `@seed-design/rootage`)
- [ ] Railway에 백엔드 배포 (Hello World 라도)
- [ ] Vercel에 프론트엔드 배포 (Hello World 라도)
- [ ] 두 배포 URL이 README에 연결됨

---

## 8. 너가 직접 할 일 vs 내가 할 일

| 작업 | 누가 |
|---|---|
| GitHub 레포 생성 | 너 (5분) |
| 레포 URL 공유 | 너 |
| README 초안 | 내가 줌, 너가 커밋 |
| Backend / Frontend 코드 셋업 | 내가 코드 제공, 너가 복붙·커밋 |
| Railway / Vercel 가입 | 너 (GitHub 연동) |
| 배포 셋업 | 내가 가이드, 너가 클릭 |
| 환경 변수 설정 | 내가 가이드, 너가 입력 |
