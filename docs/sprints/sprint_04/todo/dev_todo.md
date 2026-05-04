# Sprint 04 — Dev Tasks

> **Owner:** [DEV-LEAD]
> **Sprint goal:** Production import hardening.
> **Status:** Dev complete; QA verified 2026-05-04; ready for CTO review.

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
| 4.4 | Validate real YouTube description-first flow | `[DEV:backend]` | `[x]` | YouTube API key works for live metadata lookup; live authenticated imports passed for external recipe link, description text, and no-recipe recovery paths |
| 4.5 | Document live-key setup and failure modes | `[DEV:backend]` | `[x]` | `README.md`, `.env.example`, and `CLAUDE.md` document YouTube, Gemini, timeout vars, and expected missing-key/no-recipe failure modes |
| 4.6 | Harden YouTube error handling if live validation exposes gaps | `[DEV:backend]` | `[x]` | Affiliate/merch domains from live validation are filtered; missing key, unavailable transcript, and no-recipe paths are covered by tests |

---

## Phase 2 — Transcript Fallback

| # | Task | Owner | Status | Acceptance Criteria |
|---|------|-------|--------|---------------------|
| 4.7 | Transcript feasibility spike | `[DEV:backend]` | `[x]` | Use public YouTube timed-text caption tracks after YouTube Data API description-first paths; tests mock transcript availability/unavailability |
| 4.8 | Implement transcript fallback | `[DEV:backend]` | `[x]` | Description-first remains primary; transcript runs only after no recipe link/text is found |
| 4.9 | Add transcript fallback tests | `[DEV:backend]` | `[x]` | Unit tests cover available transcript, unavailable transcript, and non-recipe transcript fast failure |

---

## Phase 3 — Gemini 2.5 Flash Provider Path

| # | Task | Owner | Status | Acceptance Criteria |
|---|------|-------|--------|---------------------|
| 4.10 | Provider abstraction design | `[CTO]` | `[x]` | Small neutral provider contract implemented in `src/lib/ai-provider.ts`; `docs/DECISIONS.md` records Gemini 2.5 Flash as the Sprint 04 production target |
| 4.11 | Implement Gemini provider adapter boundary | `[DEV:backend]` | `[x]` | Existing tests pass; `AI_PROVIDER=gemini`, `GEMINI_API_KEY`, and `GEMINI_MODEL` select Gemini 2.5 Flash |
| 4.12 | Gemini provider smoke test | `[DEV-QA]` | `[x]` | Mocked Gemini adapter tests pass; live Gemini smoke imported `Gemini Smoke Test Lemon Rice` with `AI_PROVIDER=gemini` |

---

## Phase 4 — Production/Demo Hardening

| # | Task | Owner | Status | Acceptance Criteria |
|---|------|-------|--------|---------------------|
| 4.13 | Clean-checkout setup pass | `[DEV-QA]` | `[x]` | `.env` setup, database migration, startup, and missing-key behavior verified; see `todo/qa_todo.md` Q4.1–Q4.2 |
| 4.14 | Demo import checklist | `[DEV-QA]` | `[x]` | URL import, text import, YouTube link/description/no-recipe states, library view, and recipe detail verified by QA and E2E |
| 4.15 | Stabilize expected auth/dev-server noise | `[DEV:backend]` | `[x]` | Registration/sign-in regression fixed; Playwright isolated on port 3100; expected Auth.js wrong-password noise documented in QA evidence |

---

## Notes

- Transcript fallback and Gemini 2.5 Flash are approved Sprint 04
  implementation scope.
- Direct Gemini video processing remains out of scope unless the Founder
  separately promotes it.
- Sprint 04 should prefer evidence and hardening over broad new UI surface area.
- CTO review remains the only open closeout gate.
