# Sprint 03 — Design Brief: Import Modes

> **Status:** Locked — 2026-05-02. Founder approved §0 decisions and §12 recommendations on the same day.
> **Owner:** `[UI/UX]`
> **Reads:** `docs/ui/REGISTER.md`, `UI_KIT.md`, `COMPONENT_SPECS.md`, `PAGE_LAYOUTS.md`, `STATES.md` first.
> **Audience:** `[DEV:frontend]` for F1, F2; `[DEV:backend]` for the response contract in §6.

This brief is the canonical Sprint 03 design contract for the `/import`
page. It extends the Sprint 0 / Sprint 2 specs to add **two import
modes** (link, text), **YouTube description-first** status copy, and
**dedupe-reused** feedback.

It introduces **no new tokens**. Every value traces to `UI_KIT.md`.

Where this brief and the Sprint 0 docs disagree, this brief wins for
Sprint 03 surfaces. The Sprint 0 docs (`PAGE_LAYOUTS.md` §4,
`STATES.md` §4, `COMPONENT_SPECS.md` §5) get surgical updates that
reference back here — see §11.

---

## 0. Decisions locked here

These are this brief's design calls. Anything escalated is in §12.

1. **Mode switch shape** — a two-option selector reusing the
   `UnitToggle` visual pattern (no background, active option underlined
   in terracotta). Sized up to meet 44×44px tap targets.
2. **Mode labels** — `link` and `text`, lowercase. "link" covers both
   web URLs and YouTube URLs (YouTube is detected and routed by the
   backend; the user does not pick a "YouTube mode").
3. **Default mode** — `link`. URL flow is the most common case and the
   existing default.
4. **Mode switch position** — between the deck line and the input area,
   centered, with `--font-ui` typography.
5. **No source URL field in text mode for v1.** The backend supports
   optional `sourceUrl` (B2), but the UI doesn't surface it this sprint.
   See §12 Q1.
6. **YouTube has no dedicated mode** — it is a special case of `link`
   with status copy that names the steps honestly.
7. **Dedupe (reused) feedback is a quiet status, not a toast.** The
   streaming box short-circuits to a single line, then auto-navigates
   on the same 1.5s timer as a fresh import.

---

## 1. `/import` page structure

The page keeps its existing shell — narrow centered form,
`--measure-narrow` (480px), unauthenticated routes still excluded.

### Layout (mode-aware)

```
┌───────────────────── Topbar ───────────────────────┐
├────────────────────────────────────────────────────┤
│                                                    │
│              EYEBROW: "Add a new one"              │
│              Display: "Bring a recipe home."       │
│              Deck (italic)                         │
│                                                    │
│              [ link  |  text ]    ← mode switch    │
│                                                    │
│              [ URL input  OR  textarea ]           │
│              [ Bring it in ]                       │
│                                                    │
│              ┌─ Streaming box (on submit) ──┐      │
│              │ ...                          │      │
│              └─────────────────────────────┘      │
│                                                    │
└────────────────────────────────────────────────────┘
```

### Spacing (additions to `PAGE_LAYOUTS.md` §4)

| Gap | Size | Notes |
|---|---|---|
| Deck → mode switch | 22px (`mt-[22px]`) | Same as existing deck → input |
| Mode switch → input | 14px (`mt-[14px]`) | Tighter than the deck spacing — the switch belongs to the input region visually |
| Input → button | 8px | Unchanged |
| Button → streaming box | 26px | Unchanged |

### Three-stage flow (extended)

1. **Idle** — input or textarea + button visible, mode switch enabled.
2. **Submitting** — streaming box mounts. Mode switch, input, and
   button are all disabled.
3. **Success** — streaming box shows final state (or reused short-form;
   see §6). Auto-navigate after 1.5s. Mode switch stays disabled.
4. **Error** — streaming box shows error copy. Mode switch
   **re-enables** so the user can try the other mode without page
   reload. Input keeps its current value.

---

## 2. `ImportModeSwitch` — component spec

A new variant of the `UnitToggle` pattern. Not a new component
category — same anatomy, sized for primary control rather than
secondary.

### Anatomy

```
link | text
```

Two text buttons side by side. No background fill. The active one is
underlined in terracotta.

| Slot | Token |
|---|---|
| Buttons | `font-ui`, `text-ui` (12px, not 11px), lowercase |
| Inactive | `--color-ink-faint` |
| Active | `--color-ink`, weight 500, 1px bottom border `--color-accent` |
| Padding | `12px 18px` (gives ≥ 44px tap target on mobile) |
| Gap between buttons | 8px |
| Container | `<div role="tablist" aria-label="Import mode">` |

The size bump from `UnitToggle` (`text-ui-sm` / `3px 10px`) is deliberate:
this control selects the primary input, not a secondary attribute. It
also unblocks accessibility floor compliance for tap targets.

### States

| State | Visual |
|---|---|
| Default | Both buttons visible; one is "active" (underlined terracotta) |
| Hover (inactive) | Color shifts to `--color-ink` |
| Focus | 2px terracotta focus ring on focused button (kit default) |
| Disabled (during streaming) | Both buttons at 50% opacity, no hover, `cursor: not-allowed`, `aria-disabled="true"` |

### Props

```
- value: 'link' | 'text'
- onChange: (next: 'link' | 'text') => void
- disabled?: boolean
```

### Behavior

- Switching mode resets only the *opposite* input's local value if it
  was empty. If the user typed something in URL mode, switching to
  text and back **preserves** the URL value. Same in reverse. This
  protects the user from losing input by tapping the wrong control.
- Switching does **not** clear streaming-box state. If a previous
  import errored, the box stays visible until the user resubmits —
  switching mode just changes the input shape underneath.

### Accessibility

- Container has `role="tablist"` and `aria-label="Import mode"`
- Each button is `role="tab"` with `aria-selected="true|false"`
- The input area below is `role="tabpanel"` with `aria-labelledby`
  pointing to the active tab button
- Keyboard: Left/Right arrows move between tabs; Enter/Space activates;
  Tab moves focus into the input area

### Reduced motion

No animation on toggle — instant change. Already compliant.

---

## 3. URL mode — no behavioral change

Documented here for completeness; no implementation changes other than
the mode switch above the input.

| Slot | Spec |
|---|---|
| Placeholder | "Paste a recipe URL or a YouTube link" (existing — keep) |
| Validation | Existing — `URL` constructor; reject non-`http(s)` |
| Error copy | Existing — see `STATES.md` §4a |
| Submit payload | `{ mode: "link", url: string }` (note `mode` field is new) |

The placeholder still mentions "YouTube link" because YouTube is a
valid `link` input — the routing happens on the server side, the user
doesn't pick a mode for it.

---

## 4. Text mode

The textarea is a multiline form of the existing input. Same tokens,
same focus styling, vertically scaling.

### Textarea spec

| Property | Value |
|---|---|
| Width | full (`w-full`) |
| Min height | `200px` (`min-h-[200px]`) |
| Max height (mobile) | `min(50vh, 400px)` — keeps submit button visible above the keyboard |
| Max height (desktop) | `480px` |
| Resize | `resize-y` — vertical only |
| Background | `--color-paper` |
| Border | `0.5px solid --color-border-strong` |
| Radius | `--radius-sm` |
| Font | `font-ui text-body` (matches existing single-line input drift; preserve consistency) |
| Padding | `12px 14px` |
| Focus | border `--color-accent`, box-shadow `0 0 0 2px var(--color-focus-ring)` |
| Placeholder | "Paste the recipe — ingredients, steps, and any notes." |
| Placeholder color | `--color-ink-ghost` |
| Disabled | `opacity-50`, `cursor-not-allowed` |

### Validation (client)

| Failure | Trigger | Helper copy |
|---|---|---|
| Blank | Submit with empty/whitespace-only text | "Paste a recipe to import." |
| Too short | Submit with < 40 non-whitespace characters | "Paste a bit more — we need ingredients and steps to work with." |

The 40-char floor is a "this can't possibly be a recipe" check. Server
runs the real `looksLikeRecipePage()` pre-screen (B1) afterward.

Helper text appears below the textarea in `--color-accent-strong`,
`text-ui-sm`. Border becomes `--color-accent-strong`. Mirrors the URL
error pattern from `STATES.md` §4a.

### Submit payload

```ts
{ mode: "text", text: string }
```

(Optional `sourceUrl` is not collected from the UI in v1 — see §12 Q1.)

### Submit button

Unchanged. Same "Bring it in" / "Bringing it in…" labels and disabled
state when the textarea is empty.

---

## 5. Streaming phase copy

Phases differ by mode and by detected source kind. The user-facing copy
is honest about what's happening.

### 5.1 URL mode (web URL — existing, unchanged)

| # | Status copy | Trigger |
|---|---|---|
| 1 | "Reading the page…" | Initial fetch |
| 2 | "Finding the recipe…" | `"title"` key seen in JSON |
| 3 | "Reading ingredients…" | `"ingredients"` key seen |
| 4 | "Reading the method…" | `"steps"` key seen |
| 5 | "Done" | Final state |

### 5.2 Text mode (new)

| # | Status copy | Trigger |
|---|---|---|
| 1 | "Reading what you pasted…" | Initial server receipt + pre-screen |
| 2 | "Finding the recipe…" | `"title"` key seen |
| 3 | "Reading ingredients…" | `"ingredients"` key seen |
| 4 | "Reading the method…" | `"steps"` key seen |
| 5 | "Done" | Final state |

The phase progression is the same shape as URL mode — same calm voice,
same line count. Only the first phase changes.

### 5.3 YouTube — external recipe-link path (`sourceKind: "youtube-link"`)

User pasted a YouTube URL; backend found a recipe URL in the
description and is importing that.

| # | Status copy | Trigger |
|---|---|---|
| 1 | "Looking up the video…" | Backend B5 fetching YouTube metadata |
| 2 | "Following the link in the description… *(domain.com)*" | Candidate URL chosen |
| 3 | "Reading the page…" | Backend transitions to URL import |
| 4 | "Finding the recipe…" | `"title"` key seen |
| 5 | "Reading ingredients…" | … |
| 6 | "Reading the method…" | … |
| 7 | "Done" | Final state |

**Domain hint format** (Founder-approved 2026-05-02): the candidate
URL's source domain is appended to phase 2 in italic muted ink:

- The trailing `(domain.com)` portion uses `--color-ink-faint`,
  not terracotta — it must not compete with phase status
- Strip `www.` and any path; show the bare host
- If the backend hasn't communicated the candidate domain yet (e.g., the
  whole flow finishes before phase 2 is rendered), drop the hint and
  show the bare phase copy. Don't fabricate a domain.

The backend B5 needs to surface the candidate domain at the boundary
point — either via a `phase` token alongside `domain`, or as part of
the final `sourceKind` response with the resolved URL/domain. Either
shape works for this UI rule.

### 5.4 YouTube — description text path (`sourceKind: "youtube-description"`)

Backend found no candidate URL but the description itself passed the
recipe pre-screen.

| # | Status copy | Trigger |
|---|---|---|
| 1 | "Looking up the video…" | YouTube metadata fetch |
| 2 | "Reading the description…" | Backend transitions to text extraction |
| 3 | "Finding the recipe…" | `"title"` key seen |
| 4 | "Reading ingredients…" | … |
| 5 | "Reading the method…" | … |
| 6 | "Done" | Final state |

### 5.5 Phase delivery

Status text in the box header (terracotta eyebrow style) shows the
**latest** phase. The list of streamed lines below shows each phase
the box has reached so far, fading in as it arrives. This is the
existing pattern — only the copy changes.

For YouTube paths (5.3, 5.4), the backend can communicate the
intermediate phases via either:

- A `sourceKind` field in the response (received once at the end), in
  which case the UI shows a single retroactive line "Adapted from YouTube
  description" along with the phase list — OR
- A streaming `phase` token at the boundary points (preferred), which
  the UI converts to the lines above.

The implementation choice is a backend call (`[DEV:backend]` B5).
Whichever is shipped, the **user-visible copy** must match §5.3 / §5.4.
If only `sourceKind` arrives at the end, fold the YouTube-specific
phases into the existing line list before navigation so the user sees
the full path.

---

## 6. Backend response contract (UI-facing)

For F2 to surface dedupe / YouTube feedback, the response from
`POST /api/ai/import` should include these fields. `[DEV:backend]`
owns the contract; the UI requires at minimum:

```ts
type ImportResponse = {
  recipe: Recipe              // existing
  reused?: boolean            // B3 — true if dedupe short-circuited the AI call
  sourceKind?:                // B5 — names the resolved import path
    | "url"                   //   plain web URL (default)
    | "text"                  //   text/paste
    | "youtube-link"          //   YouTube → external recipe URL
    | "youtube-description"   //   YouTube → description-as-text
}
```

Defaults (when fields absent): `reused = false`, `sourceKind = "url"`
or `"text"` matching the user-chosen mode.

If the contract diverges, file the change back to `[UI/UX]` so this
brief and the copy in §5–7 stay accurate.

---

## 7. Reused-from-library feedback (`reused: true`)

When the backend short-circuits via dedupe, the streaming box shows a
single quiet line and then auto-navigates.

### Sequence

1. Box mounts immediately on submit. Status header: "Looking it up…"
   (terracotta eyebrow, pulse dot).
2. Response arrives. Pulse stops. Status: "Done."
3. A single line appears in the list:
   *"Already in our library — adding it to yours."*
4. Auto-navigate at the standard 1.5s timer.

### Tokens

- Status header: `text-eyebrow text-accent` — same as existing
- Line: `font-ui text-body-sm text-ink-muted`, fades in (`--motion-fade-slow`)
- No CTA, no button. This is a confirmation, not a decision point.

### Why not a toast

The product has no toast pattern (`UI_KIT.md` §13: "Don't accept
shadcn defaults"). A streaming-box line keeps the import-flow visual
consistent — the user submitted, the box appeared, the work happened
fast, and they're moving on. Same shape as a normal import, just one
line.

### Voice

"Already in our library — adding it to yours." reads factual. It's
honest about what happened (dedupe), reassures privacy ("adding it to
yours"), and avoids any "saved you a credit!" tone that would expose
internal cost concerns to the user.

---

## 8. State catalog (cross-reference)

Per-state details live in this brief and `STATES.md`. This table is
the index `[DEV-QA]` runs the import scenarios against.

| State | Where specified |
|---|---|
| URL idle | `PAGE_LAYOUTS.md` §4 (existing) |
| URL streaming | `COMPONENT_SPECS.md` §5 (existing) |
| URL success | `STATES.md` §4 (existing) |
| URL invalid | `STATES.md` §4a (existing) |
| URL paywall | `STATES.md` §4b — copy refresh in §9.2 below |
| URL no-recipe | `STATES.md` §4c (existing) |
| URL parse fail | `STATES.md` §4d (existing) |
| URL network/timeout | `STATES.md` §4e (existing) |
| Text idle | This brief §4 |
| Text streaming | This brief §5.2 |
| Text success | Same as URL success |
| Text blank/short | This brief §4 (validation table) |
| Text non-recipe | §9.1 below |
| Text AI parse fail | Same copy as §4d (URL parse fail) |
| YouTube link path streaming | This brief §5.3 |
| YouTube description path streaming | This brief §5.4 |
| YouTube no-recipe-found | §9.3 below |
| YouTube API error | §9.4 below |
| Reused / dedupe | This brief §7 |

---

## 9. New error states (additions to `STATES.md` §4)

These are the new error states Sprint 03 introduces. They follow the
existing §4 pattern: status header in `--color-accent-strong`, body
copy below, optional CTA(s).

### 9.1 Text mode — non-recipe text

After server-side `looksLikeRecipePage()` rejects the input, or after
AI extraction returns no usable recipe.

> **Status:** "No recipe here"
>
> Body: "We didn't find a recipe in that text. Make sure it has
> ingredients and steps."
>
> CTA: "Try again" (clears textarea after click and refocuses)

### 9.2 Paywall (`STATES.md` §4b) — copy refresh

The Sprint 0 spec marked the "paste recipe text instead" CTA as
post-MVP because no text endpoint existed. In Sprint 03, that endpoint
ships (B2). Replace the `STATES.md` §4b CTA accordingly.

> **Status:** "Couldn't read the page"
>
> Body: "Looks like this site requires a subscription. Try pasting the
> recipe text directly, or use a different source."
>
> Primary CTA: "Paste recipe text instead →" — switches the form to
>   `text` mode. The URL value is discarded (it didn't work). Focus
>   moves to the textarea.
> Secondary CTA: "Try another link" — clears URL, returns to idle.

### 9.3 YouTube — no recipe found

YouTube metadata fetched, no candidate URL, description failed
pre-screen.

> **Status:** "No recipe in this video"
>
> Body: "We couldn't find a recipe link or recipe text in the
> description. Try the recipe page directly, or paste the recipe text."
>
> Primary CTA: "Paste recipe text instead →" — switches to `text`
>   mode. URL value discarded. Focus moves to textarea.
> Secondary CTA: "Try another link" — clears, returns to idle.

### 9.4 YouTube — service unavailable / API key missing

Backend returns a controlled configuration or upstream error from B4.

> **Status:** "Can't read this video"
>
> Body: "We can't reach YouTube right now. Try the recipe page
> directly."
>
> CTA: "Try another link"

The copy doesn't expose the API key issue — that's an infrastructure
detail. The user-facing path forward is unchanged: try a different
link, or paste text.

### 9.5 Mode-switch interaction during error

When an error is showing and the user toggles mode:

- The streaming box stays visible (don't blow away the error before
  the user has read it)
- The input area below changes to match the new mode
- The error message stays until the next submit, then it clears as the
  box re-enters streaming state

---

## 10. Mobile (375px)

### Mode switch

- Two buttons sit side by side; total width comfortably fits
- Padding `12px 18px` gives ≥ 44px tap height; width per button ≈ 70px
- Gap 8px

### Textarea

- Full width with the page's existing 20px gutters
- `min-h-[200px]` works above the iOS keyboard at most viewport heights
- `max-h-[min(50vh, 400px)]` keeps the submit button visible when the
  keyboard is up
- `resize-y` allows the user to expand if they need more room

### Submit button

- Unchanged from URL mode

### Streaming box

- Unchanged. The status header and line list scale fine at 375px.

### Tap targets

| Element | Mobile size |
|---|---|
| Mode switch buttons | ≥ 44 × 70px ✓ |
| URL input | 38px high — existing, **already non-compliant** for tap target. Not in this sprint's scope to fix. Flagged. |
| Submit button | 38px high — same flag. |
| Textarea | 200px+ ✓ |

The 38px input/button height is a pre-existing kit drift documented in
`UI_KIT.md` §8. It is not blocking Sprint 03 acceptance, but should
be revisited when next the kit opens.

### Mobile-specific layout

Under `prefers-reduced-motion` or generally — no layout changes
versus desktop except the gutters.

---

## 11. Sprint 0 file updates required

The following surgical updates ship alongside this brief. They make
the locked Sprint 0 docs accurate without duplicating this brief's
content.

### `docs/ui/PAGE_LAYOUTS.md` §4 — `/import`

- Add the mode switch to the layout diagram
- Update the "Three-stage flow" to mention mode-aware behavior
- Reference this brief for full mode and YouTube details

### `docs/ui/STATES.md` §4 — Import error states

- §4b paywall: refresh the "paste recipe text" CTA from post-MVP to live
- Add §4f text-mode validation errors (blank, too short)
- Add §4g text-mode non-recipe rejection
- Add §4h YouTube no-recipe-found
- Add §4i YouTube API/service unavailable
- Add §4j reused-from-library success-feedback (cross-reference brief §7)

### `docs/ui/COMPONENT_SPECS.md` §5 — `ImportForm`

- Add the mode switch to anatomy
- Add textarea sub-component
- Add the four phase tables (URL, text, YouTube link, YouTube description)
- Add the response-contract reference (§6)
- Add the mode/disabled prop changes
- Reference this brief for the canonical detail

These updates do not introduce new tokens. They reference this brief
for any sprint-specific copy.

---

## 12. Decisions log (Founder-approved)

All three open questions resolved by the Founder on 2026-05-02. The
recommendations stand as locked.

### Q1 — Source URL field in text mode?

**Decision: Defer.** No source-URL field in text mode for v1. The
backend B2 keeps `sourceUrl` available for future use; UI exposure is
deferred to a future "Edit recipe" surface where source can be
added/edited any time.

Rationale: the common text-paste case (off a webpage) is better served
by URL mode; an optional field is friction the user skips every time;
opening this later is a clean addition, not a migration.

### Q2 — Should the mode switch persist across visits?

**Decision: No.** URL mode is the canonical default; text is a
fallback. Stateless reset on every `/import` visit. Persistent default
would surface the fallback as primary and invert the intended
hierarchy.

### Q3 — Domain hint in YouTube link path?

**Decision: Yes — show the source domain.** When the YouTube
description-link path is chosen, the streaming box phase 2 reads:

> *"Following the link in the description… (nytimes.com)"*

Domain in italic `--color-ink-faint` so it doesn't compete with
terracotta phase status. Spec embedded in §5.3 above. Backend B5 needs
to surface the candidate domain at the boundary; if not available,
drop the hint and show the bare phase copy — don't fabricate.

---

## 13. Screenshots required for QA

Per `qa_todo.md` U5. Required captures (all at desktop 1280px and
mobile 375px unless noted):

- [ ] `import-url-mode.png` — default, idle, URL mode active
- [ ] `import-text-mode.png` — text mode active, textarea visible, idle
- [ ] `import-text-streaming.png` — text mode mid-import (status:
  "Reading what you pasted…")
- [ ] `import-reused-url.png` — quiet duplicate-reuse feedback line
- [ ] `import-youtube-link.png` — YouTube external recipe-link path,
  status "Following the link in the description…"
- [ ] `import-youtube-description.png` — YouTube description-text path,
  status "Reading the description…"
- [ ] `import-youtube-error.png` — §9.3 no recipe in video state
- [ ] `import-text-error.png` — §9.1 non-recipe text rejection

Also re-capture existing Sprint 1/2 import screenshots if the mode
switch shifts visual layout — likely all of them, since the mode
switch adds a row to the form.

---

## 14. Authority

This file is owned by `[UI/UX]`. Edits that change the register, the
kit, or token scope require Founder approval. Edits to copy or to
component layout that fit within the existing kit are within `[UI/UX]`
authority.

The `[DEV:frontend]` agent does not invent error copy or visual
treatments not specified here. New error scenarios go back to `[UI/UX]`.

---

## Changelog

| Date | Change | Trigger |
|---|---|---|
| 2026-05-02 | Initial draft — `[UI/UX]` U1 | Sprint 03 kickoff, dev_todo task U1 |
| 2026-05-02 | Locked. Founder approved Q1 (defer source URL field), Q2 (no mode persistence), Q3 (show YouTube candidate domain). §5.3 phase 2 updated to include the domain-hint format. | Founder review |
