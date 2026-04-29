# CookbookAI — Claude Code Project Context

> **Stack:** TBD — CTO decides in Sprint 0 (see `docs/ARCHITECTURE.md`)
> **Purpose:** Digital cookbook: import recipes from the internet, adjust
> them with AI assistance.
>
> This file is auto-loaded by Claude Code on every session. Keep it
> under ~200 lines. Role definitions live in `AGENTS.md`, not here.

---

## 1. Project Identity

| Field | Value |
|---|---|
| **Name** | CookbookAI |
| **Repo name** | `CookbookAI` |
| **Purpose** | Import recipes from the web; adjust them with Claude AI |
| **Stage** | Sprint 0 — architecture and team definition |
| **Dev port** | TBD |

---

## 2. Key Commands

> Stack not yet decided. CTO fills these in after Sprint 0 architecture decision.

```bash
# Replace with actual commands after stack is chosen:
[TBD] dev        # Start dev server
[TBD] build      # Production build
[TBD] test       # Run unit tests
[TBD] lint       # Lint / type check

# E2E Testing (Playwright — stack-independent)
npx playwright test              # Run all E2E tests
npx playwright test --ui         # Interactive mode
npx playwright test --debug      # Step-through debug
```

---

## 3. Definition of Done

A feature is "done" only when:

1. **Code works** — dev server runs without errors
2. **Unit tests pass** — test suite green; new logic has tests
3. **E2E passes** — Playwright green when UI changed
4. **No regressions** — existing features still work
5. **Reviewed** — CTO Good/Bad/Ugly review completed (see `AGENTS.md`)
6. **Screenshots** — captured for any GUI change (`tests/screenshots/`)

**"It compiles" is not done.** Behavior must be verified.

---

## 4. Agents in This Project

Role definitions live in `AGENTS.md`. Short index:

| Tag | Role | Activate |
|---|---|---|
| `[CTO]` | Architecture, planning, reviews; owns PRD/ARCHITECTURE/DECISIONS | `/project:cto` or Claude Code subagent `cto` |
| `[DEV-LEAD]` | Coordinates dev body; writes dev reports | ad-hoc (multi-dev sprints) |
| `[DEV:frontend]` | Frontend implementation | `/project:dev` |
| `[DEV:backend]` | Backend: recipe import, storage, Claude API integration | `/project:dev` |
| `[DEV-QA]` | Tests, regressions, screenshots | `/project:qa` |
| `[ARIA]` | UI/UX — created by Alice (Meta-UI/UX) when needed | not yet instantiated |
| `[FOUNDER]` | Human — final decision maker | always |

**Governance:** `[CTO]` reviewable by Meta-CTO at
`~/Projects/agents/claude/CLAUDE.md`. `[ARIA]` reviewable by Alice at
`~/Projects/agents/alice/ALICE.md`.

**Reading order in a turn:** domain `AGENTS.md` (e.g.
`frontend/AGENTS.md`) → root `AGENTS.md` → this file → `docs/PRD.md`.

---

## 5. Project Structure

```
CookbookAI/
├── CLAUDE.md                # This file
├── AGENTS.md                # Role definitions and team
├── README.md                # Project README
├── .env.example             # Env vars template (ANTHROPIC_API_KEY)
├── playwright.config.ts     # E2E configuration
│
├── .claude/
│   ├── agents/cto.md        # Claude Code CTO subagent
│   ├── commands/            # Slash commands
│   └── settings.local.json  # Tool permissions
│
├── frontend/
│   ├── AGENTS.md            # Frontend domain rules
│   └── modules/
│       └── _example/        # Reference module
│
├── backend/
│   ├── AGENTS.md            # Backend domain rules
│   └── modules/
│       └── _example/        # Reference module
│
├── tests/
│   ├── e2e/                 # Playwright E2E tests
│   └── screenshots/         # Captured by E2E
│
└── docs/
    ├── PRD.md               # Product requirements (CTO-owned)
    ├── ARCHITECTURE.md      # Technical design (CTO-owned)
    ├── DECISIONS.md         # Decision log (CTO-owned)
    ├── knowledge/           # Domain research and references
    ├── ui/UI_KIT.md         # Design tokens (Aria / Alice-owned)
    └── sprints/sprint_01/   # Sprint artifacts
```

---

## 6. Environment Variables

Copy `.env.example` → `.env`:

```
ANTHROPIC_API_KEY=sk-ant-...    # Claude API — required for recipe adjustment
```

---

## 7. Available Slash Commands

| Command | Purpose |
|---|---|
| `/project:cto` | Architecture, planning, code review |
| `/project:dev` | Implementation, features, bug fixes |
| `/project:qa` | Testing, quality gates |
| `/project:plan` | Force planning before complex work |
| `/project:test` | Run test suite |
| `/project:e2e` | Run Playwright E2E tests |

---

## 8. Testing Strategy

| Level | Location | Tool | When |
|---|---|---|---|
| Unit | `*/modules/*/tests/unit/` | TBD (stack-dependent) | Every feature |
| Integration | `*/modules/*/tests/integration/` | TBD | Cross-module features |
| E2E | `tests/e2e/` | Playwright | Every UI-affecting change |
| Screenshots | `tests/screenshots/` | Playwright | Every UI-affecting change |

---

## 9. What NOT to Do

- Don't silently expand scope
- Don't add dependencies without flagging to the CTO
- Don't mark features done without running tests
- Don't skip tests for new logic
- Don't hardcode secrets or credentials
- Don't import across modules — use the module's public `index.*` exports
- Don't change external API integrations without an irreversibility-flag escalation
