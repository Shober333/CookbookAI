# Sprint 03 — Import Resilience + Cost Control

| Field | Value |
|-------|-------|
| **Sprint** | 03 |
| **Goal** | Make importing more reliable and cheaper before production-provider work |
| **Status** | CTO accepted for Founder review |
| **Start** | 2026-05-02 |
| **End** | TBD |

---

## Scope

1. **PRD accounting cleanup** — resolve the text/paste Must Have mismatch from the Sprint 02 CTO review.
2. **Text/paste import fallback** — let users paste raw recipe text or HTML when URL import is blocked or inconvenient.
3. **URL deduplication before AI calls** — reuse already-extracted recipe data for duplicate source URLs and create a per-user copy without paying for another AI extraction.
4. **YouTube description-first import** — detect YouTube URLs, inspect the description, and route either to a linked recipe URL or pasted-description extraction before considering transcript/video paths.
5. **Provider planning only** — keep Gemini/OpenAI/Groq as documented options; do not migrate production AI provider in this sprint.

---

## Not In Scope This Sprint

- Full Gemini provider implementation or production provider migration.
- Guest mode account/session persistence.
- YouTube transcript fallback.
- Gemini direct video processing.
- Ingredient substitution.
- Full-text search, tags management, or recipe organization beyond duplicate URL reuse.
- Production deployment.

---

## Exit Criteria

- [x] Founder approves Sprint 03 scope.
- [x] All tasks in `todo/dev_todo.md` completed or explicitly deferred.
- [x] All scenarios in `todo/qa_todo.md` pass.
- [x] No critical bugs open.
- [x] CTO Good/Bad/Ugly review completed.
- [x] `[UI/UX]` review completed for import-form changes.
- [x] Screenshots captured for UI changes: text/paste import, URL duplicate reuse feedback, YouTube description import states.

---

## Founder-Approved Scope Notes

1. **Text/paste import UX.** Add a second import mode on `/import` rather than a separate page.
2. **YouTube scope.** Description-first only: external recipe URL and recipe-like description text. Transcript fallback is deferred.
3. **Deduplication behavior.** Reuse a prior extraction across users but create an independent recipe row for the current user.
4. **Provider direction.** No Gemini integration in Sprint 03. Keep the sprint focused on functionality and reducing avoidable AI calls.
5. **Guest mode.** Deferred unless explicitly promoted later.

---

## Risks

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Text/paste fallback complicates import form states | Medium | Medium | `[UI/UX]` specs the mode switch, empty/loading/error copy, and mobile behavior before frontend implementation. |
| Deduplication may copy stale or low-quality old extractions | Medium | Medium | Preserve per-user independent copy; add visible source metadata and keep delete/edit behavior unchanged. |
| YouTube descriptions contain multiple unrelated links | High | Medium | Filter social/video domains; choose the first recipe-like external URL; fall back to description text only if it passes recipe pre-screen. |
| YouTube Data API key setup blocks QA | Medium | Medium | Unit-test parsing helpers; E2E mocks YouTube metadata route; manual live-key check is a separate QA note. |
| Provider decision remains unresolved | Medium | Low | Sprint reduces paid calls regardless of provider; keep provider migration as separate Founder decision. |

---

## Artifacts

- Team note: `team.md`
- Dev tasks: `todo/dev_todo.md`
- QA scenarios: `todo/qa_todo.md`
- Sprint report: `reports/sprint_03_report.md`
- CTO review: `reviews/cto_sprint3_review.md`
- UI/UX review: `reviews/uiux_review.md`
