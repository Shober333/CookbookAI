# Sprint 01 — Report

| Field | Value |
|-------|-------|
| **Sprint** | 01 |
| **Status** | Dev complete; QA pending |
| **Dev tasks completed** | 34 / 34 |
| **QA scenarios completed** | 0 / 24 |
| **Report date** | 2026-05-01 |

---

## What was delivered

- Next.js 15 app scaffold with TypeScript, Tailwind CSS, App Router,
  shadcn/ui primitives, project tokens, and the configured font stack.
- Prisma + SQLite local persistence with Auth.js tables, recipe storage,
  and a migration preflight for local `file:` SQLite URLs.
- Auth flow: register, login, logout, session persistence, protected app
  routes, duplicate-email handling, and bcrypt password hashing.
- Recipe import flow: URL submission, server-side page fetch, configured
  AI extraction provider, structured recipe normalization, save, and
  auto-navigation to the recipe detail page.
- Recipe library flow: authenticated recipe list, empty state, detail
  page, owner checks, and delete.
- Serving scaler and unit conversion controls on recipe detail, with unit
  tests for the shared conversion/scaling logic.
- Ollama-first local AI path through `AI_PROVIDER=ollama`, while keeping
  the provider switch configurable for cloud AI later.

## What wasn't delivered (and why)

- Sprint 1 QA is not complete. `docs/sprints/sprint_01/todo/qa_todo.md`
  still has all scenarios untested.
- Playwright coverage is still placeholder-level; the Sprint 1 flows need
  real E2E tests.
- Required UI screenshots have not been captured under
  `tests/screenshots/`.
- Import extraction quality has not been measured across enough real
  recipe URLs.
- Production AI strategy is not decided. Ollama is valid for local
  validation, but deploy needs a cloud/provider decision.
- Equipment adaptation remains a PRD must-have but was not validated in
  this sprint's current app flow.

## Bugs and Risks

- Fixed during development: stale dev server ports, malformed/fenced AI
  JSON handling, incorrect post-save redirect shape, Ollama timeout on
  full page text, misplaced ingredient quantities, and fractional cup
  rounding to zero.
- Still open: `main` must include the CSS fix that removes the invalid
  `shadcn/tailwind.css` import before local dev can be considered stable.
- Still open: no QA evidence yet for cross-user recipe isolation. This is
  the highest-risk acceptance gate.
- Still open: import progress UI implies streaming, while the current
  Ollama extraction path returns a blocking JSON response.

## Key decisions made

- Use local Ollama as the Sprint 1 default AI provider for validation.
- Keep AI provider selection behind `AI_PROVIDER` so Anthropic/cloud AI
  remains available later.
- Use Prisma + SQLite for local MVP persistence.
- Use Auth.js v5 with a credentials provider and Prisma adapter.
- Save imported recipes automatically after extraction; no separate
  manual Save step.

## Lessons learned

- The AI import path needs structured output plus app-level normalization;
  freeform model JSON is not trustworthy enough by itself.
- Local AI is useful for development speed and privacy, but latency and
  deployment posture must be handled explicitly.
- Sprint 1 is now in a verification phase. The next useful work is QA,
  screenshot evidence, and extraction-quality measurement rather than new
  feature scope.
