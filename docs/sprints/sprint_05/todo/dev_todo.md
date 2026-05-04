# Sprint 05 — Dev Tasks

> **Owner:** [DEV-LEAD]
> **Sprint goal:** Vercel demo deployment readiness.
> **Status:** Founder-approved; ready for dev start.

---

## Status Key

- `[ ]` Not started
- `[/]` In progress
- `[~]` Blocked or needs Founder/CTO input
- `[x]` Done
- `[-]` Deferred

---

## Phase 0 — Founder Decisions + Docs

| # | Task | Owner | Status | Acceptance Criteria |
|---|------|--------|--------|---------------------|
| 5.1 | Confirm Sprint 05 scope | `[CTO]` | `[x]` | Founder confirmed deployment/demo readiness as Sprint 05 scope on 2026-05-04 |
| 5.2 | Record deployment/database decisions | `[CTO]` | `[x]` | `docs/DECISIONS.md` records deployment target, production DB target, and demo posture |
| 5.3 | Refresh architecture production section | `[CTO]` | `[x]` | `docs/ARCHITECTURE.md` reflects Gemini as production target and current env vars |

---

## Phase 1 — Environment + Database Readiness

| # | Task | Owner | Status | Acceptance Criteria |
|---|------|--------|--------|---------------------|
| 5.4 | Production env var checklist | `[DEV:backend]` | `[ ]` | README or deployment doc lists required Vercel vars: `AUTH_SECRET`, `NEXTAUTH_URL`/`AUTH_URL`, `DATABASE_URL`, `AI_PROVIDER`, `GEMINI_API_KEY`, `GEMINI_MODEL`, `YOUTUBE_API_KEY`, optional fallback vars |
| 5.5 | Database migration workflow | `[DEV:backend]` | `[ ]` | Production migration command/path is documented; local SQLite flow remains unchanged |
| 5.6 | Verify Prisma production compatibility | `[DEV:backend]` | `[ ]` | Build/migration path works with Postgres-compatible `DATABASE_URL` assumptions or documents blocker clearly |

---

## Phase 2 — Vercel Deployment Setup

| # | Task | Owner | Status | Acceptance Criteria |
|---|------|--------|--------|---------------------|
| 5.7 | Vercel build readiness pass | `[DEV:backend]` | `[ ]` | `npm run build` passes with production-like env assumptions; no local SQLite-only build dependency blocks deploy |
| 5.8 | Auth URL/domain hardening | `[DEV:backend]` | `[ ]` | Auth works with deployed origin; logout and protected-route redirects remain stable |
| 5.9 | Provider error hardening for deployed app | `[DEV:backend]` | `[ ]` | Missing/invalid Gemini and YouTube keys produce user-safe errors and do not crash startup |

---

## Phase 3 — Demo UX Fixes If Needed

| # | Task | Owner | Status | Acceptance Criteria |
|---|------|--------|--------|---------------------|
| 5.10 | Deployed import UX fix pass | `[DEV:frontend]` | `[ ]` | Only if QA finds deployed layout/copy/state problems; fixes follow `docs/ui/` |
| 5.11 | Demo account flow polish | `[DEV:frontend]` | `[ ]` | Only if QA finds friction in register/login/logout during deployed smoke |

---

## Phase 4 — Reports

| # | Task | Owner | Status | Acceptance Criteria |
|---|------|--------|--------|---------------------|
| 5.12 | Dev report | `[DEV-LEAD]` | `[ ]` | `docs/sprints/sprint_05/reports/sprint_05_report.md` summarizes completed/deferred tasks, env decisions, deploy URL if available, and known issues |

---

## Explicit Deferrals

- Guest mode remains deferred unless Founder promotes it.
- Direct Gemini video understanding remains deferred.
- Browserbase import fallback remains deferred to a later resilience spike.
- Recipe macros/nutrition estimates remain deferred to a nutrition-focused
  sprint.
- YouTube recipe embeds remain deferred until source/video URL metadata is
  modeled cleanly.
- Hosted production observability remains deferred beyond basic logs and demo
  notes.
