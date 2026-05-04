# Vercel Demo Deployment

> Owner: `[DEV:backend]` for Sprint 05 setup. QA owns deployed smoke results.

CookbookAI deploys as one Next.js app on Vercel. Local development keeps
SQLite; the Vercel demo path uses Neon Postgres and Gemini 2.5 Flash.

## Required Environment Variables

Set these in Vercel for Preview and Production unless noted otherwise.

| Variable | Required | Example | Source / Notes |
|----------|----------|---------|----------------|
| `AUTH_SECRET` | Yes | `openssl rand -base64 32` output | Generate locally; never commit it |
| `NEXTAUTH_URL` | Yes | `https://cookbookai-demo.vercel.app` | Exact deployed origin, no trailing slash |
| `AUTH_URL` | Yes | `https://cookbookai-demo.vercel.app` | Same value as `NEXTAUTH_URL`; Auth.js deployed origin |
| `DATABASE_URL` | Yes | `postgresql://...sslmode=require` | Neon pooled or direct connection string |
| `AI_PROVIDER` | Yes | `gemini` | Sprint 05 production default |
| `GEMINI_API_KEY` | Yes | `AIza...` | Google AI Studio / Gemini API key |
| `GEMINI_MODEL` | Yes | `gemini-2.5-flash` | Keep pinned for demo repeatability |
| `GEMINI_FALLBACK_MODEL` | Recommended | `gemini-2.5-flash-lite` | Retry target for temporary Gemini high-demand/overloaded responses |
| `YOUTUBE_API_KEY` | Yes for YouTube smoke | `AIza...` | Google Cloud YouTube Data API v3 key |
| `ENABLE_RECIPE_STRUCTURED_DATA_IMPORT` | Recommended | `false` | Keeps demo on validated AI extraction path |
| `AI_EXTRACTION_TIMEOUT_MS` | Recommended | `120000` | Shared AI timeout |
| `ANTHROPIC_API_KEY` | Optional | `sk-ant-...` | Only if `AI_PROVIDER=anthropic` |
| `OLLAMA_BASE_URL` / `OLLAMA_MODEL` | Local only | `http://localhost:11434` | Do not use for Vercel demo |

## Database Setup

1. Create a Neon Postgres project.
2. Copy the Postgres connection string into Vercel as `DATABASE_URL`.
3. From a trusted local shell, run:

```bash
DATABASE_URL="postgresql://...sslmode=require" npm run db:migrate:prod
```

This uses `prisma-postgres/schema.prisma` and
`prisma-postgres/migrations/`. Local SQLite remains on `prisma/schema.prisma`
with:

```bash
npm run db:migrate
```

## Vercel Build

`vercel.json` sets:

```bash
npm run build:vercel
```

That script runs:

```bash
prisma generate --schema prisma-postgres/schema.prisma && next build
```

This matters because Prisma datasource providers are generated into the client.
The deployed client must be generated from the Postgres schema.

## Smoke Checklist

Run these against the Preview URL first.

1. Register a fresh demo account and confirm it lands on `/library`.
2. Log out, visit `/library`, and confirm redirect to `/login`.
3. Log back in.
4. Paste a short recipe in text mode and confirm Gemini creates a recipe.
5. Import a stable recipe URL. If the site blocks automation, verify the
   controlled blocked-site message appears.
6. Import a YouTube URL with a recipe link in the description.
7. Import a YouTube URL with recipe-like description text.
8. Import a YouTube URL with no recipe and confirm the designed recovery
   message appears.
9. Open a saved recipe and verify ingredients, method, serving scaler, unit
   toggle, and equipment adaptation still render.

## Rollback Notes

Bad deploy:
Use Vercel's Deployments tab to promote the previous green deployment.

Bad env:
Fix the environment variable in Vercel, redeploy the same commit, and rerun
auth plus import smoke checks.

Gemini quota or key failure:
Confirm `AI_PROVIDER=gemini`, `GEMINI_API_KEY`, and `GEMINI_MODEL`. If quota is
exhausted during a demo, switch to a prepared backup Gemini key or defer live
AI import and demo URL reuse/library/detail flows.

YouTube quota or key failure:
Confirm `YOUTUBE_API_KEY` has YouTube Data API v3 enabled. If quota is
exhausted, demo text import and non-YouTube URL import, and mark YouTube smoke
as quota-blocked in the QA report.

Database migration issue:
Do not run destructive SQL during a demo. Restore the previous Vercel deploy
if the app was already live, then inspect the Neon branch or staging clone.
Record the failed migration and exact error in the Sprint 05 QA report.
