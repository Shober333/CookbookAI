# Sprint 04 — Production Import Hardening

| Field | Value |
|-------|-------|
| **Sprint** | 04 |
| **Goal** | Validate real provider behavior and harden the import path for demo/production use |
| **Status** | Planning started |
| **Start** | 2026-05-03 |
| **End** | TBD |

---

## Scope

1. **Live YouTube validation** — test the Sprint 03 YouTube description-first
   path with a real `YOUTUBE_API_KEY` and at least one real video.
2. **YouTube transcript fallback decision** — decide whether transcript fallback
   belongs in Sprint 04; implement only if the Founder approves the scope.
3. **AI provider/cost decision** — choose whether to keep Claude for Sprint 04
   or introduce a provider abstraction/migration plan to reduce cost.
4. **Production/demo hardening** — reduce demo risk around environment setup,
   auth/session behavior, import failures, and stale local server issues.

---

## Not In Scope Unless Promoted

- Direct video understanding.
- Guest mode persistence.
- Full deployment automation.
- Recipe organization features such as tags management, folders, or full-text
  search.
- Large UI redesign beyond small import/error-state fixes needed for hardening.

---

## Founder Decisions Needed

| Decision | Options | Recommendation |
|----------|---------|----------------|
| Transcript fallback | Defer / spike / implement | Spike first, then decide from evidence |
| Provider migration | Keep Claude / add provider adapter / migrate provider | Add a provider decision doc before code changes |
| Demo target | Local demo / hosted demo | Local demo unless hosting is explicitly needed |

---

## Exit Criteria

- [ ] Live YouTube validation completed or explicitly blocked by missing key.
- [ ] Transcript fallback decision recorded in `docs/DECISIONS.md`.
- [ ] Provider/cost decision recorded in `docs/DECISIONS.md`.
- [ ] Production/demo checklist passes on a clean checkout.
- [ ] All Sprint 04 dev tasks are completed or explicitly deferred.
- [ ] All Sprint 04 QA scenarios pass.
- [ ] CTO Good/Bad/Ugly review completed.

---

## Artifacts

- Team note: `team.md`
- Dev tasks: `todo/dev_todo.md`
- QA scenarios: `todo/qa_todo.md`
- Sprint report: `reports/sprint_04_report.md`
- CTO review: `reviews/cto_sprint4_review.md`
