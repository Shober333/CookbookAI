# Sprint 07 - QA Report

> **Owner:** [DEV-QA]  
> **Run date:** 2026-05-06  
> **Status:** Local regression, nutrition UI, Groq mocks, deployed baseline, and deployed USDA macro calculation pass; USDA match quality still needs review.

---

## Summary

Sprint 07 now passes the local QA gates:

- `npm run typecheck` - passed.
- `npm test` - passed: 14 test files, 161 tests.
- Focused Groq/macros tests passed: 3 files, 30 tests.
- `npm run build` - passed.
- `DATABASE_URL=postgresql://cookbook:stub@localhost:5432/cookbook npm run build:vercel` - passed.
- `npx playwright test --project=chromium` - passed: 33 passed, 3 skipped.
- `npx playwright test tests/e2e/sprint7.spec.ts --project=chromium` - passed: 3 passed.
- Deployed URL checked: `https://cookbook-ai-5qdb.vercel.app/`.
- Deployed registration/login, recipe creation, saved macro-estimate persistence,
  and text import smoke passed.
- Deployed live macro calculation passed on recheck: `POST /api/recipes/[id]/nutrition`
  returned `200` with `source: "usda-fdc"` and a saved estimate.
- USDA lookup quality needs review: FoodData Central matched `tomatoes` to
  `Tomato powder`, producing an implausibly high calorie estimate for fresh
  tomatoes.

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
- Focused unit coverage now also verifies USDA no-match, rate-limit, and network
  failure handling.
- API route `POST /api/recipes/[id]/nutrition` exists and owner-checks the
  recipe before calculation.
- `tests/e2e/sprint7.spec.ts` browser-verifies saved full and partial nutrition
  estimates on recipe detail.
- Desktop nutrition panel rendering passed.
- Mobile 375px partial-estimate rendering passed, including no horizontal
  overflow.
- Missing USDA key renders a controlled configuration error from the Calculate
  action.
- Deployed saved macro-estimate persistence passed: a recipe created with a
  `nutritionEstimate` was fetched back with `perServing.calories = 160` and
  `source = "usda-fdc"`.
- Deployed recipe detail HTML for that saved estimate contained `Macros` and
  `Approximately 160 calories per serving`.
- Deployed live USDA lookup passed on 2026-05-06 at
  `https://cookbook-ai-5qdb.vercel.app/`: a fresh recipe with tomatoes, pasta,
  and olive oil returned `200`, persisted `source: "usda-fdc"`, matched 3 of 3
  ingredients, and had no unmatched ingredients.
- USDA match quality needs follow-up: the deployed run matched `tomatoes` to
  `Tomato powder`, which inflated the estimate to `2312.5` calories per serving
  for a simple tomato/pasta recipe.

### Groq GPT-OSS Provider

- Mocked Groq unit tests are included in the passing test suite.
- Missing-key behavior is covered by unit tests.
- Mocked Groq edge coverage now verifies 401, 403, 429, 500, 503, schema
  refusal, malformed content, and timeout signal wiring.
- Default-provider regression is covered by the passing full local suite.
- Deployed text import smoke passed on `https://cookbook-ai-5qdb.vercel.app/`:
  pasted recipe text saved as `sourceKind: "text"` with parsed ingredients and
  method. The public response does not expose provider identity, so QA cannot
  prove from the URL alone that Groq specifically handled the request.

### AI-Direct YouTube Video Fallback

- Mocked video fallback unit tests are included in the passing test suite.
- Live Gemini video fallback smoke was deferred because no live video-provider
  key was available in this QA environment.

### Deployed Smoke

Passed for auth, recipe creation, text import, saved macro rendering, and live
macro calculation against `https://cookbook-ai-5qdb.vercel.app/`.

- Auth/register baseline passed with a throwaway QA account.
- Recipe creation baseline passed.
- Saved macro-estimate persistence and recipe-detail rendering passed.
- Live macro calculation passed after Vercel FoodData Central config propagated.
- Text import/provider smoke passed, but provider identity is not exposed in the
  response.
- Gemini video fallback smoke remains deferred.

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

**Bug:** Deployed macro calculation previously unavailable because FoodData Central was not configured  
**Steps to Reproduce:**
1. Register/login at `https://cookbook-ai-5qdb.vercel.app/`.
2. Create a saved recipe with common metric ingredients.
3. Call `POST /api/recipes/[id]/nutrition`.
**Expected:** The deployment calculates and saves per-serving and full-recipe macros from USDA data.  
**Actual:** The API returns `503` with `Macro calculation needs a configured FoodData Central API key.`  
**Severity:** High for Sprint 07 deployed macro functionality  
**Repro environment:** Vercel deployment `https://cookbook-ai-5qdb.vercel.app/`, 2026-05-06.

Fix status: resolved on recheck. The same deployed endpoint now returns `200`
and saves a USDA estimate.

**Bug:** USDA first-result matching can choose the wrong food form  
**Steps to Reproduce:**
1. Register/login at `https://cookbook-ai-5qdb.vercel.app/`.
2. Create a recipe with `200 g tomatoes`, `100 g pasta`, and `1 tbsp olive oil`.
3. Call `POST /api/recipes/[id]/nutrition`.
**Expected:** Common ingredients match ordinary food forms, for example fresh/raw tomatoes.  
**Actual:** `tomatoes` matched `Tomato powder`, inflating total and per-serving calories.  
**Severity:** Medium for nutrition estimate trust  
**Repro environment:** Vercel deployment `https://cookbook-ai-5qdb.vercel.app/`, 2026-05-06.

---

## Screenshots

Captured locally:

- `tests/screenshots/recipe-nutrition-full-desktop.png`
- `tests/screenshots/recipe-nutrition-partial-mobile.png`

Note: these nutrition screenshots exist in the workspace but are ignored by the
current git rules, matching the existing screenshot artifact behavior.

---

## QA Recommendation

Local Sprint 07 QA is green for compile, unit, build, browser regression,
nutrition UI coverage, focused Groq mocks, and focused macro service checks.
The deployed app is usable for auth, recipe creation, saved macro display, text
import, and live macro calculation. Before shipping the macro feature as a
trusted estimate, improve USDA result ranking or ingredient normalization so
common ingredients do not match concentrated/dried forms unexpectedly.

- If provider-level proof matters, expose internal QA-only provider metadata or
  inspect Vercel logs for the text import smoke; the public API response does
  not reveal whether Groq or another text provider handled the import.
- Gemini direct-video fallback smoke with the configured video-provider key.
