# Sprint 06 — QA Report

> **Owner:** `[DEV-QA]`
> **Run date:** 2026-05-05
> **Status:** Local pass; deployed smoke blocked by Vercel API 500s.

## Summary

Local Sprint 06 QA passed after restoring the local Prisma Client. The source
continuity UI was verified with focused E2E coverage for desktop, mobile, and
non-YouTube regression, and the full Chromium regression suite passed.

Deployed smoke was attempted against `https://cookbook-ai-5qdb.vercel.app`
with the Founder-provided YouTube samples. Auth reaches the logged-in shell,
but deployed recipe APIs return 500, blocking YouTube and Browserbase smoke.

## Commands Run

| Command | Result | Notes |
|---|---:|---|
| `npm run typecheck` | Pass | Clean after backend fix |
| `npm test` | Pass | 10 files, 133 tests |
| `npm run build` | Pass | Local Next production build |
| `DATABASE_URL=postgresql://cookbook:stub@localhost:5432/cookbook npm run build:vercel` | Pass | Postgres-shaped build passed; local SQLite Prisma Client restored automatically |
| `npx playwright test tests/e2e/sprint6.spec.ts --project=chromium` | Pass | 2 tests, recipe detail source UI |
| `npx playwright test --project=chromium` | Pass | 30 tests immediately after `build:vercel`, without manual `db:generate` |
| Temporary deployed Playwright smoke against `https://cookbook-ai-5qdb.vercel.app` | Fail | Library shell can load, but diagnostic still captures `GET /api/recipes` and `POST /api/ai/import` returning 500 |

## Evidence

- Sprint 06 source UI spec:
  `tests/e2e/sprint6.spec.ts`
- Screenshots captured:
  `tests/screenshots/recipe-youtube-embed.png`
  `tests/screenshots/recipe-youtube-embed-mobile.png`
- Existing regression screenshots were refreshed by the full Playwright suite.
- Deployed diagnostic evidence:
  `GET https://cookbook-ai-5qdb.vercel.app/api/recipes` returned 500 after
  registration, and
  `POST https://cookbook-ai-5qdb.vercel.app/api/ai/import` returned
  `{"error":"Something went wrong. Try again in a moment."}` for the supplied
  YouTube samples.

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

**Fix status:** Not fully cleared on the live deployment as of the QA rerun.
`[DEV:backend]` addressed the build/deploy flow locally.
Vercel builds now run `prisma migrate deploy --schema
prisma-postgres/schema.prisma` before generating the Postgres Prisma Client,
unless `SKIP_VERCEL_MIGRATE=true` is set. This targets the likely schema drift
where the deployed database had not applied the Sprint 06 `Recipe` source
metadata columns before smoke. Local verification passed, but
`https://cookbook-ai-5qdb.vercel.app` still returned 500s during deployed
diagnostics.

Against `https://cookbook-ai-5qdb.vercel.app`, fresh registration succeeds
enough to reach the authenticated app shell, but the library cannot load
recipes. The page shows "We had trouble loading your recipes. Try refreshing
the page." Diagnostic Playwright response capture shows `GET /api/recipes`
returns 500.

All three Founder-provided YouTube samples fail before their expected source
paths can complete:

- `https://www.youtube.com/watch?v=WfYjmrH9gSw&t=336s`
- `https://www.youtube.com/watch?v=omkK5JAZCBg`
- `https://www.youtube.com/watch?v=VDPMXSAxiWk`

For each sample, `POST /api/ai/import` returns 500 with
`{"error":"Something went wrong. Try again in a moment."}`. This blocks
deployed YouTube link, description, no-recipe recovery, and Browserbase smoke
until Vercel runtime/database state is fixed or inspected.

## Blockers

- Deployed `GET /api/recipes` returns 500 after registration.
- Deployed `POST /api/ai/import` returns 500 for all supplied YouTube samples.
- No stable public Browserbase fallback URL was provided, even though
  Browserbase env readiness was confirmed.

## Recommendation

Local backend fix verification passes. Send back to deployment owner to confirm
the fix is deployed, inspect Vercel runtime logs, and verify production
migrations/env/schema alignment on `https://cookbook-ai-5qdb.vercel.app`.
Rerun deployed source smoke after `/api/recipes` and `/api/ai/import` stop
returning 500. Browserbase still needs one stable public blocked/JS-heavy
recipe URL for its final live fallback check.
