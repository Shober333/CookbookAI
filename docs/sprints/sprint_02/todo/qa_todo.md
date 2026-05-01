# Sprint 02 — QA Scenarios

> **Owner:** [DEV-QA]
> Run all scenarios after Phase 2 is complete. Screenshots required for all new UI.

---

## Status Key

- `[ ]` Not tested
- `[x]` Pass
- `[!]` Fail — log bug below

---

## Equipment Profile

| # | Scenario | Steps | Expected | Status |
|---|----------|-------|----------|--------|
| E1 | Save equipment profile | 1. Go to `/equipment` 2. Check "Oven" and "Air fryer" 3. Click Save | Profile saved; page shows success state; GET returns same selection | `[ ]` |
| E2 | Update equipment profile | 1. Save E1 2. Uncheck "Air fryer", check "Grill" 3. Save | Updated profile returned; original selection no longer returned | `[ ]` |
| E3 | Empty equipment profile | New user visits `/equipment` | No appliances pre-checked; save with none checked returns `[]` | `[ ]` |
| E4 | Cross-user isolation | User B logs in; GETs `/api/equipment` | Returns User B's profile, not User A's | `[ ]` |
| E5 | Unauthenticated access | Call `GET /api/equipment` without session | Returns 401 | `[ ]` |

---

## AI Adaptation

| # | Scenario | Steps | Expected | Status |
|---|----------|-------|----------|--------|
| A1 | Adapt recipe — happy path | 1. Save equipment (e.g. air fryer) 2. Open a recipe 3. Click "Adapt for my kitchen" | Adapted steps appear below original; notes visible if present; no errors | `[ ]` |
| A2 | Save adapted version | Complete A1, click "Save this version" | Recipe detail reloads with adapted steps saved; toggle appears | `[ ]` |
| A3 | Discard adapted version | Complete A1, click "Discard" | Adapted panel hidden; original steps unchanged | `[ ]` |
| A4 | Adapt with no equipment saved | Open recipe detail with no equipment profile | "Adapt" button disabled or shows prompt to set up kitchen first | `[ ]` |
| A5 | Unauthenticated adapt call | POST `/api/ai/adapt` without session | Returns 401 | `[ ]` |
| A6 | Adapt wrong owner recipe | POST `/api/ai/adapt` with another user's recipeId | Returns 403 | `[ ]` |

---

## Library Search

| # | Scenario | Steps | Expected | Status |
|---|----------|-------|----------|--------|
| S1 | Search matches title | Type part of a recipe title | Matching recipe cards shown; non-matching hidden | `[ ]` |
| S2 | Search no results | Type a string matching no recipe | "No recipes matching…" state shown; no crash | `[ ]` |
| S3 | Clear search | Type in search box, then clear | All recipes shown again | `[ ]` |
| S4 | Search is per-user | Logged in as User B, search for User A's recipe title | No results (library is private) | `[ ]` |

---

## Regression (re-run Sprint 1 suite)

| # | Scenario | Status |
|---|----------|--------|
| R1 | `npx playwright test` — all 4 Sprint 1 tests pass | `[ ]` |

---

## Screenshots Required

Save to `tests/screenshots/`:

- [ ] `equipment-empty.png` — equipment page, no appliances selected
- [ ] `equipment-saved.png` — equipment page after saving a selection
- [ ] `recipe-adapt-loading.png` — recipe detail, adapt in progress
- [ ] `recipe-adapted.png` — recipe detail with adapted steps panel
- [ ] `recipe-adapted-saved.png` — recipe detail with saved adapted steps toggle
- [ ] `library-search.png` — library page with search active and results

---

## QA Evidence

*(To be filled after testing)*

---

## Bugs Found

*(None yet)*
