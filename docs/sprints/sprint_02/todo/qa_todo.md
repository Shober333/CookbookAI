# Sprint 02 — QA Scenarios

> **Owner:** [DEV-QA]
> Run all scenarios after Phase 2 is complete. Screenshots required for all new UI.
> **Run date:** 2026-05-02 · **Status:** All scenarios pass.

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

---

## QA Evidence

- **Vitest:** 6 files / 77 tests pass (`npm test`).
- **Playwright (Chromium):** 15 / 15 tests pass — `tests/e2e/sprint1.spec.ts` (4 cases) + new `tests/e2e/sprint2.spec.ts` (11 cases).
- **Build:** `npm run build` clean (typecheck + Next 15 prerender).
- **Visual review:** Kitchen page renders the locked Sprint 2 chip order (Stovetop · Oven · Air fryer / Slow cooker · Microwave · Instant Pot / Grill · Blender), terracotta-selected chips, square Save button, inline "Saved." copy. Recipe detail shows the inline AdaptPanel below Method (eyebrow + Notes + Steps + Save / Discard) and the new "Download .md · Delete recipe" bottom action row. Topbar nav reads "Kitchen", route stays `/equipment`.
- **Auth-error noise:** Sprint 1 auth test intentionally exercises a wrong-password path, which logs `[auth][error] CredentialsSignin` from Auth.js. Expected behaviour, not a regression.

---

## Bugs Found

None.

---

## Recommendation

**Ship.** All scenarios pass, screenshots captured, no regressions introduced. Ready for CTO Good/Bad/Ugly review.
