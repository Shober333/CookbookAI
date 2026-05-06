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
| `BROWSERBASE_FALLBACK_ENABLED` | Optional | unset | Set to `false` to force-disable Browserbase; otherwise `BROWSERBASE_API_KEY` enables fallback |
| `BROWSERBASE_API_KEY` | Required when Browserbase enabled | `bb_...` | Browserbase API key; keep server-side only |
| `BROWSERBASE_PROJECT_ID` | Recommended when Browserbase enabled | `project_...` | Browserbase project used for sessions |
| `BROWSERBASE_REGION` | Optional | `us-east-1` | Browserbase session region |
| `BROWSERBASE_TIMEOUT_MS` | Optional | `30000` | Render/connect timeout; values below 10000 fall back to 30000 |
| `ANTHROPIC_API_KEY` | Optional | `sk-ant-...` | Only if `AI_PROVIDER=anthropic` |
| `OLLAMA_BASE_URL` / `OLLAMA_MODEL` | Local only | `http://localhost:11434` | Do not use for Vercel demo |

Browserbase activates when `BROWSERBASE_API_KEY` is present unless explicitly
disabled with `BROWSERBASE_FALLBACK_ENABLED=false`. Sprint 06 uses it only for
public recipe pages where normal fetch fails or returns unusable JS-heavy HTML.
It must not be used to access paywalled, login-gated, CAPTCHA-protected, or
private content.

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

Vercel builds also run `prisma migrate deploy` automatically when `VERCEL=1`,
so new deployments apply committed production migrations before generating the
Postgres Prisma Client. Set `SKIP_VERCEL_MIGRATE=true` only for an emergency
build where database mutation has been intentionally paused.

## Vercel Build

`vercel.json` sets:

```bash
npm run build:vercel
```

That script runs:

```bash
node scripts/build-vercel.mjs
```

This matters because Prisma datasource providers are generated into the client.
The deployed client must be generated from the Postgres schema. Local
`npm run build:vercel` runs the same Postgres-shaped build and then restores
the local SQLite Prisma Client afterward, so local E2E does not inherit the
Postgres client by accident.

## Smoke Checklist

Run these against the Preview URL first.

1. Register a fresh demo account and confirm it lands on `/library`.
2. Log out, visit `/library`, and confirm redirect to `/login`.
3. Log back in.
4. Paste a short recipe in text mode and confirm Gemini creates a recipe.
5. Import a stable recipe URL. If Browserbase is disabled and the site blocks
   automation, verify the controlled blocked-site message appears.
6. Import a YouTube URL with a recipe link in the description.
7. Import a YouTube URL with recipe-like description text.
8. Import a YouTube URL with no recipe and confirm the designed recovery
   message appears.
9. Open a saved recipe and verify ingredients, method, serving scaler, unit
   toggle, and equipment adaptation still render.
10. If Browserbase is enabled, import the stable public JS-heavy/blocked sample
    URL and verify the recipe saves with Browserbase-assisted metadata.

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
