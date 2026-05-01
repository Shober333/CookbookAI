# Sprint 02 — Dev Tasks

> **Owner:** [DEV-LEAD]
> **Sprint goal:** Equipment adapter (profile + AI rewrite) + library search.
> Complete Phase 1 before starting Phase 2. QA runs after Phase 2 is done.

---

## Phase 1 — Backend

### Task B1 — Equipment profile API `[DEV:backend]` · Small

**What:** Implement `GET /api/equipment` and `PUT /api/equipment`.

**Behaviour:**
- `GET` — returns the current user's `EquipmentProfile.appliances` as a parsed
  string array. If no profile exists yet, returns `{ appliances: [] }` (do not
  create a row on GET).
- `PUT` — accepts `{ appliances: string[] }`, upserts the `EquipmentProfile`
  row for the authenticated user, returns `{ appliances: string[] }`.
- Both require auth; return `401` if unauthenticated.
- Valid appliance keys (enforce in Zod): `oven`, `stovetop`, `microwave`,
  `air_fryer`, `slow_cooker`, `grill`, `instant_pot`, `blender`.
  Unknown keys are stripped, not rejected.

**File:** `src/app/api/equipment/route.ts` (create)

**Tests:** Unit test the appliance parse/serialise round-trip. E2E in QA phase.

---

### Task B2 — Recipe schema migration: add `adaptedSteps` `[DEV:backend]` · Small

**What:** Add a nullable `adaptedSteps String?` column to the `Recipe` model.

**Behaviour:**
- Nullable — existing recipes default to `NULL` (no data loss, no backfill needed).
- Stored as a JSON-serialised `string[]`, same pattern as `steps`.
- The `PATCH /api/recipes/[id]` endpoint should already accept `adaptedSteps` in
  its update payload once the column exists — verify and extend if needed.

**Files:**
- `prisma/schema.prisma` — add `adaptedSteps String?` to `Recipe`
- `prisma/migrations/` — `npm run db:migrate` generates the migration
- `src/app/api/recipes/[id]/route.ts` — include `adaptedSteps` in PATCH handler

**Tests:** No migration unit test needed; E2E will exercise save/discard.

---

### Task B3 — AI adaptation endpoint `[DEV:backend]` · Medium

**What:** Implement `POST /api/ai/adapt`.

**Request body:**
```typescript
{ recipeId: string, appliances: string[] }
```

**Behaviour:**
1. Auth check — `401` if unauthenticated.
2. Load recipe by `recipeId` — `404` if not found, `403` if not owner.
3. Parse `recipe.steps` from JSON string.
4. Construct prompt with steps + appliance list.
5. Call AI (Ollama or Anthropic via `src/lib/anthropic.ts` config).
6. Validate and normalise response into `{ adaptedSteps: string[], notes: string }`.
7. Return `200` with that shape.

**AI response schema (Zod):**
```typescript
z.object({
  adaptedSteps: z.array(z.string()).min(1),
  notes: z.string(),
})
```

**Ollama path:** use `/api/chat` with `format` JSON schema (same pattern as
`recipe-ai-extractor.ts`). Use `AbortController` + `setTimeout` for the
timeout (not `AbortSignal.timeout()`). Timeout: `OLLAMA_EXTRACTION_TIMEOUT_MS`
(default 120 000ms).

**Anthropic path:** use `generateObject` from Vercel AI SDK with the Zod schema.

**System prompt:** `equipmentAdaptationSystemPrompt` is already in
`src/lib/anthropic.ts`.

**File:** `src/app/api/ai/adapt/route.ts` (create)

**Tests:** Unit test the normalisation/validation logic separately. E2E in QA.

---

### Task B4 — Library search `[DEV:backend]` · Small

**What:** Add optional `?q=` query param to `GET /api/recipes`.

**Behaviour:**
- If `q` is absent or blank, return all recipes (current behaviour).
- If `q` is present, filter: `title LIKE '%q%'` (Prisma `contains`, which maps
  to SQLite's case-insensitive `LIKE` without `mode`).
- Trim and sanitise `q` — no raw string interpolation into queries; use Prisma's
  parameterised `contains`.

**File:** `src/app/api/recipes/route.ts` — extend existing GET handler

**Tests:** Unit test the query-building logic. E2E in QA.

---

## Phase 2 — Frontend

> Start after B1–B4 are merged and the dev server runs cleanly.

### Task F1 — Equipment settings page `[DEV:frontend]` · Medium

**What:** Create `/equipment` page.

**Route:** `src/app/(app)/equipment/page.tsx`

**UI (placeholder spec — pending Alice review):**
- Page heading: "My kitchen" (eyebrow) / "Your equipment" (h1)
- Appliance list rendered as toggle buttons or checkboxes, one per appliance.
  Labels: Oven, Stovetop, Microwave, Air fryer, Slow cooker, Grill,
  Instant Pot, Blender.
- On load: fetch `GET /api/equipment`, pre-check the saved appliances.
- "Save" button: `PUT /api/equipment` with current selection; show inline
  success/error state.
- Link to this page from the Navbar or the library page header (wherever
  Alice's design places it — for now put a "Kitchen" link in the Navbar).
- Navbar update: add "Kitchen" link alongside the existing nav items.

**No invented tokens or copy.** Use existing UI kit classes. If a string
or token doesn't exist, use the closest existing one and flag it.

**Files:**
- `src/app/(app)/equipment/page.tsx` (create)
- `src/components/layout/Navbar.tsx` (update — add Kitchen nav link)

---

### Task F2 — Adapt flow on recipe detail `[DEV:frontend]` · Medium

**What:** Add "Adapt for my kitchen" to the recipe detail page.

**UI (placeholder spec — pending Alice review):**
- Button below the recipe steps: "Adapt for my kitchen"
  - Disabled if the user has no appliances saved (show tooltip: "Save your
    equipment in Kitchen settings first").
  - On click: `POST /api/ai/adapt` with `{ recipeId, appliances }`.
    Show a loading state while the AI is working ("Adapting…").
- Result panel (appears below the button):
  - Eyebrow: "Adapted for your kitchen"
  - Adapted steps list.
  - Notes line (if non-empty).
  - Two buttons: "Save this version" and "Discard".
    - "Save this version": `PATCH /api/recipes/[id]` with `{ adaptedSteps }`.
      On success, persist the adapted steps and show a confirmation.
    - "Discard": hides the result panel.
- If `recipe.adaptedSteps` is already saved, show it collapsed below the
  original steps with a toggle: "Show adapted version".

**Files:**
- `src/components/recipe/AdaptPanel.tsx` (create)
- `src/app/(app)/recipes/[id]/page.tsx` (update — add AdaptPanel)
- `src/components/recipe/RecipeDetail.tsx` (update if needed)

---

### Task F3 — Library search input `[DEV:frontend]` · Small

**What:** Add search input to the library page.

**UI:**
- Text input in the library page header, placeholder "Search recipes…"
- Debounce 300ms, then update query: `GET /api/recipes?q=<term>`
- While fetching, dim the recipe grid (opacity).
- Empty-search result: show "No recipes matching '<term>'." — distinct from
  the empty library state.

**Files:**
- `src/app/(app)/library/page.tsx` (update — add search state + input)

---

## Definition of Done (per task)

- [ ] `npm run typecheck` passes
- [ ] `npx playwright test` still green (no regressions)
- [ ] New logic has at least one test
- [ ] Committed with a focused message

---

## Task Status

| Task | Assignee | Status |
|------|----------|--------|
| B1 Equipment profile API | [DEV:backend] | Not started |
| B2 adaptedSteps migration | [DEV:backend] | Not started |
| B3 AI adaptation endpoint | [DEV:backend] | Not started |
| B4 Library search backend | [DEV:backend] | Not started |
| F1 Equipment settings page | [DEV:frontend] | Not started |
| F2 Adapt flow on recipe detail | [DEV:frontend] | Not started |
| F3 Library search input | [DEV:frontend] | Not started |
