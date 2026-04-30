# CookbookAI — Codex Context

> Codex-facing entrypoint for this project. The canonical project rules
> still live in `AGENTS.md`, `CLAUDE.md`, and `docs/`.

---

## Read Order

For every meaningful task, read:

1. Domain `AGENTS.md` when working under a domain:
   - `frontend/AGENTS.md`
   - `backend/AGENTS.md`
   - `docs/AGENTS.md`
   - `tests/AGENTS.md`
2. Root `AGENTS.md`
3. `CLAUDE.md`
4. `docs/PRD.md`
5. `docs/ARCHITECTURE.md`
6. `docs/DECISIONS.md`
7. The active sprint folder under `docs/sprints/`

## Role Mapping

These files are Codex adapters for the Claude agent files. Keep the
behavior aligned with the matching `.claude/agents/*.md` file, while
omitting Claude-only frontmatter such as model and tool declarations.

| Project role | Codex file | Use for |
|---|---|---|
| `[CTO]` | `.codex/roles/cto.md` | Architecture, sprint planning, decisions, Good/Bad/Ugly review |
| `[DEV-LEAD]` | `.codex/roles/dev-lead.md` | Coordinating multi-agent sprint implementation and reports |
| `[DEV:frontend]` | `.codex/roles/dev-frontend.md` | Next.js UI, pages, components, hooks, client state |
| `[DEV:backend]` | `.codex/roles/dev-backend.md` | API routes, Prisma, Auth.js, Claude integration |
| `[DEV-QA]` | `.codex/roles/qa.md` | Playwright E2E, screenshots, regression checks |

| Claude source | Codex mirror |
|---|---|
| `.claude/agents/cto.md` | `.codex/roles/cto.md` |
| `.claude/agents/dev-lead.md` | `.codex/roles/dev-lead.md` |
| `.claude/agents/dev-frontend.md` | `.codex/roles/dev-frontend.md` |
| `.claude/agents/dev-backend.md` | `.codex/roles/dev-backend.md` |
| `.claude/agents/qa.md` | `.codex/roles/qa.md` |

## Prompt Starters

Prompt starters live in `.codex/prompts/`. They are not a substitute for
the project constitution; they are short activation prompts for common
workflows.

| Prompt | Use for |
|---|---|
| `.codex/prompts/cto.md` | Activate CTO mode |
| `.codex/prompts/dev.md` | Activate generic dev mode |
| `.codex/prompts/qa.md` | Activate QA mode |
| `.codex/prompts/plan.md` | Force planning before implementation |
| `.codex/prompts/test.md` | Run the configured test suite |
| `.codex/prompts/e2e.md` | Run Playwright E2E checks |

| Claude command | Codex prompt |
|---|---|
| `.claude/commands/cto.md` | `.codex/prompts/cto.md` |
| `.claude/commands/dev.md` | `.codex/prompts/dev.md` |
| `.claude/commands/qa.md` | `.codex/prompts/qa.md` |
| `.claude/commands/plan.md` | `.codex/prompts/plan.md` |
| `.claude/commands/test.md` | `.codex/prompts/test.md` |
| `.claude/commands/e2e.md` | `.codex/prompts/e2e.md` |

## Codex Operating Notes

- Start every response with the active role tag.
- Prefer implementing requested development work directly once the
  requirements are clear.
- Do not edit production code while acting as `[CTO]`; write plans,
  specs, decisions, and reviews instead.
- Do not add dependencies without flagging the decision to the CTO.
- UI/UX work is owned directly by Alice (`[UI/UX]`), not by a
  project-level UI sub-agent.
- Keep changes scoped to the current task and preserve user edits.
- Use `rg` for search, read before writing, and run the relevant tests
  before calling work done.
- For UI changes, run or prepare Playwright checks and save screenshots
  under `tests/screenshots/`.
