# Sprint 04 — Dev Tasks

> **Owner:** [DEV-LEAD]
> **Sprint goal:** Production import hardening.
> **Status:** Founder scope accepted 2026-05-03; ready for implementation.

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
| 4.1 | Confirm Sprint 04 scope with Founder | `[CTO]` | `[x]` | Founder approved transcript fallback and Gemini 2.5 Flash provider work for Sprint 04 |
| 4.2 | Record transcript fallback decision | `[CTO]` | `[x]` | `docs/DECISIONS.md` states transcript fallback belongs to Sprint 04 |
| 4.3 | Record provider/cost decision | `[CTO]` | `[x]` | `docs/DECISIONS.md` states Gemini 2.5 Flash replaces Claude as Sprint 04 production provider target |

---

## Phase 1 — Live YouTube Validation

| # | Task | Owner | Status | Acceptance Criteria |
|---|------|-------|--------|---------------------|
| 4.4 | Validate real YouTube description-first flow | `[DEV:backend]` | `[ ]` | With `YOUTUBE_API_KEY` set, `/api/ai/import` handles a real YouTube URL and returns either `youtube-link`, `youtube-description`, or a clear no-recipe error |
| 4.5 | Document live-key setup and failure modes | `[DEV:backend]` | `[ ]` | README or sprint report explains required env vars, expected errors for missing/invalid keys, and how to reproduce |
| 4.6 | Harden YouTube error handling if live validation exposes gaps | `[DEV:backend]` | `[ ]` | Missing quota, invalid key, unavailable video, and empty description produce stable typed errors covered by tests |

---

## Phase 2 — Transcript Fallback

| # | Task | Owner | Status | Acceptance Criteria |
|---|------|-------|--------|---------------------|
| 4.7 | Transcript feasibility spike | `[DEV:backend]` | `[ ]` | Identify library/API approach, legal/terms risk, reliability, and test strategy before production code |
| 4.8 | Implement transcript fallback | `[DEV:backend]` | `[ ]` | Description-first remains primary; transcript runs only after no recipe link/text is found |
| 4.9 | Add transcript fallback tests | `[DEV:backend]` | `[ ]` | Unit tests cover available transcript, unavailable transcript, and non-recipe transcript fast failure |

---

## Phase 3 — Gemini 2.5 Flash Provider Path

| # | Task | Owner | Status | Acceptance Criteria |
|---|------|-------|--------|---------------------|
| 4.10 | Provider abstraction design | `[CTO]` | `[ ]` | Small contract documented before code; Gemini 2.5 Flash is the Sprint 04 production target |
| 4.11 | Implement Gemini provider adapter boundary | `[DEV:backend]` | `[ ]` | Existing tests pass; `AI_PROVIDER=gemini`, `GEMINI_API_KEY`, and `GEMINI_MODEL` select Gemini 2.5 Flash |
| 4.12 | Gemini provider smoke test | `[DEV-QA]` | `[ ]` | Gemini path successfully extracts one real or mocked recipe payload |

---

## Phase 4 — Production/Demo Hardening

| # | Task | Owner | Status | Acceptance Criteria |
|---|------|-------|--------|---------------------|
| 4.13 | Clean-checkout setup pass | `[DEV-QA]` | `[ ]` | Fresh `.env` from `.env.example`, `npm install`, `npm run db:migrate`, and `npm run dev` path is documented and works |
| 4.14 | Demo import checklist | `[DEV-QA]` | `[ ]` | URL import, text import, YouTube import/no-recipe state, library view, and recipe detail are manually or E2E verified |
| 4.15 | Stabilize expected auth/dev-server noise | `[DEV:backend]` | `[ ]` | Expected Auth.js/dev-server warnings are documented or reduced; no confusing startup blocker remains |

---

## Notes

- Transcript fallback and Gemini 2.5 Flash are approved Sprint 04
  implementation scope.
- Direct Gemini video processing remains out of scope unless the Founder
  separately promotes it.
- Sprint 04 should prefer evidence and hardening over broad new UI surface area.
