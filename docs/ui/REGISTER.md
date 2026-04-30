# Register — CookbookAI Design Language

> **Status:** Locked — Sprint 0
> **Owner:** [UI/UX] (Alice) — locked 2026-04-29 with the Founder
> **Why this exists:** The register is the *why* behind every visual
> decision in this product. UI_KIT.md tells you what; this file tells
> you why. When in doubt, the register wins over the kit.

---

## 1. The Register, in one line

**Warm Domestic with editorial discipline.**

A cookbook that feels like a thoughtfully kept personal library — paper
warmth, real type, a single hand-drawn moment per recipe — restrained
by the typographic discipline of a good food magazine.

---

## 2. Why this register

CookbookAI sits at an awkward intersection. It's an *AI product* (most
of which feel cold and tool-shaped) that's also a *food product* (most
of which feel decorative and twee). Three other registers were
considered and rejected:

| Considered | Rejected because |
|---|---|
| **Modern utility (Notion-for-recipes)** | Read like a database UI. Recipes are food, not records. |
| **Editorial pure (NYT Cooking)** | Trustworthy but undifferentiated. Every cooking site does this. |
| **Warm domestic pure (paper + handwriting everywhere)** | Charming at 24 recipes, decorative noise at 200. Decoration on every screen kills the meaning of decoration. |
| **Playful AI-native (dark mode, AI is hero)** | Foregrounded the tool, not the food. Cooking happens in daylight, on phones, with greasy thumbs — dark mode by default narrows the audience. |

The hybrid keeps the warmth of a kitchen card without letting it
collapse into pastiche. It earns its differentiation through
*restraint* — the rare warm moment lands because every other moment
respects the reader.

---

## 3. The five rules

These are the rules that define this register. Any design or component
decision must pass all five. If a proposal violates one, that is the
sign to stop and reconsider — not to negotiate the rule.

### Rule 1 — Type does the work, not decoration

The visual hierarchy comes from typography: a real warm serif (Fraunces)
for display and body, a precise sans (Inter) for UI metadata and
uppercase eyebrows, a single handwritten face (Caveat) used **once
per recipe at most**. No drop shadows, no gradients, no decorative
frames, no patterned backgrounds. If a screen needs visual weight,
the type system has the tools — find them there.

### Rule 2 — Warm moments are earned by being scarce

Tape, stamps, marginalia, hand-circled notes, handwritten accents — any
trace of "the kitchen" appears at most **once per recipe screen**, and
**never** on the library, import, or adapter screens. Decoration on
every screen stops being decoration. The handwritten margin note on
the recipe detail page is the canonical example: one note, terracotta,
upper-right, slightly rotated. That's the budget.

### Rule 3 — The library is reading-mode, not crafting-mode

The library page is where users return most often. It must not feel
precious. It is a *table of contents*, not a corkboard or a card grid.
Each recipe is a row with a serif title, an italic deck line, metadata,
and tags. Hover indents like a book index. No tape, no stamps, no
imagery. This is the discipline half of "editorial discipline."

### Rule 4 — Terracotta is the AI signal — and the only accent

There is exactly one accent color in the system: `#B85C38`
(terracotta). It signals AI: the `Adapted` tag, the streaming pulse,
the "Adapt for my kitchen" CTA, the diff highlights, step numbers in
recipe detail, eyebrow text. Used consistently, it teaches users that
"warm orange = AI did this" without ever saying so. There is no
secondary brand accent. There is no cool-vs-warm color system. There
is no semantic palette (success/warning/danger get muted neutrals,
not new colors).

### Rule 5 — Mobile is where this product lives

A recipe is most often used in the kitchen, on a phone, with greasy
thumbs. Every layout must work at 375px. Every tap target must be at
least 44×44px. Every interactive element must reach with a thumb.
Desktop is the second-class viewport, optimized for browsing and
import — not for the act of cooking. Designs reviewed at desktop only
will be rejected.

---

## 4. The typeface system

Three faces, kept distinct. All three are open-source via Google Fonts;
no licensing friction.

| Face | Role | Where it appears |
|---|---|---|
| **Fraunces** | Display + body serif | Recipe titles, deck lines, ingredient names, method body, library titles, import headlines |
| **Inter** | UI sans | Eyebrow labels (uppercase + tracked), navigation, buttons, metadata (servings, time, source URL), form fields, ingredient amounts (tabular numerals) |
| **Caveat** | Single hand | The one earned warm moment per recipe — margin notes, the empty-library invitation. Nowhere else. |

**No fourth typeface.** No mono font. Tabular numerals come from Inter's
`font-feature-settings: "tnum"`. If a future need seems to require a
fourth face, that need is wrong — solve it inside the existing three.

**Weight discipline.** Fraunces uses 400 (regular), 500 (medium), and
italics at both weights. Inter uses 400 and 500. **Never 600 or 700**
— heavy weights against cream paper read industrial.

---

## 5. The color discipline

Five values. Total. No sixth value gets added without re-opening the
register.

| Token | Hex | Role |
|---|---|---|
| Cream paper | `#FBF7EC` | Page background |
| Page surround | `#EFE7D6` | App frame, subtle separation |
| Ink brown | `#2A1F14` | All body text, headlines, primary buttons |
| Border tan | `#D9CDB2` | Borders, dividers, dotted ingredient rules |
| Muted body | `#6B5A47` | Decks, italic subtitles, metadata |
| Terracotta | `#B85C38` | The AI accent — see Rule 4 |

**Semantic states use the existing palette, not new colors:**

- **Success** — terracotta (the system accent) at full opacity
- **Warning** — ink brown at 70% opacity
- **Error** — `#A03A1A` (a darker terracotta), used only for genuine errors, never for "this field is required" hints
- **Disabled** — ink brown at 30% opacity

This rejects the convention of green/yellow/red status colors. Those
colors do not exist on cream paper. Errors that need attention will
get attention from the type system (heavier weight, italics) and from
context — not from a red box.

---

## 6. Motion philosophy

Motion is for *transitions of attention*, not decoration.

- **Fades** — opacity transitions on streaming text and state changes.
  Default duration: 280–400ms.
- **No page transitions.** Pages snap. Browsers do this well; we don't
  improve it by animating route changes.
- **No "delight" animations.** No bouncing, no spring physics on
  unimportant elements, no celebration confetti for saved recipes.
  The product is for adults cooking dinner.
- **Streaming text is the warmest motion in the product.** Watching a
  recipe come together feels like watching someone write it for you.
  This *is* the moment. It does not need help from any other
  animation.
- **`prefers-reduced-motion` is binding.** Users who set it see no
  fades, no streaming animation; content appears all at once. This is
  not negotiable — see Accessibility floor.

---

## 7. Voice and copy

The register encodes copy decisions, not just visual ones.

| Default UI copy | This register's copy |
|---|---|
| "Import recipe" | "Bring it in" |
| "Imported successfully" | "Recipe ready — save it to your library" |
| "Search recipes" | "Search the library" |
| "Adapt for equipment" | "Adapt for my kitchen" |
| "0 recipes" empty state | "It's quiet in here. Bring something home." |
| "Loading…" | "Reading the page…" / "Finding the recipe…" / "Reading ingredients…" |
| Error: "Failed to parse URL" | "We couldn't find a recipe at that link. Try another, or paste the page directly." |
| Step labels: "Step 1, Step 2…" | "i. ii. iii. iv." (Roman numerals, lowercase, italic terracotta) |

The voice is **calm, second-person, slightly old-fashioned, never
twee**. "Bring a recipe home" works. "Yum! Recipe imported! 🎉" does
not. When in doubt, ask: would this copy fit in a good cookbook
introduction? If no, rewrite.

---

## 8. The accessibility floor

Non-negotiable. Any design that violates these is rejected at review,
no exceptions:

- **Contrast** — body text on cream meets WCAG AA (4.5:1 minimum).
  Verified pairings: ink brown `#2A1F14` on cream `#FBF7EC` = 13.4:1.
  Muted body `#6B5A47` on cream = 5.7:1. Terracotta `#B85C38` on
  cream = 4.6:1 (large text only, ≥18px or ≥14px bold).
- **Focus rings** — every interactive element has a visible focus
  state. The default is a 2px terracotta outline at 1px offset. Never
  removed, never hidden.
- **Keyboard** — every interactive element is reachable via Tab in a
  predictable order. Every action is keyboard-operable. The serving
  scaler accepts ↑/↓ keys when focused.
- **Reduced motion** — `prefers-reduced-motion: reduce` disables all
  fades and streaming animation; content appears all at once.
- **Touch targets** — 44×44px minimum on mobile, always.
- **Screen reader** — every icon-only button has an aria-label. Every
  decorative element (the margin note, ornamental rules) is
  `aria-hidden`. Streaming AI states announce politely
  (`aria-live="polite"`), not assertively.

---

## 9. What this register is *not*

Stating these explicitly so future contributors don't drift:

- **Not a recipe-card scrapbook.** No paper textures on every screen,
  no scattered photos, no Pinterest-board layouts. The "card" mental
  model is for the rare warm moment, not for the library.
- **Not editorial pure.** This isn't NYT Cooking. The handwritten
  moment exists. The voice has more warmth than a magazine masthead.
- **Not an AI product first.** "AI inside" is signaled by terracotta
  consistency, not by hero treatment. Users who never notice the AI
  branding should still feel the product is *for them*.
- **Not light/dark mode parity.** This is a daylight product. Dark
  mode is not on the roadmap for MVP. If added later, it must
  maintain warmth — not flip to a cool dark UI.
- **Not "cute."** No pastels, no rounded everything, no cartoon
  illustrations, no mascots, no emoji-as-icons. The product treats
  cooking as adult work.

---

## 10. Authority

This file is owned by **[UI/UX] (Alice)** — `~/Projects/agents/alice/ALICE.md`.

Edits to this file are **structural** changes (per the precedence rules
in `~/Projects/agents/alice/ALICE.md`) and require Founder approval
before commit. The Founder approved this register on 2026-04-29.

When the register conflicts with anything else — the kit, a component
spec, a dev's improvisation — **the register wins**. The kit and specs
are downstream artifacts that must serve this brief.
