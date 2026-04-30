# Sprint 01 — Dev Tasks

> **Owner:** [DEV] body
> **Sequence matters** — complete phases in order. Each phase unblocks the next.
>
> **UI spec:** All frontend work must follow `docs/ui/`. Read REGISTER.md, UI_KIT.md,
> COMPONENT_SPECS.md, PAGE_LAYOUTS.md, and STATES.md before implementing any UI task.
> No hardcoded hex, font names, spacing, or copy — everything traces to the kit.

---

## Status Key

- `[ ]` Not started
- `[~]` In progress
- `[x]` Done
- `[!]` Blocked — add note

---

## Phase 1: Scaffold

> Prerequisite for everything. Do not start Phase 2 until Phase 1 is complete.

| # | Task | Owner | Status | Acceptance Criteria |
|---|------|-------|--------|---------------------|
| 1.1 | Initialize Next.js 15 project with TypeScript, Tailwind CSS, App Router | backend | `[x]` | `npm run dev` starts at `localhost:3000` with no errors |
| 1.2 | Install shadcn/ui with Neutral style; do NOT accept defaults — override to UI kit tokens in next tasks | frontend | `[ ]` | shadcn init completes; `Button`, `Input` components present in `src/components/ui/` |
| 1.3 | Configure `tailwind.config.ts` with all custom tokens from `docs/ui/UI_KIT.md` (colors, font families, font sizes, spacing, radius) | frontend | `[ ]` | `bg-paper`, `text-ink`, `font-display`, `text-display-lg`, `text-eyebrow` etc. all resolve via Tailwind classes |
| 1.4 | Add CSS variables and reduced-motion rule to `src/app/globals.css` per `docs/ui/UI_KIT.md` §12 | frontend | `[ ]` | `:root` has all `--color-*`, `--measure-*` vars; `@media (prefers-reduced-motion: reduce)` block present; `*:focus-visible` uses terracotta ring |
| 1.5 | Configure Fraunces, Inter, Caveat fonts in `src/app/layout.tsx` per `docs/ui/UI_KIT.md` §2; apply font variables to `<html>` tag | frontend | `[ ]` | Page renders in Fraunces body text on `localhost:3000`; all three font variables present on `<html>` |
| 1.6 | Set up Prisma with SQLite; define schema (User, Recipe, EquipmentProfile, Auth.js tables) | backend | `[!]` | `npx prisma migrate dev` runs without errors; `dev.db` created — **BLOCKED: schema-engine error on local migrate** |
| 1.7 | Install and configure Auth.js v5 with Prisma adapter and credentials provider | backend | `[x]` | Auth.js handler at `/api/auth/[...nextauth]` returns 200 |
| 1.8 | Install Anthropic SDK and Vercel AI SDK; create `src/lib/anthropic.ts` with client singleton | backend | `[x]` | File exports `anthropic` client; `ANTHROPIC_API_KEY` documented in `.env.example` |
| 1.9 | Create `src/lib/db.ts` Prisma client singleton | backend | `[x]` | No "PrismaClient instantiated multiple times" warnings in dev |
| 1.10 | Configure route middleware to protect `(app)` routes | backend | `[x]` | Unauthenticated request to `/library` redirects to `/login` |

---

## Phase 2: Auth

> Requires Phase 1 complete.
> **Spec:** `docs/ui/PAGE_LAYOUTS.md` §1 — exact copy, layout, and token references for both auth pages.

| # | Task | Owner | Status | Acceptance Criteria |
|---|------|-------|--------|---------------------|
| 2.1 | Register page (`/register`) per PAGE_LAYOUTS.md §1 — eyebrow "Get started", headline "Bring recipes home.", fields: Name (optional), Email, Password; button "Create account" | frontend | `[ ]` | Submitting valid email + password creates a User row in DB with hashed password; redirects to `/library`; layout matches spec at 375px and 1280px |
| 2.2 | Login page (`/login`) per PAGE_LAYOUTS.md §1 — eyebrow "Welcome back", headline "Pick up where you left off.", fields: Email, Password; button "Sign in" | frontend | `[ ]` | Valid credentials create a session and redirect to `/library`; invalid credentials show error in `--color-accent-strong`; no raw error stack |
| 2.3 | `Topbar` component per COMPONENT_SPECS.md §8 — brand mark, nav, Import button; **mobile: brand left + Import button right only** (no nav links, no hamburger) | frontend | `[ ]` | Topbar renders on all authenticated routes; active nav item has `aria-current="page"`; sticky; mobile shows brand + Import only |
| 2.4 | Logout — destroy session, redirect to `/login` | frontend | `[ ]` | Session destroyed; `/library` inaccessible without re-login |
| 2.5 | Auth backend — register endpoint hashes password with bcryptjs; duplicate email returns error; session persists across refresh | backend | `[ ]` | Password stored as bcrypt hash; session cookie survives page refresh |

---

## Phase 3: Recipe Import

> Requires Phase 1 complete. Can run in parallel with Phase 2.
> **Spec:** COMPONENT_SPECS.md §5 (ImportForm), PAGE_LAYOUTS.md §4 (/import layout).

| # | Task | Owner | Status | Acceptance Criteria |
|---|------|-------|--------|---------------------|
| 3.1 | Write Claude system prompt for recipe extraction; structured JSON output matching the Recipe type; apply prompt caching (`cache_control`) | backend | `[x]` | Prompt in `src/lib/anthropic.ts`; sends `cache_control: { type: "ephemeral" }` on the system message |
| 3.2 | `/api/ai/import` route — fetch URL content server-side, send to Claude via `streamText`, stream structured recipe JSON back | backend | `[~]` | POST with a valid recipe URL returns a streaming response; final JSON contains `title`, `servings`, `ingredients[]`, `steps[]`; uses `streamText` (not blocking call) — **route implemented; live streaming test with real key still needed** |
| 3.3 | `ImportForm` component per COMPONENT_SPECS.md §5 — URL input, "Bring it in" button, streaming box with pulse dot and status rotation copy | frontend | `[ ]` | Streaming box appears on submit; status text rotates ("Reading the page…" → "Finding the recipe…" → "Done"); lines fade in per `--motion-fade-slow`; reduced-motion shows all at once |
| 3.4 | Import page (`/import`) per PAGE_LAYOUTS.md §4 — eyebrow "Add a new one", headline "Bring a recipe home."; `ImportForm` mounted | frontend | `[ ]` | Page renders at 375px and 1280px per layout spec; ImportForm wired to API route |
| 3.5 | `/api/recipes` POST endpoint — validate payload, insert Recipe row | backend | `[x]` | Returns `201` with saved recipe; rejects unauthenticated requests with `401` |
| 3.6 | **Auto-navigate on import success** — save recipe server-side on streaming complete; redirect to `/recipes/[id]`; no manual "Save" button | frontend | `[ ]` | Recipe saved to DB; user auto-redirects to `/recipes/[id]` ~1.5s after streaming completes; no extra click required |
| 3.7 | Error handling: invalid URL, fetch failure, Claude parse failure | backend + frontend | `[ ]` | Each failure case shows correct copy from REGISTER.md §7; no raw error stack exposed |

---

## Phase 4: Recipe Library

> Requires Phase 2 and 3.6 complete (need a saved recipe to test against).
> **Spec:** COMPONENT_SPECS.md §1 (RecipeListItem), §2 (RecipeDetail), PAGE_LAYOUTS.md §§2–3, STATES.md.

| # | Task | Owner | Status | Acceptance Criteria |
|---|------|-------|--------|---------------------|
| 4.1 | `/api/recipes` GET endpoint — return all recipes for authenticated user | backend | `[x]` | Returns array; no cross-user leakage; empty array (not 404) when no recipes |
| 4.2 | `/api/recipes/[id]` GET endpoint — return single recipe with owner check | backend | `[x]` | Returns recipe for owner; `403` for non-owner; `404` for missing ID |
| 4.3 | `/api/recipes/[id]` DELETE endpoint | backend | `[x]` | Deletes recipe; returns `200`; `403` for non-owner |
| 4.4 | `RecipeListItem` component per COMPONENT_SPECS.md §1 — title, sub-title, meta, tags columns; hover shifts content right 6px; bottom border becomes terracotta | frontend | `[ ]` | Renders at mobile (single-column, stacked) and desktop (3-column); hover and focus states match spec; no warm moments |
| 4.5 | Library page (`/library`) per PAGE_LAYOUTS.md §2 — eyebrow "Your library", dynamic headline ("{count} recipes, kept carefully."), list of `RecipeListItem` | frontend | `[ ]` | Renders at 375px and 1280px; dynamic count in headline; empty state per STATES.md §1; loading skeleton per STATES.md §2 |
| 4.6 | `RecipeDetail` component per COMPONENT_SPECS.md §2 — eyebrow, display title, deck, byline, controls bar, ingredient list, method with Roman numeral steps | frontend | `[ ]` | Steps render as i. ii. iii. in italic terracotta; ingredient amounts use tabular numerals; margin note slot present; 2-column ingredients at desktop |
| 4.7 | Recipe detail page (`/recipes/[id]`) per PAGE_LAYOUTS.md §3 | frontend | `[ ]` | RecipeDetail renders; loading skeleton while fetching; error state per STATES.md |
| 4.8 | Delete recipe — confirmation then DELETE call, redirect to `/library` | frontend | `[ ]` | Recipe removed from library; no accidental deletion without confirmation |

---

## Phase 5: Serving Scaler + Unit Conversion

> Requires Phase 4 (recipe detail page) complete.
> **Spec:** COMPONENT_SPECS.md §3 (ServingScaler), §4 (UnitToggle).

| # | Task | Owner | Status | Acceptance Criteria |
|---|------|-------|--------|---------------------|
| 5.1 | `src/lib/utils.ts` — `scaleAmount(original, baseline, target)` and `convertUnit(amount, unit, system)` pure functions with rounding rules per COMPONENT_SPECS.md §§3–4 | backend | `[ ]` | Unit tests cover: scale up, scale down, "to taste" passthrough, g→oz, ml→fl oz, tsp unchanged, rounding rules |
| 5.2 | `ServingScaler` component per COMPONENT_SPECS.md §3 — stepper with −/+, ↑/↓ keyboard, disabled at min/max, `aria-live` on center value | frontend | `[ ]` | Live rescales all ingredient amounts; original values not mutated; tabular numerals; all keyboard interactions work; aria-live announces changes |
| 5.3 | `UnitToggle` component per COMPONENT_SPECS.md §4 — metric|imperial inline buttons, active underlined in terracotta, `aria-pressed` | frontend | `[ ]` | Toggling converts all amounts using `convertUnit`; back-toggle returns to original; `aria-pressed` correct |
| 5.4 | Wire `ServingScaler` and `UnitToggle` into recipe detail controls bar per PAGE_LAYOUTS.md §3 — mobile wraps to two rows | frontend | `[ ]` | Both controls visible and functional; controls bar wraps correctly on mobile; state resets on page refresh |

---

## Definition of Done (per task)

A task is done only when:
1. Code runs without errors
2. The acceptance criteria above are met
3. At least one unit or integration test covers new logic
4. UI tasks: all states from COMPONENT_SPECS.md are implemented; no hardcoded tokens; mobile verified at 375px
5. No regressions in existing functionality
