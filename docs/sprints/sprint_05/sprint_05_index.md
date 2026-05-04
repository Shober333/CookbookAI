# Sprint 05 — Vercel Demo Deployment Readiness

| Field | Value |
|-------|-------|
| **Sprint** | 05 |
| **Goal** | Make CookbookAI deployable and demoable on Vercel with documented production environment setup, smoke checks, and rollback notes |
| **Status** | Local deployment preflight passed; deployed smoke pending Vercel/Neon handoff |
| **Start** | 2026-05-04 |
| **End** | TBD |

---

## Scope

1. **Production environment contract** — lock the required Vercel env vars for
   Auth.js, database, Gemini, YouTube, and optional fallback providers.
2. **Database deployment path** — choose and document the production database
   target and migration workflow.
3. **Vercel deployment setup** — prepare the app for preview/production deploys
   without relying on local-only assumptions.
4. **Smoke-test checklist** — verify auth, import, library, recipe detail,
   Gemini extraction, and YouTube paths against the deployed app.
5. **Rollback and demo notes** — document what to do when a deploy, provider,
   database, or quota issue appears during a demo.

---

## Not In Scope Unless Promoted

- Guest mode.
- Direct Gemini video understanding.
- Paid tiers, billing, or subscription management.
- Full observability stack.
- Multi-region production operations.
- Large UI redesign.
- New recipe organization features.

---

## Founder Decisions

| Decision | Approved direction |
|----------|--------------------|
| Deployment target | Vercel preview first, then production if smoke passes |
| Production database | Managed Postgres path; Neon remains the documented default unless dev finds a Vercel-native blocker or better fit |
| Production AI provider | Gemini 2.5 Flash remains default |
| Demo posture | Authenticated demo account; no guest mode in Sprint 05 |

---

## Exit Criteria

- [x] Founder confirms Sprint 05 deployment scope.
- [x] Production env var checklist is documented.
- [x] Database target and migration workflow are documented.
- [x] Vercel build succeeds locally with production-like env assumptions.
- [~] Deployed auth flow works.
- [~] Deployed Gemini text import works.
- [~] Deployed YouTube link/description/no-recipe paths are smoke-tested or
      explicitly blocked by provider quota/key limits.
- [x] Rollback/demo recovery notes are written.
- [x] QA report completed.
- [ ] CTO Good/Bad/Ugly review completed.

---

## Artifacts

- Team note: `team.md`
- Dev tasks: `todo/dev_todo.md`
- QA scenarios: `todo/qa_todo.md`
- Sprint report: `reports/sprint_05_report.md`
- QA report: `reports/qa_report.md`
- CTO review: `reviews/cto_sprint5_review.md`

---

## Next-Sprint Candidates

These ideas are valid, but they are deliberately kept out of Sprint 05 so
deployment readiness does not sprawl:

- Recipe macros: protein, fat, carbs, and calories with clear "estimated"
  labeling and a real nutrition data source.
- Direct Gemini video understanding fallback for YouTube videos with no
  transcript, recipe link, or recipe-like description.
- Browserbase import-resilience spike for public JavaScript-heavy or
  bot-blocked recipe pages; not for paywalls, logins, or access-control
  bypass.
- YouTube embeds on recipes imported from YouTube, after the data model
  cleanly stores original video URL separately from resolved recipe URL.
