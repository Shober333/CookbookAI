# Sprint 01 — QA Scenarios

> **Owner:** [DEV-QA]
> Run all scenarios before declaring Sprint 1 done. Screenshots required for every UI scenario.

---

## Status Key

- `[ ]` Not tested
- `[x]` Pass
- `[!]` Fail — log bug below

---

## E2E Scenarios (Playwright)

### Auth

| # | Scenario | Steps | Expected | Status |
|---|----------|-------|----------|--------|
| A1 | Happy path: register new user | 1. Go to `/register` 2. Enter valid email + password 3. Submit | Redirected to `/library`; user row in DB with hashed password | `[ ]` |
| A2 | Register: duplicate email | 1. Register with an email 2. Try to register again with same email | Error message shown inline; no duplicate DB row | `[ ]` |
| A3 | Register: invalid email format | Submit form with `notanemail` | Inline validation error; no network request sent | `[ ]` |
| A4 | Happy path: login | 1. Go to `/login` 2. Enter credentials of existing user | Redirected to `/library`; navbar shows user email | `[ ]` |
| A5 | Login: wrong password | Enter correct email, wrong password | Error message "Invalid credentials" (or similar); no session created | `[ ]` |
| A6 | Protected route redirect | 1. Log out 2. Navigate directly to `/library` | Redirected to `/login` | `[ ]` |
| A7 | Logout | Click logout in navbar | Session destroyed; redirected to `/login`; `/library` no longer accessible without re-login | `[ ]` |

---

### Recipe Import

| # | Scenario | Steps | Expected | Status |
|---|----------|-------|----------|--------|
| I1 | Happy path: import from a recipe webpage | 1. Go to `/import` 2. Paste a known recipe URL 3. Click Import | Streaming preview shows title, ingredients, steps; no errors | `[ ]` |
| I2 | Save imported recipe | After I1, click "Save to library" | Redirected to recipe detail page; recipe visible in library | `[ ]` |
| I3 | Import: invalid URL (not a URL) | Submit `not-a-url` | Inline error message; no Claude call made | `[ ]` |
| I4 | Import: URL that is not a recipe page | Submit a URL to a news article or homepage | Graceful error or best-effort extraction; no unhandled exception | `[ ]` |
| I5 | Import: URL fetch fails (unreachable host) | Submit a URL to a non-existent domain | User-facing error "Could not fetch page"; no raw error stack | `[ ]` |

---

### Recipe Library

| # | Scenario | Steps | Expected | Status |
|---|----------|-------|----------|--------|
| L1 | Library: empty state | Log in as new user with no recipes | Empty state message visible; no errors | `[ ]` |
| L2 | Library: shows all user recipes | Import 2+ recipes | Both recipe cards visible with correct titles | `[ ]` |
| L3 | Library: no cross-user leakage | Register user B; log in as B | User B sees no recipes from user A | `[ ]` |
| L4 | Recipe detail: full display | Click a recipe card | Title, source URL, ingredient list, steps all render | `[ ]` |
| L5 | Delete recipe | On detail page, click delete + confirm | Recipe removed from library; redirected to library; card no longer shown | `[ ]` |
| L6 | Delete: cancel confirmation | Click delete, then cancel | Recipe not deleted; user stays on detail page | `[ ]` |

---

### Serving Scaler + Unit Conversion

| # | Scenario | Steps | Expected | Status |
|---|----------|-------|----------|--------|
| S1 | Scale up | On recipe detail, change servings from 4 to 8 | All ingredient amounts double; units unchanged | `[ ]` |
| S2 | Scale down | Change servings from 4 to 2 | All ingredient amounts halve; fractional amounts displayed sensibly | `[ ]` |
| S3 | Scale: non-integer input | Enter "abc" in servings field | Input rejected or ignored; amounts unchanged | `[ ]` |
| S4 | Scaler: non-destructive | Scale to 8, then reset to 4 | Amounts return exactly to original values | `[ ]` |
| U1 | Unit toggle: metric → imperial | On a recipe with metric amounts, toggle to imperial | Grams → oz, ml → fl oz, °C → °F throughout | `[ ]` |
| U2 | Unit toggle: imperial → metric | Toggle back | Values return to original metric amounts | `[ ]` |

---

## Screenshots Required

Capture and save to `tests/screenshots/` for each:

- [ ] `register.png` — registration page
- [ ] `login.png` — login page
- [ ] `library-empty.png` — empty library state
- [ ] `library-populated.png` — library with recipe cards
- [ ] `import-form.png` — import page before submission
- [ ] `import-preview.png` — recipe preview after Claude extraction
- [ ] `recipe-detail.png` — recipe detail page
- [ ] `recipe-scaled.png` — recipe detail with servings changed
- [ ] `recipe-unit-toggled.png` — recipe detail with imperial units

---

## Bug Report Format

```
**Bug:** [short description]
**Steps to Reproduce:**
1. ...
2. ...
**Expected:** [what should happen]
**Actual:** [what actually happens]
**Severity:** Critical / High / Medium / Low
**Environment:** [browser, viewport, dev command run]
```

---

## Bugs Found

_(Log bugs here as discovered)_
