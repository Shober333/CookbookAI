# Sprint 01 — Core Recipe Library

| Field | Value |
|-------|-------|
| **Sprint** | 01 |
| **Goal** | Working app: register, import a recipe from a URL, browse library, scale servings |
| **Status** | Dev-functional; QA pending |
| **Start** | 2026-04-29 |
| **End** | TBD |

---

## Scope

1. Project scaffold — Next.js 15, Prisma + SQLite, Auth.js v5, shadcn/ui
2. User auth — register, login, logout, protected routes
3. Recipe import — URL → configured AI provider (Ollama by default) → structured recipe → save
4. Recipe library — grid view, recipe detail page, delete
5. Serving scaler + unit conversion — client-side, non-destructive

---

## Exit Criteria

- [ ] All tasks in `todo/dev_todo.md` completed
- [ ] All scenarios in `todo/qa_todo.md` pass
- [ ] No critical bugs open
- [ ] CTO Good/Bad/Ugly review completed (`reviews/cto_review.md`)
- [ ] Screenshots captured for all main views

---

## Risks

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Local Ollama extraction is slow | High | Medium | Use focused source excerpts and `OLLAMA_EXTRACTION_TIMEOUT_MS=120000`; QA several real URLs |
| Local Ollama extraction misplaces ingredient quantities/units | High | High | Normalize obvious amount/unit mistakes; QA with varied recipe pages before Sprint 1 acceptance |
| Production AI provider still undecided | Medium | High | Keep provider switch via `AI_PROVIDER`; revisit Anthropic/cloud path before deploy |
| URL fetch blocked by CORS / bot protection | Medium | Medium | Fetch on server-side (API route); add User-Agent header; graceful error message |
| Auth.js v5 rough edges with App Router | Low | Medium | Use official Next.js adapter; pin version |
| SQLite dialect gaps vs. Postgres | Low | Low | Store arrays as comma-separated strings; unit-test the split logic |

---

## Artifacts

- Dev tasks: `todo/dev_todo.md`
- QA scenarios: `todo/qa_todo.md`
- Dev report: `reports/dev_report.md`
- CTO review: `reviews/cto_review.md`
