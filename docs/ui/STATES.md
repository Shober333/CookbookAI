# States — CookbookAI

> **Status:** Locked — Sprint 0 (updated Sprint 2, Sprint 3)
> **Owner:** [UI/UX]
> **Reads:** `REGISTER.md`, `UI_KIT.md`, `COMPONENT_SPECS.md`, `PAGE_LAYOUTS.md` first.
> **Audience:** `[DEV:frontend]` agent or human dev.

This file specifies the empty, loading, and error states for every page
in CookbookAI. Per `REGISTER.md` §3 Rule 3, the library is the
most-visited page — its empty state is one of the only places in the
product where a warm moment is *earned*. Other empty/error states use
the same editorial discipline as the rest of the product.

These states are not afterthoughts. A design that ships without an
explicit error state for every async operation will be flagged 🔴
**Ugly** at review.

---

## Index

1. Library — empty state (the earned warm moment)
2. Library — loading state, search empty state
3. Recipe detail — error states (fetch fail, not found)
4. Import — error states (invalid URL, paywall, parse fail, timeout)
5. Adapt flow (inline `AdaptPanel`) — error states
6. Auth — error states (invalid credentials, network, validation)
7. Global — offline indicator, session expired
8. Equipment settings — loading, save success, save error

---

## 1. Library — empty state

This is one of two places in the product where Caveat (handwritten)
appears. Per `UI_KIT.md` §10 *warm moment budget*: empty library = 1
allowed.

### Layout

```
┌───────────────────── Topbar ───────────────────────┐
├────────────────────────────────────────────────────┤
│                                                    │
│  Eyebrow: "Your library"                           │
│  Headline: "It's quiet in here."                   │
│  Sub: "Bring something home — a link, a video,    │
│        a half-remembered recipe."                  │
│  ───────────────────────────────────────────────   │
│                                                    │
│        ┌─────────────────────────────────┐         │
│        │                                 │         │
│        │       [empty space]             │         │
│        │                                 │         │
│        │   "Try one of these to start"   │         │
│        │   (Caveat, terracotta, rotated  │         │
│        │    slightly, ↓ arrow above)     │         │
│        │                                 │         │
│        │   ┌─ a few sample recipe links ─┐         │
│        │   │ • Cacio e Pepe              │         │
│        │   │ • Sheet-Pan Gochujang       │         │
│        │   │ • Slow-Cooker White Bean    │         │
│        │   └────────────────────────────┘         │
│        │                                 │         │
│        │   [    Bring a recipe in →    ]│         │
│        │                                 │         │
│        └─────────────────────────────────┘         │
│                                                    │
└────────────────────────────────────────────────────┘
```

### Copy

| Slot | Copy |
|---|---|
| Eyebrow | "Your library" |
| Headline | "It's quiet in here." |
| Sub | "Bring something home — a link, a video, or a half-remembered recipe." |
| Caveat note | "Try one of these to start" (with a small ↓ arrow above) |
| Sample list label | (none — just the items) |
| Primary CTA | "Bring a recipe in →" |

### Sample recipes

Three pre-curated example recipe URLs, click-to-import. They're not
"demo data" inserted into the library — they're seed *links* that
trigger the import flow when clicked. This means the user's first
recipe is real, not a placeholder.

Recommended seeds:

1. NYT Cacio e Pepe with Black Pepper Brown Butter
2. Serious Eats Sheet-Pan Gochujang Chicken
3. Smitten Kitchen Slow-Cooker White Bean Soup

The seed list is configurable in code (one constant), not user-facing
config. Easy to swap if any URLs go behind paywalls.

### Tokens

- Empty-state container: max-width `--measure-narrow` (480px), centered
  vertically and horizontally below the page header
- Padding: 40px top, 60px bottom
- Caveat note:
  - `font-hand`, `text-hand` (16px), `--color-accent`
  - `transform: rotate(-2deg)`
  - 14px below container top edge
  - Small ↓ arrow above (18px Caveat, opacity 0.7)
- Sample list:
  - `font-display`, `text-body`, `--color-ink`
  - 8px gap between items
  - Each item is a button styled as text — hover underlines in
    `--color-accent`
  - 18px gap below Caveat note
- CTA button: primary variant, 22px below the sample list

### Behavior

- Clicking a sample item: pre-fills the URL field and navigates to
  `/import` (or opens import inline — Founder decision; default is
  navigate)
- Clicking "Bring a recipe in →": navigates to `/import`
- If the user has dismissed the empty state seed list before (cookie),
  show only the headline + sub + CTA, no Caveat, no samples. Track
  dismissal as `cookbook_ai.empty_dismissed = true`.

### Mobile

- Same structure, narrower container (full width with 20px gutters)
- Caveat note doesn't rotate on mobile (it crowds the layout)
- Sample list stacks the same way

### Accessibility

- The Caveat note is `aria-hidden="true"` (decorative — its content is
  conveyed by the sample list itself and the CTA)
- The sample list is `<ul role="list">`
- Each sample is a `<button>` (it triggers an action, doesn't navigate
  to an external URL directly)

---

## 2. Library — loading state, search empty state

### 2a. Skeleton list (initial page load)

No animation, no shimmer.

#### Layout

The page header renders normally (the count headline shows "Loading
your library…" instead of the dynamic count). Below the header rule:
six skeleton list rows.

#### Skeleton row

```
[ ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓ ]   [ ▓▓▓▓▓ ]  [ ▓▓ ▓▓ ]
[ ▓▓▓▓▓▓▓▓▓▓ ]
```

Each block:

- Background: `--color-border-soft`
- Height matches the text it stands in for (`text-body` row = 14.5px,
  `text-body-sm` row = 13px)
- Width: title 60–80% (varied per row for natural feel), sub 30–50%,
  meta 90px, tags two pills 24px wide each
- `border-radius: 2px` for text blocks, pill-shape for tag blocks

#### Why no shimmer animation

Shimmer is a tech-product convention. CookbookAI is editorial. Static
skeleton blocks read calm; shimmer reads anxious. The 200–500ms loading
delay is short enough that users won't suspect a stall. If it ever
becomes long enough to feel stuck, that's an engineering issue, not a
UX bandage.

#### Loading state copy in header

- Eyebrow: "Your library"
- Headline (during load): "Loading your library…"
- Sub: (hidden during load)

Once data resolves, headline updates to the real count.

#### Reduced-motion

No motion to suppress. State is already static.

#### Accessibility

- Skeleton container has `aria-busy="true"` and `aria-live="polite"`
- Once loaded, the page announces the count to screen readers via the
  updated headline

### 2b. Search empty result (Sprint 2)

When a search term returns zero matches:

#### Treatment

Replace the recipe list with a centered message:

```
                  No recipes matching "<term>".
```

#### Tokens

- `font-display text-deck italic text-ink-muted`
- Centered, `pt-[40px]`
- Container: same width as the recipe list, just empty

#### Distinct from §1

The §1 empty state is for "user has zero recipes total." The §2b state
is for "user has recipes, but none match this search." Don't show the
warm moment / Caveat invitation here — searching with no matches is a
neutral information state, not a "let's get started" moment.

#### Headline coordination

Per Sprint 2 brief §3, the page headline switches to "Nothing matches."
when this state is active. So the user sees:

```
Eyebrow: "Your library"
Headline: "Nothing matches."
Sub: hidden
[ search input still showing the term ]
———————————————————————————————————————
              No recipes matching "<term>".
```

#### Accessibility

- The empty-search message has `role="status"`
- Headline change announces via `aria-live="polite"`

### 2c. Search loading state

When a search query is in flight:

- Existing recipe list dims to `opacity-60` (don't unmount)
- No skeleton, no spinner
- New results replace the dimmed list when they arrive

The dimming is the visual signal. Users tolerate brief visual
quietness more than they tolerate flicker.

---

## 3. Recipe detail — error states

### 3a. Fetch fail (network/server error)

Caused by: API down, 500 errors, network drop while fetching recipe.

#### Layout

The page header renders with placeholders, then below the controls bar:

```
┌───────────────────── Topbar ───────────────────────┐
├────────────────────────────────────────────────────┤
│                                                    │
│            Eyebrow: "Trouble loading"              │
│            Headline: "We can't reach this recipe   │
│                       right now."                  │
│            Deck: "Check your connection, or try    │
│                  again in a moment."               │
│                                                    │
│            [ Try again ]      [← Back to library ] │
│                                                    │
└────────────────────────────────────────────────────┘
```

#### Tokens

- Container: `--measure` (620px), centered
- Top spacing: 64px below topbar
- Eyebrow + headline + deck: same hierarchy as elsewhere
- Buttons: side by side at desktop (centered), stacked full-width on
  mobile. "Try again" is primary, "Back to library" is ghost variant.

#### Copy

| Slot | Copy |
|---|---|
| Eyebrow | "Trouble loading" |
| Headline | "We can't reach this recipe right now." |
| Deck | "Check your connection, or try again in a moment." |
| Primary CTA | "Try again" |
| Secondary CTA | "← Back to library" |

#### Behavior

- "Try again" re-fetches the recipe; if it succeeds, the page renders
  normally. If it fails again, the same state stays.
- "Back to library" navigates to `/library`.

### 3b. Not found (recipe deleted or invalid ID)

Caused by: user navigates to `/recipes/abc123` where the recipe doesn't
exist or was deleted.

#### Layout

Same as 3a, different copy.

#### Copy

| Slot | Copy |
|---|---|
| Eyebrow | "Not here" |
| Headline | "We can't find that recipe." |
| Deck | "It might have been deleted, or the link might be old." |
| Primary CTA | "← Back to library" |
| Secondary CTA | (none) |

No "try again" — there's nothing to retry.

### Accessibility (both 3a and 3b)

- The error state container has `role="alert"` so screen readers
  announce it on render
- Page `<title>` updates to reflect the error: "Recipe unavailable · CookbookAI"
- Focus moves to the headline on render

---

## 4. Import — error states

The import flow has the most error variety — it touches user input,
external URLs, and the AI service.

**Sprint 03 update:** the page now supports two modes (link, text)
and routes YouTube URLs through a description-first waterfall. New
states 4f–4j cover the additions; the canonical Sprint 03 spec (copy,
phase mapping, mode-switch behavior) is at
`docs/sprints/sprint_03/sprint_03_design_brief.md`.

### Note on "streaming"

The import UI uses the term "streaming box" and "streamed lines." For
historical reference: this terminology came from a Sprint 0 assumption
that the backend would do literal LLM token streaming.

The actual Sprint 1 implementation does **progressive phase
indicators**: the JSON response accumulates server-side, and a
client-side `detectPhase()` updates the status as keys appear in the
buffer ("title" key seen → "Finding the recipe…", "ingredients" key
seen → "Reading ingredients…", etc.).

This is honest. The user-facing copy describes phases of work, not
literal byte streaming. Both behaviors look indistinguishable to the
user. No copy revision is needed; this note is preserved here so
future developers and reviewers don't read "streaming" too literally.

CTO Sprint 1 review #5 raised this question; resolved 2026-05-01 — no
change.

### 4a. Invalid URL (client-side validation)

Caught when the user clicks "Bring it in" with malformed input.

#### Treatment

Inline error helper text below the input field. **No streaming box
mounts.** The input border becomes `--color-accent-strong`.

#### Copy

> "That doesn't look like a URL. Try something starting with
> `https://`."

For YouTube specifically, if the URL is a YouTube link but in a format
we can't parse:

> "We support YouTube video links — try the standard `youtube.com/watch?v=…` format."

### 4b. Paywall blocking extraction

After the AI starts, the streaming reaches a state where it can't
extract because the source is paywalled.

#### Treatment

Streaming box stays mounted; pulse stops; status changes to error
mode. A new section appears at the bottom of the box with error copy
and an alternative path.

#### Copy

In the streaming box, after the streaming halts:

> **Status:** "Couldn't read the page" (status text in `--color-accent-strong`)
>
> Body: "Looks like this site requires a subscription. Try pasting the
> recipe text directly, or use a different source."
>
> CTA: "Paste recipe text instead →"

#### "Paste recipe text instead" flow

Clicking this swaps the form into `text` mode (mode switch sets to
`text`, the URL input is replaced by a textarea, focus moves to the
textarea, the previous URL value is discarded). The "Bring it in"
button stays. Submitting posts the text payload through the shared
import service. See Sprint 03 design brief §9.2 for full copy.

**Status update (Sprint 03):** the text endpoint ships in B2, so this
CTA is now live. The previous "post-MVP" caveat is resolved.

### 4c. No recipe found at URL

Page exists but has no extractable recipe (e.g., a blog post without
structured recipe data).

#### Copy

> **Status:** "No recipe here" (in `--color-accent-strong`)
>
> Body: "We couldn't find a recipe at that link. Make sure it's a
> page with ingredients and steps."
>
> CTA: "Try another link" (clears input, returns to idle)

### 4d. AI parse failure

The AI extracted something but produced output that fails our schema.

#### Copy

> **Status:** "Something went wrong"
>
> Body: "We had trouble structuring this recipe. It happens occasionally
> — try again, or paste a different link."
>
> CTA: "Try again"

### 4e. Network timeout / AI service unavailable

Hard infrastructure failure.

#### Copy

> **Status:** "Connection trouble"
>
> Body: "We can't reach our recipe service right now. Try again in a
> moment."
>
> CTA: "Try again" only

### Accessibility (all 4a–4e)

- Error states inside the streaming box use `role="alert"` so the
  status change announces
- The input field's `aria-invalid` is set to `true` when in error
- Error text is linked via `aria-describedby` from the input

### 4f. Text mode — blank or too short (Sprint 03)

Client-side validation, fired on submit before the streaming box
mounts. Helper text below the textarea, border switches to
`--color-accent-strong`. Mirrors the URL `aria-invalid` pattern (4a).

| Failure | Copy |
|---|---|
| Blank | "Paste a recipe to import." |
| < 40 non-whitespace chars | "Paste a bit more — we need ingredients and steps to work with." |

See Sprint 03 design brief §4 for the validation thresholds.

### 4g. Text mode — non-recipe text (Sprint 03)

Server returns from B1 pre-screen or AI extraction with no usable
recipe.

> **Status:** "No recipe here"
>
> Body: "We didn't find a recipe in that text. Make sure it has
> ingredients and steps."
>
> CTA: "Try again" — clears the textarea on click and refocuses

### 4h. YouTube — no recipe found (Sprint 03)

YouTube metadata fetched, no candidate URL identified, description
failed pre-screen.

> **Status:** "No recipe in this video"
>
> Body: "We couldn't find a recipe link or recipe text in the
> description. Try the recipe page directly, or paste the recipe text."
>
> Primary CTA: "Paste recipe text instead →" — switches to `text`
>   mode, discards URL, focuses textarea
> Secondary CTA: "Try another link" — clears, returns to idle

### 4i. YouTube — service unavailable / API key missing (Sprint 03)

Backend returns a controlled configuration or upstream error from B4.
The user-facing copy does not expose the API-key vs network
distinction.

> **Status:** "Can't read this video"
>
> Body: "We can't reach YouTube right now. Try the recipe page
> directly."
>
> CTA: "Try another link"

### 4j. Reused-from-library (Sprint 03 — success feedback, not error)

When B3 dedupe short-circuits the AI call, the streaming box shows a
single quiet line in place of the phase progression. Documented here
for state-catalog completeness; full spec in Sprint 03 design brief
§7.

> **Status:** "Done"
>
> Line: *"Already in our library — adding it to yours."*
>
> Auto-navigate at the standard 1.5s timer.

No error styling — this is a success path with abbreviated phases.

### Accessibility (all 4f–4j)

- Same conventions as 4a–4e
- Reused-from-library line uses `role="status"` (success), not
  `role="alert"`

---

## 5. Adapt flow (inline `AdaptPanel`) — error states

Sprint 2 replaces the standalone `/recipes/[id]/adapt` page (and its
old error states) with the inline `AdaptPanel` component on the recipe
detail page. See `COMPONENT_SPECS.md` §9 and Sprint 2 brief §2.

The Sprint 0 standalone adapter page error states (formerly here) are
deprecated. The error states below replace them.

### 5a. Adapt API returns 5xx or network error

Caused by: AI service timeout, server error, network drop while
adapting.

#### Treatment

Below the "Adapt for my kitchen" button (or the loading state, once it
returns from loading):

#### Copy

> "We couldn't adapt that. Try again."

`font-ui text-body-sm`, color `--color-accent-strong`. Button
re-enables.

### 5b. Adapt API returns valid JSON but empty `adaptedSteps`

The AI returned a response but the steps array is empty or zero-length.

#### Copy

> "Adaptation didn't produce a usable result. Try again, or change your
> equipment selection."

The "change your equipment selection" suffix points the user toward
`/equipment` if they want to reconfigure. Don't link inline (avoid
making errors look like calls to action) — the user can tap the
Equipment nav themselves.

### 5c. Save API fails

User clicked "Save this version" on a successful result, but the
`PATCH /api/recipes/[id]` failed.

#### Treatment

Below the action buttons (Save / Discard):

#### Copy

> "We couldn't save that. Try again."

`font-ui text-body-sm text-accent-strong`. Save button re-enables. The
result panel **stays mounted** — don't blow away the AI result just
because the save failed.

### 5d. Discard fails

User confirmed the discard dialog, but the `PATCH { adaptedSteps: null }`
failed.

#### Treatment

Same line position as 5c.

#### Copy

> "We couldn't discard that. Try again."

State stays at "Saved" until discard succeeds.

### Accessibility (all 5a–5d)

- Error message has `role="alert"` so screen readers announce on render
- Buttons re-enable as soon as the error state mounts
- Don't auto-dismiss errors — let the user read them and decide

---

## 6. Auth — error states

### 6a. Invalid credentials

Login submitted with wrong email/password.

#### Treatment

Helper text above the "Sign in" button (after the password field):

> "Email or password is incorrect."

In `--color-accent-strong`, `text-ui-sm`. No "did you mean" suggestions
— too easy to leak whether the email exists.

### 6b. Account already exists (register)

User tries to register with an existing email.

#### Copy

> "An account with this email already exists. [Sign in →]"

The "Sign in →" is a link to `/login` with the email pre-filled.

### 6c. Validation errors (register)

Helper text below the failing field. `--color-accent-strong`,
`text-ui-sm`.

| Failure | Copy |
|---|---|
| Email malformed | "That doesn't look like a valid email." |
| Password too short | "8 characters or more, please." |
| Password too common | "Pick something less common." (only if password strength check is enabled) |

### 6d. Network / server error

> "Something went wrong on our end. Try again in a moment."

Above the submit button, full-width.

### Accessibility (all 6a–6d)

- Submit button is not disabled during error display — user can correct
  and retry
- Each field with an error has `aria-invalid="true"` and the error
  text linked via `aria-describedby`
- General errors (server, network) are in a `role="alert"` region above
  the button

---

## 7. Global states

### 7a. Offline indicator

When the browser reports `navigator.onLine === false`, a thin banner
appears at the top of the topbar (above the topbar content):

```
┌─────────────────────────────────────────────────┐
│ You're offline. Some things won't work.         │  ← 28px tall
├─────────────────────────────────────────────────┤
│  [Topbar continues below]                       │
```

#### Tokens

- Background: `--color-accent-strong`
- Text: `--color-paper`, `font-ui`, `text-ui-sm`, centered
- Padding: 8px vertical
- No close button — auto-dismisses when connection returns

#### Behavior

- Appears when offline event fires
- Disappears when online event fires
- Pushes topbar (and all page content) down by 28px while visible

### 7b. Session expired

User's session expired mid-session (e.g., they left the tab open
overnight).

#### Treatment

A modal dialog (using shadcn Dialog primitive, restyled per UI Kit)
appears centered, semi-transparent paper overlay behind:

#### Copy

> Headline: "Welcome back."
>
> Body: "Sign in again to continue."
>
> CTA: "Sign in"

The "Sign in" button takes them to `/login` with `?return=<current_path>`
so they end up back where they were after auth.

#### Tokens

- Modal width: `--measure-narrow` × 0.7 ≈ 340px
- Modal background: `--color-paper`, border `0.5px solid --color-border`
- Overlay behind: `rgba(42, 31, 20, 0.4)` — ink at 40% opacity
- Same headline + body + button typography as auth pages

### 7c. Navigation loading

Between page navigations (Next.js route transitions), the browser-native
loading bar (or Next.js's built-in `loading.tsx` per route) handles
this. We do not add a custom global progress bar.

Per-route loading states are specified in `PAGE_LAYOUTS.md` and in the
Sprint 2 design brief.

---

## 8. Equipment settings — loading, save success, save error

The `/equipment` page (Sprint 2 brief §1) has its own state set.

### 8a. Loading the page

When the page mounts and is fetching `GET /api/equipment`:

- All chips render in their **off** state at 50% opacity
- No separate skeleton — the chips themselves are the placeholders
- "Save changes" button is disabled

Once the GET resolves:

- Chips fade to full opacity (`--motion-fade`, 280ms)
- Chips matching the user's saved appliances flip to selected state
- "Save changes" stays disabled (no changes to save yet)

### 8b. Save success

After `PUT /api/equipment` succeeds:

#### Treatment

Status line below the save button:

```
                  Saved.
```

#### Tokens

- `font-display text-deck italic text-ink-muted`
- Centered
- Auto-clears after 2 seconds OR when the user changes a chip again
- No checkmark, no toast — quiet acknowledgment

### 8c. Save error

If `PUT /api/equipment` fails:

#### Copy

> "We couldn't save that. Try again."

#### Tokens

- Same position as 8b (below the save button, centered)
- Color: `--color-accent-strong`
- Stays visible until user retries
- Save button is re-enabled immediately

### Accessibility (all 8a–8c)

- Loading state: chips are `aria-disabled="true"` while at 50% opacity
- Save status line: `role="status"` for success, `role="alert"` for error
- Headline announces page-level changes via `aria-live="polite"`

---

## State implementation summary

For every page, the dev should ship:

| Page | Empty | Loading | Error |
|---|---|---|---|
| `/library` | §1 (warm moment) | §2a (skeleton) | (no error state — falls back to "trouble loading" generic) |
| `/library?q=…` | §2b (search empty result) | §2c (dimmed list) | (same as above) |
| `/recipes/[id]` | n/a (would be 404) | embedded skeleton | §3a, §3b |
| `/import` | n/a (idle is the empty state) | streaming itself is the loading | §4a–§4i (errors); §4j (reused) is success-feedback |
| `AdaptPanel` (inline on recipe detail) | idle state in component | "Adapting…" pulse on button | §5a–§5d |
| `/equipment` | n/a (chips own off state) | §8a (chips at 50%) | §8c |
| `/login`, `/register` | n/a | button "Signing in…" | §6a–§6d |
| (global) | n/a | n/a | §7a (offline), §7b (session) |

Components likewise have their own state requirements — see
`COMPONENT_SPECS.md`. This file is the *page-level* state spec.

---

## Voice consistency check

All error/empty/loading copy in this file follows `REGISTER.md` §7
voice: calm, second-person, slightly old-fashioned, never twee.

If the dev encounters new error scenarios not covered here and writes
fallback copy, it must match this voice. When unsure, file it back to
`[UI/UX]`.

Forbidden in copy:

- ❌ "Oops!" / "Whoops!" / "Yikes!"
- ❌ Emoji in error text (✨ ❌ 🚨)
- ❌ "Don't worry"
- ❌ "Houston, we have a problem"
- ❌ Exclamation marks in error states
- ❌ "Something went wrong" as the *only* error message — always
  follow with what the user can do

---

## Authority

This file is owned by **[UI/UX]**. New error scenarios, new empty states,
or significant copy changes are design decisions — file back to `[UI/UX]`.
The dev does not invent error copy; if a new error case
appears that this file doesn't cover, that's a question, not an
improvisation.

---

## Changelog

| Date | Change | Trigger |
|---|---|---|
| 2026-04-29 | Initial lock — Sprint 0 | Founder approved register |
| 2026-05-01 | §2 added 2b (search empty) and 2c (search dimmed) | Sprint 2 task F3 |
| 2026-05-01 | §4 added Note on streaming clarifying progressive-phase model | CTO Sprint 1 review #5 |
| 2026-05-01 | §4b paste-recipe-text flow noted as post-MVP | Endpoint not implemented in Sprint 2 |
| 2026-05-01 | §5 replaced standalone-adapter error states with inline AdaptPanel error states | Sprint 2 brief §2 |
| 2026-05-01 | §8 Equipment settings states added | Sprint 2 task F1 |
| 2026-05-02 | §4 added states 4f (text validation), 4g (non-recipe text), 4h (YouTube no-recipe), 4i (YouTube unavailable), 4j (reused dedupe). §4b paywall CTA refreshed from post-MVP to live. | Sprint 3 task U1 |
