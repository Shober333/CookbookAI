# Sprint 05 QA Report

> Owner: `[DEV-QA]`
> Date: 2026-05-04
> Status: Local preflight passed; deployed smoke pending Vercel/Neon handoff

## Summary

Sprint 05 deployment readiness passes locally. Typecheck, unit tests, normal
production build, Vercel-style Postgres build, and Chromium E2E regression are
green. The remaining QA work requires external infrastructure: a Vercel
preview URL and a Neon Postgres connection string.

## Passed

- `npm run typecheck`
- `npm test` — 9 files / 113 tests
- `npm run build`
- `DATABASE_URL="postgresql://cookbook:password@localhost:5432/cookbook?sslmode=require" npm run build:vercel`
- `npm run db:generate` after the Vercel build to restore local SQLite client
- `npx playwright test --project=chromium` — 27/27 tests

## Deployment Setup Review

- Required Vercel variables are documented in `docs/deployment/VERCEL.md`.
- Rollback notes cover bad deploy, bad env, Gemini quota/key failure, YouTube
  quota/key failure, and database migration issues.
- Missing Gemini key, missing YouTube key, and controlled import failures are
  covered by unit tests.

## Blocked

- Production migration was not run because no Neon/staging `DATABASE_URL` was
  available.
- Deployed smoke checks were not run because no Vercel preview URL was
  available.

## Next QA Step

After the Vercel project and Neon database are ready:

1. Set the Vercel environment variables from `docs/deployment/VERCEL.md`.
2. Run `DATABASE_URL="postgresql://...sslmode=require" npm run db:migrate:prod`.
3. Deploy the current branch to a Vercel preview.
4. Run Q5.8-Q5.14 from `docs/sprints/sprint_05/todo/qa_todo.md`.
