# Sprint 05 — Active Team

**Activated by:** [CTO] — 2026-05-04, after Sprint 04 closeout
**Founder approval:** 2026-05-04 — Sprint 05 deployment/demo readiness plan green-lit

---

| Role | Tag | Agent Files | Owns |
|------|-----|-------------|------|
| Dev Lead | `[DEV-LEAD]` | `.claude/agents/dev-lead.md`, `.codex/roles/dev-lead.md` | Sprint coordination, deployment decision tracking, dev report |
| Backend Dev | `[DEV:backend]` | `.claude/agents/dev-backend.md`, `.codex/roles/dev-backend.md` | Env/database/deploy readiness, server/API fixes, provider failure hardening |
| Frontend Dev | `[DEV:frontend]` | `.claude/agents/dev-frontend.md`, `.codex/roles/dev-frontend.md` | Small deployed-demo UX fixes only if QA finds user-facing issues |
| QA | `[DEV-QA]` | `.claude/agents/qa.md`, `.codex/roles/qa.md` | Vercel smoke checks, screenshots, regression verification, demo checklist |
| CTO | `[CTO]` | `AGENTS.md` | Scope, database/deployment decisions, Good/Bad/Ugly review |

---

## Coordination Notes

- `[DEV:backend]` starts with the deployment/environment contract before
  touching code.
- `[DEV-QA]` prepares a deployed-app smoke checklist while backend finishes
  setup.
- `[DEV:frontend]` stays narrow: fix deployed UX problems only when QA finds
  them.
- Any production database change, auth-domain change, or new provider default
  must be recorded in `docs/DECISIONS.md`.
- Demo posture is authenticated-user only. Email verification and guest mode
  are not part of Sprint 05.
