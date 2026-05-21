# Modang Frontend

Next.js 14 + SEED Design System frontend for Modang (모당).

## Prerequisites

- Node.js 18+
- npm

## Setup

```powershell
cd frontend
npm install
copy .env.local.example .env.local
```

> `@seed-design/rootage` is not published on npm; design tokens ship via `@seed-design/css`.

## Run

```powershell
npm run dev
```

### SEED + Next.js troubleshooting

If you see `Cannot find module './vendor-chunks/@seed-design.js'`:

1. Stop **all** running `next dev` processes (check ports 3000/3001).
2. Delete `.next`: `Remove-Item -Recurse -Force .next`
3. Start once: `npm run dev` (or `npm run dev:clean`)

This usually happens when `.next` is deleted while the dev server is still running.

Open http://localhost:3000 — use the dev link to open the schedule flow.

### Key routes (Week 1)

| Route | Screen |
|-------|--------|
| `/` | Dev entry link |
| `/meetings/1/events/new` | Screen A — 일정 기본 정보 |
| `/meetings/1/events/new/place` | Screen B — 장소 검색 |

## Build

```powershell
npm run build
```

## Stack

- Next.js 14 (App Router)
- TypeScript
- Tailwind CSS
- [@seed-design/react](https://seed-design.io) + `@seed-design/css`

## Project layout

```
app/meetings/[id]/events/new/   # Screen A + place sub-route
components/meetings/            # Form UI
context/EventDraftContext.tsx   # Shared draft state (A ↔ B)
lib/mocks/places.ts             # Place search mock data
```
