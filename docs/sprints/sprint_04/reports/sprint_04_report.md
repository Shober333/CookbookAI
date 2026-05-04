# Sprint 04 — Dev Report

## Summary

Sprint 04 hardened the production/demo import path: YouTube import now has
description-first live validation plus transcript fallback, recipe extraction can
route through Gemini 2.5 Flash via a neutral provider boundary, and the auth/E2E
demo path is more stable.

## Tasks Completed

- **4.1–4.3** — Founder-approved Sprint 04 scope and CTO decisions recorded in
  `docs/DECISIONS.md`.
- **4.4–4.6** — Live YouTube validation completed; affiliate/merch/social links
  are filtered; missing key, missing transcript, and no-recipe cases are stable.
- **4.7–4.9** — Public transcript fallback added after description-first paths
  fail; unit tests cover available, unavailable, and non-recipe transcript
  behavior.
- **4.10–4.12** — Shared AI provider boundary supports Ollama, Anthropic, and
  Gemini; mocked and live Gemini smoke checks passed.
- **4.13–4.15** — Clean setup/demo checklist verified; registration redirect and
  logout behavior stabilized; Playwright now runs on isolated port 3100 to avoid
  stale local server state.

## Tasks Deferred

- Direct Gemini video understanding remains out of scope unless the Founder
  promotes it in a later sprint.
- Hosted deployment automation remains out of scope; Sprint 04 targets local demo
  readiness.

## Blockers Encountered

- First QA pass found a high-severity registration/session regression: account
  creation succeeded but the browser stayed on `/register`. The frontend/auth fix
  now signs in with a callback URL and hard-navigates to `/library`; focused auth
  regression and full E2E both pass.
- A stale process on port 3000 made Playwright connect to an unresponsive server.
  Playwright now defaults to port 3100 with `reuseExistingServer: false` and
  matching `NEXTAUTH_URL` / `AUTH_URL`.

## Known Issues

- The intentional wrong-password auth test still logs Auth.js
  `CredentialsSignin` noise. This is expected and documented in QA evidence.
- Live API smoke depends on local `.env` keys. Key values were not printed or
  committed.

## How to Verify

Commands from project root:

```bash
npm run db:migrate
npm run typecheck
npm test
npm run build
npx playwright test --project=chromium
```

Latest verified state on 2026-05-04:

- `npm run typecheck` — passed.
- `npm test` — 9 files / 112 tests passed.
- `npm run build` — passed; 15 Next routes built, including
  `/api/auth/logout`.
- `npx playwright test --project=chromium` — 27 / 27 passed.
- Temporary live API smoke — 4 / 4 passed for Gemini text import, YouTube
  external-link import, YouTube description import, and YouTube no-recipe
  recovery.

## Handoff

Ready for CTO Good/Bad/Ugly review. The dev and QA bodies have no open Sprint 04
blockers.
