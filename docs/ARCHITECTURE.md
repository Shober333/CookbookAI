# Technical Architecture

> **Status:** Accepted — Sprint 0
> **Owner:** [CTO] — updated 2026-04-29

---

## 1. Tech Stack

| Layer | Technology | Why |
|-------|-----------|-----|
| **Frontend** | Next.js 15 (App Router) + React 19 + TypeScript | Full-stack monorepo, Vercel-native, RSC for fast initial loads |
| **Styling** | Tailwind CSS + shadcn/ui | Utility-first CSS; shadcn gives accessible, unstyled components we fully own |
| **Backend** | Next.js API Routes (Vercel Serverless Functions) | No separate server; co-located with frontend; zero deploy config |
| **AI** | Anthropic SDK (`claude-sonnet-4-6`) + Vercel AI SDK | Claude for extraction + adaptation; Vercel AI SDK for streaming within serverless limits |
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
                     │ HTTP / streaming (SSE)
┌────────────────────▼─────────────────────────────┐
│            Next.js API Routes                     │
│          (Vercel Serverless Functions)             │
│                                                   │
│  ┌──────────────┐   ┌───────────────────────┐    │
│  │  Auth.js v5  │   │    Vercel AI SDK       │    │
│  │  (sessions)  │   │  (streaming proxy)     │    │
│  └──────┬───────┘   └──────────┬────────────┘    │
│         │                      │                  │
│  ┌──────▼───────┐   ┌──────────▼────────────┐    │
│  │    Prisma    │   │    Anthropic SDK        │    │
│  │    (ORM)     │   │   claude-sonnet-4-6     │    │
│  └──────┬───────┘   └───────────────────────┘    │
└─────────┼─────────────────────────────────────────┘
          │                          │ HTTPS
┌─────────▼──────────────┐  ┌────────▼─────────────┐
│  SQLite (local dev)     │  │    Claude API         │
│  Neon Postgres (prod)   │  │    (Anthropic)        │
└────────────────────────┘  └──────────────────────┘
```

---

## 3. Key Components

### Recipe Importer
- **Purpose:** Fetch a URL's HTML content (or YouTube transcript), send to Claude, receive structured recipe JSON
- **Location:** `src/app/api/ai/import/route.ts`
- **Depends on:** Anthropic SDK, Vercel AI SDK (streaming), Prisma (save)
- **Notes:** Uses `streamText` to stream the Claude response back to the browser. System prompt is cached with Anthropic prompt caching to reduce latency + cost on repeated calls.

### Equipment Adapter
- **Purpose:** Take a saved recipe + user's appliance list, send to Claude, stream back rewritten steps
- **Location:** `src/app/api/ai/adapt/route.ts`
- **Depends on:** Anthropic SDK, Vercel AI SDK (streaming), Prisma (read recipe + equipment profile)

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
  createdAt       DateTime         @default(now())
  recipes         Recipe[]
  equipmentProfile EquipmentProfile?
  // Auth.js relations
  accounts        Account[]
  sessions        Session[]
}

model Recipe {
  id          String   @id @default(cuid())
  userId      String
  user        User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  title       String
  description String?
  sourceUrl   String?
  servings    Int
  ingredients Json     // [{ amount: number, unit: string, name: string, notes?: string }]
  steps       Json     // string[]
  tags        String   // comma-separated; split to array in app layer
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
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
| `POST` | `/api/ai/import` | Extract recipe from URL → streaming JSON | Required |
| `POST` | `/api/ai/adapt` | Adapt recipe for equipment → streaming steps | Required |
| `GET` | `/api/equipment` | Get user's equipment profile | Required |
| `PUT` | `/api/equipment` | Update user's equipment profile | Required |

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
│   │   │   ├── library/page.tsx     # Recipe library grid
│   │   │   ├── import/page.tsx      # Import new recipe
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
│   │   ├── anthropic.ts             # Anthropic client + system prompts
│   │   └── utils.ts                 # cn(), fraction formatting, unit math
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
# Required
ANTHROPIC_API_KEY=sk-ant-...
AUTH_SECRET=...                      # openssl rand -base64 32

# Database
DATABASE_URL=file:./dev.db           # SQLite (local)
# DATABASE_URL=postgres://...        # Neon (production)

# Auth.js
NEXTAUTH_URL=http://localhost:3000   # local
# NEXTAUTH_URL=https://your-app.vercel.app  # production
```

---

## 8. Key Decisions

See `docs/DECISIONS.md` for the full decision log.
