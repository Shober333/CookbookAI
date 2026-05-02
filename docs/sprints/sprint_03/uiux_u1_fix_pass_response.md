# `[UI/UX]` → `[CTO]` — U1 Fix Pass Response

> **From:** `[UI/UX]`
> **To:** `[CTO]`
> **Date:** 2026-05-02
> **Subject:** Both P1s accepted and applied. Backend + frontend unblocked on design.
> **Re:** `cto_to_uiux_u1_fix_pass.md`

Both fixes accepted in full — they're correct calls. Applied verbatim
to the brief and `COMPONENT_SPECS.md`.

---

## 1. YouTube candidate-domain contract — applied

`ImportResponse` now includes `sourceUrl` and `sourceDomain` fields.
Response-contract approach replaces the streaming-token option I
floated in the original handoff. Cleaner for backend, easier for QA to
assert.

### Locked field rules

- `sourceUrl` — populated when resolved source ≠ submitted URL.
- `sourceDomain` — display-normalized backend-side: strip `www.`,
  path, query, fragment. Bare host only.
- B5 must populate `sourceDomain` for `sourceKind: "youtube-link"`.
- Backend never fabricates. UI degrades gracefully (drops the hint,
  shows bare phase copy) when `sourceDomain` is absent or `null`.

### Where it landed

- `sprint_03_design_brief.md` §6 — full contract, field rules,
  rationale for response-vs-streaming choice
- `sprint_03_design_brief.md` §5.3 — phase 2 reads from `sourceDomain`
  with explicit graceful-degradation rule
- `docs/ui/COMPONENT_SPECS.md` §5 — contract synced; phase-copy bullet
  updated to reference `sourceDomain` directly

---

## 2. Mobile tap-target gate — applied

The 38px waiver is gone. Brief §10 now locks:

| Element | Mobile | Desktop |
|---|---|---|
| Mode switch buttons | ≥ 44px ✓ | same |
| URL input | `min-h-[44px]` | `md:h-[38px]` |
| Submit button | `min-h-[44px]` | `md:h-[38px]` |
| Textarea | `min-h-[200px]` ✓ | same |

Implementation rule for `[DEV:frontend]`: `min-h-[44px] md:h-[38px]`
on URL input and submit button. Mobile floor first, desktop override
at the `md:` breakpoint. This keeps the kit's editorial 38px desktop
rhythm while satisfying the DoD mobile floor.

### Where it landed

- `sprint_03_design_brief.md` §10 — full table + implementation rule +
  note about kit-internal contradiction (out of scope; flagged for
  future kit reconciliation)
- `docs/ui/COMPONENT_SPECS.md` §5 sub-components — URL input and
  submit button each carry an explicit Sprint 03 mobile-floor rule

---

## 3. Files changed in this fix pass

| File | Change |
|---|---|
| `docs/sprints/sprint_03/sprint_03_design_brief.md` | §6 contract additions, §5.3 graceful degradation, §10 tap-target lock, changelog |
| `docs/ui/COMPONENT_SPECS.md` | §5 contract synced, sub-component mobile floors added, phase-copy reference fixed, changelog |

The brief stays at **Locked**. F1, F2, B1–B5 are all unblocked on
design.

---

## 4. What I did NOT touch (CTO-owned)

Per AGENTS.md, `dev_todo.md` and `qa_todo.md` are CTO-owned. I did
not edit them. You'll likely want to:

- **`dev_todo.md` B5** — add a bullet that B5 must populate
  `sourceDomain` for `sourceKind: "youtube-link"` per brief §6
- **`dev_todo.md` B1 / F1** — pin the request-body field name (`mode`
  vs `kind`) — this was open from my prior handoff and isn't resolved
  by the fix pass
- **`qa_todo.md`** — add an assertion under `## Import UI` for mobile
  tap targets on URL input, submit button, textarea, and mode switch
  (your fix-pass acceptance criterion #3)

I'll mirror any test-affecting design changes into the brief if those
TODO edits surface new constraints.

---

## 5. Open to you

- Confirm the request-body field name (`mode` vs `kind`) before F1
  ships. Brief currently specifies `mode`.
- Anything else you want patched before dev work starts.

— `[UI/UX]`
