# Sprint 06 — Dev Tasks

> **Owner:** [DEV-LEAD]  
> **Sprint goal:** YouTube source continuity, Browserbase public-page fallback,
> and deployed source smoke.
> **Status:** Draft CTO plan; ready for Founder review.

---

## Status Key

- `[ ]` Not started
- `[/]` In progress
- `[~]` Blocked or needs Founder/CTO input
- `[x]` Done
- `[-]` Deferred

---

## Phase 0 — Scope + Contract

| # | Task | Owner | Status | Acceptance Criteria |
|---|------|--------|--------|---------------------|
| 6.1 | Confirm Sprint 06 scope | `[CTO]` | `[ ]` | Founder confirms Sprint 06 focuses on YouTube source continuity and deployed YouTube smoke |
| 6.2 | Define source metadata contract | `[DEV-LEAD]` + `[DEV:backend]` | `[ ]` | Contract distinguishes `sourceUrl`, original YouTube video URL, source kind, source domain, and Browserbase fallback source without breaking existing recipes |
| 6.3 | UI/UX source presentation check | `[UI/UX]` | `[ ]` | Embed placement, source label, loading/error/no-video states are approved or existing docs are confirmed sufficient |
| 6.4 | Define Browserbase boundary | `[CTO]` + `[DEV-LEAD]` | `[ ]` | Sprint docs state Browserbase is only for public blocked/JS-heavy pages, not paywalls, logins, CAPTCHA bypass, or private content |

---

## Phase 1 — Backend + Data

| # | Task | Owner | Status | Acceptance Criteria |
|---|------|--------|--------|---------------------|
| 6.5 | Add source metadata fields | `[DEV:backend]` | `[ ]` | Local SQLite and Postgres schemas/migrations store original YouTube video URL and source kind; old recipes remain readable |
| 6.6 | Persist YouTube origin during import | `[DEV:backend]` | `[ ]` | YouTube link, description, and transcript imports save original video URL separately from resolved recipe/source URL |
| 6.7 | Expose source metadata in recipe APIs | `[DEV:backend]` | `[ ]` | Recipe list/detail responses include source metadata needed by frontend; tests cover YouTube and non-YouTube recipes |
| 6.8 | Import response contract tests | `[DEV:backend]` | `[ ]` | Tests cover `sourceKind`, `sourceUrl`, `sourceDomain`, original video URL, and Browserbase fallback metadata for import paths |

---

## Phase 2 — Browserbase Fallback

| # | Task | Owner | Status | Acceptance Criteria |
|---|------|--------|--------|---------------------|
| 6.9 | Add Browserbase env contract | `[DEV:backend]` | `[ ]` | `.env.example` and deployment docs list `BROWSERBASE_API_KEY`, `BROWSERBASE_PROJECT_ID` if required, enable flag, timeout, and cost/usage warning |
| 6.10 | Implement deterministic Browserbase fetch/render adapter | `[DEV:backend]` | `[ ]` | Adapter renders public pages through Browserbase/Playwright, extracts readable text, closes sessions, and avoids AI browser control by default |
| 6.11 | Wire fallback into URL import | `[DEV:backend]` | `[ ]` | Normal fetch remains first path; Browserbase runs only when enabled and fetch fails or returns unusable JS-heavy content |
| 6.12 | Browserbase error handling tests | `[DEV:backend]` | `[ ]` | Missing key, timeout, session failure, and still-unreadable page return controlled errors without saving recipes |

---

## Phase 3 — Frontend

| # | Task | Owner | Status | Acceptance Criteria |
|---|------|--------|--------|---------------------|
| 6.13 | Embed YouTube video on recipe detail | `[DEV:frontend]` | `[ ]` | Recipes with original YouTube URL render an accessible, responsive embed; non-YouTube recipes are unchanged |
| 6.14 | Add source label/detail copy | `[DEV:frontend]` | `[ ]` | UI communicates YouTube source, resolved recipe source, and Browserbase-assisted import where useful without confusing users; copy follows `[UI/UX]` guidance |
| 6.15 | Mobile and keyboard pass | `[DEV:frontend]` | `[ ]` | Embed and source controls fit at 375px, preserve focus visibility, and do not break existing recipe detail controls |

---

## Phase 4 — Deployed Smoke + Demo

| # | Task | Owner | Status | Acceptance Criteria |
|---|------|--------|--------|---------------------|
| 6.16 | Stable YouTube demo set | `[DEV-QA]` | `[ ]` | One link-description video, one description-recipe video, and one no-recipe video are documented |
| 6.17 | Stable Browserbase demo URL | `[DEV-QA]` | `[ ]` | One public blocked/JS-heavy recipe page is documented; not paywalled, login-required, or CAPTCHA-gated |
| 6.18 | Deployed YouTube smoke | `[DEV-QA]` | `[ ]` | Link, description, and no-recipe paths are verified on Vercel or blocker is documented with exact error |
| 6.19 | Deployed Browserbase fallback smoke | `[DEV-QA]` | `[ ]` | Browserbase-assisted import succeeds on the stable public sample or account/quota blocker is documented |
| 6.20 | Demo script update | `[DEV-LEAD]` | `[ ]` | Demo notes cover auth, text import, URL import, Browserbase-assisted URL import, YouTube import, source embed, and controlled blocked-site recovery |
| 6.21 | Dev report | `[DEV-LEAD]` | `[ ]` | `docs/sprints/sprint_06/reports/sprint_06_report.md` summarizes implementation, tests, deployment evidence, and deferrals |

---

## Explicit Deferrals

- Direct Gemini video understanding fallback.
- Recipe macros/nutrition estimates.
- Guest mode.
- Paywall, login wall, CAPTCHA, or private-content bypass.
