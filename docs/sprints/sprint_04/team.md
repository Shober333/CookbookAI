# Sprint 04 — Active Team

**Activated by:** [CTO] — 2026-05-03, after Sprint 03 CTO acceptance

---

| Role | Tag | Agent Files | Owns |
|------|-----|-------------|------|
| Dev Lead | `[DEV-LEAD]` | `.claude/agents/dev-lead.md`, `.codex/roles/dev-lead.md` | Sprint coordination; decision tracking; dev report |
| Backend Dev | `[DEV:backend]` | `.claude/agents/dev-backend.md`, `.codex/roles/dev-backend.md` | YouTube live validation, transcript spike/implementation if approved, provider abstraction if approved |
| Frontend Dev | `[DEV:frontend]` | `.claude/agents/dev-frontend.md`, `.codex/roles/dev-frontend.md` | Small import UX hardening only when backend/QA findings require UI changes |
| QA | `[DEV-QA]` | `.claude/agents/qa.md`, `.codex/roles/qa.md` | Live-key smoke checks, regression verification, screenshots, demo checklist |
| CTO | `[CTO]` | `AGENTS.md` | Founder decisions, provider/trancript scope, Good/Bad/Ugly review |

---

## Coordination Notes

- `[DEV:backend]` starts with evidence gathering before adding new provider or
  transcript code.
- `[DEV-QA]` records whether live YouTube checks ran with a real key or were
  blocked by environment.
- `[DEV:frontend]` stays narrow: fix states discovered by QA, do not redesign
  the import page in this sprint.
- Provider migration and transcript fallback are both decision-gated. The dev
  body should not implement either silently.
