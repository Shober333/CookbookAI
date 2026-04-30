# Component Specs — CookbookAI

> **Status:** Locked — Sprint 0
> **Owner:** [UI/UX] (Alice)
> **Reads:** `REGISTER.md` and `UI_KIT.md` first.
> **Audience:** `[DEV:frontend]` agent or human dev implementing the UI.

This file specifies the eight CookbookAI components: anatomy, states,
props, accessibility, and copy. **No TSX is included** — implementation
is the dev's authoring layer. All token references trace to
`UI_KIT.md`.

If a dev finds a state, prop, or behavior not specified here, that is a
design question — file it back to Alice, do not improvise.

---

## Index

1. `RecipeListItem` — library row
2. `RecipeDetail` — full recipe page
3. `ServingScaler` — stepper for serving count
4. `UnitToggle` — metric / imperial switch
5. `ImportForm` — URL paste + AI streaming
6. `EquipmentChip` — toggle for equipment in adapter
7. `AdaptDiff` — old/new step comparison
8. `Topbar` — app navigation bar

---

## 1. RecipeListItem

The library is a list of these. Editorial discipline: it is a *table of
contents*, not a card grid. See `REGISTER.md` Rule 3.

### Anatomy

A row with three columns at desktop, stacked at mobile.

```
[ Title (Fraunces 500, text-body)            ] [ Meta ] [ Tags ]
[ Sub-title / deck (Fraunces italic, text-deck) ]
```

| Slot | Token | Notes |
|---|---|---|
| Title | `text-body`, `font-display`, weight 500, `--color-ink` | One line; truncate with ellipsis |
| Sub-title | `text-body-sm`, `font-display` italic, `--color-ink-muted` | One line; optional |
| Meta column | `text-ui-sm`, `font-ui`, `--color-ink-faint` | "4 servings · 25 min" |
| Tags column | `text-tag` chips | Right-aligned at desktop |
| Row separator | `0.5px solid --color-border-soft`, bottom only | Last item in list has no border |

### Layout

- **Mobile (< 768px):** Single column. Title and sub-title on top, then a row below with meta and tags. Vertical padding 14px. Tap target ≥ 44px high.
- **Tablet (≥ 768px):** Title column flexes, meta column 90px, tags column 110px. Padding 12px vertical.
- **Desktop (≥ 1024px):** Same as tablet; container widens to `--measure-wide` (880px). Centered.

### States

| State | Visual |
|---|---|
| Default | Bottom border `--color-border-soft`, no background |
| Hover | Bottom border becomes `--color-accent`, content shifts right by 6px (transition 150ms ease-out). No background change. |
| Focus (keyboard) | 2px terracotta focus ring on the entire row, 1px offset |
| Active / pressed | No additional state (links go immediately) |

### Props

```
- recipe: { id, title, subtitle?, servings, totalMinutes, tags, isAdapted, sourceUrl }
- onClick?: handler — defaults to navigation to /recipes/[id]
```

The `isAdapted` flag controls whether an `Adapted` tag (terracotta) appears.

### Accessibility

- Wrap as `<a href="/recipes/[id]">` so keyboard nav works natively
- `aria-label` is auto-derived: `"${title}, ${servings} servings, ${minutes} minutes"`
- Tag list inside is `<ul role="list">` with `<li>` per tag

### Copy rules

- Servings: "4 servings", "1 serving" (singular handled), "24 cookies" for items where the unit is not "serving" — store the unit alongside the count
- Time: ≤ 60 min → "25 min"; ≥ 60 min → "1 hr 30 min"; ≥ 4 hr → "4 hr"
- Source domain only (`nytimes.com`), not full URL — strip `www.` and path

---

## 2. RecipeDetail

The full recipe view. The most warmth-allowed screen in the product — exactly **one** earned warm moment (the margin note). See `REGISTER.md` Rule 2 and `UI_KIT.md` §10.

### Anatomy

```
┌─ Eyebrow (terracotta uppercase) ─────────────┐
│ Display title (Fraunces 500, text-display-lg) │
│ Deck line (Fraunces italic, text-deck)        │
│ Byline (Inter, text-ui-sm, ink-faint)         │
├──────────────────────────────────────────────┤
│ [Stepper] [Unit Toggle]      [Adapt button]   │
├──────────────────────────────────────────────┤
│ INGREDIENTS                          ┌────────┐
│ 400 g  spaghetti                     │ margin │
│ 120 g  pecorino, grated              │ note   │
│ ...                                  │ (Caveat)│
│                                      └────────┘
│ METHOD
│ i.   Bring water to a boil...
│ ii.  Toast the pepper...
│ iii. Add the butter...
│ iv.  Toss off heat...
└──────────────────────────────────────────────┘
```

### Layout

- **Mobile:** single column at `--measure` (620px), effectively full viewport with 20px gutters. Margin note moves *below* the deck line, in-flow, slightly indented and rotated.
- **Tablet (≥ 768px):** still single column, margin note inline at the right of the controls bar.
- **Desktop (≥ 1024px):** single column at `--measure` (620px), centered. Margin note absolutely positioned in the right margin (`right: -6px; top: 12px; transform: rotate(3deg)`). Ingredients list goes 2-column with `column-rule: 0.5px solid --color-border-soft`.

### States

| Page state | Visual |
|---|---|
| Loading | Skeleton: `text-display-lg` height block (60% width) for title; two `text-deck` blocks for deck. Ingredient list shows 5 skeleton rows. Method shows 3 skeleton paragraphs. Skeletons use `--color-border-soft` background, no animation. |
| Loaded | All content rendered, controls active |
| Error (fetch failed) | See `STATES.md` §3 |

### Props

```
- recipe: full Recipe object (title, deck, ingredients, steps, sourceUrl, ...)
- marginNote?: string — optional Caveat note. If absent, no margin note.
- onAdaptClick: handler
```

`marginNote` is data-driven — if null/empty, the margin note slot is hidden entirely. Don't fall back to a default.

### Step number rendering

Method steps use Roman numerals — `i. ii. iii. iv. v.` (lowercase, with period). Computed at render time, not stored. Style:

- `font-display` italic, `--color-accent`, `text-body` size, `min-width: 22px` for alignment

### Margin note

The single warm moment. Strict rules:

- Caveat 500 (`--font-hand`), `text-hand` (16px), `--color-accent`
- `max-width: 110px`
- `transform: rotate(3deg)` on desktop (in-flow on mobile, no rotation)
- `aria-hidden="true"` — decorative; data is conveyed elsewhere
- Includes a small `↓` mark above the text

### Accessibility

- Page title (`<h1>`) is the recipe title
- Method steps are an `<ol>` with `list-style: none` and CSS-counter for the Roman numerals
- The `<ol>` uses `list-style-type: lower-roman` as a fallback for non-CSS contexts

---

## 3. ServingScaler

Stepper for adjusting recipe yield. Live re-renders all ingredient amounts on change.

### Anatomy

```
[ Serves ]  [ − | 4 | + ]
```

| Slot | Token |
|---|---|
| "Serves" label | `text-eyebrow`, `font-ui`, `--color-ink-faint` |
| Stepper container | inline-flex, `0.5px solid --color-ink`, `--radius-none` |
| − / + buttons | `font-display` 500, `text-body`, padding `3px 10px`, color `--color-ink` |
| Center value | padded `3px 10px`, vertical dividers `0.5px solid --color-ink` either side, `text-body`, `font-feature-settings: "tnum"` |

### States

| State | − button | + button | Center |
|---|---|---|---|
| Default | text ink, transparent bg | same | text ink |
| Hover | bg ink, text paper | same | n/a |
| Pressed | scale(0.96) | same | n/a |
| Disabled (at min/max) | ink at 30%, no hover | same | unchanged |
| Focus | 2px terracotta ring on the whole stepper | | |

### Props

```
- value: number
- min: number  // default 1
- max: number  // default 12
- onChange: (next: number) => void
```

### Behavior

- Clamps to [min, max]
- Disabled state on − when value === min, on + when value === max
- Triggers `onChange` synchronously; parent re-derives all ingredient amounts and re-renders

### Keyboard

- ↑ / ArrowUp: increment (when stepper is focused)
- ↓ / ArrowDown: decrement
- Space / Enter on − or +: same as click
- Tab moves focus to next control (UnitToggle)

### Accessibility

- Stepper container has `role="group"` and `aria-label="Servings"`
- Center value has `aria-live="polite"`
- − button: `aria-label="Decrease servings"`
- \+ button: `aria-label="Increase servings"`

### Ingredient re-rendering rules

When value changes from baseline `B` to new `N`:

- New amount = `original × (N / B)`
- Round to: whole number for grams over 50, 1 decimal for grams under 50, 1 decimal for tsp/tbsp, whole for cups
- "to taste" amounts stay "to taste"
- Display rule: drop trailing `.0` (so `2.0 tsp` → `2 tsp`)

Rounding logic lives in a utility, not in this component.

---

## 4. UnitToggle

Metric ↔ Imperial switch. Re-renders all ingredient amounts on toggle.

### Anatomy

```
metric | imperial
```

Two text buttons, side by side. No background fill. The active one is underlined in terracotta.

| Slot | Token |
|---|---|
| Buttons | `font-ui`, `text-ui-sm`, lowercase |
| Inactive | `--color-ink-faint` |
| Active | `--color-ink`, weight 500, 1px bottom border `--color-accent` |
| Padding | `3px 10px` |

### States

| State | Visual |
|---|---|
| Default | Both buttons visible; one is "active" (underlined terracotta) |
| Hover (inactive) | Color shifts to `--color-ink` |
| Focus | 2px terracotta ring on focused button |

### Props

```
- value: 'metric' | 'imperial'
- onChange: (next) => void
```

### Conversion rules

When switching to imperial:
- `g` → `oz` (divide by 28.35, round to 1 decimal)
- `kg` → `lb` (divide by 0.4536, round to 1 decimal)
- `ml` → `fl oz` (divide by 29.57, round to 1 decimal)
- `l` → `qt` (divide by 0.946, round to 2 decimals)
- `tsp`, `tbsp`, `cup`, count units (whole eggs, etc.) stay unchanged

Conversion is lossy round-tripping — we do not preserve original imperial values, since the source is metric in the recipe model.

### Accessibility

- Container has `role="group"` and `aria-label="Units"`
- Each button has `aria-pressed="true|false"`

---

## 5. ImportForm

URL paste + streaming AI extraction. The streaming itself is the warmest moment in the import flow — see `REGISTER.md` Rule 2.

### Anatomy

```
┌─ EYEBROW: "Add a new one" ──────────────┐
│ Display headline (Fraunces 500, text-display-md) │
│ Deck line (Fraunces italic)               │
│                                            │
│ [ URL input field, full width ]            │
│ [    Bring it in (primary button)    ]    │
│                                            │
│ ┌─ Streaming box (appears on submit) ──┐ │
│ │ [pulse] Reading the page…             │ │
│ │ ...streamed lines fade in...          │ │
│ │ ✓ Recipe ready — save to library      │ │
│ └────────────────────────────────────┘ │
└──────────────────────────────────────────┘
```

### Layout

- Container width: `--measure-narrow` (480px), centered
- Vertical center on tall viewports, top-aligned ~30px below topbar otherwise
- Input + button stack with 8px gap
- Streaming box appears below with 26px top margin

### Sub-components

#### URL input
- See `UI_KIT.md` §8 Inputs for tokens
- Placeholder: "Paste a recipe URL or a YouTube link"
- Validates as URL on blur — if invalid, shows error helper text below in `--color-accent-strong`

#### "Bring it in" button
- Primary variant
- Full width, height 38px
- Disabled when input is empty or invalid

#### Streaming box
- Padding `18px 20px`, border `0.5px solid --color-border`
- Background `--color-paper-sunken`, `--radius-sm`, min-height 160px
- **Status header:** small terracotta pulse dot + status text in `text-eyebrow` color `--color-accent`
- **Streamed lines:** opacity fade-in (`--motion-fade-slow`), staggered by `--motion-stream-line` (~420ms)

### States

| State | Visual |
|---|---|
| Idle | Input + button only. No streaming box. |
| Submitting (streaming) | Streaming box visible, pulse animating, status updating, lines streaming in |
| Success | Pulse stops. Status: "Done". Final line: "✓ Recipe ready — save to library" with a save action |
| Error | See `STATES.md` §4 — error inline below streaming box |

### Streaming status copy

Status text rotates as parsing progresses:

1. "Reading the page…" — initial fetch
2. "Finding the recipe…" — title + meta extracted
3. "Reading ingredients…" — ingredient parsing
4. "Reading the method…" — step parsing
5. "Done" — final state

Status comes from the AI streaming response; the UI shows the latest message. The dev should not invent intermediate states.

### Props

```
- onSubmit: (url) => Promise<StreamingResponse>
- onSuccess: (recipe) => void
```

### Accessibility

- Streaming box has `aria-live="polite"`, `aria-atomic="false"`
- Status text inside has `role="status"`
- Pulse dot is `aria-hidden="true"`
- "Recipe ready" final state announces work complete

### Reduced motion

When `prefers-reduced-motion: reduce`, the streaming box appears in final state (all lines visible at once). The pulse dot still appears during fetch but does not animate (steady opacity 1).

---

## 6. EquipmentChip

Toggle for equipment in the kitchen-adapter screen. Selected state is the AI signal — terracotta.

### Anatomy

```
[ ✓ ] Stovetop
```

A horizontal button with a circular check indicator on the left and the equipment name on the right.

| Slot | Token |
|---|---|
| Container | `0.5px solid --color-border`, `--radius-sm`, padding `10px 12px` |
| Check circle | 12×12px, `border-radius: 50%`, `0.5px solid --color-border-strong` |
| Name | `font-display` italic when off, `font-display` regular weight 500 when on, `text-body-sm` |

### States

| State | Border | Background | Check | Text |
|---|---|---|---|---|
| Off | `--color-border` | transparent | empty circle | `--color-ink-muted`, italic |
| Off + Hover | `--color-accent` | transparent | unchanged | unchanged |
| On | `--color-accent` | `--color-accent-bg` | filled terracotta circle with white `✓` | `--color-ink`, regular |
| Focus | 2px terracotta ring outside container | | | |

### Props

```
- equipment: string
- isSelected: boolean
- onToggle: () => void
```

### Layout

- 3-column grid at all viewports
- Gap 8px
- Container max-width `--measure` (620px), centered
- Each chip is `min-height: 44px`

### Accessibility

- `<button type="button">` with `aria-pressed="true|false"`
- Check circle is `aria-hidden="true"`

---

## 7. AdaptDiff

Old/new step comparison. Precise — no warm moments.

### Anatomy

```
┌─ "Preview · adapted method" ─────────────────┐
│ i.   ̶H̶e̶a̶t̶ ̶t̶h̶e̶ ̶a̶i̶r̶ ̶f̶r̶y̶e̶r̶...
│      Heat the oven to 230°C / 450°F. Spread...
│
│ ii.  Whisk the peanut butter, lime juice...
│
│ iii. ̶T̶o̶s̶s̶ ̶t̶h̶e̶ ̶h̶o̶t̶ ̶t̶o̶f̶u̶...
│      Toss the hot, oven-roasted tofu...
└──────────────────────────────────────────────┘
```

Each step shows:
- Roman numeral in italic terracotta
- *If changed:* old text struck through above, new text below
- *If unchanged:* just the (unchanged) step in body color

### Tokens

| Slot | Token |
|---|---|
| Container max-width | ~580px |
| Section header | `text-eyebrow`, `--color-accent`, centered, with top border `0.5px solid --color-border` |
| Step number | `font-display` italic, `--color-accent` |
| Old text | `text-body-sm`, `--color-ink-ghost`, `text-decoration: line-through` |
| New text | `text-body`, `--color-ink` |
| Unchanged text | `text-body`, `--color-ink` |

### Layout

- Old text appears *first* (above), new text *below*
- Old + new wrapped in a single block per step; vertical gap 4px
- Steps separated by 8px padding-top/bottom

### Props

```
- steps: Array<{
    n: string  // 'i', 'ii', 'iii', ...
    old?: string
    new: string
  }>
```

### Accessibility

- Section wrapped in `<section aria-label="Adapted method preview">`
- Old text uses `<del>`, new text uses `<ins>`

---

## 8. Topbar

App navigation. Persistent across all authenticated routes.

### Anatomy

```
[● CookbookAI]  [Library] [Equipment]   [search]   [+ Import]
```

| Slot | Token |
|---|---|
| Container | `--topbar-height` (52px), `0.5px solid --color-border` bottom |
| Brand mark | 6×6px circle in `--color-accent`, 8px right margin |
| Brand text | `font-display` italic, weight 500, 17px, `--color-ink` |
| Nav buttons | `font-ui`, `text-ui`, padding `5px 10px`, `--radius-sm` |
| Active nav | weight 500, `--color-ink` |
| Inactive nav | `--color-ink-muted` |
| Search field | inline, max-width 280px, height 28px |
| Import button | primary variant, `text-ui` |

### Layout

- **Mobile (< 768px):** Brand left, Import button right. Nav and search collapse — see Open Question below. Sticky.
- **Tablet (≥ 768px):** Brand, nav, [grow], search (max 240px), Import button.
- **Desktop (≥ 1024px):** Brand, nav, search (centered, max 280px), Import button. Search field shows `⌘K` kbd hint.

### States

| State | Visual |
|---|---|
| Default | All controls visible per breakpoint |
| Scrolled | No change (no shadow, no shrink) |
| Search focused | Search field border becomes `--color-accent` |

### Search field behavior

- The search field is a *trigger*, not a real input
- Clicking it (or pressing ⌘K anywhere) opens a search overlay (separate `SearchOverlay` component, to be specified later)
- Visually it presents as an input but is rendered as a button

### Open Question (for Founder)

**Mobile collapse strategy:** options are:

1. **Hamburger** — collapse nav into a menu, show a search icon button
2. **Two-row** — first row: brand + import; second row: search field full width with nav links inline
3. **Search button only** — drop inline nav entirely on mobile; library is the default route, equipment reachable from the library page header

**My recommendation: Option 3.** Two routes is too few to justify a hamburger; minimal topbar on mobile preserves screen real estate for the recipe (which is what users came for).

This is a design decision the Founder should approve before implementation. **Do not implement either option without sign-off.**

### Accessibility

- Brand is `<a href="/">` wrapping mark + text
- Nav is `<nav aria-label="Primary">` with `<ul role="list">`
- Active nav item has `aria-current="page"`
- Import button is `<button>`, not a link

---

## Spec compliance checklist

When `[DEV:frontend]` finishes a component:

- ☐ All token references trace to `UI_KIT.md` (no hardcoded hex/font/spacing)
- ☐ All states from this spec are implemented
- ☐ Props match the signature in this spec exactly
- ☐ Accessibility requirements are met
- ☐ Mobile (375px) layout works without horizontal scroll
- ☐ Tap targets ≥ 44×44px on mobile
- ☐ `prefers-reduced-motion` is respected
- ☐ Copy matches register voice (`REGISTER.md` §7)

Components failing any item are flagged 🟡 **Bad** (rule drift) or 🔴 **Ugly** (blocker).

---

## Authority

This file is owned by **[UI/UX] (Alice)**. Adding a component, removing one, or changing a contract is a design decision — file it back to Alice. Devs may not invent components or props that aren't specified here. New features get new specs.
