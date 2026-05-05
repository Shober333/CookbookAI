# CookbookAI

CookbookAI is a Next.js app for importing recipes from the web, saving them
to a private library, and adapting them with AI for serving size, units, and
available kitchen equipment.

## What It Does

- Import recipes from normal recipe URLs.
- Paste raw recipe text or HTML when a site blocks scraping.
- Import YouTube recipes description-first:
  - follow recipe links found in the description
  - extract recipe-like description text
  - fall back to public transcripts when needed
- Preserve source continuity for YouTube imports so the saved recipe can show
  the original video separately from any resolved recipe link.
- Optionally render public JS-heavy recipe pages through Browserbase when
  normal URL fetch is blocked or unusable.
- Reuse prior URL extractions to avoid repeat AI calls.
- Save recipes per user with private library isolation.
- Scale servings, convert units, and adapt cooking steps with AI.

## Stack

- Next.js 15, React 19, TypeScript
- Tailwind CSS
- Prisma with SQLite for local development
- NextAuth/Auth.js with Prisma adapter
- Vitest unit tests
- Playwright E2E tests and screenshots
- AI providers: Ollama, Gemini, Anthropic fallback

## Quick Start

```bash
npm install
cp .env.example .env
npm run db:migrate
npm run dev
```

Open `http://localhost:3000`.

For local no-bill AI, keep:

```bash
AI_PROVIDER=ollama
OLLAMA_BASE_URL=http://localhost:11434
```

For Sprint 04 production-provider testing:

```bash
AI_PROVIDER=gemini
GEMINI_API_KEY=your-key
GEMINI_MODEL=gemini-2.5-flash
```

For YouTube import:

```bash
YOUTUBE_API_KEY=your-google-cloud-youtube-key
```

For optional Browserbase public-page fallback:

```bash
BROWSERBASE_FALLBACK_ENABLED=true
BROWSERBASE_API_KEY=your-browserbase-key
BROWSERBASE_PROJECT_ID=your-browserbase-project-id
BROWSERBASE_TIMEOUT_MS=30000
```

Browserbase is disabled by default and is paid/usage-metered. It is only for
public recipe pages that fail normal fetch or need client-side rendering; it is
not a paywall, login, CAPTCHA, or private-content bypass.

Required app/database values:

```bash
AUTH_SECRET=replace-with-openssl-rand-base64-32
NEXTAUTH_URL=http://localhost:3000
DATABASE_URL=file:./dev.db
```

## Vercel Demo Deployment

Sprint 05 production deploys use Vercel plus Neon Postgres. Local development
continues to use SQLite through `prisma/schema.prisma`; Vercel uses
`prisma-postgres/schema.prisma`.

Set these Vercel environment variables for Preview and Production:

```bash
AUTH_SECRET=replace-with-openssl-rand-base64-32
NEXTAUTH_URL=https://your-app.vercel.app
AUTH_URL=https://your-app.vercel.app
DATABASE_URL=postgresql://...sslmode=require
AI_PROVIDER=gemini
GEMINI_API_KEY=your-key
GEMINI_MODEL=gemini-2.5-flash
YOUTUBE_API_KEY=your-google-cloud-youtube-key
ENABLE_RECIPE_STRUCTURED_DATA_IMPORT=false
AI_EXTRACTION_TIMEOUT_MS=120000
BROWSERBASE_FALLBACK_ENABLED=false
# BROWSERBASE_API_KEY=your-browserbase-key
# BROWSERBASE_PROJECT_ID=your-browserbase-project-id
BROWSERBASE_TIMEOUT_MS=30000
```

Before the first Vercel smoke test, run production migrations against the Neon
database:

```bash
DATABASE_URL="postgresql://...sslmode=require" npm run db:migrate:prod
```

Vercel builds with `npm run build:vercel` via `vercel.json`, which applies
committed Postgres migrations in Vercel, generates Prisma Client from the
Postgres schema, and then runs `next build`. Local `npm run build:vercel`
restores the SQLite Prisma Client afterward so local E2E stays on the local
schema.

Full deployment notes and rollback steps live in
`docs/deployment/VERCEL.md`.

## Useful Commands

```bash
npm run dev          # start local app
npm run dev:kill     # stop process on PORT, default 3000
npm run db:migrate   # create/update local SQLite DB
npm run typecheck    # TypeScript check
npm test             # Vitest unit tests
npm run build        # production build
npx playwright test  # E2E tests
```

## Project Map

- `src/app/` - Next.js routes and API endpoints
- `src/components/` - UI components
- `src/lib/` - import pipeline, AI providers, recipe services
- `prisma/` - database schema and migrations
- `tests/e2e/` - Playwright flows
- `tests/screenshots/` - visual QA evidence
- `docs/PRD.md` - product requirements
- `docs/ARCHITECTURE.md` - architecture notes
- `docs/DECISIONS.md` - decision log
- `docs/sprints/` - sprint plans, reports, reviews
- `docs/ui/` - UI register, kit, component specs, states

## Current Focus

Sprint 06 focuses on YouTube source continuity, Browserbase public-page
fallback, and deployed source smoke.

## Notes

- Keep API keys server-side only. Do not expose them in client env vars.
- `AI_PROVIDER=ollama` is the safest local default.
- `AI_PROVIDER=gemini` is the current production-provider target.
- Anthropic support remains as a fallback path, not the preferred default.
