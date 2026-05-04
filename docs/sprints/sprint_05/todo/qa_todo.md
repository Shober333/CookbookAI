# Sprint 05 — QA Scenarios

> **Owner:** [DEV-QA]
> **Run date:** 2026-05-04 · **Status:** Independent local preflight passed; deployed smoke blocked pending Vercel URL and Neon database.

---

## Status Key

- `[ ]` Not run
- `[/]` Running
- `[x]` Passed
- `[!]` Failed
- `[-]` Deferred

---

## Local Regression

| # | Scenario | Steps | Expected | Status |
|---|----------|-------|----------|--------|
| Q5.1 | Typecheck | Run `npm run typecheck` | Clean | `[x]` |
| Q5.2 | Unit tests | Run `npm test` | All tests pass | `[x]` |
| Q5.3 | Production build | Run `npm run build` | Build succeeds | `[x]` |
| Q5.4 | E2E regression | Run `npx playwright test --project=chromium` | All tests pass | `[x]` |

---

## Deployment Setup

| # | Scenario | Steps | Expected | Status |
|---|----------|-------|----------|--------|
| Q5.5 | Required Vercel env vars documented | Review deployment docs / README | Every required variable has purpose, example, and source | `[x]` |
| Q5.6 | Missing-key behavior | Temporarily omit Gemini/YouTube vars in a safe env | App starts; import routes return controlled errors | `[x]` |
| Q5.7 | Database migration path | Run documented migration workflow against target DB or staging clone | Prisma schema applies cleanly or blocker is documented | `[-]` |

---

## Deployed Smoke

| # | Scenario | Steps | Expected | Status |
|---|----------|-------|----------|--------|
| Q5.8 | Deployed auth flow | Register/login/logout on deployed URL | User lands in library; protected pages redirect when signed out | `[-]` |
| Q5.9 | Text import with Gemini | With deployed `AI_PROVIDER=gemini`, paste a small recipe | Recipe saves and renders detail page | `[-]` |
| Q5.10 | URL import | Import a stable recipe URL | Recipe saves or shows a controlled site-blocked state | `[-]` |
| Q5.11 | YouTube link path | Import a video whose description contains recipe URL | App follows candidate URL and records YouTube link path | `[-]` |
| Q5.12 | YouTube description path | Import a video with recipe-like description text | App imports description and records YouTube description path | `[-]` |
| Q5.13 | YouTube no-recipe recovery | Import a no-recipe video | User sees designed recovery state; no recipe is saved | `[-]` |
| Q5.14 | Library/detail smoke | Open library and a saved recipe | No layout overlap; ingredients, method, scaling, unit toggle render | `[-]` |

---

## Demo Readiness

| # | Scenario | Steps | Expected | Status |
|---|----------|-------|----------|--------|
| Q5.15 | Desktop screenshot pass | Capture login, import, library, recipe detail | Screenshots saved if UI changed | `[x]` |
| Q5.16 | Mobile smoke pass | Repeat auth/import/library at 375px | Layout remains usable; tap targets pass | `[x]` |
| Q5.17 | Rollback notes | Review sprint report / deployment notes | Clear recovery steps for bad deploy, bad env, provider quota, and DB migration issue | `[x]` |

---

## Bugs Found

None from local preflight.

---

## Independent QA Evidence — 2026-05-04

- `npm run typecheck` — passed.
- `npm test` — passed, 9 files / 113 tests.
- `npm run build` — passed, Next.js built 15 routes.
- `DATABASE_URL="postgresql://cookbook:password@localhost:5432/cookbook?sslmode=require" npm run build:vercel` — passed; Postgres Prisma Client generated and Next.js built 15 routes.
- `npm run db:generate` — rerun after the Vercel build to restore the local SQLite Prisma Client before local E2E.
- `npx playwright test --project=chromium` — initial sandboxed run could not bind `0.0.0.0:3100`; rerun with local server permission passed, 27/27 Chromium tests.
- Missing Gemini key behavior is covered by `src/lib/ai-provider.test.ts`.
- Missing YouTube key behavior is covered by `src/lib/youtube-import.test.ts`.
- Provider/import controlled-error behavior is covered by `src/lib/recipe-import-service.test.ts`.

---

## Deployment Blocker

Deployed smoke cannot start until the Founder/dev operator provides or creates:

- Vercel project / preview URL.
- Neon Postgres `DATABASE_URL` or staging clone connection string.
- Vercel environment variables from `docs/deployment/VERCEL.md`.

No production migration or deployment was run in this QA pass.

---

## Recommendation

Local QA is green. Next step is an external deployment handoff: create or
provide the Vercel project and Neon database, run `npm run db:migrate:prod`
against the target database, deploy the current branch, then run Q5.8-Q5.14
against the deployed URL.
