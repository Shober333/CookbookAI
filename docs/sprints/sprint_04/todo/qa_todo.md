# Sprint 04 — QA Scenarios

> **Owner:** [DEV-QA]
> **Run date:** 2026-05-04 · **Status:** In progress — automated backend checks pass; E2E blocked by auth/session regression.

---

## Status Key

- `[ ]` Not run
- `[/]` Running
- `[x]` Passed
- `[!]` Failed
- `[-]` Deferred

---

## Environment

| # | Scenario | Steps | Expected | Status |
|---|----------|-------|----------|--------|
| Q4.1 | Clean setup | Start from current `main` or Sprint 04 branch, create `.env`, run database migration | App starts without missing-secret or missing-database blockers | `[x]` |
| Q4.2 | Missing live keys | Run import routes without optional provider keys | App returns stable user-facing errors; startup still works | `[x]` |

---

## Import Regression

| # | Scenario | Steps | Expected | Status |
|---|----------|-------|----------|--------|
| Q4.3 | URL import | Import a normal recipe URL through `/import` | Recipe saves and appears in library | `[x]` |
| Q4.4 | Text import | Paste recipe-like text into text mode | Recipe saves and appears in library | `[x]` |
| Q4.5 | Duplicate URL reuse | Import a URL already present in extracted-data cache | AI extraction is skipped and quiet reuse feedback appears | `[x]` |
| Q4.6 | Non-recipe URL/text | Submit non-recipe content | No recipe is saved; targeted recovery action appears | `[x]` |

---

## YouTube Live Validation

| # | Scenario | Steps | Expected | Status |
|---|----------|-------|----------|--------|
| Q4.7 | Real YouTube recipe link | With `YOUTUBE_API_KEY`, import a video description containing a recipe URL | Import follows the candidate recipe URL and records `youtube-link` metadata | `[-]` |
| Q4.8 | Real YouTube recipe description | With `YOUTUBE_API_KEY`, import a video whose description contains recipe-like text | Import extracts from description text and records `youtube-description` metadata | `[-]` |
| Q4.9 | YouTube no recipe | Import a video without recipe text or candidate recipe URL | User sees "No recipe in this video" recovery state | `[-]` |
| Q4.10 | Invalid/missing YouTube key | Use missing or invalid key | App returns a clear typed error and no recipe is saved | `[x]` |

---

## Transcript Fallback

| # | Scenario | Expected | Status |
|---|----------|----------|--------|
| Q4.11 | Transcript available | Transcript is used only after description-first fails | `[x]` |
| Q4.12 | Transcript unavailable | Unavailable transcript produces stable fallback/no-recipe state | `[x]` |

---

## Gemini 2.5 Flash Provider

| # | Scenario | Expected | Status |
|---|----------|----------|--------|
| Q4.13 | Mocked Gemini extraction | `AI_PROVIDER=gemini` routes through the Gemini adapter and returns a validated recipe payload | `[x]` |
| Q4.14 | Missing Gemini key | Missing `GEMINI_API_KEY` returns a stable configuration error without crashing startup | `[x]` |
| Q4.15 | Live Gemini smoke test | If a real key is available, Gemini 2.5 Flash extracts one real recipe payload | `[-]` |

---

## Demo Hardening

| # | Scenario | Steps | Expected | Status |
|---|----------|-------|----------|--------|
| Q4.16 | Desktop demo pass | Visit login, import, library, and recipe detail on desktop viewport | No layout overlap; screenshots captured if UI changed | `[!]` |
| Q4.17 | Mobile smoke pass | Repeat core import/library flow at mobile viewport | Layout remains usable and readable | `[x]` |
| Q4.18 | Test suite regression | Run typecheck, unit tests, build, and Playwright | All checks pass or failures are documented with owner | `[!]` |

---

## QA Evidence — 2026-05-04

- `npm run db:migrate` passed; local SQLite database is in sync and Prisma Client generated.
- `npm run typecheck` passed.
- `npm test` passed: 9 files / 105 tests.
- `npm run build` passed; Next.js built 14 routes successfully.
- First `npx playwright test --project=chromium` was invalidated by a stale `node` process holding port 3000 and accepting connections without responding. QA force-stopped that process and reran on a clean port 3000.
- Clean `npx playwright test --project=chromium` result: 24 passed / 3 failed.
- Serial rerun of the three failed tests: 2 passed / 1 failed.
- Final focused rerun of `tests/e2e/sprint1.spec.ts:81`: failed deterministically.
- `.env` contains `GEMINI_API_KEY` and `YOUTUBE_API_KEY`, but live YouTube/Gemini smoke was deferred after the auth demo path failed. Do not burn live validation time until registration/sign-in is stable.

---

## Bugs Found

**Bug:** First registration flow creates an account but does not navigate to the library
**Steps to Reproduce:**
1. Run `npx playwright test tests/e2e/sprint1.spec.ts:81 --project=chromium --workers=1`.
2. The test fills `/register` with a fresh email and password.
3. Click `Create account`.
**Expected:** Account is created, the user is signed in, and the browser navigates to `/library`.
**Actual:** The browser remains on `/register`. The screenshot shows the form re-enabled with no visible error. The first full clean Playwright run also failed two concurrent registration flows this way.
**Severity:** High
**Repro environment:** Chromium, localhost:3000, clean Playwright web server after clearing stale port 3000 listener.

**Bug:** Port 3000 stale listener can make the whole E2E suite time out
**Steps to Reproduce:**
1. Leave a stale `node` process listening on port 3000.
2. Run `npx playwright test --project=chromium`.
**Expected:** Playwright should start or reuse a responsive server, or fail fast with a clear port/server readiness error.
**Actual:** The suite can connect to port 3000 but receives no bytes; all 27 tests timed out on first navigation/API request.
**Severity:** Medium
**Repro environment:** Local macOS/Codex shell; stale process PID was holding `*:3000`.

---

## Recommendation

**Do not send Sprint 4 to CTO review yet.** Backend unit coverage for Gemini and transcript fallback is green, but the demo auth path is not stable enough: a fresh account can be created without completing sign-in or navigation. Fix the registration/session issue, then rerun full Playwright and live YouTube/Gemini smoke checks.
