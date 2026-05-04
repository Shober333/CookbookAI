# Sprint 05 Dev Report

> Owner: `[DEV-LEAD]`  
> Implementation: `[DEV:backend]`  
> Date: 2026-05-04

## Summary

Sprint 05 backend deployment readiness is implemented locally. The app now has
a documented Vercel environment contract, a Neon/Postgres Prisma schema and
migration path, a Vercel build command that generates the production Prisma
client, and safer provider-error handling for deployed Gemini failures.

## Completed

- Added `docs/deployment/VERCEL.md` with required env vars, migration workflow,
  smoke checklist, and rollback notes.
- Added `prisma-postgres/schema.prisma` and a Postgres baseline migration.
- Added `npm run build:vercel`, `npm run db:generate:prod`, and
  `npm run db:migrate:prod`.
- Added `vercel.json` so Vercel uses the production build command.
- Updated `.env.example`, `README.md`, `docs/ARCHITECTURE.md`, and
  `docs/DECISIONS.md`.
- Hardened recipe import errors so missing/invalid Gemini configuration returns
  a controlled 503 instead of a generic extraction failure.

## Deferred

- Deployed smoke checks were completed by `[DEV-QA]` against
  `https://cookbook-ai-5qdb.vercel.app`.
- Frontend demo polish remains deferred unless deployed QA finds a user-facing
  issue.

## Verification

- `DATABASE_URL="postgresql://cookbook:password@localhost:5432/cookbook?sslmode=require" npm run db:generate:prod`
- `DATABASE_URL="postgresql://cookbook:password@localhost:5432/cookbook?sslmode=require" npm run build:vercel`
- `npm run db:generate`
- `npm run typecheck`
- `npm test -- --run`
- `npm run build`
- `npx playwright test --project=chromium --workers=1`

## QA Update — 2026-05-04

Independent `[DEV-QA]` Sprint 05 deployment preflight is green:

- `npm run typecheck` passed.
- `npm test` passed: 9 files / 114 tests.
- `npm run build` passed.
- `DATABASE_URL="postgresql://cookbook:password@localhost:5432/cookbook?sslmode=require" npm run build:vercel` passed.
- `npm run db:generate` was rerun after `build:vercel` to restore the local
  SQLite Prisma Client.
- `npx playwright test --project=chromium` passed: 27/27 tests after rerunning
  with local server permission for port 3100.

- Deployed core smoke is green against `https://cookbook-ai-5qdb.vercel.app`:
  registration/login, authenticated library access, Gemini text import,
  equipment profile save, and equipment adaptation passed.
- URL import returns controlled failure states when public recipe sites block
  Vercel/serverless fetch traffic.
- Temporary Gemini high-demand responses were observed during live AI smoke;
  `[DEV:backend]` added one-shot fallback retry support to
  `GEMINI_FALLBACK_MODEL` / `gemini-2.5-flash-lite`.

## Known Issues

- Local and production Prisma schemas must stay in sync until the project
  standardizes on one database provider.
- YouTube deployed smoke remains deferred pending demo key/video selection.
