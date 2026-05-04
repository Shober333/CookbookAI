# Sprint 04 — QA Scenarios

> **Owner:** [DEV-QA]
> **Run date:** 2026-05-04 · **Status:** Complete — all QA scenarios pass, including live Gemini/YouTube smoke.

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
| Q4.7 | Real YouTube recipe link | With `YOUTUBE_API_KEY`, import a video description containing a recipe URL | Import follows the candidate recipe URL and records `youtube-link` metadata | `[x]` |
| Q4.8 | Real YouTube recipe description | With `YOUTUBE_API_KEY`, import a video whose description contains recipe-like text | Import extracts from description text and records `youtube-description` metadata | `[x]` |
| Q4.9 | YouTube no recipe | Import a video without recipe text or candidate recipe URL | User sees "No recipe in this video" recovery state | `[x]` |
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
| Q4.15 | Live Gemini smoke test | If a real key is available, Gemini 2.5 Flash extracts one real recipe payload | `[x]` |

---

## Demo Hardening

| # | Scenario | Steps | Expected | Status |
|---|----------|-------|----------|--------|
| Q4.16 | Desktop demo pass | Visit login, import, library, and recipe detail on desktop viewport | No layout overlap; screenshots captured if UI changed | `[x]` |
| Q4.17 | Mobile smoke pass | Repeat core import/library flow at mobile viewport | Layout remains usable and readable | `[x]` |
| Q4.18 | Test suite regression | Run typecheck, unit tests, build, and Playwright | All checks pass or failures are documented with owner | `[x]` |

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

## Fix Verification — 2026-05-04

- `npm run typecheck` passed.
- `npm test` passed: 9 files / 112 tests.
- Focused auth regression rerun passed: `npx playwright test tests/e2e/sprint1.spec.ts:81 --project=chromium --workers=1`.
- Full E2E rerun passed: `npx playwright test --project=chromium` — 27 / 27.
- `npm run build` passed; Next.js built 15 routes successfully, including new `/api/auth/logout`.
- Playwright now runs on an isolated default port (`3100`) with matching `NEXTAUTH_URL` / `AUTH_URL`, so stale local port 3000 state no longer invalidates the suite.
- Expected Auth.js `CredentialsSignin` noise still appears during the intentional wrong-password test path, but it does not fail the user-facing flow.

## Live API Smoke — 2026-05-04

- Temporary QA-only Playwright smoke spec passed: 4 / 4.
- Q4.15 live Gemini smoke passed with `AI_PROVIDER=gemini` and `GEMINI_MODEL=gemini-2.5-flash`: pasted recipe text imported and rendered as `Gemini Smoke Test Lemon Rice`.
- Q4.7 live YouTube link path passed with `https://www.youtube.com/watch?v=3AC8thsvwW4`: UI showed `Following the link in the description…`, completed with `Done`, and navigated to recipe detail.
- Q4.8 live YouTube description path passed with `https://www.youtube.com/watch?v=k5jTp7zm3Xo`: UI showed `Reading the description…`, completed with `Done`, and navigated to recipe detail.
- Q4.9 live YouTube no-recipe path passed with `https://www.youtube.com/watch?v=dQw4w9WgXcQ`: UI showed `No recipe in this video` and the designed `Paste recipe text instead →` recovery action.
- API keys were read from `.env`; no key values were printed or committed.

---

## Bugs Found

**Bug:** First registration flow creates an account but does not navigate to the library
**Status:** Fixed and verified 2026-05-04.
**Steps to Reproduce:**
1. Run `npx playwright test tests/e2e/sprint1.spec.ts:81 --project=chromium --workers=1`.
2. The test fills `/register` with a fresh email and password.
3. Click `Create account`.
**Expected:** Account is created, the user is signed in, and the browser navigates to `/library`.
**Actual:** The browser remains on `/register`. The screenshot shows the form re-enabled with no visible error. The first full clean Playwright run also failed two concurrent registration flows this way.
**Severity:** High
**Repro environment:** Chromium, localhost:3000, clean Playwright web server after clearing stale port 3000 listener.

**Bug:** Port 3000 stale listener can make the whole E2E suite time out
**Status:** Fixed and verified 2026-05-04 by isolating Playwright on port 3100 with `reuseExistingServer: false`.
**Steps to Reproduce:**
1. Leave a stale `node` process listening on port 3000.
2. Run `npx playwright test --project=chromium`.
**Expected:** Playwright should start or reuse a responsive server, or fail fast with a clear port/server readiness error.
**Actual:** The suite can connect to port 3000 but receives no bytes; all 27 tests timed out on first navigation/API request.
**Severity:** Medium
**Repro environment:** Local macOS/Codex shell; stale process PID was holding `*:3000`.

---

## Recommendation

**Ready for CTO review from QA.** The previously blocking auth/session regression is fixed, the stale-port E2E failure mode is mitigated, the full automated regression suite is green, and live Gemini/YouTube smoke passed.

---

## QA Closeout

Sprint 04 meets the QA gate for local demo readiness. Automated checks pass,
live provider smoke passed with real Gemini and YouTube APIs, and the two QA
bugs discovered during the first pass are fixed and verified. No QA-owned
Sprint 04 blockers remain.
