# 모당 (Modang)

> **모여라 당근으로** — 동네 모임 데이터로 우리 동네의 사랑받는 가게를 발굴하는 시스템

## What is Modang?

당근 모임이 약속 장소로 선택하고 평가한 데이터를 누적해서,
동네·카테고리별 우리동네 베스트 가게를 자동으로 시상하는 시스템.

당근에 영감받은 사이드 프로젝트입니다.

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
- [🗂️ ERD](./docs/W1_ERD.md)
- [🗃️ DB Design](./docs/W1_DB_DESIGN.md)
- [🔌 API Spec](./docs/W1_API_SPEC.md)
- [🖼️ Frontend Wires](./docs/W1_FRONTEND_WIRES.md)
- [🌱 Seed Data](./docs/W1_SEED_DATA.md)
- [📂 Repo Structure](./docs/W1_REPO_STRUCTURE.md)

## Status

🚧 Work in Progress — Week 1 Setup

## Inspiration

- [Nextdoor Neighborhood Faves Awards](https://about.nextdoor.com)
- [Karrot (당근)](https://www.daangn.com)
- [SEED Design System](https://github.com/daangn/seed-design)

## License

Apache 2.0