# Sprint 01 — Dev Tasks

> **Owner:** [DEV] body
> **Sequence matters** — complete phases in order. Each phase unblocks the next.

---

## Status Key

- `[ ]` Not started
- `[~]` In progress
- `[x]` Done
- `[!]` Blocked — add note

---

## Phase 1: Scaffold

> Prerequisite for everything. Do not start Phase 2 until Phase 1 is complete.

| # | Task | Status | Acceptance Criteria |
|---|------|--------|---------------------|
| 1.1 | Initialize Next.js 15 project with TypeScript, Tailwind CSS, App Router | `[x]` | `npm run dev` starts at `localhost:3000` with no errors |
| 1.2 | Install and configure shadcn/ui | `[ ]` | `Button`, `Input`, `Card` components render correctly |
| 1.3 | Set up Prisma with SQLite; define schema (User, Recipe, EquipmentProfile, Auth.js tables) | `[!]` | Schema, migration SQL, Prisma Client generation, and local SQLite schema verified; `npx prisma migrate dev` still fails with a local schema-engine error |
| 1.4 | Install and configure Auth.js v5 with Prisma adapter and credentials provider | `[x]` | Auth.js handler at `/api/auth/[...nextauth]` returns 200 |
| 1.5 | Install Anthropic SDK and Vercel AI SDK; create `src/lib/anthropic.ts` with client singleton | `[x]` | File exports `anthropic` client; env var `ANTHROPIC_API_KEY` documented in `.env.example` |
| 1.6 | Create `src/lib/db.ts` Prisma client singleton | `[x]` | No "PrismaClient instantiated multiple times" warnings in dev |
| 1.7 | Configure route middleware to protect `(app)` routes | `[x]` | Unauthenticated request to `/library` redirects to `/login` |

---

## Phase 2: Auth

> Requires Phase 1 complete.

| # | Task | Status | Acceptance Criteria |
|---|------|--------|---------------------|
| 2.1 | Register page (`/register`) — email + password form | `[ ]` | Submitting valid email + password creates a User row in DB with hashed password; redirects to `/library` |
| 2.2 | Login page (`/login`) — email + password form | `[ ]` | Valid credentials create a session and redirect to `/library`; invalid credentials show error message |
| 2.3 | Navbar with user email display and logout button | `[ ]` | Logged-in user sees their email; clicking logout destroys session and redirects to `/login` |
| 2.4 | Auth error states — form validation, wrong credentials, duplicate email | `[ ]` | Each error case shows a human-readable inline message; no unhandled exceptions |

---

## Phase 3: Recipe Import

> Requires Phase 1 complete. Can run in parallel with Phase 2.

| # | Task | Status | Acceptance Criteria |
|---|------|--------|---------------------|
| 3.1 | Write Claude system prompt for recipe extraction; output must be a JSON object matching the `Recipe` type | `[x]` | Prompt reviewed and saved in `src/lib/anthropic.ts`; system prompt uses Anthropic prompt caching (`cache_control`) |
| 3.2 | `/api/ai/import` route — fetch URL content server-side, send to Claude via `streamText`, stream structured recipe JSON back | `[~]` | Route implemented and compiled; authenticated streaming test with real Anthropic key + recipe URL still needed |
| 3.3 | Import page (`/import`) — URL input form + streaming recipe preview | `[ ]` | User pastes URL, clicks Import; recipe fields appear progressively as Claude streams; loading state visible |
| 3.4 | "Save to library" button on preview — calls `POST /api/recipes` | `[ ]` | Recipe appears in DB under authenticated user's ID; user is redirected to the recipe detail page |
| 3.5 | `/api/recipes` POST endpoint — validate payload, insert Recipe row | `[x]` | Returns `201` with the saved recipe; rejects unauthenticated requests with `401` |
| 3.6 | Error handling: invalid URL, fetch failure, Claude parse failure | `[ ]` | Each failure case shows a clear error message in the UI; no raw error stack shown to user |

---

## Phase 4: Recipe Library

> Requires Phase 2 and 3.4 complete (need a saved recipe to test against).

| # | Task | Status | Acceptance Criteria |
|---|------|--------|---------------------|
| 4.1 | `/api/recipes` GET endpoint — return all recipes for authenticated user | `[x]` | Returns array of recipes; no cross-user leakage; empty array (not 404) when library is empty |
| 4.2 | `/api/recipes/[id]` GET endpoint — return single recipe (owner check) | `[x]` | Returns recipe for owner; returns `403` for non-owner; `404` for missing ID |
| 4.3 | `/api/recipes/[id]` DELETE endpoint | `[x]` | Deletes recipe; returns `200`; non-owner gets `403` |
| 4.4 | Library page (`/library`) — grid of `RecipeCard` components | `[ ]` | Shows all user's recipes; empty state message when no recipes; each card links to detail page |
| 4.5 | Recipe detail page (`/recipes/[id]`) — full recipe display with ingredients and steps | `[ ]` | Title, description, source URL, ingredients list, and steps render correctly |
| 4.6 | Delete button on recipe detail page | `[ ]` | Clicking delete (with confirmation) calls DELETE endpoint and redirects to library |

---

## Phase 5: Serving Scaler + Unit Conversion

> Requires Phase 4 (recipe detail page) complete.

| # | Task | Status | Acceptance Criteria |
|---|------|--------|---------------------|
| 5.1 | `ServingScaler` component — number input for target servings; rescales all ingredient amounts proportionally | `[ ]` | Changing servings updates all amounts in real-time; original values never mutated; fractions displayed sensibly (e.g., "1/3 cup" not "0.333 cup") |
| 5.2 | `UnitToggle` component — metric / imperial toggle; converts amounts + unit labels | `[ ]` | Toggling updates all ingredient units and amounts correctly for standard conversions (g↔oz, ml↔fl oz, °C↔°F) |
| 5.3 | Wire `ServingScaler` and `UnitToggle` into the recipe detail page | `[ ]` | Both controls visible and functional on recipe detail; state resets to original on page refresh |

---

## Definition of Done (per task)

A task is done only when:
1. Code runs without errors
2. The acceptance criteria above are met
3. At least one unit or integration test covers the new logic
4. No regressions in existing functionality
