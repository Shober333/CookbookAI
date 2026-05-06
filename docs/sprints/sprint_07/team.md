# Sprint 07 - Active Team

**Activated by:** [CTO] - planned 2026-05-06, pending Founder start approval

---

| Role | Tag | Agent Files | Owns |
|------|-----|-------------|------|
| Dev Lead | `[DEV-LEAD]` | `.claude/agents/dev-lead.md`, `.codex/roles/dev-lead.md` | Sprint coordination, provider/nutrition contract tracking, dev report |
| Backend Dev | `[DEV:backend]` | `.claude/agents/dev-backend.md`, `.codex/roles/dev-backend.md` | Nutrition schema/service, USDA integration, Groq provider branch, direct video fallback route/service work |
| Frontend Dev | `[DEV:frontend]` | `.claude/agents/dev-frontend.md`, `.codex/roles/dev-frontend.md` | Recipe detail nutrition UI, import option states/copy integration, frontend regressions |
| UI/UX | `[UI/UX]` | `.claude/agents/uiux.md`, `.codex/roles/uiux.md` | Nutrition presentation, uncertainty copy, video fallback option/state review |
| QA | `[DEV-QA]` | `.claude/agents/qa.md`, `.codex/roles/qa.md` | Unit/E2E coverage, provider smoke, nutrition edge cases, screenshots |
| CTO | `[CTO]` | `AGENTS.md` | Scope, irreversible/schema decision review, provider decision review, Good/Bad/Ugly review |

---

## Coordination Notes

- `[DEV:backend]` starts with data/provider contracts before implementation.
- Because the project still has dual Prisma schemas, every nutrition schema
  change must update both `prisma/` and `prisma-postgres/`.
- `[UI/UX]` must approve nutrition copy before `[DEV:frontend]` implements it;
  nutrition estimates are sensitive and must not read like medical advice.
- `[DEV:backend]` must not use AI as the source of truth for macro values.
  AI may help normalize ingredients, but USDA FoodData Central is the nutrition
  source where data is available.
- Groq GPT-OSS is text-only. Direct video fallback must use a video-capable
  provider, recommended as Gemini for Sprint 07.
- `[DEV-QA]` needs a stable recipe set with simple, medium, and ambiguous
  ingredients before macro QA starts.
