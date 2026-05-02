# Sprint 02 — QA Scenarios

> **Owner:** [DEV-QA]
> Run all scenarios after Phase 2 is complete. Screenshots required for all new UI.
> **Run date:** 2026-05-02 · **Status:** All scenarios pass after UI/UX and QA fix verification.

---

## Status Key

- `[ ]` Not tested
- `[x]` Pass
- `[!]` Fail — log bug below

---

## Equipment Profile

| # | Scenario | Steps | Expected | Status |
|---|----------|-------|----------|--------|
| E1 | Save equipment profile | 1. Go to `/equipment` 2. Check "Oven" and "Air fryer" 3. Click Save | Profile saved; page shows success state; GET returns same selection | `[x]` |
| E2 | Update equipment profile | 1. Save E1 2. Uncheck "Air fryer", check "Grill" 3. Save | Updated profile returned; original selection no longer returned | `[x]` |
| E3 | Empty equipment profile | New user visits `/equipment` | No appliances pre-checked; save with none checked returns `[]` | `[x]` |
| E4 | Cross-user isolation | User B logs in; GETs `/api/equipment` | Returns User B's profile, not User A's | `[x]` |
| E5 | Unauthenticated access | Call `GET /api/equipment` without session | Returns 401 | `[x]` |

---

## AI Adaptation

| # | Scenario | Steps | Expected | Status |
|---|----------|-------|----------|--------|
| A1 | Adapt recipe — happy path | 1. Save equipment (e.g. air fryer) 2. Open a recipe 3. Click "Adapt for my kitchen" | Adapted steps appear below original; notes visible if present; no errors | `[x]` |
| A2 | Save adapted version | Complete A1, click "Save this version" | Recipe detail reloads with adapted steps saved; toggle appears | `[x]` |
| A3 | Discard adapted version | Complete A1, click "Discard" | Adapted panel hidden; original steps unchanged | `[x]` |
| A4 | Adapt with no equipment saved | Open recipe detail with no equipment profile | "Adapt" button disabled or shows prompt to set up kitchen first | `[x]` |
| A5 | Unauthenticated adapt call | POST `/api/ai/adapt` without session | Returns 401 | `[x]` |
| A6 | Adapt wrong owner recipe | POST `/api/ai/adapt` with another user's recipeId | Returns 403 | `[x]` |

---

## Library Search

| # | Scenario | Steps | Expected | Status |
|---|----------|-------|----------|--------|
| S1 | Search matches title | Type part of a recipe title | Matching recipe cards shown; non-matching hidden | `[x]` |
| S2 | Search no results | Type a string matching no recipe | "No recipes matching…" state shown; no crash | `[x]` |
| S3 | Clear search | Type in search box, then clear | All recipes shown again | `[x]` |
| S4 | Search is per-user | Logged in as User B, search for User A's recipe title | No results (library is private) | `[x]` |

---

## Unit Conversion

> Vitest covers each scalar conversion; sprint1.spec.ts exercises the full
> metric ↔ imperial toggle round-trip on the recipe detail page.

| # | Scenario | Steps | Expected | Status |
|---|----------|-------|----------|--------|
| U1 | Metric → imperial (g) | Import recipe with grams, toggle to imperial | `200 g` → `7.1 oz` | `[x]` |
| U2 | Imperial → metric (lb) | Import recipe with lb, toggle to metric | `2 lb` → `0.91 kg` (per `convertUnit` rounding) | `[x]` |
| U3 | Imperial → metric (oz) | Import recipe with oz, toggle to metric | `2 oz` → `57 g` (≥ 50 g rounds to whole) | `[x]` |
| U4 | Cups → ml in metric mode | Import recipe with cups, toggle to metric | `1 cup` → `240 ml`, `1 tbsp` → `15 ml`, `1 tsp` → `5 ml` | `[x]` |
| U5 | Cups stay in imperial mode | Import recipe with cups, toggle to imperial | `1 cup` stays `1 cup` | `[x]` |
| U6 | Long-form units normalize | AI outputs `grams` or `pounds` | Normalised to `g` / `lb` at extraction time | `[x]` |
| U7 | Toggle round-trip | Toggle metric → imperial → metric | Amounts return to original values (no drift) | `[x]` |
| U8 | Toggle active visual state | Toggle metric → imperial | Ingredient values and active underline both move to imperial | `[x]` |

---

## Regression (re-run Sprint 1 suite)

| # | Scenario | Status |
|---|----------|--------|
| R1 | `npx playwright test` — Sprint 1 suite green alongside Sprint 2 (15/15 total) | `[x]` |

---

## Screenshots Required

Saved to `tests/screenshots/`:

- [x] `equipment-empty.png` — equipment page, no appliances selected
- [x] `equipment-saved.png` — equipment page after saving a selection
- [x] `recipe-adapt-loading.png` — recipe detail, adapt in progress
- [x] `recipe-adapted.png` — recipe detail with adapted steps panel
- [x] `recipe-adapted-saved.png` — recipe detail with saved adapted steps toggle
- [x] `library-search.png` — library page with search active and results
- [x] Sprint 1 carryover screenshots regenerated against Sprint 2 build after UI/UX review (`library-empty.png`, `library-populated.png`, `recipe-detail.png`, `recipe-scaled.png`, `recipe-unit-toggled.png`, `import-form.png`, `import-preview.png`)

---

## QA Evidence

- **Vitest:** 6 files / 77 tests pass (`npm test`).
- **Playwright (Chromium):** 15 / 15 tests pass — `tests/e2e/sprint1.spec.ts` (4 cases) + new `tests/e2e/sprint2.spec.ts` (11 cases). Re-run after Alice review and frontend fixes on 2026-05-02.
- **Targeted UI/UX re-check:** saved-adaptation Topbar stays sticky after scroll (`header.getBoundingClientRect().top === 0`) and no real layout regression exists. Post-fix E2E assertions confirm the no-equipment AdaptPanel renders only the `Kitchen settings` link and the UnitToggle active underline follows the selected system.
- **Build:** `npm run build` clean (typecheck + Next 15 prerender).
- **Visual review:** Kitchen page renders the locked Sprint 2 chip order (Stovetop · Oven · Air fryer / Slow cooker · Microwave · Instant Pot / Grill · Blender), terracotta-selected chips, square Save button, inline "Saved." copy. Recipe detail shows the inline AdaptPanel below Method (eyebrow + Notes + Steps + Save / Discard) and the new "Download .md · Delete recipe" bottom action row. Topbar nav reads "Kitchen", route stays `/equipment`.
- **Auth-error noise:** Sprint 1 auth test intentionally exercises a wrong-password path, which logs `[auth][error] CredentialsSignin` from Auth.js. Expected behaviour, not a regression.

---

## Bugs Found

Resolved in frontend fix pass:

**Bug:** UnitToggle underline stays on metric while imperial values render
**Steps to Reproduce:**
1. Open a recipe detail page.
2. Click `imperial`.
3. Observe ingredients and the UnitToggle active underline.
**Expected:** `imperial` has the active underline and imperial values render.
**Actual before fix:** Ingredient values render as imperial and `imperial` has `aria-pressed="true"`, but the terracotta underline remains under `metric`. Targeted computed-style check showed `metric` border color as accent and `imperial` border color as transparent despite the React classes being reversed correctly.
**Resolution:** `UnitToggle` now drives the active border through `data-active`, with Playwright CSS assertions for both active and inactive states.
**Severity:** Medium
**Repro environment:** Chromium via `npx playwright test`; desktop viewport; `tests/screenshots/recipe-unit-toggled.png`.

**Bug:** No-equipment AdaptPanel shows duplicate links to Kitchen
**Steps to Reproduce:**
1. Register or use a user with no saved equipment.
2. Open any recipe detail page.
3. Look at the disabled AdaptPanel prompt.
**Expected:** One route to Kitchen setup, preferably the inline `Kitchen settings` link per Alice's review.
**Actual before fix:** The panel shows both `Kitchen settings` and `Set up your kitchen →`, both linking to `/equipment`.
**Resolution:** Removed the duplicate `Set up your kitchen →` paragraph and added a Playwright assertion that it is absent.
**Severity:** Low
**Repro environment:** Chromium via `npx playwright test`; desktop viewport; also visible in regenerated `tests/screenshots/recipe-unit-toggled.png`.

---

## Recommendation

**Ship to CTO review.** Automated regression coverage is green, the saved-adaptation Topbar concern is cleared as a screenshot artifact, and both UI follow-ups from QA/Alice have passing regression coverage.
