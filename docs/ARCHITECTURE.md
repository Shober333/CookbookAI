# Technical Architecture

> **Status:** Accepted — Sprint 5
> **Owner:** [CTO] — updated 2026-05-04

---

## 1. Tech Stack

| Layer | Technology | Why |
|-------|-----------|-----|
| **Frontend** | Next.js 15 (App Router) + React 19 + TypeScript | Full-stack monorepo, Vercel-native, RSC for fast initial loads |
| **Styling** | Tailwind CSS + shadcn/ui | Utility-first CSS; shadcn gives accessible, unstyled components we fully own |
| **Backend** | Next.js API Routes (Vercel Serverless Functions) | No separate server; co-located with frontend; zero deploy config |
| **AI** | Local dev: Ollama where available. Production (Vercel): Gemini 2.5 Flash by default; Anthropic remains optional fallback only | Local validation is free; production follows the project preference for Gemini while preserving provider abstraction |
| **Auth** | Auth.js v5 (NextAuth) + Prisma adapter | De-facto standard for Next.js; credentials provider for email/password; extensible to OAuth later |
| **ORM** | Prisma | Type-safe queries; handles SQLite ↔ Postgres swap via single env var |
| **Database** | SQLite (local dev) → Neon serverless Postgres (production) | Zero-setup locally; Neon is Vercel's recommended Postgres partner with a free tier |
| **Hosting** | Vercel (Hobby tier) | Targets hundreds of users within free tier limits |

---

## 2. System Architecture

```
┌──────────────────────────────────────────────────┐
│                    Browser                        │
│   Next.js React — App Router + Server Components  │
│   Tailwind CSS + shadcn/ui                        │
└────────────────────┬─────────────────────────────┘
                     │ HTTP / JSON response
┌────────────────────▼─────────────────────────────┐
│            Next.js API Routes                     │
│          (Vercel Serverless Functions)             │
│                                                   │
│  ┌──────────────┐   ┌───────────────────────┐    │
│  │  Auth.js v5  │   │  AI extraction layer    │    │
│  │  (sessions)  │   │ Ollama / Gemini         │    │
│  └──────┬───────┘   └──────────┬────────────┘    │
│         │                      │                  │
│  ┌──────▼───────┐   ┌──────────▼────────────┐    │
│  │    Prisma    │   │  JSON schema output     │    │
│  │    (ORM)     │   │  + normalization        │    │
│  └──────┬───────┘   └───────────────────────┘    │
└─────────┼─────────────────────────────────────────┘
          │                          │ HTTPS
┌─────────▼──────────────┐  ┌────────▼─────────────┐
│  SQLite (local dev)     │  │ Ollama local server    │
│  Neon Postgres (prod)   │  │ Gemini / optional AI   │
└────────────────────────┘  └──────────────────────┘
```

---

## 3. Key Components

### Recipe Importer
- **Purpose:** Fetch a URL's HTML content, send a focused source excerpt to the configured AI provider, receive structured recipe JSON
- **Location:** `src/app/api/ai/import/route.ts`
- **Depends on:** configured AI provider, Prisma (save)
- **Notes:** Local development may use `AI_PROVIDER=ollama`; production (Vercel) uses `AI_PROVIDER=gemini` by default. Anthropic remains an optional fallback provider, not the preferred production path. The route runs a keyword pre-screen (`looksLikeRecipePage`) before calling the AI — pages without recipe indicators are rejected in <1s. Sprint 2+ adds a URL deduplication check before the AI call: query `Recipe.sourceUrl` across all users; if a match exists, copy the extracted fields to a new Recipe for the current user and skip the AI call entirely. Webpage text is trimmed to a focused source excerpt for model latency. JSON-LD extraction exists in `src/lib/recipe-jsonld.ts` but is disabled unless `ENABLE_RECIPE_STRUCTURED_DATA_IMPORT=true`.

### Equipment Adapter
- **Purpose:** Take a saved recipe + user's appliance list, send to the configured AI provider, return rewritten steps
- **Location:** `src/app/api/ai/adapt/route.ts` (Sprint 2)
- **Depends on:** Configured AI provider, Prisma (read recipe + equipment profile)
- **Response shape:** `{ adaptedSteps: string[], notes: string }`
- **Notes:** Uses same AI provider config as import. Ollama path uses `/api/chat` with JSON schema; Anthropic path uses `generateObject`. Adapted steps saved to `recipe.adaptedSteps` (nullable column added Sprint 2) — original `recipe.steps` is never overwritten.

### Recipe Library
- **Purpose:** CRUD for user-owned recipes
- **Location:** `src/app/api/recipes/` (REST), `src/app/(app)/library/` (UI)
- **Depends on:** Prisma, Auth.js (session required)

### Auth
- **Purpose:** Register, login, session management
- **Location:** `src/app/api/auth/[...nextauth]/route.ts`, `src/lib/auth.ts`
- **Depends on:** Auth.js v5, Prisma adapter, bcryptjs

### Serving Scaler
- **Purpose:** Client-side rescaling of ingredient quantities; preserves original values in DB
- **Location:** `src/components/recipe/ServingScaler.tsx`
- **Depends on:** nothing server-side — pure client math

---

## 4. Data Model

```prisma
model User {
  id              String           @id @default(cuid())
  email           String           @unique
  passwordHash    String
  name            String?
  isGuest         Boolean          @default(false)  // Sprint 3+: cookie-based guest sessions
  guestToken      String?          @unique           // Sprint 3+: random token stored in guest cookie
  createdAt       DateTime         @default(now())
  recipes         Recipe[]
  equipmentProfile EquipmentProfile?
  // Auth.js relations
  accounts        Account[]
  sessions        Session[]
}

model Recipe {
  id           String   @id @default(cuid())
  userId       String
  user         User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  title        String
  description  String?
  sourceUrl    String?
  servings     Int
  ingredients  String   // JSON string: [{ amount, unit, name, notes? }]
  steps        String   // JSON string: string[]
  adaptedSteps String?  // JSON string: string[] — nullable; Sprint 2
  tags         String   // comma-separated; split to array in app layer
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  @@index([userId])
  @@index([sourceUrl])  // Sprint 2+: enables O(1) deduplication lookup before AI call
}

model EquipmentProfile {
  id         String   @id @default(cuid())
  userId     String   @unique
  user       User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  appliances String   // comma-separated: air_fryer, oven, microwave, slow_cooker, stovetop, grill
  updatedAt  DateTime @updatedAt
}

// Auth.js required models
model Account { ... }
model Session { ... }
model VerificationToken { ... }
```

SQLite stores recipe `ingredients` and `steps` as JSON-serialized
strings. App/service code parses them into typed arrays at module
boundaries and serializes them before persistence. This keeps local
SQLite and production Postgres migration-compatible for the MVP.

---

## 5. API Endpoints

| Method | Path | Description | Auth |
|--------|------|-------------|------|
| `POST` | `/api/auth/[...nextauth]` | Auth.js handler (login, register, session) | — |
| `GET` | `/api/recipes` | List authenticated user's recipes | Required |
| `POST` | `/api/recipes` | Create (save imported) recipe | Required |
| `GET` | `/api/recipes/[id]` | Get single recipe | Required + owner |
| `PATCH` | `/api/recipes/[id]` | Update recipe title / notes | Required + owner |
| `DELETE` | `/api/recipes/[id]` | Delete recipe | Required + owner |
| `POST` | `/api/ai/import` | Extract recipe from URL → structured recipe JSON | Required |
| `POST` | `/api/ai/adapt` | Adapt recipe steps for equipment → `{ adaptedSteps, notes }` | Required |
| `GET` | `/api/equipment` | Get user's equipment profile (`{ appliances: string[] }`) | Required |
| `PUT` | `/api/equipment` | Update user's equipment profile | Required |

> `GET /api/recipes` accepts an optional `?q=` query param for title search (Sprint 2).
> `PATCH /api/recipes/[id]` accepts `adaptedSteps` in its update payload (Sprint 2).

---

## 6. Folder Structure

```
CookbookAI/
├── src/
│   ├── app/
│   │   ├── (auth)/                  # Public auth routes
│   │   │   ├── login/page.tsx
│   │   │   └── register/page.tsx
│   │   ├── (app)/                   # Protected routes (middleware-gated)
│   │   │   ├── library/page.tsx     # Recipe library grid + search
│   │   │   ├── import/page.tsx      # Import new recipe
│   │   │   ├── equipment/page.tsx   # Equipment profile settings (Sprint 2)
│   │   │   └── recipes/[id]/page.tsx
│   │   ├── api/
│   │   │   ├── auth/[...nextauth]/route.ts
│   │   │   ├── recipes/
│   │   │   │   ├── route.ts         # GET list, POST create
│   │   │   │   └── [id]/route.ts    # GET, PATCH, DELETE
│   │   │   ├── ai/
│   │   │   │   ├── import/route.ts
│   │   │   │   └── adapt/route.ts
│   │   │   └── equipment/route.ts
│   │   ├── layout.tsx
│   │   └── page.tsx                 # Landing / redirect
│   ├── components/
│   │   ├── ui/                      # shadcn/ui primitives
│   │   ├── recipe/
│   │   │   ├── RecipeCard.tsx
│   │   │   ├── RecipeDetail.tsx
│   │   │   ├── ServingScaler.tsx
│   │   │   ├── UnitToggle.tsx
│   │   │   └── ImportForm.tsx
│   │   └── layout/
│   │       ├── Navbar.tsx
│   │       └── ProtectedLayout.tsx
│   ├── lib/
│   │   ├── auth.ts                  # Auth.js config
│   │   ├── db.ts                    # Prisma client singleton
│   │   ├── anthropic.ts             # AI provider config + system prompts
│   │   ├── recipe-ai-extractor.ts   # Ollama/Anthropic recipe extraction
│   │   ├── recipe-jsonld.ts         # Optional structured-data extraction
│   │   └── recipe-utils.ts          # scaling, conversion, parsing helpers
│   └── types/
│       └── recipe.ts                # Ingredient, Recipe, EquipmentProfile types
├── prisma/
│   ├── schema.prisma
│   └── migrations/
├── tests/
│   ├── e2e/
│   └── screenshots/
├── public/
├── .env                             # gitignored
├── .env.example
├── next.config.ts
├── tailwind.config.ts
├── playwright.config.ts
└── package.json
```

---

## 7. Environment Variables

```bash
# AI provider — local dev may use Ollama, production (Vercel) uses Gemini
AI_PROVIDER=ollama
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=qwen3.5:cloud          # cloud relay; no local GPU needed
# OLLAMA_MODEL=gemma4:e4b           # local GPU alternative
OLLAMA_EXTRACTION_TIMEOUT_MS=120000

# Production AI provider (set in Vercel environment)
# AI_PROVIDER=gemini
# GEMINI_API_KEY=...
# GEMINI_MODEL=gemini-2.5-flash

# Optional fallback provider
# ANTHROPIC_API_KEY=sk-ant-...

# Optional non-AI structured-data shortcut; disabled during AI validation
ENABLE_RECIPE_STRUCTURED_DATA_IMPORT=false

# Required app secret
AUTH_SECRET=...                      # openssl rand -base64 32

# Database
DATABASE_URL=file:./dev.db           # SQLite (local)
# DATABASE_URL=postgres://...        # Neon (production)

# Auth.js
NEXTAUTH_URL=http://localhost:3000   # local
# NEXTAUTH_URL=https://your-app.vercel.app  # production

# YouTube import (Sprint 3+) — free tier: 10,000 units/day
# YOUTUBE_API_KEY=...
```

---

## 8. Key Decisions

See `docs/DECISIONS.md` for the full decision log.
