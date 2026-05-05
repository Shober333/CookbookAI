# Sprint 06 — Active Team

**Activated by:** [CTO] — 2026-05-05, after Sprint 05 closeout

---

| Role | Tag | Agent Files | Owns |
|------|-----|-------------|------|
| Dev Lead | `[DEV-LEAD]` | `.claude/agents/dev-lead.md`, `.codex/roles/dev-lead.md` | Sprint coordination, schema/source contract tracking, Browserbase boundary tracking, dev report |
| Backend Dev | `[DEV:backend]` | `.claude/agents/dev-backend.md`, `.codex/roles/dev-backend.md` | Source metadata schema, import response contract, migrations, YouTube import persistence, Browserbase fallback adapter |
| Frontend Dev | `[DEV:frontend]` | `.claude/agents/dev-frontend.md`, `.codex/roles/dev-frontend.md` | Recipe detail YouTube embed, source labels/states, UI regression fixes |
| UI/UX | `[UI/UX]` | `.claude/agents/uiux.md`, `.codex/roles/uiux.md` | Embed placement, source-label copy, mobile/a11y review if UI changes need clarification |
| QA | `[DEV-QA]` | `.claude/agents/qa.md`, `.codex/roles/qa.md` | Local regression, deployed YouTube smoke, screenshots for recipe detail embed |
| CTO | `[CTO]` | `AGENTS.md` | Scope, source contract review, schema risk review, Good/Bad/Ugly review |

---

## Coordination Notes

- `[DEV:backend]` starts with the data contract before implementation.
- Because Sprint 05 introduced dual Prisma schemas, every schema change must
  update both `prisma/` and `prisma-postgres/`.
- `[DEV:frontend]` should not invent source-label copy. Use existing
  `docs/ui/` voice or ask `[UI/UX]`.
- `[DEV-QA]` needs stable YouTube demo URLs and one public blocked/JS-heavy
  recipe URL before deployed smoke starts.
- Browserbase is for public recipe pages only. Do not use it for paywalls,
  login walls, CAPTCHA bypass, or private content.
