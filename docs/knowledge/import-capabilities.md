# Import Capabilities

> **Last updated:** Sprint 4
> Honest reference on what the import system can and cannot do, and why.
> Use this when debugging a failed import or setting user expectations.

---

## URL Import (regular websites)

### How it works

1. Fetches the URL with a browser-like User-Agent and Accept headers
2. Strips all `<script>`, `<style>`, and HTML tags to produce plain text
3. Runs a pre-screen: rejects text that has no recipe keywords (`ingredient`, `instructions`, `directions`, `how to make`, `prep time`, `cook time`) **and** no measurement-unit pattern (`\d + cup/tbsp/tsp/g/ml/oz…`)
4. Clips text to 60,000 chars and sends to the configured AI provider (Gemini in production)
5. AI returns structured JSON: title, servings, ingredients (amount + unit + name + notes), steps, tags
6. Validated against Zod schema before saving

### What works

| Case | Why |
|------|-----|
| WordPress / static food blogs | Full recipe HTML is in the server response; plain text extraction captures everything |
| Substack, Ghost, plain HTML sites | Same — content is server-rendered |
| Sites with dense ingredient/step text | Pre-screen passes; AI extracts even without structured markup |

### What does not work

| Case | Why | Workaround |
|------|-----|-----------|
| **JavaScript-rendered pages** (Webflow, Next.js SPAs, React apps) | `fetch` returns the HTML shell — JS never runs, so recipe content never lands in the DOM. Page may be 50KB HTML but strip to <3KB of nav text. joshuaweissman.com is a confirmed example. | Use text import: copy-paste the recipe from the page |
| **Bot-blocked sites** | Some sites detect non-browser requests and return 403 or an empty body | Use text import |
| **Paywalled / login-required pages** | Server returns 4xx or a login wall instead of recipe content | Use text import |
| **Incomplete JSON-LD** | The JSON-LD extraction path (`ENABLE_RECIPE_STRUCTURED_DATA_IMPORT`) is disabled by default. Even when enabled, many sites embed only partial metadata (title, author) in JSON-LD without ingredients or steps — the extractor requires both to succeed | n/a |
| **Non-recipe pages that pass the pre-screen** | A page mentioning measurements in a non-recipe context will reach the AI. The AI is instructed to return `{ error: "..." }` in this case — no bad data is saved, but the user sees an error | n/a |

### Diagnosis tip

If a URL silently fails, check:
- Is the stripped plain text tiny (<5KB)? → JS-rendered, use text import
- Does the URL return HTTP 4xx? → blocked or gated
- Does the plain text contain the recipe? → pre-screen or AI issue

---

## YouTube Import

### How it works — three-layer waterfall

```
YouTube URL
    │
    ▼
1. Candidate URL in description?
   └─ extract HTTP links, skip social/affiliate domains
   └─ try importing each link as a regular URL (see URL Import above)
   └─ if succeeds → done (sourceKind: "youtube-link")
   └─ if fails (422/502) → fall through
    │
    ▼
2. Recipe text in description?
   └─ take full description text
   └─ run keyword + measurement pre-screen
   └─ if passes → send to AI → extract recipe
   └─ if succeeds → done (sourceKind: "youtube-description")
   └─ if pre-screen fails or AI errors → fall through
    │
    ▼
3. Transcript available?
   └─ call youtube-transcript package (Android InnerTube API → web scrape fallback)
   └─ join segments → run keyword + measurement pre-screen
   └─ if passes → send to AI → extract recipe
   └─ if succeeds → done (sourceKind: "youtube-transcript")
   └─ if any step fails → final error
    │
    ▼
"We couldn't find a recipe in that YouTube video."
```

### Layer 1 — Candidate URL

**Works when:** the description links to a server-rendered recipe blog post.

**Does not work when:**
- The linked site is JS-rendered (same limitation as URL import)
- The link is to a social/affiliate/video domain — these are filtered out. Blocked domains include: YouTube, Instagram, TikTok, Twitter/X, Facebook, Pinterest, Threads, linktr.ee, beacons.ai, bio.site, Amazon, Shopify, and common merch platforms

### Layer 2 — Description text

**Works when:** the creator writes the recipe directly in the description with actual quantities and steps — e.g. `3/4 cup sugar`, `1 teaspoon salt`, followed by instructions.

Confirmed working example: `youtube.com/watch?v=k5jTp7zm3Xo` (Adam Ragusea peach cobbler — recipe written inline, `***RECIPE, SERVES 4-6***` with full ingredient list).

**Does not work when:**
- Description only says "recipe below" or links elsewhere with no actual recipe text
- Recipe is written in prose without measurements (pre-screen may not fire, or AI can't extract structure)
- Description is entirely in a non-English language the AI hasn't been prompted for

### Layer 3 — Transcript

Uses the `youtube-transcript` package which hits YouTube's Android InnerTube API first, then falls back to web-page scraping.

**Works when:** the video has public caption tracks — either manually uploaded subtitles or auto-generated captions that the InnerTube API exposes without authentication.

**Does not work when:**

| Case | Detail |
|------|--------|
| **Transcript disabled by creator** | Creator explicitly disabled captions. Package throws `YoutubeTranscriptDisabledError`. Nothing we can do server-side. |
| **Video requires login** (`LOGIN_REQUIRED`) | Video is age-gated or otherwise restricted. Android InnerTube API returns no tracks. Confirmed for `youtube.com/watch?v=Jge99Iv89Jg` (Ragusea chicken à la crème). |
| **YouTube "Show transcript" works in browser but not here** | YouTube's browser transcript button uses an authenticated innertube session (`/youtubei/v1/get_transcript`) that requires cookies tied to a logged-in Google account. Server-side requests return `400 FAILED_PRECONDITION` even with correct session cookies from a page fetch. This is a YouTube API access control decision, not a bug. |
| **Transcript is not a recipe** | Transcript passes the pre-screen (it has measurement words), AI receives it, but AI returns `{ error }` because the spoken content isn't structured as a recipe. User sees a clean error, nothing is saved. |

### What never works for YouTube

**Recipe only exists in the video** (no description, no captions): there is no text form to extract from. The only solution is Gemini native video understanding — passing the YouTube URL directly to Gemini as a video input so it can process audio and frames. This is planned as a future feature but is out of current scope.

---

## Text / Paste Import

Always works as long as the pasted text:
- Is at least 80 characters
- Contains recipe keywords or measurement patterns (same pre-screen as URL import)

No network fetch involved — the text goes straight to the AI. Use this as the universal fallback for any site or video the URL/YouTube importers can't handle.
