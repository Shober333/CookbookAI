# Sprint 07 - QA Report

> **Owner:** [DEV-QA]  
> **Run date:** 2026-05-06  
> **Status:** Partial pass; browser and deployed smoke blocked by local environment / missing live credentials.

---

## Summary

Sprint 07 passed the local non-browser gates:

- `npm run typecheck` - passed.
- `npm test` - passed: 14 test files, 161 tests.
- `npm run build` - passed.
- `DATABASE_URL='postgresql://user:pass@localhost:5432/cookbookai_stub' npm run build:vercel` - passed when run in isolation.

The full Chromium E2E regression could not complete in this Codex desktop
environment. The first attempt was blocked because Chromium was missing; after
installing Chromium into a workspace-local Playwright cache, Chromium launches
failed with a macOS sandbox Mach-port permission error:

`bootstrap_check_in org.chromium.Chromium.MachPortRendezvousServer... Permission denied (1100)`

The temporary workspace-local browser cache was removed after the run because
the machine reached critically low disk space.

---

## Local Regression Matrix

| Scenario | Result | Evidence |
|---|---:|---|
| Q7.1 Typecheck | Passed | `npm run typecheck` completed cleanly |
| Q7.2 Unit tests | Passed | `npm test`: 14 files / 161 tests passed |
| Q7.3 Local production build | Passed | `npm run build` completed cleanly |
| Q7.4 Vercel-style build | Passed | Isolated `npm run build:vercel` with stub Postgres URL completed cleanly |
| Q7.5 E2E regression | Blocked / Failed | Browser launch blocked by local macOS sandbox; one API assertion also returned 404 instead of 401 |

Note: an earlier parallel run of `npm run build` and `npm run build:vercel`
produced `Unexpected end of JSON input` during Next page-data collection. The
same Vercel-style build passed when rerun alone, so QA treats the isolated run
as the valid build gate.

---

## Feature Coverage

### Nutrition / Macros

- Unit coverage exists for macro calculation, partial matches, all-unmatched
  no-match behavior, USDA missing-key handling, and nutrient parsing.
- API route `POST /api/recipes/[id]/nutrition` exists and owner-checks the
  recipe before calculation.
- UI component `NutritionPanel` includes idle, calculating, success, partial,
  recalculate, config error, service error, and no-match states.

Not browser-verified in this run:

- Desktop/mobile nutrition panel rendering.
- Keyboard flow and visible focus.
- Reduced-motion visual behavior.
- Screenshot evidence for idle/full/partial/error nutrition states.
- Live USDA lookup, because no `FOODDATA_CENTRAL_API_KEY` was available.

### Groq GPT-OSS Provider

- Mocked Groq unit tests are included in the passing test suite.
- Missing-key behavior is covered by unit tests.
- Live Groq smoke was deferred because no `GROQ_API_KEY` was available.

### AI-Direct YouTube Video Fallback

- Mocked video fallback unit tests are included in the passing test suite.
- Live Gemini video fallback smoke was deferred because no live video-provider
  key was available in this QA environment.

### Deployed Smoke

Deferred. No deployed URL or production credentials were provided in this turn.

---

## Bugs / Blockers

**Bug:** Text import auth E2E receives 404 instead of 401  
**Steps to Reproduce:**
1. Run `PLAYWRIGHT_BROWSERS_PATH='./.playwright-browsers' npx playwright test --project=chromium`.
2. Observe `tests/e2e/sprint3.spec.ts` scenario "text import API requires authentication".
3. The test posts unauthenticated JSON to `/api/ai/import` with `mode: "text"`.
**Expected:** The API returns `401` with the existing authentication-required behavior.  
**Actual:** The request returned `404` during the E2E run.  
**Severity:** Medium  
**Repro environment:** Codex desktop, local Next dev server on port 3100, Chromium E2E run.

**Bug:** Browser E2E and screenshot gates blocked by Chromium launch permissions  
**Steps to Reproduce:**
1. Install Chromium into a workspace-local Playwright cache.
2. Run `PLAYWRIGHT_BROWSERS_PATH='./.playwright-browsers' npx playwright test --project=chromium`.
3. Observe Chromium launch failures before page-level assertions run.
**Expected:** Chromium launches and the E2E suite exercises app flows.  
**Actual:** Chromium exits with `bootstrap_check_in ... Permission denied (1100)`.  
**Severity:** High for QA confidence, Low for product behavior  
**Repro environment:** Codex desktop macOS sandbox, local Playwright Chromium.

**Bug:** Local machine disk space is too low for reliable browser QA  
**Steps to Reproduce:**
1. Install local Playwright Chromium and run E2E.
2. Start the dev server afterward.
**Expected:** Dev server can write `.next` artifacts normally.  
**Actual:** The dev server hit `ENOSPC: no space left on device` while writing `.next/package.json` and `.next/trace`.  
**Severity:** High for QA execution, Low for product behavior  
**Repro environment:** Codex desktop workspace; `df -h .` showed under 1 GiB available.

---

## Screenshots

Not captured. Screenshot gates Q7.26 and UI-specific desktop/mobile evidence are
blocked until browser execution works in an environment where Chromium can
launch and enough disk space is available.

---

## QA Recommendation

Do not mark Sprint 07 fully QA-complete yet. The implementation passes compile,
unit, and build gates, but the browser/UI quality gates and deployed smoke
remain open. Rerun E2E and capture the required nutrition screenshots in a
normal local shell or CI runner with Playwright browsers installed and adequate
disk space.
