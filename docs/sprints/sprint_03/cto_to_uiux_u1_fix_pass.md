# `[CTO]` → `[UI/UX]` — Sprint 03 U1 Fix Pass

> **From:** `[CTO]`
> **To:** `[UI/UX]`
> **Date:** 2026-05-02
> **Subject:** U1 approved in direction; two P1 spec fixes before dev starts

U1 is directionally approved, but CTO review found two P1 issues that
need a small spec patch before `[DEV:backend]` and `[DEV:frontend]`
start implementation.

---

## 1. Formalize YouTube candidate domain contract

The Sprint 03 design brief requires phase 2 copy for the YouTube
external-link path:

> "Following the link in the description… (domain.com)"

But the formal `ImportResponse` contract currently includes only:

- `recipe`
- `reused`
- `sourceKind`

If backend follows that contract exactly, frontend has no agreed field
for the display domain, and the Founder-approved domain hint can
silently disappear.

### CTO recommendation

Update the UI-facing response contract to include:

```ts
type ImportResponse = {
  recipe: Recipe
  reused?: boolean
  sourceKind?: "url" | "text" | "youtube-link" | "youtube-description"
  sourceUrl?: string | null
  sourceDomain?: string | null
}
```

### Rules to specify

- `sourceUrl` is the resolved final source when different from the
  submitted URL, e.g. YouTube URL → recipe page URL.
- `sourceDomain` is display-normalized: strip `www.`, path, query, and
  fragment.
- Backend B5 must populate `sourceDomain` for
  `sourceKind: "youtube-link"` when a candidate URL is chosen.
- If `sourceDomain` is absent, UI drops the domain hint gracefully and
  shows the bare phase copy.
- Backend should never fabricate a domain.

This is simpler than requiring streaming phase tokens and easier for QA
to assert.

---

## 2. Do not waive the mobile tap-target gate

The current brief accepts 38px URL input and submit button heights as
"not blocking." That conflicts with the project Definition of Done in
`CLAUDE.md` and the design principles in `AGENTS.md`, which require
44x44px mobile tap targets.

Since Sprint 03 changes the `/import` page, the brief cannot waive that
gate locally.

### CTO recommendation

Update the brief/specs so:

- URL input is `min-h-[44px]` on mobile.
- URL input may remain `md:h-[38px]` on desktop if `[UI/UX]` wants to
  preserve the dense editorial rhythm.
- Submit button is `min-h-[44px]` on mobile.
- Submit button may remain `md:h-[38px]` on desktop.
- Textarea and mode switch already pass.
- Do not change the project DoD.

---

## Files likely affected

- `docs/sprints/sprint_03/sprint_03_design_brief.md`
- `docs/ui/COMPONENT_SPECS.md`
- `docs/sprints/sprint_03/todo/dev_todo.md`
- `docs/sprints/sprint_03/todo/qa_todo.md`

---

## Acceptance for this fix pass

- Candidate-domain contract is explicit enough for `[DEV:backend]` B5
  and `[DEV:frontend]` F2 to implement without guessing.
- Mobile URL input and submit button satisfy 44x44 tap-target
  requirements in the Sprint 03 import UI spec.
- QA TODO includes an assertion for mobile tap targets on URL input,
  submit button, text area, and mode switch.
- `[UI/UX]` confirms whether backend/frontend are unblocked after the
  patch.

