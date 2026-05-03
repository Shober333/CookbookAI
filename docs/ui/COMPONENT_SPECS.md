# Component Specs — CookbookAI

> **Status:** Locked — Sprint 0 (updated Sprint 2, Sprint 3)
> **Owner:** [UI/UX]
> **Reads:** `REGISTER.md` and `UI_KIT.md` first.
> **Audience:** `[DEV:frontend]` agent or human dev implementing the UI.

This file specifies the CookbookAI components: anatomy, states, props,
accessibility, and copy. **No TSX is included** — implementation is
the dev's authoring layer. All token references trace to `UI_KIT.md`.

If a dev finds a state, prop, or behavior not specified here, that is a
design question — file it back to `[UI/UX]`, do not improvise.

---

## Index

1. `RecipeListItem` — library row
2. `RecipeDetail` — full recipe page
3. `ServingScaler` — stepper for serving count
4. `UnitToggle` — metric / imperial switch
5. `ImportForm` — URL paste + AI streaming
6. `EquipmentChip` — toggle for equipment selection
7. `AdaptDiff` — *deprecated*; spec retained for post-MVP
8. `Topbar` — app navigation bar
9. `AdaptPanel` — inline adapt flow on recipe detail (Sprint 2)

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
- recipe: { id, title, subtitle?, servings, totalMinutes, tags, adaptedSteps?, sourceUrl }
- onClick?: handler — defaults to navigation to /recipes/[id]
```

### Adapted tag (Sprint 2)

When `recipe.adaptedSteps !== null && recipe.adaptedSteps.length > 0`,
the tag list includes an extra `Adapted` chip at the end of the tag
column, in terracotta.

The `Adapted` chip uses the standard tag style with one variation:
color and border switch to `--color-accent` (the AI signal). Background
stays transparent. See `UI_KIT.md` §8 *Tag chips — Adapted variant*.

The chip is derived from the recipe data, not a separately stored
`isAdapted` flag. Don't introduce a redundant flag in the data model.

### Accessibility

- Wrap as `<a href="/recipes/[id]">` so keyboard nav works natively
- `aria-label` is auto-derived: `"${title}, ${servings} servings, ${minutes} minutes${isAdapted ? ', adapted' : ''}"`
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
│ [Stepper] [Unit Toggle]                       │
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
├──────────────────────────────────────────────┤
│ < AdaptPanel — see §9 >                      │
├──────────────────────────────────────────────┤
│ [ Download .md ]  [ Delete recipe ]           │
└──────────────────────────────────────────────┘
```

**Sprint 2 changes:** the "Adapt for my kitchen" button moved off the
controls bar and into a dedicated `AdaptPanel` section below the
method (see §9). The bottom of the page now hosts both the
`Download .md` and `Delete recipe` actions side by side.

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
- recipe: full Recipe object (title, deck, ingredients, steps, sourceUrl, adaptedSteps, ...)
- marginNote?: string — optional Caveat note. If absent, no margin note.
```

`marginNote` is data-driven — if null/empty, the margin note slot is hidden entirely. Don't fall back to a default.

`adaptedSteps` (when non-null) is consumed by the embedded `AdaptPanel` (§9). RecipeDetail itself doesn't render the adapted version.

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

### Bottom action row

- "Download .md" — ghost variant, see `SPRINT_02_SPECS.md` §4
- "Delete recipe" — ghost variant, existing
- Separator: `·` middle-dot in `--color-ink-faint` between the two
- Both are tertiary actions. Side-by-side at desktop, stacked at mobile.

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
- max: number  // default 12 (Sprint 1 dev raised to 99 — acceptable)
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

See Sprint 2 dev_todo.md task B5 for the canonical conversion table —
the dev owns those mechanics. This spec governs only the UI.

### Accessibility

- Container has `role="group"` and `aria-label="Units"`
- Each button has `aria-pressed="true|false"`

---

## 5. ImportForm

URL or text paste + progressive AI extraction. The progressive phase
indicators are the warmest moment in the import flow — see
`REGISTER.md` Rule 2.

**Sprint 03 update:** the form now supports two visible modes (`link`, `text`)
while the API payload uses `{ mode: "url", url }` for link mode.
selected via a switch above the input area. URL mode also routes
YouTube URLs through a description-first waterfall. The full Sprint 03
spec — mode switch, textarea, phase copy per mode, dedupe feedback,
new error states — lives at
`docs/sprints/sprint_03/sprint_03_design_brief.md`. This section
captures the locked anatomy and contracts; the brief governs Sprint 03
copy and behavior.

**Note on terminology:** this spec uses "streaming box" historically.
The actual implementation uses progressive phase indicators driven by
parsing the JSON response as it accumulates — not literal LLM token
streaming. The user-facing copy honestly describes phases ("Reading
the page…", "Finding the recipe…"), so the language is accurate.
See `STATES.md` §4 *Note on streaming* for more.

### Anatomy

```
┌─ EYEBROW: "Add a new one" ──────────────┐
│ Display headline (Fraunces 500, text-display-md) │
│ Deck line (Fraunces italic)               │
│                                            │
│ [ link  |  text ]    ← mode switch        │
│                                            │
│ [ URL input  OR  textarea ]                │
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
- Header → mode switch: 22px
- Mode switch → input: 14px
- Input + button stack with 8px gap
- Streaming box appears below with 26px top margin

### Sub-components

#### Mode switch (Sprint 03)
- Two-option selector: `link` | `text`. See Sprint 03 design brief §2.
- Variant of the `UnitToggle` visual pattern (no background fill, active
  underlined in terracotta), sized for primary control: `text-ui` (12px),
  padding `12px 18px` for ≥ 44×44px tap targets, `gap-2` between buttons
- `role="tablist"`, each button `role="tab"` with `aria-selected`
- Disabled (50% opacity, `aria-disabled="true"`) while submitting

#### URL input (`link` mode)
- See `UI_KIT.md` §8 Inputs for tokens
- Placeholder: "Paste a recipe URL or a YouTube link"
- Validates as URL on blur — if invalid, shows error helper text below in `--color-accent-strong`
- **Sprint 03 mobile floor:** `min-h-[44px]` on mobile, `md:h-[38px]` desktop — required by project DoD ≥ 44×44 tap target. Sprint-local override on the kit's 38px-both-viewports rule (kit reconciliation pending). See Sprint 03 brief §10.

#### Textarea (`text` mode, Sprint 03)
- Same tokens as the URL input (`--color-paper`, `0.5px solid --color-border-strong`,
  `--radius-sm`, focus ring), vertically scaling: `min-h-[200px]`,
  `max-h-[min(50vh,400px)]` mobile / `max-h-[480px]` desktop, `resize-y`
- Padding `12px 14px`, font `font-ui text-body`
- Placeholder: "Paste the recipe — ingredients, steps, and any notes."
- Validation: blank → "Paste a recipe to import."; < 40 non-whitespace
  chars → "Paste a bit more — we need ingredients and steps to work
  with." (see `STATES.md` §4f)

#### "Bring it in" button
- Filled accent variant (per UI_KIT.md §8 Buttons — Sprint 1 used filled, accepted)
- Full width, `min-h-[44px]` on mobile, `md:h-[38px]` desktop (Sprint 03 fix; project DoD requires ≥ 44×44 mobile tap target)
- Disabled when the active input is empty or invalid

#### Streaming box
- Padding `18px 20px`, border `0.5px solid --color-border`
- Background `--color-paper-sunken`, `--radius-sm`, min-height 160px
- **Status header:** small terracotta pulse dot + status text in `text-eyebrow` color `--color-accent`
- **Streamed lines:** opacity fade-in (`--motion-fade-slow`), staggered as new phases are detected
- Phase copy varies by mode and resolved source kind — see Sprint 03 design brief §5
- **Reused dedupe:** when the response includes `reused: true`, the box
  shows a single quiet line ("Already in our library — adding it to
  yours.") and auto-navigates on the standard 1.5s timer. See brief §7

### States

| State | Visual |
|---|---|
| Idle | Input + button only. No streaming box. |
| Submitting (working) | Streaming box visible, pulse animating, status updating, lines streaming in |
| Success | Pulse stops. Status: "Done". Final line: "✓ Recipe ready — save to library" with auto-navigation after 1.5s |
| Error | See `STATES.md` §4 — error inline below streaming box |

Internal `Status` enum should use `"working"` rather than `"streaming"`
to avoid confusion in code; user-facing copy is unaffected.

### Streaming status copy

Status text rotates as parsing progresses. The phase copy depends on
mode and resolved source kind:

- **URL mode (web URL):** "Reading the page…" → "Finding the recipe…"
  → "Reading ingredients…" → "Reading the method…" → "Done"
- **Text mode:** "Reading what you pasted…" → … (same tail) (Sprint 03)
- **YouTube link path** (`sourceKind: "youtube-link"`): "Looking up the
  video…" → "Following the link in the description… *(domain.com)*" →
  "Reading the page…" → … (Sprint 03). The trailing domain reads from
  `ImportResponse.sourceDomain`, in italic `--color-ink-faint`. If the
  field is absent or `null`, drop the hint and show bare phase copy —
  UI must not fabricate.
- **YouTube description path** (`sourceKind: "youtube-description"`):
  "Looking up the video…" → "Reading the description…" → … (Sprint 03)

Status comes from `detectPhase()` parsing the accumulating JSON string;
for YouTube paths the backend additionally signals the resolved
`sourceKind`. The UI shows the latest phase. The dev should not invent
intermediate states. Full phase tables in Sprint 03 design brief §5.

### Backend response contract (Sprint 03)

```ts
type ImportResponse = {
  recipe: Recipe
  reused?: boolean                     // B3 — true when dedupe short-circuited the AI call
  sourceKind?: "url" | "text" | "youtube-link" | "youtube-description"
  sourceUrl?: string | null            // B5 — resolved final source when ≠ submitted URL
  sourceDomain?: string | null         // B5 — display-normalized domain for the YouTube hint
}
```

Defaults: `reused = false`; `sourceKind` falls back to the user-chosen
mode when absent. `sourceUrl` and `sourceDomain` populate only when
the resolved source differs from the submitted URL (typically YouTube
external-link path). `sourceDomain` is normalized backend-side (strip
`www.`, path, query, fragment); UI must not fabricate it. See Sprint
03 design brief §6 for full rules.

### Props

```
- onSubmit: (payload: { mode: 'url' | 'text'; url?: string; text?: string }) => Promise<StreamingResponse>
- onSuccess: (recipe: Recipe) => void
```

The `mode` field on the payload is new in Sprint 03. URL mode sends
`{ mode: 'url', url }`; text mode sends `{ mode: 'text', text }`.

### Accessibility

- Streaming box has `aria-live="polite"`, `aria-atomic="false"`
- Status text inside has `role="status"`
- Pulse dot is `aria-hidden="true"`
- "Recipe ready" final state announces work complete
- Mode switch (Sprint 03): `role="tablist"`, each button `role="tab"`
  with `aria-selected`; Left/Right arrows move between tabs;
  Enter/Space activates; Tab moves focus into the input area
- Textarea (Sprint 03): linked to its error helper via `aria-describedby`
  when invalid; `aria-invalid="true"` on validation failure

### Reduced motion

When `prefers-reduced-motion: reduce`, the streaming box appears in final state (all lines visible at once). The pulse dot still appears during fetch but does not animate (steady opacity 1). Mode switch has no animation on toggle.

---

## 6. EquipmentChip

Toggle for equipment selection. Selected state is the AI signal —
terracotta. Used on the `/equipment` settings page (Kitchen settings,
see `SPRINT_02_SPECS.md` §1).

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
| Loading (page-level) | 50% opacity, no interaction | unchanged | unchanged | unchanged |

### Props

```
- equipment: string  // display label
- equipmentKey: string  // backend API key (e.g., "air_fryer")
- isSelected: boolean
- onToggle: () => void
- disabled?: boolean  // page-level loading state
```

### Backend keys (LOCKED — must match Zod schema)

The 8 valid `equipmentKey` values, per `dev_todo.md` Task B1:

| Display label | Backend key |
|---|---|
| Stovetop | `stovetop` |
| Oven | `oven` |
| Microwave | `microwave` |
| Air fryer | `air_fryer` |
| Slow cooker | `slow_cooker` |
| Grill | `grill` |
| Instant Pot | `instant_pot` |
| Blender | `blender` |

The UI shows the display label; the API stores the backend key. Don't
expose underscore-cased keys to the user. Don't render any chip whose
key isn't in this list.

The Sprint 0 list included "Wok" and "Sous vide" instead of "Blender."
The Sprint 2 list above is canonical and matches the API contract.

### Layout

- 3-column grid at all viewports
- Gap 8px
- Container max-width `--measure` (620px), centered
- Each chip is `min-height: 44px`

### Accessibility

- `<button type="button">` with `aria-pressed="true|false"`
- Check circle is `aria-hidden="true"`

---

## 7. AdaptDiff — *deprecated*

> **Status: deprecated for MVP.** Founder confirmed 2026-05-01.
>
> The Sprint 2 design contract (`SPRINT_02_SPECS.md` §2) replaces the
> standalone adapter page with an inline `AdaptPanel` (§9) that does
> **not** show a diff. The user has the original method visible above
> the panel; explicit diff styling competes with the original method
> visually rather than helping.
>
> This spec is retained for possible post-MVP use — e.g., a "compare
> versions" feature when a recipe has multiple saved adaptations.
> Until that need is real, do not implement.

### Anatomy (retained for reference)

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

### Tokens (retained for reference)

| Slot | Token |
|---|---|
| Container max-width | ~580px |
| Section header | `text-eyebrow`, `--color-accent`, centered, with top border `0.5px solid --color-border` |
| Step number | `font-display` italic, `--color-accent` |
| Old text | `text-body-sm`, `--color-ink-ghost`, `text-decoration: line-through` |
| New text | `text-body`, `--color-ink` |
| Unchanged text | `text-body`, `--color-ink` |

### Props (retained for reference)

```
- steps: Array<{
    n: string  // 'i', 'ii', 'iii', ...
    old?: string
    new: string
  }>
```

If/when this is revived, refresh the spec against then-current
register and kit before implementing.

---

## 8. Topbar

App navigation. Persistent across all authenticated routes.

### Anatomy

```
[● CookbookAI]  [Library] [Kitchen]      [Sign out]   [+ Import]
```

The nav label "Kitchen" is the user-facing copy (LOCKED 2026-05-01,
see `SPRINT_02_SPECS.md` §0). The route URL stays `/equipment` —
URLs are technical, UI copy is editorial. They diverge here intentionally.

| Slot | Token |
|---|---|
| Container | `--topbar-height` (52px), `0.5px solid --color-border` bottom |
| Brand mark | 6×6px circle in `--color-accent`, 8px right margin |
| Brand text | `font-display` italic, weight 500, 17px, `--color-ink` |
| Nav buttons | `font-ui`, `text-ui`, padding `5px 10px`, `--radius-sm` |
| Active nav | weight 500, `--color-ink` |
| Inactive nav | `--color-ink-muted` |
| Sign out link | `font-ui`, `text-ui-sm`, `--color-ink-muted` (ghost variant). Hover: `--color-ink`. Hidden on mobile. |
| Import button | filled accent variant (per UI_KIT.md §8) |

### Nav links

| Label | Route | Active matcher |
|---|---|---|
| Library | `/library` | `pathname === '/library' \|\| pathname.startsWith('/recipes/')` |
| Kitchen | `/equipment` | `pathname.startsWith('/equipment')` |

### Layout

The right-side cluster, in order:

1. (spacer — `flex-1`)
2. **Sign out** link — desktop only, ghost variant, `mr-4`
3. **+ Import** button — visible at all breakpoints, filled accent

Layout per breakpoint:

- **Mobile (< 768px):** Brand left, Import button right. Nav and Sign-out collapse — see Mobile collapse below. Sticky.
- **Tablet (≥ 768px):** Brand, nav (Library, Kitchen), [grow], Sign-out, Import button.
- **Desktop (≥ 1024px):** Brand, nav (Library, Kitchen), [grow], Sign-out, Import button. The search field originally specified for desktop is **deferred to post-MVP** — search lives on the library page itself for Sprint 2 (per `SPRINT_02_SPECS.md` §3).

### States

| State | Visual |
|---|---|
| Default | All controls visible per breakpoint |
| Scrolled | No change (no shadow, no shrink) |

### Mobile collapse — RESOLVED

Earlier this spec carried an open question about three options
(hamburger, two-row, search-only). Founder resolved this 2026-05-01:

**Decision: Option 3 — search-button-only.**

Concretely, on mobile (< 768px):

- Brand on the left
- "+ Import" button on the right
- Nav links (Library, Kitchen) hidden — library is the default
  authenticated route; Kitchen is reachable from the library page
  header
- Sign-out link hidden — moves to a profile menu post-MVP. For now
  on mobile, users sign out by switching to desktop or using a future
  account screen.

### Sign-out long-term — RESOLVED

Founder confirmed 2026-05-01: keep the sign-out link in the topbar at
desktop for MVP. Move to a profile menu when the profile/account
surface is designed (post-MVP). The current placement is intentional
and not a stopgap to fix in Sprint 2 or 3.

### Accessibility

- Brand is `<a href="/">` wrapping mark + text
- Nav is `<nav aria-label="Primary">` with `<ul role="list">`
- Active nav item has `aria-current="page"`
- Sign-out is a `<button>` (it triggers the NextAuth `signOut()` flow)
- Import button is `<button>`, not a link

---

## 9. AdaptPanel — Sprint 2

Inline adapt flow on the recipe detail page. Replaces the standalone
`/recipes/[id]/adapt` page from Sprint 0. See `SPRINT_02_SPECS.md` §2
for full rationale.

### Position

Within `RecipeDetail` (§2), between the Method section and the bottom
action row (Download / Delete). Wrapped in a `<section
aria-label="Adapt this recipe">`.

### Component states

The component handles five states:

1. **Idle** — no adapted version saved, no rewrite in progress
2. **Idle, no equipment** — variant of Idle when user has no saved
   appliances; button disabled with hint
3. **Loading** — AI rewrite in progress
4. **Result** — AI returned successfully, user hasn't saved or
   discarded yet
5. **Saved** — recipe has `adaptedSteps` persisted; collapsed by
   default with a toggle to expand

### State 1 — Idle

```
┌──────────────────────────────────────────────────┐
│  Eyebrow: "Make it yours"                        │
│  Headline: "Adapt this for your kitchen."        │
│  Sub: "We'll rewrite the steps using only        │
│       what you've got."                          │
│                                                  │
│  [   Adapt for my kitchen   ]                    │
└──────────────────────────────────────────────────┘
```

| Slot | Token |
|---|---|
| Eyebrow | `font-ui text-eyebrow text-accent`, "Make it yours" |
| Headline | `font-display text-display-md font-medium text-ink`, "Adapt this for your kitchen." |
| Sub | `font-display text-deck italic text-ink-muted` |
| Button | filled accent variant, `h-[38px] px-4 rounded-sm`, "Adapt for my kitchen" |

### State 1b — Idle, no equipment saved

When `appliances.length === 0`:
- Button is disabled
- Hint below: "Save your equipment in **Kitchen settings** first."
- "Kitchen settings" links to `/equipment`
- Surrounding text: `font-ui text-ui-sm text-ink-faint`

### State 2 — Loading

The button is replaced inline with:

```
[●] Adapting…
```

| Slot | Token |
|---|---|
| Pulse dot | `bg-accent`, 6×6px circle, `--motion-pulse` animation |
| Label | `font-ui text-ui text-accent`, "Adapting…" |

Reduced motion: pulse dot static at full opacity.

### State 3 — Result shown

```
┌──────────────────────────────────────────────────┐
│  Eyebrow: "Adapted for your kitchen"             │
│                                                  │
│  NOTES                                           │
│  "Replaced the air fryer with the oven; the      │
│  tofu won't be quite as crisp but the sauce      │
│  carries it." (italic, ink-muted)                │
│                                                  │
│  STEPS                                           │
│  i.   Heat the oven to 230°C / 450°F...         │
│  ii.  Whisk the peanut butter...                │
│  iii. Roast the tofu for 22-25 minutes...       │
│                                                  │
│  [ Save this version ]    [ Discard ]            │
└──────────────────────────────────────────────────┘
```

| Slot | Token |
|---|---|
| Container | `max-w-[620px]` |
| Eyebrow | `font-ui text-eyebrow text-accent`, "Adapted for your kitchen" |
| Notes label (only if `notes` non-empty) | `font-ui text-eyebrow text-ink-faint`, "Notes" |
| Notes body | `font-display text-body italic text-ink-muted` |
| Steps label | `font-ui text-eyebrow text-ink-faint`, "Steps" |
| Step number | `font-display` italic, `--color-accent`, `min-w-[22px]` |
| Step body | `font-display text-body text-ink` |
| Steps list | `<ol style="list-style-type: lower-roman">` (same pattern as RecipeDetail method) |
| "Save this version" | primary variant (`bg-ink text-paper h-[38px]`) |
| "Discard" | ghost variant (`text-ink-muted`, no border, hover `text-ink underline`) |
| Button row gap | `gap-3`. Mobile: stacked, full width, save on top. Desktop: side by side, left-aligned. |

#### Identical-result handling

If the AI returns steps character-for-character identical to the
original (e.g., recipe was already perfectly suited to the user's
equipment), still show the result panel with a one-line note:
*"Notes — Your kitchen already has everything; no changes needed."*
Don't suppress. Users learning the feature need to see it ran.

### State 4 — Saved

When recipe loads with non-null `adaptedSteps`:

```
┌──────────────────────────────────────────────────┐
│  Eyebrow: "Adapted for your kitchen — saved"     │
│  [ Show adapted version ▾ ]                     │
└──────────────────────────────────────────────────┘
```

On click, expand:

```
│  STEPS                                           │
│  i.   Heat the oven to 230°C / 450°F...         │
│  ii.  Whisk the peanut butter...                │
│  ...                                             │
│                                                  │
│  [ Hide ]   [ Re-adapt ]   [ Discard ]           │
```

| Action | Variant | Behavior |
|---|---|---|
| "Show adapted version" / "Hide" | ghost | Toggle expand/collapse |
| "Re-adapt" | accent outline | Re-runs AI rewrite. **No confirmation** (Founder decision: re-adapt is non-destructive friction). On success, returns to Loading → Result; saving overwrites previous. |
| "Discard" | ghost | `window.confirm("Discard the adapted version?")` then `PATCH` `{ adaptedSteps: null }` |

The state-4 panel does not show a "Save this version" button — already
saved.

### Error states

| Failure | Treatment |
|---|---|
| Adapt API returns 5xx or network error | Below the button: `font-ui text-body-sm text-accent-strong`: "We couldn't rewrite this. Try again, or check your kitchen settings." Two CTAs: "Try again" (filled accent) and "Adjust kitchen →" (ghost, links to `/equipment`). |
| Adapt API returns valid JSON but empty `adaptedSteps` | Same treatment. Copy: "Adaptation didn't produce a usable result. Try again, or change your kitchen selection." |
| Save API fails | Below the action buttons: "We couldn't save that. Try again." Save button re-enables. The result panel stays mounted. |

### Props

```
- recipeId: string
- originalSteps: string[]
- savedAdaptedSteps: string[] | null
- savedAdaptedNotes: string | null
- userAppliances: string[]  // from /api/equipment
- isShowingAdapted: boolean  // for parent to know which version is being viewed
- onShowingAdaptedChange: (isShowing: boolean) => void  // for the Markdown export to read
- onAdapt: (recipeId, appliances) => Promise<AdaptResponse>
- onSaveAdapted: (recipeId, adaptedSteps) => Promise<void>
- onDiscardAdapted: (recipeId) => Promise<void>
```

The `isShowingAdapted` lift-up exists so the recipe detail page knows
which version (original or adapted) the user is currently viewing —
the Download .md button reads this to decide what to export. See
`SPRINT_02_SPECS.md` §4.

### Accessibility

- Wrapped in `<section aria-label="Adapt this recipe">`
- Loading state announces via `role="status"`
- Result panel announces via `aria-live="polite"` when it appears
- Saved-state toggle has `aria-expanded`
- Roman numerals follow the same hidden-decorative pattern as
  RecipeDetail method

### Reduced-motion

- Loading pulse: respects `prefers-reduced-motion: reduce`
- No fade-in on result panel; immediate display

### Files

- `src/components/recipe/AdaptPanel.tsx` — new
- `src/app/(app)/recipes/[id]/page.tsx` — render `<AdaptPanel>` after `<RecipeDetail>`
- `src/components/recipe/RecipeDetail.tsx` — remove the "Adapt for my kitchen" button from the controls bar (moves into AdaptPanel)
- `/recipes/[id]/adapt` route — delete if it was created in Sprint 1

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

This file is owned by **[UI/UX]**. Adding a component, removing one, or
changing a contract is a design decision — file it back to `[UI/UX]`.
Devs may not invent components or props that aren't specified
here. New features get new specs.

---

## Changelog

| Date | Change | Trigger |
|---|---|---|
| 2026-04-29 | Initial lock — Sprint 0 | Founder approved register |
| 2026-05-01 | §1 RecipeListItem: Adapted tag now derives from `recipe.adaptedSteps !== null`, not a separate flag | Sprint 2 data model |
| 2026-05-01 | §2 RecipeDetail: removed "Adapt" button from controls bar; added bottom action row (Download .md + Delete); referenced AdaptPanel | Sprint 2 inline adapt flow |
| 2026-05-01 | §3 ServingScaler: documented Sprint 1 max=99 (acceptable) | Sprint 1 dev raised max |
| 2026-05-01 | §5 ImportForm: added note clarifying "streaming" is progressive phase indicators, not literal token streaming. Button updated to filled accent. Internal `Status` enum recommended to use "working". | CTO Sprint 1 review #5 |
| 2026-05-01 | §6 EquipmentChip: locked the 8 backend keys to match Zod schema; added `equipmentKey` prop; added `disabled` prop for page-level loading | Sprint 2 backend contract |
| 2026-05-01 | §7 AdaptDiff: marked deprecated; spec retained for post-MVP | Sprint 2 inline adapt flow + Founder confirmation |
| 2026-05-01 | §8 Topbar: nav label "Equipment" → "Kitchen" (route stays `/equipment`); added Sign-out link; resolved mobile collapse (Option 3); deferred topbar search to post-MVP | Sprint 1 dev addition + Founder decisions |
| 2026-05-01 | §9 AdaptPanel: new component spec | Sprint 2 task F2 |
| 2026-05-02 | §5 ImportForm: added mode switch (`link` \| `text` labels; `url` \| `text` API payload), textarea sub-component, mode-aware phase copy (URL/text/YouTube), backend response contract (`reused`, `sourceKind`), updated props. Detail in `docs/sprints/sprint_03/sprint_03_design_brief.md`. | Sprint 3 task U1 |
| 2026-05-02 | §5 ImportForm: contract gains `sourceUrl` and `sourceDomain` fields (CTO fix pass). URL input + submit button get mobile `min-h-[44px]` floor with `md:h-[38px]` desktop override — required by project DoD. | Sprint 3 U1 fix pass |
