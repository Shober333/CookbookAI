# Sprint 05 QA Report

> Owner: `[DEV-QA]`
> Date: 2026-05-04
> Status: Local preflight and deployed core smoke passed; YouTube smoke deferred

## Summary

Sprint 05 deployment readiness passes local QA and deployed core smoke against
`https://cookbook-ai-5qdb.vercel.app`. Typecheck, unit tests, Vercel-style
Postgres build, deployed auth/DB, deployed text import, and deployed equipment
adaptation are green. YouTube import smoke remains deferred pending a demo key
and stable video set.

## Passed

- `npm run typecheck`
- `npm test` — 9 files / 114 tests
- `npm run build`
- `DATABASE_URL="postgresql://cookbook:password@localhost:5432/cookbook?sslmode=require" npm run build:vercel`
- `npm run db:generate` after the Vercel build to restore local SQLite client
- `npx playwright test --project=chromium` — 27/27 tests after rerunning with
  permission for the local Next.js server to bind port 3100
- Deployed auth smoke — registration API returned 201; login redirected to
  `/library`; authenticated `/api/recipes` returned 200.
- Deployed text import — Gemini import saved and rendered `Simple Tomato Toast`.
- Deployed equipment smoke — Kitchen profile saved via `/api/equipment`; recipe
  adaptation returned 200 and rendered adapted steps.
- Deployed URL import — blocked recipe sites returned controlled
  connection-trouble states rather than crashing the app.

## Deployment Setup Review

- Required Vercel variables are documented in `docs/deployment/VERCEL.md`.
- Rollback notes cover bad deploy, bad env, Gemini quota/key failure, YouTube
  quota/key failure, and database migration issues.
- Missing Gemini key, missing YouTube key, and controlled import failures are
  covered by unit tests.

## Blocked

- YouTube deployed smoke was not rerun in this closeout pass.
- Public recipe URL import remains dependent on the target site's willingness
  to serve Vercel/serverless fetch traffic.
- Temporary Gemini high-demand responses were observed. `[DEV:backend]` added
  fallback retry coverage from `GEMINI_MODEL` to `GEMINI_FALLBACK_MODEL`.

## Next QA Step

Proceed to `[DEV-LEAD]` review, then `[CTO]` Good/Bad/Ugly review. For demo,
keep `GEMINI_FALLBACK_MODEL=gemini-2.5-flash-lite` set in Vercel and prefer
text import or known-accessible URLs when a recipe site blocks server-side
fetches.
