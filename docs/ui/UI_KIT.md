# UI Kit — CookbookAI Design Tokens

> **Status:** Locked — Sprint 0 (updated Sprint 2)
> **Owner:** [UI/UX] (Alice)
> **Replaces:** the scaffold default
> **See also:** `REGISTER.md` for the *why*; this file is the *what*.

This file is the canonical source of design tokens. Tailwind config,
CSS variables, and component code reference these values — never
hardcode hex values or font names anywhere else.

---

## 1. Color tokens

The full palette. Five values plus terracotta and one error variant. No
semantic green/yellow/red — see `REGISTER.md` §5.

| Token | Hex | Use |
|---|---|---|
| `--color-paper` | `#FBF7EC` | Page background; cream paper |
| `--color-paper-frame` | `#EFE7D6` | App frame surround, subtle separation |
| `--color-paper-sunken` | `rgba(255, 253, 246, 0.7)` | Recessed surfaces (streaming box, info blocks) |
| `--color-ink` | `#2A1F14` | All body text, headlines, primary buttons, primary borders |
| `--color-ink-muted` | `#6B5A47` | Decks, italic subtitles, metadata, helper text |
| `--color-ink-faint` | `#8C7A60` | Tertiary text (placeholders, byline metadata) |
| `--color-ink-ghost` | `#B5A487` | Strikethrough text in diffs, very-low-emphasis text |
| `--color-border` | `#D9CDB2` | Default 0.5px borders, dividers |
| `--color-border-soft` | `#E5DBC5` | Lighter divider (between library list rows, dotted ingredient rules) |
| `--color-border-strong` | `#C9B98F` | Form borders, emphasis dividers |
| `--color-accent` | `#B85C38` | Terracotta — the AI signal. See REGISTER.md §5. |
| `--color-accent-bg` | `rgba(184, 92, 56, 0.06)` | Faint terracotta wash (selected equipment chip, diff-new highlight) |
| `--color-accent-strong` | `#A03A1A` | Darker terracotta — for error states ONLY, never for hover |
| `--color-focus-ring` | `rgba(184, 92, 56, 0.4)` | Focus outline color |

### Tailwind config mapping

```ts
// tailwind.config.ts → theme.extend.colors
colors: {
  paper: {
    DEFAULT: '#FBF7EC',
    frame: '#EFE7D6',
    sunken: 'rgba(255, 253, 246, 0.7)',
  },
  ink: {
    DEFAULT: '#2A1F14',
    muted: '#6B5A47',
    faint: '#8C7A60',
    ghost: '#B5A487',
  },
  border: {
    DEFAULT: '#D9CDB2',
    soft: '#E5DBC5',
    strong: '#C9B98F',
  },
  accent: {
    DEFAULT: '#B85C38',
    bg: 'rgba(184, 92, 56, 0.06)',
    strong: '#A03A1A',
  },
}
```

### Forbidden colors

These will fail review:

- Pure black (`#000`), pure white (`#FFF`)
- Tailwind `gray-*` ramp — incompatible with cream paper
- Tailwind `red-*`, `green-*`, `yellow-*` — see REGISTER.md §5 (semantic states use the existing palette)
- Drop shadows of any color
- Any gradient

---

## 2. Typography tokens

Three faces. Loaded from Google Fonts. See `REGISTER.md` §4 for the rules.

### Font loading

In `src/app/layout.tsx`:

```ts
import { Fraunces, Inter, Caveat } from 'next/font/google';

const fraunces = Fraunces({
  subsets: ['latin'],
  variable: '--font-display',
  weight: ['400', '500'],
  style: ['normal', 'italic'],
  display: 'swap',
});

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-ui',
  weight: ['400', '500'],
  display: 'swap',
});

const caveat = Caveat({
  subsets: ['latin'],
  variable: '--font-hand',
  weight: ['500'],
  display: 'swap',
});
```

Apply `${fraunces.variable} ${inter.variable} ${caveat.variable}` to
the `<html>` tag.

### Font tokens

| Token | Stack | Use |
|---|---|---|
| `--font-display` | `'Fraunces', Georgia, serif` | Recipe titles, headlines, body text in recipes, ingredient names, deck lines |
| `--font-ui` | `'Inter', -apple-system, sans-serif` | Eyebrow labels, navigation, buttons, metadata, form fields, ingredient amounts |
| `--font-hand` | `'Caveat', cursive` | The earned warm moment — once per recipe at most |

### Type scale

The scale is intentionally narrow. Two display sizes, two body sizes,
one micro size.

| Token | Class | Size / Line | Weight | Tracking | Used for |
|---|---|---|---|---|---|
| `text-display-lg` | display-lg | 32px / 1.08 | Fraunces 500 | -0.02em | Recipe detail title, big import headline |
| `text-display-md` | display-md | 26px / 1.15 | Fraunces 500 | -0.015em | Library title, screen headlines |
| `text-deck` | deck | 14px / 1.5, italic | Fraunces 400 italic | normal | Deck line under headlines, recipe sub-titles |
| `text-body` | body | 14.5px / 1.65 | Fraunces 400 | normal | Method steps, recipe long-form |
| `text-body-sm` | body-sm | 13px / 1.6 | Fraunces 400 | normal | Library row sub-titles, dense recipe lists |
| `text-ui` | ui | 12px / 1.4 | Inter 400 | normal | Body UI, form fields, button labels |
| `text-ui-sm` | ui-sm | 11px / 1.4 | Inter 400 | normal | Metadata (servings, time, source) |
| `text-eyebrow` | eyebrow | 10px / 1.3 | Inter 500 | 0.16em uppercase | Section headers ("Ingredients", "Method"), category eyebrows |
| `text-tag` | tag | 9px / 1.3 | Inter 500 | 0.08em uppercase | Tag chips |
| `text-hand` | hand | 16px / 1.2 | Caveat 500 | normal | The margin note, the empty-library invitation |

**Step numbers** in recipe method use `text-body` with Fraunces *italic*
in terracotta — `i.`, `ii.`, `iii.`, `iv.` (Roman numerals, lowercase).
This is a deliberate departure from numeric `1. 2. 3.` — see
REGISTER.md §7.

**Tabular numerals** are required for ingredient amounts and serving
counts. Set `font-feature-settings: "tnum"` on `.ing-amt` and
`.serving-count` to prevent jiggle when numbers update.

### Tailwind config mapping

```ts
// tailwind.config.ts → theme.extend.fontFamily, fontSize
fontFamily: {
  display: ['var(--font-display)', 'Georgia', 'serif'],
  ui: ['var(--font-ui)', '-apple-system', 'sans-serif'],
  hand: ['var(--font-hand)', 'cursive'],
},
fontSize: {
  'display-lg': ['32px', { lineHeight: '1.08', letterSpacing: '-0.02em' }],
  'display-md': ['26px', { lineHeight: '1.15', letterSpacing: '-0.015em' }],
  'deck':       ['14px', { lineHeight: '1.5' }],
  'body':       ['14.5px', { lineHeight: '1.65' }],
  'body-sm':    ['13px', { lineHeight: '1.6' }],
  'ui':         ['12px', { lineHeight: '1.4' }],
  'ui-sm':      ['11px', { lineHeight: '1.4' }],
  'eyebrow':    ['10px', { lineHeight: '1.3', letterSpacing: '0.16em' }],
  'tag':        ['9px', { lineHeight: '1.3', letterSpacing: '0.08em' }],
  'hand':       ['16px', { lineHeight: '1.2' }],
},
```

---

## 3. Spacing scale

Conservative. Driven by editorial rhythm, not the Tailwind default.

| Token | Value | Use |
|---|---|---|
| `space-1` | 4px | Inline gaps (icon + text inside a button) |
| `space-2` | 8px | Tag gap, button padding y |
| `space-3` | 12px | Component-internal gaps, control row gap |
| `space-4` | 16px | Section spacing, paragraph gap |
| `space-5` | 22px | Generous paragraph gap, between section header and content |
| `space-6` | 28px | Screen padding, page-section spacing |
| `space-8` | 44px | Major section break |
| `space-10` | 64px | Page top/bottom rhythm at desktop |

**Use Tailwind defaults** (`p-3`, `gap-4`) — these tokens are the *only*
allowed values. Avoid `p-5`, `p-7`, etc., which fall outside the scale.

---

## 4. Layout tokens

| Token | Value | Use |
|---|---|---|
| `--measure` | `620px` | Max width of recipe detail content (single column) |
| `--measure-narrow` | `480px` | Max width of import form, auth forms |
| `--measure-wide` | `880px` | Max width of library list |
| `--topbar-height` | `52px` | App topbar |
| `--page-pad-x-mobile` | `20px` | Horizontal page padding mobile |
| `--page-pad-x-desktop` | `28px` | Horizontal page padding desktop |
| `--page-pad-y` | `26px` | Vertical page padding |

### Breakpoints

CookbookAI uses three breakpoints, not five.

| Breakpoint | Tailwind | Min width | Layout shift |
|---|---|---|---|
| Mobile | (default) | 0 | Single column, stacked, 20px gutter |
| Tablet | `md:` | 768px | Library shows metadata column inline; recipe detail is single column with margin notes inline |
| Desktop | `lg:` | 1024px | Library 3-column (title / meta / tags), recipe detail with right-margin notes, ingredient list 2-column |

**Mobile-first.** Every component spec must define mobile behavior
first. Desktop is the modifier. See REGISTER.md §3 Rule 5.

---

## 5. Border-radius tokens

Sparingly rounded. The register's editorial tone wants square corners
in many places.

| Token | Value | Use |
|---|---|---|
| `--radius-none` | 0 | Buttons (deliberately square — reads editorial) |
| `--radius-sm` | 2px | Inputs, form fields, secondary buttons, image rounding |
| `--radius-md` | 4px | Equipment chips, tags, search field |
| `--radius-lg` | 8px | Page-frame outer container only |
| `--radius-pill` | 999px | Tag chips |

**Square buttons** are deliberate. Rounded buttons read tech-startup;
square reads editorial. The register holds.

---

## 6. Border weights

| Token | Value | Use |
|---|---|---|
| `--border-hairline` | `0.5px solid var(--color-border)` | Default borders, dividers |
| `--border-dotted` | `1px dotted var(--color-border-soft)` | Ingredient row separators in recipe detail |
| `--border-emphasis` | `0.5px solid var(--color-ink)` | Stepper, primary action containers |
| `--border-accent` | `0.5px solid var(--color-accent)` | Selected equipment chip, AI-active state |

**No 1px borders by default** — 0.5px reads more refined on retina. The
exception is dotted lines (which need 1px to render) and emphasis
borders.

---

## 7. Motion tokens

See REGISTER.md §6 for philosophy. Concrete values:

| Token | Value | Use |
|---|---|---|
| `--motion-fade` | `280ms ease-out` | Standard opacity transition |
| `--motion-fade-slow` | `400ms ease-out` | Streaming text line-in |
| `--motion-stream-line` | `420ms` (per line) | Pause between streamed lines |
| `--motion-pulse` | `1.4s ease-in-out infinite` | The streaming-active dot |

### Reduced-motion override

```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0ms !important;
  }
}
```

This is mandatory in `globals.css`. Streaming UI must also detect the
preference in JS and append all lines at once instead of staggering.

---

## 8. Component patterns

Pattern-level rules. Per-component specs live in `COMPONENT_SPECS.md`.

### Buttons

The system has three variants. The accent variant has two forms — see
below.

| Variant | Background | Text | Border | Use |
|---|---|---|---|---|
| **Primary** | `--color-ink` | `--color-paper` | none | The single primary action on a screen ("Bring it in", "Save changes") |
| **Accent — filled** | `--color-accent` | `--color-paper` | none | Primary AI actions in inviting contexts ("Adapt for my kitchen", "+ Import") |
| **Accent — outline** | transparent | `--color-accent` | `0.5px solid --color-accent` | Secondary AI actions inside text-heavy areas ("Re-adapt" inside saved AdaptPanel) |
| **Ghost** | transparent | `--color-ink-muted` | none | Tertiary actions, nav, "Discard", "Sign out" |

Why two accent forms: filled reads better against cream paper for
primary AI actions; outline is less assertive when the action is
secondary and embedded in body text. **Use filled by default.** Reach
for outline only when the button is in-flow inside text-heavy content.

All buttons:
- Square corners (`--radius-none`)
- Inter 500, `text-ui` size, uppercase with `0.14em` tracking for primary/accent only
- Hover on primary: opacity 0.92
- Hover on accent (filled): background darkens to `--color-accent-strong`
- Hover on accent (outline): background fills with `--color-accent`, text becomes `--color-paper`
- Active: scale(0.98)
- Disabled: ink at 30%, no hover, `cursor: not-allowed`
- Min tap target: 44×44px on mobile (use padding, not min-height)

### Inputs

- Background: `--color-paper`
- Border: `0.5px solid --color-border-strong`
- Radius: `--radius-sm`
- Font: Inter 400, `text-ui`
- Padding: `0 14px`, height 38px (mobile and desktop both)
- Focus: border `--color-accent`, box-shadow `0 0 0 2px var(--color-focus-ring)`
- Placeholder: `--color-ink-faint`
- Error state: border `--color-accent-strong`, helper text below in same color

### Tag chips

- Padding: `2px 7px`
- Border: `0.5px solid --color-border-strong`, radius `--radius-pill`
- Font: Inter 500, `text-tag`, uppercase
- Color: `--color-ink-muted`
- **Adapted variant** (the AI signal): color and border switch to `--color-accent`. Background stays transparent.

### Steppers (serving count)

- Inline-flex, `0.5px solid --color-ink`, square corners
- −/+ buttons: Fraunces 500, `text-body`, padding `3px 10px`
- Center value: padded with vertical dividers either side
- Hover on −/+: background fills with `--color-ink`, text becomes paper
- Keyboard: when focused, ↑ increments, ↓ decrements

### Toggles (unit metric/imperial)

- Plain inline-flex of two text buttons
- Inactive: Inter 400, `text-ui-sm`, `--color-ink-faint`
- Active: Inter 500, `--color-ink`, with a 1px terracotta underline (`--color-accent`)
- No background fill on either state — the underline does the work

### Cards (the term, not the visual)

CookbookAI does not use "cards" in the typical sense — there is no
elevated surface with shadow. What other systems call cards, this
system calls *blocks*: a section delimited by space and 0.5px borders,
not by elevation. If a designer or dev says "let's use a card," send
them back to the register: blocks only.

---

## 9. Iconography

Heroicons (outline variant, 1.5px stroke). No mixed icon sets.

- Icon size in UI: 16×16px (use `width="16" height="16"` on inline SVG)
- Icon size in larger buttons: 14×14px
- Color: inherits from text color
- **No colored icons.** No filled icons. No emoji-as-icons.
- Icon-only buttons require `aria-label`.

---

## 10. The "warm moment" budget

Per REGISTER.md §3 Rule 2, warm moments are scarce. This is the budget
encoded as a constraint:

| Screen | Warm moments allowed | Allowed examples |
|---|---|---|
| Library | 0 | None — library is reading-mode |
| Recipe detail | 1 | The margin note (handwritten in Caveat) |
| Import form | 0 | None — the streaming itself is the warmth |
| Adapter (now inline on recipe detail) | 0 | None — adaptation is precise, not decorative |
| Equipment settings | 0 | None — settings are utilitarian |
| Empty library | 1 | The "It's quiet in here" Caveat invitation |
| Auth screens | 0 | None — forms only |

**Devs and designers must not add warm moments** beyond this budget
without re-opening the register with the Founder.

---

## 11. Accessibility floor

Restated here as binding token-level rules. Per REGISTER.md §8.

- All text meets WCAG AA contrast on `--color-paper` background
- All interactive elements have a visible focus ring using `--color-focus-ring`
- All animations respect `prefers-reduced-motion`
- All touch targets ≥ 44×44px on mobile
- All form fields have associated `<label>` (visible or `sr-only`)

If a design or component fails any of these, it does not ship.

---

## 12. CSS variable bootstrap (`globals.css`)

The dev should add this to the top of `src/app/globals.css`:

```css
:root {
  --color-paper: #FBF7EC;
  --color-paper-frame: #EFE7D6;
  --color-paper-sunken: rgba(255, 253, 246, 0.7);
  --color-ink: #2A1F14;
  --color-ink-muted: #6B5A47;
  --color-ink-faint: #8C7A60;
  --color-ink-ghost: #B5A487;
  --color-border: #D9CDB2;
  --color-border-soft: #E5DBC5;
  --color-border-strong: #C9B98F;
  --color-accent: #B85C38;
  --color-accent-bg: rgba(184, 92, 56, 0.06);
  --color-accent-strong: #A03A1A;
  --color-focus-ring: rgba(184, 92, 56, 0.4);

  --measure: 620px;
  --measure-narrow: 480px;
  --measure-wide: 880px;
  --topbar-height: 52px;
}

html {
  background: var(--color-paper-frame);
  color: var(--color-ink);
  font-family: var(--font-display), Georgia, serif;
  font-feature-settings: "kern", "liga";
  -webkit-font-smoothing: antialiased;
}

body {
  background: var(--color-paper);
}

@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0ms !important;
  }
}

*:focus-visible {
  outline: 2px solid var(--color-accent);
  outline-offset: 1px;
}
```

---

## 13. shadcn/ui customization

Per `docs/ARCHITECTURE.md`, the project uses shadcn/ui. shadcn ships
with neutral gray and rounded-md defaults — both incompatible with
this register.

When `npx shadcn init` runs:
- Choose **Neutral** style (closest, still needs token override)
- Override `tailwind.config.ts` colors with the tokens above
- Override `globals.css` with the bootstrap from §12
- For each shadcn primitive added (Button, Input, Card, Dialog, Dropdown), the dev adjusts the generated component to use these tokens. **Don't accept shadcn defaults.** The shadcn primitives are starting points, not finished components.

The eight CookbookAI components in `COMPONENT_SPECS.md` are *not*
shadcn primitives — they are project-specific compositions that may
*use* shadcn primitives (Button, Input, Dialog) underneath.

---

## 14. Authority

This file is owned by **[UI/UX] (Alice)** at `~/Projects/agents/alice/ALICE.md`.

Adding a token, changing a value, or removing a token is a
**structural** change requiring Founder approval. Devs may not invent
new tokens. If a dev finds they need a value not in this file, they
file it as a question for Alice — not as a code change.

---

## Changelog

| Date | Change | Trigger |
|---|---|---|
| 2026-04-29 | Initial lock — Sprint 0 | Founder approved register |
| 2026-05-01 | §8 Buttons: split accent variant into filled and outline forms | Sprint 1 dev used filled accent in places where outline was originally specified; both reviewed and accepted as legitimate variants. Filled is the new default. |
| 2026-05-01 | §10 Warm moment budget: added Equipment settings (0); updated Adapter row (now inline on recipe detail) | Sprint 2 added new surface; standalone adapter page deprecated. |
