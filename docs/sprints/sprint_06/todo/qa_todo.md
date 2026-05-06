# Sprint 06 — QA Scenarios

> **Owner:** [DEV-QA]  
> **Run date:** 2026-05-06 · **Status:** Local QA pass; deployed auth and YouTube description smoke pass; YouTube link/no-recipe and Browserbase live smoke remain blocked.

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
| Q6.1 | Typecheck | Run `npm run typecheck` | Clean | `[x]` |
| Q6.2 | Unit tests | Run `npm test` | All tests pass | `[x]` |
| Q6.3 | Local production build | Run `npm run build` | Build succeeds | `[x]` |
| Q6.4 | Vercel-style build | Run `DATABASE_URL="postgresql://..." npm run build:vercel` with safe/stub Postgres URL as documented | Build path generates Postgres Prisma Client and succeeds or blocker is documented | `[x]` |
| Q6.5 | E2E regression | Run `npx playwright test --project=chromium` | Existing flows pass | `[x]` |

---

## Source Metadata

| # | Scenario | Steps | Expected | Status |
|---|----------|-------|----------|--------|
| Q6.6 | Existing non-YouTube recipe | Open/import normal URL recipe | No embed appears; existing source link behavior remains intact | `[x]` |
| Q6.7 | YouTube link import metadata | Import video with recipe link in description | Saved recipe records original YouTube URL and resolved recipe URL separately | `[x]` |
| Q6.8 | YouTube description import metadata | Import video with recipe-like description text | Saved recipe records original YouTube URL and `youtube-description` source kind | `[x]` |
| Q6.9 | YouTube transcript metadata | Import video requiring transcript fallback if stable sample exists | Saved recipe records original YouTube URL and `youtube-transcript` source kind | `[x]` |

---

## Browserbase Fallback

| # | Scenario | Steps | Expected | Status |
|---|----------|-------|----------|--------|
| Q6.10 | Browserbase disabled | Import public page that normal fetch cannot read with fallback disabled | Existing controlled connection/error state appears; no Browserbase call is required | `[x]` |
| Q6.11 | Browserbase missing key | Enable fallback without `BROWSERBASE_API_KEY` | User-safe provider configuration error appears; app does not crash | `[x]` |
| Q6.12 | Browserbase-assisted public page | Import Allrecipes and Serious Eats public recipe pages with fallback enabled | Browserbase renders/extracts page text; recipe saves or shows controlled no-recipe state | `[!]` |
| Q6.13 | Browserbase boundary | Try a login/paywall/CAPTCHA-gated sample only if safe to identify without bypassing | App does not attempt credentialed/private bypass; outcome is documented as unsupported | `[-]` |

---

## Recipe Detail UI

| # | Scenario | Steps | Expected | Status |
|---|----------|-------|----------|--------|
| Q6.14 | YouTube embed desktop | Open YouTube-sourced recipe detail on desktop | Responsive embed renders without overlapping ingredients/method | `[x]` |
| Q6.15 | YouTube embed mobile | Open same recipe at 375px | Embed fits viewport; controls remain reachable; no text overlap | `[x]` |
| Q6.16 | Keyboard/a11y smoke | Tab through recipe detail | Focus order remains coherent; iframe has accessible title | `[x]` |
| Q6.17 | Non-YouTube detail regression | Open existing non-YouTube recipe | No empty video frame or broken source label appears | `[x]` |

---

## Deployed Smoke

| # | Scenario | Steps | Expected | Status |
|---|----------|-------|----------|--------|
| Q6.18 | Deployed auth baseline | Register/login on Vercel | Auth still works after schema/API changes | `[x]` |
| Q6.19 | Deployed YouTube link path | Import stable video with recipe link | Recipe saves; detail embeds original video and shows resolved source | `[/]` |
| Q6.20 | Deployed YouTube description path | Import stable video with recipe-like description | Recipe saves; detail embeds original video | `[x]` |
| Q6.21 | Deployed YouTube no-recipe recovery | Import stable no-recipe video | Designed recovery state appears; no recipe is saved | `[!]` |
| Q6.22 | Deployed Browserbase fallback | Import Allrecipes and Serious Eats public recipe pages | Recipe saves through fallback or account/quota blocker is documented | `[!]` |
| Q6.23 | Screenshots | Capture recipe detail with embed on desktop and mobile | Screenshots saved if UI changed | `[x]` |

---

## Bugs Found

**Bug:** Vercel-style build leaves local Prisma Client generated from the
Postgres schema.
**Fix status:** Verified fixed locally after `[DEV:backend]` changes.
`npm run build:vercel` restores the local SQLite Prisma Client after local
Postgres-shaped builds, and full Chromium regression passed immediately
afterward without manual `npm run db:generate`.
**Steps to Reproduce:**
1. Run `DATABASE_URL=postgresql://cookbook:stub@localhost:5432/cookbook npm run build:vercel`.
2. Run `npx playwright test --project=chromium` without regenerating the local
   Prisma Client.
**Expected:** Local E2E uses the local SQLite schema/client and registration
works.
**Actual:** Registration fails with `PrismaClientInitializationError` because
the generated Postgres client rejects the local SQLite `DATABASE_URL`.
**Severity:** Medium.
**Repro environment:** Local Next dev server through Playwright Chromium,
2026-05-05. Workaround: run `npm run db:generate` before local E2E after any
Postgres-client build.

**Bug:** Deployed Vercel APIs return 500 after Sprint 06 changes.
**Fix status:** Partially cleared after push/deploy on 2026-05-06. Deployed
auth/library and YouTube description import pass. The supplied "both" sample
imports as `youtube-description` instead of the `youtube-link` path, and the
no-recipe sample now fails with `Browserbase session creation failed (401)`.
Follow-up backend fix now ranks recipe-looking YouTube description links above
sponsor/referral links and tries later candidate URLs before falling back to
description text; rerun deployed Q6.19 after the next deploy.
**Steps to Reproduce:**
1. Register a fresh user on `https://cookbook-ai-5qdb.vercel.app`.
2. Land on `/library`.
3. Import `https://www.youtube.com/watch?v=WfYjmrH9gSw&t=336s`,
   `https://www.youtube.com/watch?v=omkK5JAZCBg`, or
   `https://www.youtube.com/watch?v=VDPMXSAxiWk`.
**Expected:** Library loads, YouTube import follows link/description/no-recipe
paths, and recipe detail embeds the original video where applicable.
**Actual:** Initially `GET /api/recipes` returned 500 and the library showed
"We had trouble loading your recipes." After the backend fix/deploy, auth and
library pass, the description sample imports, the "both" sample imports as a
description recipe, and the no-recipe sample fails with
`Browserbase session creation failed (401)`.
**Severity:** High.
**Repro environment:** Vercel deployment
`https://cookbook-ai-5qdb.vercel.app`, Playwright Chromium, 2026-05-05.

**Bug:** Browserbase credentials fail on deployed no-recipe YouTube recovery.
**Steps to Reproduce:**
1. Register a fresh user on `https://cookbook-ai-5qdb.vercel.app`.
2. Import `https://www.youtube.com/watch?v=VDPMXSAxiWk`.
**Expected:** Designed "No recipe in this video" recovery appears; no recipe is
saved.
**Actual:** The import fails with `Browserbase session creation failed (401)`.
**Severity:** High for deployed Browserbase/no-recipe smoke.
**Repro environment:** Vercel deployment
`https://cookbook-ai-5qdb.vercel.app`, Playwright Chromium, 2026-05-06.

**Bug:** Browserbase cannot import Allrecipes or Serious Eats on deployed app.
**Steps to Reproduce:**
1. Run `LIVE_BROWSERBASE_SMOKE=true LIVE_BASE_URL=https://cookbook-ai-5qdb.vercel.app npx playwright test tests/e2e/browserbase-live.spec.ts --config=playwright.live.config.ts --project=chromium`, or manually register on the deployed app.
2. Import `https://www.allrecipes.com/recipe/23600/worlds-best-lasagna/`.
3. Import `https://www.seriouseats.com/the-best-roast-potatoes-ever-recipe`.
**Expected:** Each public recipe page saves through browser-assisted fallback
and the detail page shows `From {domain} · read in a browser`.
**Actual:** Both imports fail before save with
`Browserbase session creation failed (401)`.
**Severity:** High for deployed Browserbase smoke.
**Repro environment:** Vercel deployment
`https://cookbook-ai-5qdb.vercel.app`, Playwright Chromium, 2026-05-06.

---

## Recommendation

Local QA passes, deployed auth/library passes, and deployed YouTube description
import passes. Backend now has a fix for the supplied `youtube-link` sample's
sponsor-before-recipe description ordering; rerun Q6.19 after the next deploy.
Browserbase deployed 401 credentials/configuration remains deferred per Founder
direction.
