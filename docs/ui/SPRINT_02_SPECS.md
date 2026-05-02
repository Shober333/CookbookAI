# Sprint 02 Design Specs — CookbookAI

> **Status:** Locked — Sprint 2 design contract (canonical, merged 2026-05-01)
> **Owner:** [UI/UX]
> **Reads:** `REGISTER.md`, `UI_KIT.md`, `COMPONENT_SPECS.md`, `PAGE_LAYOUTS.md`, `STATES.md` first.
> **Audience:** `[DEV:frontend]` for Sprint 2 frontend tasks F1–F4.
>
> **Note:** This file consolidates two earlier drafts that disagreed on
> real points (naming, appliance list, AdaptPanel structure). Merged
> with Founder approval 2026-05-01. The older `sprint_02_design_brief.md`
> at `docs/sprints/sprint_02/` is now a stub pointing here.

This file specs four new UI surfaces and one revision needed for Sprint 2:

1. **`/equipment` settings page** (F1) — new standalone page
2. **Inline AdaptPanel on recipe detail** (F2) — replaces the old `/recipes/[id]/adapt` standalone page
3. **Library search input** (F3) — header-mounted search on `/library`
4. **Recipe download as Markdown** (F4) — secondary action on recipe detail
5. **Naming + nav cleanup** — lock "Kitchen" vs "Equipment", retire unused routes

**This file extends, not replaces, the Sprint 0 specs.** Where it conflicts with `PAGE_LAYOUTS.md` or `COMPONENT_SPECS.md`, the conflicting sections in those files are flagged in §7 below for update.

---

## 0. Naming decision — "Kitchen" wins (LOCKED)

Sprint 0 spec used "Equipment" as the nav label and adapter page name. Sprint 2 dev TODO says "Kitchen". They are the same thing in two voices.

**Locked: "Kitchen"** for user-facing copy. Reasons:

- Warmer and register-aligned (`REGISTER.md` §7 — voice is calm, second-person, slightly old-fashioned)
- Avoids the cold "Equipment" label, which read as a database concept
- Aligns with the adapt CTA already shipped: "Adapt for **my kitchen**"

**Internal route stays `/equipment`** — already shipped in Sprint 1 Topbar. Renaming would force a redirect and a Topbar change. Not worth it. Convention: route URLs are technical; UI copy is editorial. They diverge here intentionally.

**Files affected by this rename:**

- `src/components/layout/Topbar.tsx` — change nav label from "Equipment" to "Kitchen". Route stays `/equipment`.
- All Sprint 2 UI copy referring to the page uses "Kitchen", "your kitchen", "kitchen settings".

---

## 1. `/equipment` — Kitchen settings page (F1)

A standalone settings page where the user manages their kitchen. One screen, one form, save and done.

### 1.1 Layout

```
┌────────────────────── Topbar ─────────────────────────┐
├───────────────────────────────────────────────────────┤
│                                                       │
│   Eyebrow: "Settings"                                 │
│   Headline: "Your kitchen."                           │
│   Deck: "Tell us what you have, and we'll adapt..."  │
│                                                       │
│   ─────────────────────────────                       │
│                                                       │
│   ┌─────────┐ ┌─────────┐ ┌─────────┐                │
│   │ ✓ Stov… │ │ ✓ Oven  │ │   Air f │                │
│   └─────────┘ └─────────┘ └─────────┘                │
│   ┌─────────┐ ┌─────────┐ ┌─────────┐                │
│   │   Slow  │ │ ✓ Micro │ │   Inst… │                │
│   └─────────┘ └─────────┘ └─────────┘                │
│   ┌─────────┐ ┌─────────┐                             │
│   │   Grill │ │   Blend │                             │
│   └─────────┘ └─────────┘                             │
│                                                       │
│   [ Save changes ]   [Last saved 2 minutes ago]      │
│                                                       │
└───────────────────────────────────────────────────────┘
```

### 1.2 Tokens

- Page container: max-width `--measure` (620px), centered
- Page header → divider: 22px gap, then `0.5px solid --color-border`
- Divider → chip grid: 22px gap
- Chip grid → save button: 28px gap

### 1.3 Page header

| Slot | Token | Copy |
|---|---|---|
| Eyebrow | `text-eyebrow`, `--color-accent` | "Settings" |
| Headline | `text-display-md`, `font-display` 500, `--color-ink` | "Your kitchen." |
| Deck | `text-deck`, `font-display` italic, `--color-ink-muted` | "Tell us what you have, and we'll adapt recipes to fit." |

### 1.4 Equipment chip grid

Reuses the **EquipmentChip** component from `COMPONENT_SPECS.md` §6 unchanged. Eight chips total, 3-column grid at all viewports, 8px gap.

**Lock the chip order:**

```
Stovetop · Oven · Air fryer
Slow cooker · Microwave · Instant Pot
Grill · Blender
```

Most-common first. The 8 backend keys (per `dev_todo.md` Task B1 Zod schema: `oven`, `stovetop`, `microwave`, `air_fryer`, `slow_cooker`, `grill`, `instant_pot`, `blender`) map to display labels:

| Backend key | Display label |
|---|---|
| `stovetop` | Stovetop |
| `oven` | Oven |
| `air_fryer` | Air fryer |
| `slow_cooker` | Slow cooker |
| `microwave` | Microwave |
| `instant_pot` | Instant Pot |
| `grill` | Grill |
| `blender` | Blender |

**Note:** Sprint 0 included "Wok" and "Sous vide". Sprint 2 backend dropped them and added "Blender". **Sprint 2 list wins** — it matches the actual API contract. The mockup label list in `PAGE_LAYOUTS.md` §5 is now stale on this point; flagged for cleanup in §7.

### 1.5 Save action

- "Save changes" button: primary variant (see `UI_KIT.md` §8 Buttons)
- Position: below chip grid, left-aligned (not centered, not full-width)
- States:
  - **Default** — enabled when current selection differs from saved state; disabled when nothing has changed
  - **Saving** — label changes to "Saving…", disabled, no pulse or spinner (per `REGISTER.md` §6 — no decorative motion on system actions)
  - **Saved** — after success, label flashes back to "Save changes", with a quiet inline confirmation to its right
  - **Error** — see §1.7

**Inline confirmation (right of button):**

- `text-ui-sm`, `--color-ink-muted`
- Copy: "Saved." then "Last saved {relativeTime}." after a moment (e.g., "2 minutes ago")
- Fades in over `--motion-fade` after save success
- No tick icon, no celebration

### 1.6 Initial load behavior

- Mount → `GET /api/equipment` → set selected chips from response
- While loading: chip grid renders disabled (chips at 30% opacity, not interactive). No skeleton — chips appear in their final positions immediately, just inactive until data lands. Loading is fast (<300ms typical) and a skeleton would feel like more work than it is.

### 1.7 Error states

| Failure | Treatment |
|---|---|
| `GET /api/equipment` fails | Below the headline: "We couldn't load your kitchen settings. Refresh to try again." in `--color-accent-strong`, `text-body-sm`. Chips remain disabled. |
| `PUT /api/equipment` fails | Inline to the right of the Save button: "Couldn't save. Try again." in `--color-accent-strong`. Button re-enables so the user can retry. |
| Unauthenticated (401) | Standard auth redirect handled by `(app)` layout; no in-page treatment needed |

### 1.8 Empty selection

User with zero appliances saved:

- All chips render unselected
- Save button disabled until at least one chip toggled on (per dev TODO B3 the AI adapt requires `appliances.length >= 1`; enforce same minimum here)
- A small inline hint below the chip grid in `--color-ink-muted`, `text-body-sm`, italic: *"Pick at least one to start."*

### 1.9 Mobile layout

- Container goes full width with 20px gutters
- Chip grid stays 3-column at 375px (chips are narrow enough — verify with the smallest chip label "Air fryer" doesn't break)
  - **If "Slow cooker" or "Instant Pot" wraps a chip on the smallest viewports**: drop to 2-column at `< 380px` only. Spec the breakpoint as `xs:` or use a `@container` query.
- Save button goes full-width on mobile only (`md:` breakpoint reverts to auto-width)
- Inline confirmation moves below the button on mobile (`text-ui-sm`, `--color-ink-muted`, 4px gap)

### 1.10 Accessibility

- Page heading is `<h1>` with the headline copy
- Chip grid wrapped in `<fieldset>` with `<legend class="sr-only">Your equipment</legend>`
- Each EquipmentChip already has `aria-pressed` per its component spec — reuse unchanged
- Save button: `aria-describedby` pointing to a visually-hidden status region that announces "Saved" / "Couldn't save" via `aria-live="polite"`

### 1.11 Files to create

- `src/app/(app)/equipment/page.tsx` — the page (client component)
- No new components — reuse `EquipmentChip` from Sprint 0 spec

---

## 2. AdaptPanel — inline adapt flow on recipe detail (F2)

**Replaces** the standalone `/recipes/[id]/adapt` page from Sprint 0. The adapt flow now lives **inline on the recipe detail page**, below the steps.

### 2.1 Why the change from Sprint 0

Sprint 0 made adaptation its own page with a chip grid + diff view. Sprint 2 moves the chips to `/equipment` (one-time setup, persistent profile) and brings just the *result* inline on the recipe.

This is a better product:

- The user's appliances rarely change; making them re-pick on every recipe was friction
- The adapt result deserves to live next to the original recipe, not on a separate page where the user has to context-switch
- Saving an adaptation now produces a versioned step list on the same page, not a navigation event

### 2.2 What's deprecated

The standalone `/recipes/[id]/adapt` route built in Sprint 1 (referenced from RecipeDetail.tsx line "router.push(`/recipes/${recipe.id}/adapt`)") **goes away**. The "Adapt for my kitchen" button on RecipeDetail no longer navigates — it expands the inline AdaptPanel below the recipe steps.

The route directory `src/app/(app)/recipes/[id]/adapt/` should be deleted in F2's commit. If users have it bookmarked: redirect to the parent recipe page in `next.config.ts`.

The Sprint 0 `AdaptDiff` component (`COMPONENT_SPECS.md` §7) is also **deprecated** for MVP per Founder decision 2026-05-01. The spec stays on disk in case post-MVP brings back a compare-versions feature (e.g., when a recipe has multiple adaptations). Do not implement.

### 2.3 Anatomy

The AdaptPanel is a new section below the existing Method section, above the Delete button.

```
┌─ Method ───────────────────────────────────────────────┐
│ i.   Bring water to a boil...                          │
│ ii.  Toast the pepper...                               │
│ ...                                                    │
└────────────────────────────────────────────────────────┘

       ─────────────────────────────────

┌─ AdaptPanel (idle) ────────────────────────────────────┐
│  Eyebrow: "Adapt for your kitchen"                     │
│  Deck: "Rewrite the steps with the equipment you have."│
│  [ Adapt for my kitchen ]                              │
└────────────────────────────────────────────────────────┘

  OR (result, after AI rewrite):

┌─ AdaptPanel (result) ──────────────────────────────────┐
│  Eyebrow: "Adapted for your kitchen"                   │
│  i.   Adapted step one...                              │
│  ii.  Adapted step two...                              │
│  iii. Adapted step three...                            │
│                                                        │
│  Notes — Brief italic notes from the AI...             │
│                                                        │
│  [ Save this version ]   [ Discard ]                  │
└────────────────────────────────────────────────────────┘

  OR (saved version exists, reopened later):

┌─ AdaptPanel (saved, collapsed) ────────────────────────┐
│  Eyebrow: "Adapted for your kitchen — saved"           │
│  [ Show adapted version ▾ ]                           │
└────────────────────────────────────────────────────────┘
```

### 2.4 Five states

The panel handles five distinct states:

| State | When | Content |
|---|---|---|
| **Idle** | No saved adaptation, no pending rewrite | Eyebrow + deck + "Adapt for my kitchen" button |
| **Idle (no equipment)** | User has no appliances saved in `/equipment` | Eyebrow + deck + disabled button + "Set up your kitchen →" link |
| **Loading** | Rewrite in progress | Eyebrow + status pulse + "Rewriting…" line |
| **Result** | Rewrite complete, not yet saved | Eyebrow + adapted steps + notes + Save/Discard buttons |
| **Saved** | `recipe.adaptedSteps` is non-null | Eyebrow + "Show adapted version" toggle that expands inline |
| **Error** | Rewrite failed | Idle layout + inline error + retry |

### 2.5 Tokens

- Section gap above (separating from Method): 22px + a `0.5px solid --color-border` rule
- Panel container: max-width same as recipe content (`--measure`, 620px), inherits from parent
- Internal padding: none (the panel sits flush within the recipe column — consistent with how Ingredients and Method are typeset)
- Eyebrow → button (idle): 14px gap
- Eyebrow → adapted steps (result): 12px gap
- Adapted step list: same typography as Method (Roman numerals, italic terracotta, `--min-width: 22px`)

### 2.6 Idle state

| Slot | Token | Copy |
|---|---|---|
| Eyebrow | `text-eyebrow`, `--color-accent` | "Adapt for your kitchen" |
| Deck | `text-deck`, `font-display` italic, `--color-ink-muted` | "Rewrite the steps with the equipment you have." |
| Button | Filled accent variant (`UI_KIT.md` §8) | "Adapt for my kitchen" |

#### Disabled-when-no-equipment behavior (Idle, no equipment)

If the user has no appliances saved:

- Button is disabled
- Hover/focus shows a tooltip via `title=""` and `aria-describedby` to a visually-hidden helper: *"Save your equipment in Kitchen settings first."*
- A `<Link href="/equipment">` appears below the button as a secondary action: "Set up your kitchen →"
  - `text-ui-sm`, `--color-ink-muted`, underline-offset hover

This is the only place in the product where a button is disabled with an explanatory inline link — the link does the explaining the disabled state can't.

### 2.7 Loading state

When the user clicks "Adapt for my kitchen":

1. Replace the deck and button with a status row
2. Status row: pulse dot + status copy

| Slot | Token | Copy |
|---|---|---|
| Eyebrow | unchanged from idle | "Adapt for your kitchen" |
| Pulse dot | `--color-accent`, `--motion-pulse` | (decorative, `aria-hidden`) |
| Status text | `text-eyebrow`, `--color-accent` | "Rewriting…" |

This matches the import progressive-phase pattern from `STATES.md` §4 and `ImportForm.tsx`. Same pulse, same eyebrow style. The user knows what AI work-in-progress looks like; reuse the visual.

**Implementation note:** the adapt endpoint is blocking JSON (per dev TODO B3) — there's no token streaming. The pulse dot is honest about *that the AI is working*, not about token-by-token output. Don't fake a streamed line list here.

### 2.8 Result state

After `POST /api/ai/adapt` returns successfully:

| Slot | Token | Copy |
|---|---|---|
| Eyebrow | `text-eyebrow`, `--color-accent` | "Adapted for your kitchen" |
| Step list | Same as Method section: Roman numerals italic terracotta + `font-display` `text-body` step text | (from API response) |
| Notes | `text-deck`, `font-display` italic, `--color-ink-muted`, prefixed with "Notes — " | (from API response, only render if non-empty) |
| Save button | Primary variant | "Save this version" |
| Discard button | Ghost variant | "Discard" |

#### Layout

- Step list: same `<ol style="list-style-type: lower-roman">` pattern from Method
- Step gap: 10px (matches Method)
- Notes paragraph: 14px gap above, 14px gap below
- Buttons row: side by side at desktop, stacked full-width on mobile
- Buttons gap: 12px between

#### Save behavior

- Click → `PATCH /api/recipes/[id]` with `{ adaptedSteps }`
- During save: button label changes to "Saving…", both buttons disabled
- After success: panel transitions to **Saved** state (§2.10)
- After failure: inline error below the buttons, retry stays available

#### Discard behavior

- Click → state resets to **Idle**
- No confirmation modal — discard is non-destructive (the AI result is in memory, not persisted)
- The result is lost; user must click "Adapt for my kitchen" again to regenerate

### 2.9 Error state (after rewrite fails)

| Slot | Copy |
|---|---|
| Eyebrow | "Adapt for your kitchen" (back to idle eyebrow) |
| Inline error | "We couldn't rewrite this. Try again, or check your kitchen settings." in `--color-accent-strong`, `text-body-sm` |
| CTA 1 | "Try again" (filled accent variant) |
| CTA 2 | "Adjust kitchen →" (ghost variant, links to `/equipment`) |

### 2.10 Saved state

When the recipe loads with `recipe.adaptedSteps !== null`:

| Slot | Token | Copy |
|---|---|---|
| Eyebrow | `text-eyebrow`, `--color-accent` | "Adapted for your kitchen — saved" |
| Toggle | Ghost variant button with chevron | "Show adapted version ▾" / "Hide adapted version ▴" |
| Step list (when expanded) | Same as result state | (from `recipe.adaptedSteps`) |

#### Re-adapt affordance

Below the expanded adapted steps, a secondary action:

- "Re-adapt with current kitchen" — accent outline variant, `text-ui-sm`
- Click → triggers a new rewrite (returns to **Loading** state, then **Result** state with new content). Saving overwrites the previous adaptation — **no confirmation modal** (Founder decision: re-adapt is non-destructive friction).

This handles the case where the user changed appliances after saving an adaptation.

#### Original vs. adapted toggle

The original Method section above remains visible. The user always has access to both — original is the default, adapted expands below. **No "view original / view adapted" toggle on the Method section itself.** Two views, both inline, both visible.

#### Identical-result handling

The adapt endpoint may return steps that are character-for-character identical to the original (e.g., the recipe was already perfectly suited to the user's equipment).

**Treatment:** show the result anyway with a one-line note: *"Notes — Your kitchen already has everything; no changes needed."* Don't suppress the panel. Users learning the feature need to see it ran successfully.

### 2.11 Component spec — `AdaptPanel`

```
Props:
- recipeId: string
- savedAdaptedSteps?: string[] | null    // from recipe.adaptedSteps
- savedAdaptedNotes?: string | null      // from recipe metadata, if persisted
- savedAdaptedAt?: Date | null           // optional — for "saved 2 days ago" display
- userHasAppliances: boolean              // derived from /api/equipment, passed from parent
- isShowingAdapted: boolean               // for parent to know which version is being viewed
- onShowingAdaptedChange: (isShowing: boolean) => void  // for the Markdown export to read
- onAdapt: (recipeId, appliances) => Promise<AdaptResponse>
- onSave: (adaptedSteps: string[]) => Promise<void>
- onDiscardSaved: () => Promise<void>
```

The `isShowingAdapted` lift-up exists so the recipe detail page knows
which version (original or adapted) the user is currently viewing —
the Download .md button reads this to decide what to export. See §4.

The component owns its own loading/result/error state internally. The parent passes the *initial* saved state and the action callbacks.

### 2.12 Accessibility

- Section wrapped in `<section aria-label="Adapt for your kitchen">`
- Status text in loading state has `role="status"` and `aria-live="polite"`
- Step list when result is shown is `<ol>` with `lower-roman` list-style (matches Method)
- "Show adapted version" toggle has `aria-expanded` reflecting current state
- Pulse dot `aria-hidden="true"`
- Reduced motion: pulse static (opacity 1, no animation); no other motion to suppress

### 2.13 Files to create

- `src/components/recipe/AdaptPanel.tsx` — the panel (client component)
- `src/app/(app)/recipes/[id]/page.tsx` — pass `recipe.adaptedSteps` to RecipeDetail; render `<AdaptPanel>` after Method
- `src/components/recipe/RecipeDetail.tsx` — replace the existing adapt-button-that-navigates with `<AdaptPanel ... />` rendered after Method section. Remove the controls-bar Adapt button.
- `src/app/(app)/recipes/[id]/adapt/` — **delete this directory** (the old standalone page is dead)

---

## 3. Library search input (F3)

A search input on the library page header. Live-filters the recipe list as the user types.

### 3.1 Why on the page, not in the topbar

Sprint 0 placed search in the topbar with a `⌘K` overlay pattern. Sprint 1 dev didn't build it (correctly — it would have been over-engineered for an MVP search). Sprint 2 lands it on the library page header instead, which is **simpler, more discoverable, and a better fit for the size of the library**.

The Sprint 0 spec for topbar search in `COMPONENT_SPECS.md` §8 is **deferred to post-MVP**. When the library exceeds ~50 recipes and search becomes the primary findability tool, revisit.

### 3.2 Anatomy

Replaces or extends the library page header layout.

**Before (Sprint 1):**

```
Eyebrow: "Your library"
Headline: "24 recipes, kept carefully."
Sub: "Most recently added."
─────────────────────────────────
[List of recipes]
```

**After (Sprint 2):**

```
Eyebrow: "Your library"
Headline: "24 recipes, kept carefully."
Sub: "Most recently added."
─────────────────────────────────
[ 🔎 Search recipes…                              ]
─────────────────────────────────
[List of recipes]
```

The search input sits **between** the divider and the recipe list — visually anchored to the list, not the headline.

### 3.3 Search input

Reuses the standard input pattern from `UI_KIT.md` §8 with one change: a leading icon.

| Slot | Token |
|---|---|
| Container | full-width input within library `--measure-wide` (880px) |
| Height | 38px desktop, 44px mobile (tap target) |
| Padding | 12px left for icon, 14px right |
| Border | `0.5px solid --color-border-strong`, `--radius-sm` |
| Background | `--color-paper` |
| Font | Inter 400, `text-body` |
| Icon | Heroicons outline `magnifying-glass`, 16×16, `--color-ink-faint`, 12px from left edge |
| Placeholder | "Search recipes…" in `--color-ink-faint` |
| Focus | Border `--color-accent`, box-shadow focus ring |

### 3.4 Behavior

- Debounce 300ms on input change (per dev TODO F3)
- Trim whitespace before query
- Empty input → fetches the unfiltered list (full library)
- Non-empty input → `GET /api/recipes?q={trimmedTerm}`
- Updates URL query string (`/library?q=cacio`) so search state survives refresh and is shareable. Use `router.replace`, not `router.push`, so back-button doesn't replay every keystroke.
- On mount, read `?q=` from URL and pre-fill the input
- Pressing `Esc` while focused: clear the input

### 3.5 Loading state during search

Per dev TODO F3: "While fetching, dim the recipe grid (opacity)."

- The recipe list (the `<RecipeListItem>` stack) gets `opacity: 0.5`, `pointer-events: none` while fetching
- The search input itself stays fully interactive
- Transition: `opacity 200ms ease-out`
- No skeleton — the dim is enough; flashing skeletons mid-typing reads jittery

### 3.6 Empty result state

When `q` is non-empty and zero results return:

```
[ 🔎 cacio                                         ]

   No recipes matching "cacio".

   [Clear search]
```

| Slot | Token | Copy |
|---|---|---|
| Empty message | `font-display` italic, `text-deck`, `--color-ink-muted`, centered | `No recipes matching "{term}".` |
| Clear button | Ghost variant, `text-ui-sm` | "Clear search" |
| Padding | 40px top, 60px bottom | (matches the empty-library state padding) |

**Distinct from empty-library state.** This is "no matches", not "no recipes". The Caveat warm moment **does not** appear here — the warm moment is reserved for the truly-empty library, not for "you searched something we don't have." Per `UI_KIT.md` §10 warm-moment budget.

### 3.7 Headline behavior during search

When a search query is active and results return non-empty:

- Headline updates: `"{n} matching {recipes}, kept carefully."` for n results
  - n=1: "One matching recipe, kept carefully."
  - n>1: "5 matching recipes, kept carefully."
- Sub line updates: `"Matching '{term}'"`

When the search is cleared:

- Headline reverts to the count headline pattern
- Sub reverts to "Most recently added."

### 3.8 Mobile

- Search input goes full-width with 20px gutters (same as the rest of the library page)
- Input height: 44px on mobile (tap target floor), 38px on desktop
- No layout changes — single column on mobile is the same as desktop minus the wider container

### 3.9 Accessibility

- Input has visible `<label class="sr-only">Search recipes</label>` (screen-reader-only label since the placeholder isn't a label)
- Input `type="search"` so mobile browsers show a clear button affordance
- Magnifying glass icon `aria-hidden="true"` (decorative; the label conveys purpose)
- The recipe list when dimmed during fetch: add `aria-busy="true"` to the list container
- Empty result `<p>` has `role="status"` so screen readers announce when search results change

### 3.10 Files to update

- `src/app/(app)/library/page.tsx` — add search state, debounce, query param wiring, empty-search state

---

## 4. Recipe download as Markdown (F4)

A small secondary action on the recipe detail page that exports the recipe as a `.md` file.

### 4.1 Placement

Currently on `RecipeDetail.tsx`, the bottom of the page has a single "Delete recipe" button in `--color-ink-ghost`. Sprint 2 adds a "Download .md" button **next to it**.

```
┌────────────────────────────────────────┐
│ ...recipe content...                   │
├────────────────────────────────────────┤
│  [Download .md]   [Delete recipe]      │
└────────────────────────────────────────┘
```

### 4.2 Anatomy

Same row as Delete recipe. Two ghost-style text buttons separated by a `·` separator.

| Slot | Token |
|---|---|
| Container | `<div>` with horizontal flex, gap 16px, top border `0.5px solid --color-border` and 20px top padding (matches existing Delete button container) |
| Download button | Ghost variant: `font-ui`, `text-ui-sm`, `--color-ink-muted`, underline on hover |
| Delete button | Unchanged — already in `--color-ink-ghost`, hover to `--color-ink-muted` |
| Separator | A `·` middle-dot in `--color-ink-faint`, between the two buttons |

**Visual hierarchy:** Download is more common than Delete, so it goes first (left). Both are tertiary actions — neither gets the primary or accent treatment.

### 4.3 Behavior

Per dev TODO F4:

- Pure client-side; no API call
- Generate Markdown string from `recipe` object in browser
- Trigger download via Blob → object URL → anchor click → revoke
- After download: no toast, no confirmation. The browser shows its own download indicator.

#### Founder-locked rule (2026-05-01): export the version the user is currently viewing

If the recipe has no `adaptedSteps`, or the user is currently viewing the original (AdaptPanel collapsed in saved state), export the **original**.

If the recipe has `adaptedSteps` AND the user is viewing the adapted version (AdaptPanel saved-state expanded), export the **adapted**.

**Never export both.** This was Founder-decided 2026-05-01.

#### Markdown format

**Case A — exporting the original:**

```markdown
# {recipe.title}

{recipe.description ? "*" + recipe.description + "*" + "\n\n" : ""}
_Source: {extractDomain(recipe.sourceUrl)}_  
**Servings:** {currentServingCount}

## Ingredients

- {amount} {unit} {name}{notes ? ", " + notes : ""}
- ...

## Method

1. {step}
2. ...
```

**Case B — exporting the adapted version:**

```markdown
# {recipe.title} (adapted for your kitchen)

{recipe.description ? "*" + recipe.description + "*" + "\n\n" : ""}
_Source: {extractDomain(recipe.sourceUrl)}_  
**Servings:** {currentServingCount}

## Ingredients

- {amount} {unit} {name}{notes ? ", " + notes : ""}
- ...

## Method

1. {adaptedStep}
2. ...
```

The `(adapted for your kitchen)` suffix on the title makes the file self-documenting — opening the `.md` later, the user knows which version they exported.

#### Key rules

- **Use the user's currently-displayed amounts.** If they have servings = 6 and unit = imperial selected, the export reflects that.
- **Method uses Arabic numerals (`1.`, `2.`)**, not Roman. Markdown doesn't render lower-roman natively across editors; Arabic ordered lists are universal.
- **Empty fields skip cleanly.** No "*Source: undefined*". No empty sections.

#### Filename

| Case | Filename |
|---|---|
| Exporting original | `<slugified-title>.md` |
| Exporting adapted | `<slugified-title>-adapted.md` |

`slugify(recipe.title)` rules: lowercase, ASCII letters/numbers/hyphens only, hyphens for spaces.

Examples:
- "Cacio e Pepe with Brown Butter" → `cacio-e-pepe-with-brown-butter.md`
- Adapted version → `cacio-e-pepe-with-brown-butter-adapted.md`
- "Mom's Sunday Bolognese" → `moms-sunday-bolognese.md`
- "Hot Dogs!" → `hot-dogs.md`

### 4.4 States

| State | Visual |
|---|---|
| Default | Button text "Download .md" |
| Hover | Underline appears |
| Active (clicking) | No special state — download fires immediately |
| Error | (Should not happen — pure client-side. If `Blob` or download API throws, log to console; no user-facing error) |

### 4.5 Accessibility

- Button has `aria-label="Download recipe as Markdown"`
- The download itself announces nothing — browsers handle download UI

### 4.6 Files to update

- `src/components/recipe/RecipeDetail.tsx` — add download button next to Delete; read `isShowingAdapted` from AdaptPanel state to decide which version to export
- `src/lib/recipe-utils.ts` — add helpers:

```typescript
function recipeToMarkdown(
  recipe: RecipeResponse,
  options: {
    servings: number;          // current scaled servings
    unitSystem: 'metric' | 'imperial';
    useAdapted: boolean;       // export adapted version?
  }
): string

function slugify(title: string): string
```

If implementation prefers to store the `isShowingAdapted` flag in URL state or local state on the recipe page rather than passing it down from AdaptPanel, that's fine — design doesn't dictate architecture here.

---

## 5. Import progress copy revision

Per CTO Sprint 1 review #5: "Decide whether the current progress UI is acceptable for non-token streaming extraction, or whether `[UI/UX]` should revise the import state language."

### 5.1 Verdict: keep the current copy. Minor adjustment.

I read `ImportForm.tsx`. The status copy is **already honest enough**:

- "Reading the page…" → backend is fetching the URL
- "Finding the recipe…" → AI has identified `"title"` in the response
- "Reading ingredients…" → AI has identified `"ingredients"` in the response
- "Reading the method…" → AI has identified `"steps"` in the response
- "Done" → terminal

These map to **real progress signals** — the dev is detecting JSON keys appearing in the streamed response body and updating phase state. That's not token streaming, but it's not theatre either. The phases reflect actual backend progress milestones.

**The pulse dot is honest** about "the AI is working" — which is true regardless of whether the bytes coming back are tokens or one big JSON blob.

### 5.2 What I'd change

Two micro-fixes to make the copy more honest:

#### Fix 1 — Rename "streaming" status to "working"

Internal `Status` type currently has `"streaming" | "done" | "error" | "idle"`. The word "streaming" leaks into team discussion and reads as a promise. Rename to `"working"` in code. **No user-facing copy changes** — this is internal naming hygiene.

#### Fix 2 — Pulse-dot reduced-motion

Per `UI_KIT.md` §7 reduced motion: pulse should be static (opacity 1, no animation) when `prefers-reduced-motion: reduce`. The current `ImportForm.tsx` doesn't explicitly handle this. The global `globals.css` rule disabling animations should catch it, but verify visually.

### 5.3 Files to update

- `src/components/import/ImportForm.tsx` — rename `Status` member from `"streaming"` to `"working"` (cosmetic, internal-only)
- (Optional) Verify reduced-motion behavior on the pulse dot — should be handled by global CSS, but worth a dev check during F2 work since the AdaptPanel uses the same pulse pattern

---

## 6. Founder Decisions Log

Decisions made or confirmed during the Sprint 2 design review with the
Founder, 2026-05-01:

1. **Markdown export with adapted steps.** Export only the version the
   user is currently viewing. Original or adapted, not both. Filename
   suffix `-adapted` distinguishes them on disk. (See §4.3.)
2. **Sign-out placement long-term.** Topbar at desktop for MVP. Profile
   menu is a post-MVP design task. (See §7 below for Topbar update.)
3. **AdaptDiff component deprecation.** Spec file stays on disk in
   `COMPONENT_SPECS.md` §7 in case post-MVP brings back a
   compare-versions feature. Do not implement in Sprint 2 or 3. (See §2.2.)
4. **Mobile topbar collapse.** Option 3 — search-button-only — accepted.
   Drop inline nav on mobile entirely; library is the default route;
   Equipment (sub: now "Kitchen") is reachable from the library page header.
5. **Naming: "Kitchen" wins.** UI copy uses "Kitchen", "your kitchen",
   "kitchen settings". Internal route stays `/equipment`. (See §0.)
6. **Adapted library tag.** Promote from earlier open question: when
   `recipe.adaptedSteps !== null`, RecipeListItem renders an `Adapted`
   tag in terracotta. Implemented in F2 alongside the AdaptPanel work.
7. **Re-adapt overwrites without confirmation.** Re-adapting a saved
   adaptation overwrites it; no modal. The original is always
   preserved.

These decisions are locked. Re-opening any of them is a structural
change that requires a new Founder decision.

---

## 7. Open questions for the Founder (none currently)

All Sprint 2 open questions resolved 2026-05-01 (see §6 Founder
Decisions Log). New questions may arise during F1–F4 implementation;
they go to `[UI/UX]` via sprint TODO comments.

---

## 8. Sprint 0 spec updates required

Sprint 2 changes invalidate parts of the original specs. These updates should land alongside or shortly after Sprint 2 dev work — flagging them here so they don't drift:

| File | Section | Change needed |
|---|---|---|
| `PAGE_LAYOUTS.md` | §5 (Equipment Adapter standalone page) | Mark deprecated; replaced by §1 of this file plus AdaptPanel inline. |
| `PAGE_LAYOUTS.md` | §5 *Equipment list source* | Update appliance list: replace "Wok" and "Sous vide" with "Blender". |
| `PAGE_LAYOUTS.md` | §2 (Library) | Add search input section (after the divider, before the list). |
| `PAGE_LAYOUTS.md` | §3 (Recipe Detail) | Update controls bar: "Adapt for my kitchen" no longer navigates; it's an inline panel below Method. Add Download .md button to bottom action row. |
| `COMPONENT_SPECS.md` | §1 (RecipeListItem) | Confirm `Adapted` tag is rendered when `recipe.adaptedSteps !== null` (new derivation source). |
| `COMPONENT_SPECS.md` | §7 (AdaptDiff) | Mark deprecated (already done in canonical doc 2026-05-01). |
| `COMPONENT_SPECS.md` | §8 (Topbar) | Update nav: "Equipment" → "Kitchen" label. Mention search-on-page is the active pattern; topbar search is deferred. |
| `COMPONENT_SPECS.md` | (new section) | Add §9: AdaptPanel — see §2 of this file for the full spec. |
| `STATES.md` | §4 (Import error states) | Confirm "Paste recipe text instead" CTA is post-MVP — Sprint 1 didn't build the textarea fallback, and the live error states are simpler. |
| `STATES.md` | §5 (Adapter error states) | Update — Sprint 0 spec assumed standalone adapter page; now it's inline. The error treatment in §2.9 of this file replaces it. |
| `UI_KIT.md` | §10 (Warm moment budget) | Already updated 2026-05-01: row added for Equipment settings (0); Adapter row updated to reflect inline-on-recipe-detail. |
| `UI_KIT.md` | §8 (Buttons) | Already updated 2026-05-01: accent variant has filled and outline forms. |

A handful of these updates have already been folded into the canonical
docs as of the 2026-05-01 changelog entries. Verify each before
landing the rest as a housekeeping commit after Sprint 2 ships.

---

## Authority

This file is owned by **[UI/UX]**. Adding components, removing them, or
changing contracts in here is a design decision — file it back to
`[UI/UX]`. Devs may not invent props, copy, or token usage outside
what's specified here. New features get new specs.

If a question arises during F1–F4 implementation that this file
doesn't answer, the dev files it as a comment in the sprint TODO, and
`[UI/UX]` responds before the dev unblocks themselves with a guess.
