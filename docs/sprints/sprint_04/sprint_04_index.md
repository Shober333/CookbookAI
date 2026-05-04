# Sprint 04 — Production Import Hardening

| Field | Value |
|-------|-------|
| **Sprint** | 04 |
| **Goal** | Move production extraction to Gemini 2.5 Flash, add YouTube transcript fallback, and harden the import path for demo/production use |
| **Status** | CTO accepted; ready for Founder closeout |
| **Start** | 2026-05-03 |
| **End** | 2026-05-04 |

---

## Scope

1. **Live YouTube validation** — test the Sprint 03 YouTube description-first
   path with a real `YOUTUBE_API_KEY` and at least one real video.
2. **YouTube transcript fallback** — add transcript fallback after
   description-first YouTube import fails.
3. **Gemini 2.5 Flash provider path** — move Sprint 04 production extraction
   from Claude to Gemini 2.5 Flash behind a neutral provider boundary.
4. **Production/demo hardening** — reduce demo risk around environment setup,
   auth/session behavior, import failures, and stale local server issues.

---

## Not In Scope Unless Promoted

- Direct video understanding.
- Claude as the Sprint 04 production default.
- Guest mode persistence.
- Full deployment automation.
- Recipe organization features such as tags management, folders, or full-text
  search.
- Large UI redesign beyond small import/error-state fixes needed for hardening.

---

## Founder Decisions Resolved

| Decision | Options | Recommendation |
|----------|---------|----------------|
| Transcript fallback | Defer / spike / implement | **Implement in Sprint 04** |
| Provider migration | Keep Claude / add provider adapter / migrate provider | **Use Gemini 2.5 Flash for Sprint 04** |
| Demo target | Local demo / hosted demo | Local demo unless hosting is explicitly needed |

---

## Exit Criteria

- [x] Live YouTube validation completed or explicitly blocked by missing key.
- [x] Transcript fallback decision recorded in `docs/DECISIONS.md`.
- [x] Provider/cost decision recorded in `docs/DECISIONS.md`.
- [x] Production/demo checklist passes on a clean checkout.
- [x] All Sprint 04 dev tasks are completed or explicitly deferred.
- [x] All Sprint 04 QA scenarios pass.
- [x] CTO Good/Bad/Ugly review completed.

---

## Artifacts

- Team note: `team.md`
- Dev tasks: `todo/dev_todo.md`
- QA scenarios: `todo/qa_todo.md`
- Sprint report: `reports/sprint_04_report.md`
- QA report: `reports/qa_report.md`
- CTO review: `reviews/cto_sprint4_review.md`
