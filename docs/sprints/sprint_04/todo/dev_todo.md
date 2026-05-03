# Sprint 04 — Dev Tasks

> **Owner:** [DEV-LEAD]
> **Sprint goal:** Production import hardening.
> **Status:** Planning started 2026-05-03.

---

## Status Key

- `[ ]` Not started
- `[/]` In progress
- `[~]` Blocked or needs Founder/CTO input
- `[x]` Done
- `[-]` Deferred

---

## Phase 0 — Decisions + Setup

| # | Task | Owner | Status | Acceptance Criteria |
|---|------|-------|--------|---------------------|
| 4.1 | Confirm Sprint 04 scope with Founder | `[CTO]` | `[~]` | Founder decides whether transcript fallback and provider work are Sprint 04 implementation tasks or planning-only |
| 4.2 | Record transcript fallback decision | `[CTO]` | `[ ]` | `docs/DECISIONS.md` states defer/spike/implement with rationale |
| 4.3 | Record provider/cost decision | `[CTO]` | `[ ]` | `docs/DECISIONS.md` states keep Claude, add adapter, or migrate provider with tradeoffs |

---

## Phase 1 — Live YouTube Validation

| # | Task | Owner | Status | Acceptance Criteria |
|---|------|-------|--------|---------------------|
| 4.4 | Validate real YouTube description-first flow | `[DEV:backend]` | `[ ]` | With `YOUTUBE_API_KEY` set, `/api/ai/import` handles a real YouTube URL and returns either `youtube-link`, `youtube-description`, or a clear no-recipe error |
| 4.5 | Document live-key setup and failure modes | `[DEV:backend]` | `[ ]` | README or sprint report explains required env vars, expected errors for missing/invalid keys, and how to reproduce |
| 4.6 | Harden YouTube error handling if live validation exposes gaps | `[DEV:backend]` | `[ ]` | Missing quota, invalid key, unavailable video, and empty description produce stable typed errors covered by tests |

---

## Phase 2 — Transcript Fallback, If Approved

| # | Task | Owner | Status | Acceptance Criteria |
|---|------|-------|--------|---------------------|
| 4.7 | Transcript feasibility spike | `[DEV:backend]` | `[~]` | Identify library/API approach, legal/terms risk, reliability, and test strategy before production code |
| 4.8 | Implement transcript fallback | `[DEV:backend]` | `[~]` | Only if approved: description-first remains primary; transcript runs only after no recipe link/text is found |
| 4.9 | Add transcript fallback tests | `[DEV:backend]` | `[~]` | Unit tests cover available transcript, unavailable transcript, and non-recipe transcript fast failure |

---

## Phase 3 — Provider/Cost Path, If Approved

| # | Task | Owner | Status | Acceptance Criteria |
|---|------|-------|--------|---------------------|
| 4.10 | Provider abstraction design | `[CTO]` | `[~]` | Small contract documented before code; no provider dependency added without approval |
| 4.11 | Implement provider adapter boundary | `[DEV:backend]` | `[~]` | Existing Claude path still passes all tests; adapter can be selected by env/config if approved |
| 4.12 | Provider smoke test | `[DEV-QA]` | `[~]` | Approved provider path successfully extracts one real or mocked recipe payload |

---

## Phase 4 — Production/Demo Hardening

| # | Task | Owner | Status | Acceptance Criteria |
|---|------|-------|--------|---------------------|
| 4.13 | Clean-checkout setup pass | `[DEV-QA]` | `[ ]` | Fresh `.env` from `.env.example`, `npm install`, `npm run db:migrate`, and `npm run dev` path is documented and works |
| 4.14 | Demo import checklist | `[DEV-QA]` | `[ ]` | URL import, text import, YouTube import/no-recipe state, library view, and recipe detail are manually or E2E verified |
| 4.15 | Stabilize expected auth/dev-server noise | `[DEV:backend]` | `[ ]` | Expected Auth.js/dev-server warnings are documented or reduced; no confusing startup blocker remains |

---

## Notes

- Tasks 4.7 through 4.12 are intentionally gated. They become implementation
  work only after Founder approval.
- Sprint 04 should prefer evidence and hardening over broad new UI surface area.
