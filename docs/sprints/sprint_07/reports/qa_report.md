# Sprint 07 - QA Report

> **Owner:** [DEV-QA]  
> **Run date:** 2026-05-06  
> **Status:** Local regression and nutrition UI QA pass; live-provider/deployed smoke deferred.

---

## Summary

Sprint 07 now passes the local QA gates:

- `npm run typecheck` - passed.
- `npm test` - passed: 14 test files, 161 tests.
- `npm run build` - passed.
- `DATABASE_URL=postgresql://cookbook:stub@localhost:5432/cookbook npm run build:vercel` - passed.
- `npx playwright test --project=chromium` - passed: 33 passed, 3 skipped.
- `npx playwright test tests/e2e/sprint7.spec.ts --project=chromium` - passed: 3 passed.

The earlier browser blocker is no longer active in this environment. The actual
local setup issue was stale Prisma state: the generated client was missing the
Sprint 07 `nutritionEstimate` field, and the local SQLite database had not
applied migration `20260506120000_add_nutrition_estimate`. After
`npm run db:generate` and `npm run db:migrate`, the full browser suite passed.

---

## Local Regression Matrix

| Scenario | Result | Evidence |
|---|---:|---|
| Q7.1 Typecheck | Passed | `npm run typecheck` completed cleanly |
| Q7.2 Unit tests | Passed | `npm test`: 14 files / 161 tests passed |
| Q7.3 Local production build | Passed | `npm run build` completed cleanly |
| Q7.4 Vercel-style build | Passed | `build:vercel` completed with stub Postgres URL and restored the local Prisma client |
| Q7.5 E2E regression | Passed | Full Chromium suite: 33 passed, 3 skipped |

---

## Feature Coverage

### Nutrition / Macros

- Unit coverage exists for macro calculation, partial matches, all-unmatched
  no-match behavior, USDA missing-key handling, and nutrient parsing.
- API route `POST /api/recipes/[id]/nutrition` exists and owner-checks the
  recipe before calculation.
- `tests/e2e/sprint7.spec.ts` browser-verifies saved full and partial nutrition
  estimates on recipe detail.
- Desktop nutrition panel rendering passed.
- Mobile 375px partial-estimate rendering passed, including no horizontal
  overflow.
- Missing USDA key renders a controlled configuration error from the Calculate
  action.
- Live USDA lookup is deferred because no `FOODDATA_CENTRAL_API_KEY` was
  available.

### Groq GPT-OSS Provider

- Mocked Groq unit tests are included in the passing test suite.
- Missing-key behavior is covered by unit tests.
- Default-provider regression is covered by the passing full local suite.
- Live Groq smoke was deferred because no `GROQ_API_KEY` was available.

### AI-Direct YouTube Video Fallback

- Mocked video fallback unit tests are included in the passing test suite.
- Live Gemini video fallback smoke was deferred because no live video-provider
  key was available in this QA environment.

### Deployed Smoke

Deferred. QA did not verify that Sprint 07 is deployed to the live Vercel URL
and did not have live USDA/Groq/Gemini credentials for production smoke.

---

## Bugs / Blockers

**Bug:** Local Prisma setup missing Sprint 07 nutrition migration  
**Steps to Reproduce:**
1. Run `npm run typecheck` or `npx playwright test --project=chromium` before refreshing Prisma state.
2. Observe Prisma Client type errors or recipe API 500s during browser tests.
**Expected:** The generated client and local SQLite database include `Recipe.nutritionEstimate`.  
**Actual:** Typecheck failed until `npm run db:generate`; browser recipe API calls failed with Prisma `P2022` until `npm run db:migrate`.  
**Severity:** Medium for local QA setup, Low for product behavior after migration  
**Repro environment:** Codex desktop, local SQLite, local Next dev server.

Fix status: resolved locally. `npm run db:generate` refreshed Prisma Client, and
`npm run db:migrate` applied `20260506120000_add_nutrition_estimate`. The final
full Chromium run passed.

---

## Screenshots

Captured locally:

- `tests/screenshots/recipe-nutrition-full-desktop.png`
- `tests/screenshots/recipe-nutrition-partial-mobile.png`

Note: these nutrition screenshots exist in the workspace but are ignored by the
current git rules, matching the existing screenshot artifact behavior.

---

## QA Recommendation

Local Sprint 07 QA is green for compile, unit, build, browser regression, and
nutrition UI coverage. Before full sprint closeout, run the live-provider and
deployed smoke checks if the CTO/Founder require production confidence:

- USDA macro lookup with `FOODDATA_CENTRAL_API_KEY`.
- Groq import/adaptation smoke with `GROQ_API_KEY`.
- Gemini direct-video fallback smoke with the configured video-provider key.
- Vercel deployed auth/library/macro/provider smoke against the current Sprint
  07 deployment.
