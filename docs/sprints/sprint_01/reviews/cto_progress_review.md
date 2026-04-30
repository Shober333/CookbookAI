# Sprint 01 — CTO Progress Review

> **Reviewer:** [CTO]  
> **Date:** 2026-05-01  
> **Status:** Dev-functional; QA pending  
> **Review type:** Progress review, not final Good/Bad/Ugly ship approval

---

## Summary

Sprint 1 has reached a usable local MVP shape: a user can register,
import recipes through the configured AI provider, browse a private
library, view details, delete recipes, and scale/convert ingredient
amounts. The main architectural change since Sprint 0 is the Founder
decision to validate AI behavior locally with Ollama models before
committing to a cloud provider.

This is not done by the project Definition of Done. The dev surface is
mostly complete, but QA automation, screenshot evidence, extraction
quality verification, and formal review gates are still outstanding.

---

## Good

- Core Sprint 1 user journey exists end-to-end: auth → import → save →
  library → detail → scale/convert.
- Local AI extraction now works without cloud credentials via
  `AI_PROVIDER=ollama`.
- Recipe import no longer depends on fragile freeform JSON text alone:
  Ollama uses native JSON-schema output, then app-level normalization.
- Non-AI structured-data extraction remains available but is disabled by
  default during current AI validation.
- Recent user-found defects were fixed quickly:
  - stale Next dev processes occupying ports
  - malformed/fenced AI JSON handling
  - post-save redirect using the wrong response shape
  - local Ollama timeout on full webpage text
  - misplaced ingredient quantities in AI output
  - fractional cup display rounding to zero
- Unit tests and typecheck pass after the latest dev changes.

---

## Bad

- Import behavior diverged from the original Sprint 1 acceptance
  criteria. The original task specified Claude + `streamText`; the
  accepted current path is Ollama-first structured extraction with a
  blocking JSON response.
- Local Ollama extraction is slow. Real imports may take roughly a
  minute, and the app now allows up to 120 seconds.
- Extraction quality is still uneven. The app now repairs common
  quantity/unit mistakes, but this needs broader URL coverage before
  trust is warranted.
- The UI still presents a streaming/progress metaphor even though the
  current backend path is not token streaming.
- E2E coverage is still placeholder-only. The Sprint 1 QA checklist has
  not been run.
- Required screenshots have not been captured.
- Sprint reports and final review artifacts remain incomplete.

---

## Ugly

- Sprint 1 cannot ship until QA proves there is no user-data leakage
  across accounts. Auth and owner checks exist in code, but the QA
  checklist still marks those scenarios untested.
- The production AI/deployment posture is unresolved. Ollama is correct
  for local validation, but Vercel deployment cannot assume an always-on
  local Ollama server.
- Equipment adaptation is listed as a Must Have in the PRD, but Sprint 1
  current validated work has focused on recipe import/library/scaling.

---

## Remaining Sprint 1 Work

1. Replace `tests/e2e/example.spec.ts` with real Sprint 1 Playwright
   coverage for auth, import, library, detail, delete, scaler, and unit
   toggle.
2. Run all scenarios in `docs/sprints/sprint_01/todo/qa_todo.md`.
3. Capture required screenshots into `tests/screenshots/`.
4. QA at least 3-5 recipe URLs through Ollama extraction and log any
   amount/unit/step failures.
5. Decide whether the current progress UI is acceptable for non-token
   streaming extraction, or whether Alice should revise the import state
   language.
6. Decide the production AI provider strategy before deploy.
7. Complete `docs/sprints/sprint_01/reports/sprint_01_report.md`.
8. Run final CTO Good/Bad/Ugly review after QA evidence exists.

---

## CTO Assessment

Sprint 1 is past the risky build phase and into verification. The app is
usable locally, but not shippable. The most valuable next work is not
more feature coding; it is QA, extraction-quality measurement, and a
deployment/provider decision.
