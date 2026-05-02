# Sprint 02 — UI/UX Review (Alice)

| Field | Value |
|---|---|
| **Sprint** | 02 |
| **Reviewer** | [UI/UX] (Alice) |
| **Source of truth** | `docs/ui/SPRINT_02_SPECS.md` (canonical, merged 2026-05-01) |
| **Code reviewed** | `AdaptPanel.tsx`, `EquipmentChip.tsx`, `library/page.tsx`, `equipment/page.tsx`, `RecipeListItem.tsx`, `RecipeDetail.tsx` |
| **Screenshots reviewed** | 14 in `tests/screenshots/` (full visual pass on Sprint 2 surfaces + Sprint 1 carryover) |
| **Review date** | 2026-05-02 (updated with visual review) |
| **Verdict (design only)** | ✅ **Good — ship.** Code review and visual review converge: spec adherence is high. |

---

## Caveats up front

**The CTO does the architectural Good/Bad/Ugly.** This file covers design adherence and craft only — register conformance, token usage, copy voice, accessibility, state coverage, mobile behavior. Engineering questions (provider abstraction, DB migration safety, route handler patterns) are CTO territory.

This review is now **fully visual** as well as code-based. QA produced screenshots after the initial review and they confirm what the code suggested.

---

## ✅ Good — what landed well

### Spec adherence is high

- **Equipment chip 8-key list** matches the locked Sprint 2 backend schema exactly — Stovetop, Oven, Air fryer, Slow cooker, Microwave, Instant Pot, Grill, Blender. The order in `equipment/page.tsx` (`APPLIANCES` const) matches `SPRINT_02_SPECS.md` §1.4. Wok and Sous vide stayed out, as required.
  - **Visually confirmed** in `equipment-empty.png` and `equipment-saved.png`: 3-column grid in correct order, terracotta-bordered selected chips with filled circle + check mark + non-italic medium-weight label, off-state chips with empty circle + italic muted label.
- **"Kitchen" rename** lives where it should — in user-facing copy only. Routes stayed `/equipment`. Topbar reads "Kitchen" on the equipment page, library page, and recipe detail (when not stale).
- **AdaptPanel covers all five states.** Idle / Idle-no-equipment / Loading / Result / Saved / Error are all wired. The implementation chose a single `mode` enum plus a derived `hasSaved` flag, which reads cleanly and matches my mental model.
  - **Visually confirmed** in `recipe-adapt-loading.png` (loading: terracotta pulse dot + "REWRITING…") and `recipe-adapted.png` (result: "ADAPTED FOR YOUR KITCHEN" eyebrow, "NOTES" with italic body, "STEPS" with Roman numerals, primary "SAVE THIS VERSION" + ghost "Discard").
  - Saved-state visually confirmed in `recipe-adapted-saved.png` (with one layout caveat — see Bad #4 below).
- **`Adapted` library tag is derived from `recipe.adaptedSteps`**, not a separate flag (`RecipeListItem.tsx` line 13). Visually confirmed in `library-search.png`: terracotta-bordered "ADAPTED" tag on the third row, alongside grey-bordered "PASTA" and "QA" tags.
- **Markdown export honors the Founder rule.** `RecipeDetail.tsx` `handleDownload` reads `isShowingAdapted` and uses it to switch both the markdown content and the filename suffix.
- **Margin note responsive behavior** survived intact through Sprint 2 — mobile in-flow with rotation suppressed, desktop absolute-positioned in the right margin with `rotate(3deg)`. (No screenshot exercises this since no recipe has `marginNote` data — see Bad #5.)

### Voice and copy match the register

Visually confirmed across screenshots:

- "Adapt this for your kitchen." — period at the end, calm, second-person. Right voice.
- "We'll rewrite the steps using only what you've got." — natural-language contraction, register-aligned.
- "Saved." (lowercase one-word period) — exactly the quiet-acknowledgment pattern. No tick icon, no toast. Confirmed in `equipment-saved.png` to the right of the disabled save button.
- "It's quiet in here." — empty library headline confirmed in `library-empty.png`.
- "WELCOME BACK" / "Pick up where you left off." (`login.png`) and "GET STARTED" / "Bring recipes home." / "Free, while we're getting started." (`register.png`) — auth pages match `PAGE_LAYOUTS.md` §1 verbatim.
- "ADD A NEW ONE" / "Bring a recipe home." / "Paste a link and we'll read the recipe for you." (`import-form.png`) — register voiced.

### Accessibility is genuinely there

Not as a checklist, as a real pattern. (Same set as before — confirmed by code, no visual change.)

- `EquipmentChip` uses `aria-pressed` on the button, check circle is `aria-hidden`.
- `AdaptPanel` Loading state has `role="status"` + `aria-live="polite"`. Reduced-motion respected via `--motion-pulse` CSS variable.
- Library search `<input type="search">`, sr-only label, magnifying-glass icon `aria-hidden`, `role="status"` on empty-search, `aria-busy` on the recipe list during fetch.
- Equipment page: chip grid in `<fieldset>` with sr-only `<legend>`, save button `aria-describedby` to live status paragraph.

### Identical-result handling is implemented

`AdaptPanel.tsx` lines 86–95 — when `stepsAreIdentical(steps, originalSteps)` and the AI didn't supply notes, the panel inserts the canonical "Your kitchen already has everything; no changes needed." note. Spec compliance §2.8.

### Library search edge cases handled well

- 300ms debounce with cleanup on the timeout ref ✅
- Request sequence guard via `requestSeq.current` so out-of-order responses don't clobber newer state ✅
- `router.replace` not `router.push` so back-button isn't polluted ✅
- Esc-to-clear ✅
- Search input dimming on the recipe list during fetch ✅
- Distinct empty-search vs. empty-library copy and treatment ✅
- **Visually confirmed** in `library-search.png`: terracotta-focused border on the search input, magnifying glass icon at left, list dimmed appropriately, "ADAPTED" tag visible on a recipe.

### `Suspense` split for Next 15 search params

The `LibraryFallback` renders eyebrow + "Loading your library…" headline with the right typography. Smart engineering decision.

### Recipe scaling math works

`recipe-scaled.png` confirms the ServingScaler updates ingredient amounts correctly: 4 → 5 servings, 200 g → 250 g, 120 ml → 150 ml, 2 tbsp → 2.5 tbsp. The scaling ratio is right and the rounding formatter drops trailing zeros where it should.

### Recipe unit conversion math works

`recipe-unit-toggled.png` confirms imperial conversion: 250 g → 8.8 oz, 150 ml → 5.1 fl oz. Math correct.

### Auth & import pages — Sprint 1 quality holds

`login.png`, `register.png`, `import-form.png`, and `import-preview.png` all show clean Sprint 1 implementations. The auth pages have no topbar (correct for unauthenticated routes), centered forms, brand mark + "CookbookAI" italic. The import flow shows the streaming box with phase indicators after submission. All well within spec.

---

## ⚠️ Bad — drift to fix this sprint or next

These don't block ship. They're issues I noticed reading the code and screenshots that should land in either a Sprint 2 cleanup commit or the next sprint.

### ⚠️ 1. The "no equipment" idle hint duplicates the link

**Where:** `AdaptPanel.tsx` lines 207–229, `IdleState` component, the `noEquipment` branch.

```tsx
<p id="adapt-no-equipment" ...>
  Save your equipment in <Link>Kitchen settings</Link> first.
</p>
<p ...>
  <Link>Set up your kitchen →</Link>
</p>
```

Both paragraphs link to `/equipment`. The dev correctly noticed both forms in my spec (`SPRINT_02_SPECS.md` §2.6 mentions both the inline-link sentence AND the "Set up your kitchen →" secondary action) and shipped both, stacked.

**The problem:** stacking two links to the same destination, one immediately above the other, reads redundant. The first sentence already says "in *Kitchen settings* first" with a link — adding a second standalone link 8px below crosses the line from "explanatory" to "nagging".

**My spec was wrong.** I wrote both treatments down without thinking through what they'd look like together. The intent was either-or: the first paragraph for inline explanation, the secondary link for cases where there's no inline copy. The dev shipped both because that's what I wrote.

**Fix:** Drop the second paragraph (lines 222–228). Keep only the first. P1 — fix this sprint or first cleanup commit.

I'll update `SPRINT_02_SPECS.md` §2.6 to remove the second-paragraph treatment.

**Note:** I haven't seen a screenshot of this state (no AdaptPanel-no-equipment screenshot exists in the QA set), so the duplicate is currently invisible to the demo unless a no-equipment user lands on a recipe. Still worth fixing.

### ⚠️ 2. Library search input has unused inline style

**Where:** `library/page.tsx` `<input>` element, `style={{ boxShadow: undefined }}`.

This is dead code. Probably leftover from a focus-ring experiment.

**Fix:** Delete the inline `style` block. P2 — drop in the next housekeeping pass.

### ⚠️ 3. Empty library state has an `mt-2` orphan

**Where:** `library/page.tsx` `showLibraryEmpty` block — wraps content in `mx-auto max-w-[480px] py-[40px] pb-[60px]` and the inner content starts with `<p className="mt-2 …">` directly, no headline above it inside the block.

That `mt-2` comes from when the sub-line followed a now-removed element. With nothing above it in the block, `mt-2` is doing nothing meaningful. Layout is still fine because the parent `py-[40px]` gives the right top space.

**Visually confirmed in `library-empty.png`:** the layout looks correct — eyebrow + headline at page-header level, then divider, then the "Bring something home..." italic line, then the seed-list block. The `mt-2` is harmless cosmetically.

**Fix:** Drop the orphan `mt-2`. P2.

### ⚠️ 4. Topbar position bug on `recipe-adapted-saved.png`

**Where:** the "saved adaptation" state on recipe detail.

`recipe-adapted-saved.png` shows the Topbar rendered **mid-page** instead of pinned at the top. Specifically:

1. PASTA · QA · EXAMPLE.COM eyebrow at top
2. "S2 Screenshot Adapt" headline + deck + "From example.com"
3. **Topbar (CookbookAI / Library / Kitchen / Sign out / + Import) appears here**
4. Then ingredients, method, etc.

This is not the layout pattern. The Topbar should be sticky at the top of the viewport.

**Possible causes:**
- Playwright captured a `fullPage: true` screenshot and the Topbar uses `position: sticky` (not `fixed`), so on full-page capture it stays at the original document position, but then the layout algorithm in browsers can place it inline at its original DOM location which appears as "mid-page" in a full-page screenshot — this is actually **likely a Playwright artifact** and not a real bug
- Less likely: a real layout regression where the page bypasses the `(app)` layout

**Action:** QA should confirm by manually loading `/recipes/[id]` on a recipe with saved `adaptedSteps`, scrolling, and verifying the Topbar stays visible at the top throughout. If it doesn't, that's a P0 layout fix. If it does, this screenshot was captured with `fullPage: true` and the visual artifact is harmless. **Need confirmation before shipping.**

P1 — verify before demo.

### ⚠️ 5. `marginNote` is never passed in production

**Where:** `RecipeDetail.tsx` accepts `marginNote?: string` as a prop, but no recipe in production has this data.

The entire margin-note UX — the one earned warm moment per recipe per the register's Rule 2 — exists in the component but ships with no data feeding it. The Caveat warm moment that defines this register is currently invisible to actual users.

This is a Sprint 0 leftover, not a Sprint 2 regression.

**Visually confirmed:** none of the recipe screenshots show a margin note. This should be the warmest moment in the product and it's missing.

**Not Sprint 2's problem to fix** — this gap predates the sprint. But worth flagging now. P1 to address in the next sprint that touches the recipe model.

I'd recommend: when the schema migration happens, the AI import prompt should ask Claude to extract one memorable line per recipe — *"try the brown butter — game changer"*, *"don't skip the resting time"*, *"this freezes well"*. Then the component's already-built rendering does the rest.

### ⚠️ 6. `<input type="search">` shows browser-default clear-X

**Where:** `library/page.tsx` search input.

**Visually confirmed in `library-search.png`:** the search input shows a small red/pink **×** clear button at the right edge when there's content. This is the browser-native `::-webkit-search-cancel-button` from the user-agent stylesheet for `<input type="search">`.

The X color is browser-default (here a muted red/pink), not register-aligned. The spec doesn't call for it.

**Fix:** add to the input's class:
```css
[type="search"]::-webkit-search-cancel-button {
  display: none;
}
[type="search"]::-webkit-search-decoration {
  -webkit-appearance: none;
}
```

Either kill the X or accept that browsers will inject UI. The clear-via-Esc behavior already exists in the implementation, so the X isn't needed for usability. P2 — small cosmetic.

### ⚠️ 7. Discard confirmation copy isn't register-voiced

**Where:** `AdaptPanel.tsx` line 121, `handleDiscardSaved`:

```ts
if (!window.confirm("Discard the adapted version?")) return;
```

`window.confirm` is fine as a mechanism for MVP — I called it out as acceptable. But "Discard the adapted version?" is functional, not register-voiced. The voice would say "Discard your adapted version?" or "Throw away the adapted version of this recipe?".

Native `window.confirm` UI is brutal and we don't control the buttons, so the win is small. **Punt to post-MVP** when we have a real Dialog component. P2.

### ⚠️ 8. Stale Sprint 1 screenshots in QA pass

**Where:** `recipe-detail.png`, `library-empty.png`, `library-populated.png`, `import-form.png`, `import-preview.png`, `recipe-scaled.png`, `recipe-unit-toggled.png` — all show **"Equipment"** in the Topbar instead of "Kitchen", and the recipe-detail variants show the Sprint 1 controls-bar Adapt button + no AdaptPanel + no Download .md.

These are Sprint 1 screenshots that didn't get regenerated for Sprint 2 visual evidence. **The Sprint 2 build is correct** — the Sprint 2 screenshots (`equipment-*`, `recipe-adapt-*`, `recipe-adapted*`, `library-search.png`) all show "Kitchen" and the new layout.

**Action:** QA should regenerate these screenshots against the current Sprint 2 build before declaring full visual evidence. The QA evidence claim of "Topbar nav reads 'Kitchen'" in `qa_todo.md` is correct for the screenshots that were regenerated; the carryover screenshots prove Sprint 1, not Sprint 2.

P2 — for next QA pass; doesn't block ship.

### ⚠️ 9. Possible UnitToggle state-vs-display mismatch

**Where:** `recipe-unit-toggled.png`.

The UnitToggle visually shows **metric underlined in terracotta** (active state) but the ingredients render with imperial values (8.8 oz, 5.1 fl oz). Two interpretations:

1. **Real bug:** UI shows metric active, content renders imperial → state desync.
2. **Playwright timing:** test set imperial, captured the screenshot, then a state-change reset the UI to metric mid-capture. The conversion math is correct for imperial; the UI just reads "metric".

I lean toward #2 (timing) because the conversion is mathematically right for imperial mode. But **worth a manual check** — load a recipe, click "imperial", verify the underline moves to "imperial" while values change. If it does, this is a Playwright timing artifact. If the UI stays on "metric" even when imperial is selected, it's a real state-display bug.

P1 — verify before demo.

---

## 🔴 Ugly — none confirmed

No structural decisions taken without escalation. No hardcoded hex/font/spacing in new code. No accessibility violations. No mobile breakage in the code paths I read.

The **only candidate** for Ugly is the topbar-mid-page issue on `recipe-adapted-saved.png` (Bad #4), but I believe that's a Playwright artifact, not a real layout bug. **If QA confirms the Topbar is sticky on the live page, no Ugly. If QA finds the Topbar broken on the saved-adaptation state, that becomes a P0 Ugly to fix before demo.**

---

## Spec compliance checklist

| Item | Status |
|---|---|
| All token references trace to `UI_KIT.md` | ✅ verified across all 6 files |
| All states from spec implemented | ✅ idle / idle-no-equipment / loading / result / saved / error all present |
| Component props match the contracts | ✅ AdaptPanel signature matches `COMPONENT_SPECS.md` §9 exactly |
| Accessibility requirements met | ✅ aria-pressed, role=status, aria-live, fieldset/legend, sr-only labels — all present |
| Mobile (375px) — no horizontal scroll | ⚠️ trusting QA evidence; no mobile screenshots in the set |
| Tap targets ≥ 44×44px on mobile | ✅ EquipmentChip min-h-[44px], search input h-[44px] mobile / md:h-[38px] desktop |
| `prefers-reduced-motion` respected | ✅ pulse uses `var(--motion-pulse)` which the global CSS rule disables |
| Copy matches register voice | ✅ all reviewed copy is register-aligned, no "Oops" / "Yikes" / exclamation marks in errors |

---

## What I want for next sprint or housekeeping

In priority order:

1. **(P1)** Drop the second "Set up your kitchen →" paragraph in `AdaptPanel` `IdleState` no-equipment branch. Update `SPRINT_02_SPECS.md` §2.6 to match.
2. **(P1)** QA verify the Topbar stays sticky on `/recipes/[id]` when scrolling, especially when AdaptPanel is in saved state. Resolve Bad #4 before demo.
3. **(P1)** QA verify the UnitToggle active state matches the rendered ingredient values when imperial is selected. Resolve Bad #9 before demo.
4. **(P1)** Add a `marginNote` field to the recipe model and start populating it from the AI extractor. The warm moment is the soul of this register and currently doesn't ship. Carry into Sprint 3.
5. **(P2)** QA regenerate the stale Sprint 1 screenshots (`recipe-detail.png`, `library-empty.png`, `library-populated.png`, `import-form.png`, `import-preview.png`, `recipe-scaled.png`, `recipe-unit-toggled.png`) against the current build.
6. **(P2)** Clear the `SPRINT_02_SPECS.md` §8 doc-drift checklist — `PAGE_LAYOUTS.md` and the older sections of `STATES.md` and `COMPONENT_SPECS.md` that still reference the deprecated standalone adapter page.
7. **(P2)** The `style={{ boxShadow: undefined }}` dead code on the search input.
8. **(P2)** Kill the `::-webkit-search-cancel-button` X icon on the library search input.
9. **(P2)** Replace native `window.confirm` for AdaptPanel discard with a styled Dialog when we add the dialog primitive.
10. **(P2)** The `mt-2` orphan in the empty-library state.

---

## Summary

| Verdict | Why |
|---|---|
| ✅ **Good — ship Sprint 2** | Spec adherence is high. Voice is right. Accessibility is real, not performative. The five AdaptPanel states all work. Search debounce, sequence-guarding, URL state — all the right details. Visual evidence on Sprint 2 surfaces is clean. |
| ⚠️ Two real fixes to verify before demo | The duplicate "Set up your kitchen" link, plus QA confirmation that the Topbar position bug on `recipe-adapted-saved.png` is a Playwright artifact and not a real layout regression. The UnitToggle state-vs-display mismatch also needs a manual sanity check. |
| ⚠️ Latent issue inherited from Sprint 0 | The margin-note warm moment never wired to data. Define for Sprint 3. |
| 🔴 Nothing confirmed blocking | No drift severe enough to block; no accessibility floor breaches; no register violations. Pending QA verification of #4 and #9. |

**Recommendation: ship the sprint** after QA confirms #4 and #9 are not real bugs. Fix the duplicate-link in a small follow-up commit before the Sprint 2 demo if there's time.

Nice work to the dev and QA. The hardest thing for a UI sprint is hitting the spec without losing the voice; this one did both.
