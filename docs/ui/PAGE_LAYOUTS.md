# Page Layouts — CookbookAI

> **Status:** Locked — Sprint 0 (updated Sprint 3)
> **Owner:** [UI/UX]
> **Reads:** `REGISTER.md`, `UI_KIT.md`, `COMPONENT_SPECS.md` first.
> **Audience:** `[DEV:frontend]` agent or human dev.

This file defines how components compose into pages. It covers layout,
navigation, and responsive behavior. Per-state content (loading, empty,
error) lives in `STATES.md`.

The five pages:

1. `/login` and `/register` — auth
2. `/library` — recipe list
3. `/recipes/[id]` — recipe detail
4. `/import` — URL paste + AI streaming
5. `/recipes/[id]/adapt` — equipment adapter

---

## 0. Global layout primitives

### Authenticated shell

Every authenticated route uses a single shared layout:

```
┌─────────────────── Topbar (52px) ──────────────────┐
│ [Brand]  [Nav]              [Search]   [+Import]   │
├────────────────────────────────────────────────────┤
│                                                    │
│              <route content>                       │
│                                                    │
│           (no footer, no sidebar)                  │
│                                                    │
└────────────────────────────────────────────────────┘
```

The shell renders the `Topbar` component (see `COMPONENT_SPECS.md` §8).
Below it: a single content area, no sidebars, no footers. Content fills
the remaining viewport with `min-height: calc(100vh - 52px)`.

Background `--color-paper-frame` appears on the body; the content card
inside uses `--color-paper`. Together this creates the subtle paper-on-
paper feel from the demo.

In Next.js App Router this is `app/(app)/layout.tsx` — a route group
that wraps `library`, `recipes`, `import`, and `adapt`. Auth routes
(`/login`, `/register`) use a separate, minimal layout — see §1.

### Unauthenticated shell

Login and register pages get **no topbar**. The page is a centered
form on a clean cream background. See §1.

### Page padding

| Viewport | Horizontal | Vertical |
|---|---|---|
| Mobile | `--page-pad-x-mobile` (20px) | `--page-pad-y` (26px) |
| Desktop | `--page-pad-x-desktop` (28px) | `--page-pad-y` (26px) |

Apply to the page content wrapper, not to the topbar (which has its
own internal padding).

---

## 1. Auth pages — `/login` and `/register`

The two auth pages share a layout. Form fields differ.

### Layout

```
┌────────────────────────────────────────────────┐
│                                                │
│              [Brand mark + name]               │
│                                                │
│                                                │
│         Display headline (Fraunces)            │
│         Deck line (italic Fraunces)            │
│                                                │
│         ┌─────────────────────────┐            │
│         │ Email                   │            │
│         └─────────────────────────┘            │
│         ┌─────────────────────────┐            │
│         │ Password                │            │
│         └─────────────────────────┘            │
│         [   Sign in (primary)    ]            │
│                                                │
│         Link to register / login               │
│                                                │
└────────────────────────────────────────────────┘
```

### Tokens

- Background: `--color-paper`
- Form container: max-width `--measure-narrow` (480px), centered both axes
- Brand: 32px from top of viewport on mobile, 64px on desktop, centered
- Headline + deck: centered, 18px gap to form
- Form fields: stacked, 8px gap, full width
- Primary button: full width, height 38px, 12px gap above
- Footer link: `text-ui-sm`, `--color-ink-muted`, centered, 22px gap above button

### Headlines

#### `/login`

- Eyebrow: "Welcome back"
- Headline: "Pick up where you left off."
- Deck: *No deck — just the headline.*
- Field 1: Email
- Field 2: Password
- Button: "Sign in"
- Footer link: "New here? Create an account →"

#### `/register`

- Eyebrow: "Get started"
- Headline: "Bring recipes home."
- Deck: *Free, while we're getting started.*
- Field 1: Name (optional)
- Field 2: Email
- Field 3: Password (with helper: "8 characters or more")
- Button: "Create account"
- Footer link: "Already have one? Sign in →"

### Layout — mobile

The form is centered horizontally with 20px gutters. Vertically, it
top-aligns ~64px below the brand mark to keep the keyboard from pushing
content. Brand stays at top, never sticky.

### States

- Default: as above
- Submitting: button shows "Signing in…" / "Creating account…", disabled
- Error: helper text below the failing field (or above the button for
  general errors) in `--color-accent-strong`
- Success: navigate to `/library`

### Accessibility

- Form is a `<form>` with `onSubmit` (not separate button click handler)
- Each field has a visible `<label>` (don't use placeholder-only labels)
- Password field has type=`password` with a "show" toggle
- Error messages are linked via `aria-describedby` on the input
- The brand mark is decorative (`aria-hidden`); the brand text is the
  page's primary heading

### Routing

- Protected routes redirect here when no session
- After login: redirect to original destination (default `/library`)

---

## 2. Library — `/library`

The most-visited page. Reading-mode, not crafting-mode. See
`REGISTER.md` Rule 3.

### Layout

```
┌───────────────────── Topbar ───────────────────────┐
├────────────────────────────────────────────────────┤
│                                                    │
│  Eyebrow: "Your library"                           │
│  Headline: "Twenty-four recipes, kept carefully."  │
│  Sub: "Most recently added · sorted by you"        │
│  ───────────────────────────────────────────────   │
│  RecipeListItem                                    │
│  RecipeListItem                                    │
│  RecipeListItem                                    │
│  ...                                               │
│                                                    │
└────────────────────────────────────────────────────┘
```

### Tokens

- Container: `--measure-wide` (880px), centered
- Page header: 22px bottom margin, ends in 0.5px `--color-border` rule
- List: just a stack of `RecipeListItem` components

### Page header

| Slot | Token |
|---|---|
| Eyebrow | `text-eyebrow`, `--color-accent` |
| Headline | `text-display-md`, `font-display` 500, `--color-ink`, "{count} {recipes/recipe}, kept carefully." |
| Sub | `text-deck`, `font-display` italic, `--color-ink-muted`, "{sort description}" |

The headline copy is dynamic on count. For 1 recipe: "One recipe, kept carefully." For 0: see `STATES.md` §1 (empty state).

### Sort and filter

**Not in MVP.** The library is sorted by most recently added. No filter
UI on the page. When count exceeds ~50 recipes, search via `⌘K` overlay
becomes the primary findability tool.

When sort/filter is added later (post-MVP), it lives as a small
secondary control row above the list, right-aligned, with `font-ui`
typography. Spec at that time.

### Mobile

- Container goes full width with 20px gutters
- Page header headline drops to `text-display-sm` (an additional scale
  to be defined when needed — for now use `text-display-md` and the
  natural reflow on small screens is acceptable)
- List items stack as defined in `COMPONENT_SPECS.md` §1

### Empty state

See `STATES.md` §1. Earned warm moment lives here.

### Loading state

See `STATES.md` §2.

### Equipment link (mobile-only)

Per the topbar Open Question (`COMPONENT_SPECS.md` §8): if Option 3 is
approved, the page header gets a small "Equipment" link below the sub
on mobile only:

```
Eyebrow: "Your library"
Headline: "Twenty-four recipes..."
Sub: "Most recently added"
[Manage equipment →]    ← mobile only, text-ui-sm, --color-ink-muted
```

---

## 3. Recipe Detail — `/recipes/[id]`

The full recipe page. Single column, editorial discipline. See
`COMPONENT_SPECS.md` §2.

### Layout

```
┌───────────────────── Topbar ───────────────────────┐
├────────────────────────────────────────────────────┤
│                                                    │
│         Eyebrow: "Italian · Pasta · NYT"           │
│         Display title                              │
│         Deck line                                  │
│         Byline                                     │
│         ─────────────────────────                  │
│         [Stepper] [Toggle]    [Adapt]              │
│         ─────────────────────────                  │
│                                                    │
│         INGREDIENTS                       ┌──────┐ │
│         Two-column ingredient list        │ note │ │
│                                           └──────┘ │
│                                                    │
│         METHOD                                     │
│         i.   First step paragraph                  │
│         ii.  Second step paragraph                 │
│         iii. Third step                            │
│                                                    │
└────────────────────────────────────────────────────┘
```

### Tokens

- Container: `--measure` (620px), centered
- Top spacing: `--page-pad-y` (26px) below topbar
- Header → controls: 14px gap (with one rule between)
- Controls → ingredients: 22px gap
- Ingredients → method: 22px gap
- Method step gap: 10px between steps

### Header section

Fully specified in `COMPONENT_SPECS.md` §2 *Anatomy* and *Step number rendering*.

### Controls bar

A horizontal row with three groups:

1. ServingScaler with "Serves" label
2. UnitToggle with "Units" label  
3. (right-aligned) "Adapt for my kitchen" button

On mobile (< 768px), this bar wraps. Order: ServingScaler, UnitToggle, then Adapt button on a new line below, full-width:

```
[Serves] [- 4 +]   [Units] metric|imperial

[      Adapt for my kitchen      ]   ← full width
```

### Margin note

The single warm moment per recipe. See `COMPONENT_SPECS.md` §2 *Margin
note*. Position depends on viewport:

- **Desktop:** absolute, right margin, rotated
- **Tablet:** inline at the right of the controls bar (no rotation)
- **Mobile:** in-flow below the byline, slight indent (12px from left
  edge of column), no rotation, max-width 75% of column

### Mobile considerations

- Headline: keep `text-display-lg` (32px) — it's the page's hero, scaling down weakens it
- Deck: keep `text-deck`
- Ingredients list: single-column on mobile (the 2-column layout is desktop-only)
- Method steps: full width, no column constraints; max-width naturally limited by container

### States

- Loading: see `COMPONENT_SPECS.md` §2 *States* and `STATES.md` §3
- Loaded: as above
- Error: see `STATES.md` §3
- "Adapting" (after Adapt clicked): navigates to `/recipes/[id]/adapt`,
  not an inline state

### Save / unsave

The "save to library" affordance after AI import lives on the import
flow, not the recipe detail. Once a recipe is in the library, there is
no "unsave" button on the detail page in MVP — deletion happens from
the library list (long-press on mobile, hover-reveal on desktop) or via
keyboard `⌘⌫`. **Spec for this interaction is deferred** — flagging it
as an open question.

### Print view (post-MVP)

Not in MVP. When added, it strips the topbar, controls, and margin note,
leaving just the typographic recipe content. Spec at that time.

---

## 4. Import — `/import`

URL or text paste + streaming. The streaming itself is the warmth. See
`COMPONENT_SPECS.md` §5.

**Sprint 03 update:** the page now offers two import modes — `link`
and `text`. The full mode-aware spec lives in
`docs/sprints/sprint_03/sprint_03_design_brief.md`. This section covers
the page-level layout; the brief governs mode behavior, copy, and the
new error/feedback states.

### Layout

```
┌───────────────────── Topbar ───────────────────────┐
├────────────────────────────────────────────────────┤
│                                                    │
│                                                    │
│              Eyebrow: "Add a new one"              │
│              Display: "Bring a recipe home."       │
│              Deck (italic)                         │
│                                                    │
│              [ link  |  text ]   ← mode switch     │
│                                                    │
│              [ URL input  OR  textarea ]           │
│              [ Bring it in (button) ]              │
│                                                    │
│              ┌─ Streaming box ──────┐              │
│              │ ...                   │              │
│              └───────────────────────┘              │
│                                                    │
└────────────────────────────────────────────────────┘
```

### Tokens

- Container: `--measure-narrow` (480px), centered horizontally
- Vertical: top-aligned at 64px below topbar at desktop; on mobile, 32px below topbar (keep above the fold)
- Header → mode switch: 22px gap
- Mode switch → input: 14px
- Input → button: 8px
- Button → streaming box (when shown): 26px

### Mobile

- Container goes full width with 20px gutters
- Top alignment 24px below topbar (keep input visible above keyboard when focused)
- Mode switch buttons sized for ≥ 44×44px tap targets (see brief §10)
- Textarea max height clamps to `min(50vh, 400px)` so submit stays visible above the keyboard

### Three-stage flow

1. **Idle** — mode switch + input/textarea + button. Streaming box absent.
2. **Submitting** — Streaming box mounts and animates. Mode switch,
   input, and button are all disabled. Button label changes to
   "Bringing it in…". Phase copy varies by mode and resolved source
   kind (web URL, text, YouTube link, YouTube description) — see brief
   §5.
3. **Success** — Streaming box shows final state. **Auto-navigate**
   to `/recipes/[id]` after 1.5s.
4. **Reused** — when the backend short-circuits via dedupe, the box
   shows a single quiet line and auto-navigates on the same timer.
   See brief §7.

Auto-navigate is the locked default. Founder confirmed (Sprint 1).

### Error states

See `STATES.md` §4. Errors now include:

- Invalid URL (4a)
- Paywall blocking extraction (4b — refreshed Sprint 03)
- No recipe at URL (4c)
- AI parse failure (4d)
- Network timeout (4e)
- Text-mode validation: blank or too short (4f — Sprint 03)
- Text-mode non-recipe (4g — Sprint 03)
- YouTube no recipe found (4h — Sprint 03)
- YouTube service unavailable / API key missing (4i — Sprint 03)

### Reduced motion

Per `COMPONENT_SPECS.md` §5 — streaming box appears in final state, no
fade staggering, pulse dot static. Mode switch has no animation by
default.

---

## 5. Equipment Adapter — `/recipes/[id]/adapt`

Equipment selection + AI rewrite + diff preview. See
`COMPONENT_SPECS.md` §§6–7.

### Layout

```
┌───────────────────── Topbar ───────────────────────┐
├────────────────────────────────────────────────────┤
│                                                    │
│              Eyebrow: "Make it yours"              │
│              Display: "Tell us what's in your..."  │
│              Deck                                  │
│                                                    │
│         ┌──────┐ ┌──────┐ ┌──────┐                │
│         │ chip │ │ chip │ │ chip │                │
│         └──────┘ └──────┘ └──────┘                │
│         ┌──────┐ ┌──────┐ ┌──────┐                │
│         │ chip │ │ chip │ │ chip │                │
│         └──────┘ └──────┘ └──────┘                │
│                                                    │
│              [ Rewrite steps ]                     │
│                                                    │
│         Preview · adapted method                   │
│         ─────────────────────────                  │
│         i.  ̶o̶l̶d̶                                  │
│             new                                    │
│         ii. unchanged                              │
│         iii. ̶o̶l̶d̶                                 │
│             new                                    │
│                                                    │
│              [ Save adaptation ]                   │
│                                                    │
└────────────────────────────────────────────────────┘
```

### Tokens

- Page header container: max-width `--measure-narrow` (480px) for
  centered headline + deck
- Equipment chip grid container: max-width `--measure` (620px), centered
- Chip grid: 3 columns, 8px gap (per `COMPONENT_SPECS.md` §6)
- "Rewrite steps" button: centered, accent variant, ~22px above the
  diff preview
- Diff preview container: max-width ~580px, centered
- "Save adaptation" button: centered, primary variant, 22px below diff

### Mobile

- Equipment grid stays 3-column at 375px (chips are narrow enough)
- Diff preview goes full width with 20px gutters
- "Rewrite steps" and "Save adaptation" buttons go full width, height 44px

### Two-stage flow

1. **Selection** — chips + "Rewrite steps" button. Diff preview absent.
2. **Preview** — diff preview appears (with a fade-in transition). User
   can re-toggle chips and re-rewrite, or save.

The preview persists until the user navigates away or saves. Re-rewriting
replaces the diff (with a fade transition).

### "Rewrite steps" button states

| State | Visual |
|---|---|
| Default (some chips selected) | Accent variant, "Rewrite steps" |
| Disabled (no chips selected) | Disabled accent (`--color-accent` at 30% opacity) |
| Loading (AI rewriting) | "Rewriting…" with the same pulse dot from streaming box, inline left |
| After preview shown | Re-enables, label stays "Rewrite steps" — re-clicking re-runs |

### Save adaptation

When clicked: persists the adapted version as a new "version" of the
recipe (per ARCHITECTURE.md), tags the library `RecipeListItem` with
`Adapted`, navigates to `/recipes/[id]` showing the adapted version.

The original is preserved per the PRD acceptance criteria. Switching
between original and adapted versions is **not in MVP** — flagging as
an open question for post-MVP. (UI hint: a small toggle in the recipe
detail header: "Original | Adapted".)

### Equipment list source

Equipment chips come from a fixed list in MVP:

`Stovetop, Oven, Air fryer, Slow cooker, Microwave, Instant Pot, Wok, Grill, Sous vide`

Ordered as shown — most-common first. **Not user-customizable** in
MVP. Backend stores user's selection on their profile so it persists
across recipes.

---

## Page transition behavior

No page transitions. Per `REGISTER.md` §6: pages snap. Browsers do this
well; we do not improve it by animating route changes.

---

## Scroll behavior

- Topbar is sticky on all authenticated routes
- No scroll-restoration tricks; let the browser handle it
- Long pages (recipe detail with 30+ steps): standard browser scroll
- No infinite scroll; no virtualization (library will be capped well
  under 1000 recipes for MVP)

---

## Loading states summary

Each page's loading state is specified in `STATES.md`. At a glance:

| Page | Loading approach |
|---|---|
| `/library` | Skeleton list rows, `--color-border-soft` blocks |
| `/recipes/[id]` | Skeleton title + deck + ingredients + method (no animation, just static skeleton blocks) |
| `/import` | Streaming box itself is the loading UI |
| `/recipes/[id]/adapt` | "Rewriting…" with pulse on the button; full-page skeleton on initial recipe load |
| `/login`, `/register` | Button shows "Signing in…" — no full-page skeleton |

---

## Authority

This file is owned by **[UI/UX]**. New pages, new layouts, or
significant restructuring is a design decision — file it back to
`[UI/UX]`.

When the dev encounters a layout question this file does not answer
(e.g., "what about a 4K display?", "what about RTL languages?"), they
file the question rather than improvise. RTL is flagged as an open
question for post-MVP — Hebrew/Arabic support would require substantial
revision to the typography system.
