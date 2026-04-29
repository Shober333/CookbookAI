# Sprint 01 — Core Recipe Library

| Field | Value |
|-------|-------|
| **Sprint** | 01 |
| **Goal** | Working app: register, import a recipe from a URL, browse library, scale servings |
| **Status** | Planning |
| **Start** | 2026-04-29 |
| **End** | TBD |

---

## Scope

1. Project scaffold — Next.js 15, Prisma + SQLite, Auth.js v5, shadcn/ui
2. User auth — register, login, logout, protected routes
3. Recipe import — URL → Claude (streaming) → structured recipe → save
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
| Claude response exceeds Vercel 10s function limit | Medium | High | Use Vercel AI SDK `streamText` — streaming keeps connection alive |
| URL fetch blocked by CORS / bot protection | Medium | Medium | Fetch on server-side (API route); add User-Agent header; graceful error message |
| Auth.js v5 rough edges with App Router | Low | Medium | Use official Next.js adapter; pin version |
| SQLite dialect gaps vs. Postgres | Low | Low | Store arrays as comma-separated strings; unit-test the split logic |

---

## Artifacts

- Dev tasks: `todo/dev_todo.md`
- QA scenarios: `todo/qa_todo.md`
- Dev report: `reports/dev_report.md`
- CTO review: `reviews/cto_review.md`
