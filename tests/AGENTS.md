# Tests — Domain Rules

> Tier-2 agent rules for Playwright, screenshots, and future test suites.
> These extend the root `AGENTS.md`.

---

## Scope

Everything under `tests/` — E2E specs, screenshots, fixtures, and
regression assets.

## Owner Tag

`[DEV-QA]`

## Conventions

1. **E2E tests** live in `tests/e2e/`.
2. **Screenshots** live in `tests/screenshots/`.
3. Screenshot files should be deterministic and named from the scenario
   being verified.
4. Test data must be isolated per spec and must not depend on a real
   production account or secret.

## Rules

- Read `playwright.config.ts` before adding or running E2E tests.
- Cover happy path, edge cases, auth boundaries, and API error handling.
- For UI changes, verify mobile and desktop viewports.
- Capture screenshots for UI-affecting work when required by
  `docs/sprints/sprint_NN/todo/qa_todo.md`.
- Do not commit generated Playwright reports or transient test output.
- If tests cannot run because the app is not scaffolded or dependencies
  are missing, report that clearly with the exact blocker.

