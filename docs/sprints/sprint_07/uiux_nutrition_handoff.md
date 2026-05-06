# Sprint 07 — UI/UX Nutrition Presentation Handoff

> **Status:** Locked for Sprint 07 frontend work — 2026-05-06
> **Owner:** `[UI/UX]`
> **Reads:** `docs/ui/REGISTER.md`, `UI_KIT.md`, `COMPONENT_SPECS.md`,
> `PAGE_LAYOUTS.md`, `STATES.md` first.
> **Audience:** `[DEV:frontend]`, `[DEV-QA]`

This handoff covers Sprint 07 tasks 7.21–7.25 (nutrition panel on recipe
detail) and the ImportForm phase copy for the AI-direct video fallback
(task 7.24). It also adds the new `NutritionPanel` component to
`COMPONENT_SPECS.md` and new states to `STATES.md` — those files should
be updated when dev closes the sprint.

It introduces **no new tokens**. All styling uses the existing type scale,
color palette, spacing, and border system.

---

## 1. Design Decisions

1. **Calories are the headline.** The calorie count renders at `text-display-lg`
   (Fraunces 500, 32px) — the largest text in the product — with protein, carbs,
   and fat below as a compact secondary row. This hierarchy makes the panel
   scannable in one glance.

2. **Fiber is shown only on full matches.** If any ingredient is unmatched,
   fiber is omitted entirely. A partial fiber total would imply more completeness
   than the data supports.

3. **Recalculate appears only when the ingredient list has changed** since the
   last stored estimate. It is a quiet inline prompt, not a permanent control.

4. **"Calculate" is a primary ink button, not terracotta.** USDA FoodData
   Central is the source of truth — this is a database lookup, not an AI signal.
   Terracotta would mislead users into thinking AI generated the number. (AI may
   assist with ingredient normalization internally, but the user-facing action is
   a data retrieval, not an AI composition.)

5. **Non-medical copy throughout.** The panel never says "nutrition facts,"
   "daily value," "high protein," "healthy," or any health claim. "Macros" is the
   section label; "approximately" or "~" precedes every number; "estimated" appears
   once near the footer. See §4 for the complete copy spec.

6. **Position:** The `NutritionPanel` sits between `AdaptPanel` and the bottom
   action row (Download .md / Delete recipe). It is reference data, not a
   primary action — placing it at the end keeps cooking-mode reading clean.

7. **No warm moment.** The nutrition panel is utilitarian. The recipe detail
   margin note remains the single warm moment for that page.

---

## 2. Data Contract Consumed by UI

Frontend reads these fields from `RecipeResponse` (Sprint 07 additions):

```ts
nutritionEstimate?: {
  perServing: {
    calories: number;
    proteinG: number;
    carbsG: number;
    fatG: number;
    fiberG?: number;          // present only when all ingredients matched
  };
  fullRecipe: {
    calories: number;
    proteinG: number;
    carbsG: number;
    fatG: number;
    fiberG?: number;
  };
  servingsUsed: number;       // the canonical serving count at calculation time
  matchedCount: number;       // ingredients successfully looked up
  totalCount: number;         // total ingredients in recipe
  unmatchedIngredients: string[]; // display names of unmatched ingredients
  calculatedAt: string;       // ISO timestamp
} | null;

ingredientsChangedSince?: string | null; // ISO timestamp of last ingredient edit;
                                          // if > calculatedAt, recalculate prompt shows
```

`nutritionEstimate === null` means no estimate has been calculated — show
the idle state. The UI never fabricates values.

---

## 3. NutritionPanel Component

### Position in RecipeDetail

```
METHOD
  i.   First step…
  ii.  Second step…

[AdaptPanel]

[NutritionPanel]    ← new, Sprint 07

[ Download .md ]  ·  [ Delete recipe ]
```

The panel is separated from AdaptPanel by `space-5` (22px) top margin.
A `0.5px solid --color-border` top border opens the section — same visual
rhythm as the ingredient/method dividers above.

---

### Anatomy — State 3 (Full Estimate)

```
──────────────────────────────────────────────
MACROS

  ~410
  cal per serving

  Protein    Carbs    Fat
  32 g       28 g     18 g

  Fiber: 4 g           ← only when all matched

  Approximate values · USDA food data · 4 servings
──────────────────────────────────────────────
```

| Slot | Token | Notes |
|---|---|---|
| Section top border | `0.5px solid --color-border` | Opens the section |
| Eyebrow "MACROS" | `font-ui text-eyebrow uppercase tracking-[0.16em] text-ink-faint` | Same as "INGREDIENTS", "METHOD" |
| Calories number | `font-display text-display-lg font-medium text-ink` | The headline number only, no unit |
| "cal per serving" label | `font-ui text-ui-sm uppercase tracking-[0.08em] text-ink-faint` | Below the number, `mt-1` |
| Macro row container | `flex gap-6 mt-3` | Three columns: Protein, Carbs, Fat |
| Macro number | `font-display text-body font-medium text-ink font-feature-settings:"tnum"` | Tabular numerals |
| "g" unit | `font-ui text-ui-sm text-ink-faint` | Inline after the number, `ml-[2px]` |
| Macro label | `font-ui text-ui-sm uppercase tracking-[0.08em] text-ink-faint mt-[2px]` | Below the number |
| Fiber row | `font-ui text-ui-sm text-ink-faint mt-2` | "Fiber: 4 g" — only when `fiberG` present |
| Footer line | `font-ui text-ui-sm text-ink-faint mt-3` | Estimate disclosure |

**Macro column order:** Protein → Carbs → Fat. This order matches common reading
convention and leaves fat last, where it is least alarming contextually.

---

### State 1 — Idle (No Estimate)

```
──────────────────────────────────────────────
MACROS
Get an idea of what's in this recipe.
[ Calculate ]
──────────────────────────────────────────────
```

| Slot | Token |
|---|---|
| Eyebrow | same as above |
| Deck | `font-display text-deck italic text-ink-muted`, "Get an idea of what's in this recipe." |
| Button | **Primary ink variant** (`bg-ink text-paper`), `h-[38px] px-4 rounded-none font-ui text-ui uppercase tracking-[0.14em]`, label "Calculate" |

The button is `mt-3` below the deck.

---

### State 2 — Calculating

The button is replaced inline with the same pulse pattern as AdaptPanel:

```
[●] Looking up the ingredients…
```

| Slot | Token |
|---|---|
| Pulse dot | `bg-ink` 6×6px circle (not terracotta — this is not an AI action), `--motion-pulse` animation |
| Label | `font-ui text-ui text-ink`, "Looking up the ingredients…" |

Reduced motion: pulse dot static at full opacity.

---

### State 3 — Full Estimate (All Ingredients Matched)

See Anatomy section above.

**Footer copy:** `"Approximate values · USDA food data · {servingsUsed} servings"`

The `servingsUsed` count is the canonical serving count at calculation time. If
the user has scaled servings with the stepper, the displayed per-serving macros
update proportionally in the UI (client-side math, same as ingredient amounts).
The stored `perServing` baseline is always the canonical count.

---

### State 4 — Partial Match

Some ingredients matched; some did not.

```
──────────────────────────────────────────────
MACROS

  ~290
  cal per serving (estimated from matched ingredients)

  Protein    Carbs    Fat
  24 g       19 g     14 g

  Parmesan cheese, pancetta couldn't be looked up.

  Values cover {matchedCount} of {totalCount} ingredients.
──────────────────────────────────────────────
```

| Slot | Copy / Token |
|---|---|
| "cal per serving" sub-label | Append "(estimated from matched ingredients)" — same `text-ui-sm text-ink-faint` |
| Macro row | Renders as State 3 but fiber is **omitted** |
| Unmatched list | `font-ui text-ui-sm text-ink-faint mt-2`, "{name1}, {name2} couldn't be looked up." Max 3 names inline; if more, "{n} ingredients couldn't be looked up." |
| Coverage footer | `font-ui text-ui-sm text-ink-faint`, "Values cover {n} of {total} ingredients." followed by `· USDA food data` |

Do not use `text-accent-strong` for unmatched items — they are informational, not
errors. The muted faint color is correct.

---

### State 5 — Recalculate Prompt

Shown **in addition to** the displayed estimate (States 3 or 4) when
`ingredientsChangedSince > calculatedAt`.

A quiet line appears below the footer:

```
Recipe changed since last calculation. · Recalculate
```

| Slot | Token |
|---|---|
| Line | `font-ui text-ui-sm text-ink-faint mt-2` |
| "Recalculate" | ghost variant — `text-ink-muted underline-offset-2 hover:underline hover:text-ink`, inline |

Clicking "Recalculate" re-runs the calculation flow (State 2 → State 3 or 4).
The estimate panel replaces in place; no navigation occurs.

---

### State 6 — Error States

#### 6a. API key not configured

```
MACROS
Macro lookup isn't available on this installation.
```

`font-display text-deck italic text-ink-faint` — reads as a configuration note,
not a user error. No CTA. Do not suggest the user retry.

#### 6b. USDA service unavailable or network error

```
MACROS
We can't reach the nutrition database right now.
[ Try again ]
```

"Try again" — ghost variant, retries the calculate flow.

#### 6c. No ingredients matched

```
MACROS
We couldn't match the ingredients to our database.
The recipe may have unusual or ambiguous ingredient names.
```

Two-line deck in `font-display text-deck italic text-ink-muted`. No CTA beyond
the implicit retry (user can edit ingredient names and recalculate).

For all error states: `role="alert"` on the message container. No red/warning
colors — errors use the muted/faint palette per `REGISTER.md` §5.

---

### Mobile Layout (375px)

- The panel goes full width with the existing 20px gutters.
- Calories headline stays `text-display-lg` — do not shrink at mobile.
- The Protein/Carbs/Fat row wraps only if it must; at 375px with `gap-6` it fits
  without wrapping.
- Tap target for "Calculate" and "Try again": `min-h-[44px]` with padding.
- The footer line may wrap to two lines — that is acceptable.

---

### Accessibility

- Panel is `<section aria-label="Macros">`
- Loading state uses `role="status"` on the pulse + label container
- Error states use `role="alert"`
- Calories: the number and its "cal per serving" label should be grouped:
  `<p><span aria-label="Approximately {n} calories per serving">{n}</span> <span aria-hidden="true">cal per serving</span></p>`
- Protein, carbs, fat: each has a visible label and is readable in DOM order
  without CSS (screen readers will read number then label)
- "Recalculate" link is keyboard-focusable with the global focus ring
- Pulse dot is `aria-hidden="true"` during calculation

---

## 4. Copy Reference

All copy follows `REGISTER.md` §7 voice: calm, second-person, slightly
old-fashioned, non-medical.

| State | Copy element | Copy |
|---|---|---|
| Idle | Deck | "Get an idea of what's in this recipe." |
| Idle | Button | "Calculate" |
| Calculating | Label | "Looking up the ingredients…" |
| Full match | Sub-label | "cal per serving" |
| Full match | Footer | "Approximate values · USDA food data · {n} servings" |
| Partial | Sub-label | "cal per serving (estimated from matched ingredients)" |
| Partial — 1 unmatched | Unmatched line | "{Name} couldn't be looked up." |
| Partial — 2+ unmatched | Unmatched line | "{Name1}, {Name2} couldn't be looked up." |
| Partial — 4+ unmatched | Unmatched line | "{n} ingredients couldn't be looked up." |
| Partial | Coverage | "Values cover {n} of {total} ingredients. · USDA food data" |
| Recalculate | Prompt | "Recipe changed since last calculation. · Recalculate" |
| Error — no key | Message | "Macro lookup isn't available on this installation." |
| Error — service down | Message | "We can't reach the nutrition database right now." |
| Error — service down | Button | "Try again" |
| Error — no match | Message | "We couldn't match the ingredients to our database. The recipe may have unusual or ambiguous ingredient names." |

**Forbidden in this panel:**
- "Nutrition Facts" (FDA label term)
- % daily values or daily intake references
- "High protein", "low carb", "healthy", or any claim
- "Exact" — everything is approximate
- Exclamation marks

---

## 5. ImportForm Phase Copy — AI-Direct Video Fallback

When `AI_VIDEO_TRANSCRIPTION_ENABLED=true` and the fallback fires, a new
`sourceKind` value — `"youtube-direct-video"` — is returned by the backend.

Add this path to the phase copy table in `COMPONENT_SPECS.md` §5:

**YouTube video path** (`sourceKind: "youtube-direct-video"`):

```
"Looking up the video…"
→ "Reading the video…"
→ "Finding the recipe…"
→ "Reading ingredients…"
→ "Reading the method…"
→ "Done"
```

"Reading the video…" is honest — the AI is reading the video directly. It is
distinct from transcript ("Reading the description…") and does not name Gemini
or any provider.

Source provenance copy for `sourceKind: "youtube-direct-video"` in `RecipeDetail`:

```
From YouTube video · read by AI
```

No domain suffix (there is no resolved web page URL). If `sourceVideoUrl` is
present, the embed renders normally as in Sprint 06.

---

## 6. QA Additions

`[DEV-QA]` should verify:

1. **Idle state:** Recipe without nutrition estimate shows idle panel with
   "Calculate" button at correct position (below AdaptPanel).
2. **Calculate flow:** Button triggers State 2 (pulse + "Looking up…"), then
   resolves to State 3 or 4.
3. **Full match:** All four macros render; fiber appears if backend provides it;
   footer shows correct serving count.
4. **Partial match:** Unmatched ingredients listed; fiber absent; coverage
   footer visible.
5. **Serving scaler interaction:** Changing serving count proportionally updates
   displayed per-serving macros (client-side); full-recipe totals remain at
   canonical count.
6. **Recalculate prompt:** Appears when `ingredientsChangedSince > calculatedAt`;
   absent otherwise; clicking it re-runs calculation.
7. **Error — no key:** Correct message; no CTA; no crash.
8. **Error — service down:** "Try again" button re-triggers calculation.
9. **Error — no match:** Correct two-line message; no estimate displayed.
10. **Mobile 375px:** Panel fits within gutters; macros row does not overflow;
    "Calculate" tap target ≥ 44px.
11. **Keyboard:** Tab reaches "Calculate" and error buttons; focus ring visible.
12. **Existing recipe unchanged:** Old recipes without `nutritionEstimate` render
    idle panel cleanly; no broken layout.
13. **Non-medical copy:** No forbidden terms appear in any state.
14. **YouTube-video import phase:** "Looking up the video…" → "Reading the
    video…" phase copy appears during AI-direct video fallback import; source
    byline reads "From YouTube video".
15. **Screenshots:** Capture desktop and 375px mobile for at minimum idle,
    full-estimate, partial-match, and one error state.

---

## 7. Frontend Handoff Notes

- The `NutritionPanel` is a new component at
  `src/components/recipe/NutritionPanel.tsx`.
- It sits inside `src/app/(app)/recipes/[id]/page.tsx` after `<AdaptPanel>`
  and before the bottom action row.
- The serving-scaler interaction: `NutritionPanel` receives `canonicalServings`
  (from `recipe.servings`) and `currentServings` (from the stepper state already
  tracked by the recipe detail page). Per-serving macros displayed = stored
  `perServing` × (`currentServings` / `canonicalServings`). Full-recipe macros
  are always displayed at the stored `fullRecipe` total.
- The "Calculate" and "Recalculate" actions hit a new endpoint
  `POST /api/recipes/[id]/nutrition` (Sprint 07 task 7.10).
- No new dependency is needed. All math is integer/float arithmetic.
- Do not introduce a `NutritionFactsPanel` name anywhere in code. The user-facing
  name is "Macros". Use `NutritionPanel` as the component name.
