# Sprint 02 — Dev Report

| Field | Value |
|-------|-------|
| **Sprint** | 02 |
| **Goal** | Equipment adapter (profile + AI rewrite) + library search |
| **Status** | Dev complete; QA complete; awaiting CTO review |
| **Dev tasks completed** | 9 / 9 (B1–B5, F1–F4) |
| **QA scenarios completed** | 21 / 21 |
| **Report date** | 2026-05-02 |
| **Branches in flight** | `main` (frontend merged via PR #7); `sprint-02/qa` (E2E + qa_todo) |

---

## Summary

Sprint 2 closes the two remaining PRD must-haves: a persistent kitchen
profile that drives an inline AI-adaptation panel on recipe detail, and a
debounced title search on the library page. Backend delivered the
`/api/equipment` CRUD, the adaptation endpoint, the `adaptedSteps` schema
migration, the `?q=` search param, and a unit-conversion overhaul that
fixes long-form normalisation and adds bidirectional conversion. Frontend
delivered the kitchen settings page, inline `AdaptPanel` (replacing the
deprecated standalone `/recipes/[id]/adapt` route), the search input, the
`Adapted` library tag, and Markdown export.

---

## Tasks Completed

Backend (Phase 1):

- [x] **B1** Equipment profile API — `GET / PUT /api/equipment` with Zod-validated 8-key schema; unknown keys silently stripped.
- [x] **B2** `adaptedSteps` migration — nullable JSON-string column on `Recipe`; PATCH endpoint accepts the field.
- [x] **B3** AI adaptation endpoint — `POST /api/ai/adapt` with auth + ownership checks, Zod-validated `{ adaptedSteps, notes }` response, Ollama and Anthropic provider paths.
- [x] **B4** Library search — `?q=` on `GET /api/recipes`, parameterised Prisma `contains`, blank/missing query returns full list.
- [x] **B5** Unit conversion overhaul — long-form normalisation (`grams → g`, `pounds → lb`, etc.) at extraction time; bidirectional conversion (`oz → g`, `lb → kg`, `fl oz → ml`, `qt → l`); cups / tbsp / tsp → ml in metric mode.

Frontend (Phase 2):

- [x] **F1** Kitchen settings page — `/equipment` with EquipmentChip 3-col grid in the locked Sprint 2 order, save state with relative-time confirmation, GET/PUT error handling, mobile full-width save, "Equipment" → "Kitchen" topbar rename.
- [x] **F2** Inline AdaptPanel — five states (idle / no-equipment / loading / result / saved / error) wired into RecipeDetail after Method; terracotta `Adapted` tag added to RecipeListItem; deprecated standalone route reference removed.
- [x] **F3** Library search input — debounced 300ms input with magnifying-glass icon, `?q=` URL state via `router.replace`, Esc-to-clear, dimmed grid while fetching, distinct empty-search state, Suspense boundary for `useSearchParams`.
- [x] **F4** Markdown download — `recipeToMarkdown` + `slugify` helpers; "Download .md" button next to delete; exports the version the user is currently viewing per the Founder rule (`-adapted` filename suffix when applicable).

---

## Tasks Deferred

None. Every task scoped in `todo/dev_todo.md` shipped in this sprint.

Items explicitly out of scope per `sprint_02_index.md` (ingredient
substitution, full-text search beyond title, production deployment, any
import / scaler change) remain out of scope and untouched.

---

## Blockers Encountered

- **Next 15 `useSearchParams` Suspense requirement.** First production
  build of F3 failed prerendering `/library` because App Router requires
  a Suspense boundary around `useSearchParams`. Resolved by splitting the
  page into a `LibraryPage` (Suspense barrier) + `LibraryBody`. No design
  impact; client behaviour unchanged.
- **Stale `/recipes/[id]/adapt` reference.** Sprint 0/1 left a
  `router.push("/recipes/[id]/adapt")` in `RecipeDetail.tsx`, but the
  page directory was never created. Spec said "delete the directory" —
  there was nothing to delete, so the dead push was simply removed. No
  redirect needed.
- **No real-provider exercise of `/api/ai/adapt`.** E2E mocks the route
  via `page.route()` (no Ollama dep in CI). Production validation against
  Ollama / Anthropic remains a manual gate, same posture as Sprint 1's
  import endpoint.

No blockers escalated to the CTO; all resolved within the sprint.

---

## Known Issues

- **Auth-error log noise.** Sprint 1's auth Playwright case intentionally
  exercises a wrong-password path, so Auth.js logs
  `[auth][error] CredentialsSignin` to the WebServer log on every
  Playwright run. Expected behaviour, not a regression — flagging so
  someone scanning CI logs doesn't mis-read it as a flake.
- **Relative-time confirmation has no soak test.** The kitchen settings
  page transitions from "Saved." to "Last saved N minutes ago" on a 15s
  tick. The pure formatter is covered by inference (assertions on the
  immediate `Saved.` state); a multi-minute timed test would be
  over-spec for MVP.
- **Sprint 0 docs drift.** `PAGE_LAYOUTS.md` §5 still describes the
  pre-Sprint-2 standalone Equipment Adapter page and the old "Wok / Sous
  vide" appliance list. `SPRINT_02_SPECS.md` §8 calls these updates out
  for a housekeeping commit; not landed in this sprint.

No production-affecting bugs found. None opened in `qa_todo.md`.

---

## Test & Build Status

- `npm run typecheck` — clean.
- `npm test` (Vitest) — **77 / 77** across 6 files. 12 new cases covering `slugify` and `recipeToMarkdown`; existing `convertUnit` / `roundScaled` cases extended for B5.
- `npx playwright test` (Chromium) — **15 / 15**: Sprint 1 (4) + new `tests/e2e/sprint2.spec.ts` (11) covering E1–E5, A1–A6, S1–S4, F4 download, screenshot capture.
- `npm run build` (Next 15 production build) — clean; no prerender errors.

Screenshots captured to `tests/screenshots/`: `equipment-empty.png`,
`equipment-saved.png`, `recipe-adapt-loading.png`, `recipe-adapted.png`,
`recipe-adapted-saved.png`, `library-search.png`. Note these are
gitignored as transient test output (per `tests/AGENTS.md`).

---

## Key Decisions

Implementation followed the Founder decisions logged in
`SPRINT_02_SPECS.md` §6 verbatim. No new decisions were taken during
implementation. For the record:

1. Markdown export uses the version currently being viewed (original or adapted), with a `-adapted` filename suffix.
2. UI copy locks "Kitchen"; route stays `/equipment`.
3. `Adapted` library tag derives from `recipe.adaptedSteps !== null`, no separate flag.
4. Re-adapt overwrites the saved adaptation without confirmation.
5. AdaptDiff component remains deprecated; spec retained on disk for post-MVP.

---

## How to Verify

Commands (from project root):

```bash
npm run typecheck
npm test
npm run build
npx playwright test
npm run dev   # then exercise the flows below
```

Manual flows on `localhost:3000`:

1. **Kitchen settings.** Log in → `/equipment`. Toggle chips, save,
   watch "Saved." → "Last saved 1 minute ago" after a tick. Empty
   selection disables save and shows the italic hint.
2. **Inline adapt.** Open a saved recipe. With no kitchen, the Adapt
   button is disabled and shows "Set up your kitchen →". With a saved
   kitchen: click Adapt → loading pulse → Result panel → Save this
   version → Saved (collapsed). Toggle "Show adapted version", click
   "Re-adapt" to overwrite without confirm, "Discard" requires confirm.
3. **Library search.** `/library` → type a term (e.g. `pasta`); URL
   becomes `/library?q=pasta`; refresh keeps the term; Esc clears; "No
   recipes matching '…'" with a Clear button when nothing matches; grid
   dims while fetching.
4. **Markdown download.** On recipe detail, "Download .md" produces
   `<slug>.md` for the original. With a saved adapted version expanded,
   the same button produces `<slug>-adapted.md` whose title carries the
   `(adapted for your kitchen)` suffix.

---

## Recommendation

**Ready for CTO Good/Bad/Ugly review.** Scope landed in full, QA is
green, no critical or production-blocking issues open. Suggested
follow-up after this sprint:

- Merge `sprint-02/qa` into main once the report is signed off (no
  source code change, only the Sprint 2 E2E spec + QA evidence).
- Schedule a housekeeping commit to clear the `SPRINT_02_SPECS.md` §8
  doc-drift checklist (`PAGE_LAYOUTS.md`, `STATES.md`, `COMPONENT_SPECS.md`).
- Manual real-provider exercise of `/api/ai/adapt` before any
  production deploy decision.
