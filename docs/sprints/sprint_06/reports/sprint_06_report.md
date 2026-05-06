# Sprint 06 — Dev Lead Report

> **Owner:** `[DEV-LEAD]`
> **Report date:** 2026-05-06
> **Status:** Dev + QA complete; ready for CTO Good/Bad/Ugly review.

## Summary

Sprint 06 closes the source-continuity gap left after the Vercel demo sprint.
CookbookAI now preserves original YouTube video metadata separately from the
resolved recipe URL, shows source provenance and responsive YouTube embeds on
recipe detail, and has a bounded Browserbase fallback for public recipe pages
that normal server fetch cannot read.

Local and deployed QA are green after fix passes. The deployed smoke suite now
verifies YouTube link import, YouTube description import, YouTube no-recipe
recovery, Browserbase-assisted imports for Allrecipes and Serious Eats, and
normal-fetch-first behavior for a readable Joshua Weissman page.

## Tasks Completed

- **6.1–6.4** — Scope, source metadata contract, UI/UX source presentation, and
  Browserbase boundary were defined.
- **6.5–6.8** — Backend added source metadata fields (`sourceVideoUrl`,
  `sourceKind`, `sourceImportMethod`) to local SQLite and production Postgres
  schemas, persisted them through import paths, and exposed them through recipe
  APIs.
- **6.9–6.12** — Browserbase fallback was added behind configuration and kept
  bounded to public URL import failure/unreadable-page cases. Missing key,
  timeout/session failure, and unreadable-page behavior are covered by tests.
- **6.13–6.15** — Frontend renders source provenance and original YouTube video
  embeds on recipe detail, with desktop/mobile E2E coverage and non-YouTube
  regression coverage.
- **6.16–6.19** — QA documented stable YouTube and Browserbase samples and
  verified deployed smoke on `https://cookbook-ai-5qdb.vercel.app`.
- **6.20–6.21** — Demo evidence is captured in `reports/qa_report.md`; this
  dev-lead report is the final dev-body handoff.

## Tasks Deferred

- Direct Gemini video understanding remains deferred.
- Nutrition/macros, guest mode, paid tiers, and broader recipe organization
  remain out of Sprint 06 scope.
- Paywall, login wall, CAPTCHA, and private-content bypass remain explicitly
  unsupported.

## Blockers Encountered

- **Vercel-style build changed the local Prisma Client shape.** Fixed by the
  backend build flow: `npm run build:vercel` now restores the local SQLite
  Prisma Client after a Postgres-shaped build. QA verified full Chromium
  regression immediately afterward without manual `db:generate`.
- **Deployed APIs initially returned 500 after Sprint 06 schema/API changes.**
  Backend adjusted the Vercel migration/build path; deployed auth, library, and
  import smoke now pass.
- **YouTube "both" sample initially chose description text instead of recipe
  link.** Backend now ranks recipe-looking links above sponsor/referral links
  and tries later candidates before falling back to description text. Deployed
  rerun verifies the `youtube-link` path.
- **Browserbase deployed credentials initially returned 401.** Vercel
  Browserbase env configuration was corrected; Allrecipes and Serious Eats now
  import with `read in a browser` provenance, and no-recipe YouTube recovery no
  longer fails through Browserbase.

## Known Issues

- Browserbase is intentionally paid/usage-metered and disabled by default. Live
  Browserbase smoke is skipped unless `LIVE_BROWSERBASE_SMOKE=true`.
- The Joshua Weissman sample imports through normal fetch rather than
  Browserbase. This is expected and confirms normal-fetch-first behavior.
- CTO review remains the only open closeout gate.

## How to Verify

Local commands:

```bash
npm run typecheck
npm test
npm run build
DATABASE_URL=postgresql://cookbook:stub@localhost:5432/cookbook npm run build:vercel
npx playwright test --project=chromium
npx playwright test tests/e2e/sprint6.spec.ts --project=chromium
npx playwright test tests/e2e/browserbase-live.spec.ts --project=chromium --reporter=list
```

Live deployed smoke:

```bash
LIVE_BROWSERBASE_SMOKE=true LIVE_BASE_URL=https://cookbook-ai-5qdb.vercel.app npx playwright test tests/e2e/browserbase-live.spec.ts --config=playwright.live.config.ts --project=chromium
```

QA evidence in `reports/qa_report.md` records:

- `npm run typecheck` — pass.
- `npm test` — pass, 10 files / 133 tests.
- `npm run build` — pass.
- `npm run build:vercel` — pass, with local Prisma Client restored.
- Full Chromium E2E — pass, 30 tests.
- Sprint 6 focused E2E — pass, 3 tests.
- Browserbase live smoke — pass on Allrecipes and Serious Eats; Joshua
  Weissman confirms normal fetch.
- Deployed YouTube link, description, and no-recipe smoke — pass.

## Handoff

Ready for `[CTO]` Good/Bad/Ugly review. Dev and QA have no open Sprint 06
blockers.
