# Sprint 05 — QA Scenarios

> **Owner:** [DEV-QA]
> **Run date:** TBD · **Status:** Not started.

---

## Status Key

- `[ ]` Not run
- `[/]` Running
- `[x]` Passed
- `[!]` Failed
- `[-]` Deferred

---

## Local Regression

| # | Scenario | Steps | Expected | Status |
|---|----------|-------|----------|--------|
| Q5.1 | Typecheck | Run `npm run typecheck` | Clean | `[ ]` |
| Q5.2 | Unit tests | Run `npm test` | All tests pass | `[ ]` |
| Q5.3 | Production build | Run `npm run build` | Build succeeds | `[ ]` |
| Q5.4 | E2E regression | Run `npx playwright test --project=chromium` | All tests pass | `[ ]` |

---

## Deployment Setup

| # | Scenario | Steps | Expected | Status |
|---|----------|-------|----------|--------|
| Q5.5 | Required Vercel env vars documented | Review deployment docs / README | Every required variable has purpose, example, and source | `[ ]` |
| Q5.6 | Missing-key behavior | Temporarily omit Gemini/YouTube vars in a safe env | App starts; import routes return controlled errors | `[ ]` |
| Q5.7 | Database migration path | Run documented migration workflow against target DB or staging clone | Prisma schema applies cleanly or blocker is documented | `[ ]` |

---

## Deployed Smoke

| # | Scenario | Steps | Expected | Status |
|---|----------|-------|----------|--------|
| Q5.8 | Deployed auth flow | Register/login/logout on deployed URL | User lands in library; protected pages redirect when signed out | `[ ]` |
| Q5.9 | Text import with Gemini | With deployed `AI_PROVIDER=gemini`, paste a small recipe | Recipe saves and renders detail page | `[ ]` |
| Q5.10 | URL import | Import a stable recipe URL | Recipe saves or shows a controlled site-blocked state | `[ ]` |
| Q5.11 | YouTube link path | Import a video whose description contains recipe URL | App follows candidate URL and records YouTube link path | `[ ]` |
| Q5.12 | YouTube description path | Import a video with recipe-like description text | App imports description and records YouTube description path | `[ ]` |
| Q5.13 | YouTube no-recipe recovery | Import a no-recipe video | User sees designed recovery state; no recipe is saved | `[ ]` |
| Q5.14 | Library/detail smoke | Open library and a saved recipe | No layout overlap; ingredients, method, scaling, unit toggle render | `[ ]` |

---

## Demo Readiness

| # | Scenario | Steps | Expected | Status |
|---|----------|-------|----------|--------|
| Q5.15 | Desktop screenshot pass | Capture login, import, library, recipe detail | Screenshots saved if UI changed | `[ ]` |
| Q5.16 | Mobile smoke pass | Repeat auth/import/library at 375px | Layout remains usable; tap targets pass | `[ ]` |
| Q5.17 | Rollback notes | Review sprint report / deployment notes | Clear recovery steps for bad deploy, bad env, provider quota, and DB migration issue | `[ ]` |

---

## Bugs Found

None yet.

---

## Recommendation

QA begins after `[DEV-LEAD]` marks deployment setup ready and provides the
target Vercel URL or documents the deployment blocker.

