# Run E2E Tests

Run Playwright E2E tests.

This is the Codex prompt mirror of `.claude/commands/e2e.md`.

1. Read `playwright.config.ts`.
2. Confirm the dev server command in `CLAUDE.md`.
3. Run `npx playwright test` when dependencies and server configuration
   are available.
4. Save UI screenshots under `tests/screenshots/` when required by the
   sprint QA plan.
5. Report pass/fail status and any actionable failures.
