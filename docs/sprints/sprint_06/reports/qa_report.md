# Sprint 06 — QA Report

> **Owner:** `[DEV-QA]`
> **Run date:** 2026-05-06
> **Status:** Local pass; deployed auth and YouTube description pass; YouTube link/no-recipe and Browserbase live smoke remain blocked.

## Summary

Local Sprint 06 QA passed after restoring the local Prisma Client. The source
continuity UI was verified with focused E2E coverage for desktop, mobile, and
non-YouTube regression, and the full Chromium regression suite passed.

After the pushed build/deploy fix, deployed smoke was rerun against
`https://cookbook-ai-5qdb.vercel.app` with the Founder-provided YouTube
samples. Auth/library now passes, and the description-recipe YouTube sample
saves a recipe and embeds the original video.

One deployed source gap was fixed after this QA pass: the supplied "both" video
description listed a sponsor link before the actual recipe URL, so the backend
now prioritizes recipe-looking URLs and tries later candidate links before
falling back to description text. Browserbase issues are intentionally left as
documented credential/config blockers for now.

## Commands Run

| Command | Result | Notes |
|---|---:|---|
| `npm run typecheck` | Pass | Clean after backend fix |
| `npm test` | Pass | 10 files, 133 tests |
| `npm run build` | Pass | Local Next production build |
| `DATABASE_URL=postgresql://cookbook:stub@localhost:5432/cookbook npm run build:vercel` | Pass | Postgres-shaped build passed; local SQLite Prisma Client restored automatically |
| `npx playwright test tests/e2e/sprint6.spec.ts --project=chromium` | Pass | 3 tests, recipe detail source UI |
| `npx playwright test --project=chromium` | Pass | 30 tests immediately after `build:vercel`, without manual `db:generate` |
| `npx playwright test tests/e2e/browserbase-live.spec.ts --project=chromium --reporter=list` | Pass | 2 skipped by default unless `LIVE_BROWSERBASE_SMOKE=true` |
| `LIVE_BROWSERBASE_SMOKE=true LIVE_BASE_URL=https://cookbook-ai-5qdb.vercel.app npx playwright test tests/e2e/browserbase-live.spec.ts --config=playwright.live.config.ts --project=chromium` | Fail | Allrecipes and Serious Eats both fail with Browserbase 401 |
| Temporary deployed Playwright smoke against `https://cookbook-ai-5qdb.vercel.app` | Partial | Auth/library and YouTube description pass; YouTube link expectation and no-recipe recovery fail |

## Evidence

- Sprint 06 source UI spec:
  `tests/e2e/sprint6.spec.ts`
- Browserbase-specific live smoke:
  `tests/e2e/browserbase-live.spec.ts`
- Screenshots captured:
  `tests/screenshots/recipe-youtube-embed.png`
  `tests/screenshots/recipe-youtube-embed-mobile.png`
- Existing regression screenshots were refreshed by the full Playwright suite.
- Deployed smoke evidence after push:
  Auth/library baseline passed.
  `https://www.youtube.com/watch?v=WfYjmrH9gSw&t=336s` imported from YouTube
  description and embedded the original video.
  `https://www.youtube.com/watch?v=omkK5JAZCBg` imported successfully, but as
  `From YouTube description` rather than the required `youtube-link` path.
  Follow-up diagnosis found the actual recipe link after a sponsor link in the
  YouTube API description; backend candidate selection was updated accordingly.
  `https://www.youtube.com/watch?v=VDPMXSAxiWk` failed with
  `Browserbase session creation failed (401)`.
- Browserbase-specific deployed smoke:
  `https://www.allrecipes.com/recipe/23600/worlds-best-lasagna/` failed with
  `Browserbase session creation failed (401)`.
  `https://www.seriouseats.com/the-best-roast-potatoes-ever-recipe` failed
  with `Browserbase session creation failed (401)`.

## Bugs Found

### Medium — Prisma Client switches schema after Vercel-style build

**Fix status:** Verified fixed locally after `[DEV:backend]` changes.
`npm run build:vercel` now runs through `scripts/build-vercel.mjs`; local runs
restore the SQLite Prisma Client after the Postgres-shaped build completes.
Full Chromium regression passed immediately afterward without manual
`npm run db:generate`.

Running `npm run build:vercel` generates `@prisma/client` from
`prisma-postgres/schema.prisma`. If local E2E runs immediately afterward, the
Next dev server uses that Postgres client with the local SQLite `DATABASE_URL`,
causing registration and authenticated flows to fail with
`PrismaClientInitializationError`.

Workaround verified: run `npm run db:generate` before local E2E after any
Postgres-client build.

### High — Deployed recipe APIs return 500

**Fix status:** Partially cleared on live after push/deploy. `[DEV:backend]`
addressed the build/deploy flow locally and Vercel auth/library now passes.
Vercel builds now run `prisma migrate deploy --schema
prisma-postgres/schema.prisma` before generating the Postgres Prisma Client,
unless `SKIP_VERCEL_MIGRATE=true` is set. This targets the likely schema drift
where the deployed database had not applied the Sprint 06 `Recipe` source
metadata columns before smoke.

Against `https://cookbook-ai-5qdb.vercel.app`, the original failure was
`GET /api/recipes` returning 500 after registration and `POST /api/ai/import`
returning a generic 500 for the supplied YouTube samples. After the backend
fix/deploy, fresh registration and library load pass, and the description
sample saves. The remaining deployed import failures are now source-path
specific: the "both" YouTube sample resolves as description content instead of
`youtube-link`, and no-recipe/browser-assisted paths fail with Browserbase 401.

**Follow-up fix:** `[DEV:backend]` updated YouTube candidate URL extraction to
rank recipe-looking links above sponsor/referral links and changed the import
waterfall to try later candidate URLs before falling back to description text.
Focused regression tests now cover the sponsor-before-recipe case.

### High — Browserbase deployed credentials fail no-recipe recovery

After the deployment fix, the no-recipe sample
`https://www.youtube.com/watch?v=VDPMXSAxiWk` no longer fails with the generic
import 500. It now reaches a Browserbase path and returns the user-visible
message `Browserbase session creation failed (401)`. This blocks the Sprint 06
deployed no-recipe recovery and Browserbase fallback gates until deployed
Browserbase credentials/project configuration are corrected.

### High — Browserbase cannot import Allrecipes or Serious Eats on deployed app

A dedicated live Browserbase smoke was added at
`tests/e2e/browserbase-live.spec.ts`. It is skipped by default and only runs
when `LIVE_BROWSERBASE_SMOKE=true`, so normal local/CI regression is not
dependent on external recipe sites, live AI credentials, or Browserbase quota.

Against `https://cookbook-ai-5qdb.vercel.app`, both public recipe samples fail
before save:

- `https://www.allrecipes.com/recipe/23600/worlds-best-lasagna/`
- `https://www.seriouseats.com/the-best-roast-potatoes-ever-recipe`

Both show the user-visible message `Browserbase session creation failed (401)`.
This confirms the deployed app attempts the browser-assisted path for these
sites, but the Browserbase account/project credentials are rejected before a
recipe can be imported.

## Blockers

- Deployed Browserbase returns 401 during no-recipe recovery.
- Deployed Browserbase returns 401 for the Allrecipes and Serious Eats live
  recipe smoke.

## Recommendation

Local backend fix verification passes, deployed auth plus YouTube description
smoke pass, and a code fix now covers the sponsor-before-recipe YouTube link
case. Remaining action, per Founder direction, is to defer Browserbase
credentials/project configuration and rerun that live fallback smoke later.
