# Sprint 06 — UI/UX Source Presentation Handoff

> **Status:** Locked for Sprint 06 frontend work — 2026-05-05  
> **Owner:** `[UI/UX]`  
> **Reads:** `docs/ui/REGISTER.md`, `UI_KIT.md`,
> `COMPONENT_SPECS.md`, `PAGE_LAYOUTS.md`, `STATES.md` first.  
> **Audience:** `[DEV:frontend]`, `[DEV-QA]`

This handoff covers Sprint 06 task 6.3: YouTube embed placement,
source-label copy, and loading/error/no-video states for source
continuity on recipe detail.

It introduces **no new tokens** and does not change the locked register.
All styling uses the existing recipe-detail layout, source/byline
typography, hairline borders, and muted section-label treatment.

---

## 1. Design Decisions

1. **Embed placement:** YouTube video embeds render on
   `/recipes/[id]` directly under the title/deck/source byline and
   before the first divider/controls bar.
2. **Non-YouTube recipes:** render exactly as they do now. No empty
   video slot, placeholder, or "no video" message.
3. **Source labels:** source provenance appears as quiet byline text,
   not as a tag chip. Tags remain recipe metadata; provenance is
   editorial metadata.
4. **Browserbase visibility:** when a recipe was imported with
   `sourceImportMethod: "browserbase"`, say "read in a browser" rather
   than naming Browserbase. Provider names are implementation detail.
5. **No extra warm moment:** the embed is content, not decoration. Do
   not add tape, handwriting, stamps, thumbnails, or decorative frames.

---

## 2. Data Contract Consumed by UI

Frontend reads these fields from `RecipeResponse`:

```ts
sourceUrl?: string | null;
sourceVideoUrl?: string | null;
sourceKind?:
  | "url"
  | "text"
  | "youtube-link"
  | "youtube-description"
  | "youtube-transcript"
  | null;
sourceImportMethod?: "fetch" | "browserbase" | "text" | null;
```

The UI may derive display domains from URLs, as the existing
`extractDomain()` utility already does. Do not fabricate a domain when
the URL is absent or unparsable.

---

## 3. Recipe Detail Layout

### Anatomy

For a YouTube-sourced recipe with `sourceVideoUrl`:

```text
Eyebrow
Title
Deck
Source byline / provenance

ORIGINAL VIDEO
[responsive 16:9 YouTube iframe]
Watch on YouTube

divider
ServingScaler / UnitToggle
...
```

For all other recipes:

```text
Eyebrow
Title
Deck
Source byline / provenance
divider
ServingScaler / UnitToggle
...
```

### Placement Rules

- The embed block sits inside the existing `RecipeDetail` article
  container (`--measure`, 620px).
- Top margin from byline/provenance to embed eyebrow: `space-5` (22px).
- Bottom margin from embed link to the divider: `space-5` (22px).
- The iframe uses `aspect-ratio: 16 / 9`, full width, no shadow, no
  decorative card.
- Border: `0.5px solid --color-border`.
- Radius: `--radius-sm`.
- Background while iframe loads: `--color-paper-sunken`.

### Mobile

- At 375px, the embed is full width within the existing 20px gutters.
- The iframe must not overflow horizontally.
- The "Watch on YouTube" link stays below the iframe, left-aligned.
- Existing controls remain reachable and keep their 44px tap targets.

---

## 4. Source Provenance Copy

Use the existing byline slot below the deck. If there is already a
source link, keep it there and append provenance quietly.

| Source state | Copy |
|---|---|
| `sourceKind: "url"` + source URL | `From {domain}` |
| `sourceKind: "url"` + `sourceImportMethod: "browserbase"` | `From {domain} · read in a browser` |
| `sourceKind: "text"` | `From pasted text` |
| `sourceKind: "youtube-link"` + resolved source URL | `From {domain} · first found on YouTube` |
| `sourceKind: "youtube-description"` | `From YouTube description` |
| `sourceKind: "youtube-transcript"` | `From YouTube transcript` |
| YouTube source + `sourceImportMethod: "browserbase"` | append ` · read in a browser` only when the resolved `sourceUrl` page used the browser-assisted path |
| Missing / legacy source metadata | fall back to existing behavior: `From {domain}` when `sourceUrl` exists; otherwise omit the line |

### Tokens

- `font-ui text-ui-sm text-ink-faint`
- Links use existing source-link behavior: underline on hover,
  `underline-offset-2`
- The provider/browser-assisted phrase remains the same muted weight as
  the byline. Do not make it a warning, badge, tooltip, or alert.

### Copy Notes

- Use "YouTube", not "video platform".
- Use "read in a browser", not "Browserbase", "fallback", "scraped",
  or "rendered".
- Do not claim the app watched or understood the video. Sprint 06 is
  source continuity, not direct video understanding.

---

## 5. YouTube Embed Block

### Render Condition

Render the block only when both are true:

1. `sourceVideoUrl` exists.
2. A valid YouTube video ID can be parsed from `sourceVideoUrl`.

If either condition fails, omit the entire embed block. The provenance
line can still mention YouTube if `sourceKind` says YouTube.

### Eyebrow

Copy: `Original video`

Tokens:

- `font-ui text-eyebrow uppercase tracking-[0.16em] text-ink-faint`

Do not use terracotta for this label. The video is source content, not
an AI action.

### Iframe

The iframe:

- Uses `https://www.youtube-nocookie.com/embed/{videoId}`.
- Has `title="Original video for {recipe.title}"`.
- Includes `allowFullScreen`.
- Uses a restrictive `allow` list appropriate for normal YouTube embed
  playback.
- Is wrapped in a full-width 16:9 container.

### External Link

Below the iframe, render:

Copy: `Watch on YouTube`

Behavior:

- Links to `sourceVideoUrl`.
- Opens in a new tab with `rel="noopener noreferrer"`.

Tokens:

- `font-ui text-ui-sm text-ink-muted`
- Hover: `text-ink`, underline with `underline-offset-2`

---

## 6. States

### Loading

No custom loader is required for iframe load. The iframe wrapper may
show `--color-paper-sunken` behind the iframe while the browser loads
it. Do not add shimmer, spinner, or animated skeleton.

### Video Unavailable

Browsers do not reliably expose iframe playback failure to the page.
The designed recovery is the always-visible `Watch on YouTube` link.
Do not show a speculative inline error if the iframe refuses to play.

### Invalid or Missing Video URL

Omit the embed block completely. Do not render an empty frame or
"video unavailable" placeholder.

### Non-YouTube Recipe

No embed block. No source-video label. Existing recipe detail layout
must remain unchanged.

### Browser-Assisted Import

This is provenance, not an error. It never changes the page state color
and never uses `role="alert"`.

---

## 7. Accessibility

- The iframe title is required and includes the recipe title.
- The external YouTube link must be keyboard-focusable and visibly
  focused via the global focus ring.
- The embed block is not `aria-live`; it is static content.
- The provenance byline remains readable text. Do not hide the
  browser-assisted phrase in a tooltip-only interaction.
- Focus order after page load: source links, video iframe, YouTube
  external link, then serving/unit controls.

---

## 8. QA Additions

`[DEV-QA]` should verify:

1. Desktop YouTube-sourced recipe detail: embed appears under the
   byline, does not overlap title, controls, ingredients, method, or
   AdaptPanel.
2. Mobile 375px: iframe fits within gutters; no horizontal scroll;
   "Watch on YouTube" remains reachable.
3. Keyboard: tab order includes source link, iframe, external video
   link, then existing controls; focus is visible.
4. Non-YouTube recipe: no blank embed slot and no changed recipe-detail
   rhythm.
5. YouTube metadata without parseable video URL: no empty frame; source
   provenance still renders if available.
6. Browser-assisted import: provenance says `read in a browser` and
   does not use warning/error styling.
7. Screenshots: capture desktop and 375px mobile recipe detail with
   embed in `tests/screenshots/`.

---

## 9. Frontend Handoff

Recommended implementation scope:

- Add a small helper to parse YouTube video IDs from standard
  `youtube.com/watch?v=...`, `youtu.be/...`, and `/shorts/...` URLs.
- Add source-provenance formatting in or near `RecipeDetail`.
- Add the embed block inside `RecipeDetail` after the byline/deck and
  before the first divider.

Do not introduce a new dependency for URL parsing. The browser `URL`
API and small string checks are sufficient.

No Founder decision is needed for this handoff because it does not
change the register, token system, page inventory, or product scope.
