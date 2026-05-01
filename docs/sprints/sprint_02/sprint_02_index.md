# Sprint 02 — Equipment Adapter + Library Search

| Field | Value |
|-------|-------|
| **Sprint** | 02 |
| **Goal** | Complete the two remaining PRD Must Haves: equipment adaptation and recipe search |
| **Status** | Planning |
| **Start** | 2026-05-01 |
| **End** | TBD |

---

## Scope

1. **Equipment profile** — store and edit a user's available appliances (`GET/PUT /api/equipment`)
2. **AI adaptation endpoint** — send a recipe + equipment profile to the AI; return rewritten steps (`POST /api/ai/adapt`)
3. **Recipe schema migration** — add `adaptedSteps` column so adapted versions can be saved non-destructively
4. **Equipment settings UI** — page at `/equipment` with an appliance checkbox list and save
5. **Adapt flow on recipe detail** — "Adapt for my kitchen" button, adapted steps panel, save/discard
6. **Library search** — `?q=` query param on `GET /api/recipes`; search input on the library page

---

## Not In Scope This Sprint

- Ingredient substitution (PRD Nice to Have — Sprint 3+)
- Recipe tagging / full-text search beyond title (PRD Nice to Have — Sprint 3+)
- Production deployment (Founder decision pending — no sprint work required once decided)
- Any change to the import flow or serving scaler

---

## Exit Criteria

- [ ] All tasks in `todo/dev_todo.md` completed
- [ ] All scenarios in `todo/qa_todo.md` pass
- [ ] No critical bugs open
- [ ] CTO Good/Bad/Ugly review completed
- [ ] Screenshots captured for new UI: equipment settings, adapt flow, library search

---

## Risks

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Adapt endpoint slow with Ollama (same as import) | High | Medium | Use same 120s timeout; show progress state; cloud model is faster |
| Alice has not spec'd the equipment UI or adapt flow UI | High | Medium | Use a minimal placeholder spec (see dev_todo.md); flag to Alice for review before Sprint 2 ships |
| `adaptedSteps` migration conflicts with existing SQLite data | Low | Low | Nullable column — existing rows default to NULL, no data loss |
| Ollama structured output for adaptation is less reliable than extraction | Medium | Medium | Add Zod validation + normalisation layer identical to recipe extractor |

---

## Artifacts

- Dev tasks: `todo/dev_todo.md`
- QA scenarios: `todo/qa_todo.md`
- Sprint report: `reports/sprint_02_report.md`
- CTO review: `reviews/cto_sprint2_review.md`
