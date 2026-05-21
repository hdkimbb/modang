# PRD: 모당 (Modang)

> **모여라 당근으로** — A neighborhood-level recognition system that captures meetup venue data as social signals and surfaces the most loved local places through seasonal awards.

**Status:** v2 (Final for kickoff)
**Project name:** 모당 (Modang)
**Repository:** `modang`
**Last updated:** 2026-05-15

---

## 1. Overview

### 1.1 One-Liner
A side-project add-on to Karrot (당근) that captures meetup venue selections, ratings, and @mentions as social signals — then computes a neighborhood score for each place and runs seasonal awards to highlight the most loved local businesses. Includes a Karrot Pay settlement demo for post-meetup expense splitting.

### 1.2 Why This Project
- Karrot's Business Profile lacks rich social validation beyond reviews.
- Meetup venue choices are a **strong "N-person endorsement" signal** but are not currently captured as data.
- Small business owners have weak incentives to maintain their Business Profile.
- Local discovery on Karrot relies on search and reviews. A ranking / awards channel can become a new discovery surface.
- Post-meetup expense splitting is a real pain point that could leverage Karrot Pay.

### 1.3 Goals
1. **Learning** — Practice backend & DB design through AI-assisted development (entity modeling, scoring functions, ranking queries, seasonal snapshots, graph-based settlement).
2. **Portfolio** — Showcase end-to-end thinking: persona analysis → pain points → system design → implementation → retrospective.
3. **Validation** — Demonstrate visually that meetup data can serve as a stronger signal for business reputation than ratings alone.

### 1.4 Inspiration
- **Nextdoor Neighborhood Faves Awards** — annual recognition based on Faves, Recommendations, and @mentions over a one-year period.
- **Differentiation** — We add a stronger signal: **meetup attendance** (N-person agreement on a venue), which is more committed than a single "Fave."

---

## 2. Personas & JTBD

### 2.1 Meetup Host (모임장)
- **Pain:** Finding a venue for every meetup is exhausting. Group chat polls take time.
- **JTBD:** Quickly discover validated venues and keep a record of where my group has gone.
- **Value:** Browse meetup data per place → reduce decision cost. Recommendation feature suggests venues automatically.

### 2.2 Meetup Member (모임원)
- **Pain:** Anxious about unfamiliar venues. No social proof beforehand. Awkward to split expenses after.
- **JTBD:** Know what kind of place we're going to, and easily settle expenses after.
- **Value:** "12 meetups have visited, avg 4.6/5" on the place page. One-tap settlement via Karrot Pay.

### 2.3 Business Owner (가게 사장님)
- **Pain:** Unaware of which meetups frequent their place. No data to leverage for marketing.
- **JTBD:** Understand how my place is perceived in the neighborhood and use this socially.
- **Value:** Ranking + award badges become marketing assets at zero ad cost. @mentions surface the business naturally.

### 2.4 Casual Neighborhood User (동네 사용자)
- **Pain:** Hard to judge trustworthiness via search + reviews alone.
- **JTBD:** Discover socially validated local places.
- **Value:** Award ranking page becomes a discovery channel grounded in real social signals.

---

## 3. Core Insight

> **A meetup venue choice combines three things: N-person prior agreement, actual visit, and post-visit social validation. Captured as data, it becomes a stronger reputation signal than individual reviews. Aggregating these signals — alongside @mentions in neighborhood posts — lets businesses earn reputation passively, lets users discover validated places, and gives the platform a new ranking/awards surface.**

---

## 4. Minimal Meeting System (Base Layer)

Modang sits on top of Karrot's meetup feature. We replicate only the **minimum slice** needed to host our new features, not the full meetup product.

### 4.1 What we include
- **Meeting creation**: name, category, district, member count (host-only).
- **Meeting membership**: host + N members, pre-seeded (no invitation/approval workflow).
- **Meeting events**: scheduled date, time, **place (linked via entity)**, expected attendee count.
- **Meeting posts**: single feed of text posts within a meeting (this is where @mentions live).
- **Meeting event lifecycle**: scheduled → in-progress → ended (auto state by time).

### 4.2 What we explicitly skip
- ❌ Meetup recruitment / application / approval
- ❌ Member roles or permissions beyond host vs member
- ❌ Multiple post categories (one post type only)
- ❌ Photo albums
- ❌ Meeting-level finance management (only event-level settlement demo)
- ❌ Meetup discovery / search (we focus on place discovery)
- ❌ Host ratings

---

## 5. Feature Definition

### Phase 1 — Signal Collection (MVP Core)

#### F1. Place Entity System
- Unified `Place` entity that merges Karrot Business Profiles with external map data.
- Meetup events must reference a place by `place_id` (no free-text input).
- Place Resolution: when the same business is registered through different sources, dedupe into a single entity by name + coordinate proximity.

#### F2. Meetup ↔ Place Linkage
- When creating a meetup event, users select a place via search.
- Selection emits a `selected` signal (+1) on the place.

#### F3. Post-Meetup Rating
- After the scheduled time, attendees receive a simulated prompt to rate the venue.
- Inputs: 1–5 star rating + "would revisit?" toggle.
- Each rating emits a `rated` signal with weight proportional to rating.

#### F4. Place Page Meetup Card
- Place profile shows a meetup data card:
  - "N meetups have been hosted here"
  - Average rating, revisit rate
  - Recent meetups (anonymized: category, attendee count, date, rating)

### Phase 2 — Scoring System

#### F5. Place Neighborhood Score
- Auto-computed score per place:
  - Meetup signals (`selected` + `rated` + revisit)
  - Reviews & star ratings (mocked)
  - **@mention** count from neighborhood / meeting posts
- v1 keeps the function as a simple weighted sum. Time decay is out of scope for v1.

#### F6. District & Category Ranking
- Real-time ranking page filtered by district (e.g., Seongsu-dong) × category (cafe, restaurant, beauty, etc.).
- Top N place cards listed with score breakdown.

### Phase 3 — Mentions & Recommendations

#### F7. @Mention System
- In meeting posts and (mocked) neighborhood posts, users can mention `@place_name`.
- v1 uses a **structured picker**: typing `@` opens an autocomplete dropdown showing places in the user's district first.
- Mention resolves to a `Place` entity and emits a `mention` signal.
- Backend: autocomplete by district, mention parsing, entity matching.

#### F8. Meetup Venue Recommendation
- Input: meetup category, expected attendees, target district, preferred time.
- Output: ranked list of venues based on:
  - Past meetups of similar category that visited
  - Capacity match (attendee count vs typical meetup size at venue)
  - Aggregate rating
  - Recency of activity
- v1: rule-based scoring with weights. ML / collaborative filtering is out of scope.

### Phase 4 — Awards & Settlement

#### F9. Season Snapshot & Auto-Award
- Quarterly snapshot of scores.
- Winners auto-selected per district × category.
- Winning place shows a digital badge on its profile.

#### F10. Awards History
- Page listing past winners by season, district, and category.

#### F11. Karrot Pay Settlement Demo
- After a meetup event ends, host can trigger "Settle with Karrot Pay" flow.
- Inputs: total expense, paid-by user, attendee list.
- Backend computes minimum transactions (graph-based settlement to minimize the number of transfers).
- **Simulation only** — displays "○○ sent ₩N to △△" cards. No real money movement, no real Karrot Pay API.
- Purpose: showcase how meetup data flows into post-meetup commerce.

---

## 6. Out of Scope

Explicit exclusions to prevent scope creep:

- ❌ Chat FAQ system for business profiles
- ❌ Fave button (lightweight follow)
- ❌ Real payment / settlement infrastructure
- ❌ Real push notification delivery (simulated only)
- ❌ Real-time chat
- ❌ Abuse detection ML models (basic deduplication rules only)
- ❌ Meetup recruitment / matchmaking
- ❌ Native mobile apps (web only, mobile-first responsive)
- ❌ User authentication beyond a basic stub (seed users only)
- ❌ Multi-language support
- ❌ Production-grade observability / analytics
- ❌ Time decay scoring (v2)
- ❌ ML-based recommendation

---

## 7. Tech Stack

| Layer | Tool | Notes |
|---|---|---|
| Backend | Python + FastAPI | Auto-generates Swagger UI for API testing |
| Database | PostgreSQL | SQLite OK in dev for first 2 weeks |
| Frontend | Next.js + Tailwind CSS | App Router, TypeScript |
| **Design System** | **SEED Design System (`@seed-design/react`)** | Karrot's official OSS design system, Apache 2.0 |
| Design tokens | `@seed-design/rootage` | Color, spacing, typography tokens |
| AI integration | `@seed-design/mcp` | For AI-assisted development with SEED |
| ERD | dbdiagram.io | |
| API docs | Swagger UI | Built into FastAPI |
| Source control | GitHub | Public repo |
| Backend deploy | Railway | Free tier |
| Frontend deploy | Vercel | Free tier |
| Database hosting | Railway PostgreSQL | Free tier |

### 7.1 Design System Strategy
- Install `@seed-design/react`, `@seed-design/css`, and `@seed-design/rootage`.
- Use SEED components for: Top Navigation, List, Bottom Sheet, Action Button, Text Input, Chip, Tag Group, Segmented Control, Skeleton, Snackbar, Tabs, Divider, Avatar, Badge.
- Custom build for: Award badges, Place data cards, Meetup recommendation cards (use SEED tokens for consistency).
- Reference: https://seed-design.io and https://github.com/daangn/seed-design

---

## 8. Success Criteria

### Learning Outcomes (Primary)
- [ ] Read and explain the project's ERD
- [ ] Explain the scoring function design rationale
- [ ] Explain why season snapshots matter
- [ ] Read API specs and understand each endpoint's behavior
- [ ] Build fluency with AI-assisted development workflow (PM-as-PRD-author, AI-as-engineer)
- [ ] Understand how a design system is integrated into a frontend project

### Deliverables
- [ ] Public GitHub repository (`modang`)
- [ ] Live deployed URLs (frontend on Vercel, backend on Railway)
- [ ] README with persona analysis, ERD, API spec, design rationale, and screenshots
- [ ] Seed data enabling a complete demo scenario (places, meetups, mentions, awards, settlement)
- [ ] One retrospective post (Brunch or Notion)

---

## 9. MVP Scope

### Must Have
- F1. Place Entity System
- F2. Meetup ↔ Place Linkage
- F3. Post-Meetup Rating
- F4. Place Page Meetup Card
- F5. Place Neighborhood Score (simple sum)
- F6. District & Category Ranking
- Minimal Meeting System (Section 4)
- Seed data for demo

### Should Have
- F7. @Mention System
- F8. Venue Recommendation (rule-based)
- F9. Season Snapshot & Auto-Award (one closed season)
- F10. Awards History (basic page)
- F11. Karrot Pay Settlement Demo (single happy-path flow)

### Won't Have (this iteration)
- Time decay scoring
- Multi-season simulation
- Abuse detection
- Sophisticated rating-authority verification
- Real authentication
- Mention sentiment analysis
- Free-text Korean mention parsing (structured picker only)

---

## 10. Timeline (8 Weeks)

| Week | Phase | Deliverables |
|---|---|---|
| Week 1 | Design & Setup | ERD, API spec, GitHub repo, deploy environment, SEED installed |
| Week 2 | Minimal Meeting + Phase 1 Backend | Meeting + Place + Rating APIs + seed data |
| Week 3 | Phase 1 Frontend | Place page, meeting page (with SEED) |
| Week 4 | Phase 2 Score + Ranking | Scoring logic, ranking page |
| Week 5 | Phase 3 Mentions | @mention picker + signal capture |
| Week 6 | Phase 3 Recommendation + Phase 4 Awards | Venue recommendation, season + auto-award |
| Week 7 | Phase 4 Settlement Demo | 1/N settlement flow + UI |
| Week 8 | Polish & Docs | Deployment stability, README, screenshots, retrospective |

---

## 11. ERD Draft

```dbml
Table users {
  id varchar [pk]
  name varchar
  region varchar
  avatar_url varchar [null]
  created_at timestamp
}

Table businesses {
  id varchar [pk]
  name varchar
  owner_user_id varchar [ref: > users.id, null]
  category varchar
  verified boolean
}

Table places {
  id varchar [pk]
  name varchar
  address varchar
  lat float
  lng float
  district varchar
  category varchar
  business_id varchar [ref: > businesses.id, null]
  external_provider varchar [null]
  external_id varchar [null]
  created_at timestamp
}

Table meetings {
  id varchar [pk]
  host_user_id varchar [ref: > users.id]
  name varchar
  category varchar
  district varchar
  member_count int
  created_at timestamp
}

Table meeting_members {
  id varchar [pk]
  meeting_id varchar [ref: > meetings.id]
  user_id varchar [ref: > users.id]
  role varchar  // host, member
  joined_at timestamp
}

Table meeting_events {
  id varchar [pk]
  meeting_id varchar [ref: > meetings.id]
  place_id varchar [ref: > places.id]
  title varchar
  scheduled_at timestamp
  attendee_count int
  status varchar  // scheduled, in_progress, ended
  created_at timestamp
}

Table meeting_posts {
  id varchar [pk]
  meeting_id varchar [ref: > meetings.id]
  author_user_id varchar [ref: > users.id]
  content text
  created_at timestamp
}

Table place_signals {
  id varchar [pk]
  place_id varchar [ref: > places.id]
  signal_type varchar  // selected, rated, mention, review
  weight float
  source_ref varchar   // event_id, post_id, etc.
  user_id varchar [ref: > users.id, null]
  occurred_at timestamp
  is_void boolean
}

Table meeting_ratings {
  id varchar [pk]
  event_id varchar [ref: > meeting_events.id]
  user_id varchar [ref: > users.id]
  rating int
  would_revisit boolean
  created_at timestamp
}

Table mentions {
  id varchar [pk]
  post_id varchar [ref: > meeting_posts.id]
  place_id varchar [ref: > places.id]
  author_user_id varchar [ref: > users.id]
  context_text varchar
  created_at timestamp
}

Table seasons {
  id varchar [pk]
  name varchar
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
  rank_district int
  rank_category int
  computed_at timestamp
}

Table awards {
  id varchar [pk]
  season_id varchar [ref: > seasons.id]
  place_id varchar [ref: > places.id]
  district varchar
  category varchar
  rank int
  awarded_at timestamp
}

Table settlements {
  id varchar [pk]
  event_id varchar [ref: > meeting_events.id]
  total_amount int
  paid_by_user_id varchar [ref: > users.id]
  status varchar  // pending, completed
  created_at timestamp
}

Table settlement_transactions {
  id varchar [pk]
  settlement_id varchar [ref: > settlements.id]
  from_user_id varchar [ref: > users.id]
  to_user_id varchar [ref: > users.id]
  amount int
  is_simulated boolean
}
```

---

## 12. Demo Scenario (Seed Data)

A coherent story we'll prove out end-to-end:

**Setting:** Spring 2026 season (3 months: 2026-03-01 to 2026-05-31)

**Cast:**
- 30 places across Seongsu-dong, Yeonnam-dong, Yeoksam-dong (cafes, restaurants, beauty, study rooms)
- 8 meetup groups (book club, board games, running, study, foodie, etc.)
- 50 users distributed across districts

**Activity over the season:**
- 40 meetup events scheduled across the 30 places
- 35 events receive post-meetup ratings (avg 4.2/5)
- 60 meeting posts include @mentions of 18 different places
- 20 mock reviews exist on the Place pages

**Award outcome:**
- Cafe "Corner ○○" in Seongsu-dong: 8 meetups, 4.8 avg, 12 mentions → Seongsu Cafe Winner
- Restaurant "○○ Kitchen" in Yeonnam-dong: 5 meetups, 4.6 avg, 6 mentions → Yeonnam Restaurant Winner
- And so on...

**Settlement demo:**
- One meetup event (5 people at Corner ○○, ₩72,000) → 1/N settlement → 4 simulated transactions displayed

---

## 13. Risks & Mitigations

| Risk | Mitigation |
|---|---|
| AI-assisted dev produces code I don't understand | Require explanation pass on every PR; ask AI to comment why, not just what |
| Scope creep (especially around mentions/recommendation) | Out-of-scope list is binding; new ideas go to a "v2 ideas" doc |
| SEED component learning curve | Start Week 3 with simple components first (List, Button); add complex ones incrementally |
| Deployment friction | Choose tools known for one-click deploy (Vercel, Railway) |
| Losing motivation mid-project | Weekly micro-deliverable, never go more than 5 days without something visible |
| Seed data feels fake / unconvincing | Write a concrete narrative scenario first (see Section 12), then generate data to fit it |
| Tight timeline due to scope additions | Weekly checkpoint; if a phase slips by >3 days, drop a Should-Have into v2 |

---

## 14. Open Questions (To resolve as we build)

- Should the @mention feature parse free-text Korean (`@상호명`) or require a structured picker? — **v1: structured picker only.**
- How long is a "season"? Quarterly is more demo-friendly; annual is more realistic. — **v1: quarterly.**
- Should ratings be visible per attendee or aggregated only? — **v1: aggregated only (privacy).**
- Should the badge appear on the place page indefinitely or only during the next season? — **v1: indefinitely with season label ("Spring 2026 Winner").**
- Should settlement support uneven splits (e.g., one person pays double)? — **v1: even 1/N only.**
