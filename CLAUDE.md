# CookbookAI — Claude Code Project Context

> **Stack:** Next.js 15 + React 19 + TypeScript + Tailwind CSS
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
| **Stage** | Sprint 1 — scaffold and MVP implementation |
| **Dev port** | 3000 |

---

## 2. Key Commands

```bash
npm run dev        # Start dev server at localhost:3000
npm run build      # Production build
npm run typecheck  # TypeScript check
npm run db:migrate # Create local SQLite file if needed; apply Prisma migrations

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
5. **Reviewed** — CTO Good/Bad/Ugly review completed (see `AGENTS.md`).
   For UI changes: Alice's design review is a second gate.
6. **Screenshots** — captured for any GUI change (`tests/screenshots/`)
7. **UI compliance** (for UI changes) — tokens used, no hardcoded
   values, all states (empty/loading/error) implemented, mobile (375px)
   verified, `prefers-reduced-motion` respected, 44×44px tap targets

**"It compiles" is not done.** Behavior must be verified.

---

## 4. Agents in This Project

Role definitions live in `AGENTS.md`. Short index:

| Tag | Role | Activate |
|---|---|---|
| `[CTO]` | Architecture, planning, reviews; owns PRD/ARCHITECTURE/DECISIONS | `/project:cto` or Claude Code subagent `cto` |
| `[UI/UX]` | Alice — design language, kit, component specs, page layouts, states. Portfolio-wide role. | Founder addresses Alice directly via Claude Desktop |
| `[DEV-LEAD]` | Coordinates dev body; writes dev reports | ad-hoc (multi-dev sprints) |
| `[DEV:frontend]` | Frontend implementation; implements Alice's specs | `/project:dev` |
| `[DEV:backend]` | Backend: recipe import, storage, Claude API integration | `/project:dev` |
| `[DEV-QA]` | Tests, regressions, screenshots | `/project:qa` |
| `[FOUNDER]` | Human — final decision maker | always |

**Governance:** `[CTO]` reviewable by Meta-CTO at
`~/Projects/agents/claude/CLAUDE.md`. UI/UX is owned directly by
Alice (`~/Projects/agents/alice/ALICE.md`) — no project-level UI/UX
sub-agent.

**Reading order in a turn:** domain `AGENTS.md` (e.g.
`frontend/AGENTS.md`) → root `AGENTS.md` → this file → `docs/PRD.md`.
For UI tasks, additionally read `docs/ui/REGISTER.md`, `UI_KIT.md`,
`COMPONENT_SPECS.md`, `PAGE_LAYOUTS.md`, `STATES.md`.

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
├── .codex/
│   ├── README.md            # Codex entrypoint and read order
│   ├── roles/               # Codex role prompts mapped to .claude/agents
│   └── prompts/             # Codex workflow prompts mapped to .claude/commands
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
│   ├── AGENTS.md            # Test domain rules
│   ├── e2e/                 # Playwright E2E tests
│   └── screenshots/         # Captured by E2E
│
└── docs/
    ├── AGENTS.md            # Docs domain rules
    ├── PRD.md               # Product requirements (CTO-owned)
    ├── ARCHITECTURE.md      # Technical design (CTO-owned)
    ├── DECISIONS.md         # Decision log (CTO-owned)
    ├── knowledge/           # Domain research and references
    ├── ui/                  # Design system (Alice-owned)
    │   ├── REGISTER.md      # Design language: the why
    │   ├── UI_KIT.md        # Tokens: colors, type, spacing, motion
    │   ├── COMPONENT_SPECS.md  # The 8 components
    │   ├── PAGE_LAYOUTS.md  # Page composition + responsive
    │   └── STATES.md        # Empty / loading / error states
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

Codex equivalents live in `.codex/prompts/`, with role-specific
instructions in `.codex/roles/`. Those files mirror the corresponding
Claude command and agent files while deferring to `AGENTS.md`.

UI/UX is not a slash command — Alice operates portfolio-wide through
Claude Desktop, not as a project-level Claude Code subagent.

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
- Don't hardcode hex colors, fonts, or spacing in TSX — every value
  traces to `docs/ui/UI_KIT.md`
- Don't invent UI copy, error messages, or design tokens — ask Alice
- Don't change external API integrations without an irreversibility-flag escalation
