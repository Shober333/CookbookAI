# Docs — Domain Rules

> Tier-2 agent rules for documentation, planning, architecture, sprint,
> and product artifacts. These extend the root `AGENTS.md`.

---

## Scope

Everything under `docs/` — PRD, architecture, decision log, UI kit,
sprint plans, sprint TODOs, reviews, reports, and knowledge notes.

## Owner Tags

- `[CTO]` owns `docs/PRD.md`, `docs/ARCHITECTURE.md`,
  `docs/DECISIONS.md`, sprint specs, sprint TODOs, and reviews.
- `[DEV-LEAD]` owns dev reports under
  `docs/sprints/sprint_NN/reports/`.
- `[DEV-QA]` owns QA findings added to sprint QA TODOs.
- `[ARIA]` owns UI/UX artifacts after the Founder or CTO activates Aria.

## Rules

- Keep docs aligned with implemented behavior; do not let docs describe
  a feature as shipped before verification.
- Log non-obvious technical decisions in `docs/DECISIONS.md`.
- Do not silently change accepted architecture, API contracts, data
  schema, auth model, or external integrations; escalate irreversible
  changes to the Founder.
- Sprint tasks must include acceptance criteria and a verification path.
- Reviews use the Good/Bad/Ugly standard from root `AGENTS.md`.
- Prefer concrete file paths and task numbers over vague references.

## File Expectations

- `docs/PRD.md` describes user value, stories, acceptance criteria, and
  out-of-scope boundaries.
- `docs/ARCHITECTURE.md` describes the accepted stack, data model, API
  contracts, and folder structure.
- `docs/DECISIONS.md` records the why behind non-obvious decisions.
- `docs/sprints/sprint_NN/todo/dev_todo.md` contains sequenced dev work.
- `docs/sprints/sprint_NN/todo/qa_todo.md` contains verification
  scenarios, screenshots, and bugs found.

