# Sprint 06 — QA Report

> **Owner:** `[DEV-QA]`
> **Run date:** 2026-05-06
> **Status:** Local and deployed QA pass; Browserbase fallback and normal-fetch-first behavior verified.

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
falling back to description text. The deployed rerun now verifies the YouTube
link path, including the original video embed. The Browserbase credential fix was also
verified on Vercel: Allrecipes and Serious Eats now import with browser-assisted
provenance, and the YouTube no-recipe sample no longer fails with Browserbase
401.

## Commands Run

| Command | Result | Notes |
|---|---:|---|
| `npm run typecheck` | Pass | Clean after backend fix |
| `npm test` | Pass | 10 files, 133 tests |
| `npm run build` | Pass | Local Next production build |
| `DATABASE_URL=postgresql://cookbook:stub@localhost:5432/cookbook npm run build:vercel` | Pass | Postgres-shaped build passed; local SQLite Prisma Client restored automatically |
| `npx playwright test tests/e2e/sprint6.spec.ts --project=chromium` | Pass | 3 tests, recipe detail source UI |
| `npx playwright test --project=chromium` | Pass | 30 tests immediately after `build:vercel`, without manual `db:generate` |
| `npx playwright test tests/e2e/browserbase-live.spec.ts --project=chromium --reporter=list` | Pass | 3 skipped by default unless `LIVE_BROWSERBASE_SMOKE=true` |
| `LIVE_BROWSERBASE_SMOKE=true LIVE_BASE_URL=https://cookbook-ai-5qdb.vercel.app npx playwright test tests/e2e/browserbase-live.spec.ts --config=playwright.live.config.ts --project=chromium` | Pass | Allrecipes and Serious Eats use `read in a browser`; Joshua saves via normal fetch as intended |
| `LIVE_BROWSERBASE_SMOKE=true LIVE_BASE_URL=https://cookbook-ai-5qdb.vercel.app npx playwright test tests/e2e/browserbase-live.spec.ts --config=playwright.live.config.ts --project=chromium --grep "Joshua Weissman"` | Pass | Recipe saves through normal fetch, as intended when the page is readable |
| Temporary no-recipe YouTube deployed smoke | Pass | `VDPMXSAxiWk` shows designed no-recipe recovery copy; no Browserbase 401 |
| Temporary deployed YouTube link smoke against `https://cookbook-ai-5qdb.vercel.app` | Pass | `omkK5JAZCBg` imports through link path, shows `first found on YouTube`, and embeds original video |

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
  Deployed rerun now passes: the recipe detail shows `first found on YouTube`,
  does not show `From YouTube description`, and embeds
  `youtube-nocookie.com/embed/omkK5JAZCBg`.
  `https://www.youtube.com/watch?v=VDPMXSAxiWk` now shows
  `We couldn't find a recipe link or recipe text in the description. Try the
  recipe page directly, or paste the recipe text.`
- Browserbase-specific deployed smoke:
  `https://www.allrecipes.com/recipe/23600/worlds-best-lasagna/` passed and
  showed `From allrecipes.com · read in a browser`.
  `https://www.seriouseats.com/the-best-roast-potatoes-ever-recipe` passed and
  showed `From seriouseats.com · read in a browser`.
  `https://www.joshuaweissman.com/recipes/ultimate-crispy-potato-chips-recipe`
  imported and saved "The Ultimate Crispy Potato Chips" through normal fetch,
  showing `From joshuaweissman.com`.

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
specific: the "both" YouTube sample resolved as description content instead of
`youtube-link` before the follow-up fix. The rerun now verifies the link path.
The no-recipe/browser-assisted 401 was fixed in a later Vercel configuration
update and verified by deployed smoke.

**Follow-up fix:** `[DEV:backend]` updated YouTube candidate URL extraction to
rank recipe-looking links above sponsor/referral links and changed the import
waterfall to try later candidate URLs before falling back to description text.
Focused regression tests now cover the sponsor-before-recipe case.

### High — Browserbase deployed credentials fail no-recipe recovery

**Fix status:** Verified fixed on 2026-05-06 after Browserbase Vercel env
correction.

After the deployment fix, the no-recipe sample initially
`https://www.youtube.com/watch?v=VDPMXSAxiWk` no longer fails with the generic
import 500. It now reaches a Browserbase path and returns the user-visible
message `Browserbase session creation failed (401)`. This blocks the Sprint 06
deployed no-recipe recovery and Browserbase fallback gates until deployed
Browserbase credentials/project configuration are corrected.

Rerun result: the same sample now shows the designed no-recipe recovery message:
`We couldn't find a recipe link or recipe text in the description. Try the
recipe page directly, or paste the recipe text.`

### High — Browserbase cannot import Allrecipes or Serious Eats on deployed app

**Fix status:** Verified fixed on 2026-05-06 after Browserbase Vercel env
correction.

A dedicated live Browserbase smoke was added at
`tests/e2e/browserbase-live.spec.ts`. It is skipped by default and only runs
when `LIVE_BROWSERBASE_SMOKE=true`, so normal local/CI regression is not
dependent on external recipe sites, live AI credentials, or Browserbase quota.

Against `https://cookbook-ai-5qdb.vercel.app`, both public recipe samples
originally failed before save:

- `https://www.allrecipes.com/recipe/23600/worlds-best-lasagna/`
- `https://www.seriouseats.com/the-best-roast-potatoes-ever-recipe`

Both show the user-visible message `Browserbase session creation failed (401)`.
This confirms the deployed app attempts the browser-assisted path for these
sites, but the Browserbase account/project credentials are rejected before a
recipe can be imported.

Rerun result: both now pass and save with browser-assisted provenance:

- `From allrecipes.com · read in a browser`
- `From seriouseats.com · read in a browser`

### Passed — Joshua Weissman uses normal fetch before Browserbase fallback

The Founder-provided Browserbase candidate
`https://www.joshuaweissman.com/recipes/ultimate-crispy-potato-chips-recipe`
does save successfully on the deployed app. The saved detail page shows title
`The Ultimate Crispy Potato Chips`, source domain `joshuaweissman.com`,
ingredients, servings, and method.

The provenance line is `From joshuaweissman.com`, not
`From joshuaweissman.com · read in a browser`. Founder clarified this is
intended: Browserbase is a fallback for blocked/bot-checked/JavaScript-heavy
pages, and the app should prefer normal fetch when the site is readable. This
sample now confirms the normal-fetch-first path.

## Blockers

None from QA after the latest deployed smoke.

## Recommendation

Local backend fix verification passes, deployed auth plus YouTube description
smoke pass, and the deployed rerun verifies the sponsor-before-recipe YouTube
link case. Browserbase credentials are now verified on deployed
Allrecipes/Serious Eats imports and no-recipe recovery no longer returns 401.
Joshua Weissman confirms the intended normal-fetch-first behavior for readable
pages.
