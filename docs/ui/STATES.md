# States — CookbookAI

> **Status:** Locked — Sprint 0
> **Owner:** [UI/UX] (Alice)
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
2. Library — loading state
3. Recipe detail — error states (fetch fail, not found)
4. Import — error states (invalid URL, paywall, parse fail, timeout)
5. Equipment adapter — error states (rewrite fail)
6. Auth — error states (invalid credentials, network, validation)
7. Global — offline indicator, session expired

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

## 2. Library — loading state

Skeleton list. No animation, no shimmer.

### Layout

The page header renders normally (the count headline shows "Loading
your library…" instead of the dynamic count). Below the header rule:
six skeleton list rows.

### Skeleton row

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

### Why no shimmer animation

Shimmer is a tech-product convention. CookbookAI is editorial. Static
skeleton blocks read calm; shimmer reads anxious. The 200–500ms loading
delay is short enough that users won't suspect a stall. If it ever
becomes long enough to feel stuck, that's an engineering issue, not a
UX bandage.

### Loading state copy in header

- Eyebrow: "Your library"
- Headline (during load): "Loading your library…"
- Sub: (hidden during load)

Once data resolves, headline updates to the real count.

### Reduced-motion

No motion to suppress. State is already static.

### Accessibility

- Skeleton container has `aria-busy="true"` and `aria-live="polite"`
- Once loaded, the page announces the count to screen readers via the
  updated headline

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

Clicking this swaps the URL input for a textarea (full width,
min-height 200px, same paper background, same focus styling). The
"Bring it in" button stays. Submitting calls a different parsing
endpoint (text → structured recipe).

### 4c. No recipe found at URL

Page exists but has no extractable recipe (e.g., a blog post without
structured recipe data).

#### Copy

> **Status:** "No recipe here" (in `--color-accent-strong`)
>
> Body: "We couldn't find a recipe at that link. Make sure it's a
> page with ingredients and steps — or paste the recipe text directly."
>
> CTA: "Try another link" (clears input, returns to idle) and "Paste
> recipe text instead →" (as in 4b)

### 4d. AI parse failure

The AI extracted something but produced output that fails our schema.

#### Copy

> **Status:** "Something went wrong"
>
> Body: "We had trouble structuring this recipe. It happens occasionally
> — try again, or paste the recipe text directly."
>
> CTA: "Try again" and "Paste recipe text instead →"

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

---

## 5. Equipment adapter — error states

### 5a. Rewrite fail

The AI couldn't generate adapted steps with the selected equipment.

#### Treatment

Inline below the "Rewrite steps" button (above where the diff would
appear).

#### Copy

> **Status:** "We couldn't rewrite this." (in `--color-accent-strong`)
>
> Body: "The combination of equipment you've selected might not work
> for this recipe. Try adding the original equipment back, or try
> again."
>
> CTA: "Try again"

### 5b. No equipment selected

The "Rewrite steps" button is disabled (per `PAGE_LAYOUTS.md` §5). No
error state needed — the disabled state explains itself.

For screen readers, the button has `aria-describedby` pointing to a
visually-hidden `<p>`: "Select at least one piece of equipment to
rewrite the recipe."

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

Per-route loading states are specified in `PAGE_LAYOUTS.md` and
referenced above (§2 library, §3 recipe detail).

---

## State implementation summary

For every page, the dev should ship:

| Page | Empty | Loading | Error |
|---|---|---|---|
| `/library` | §1 (warm moment) | §2 (skeleton) | (no error state — falls back to "trouble loading" generic) |
| `/recipes/[id]` | n/a (would be 404) | embedded skeleton | §3a, §3b |
| `/import` | n/a (idle is the empty state) | streaming itself is the loading | §4a–§4e |
| `/recipes/[id]/adapt` | (no chips selected — disabled button) | "Rewriting…" button state | §5a |
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
Alice.

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

This file is owned by **[UI/UX] (Alice)**. New error scenarios, new
empty states, or significant copy changes are design decisions — file
back to Alice. The dev does not invent error copy; if a new error case
appears that this file doesn't cover, that's a question, not an
improvisation.
