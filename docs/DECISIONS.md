# Decision Log

> Non-obvious technical decisions, with context and rationale.
> **Owner:** [CTO]

---

## Decision: Sprint 06 Source Metadata and Browserbase Boundary

**Date:** 2026-05-05
**Status:** Accepted — Sprint 06 implementation
**Decided by:** [CTO] sprint plan; `[DEV:backend]` implementation

**Context:**
YouTube imports can resolve to three different recipe sources: a recipe link in
the video description, recipe text in the description, or a transcript. The
saved recipe also needs enough metadata for the detail UI to show the original
YouTube video separately from the recipe page that was actually extracted.
Separately, some public recipe pages block server fetches or render their
content client-side, but Browserbase is paid and must not become a broad
browsing bypass.

**Decision:**
Persist nullable recipe source metadata on `Recipe`: `sourceVideoUrl`,
`sourceKind`, and `sourceImportMethod`. URL imports keep `sourceKind=url`;
YouTube imports use `youtube-link`, `youtube-description`, or
`youtube-transcript`; import method is `fetch`, `browserbase`, or `text`.
Browserbase is a disabled-by-default fallback used only for public HTTP/HTTPS
recipe pages when normal fetch fails or returns unusable JS-heavy HTML.

**Rationale:**
- Keeps old recipes readable because all new fields are nullable.
- Gives frontend/API consumers a stable contract without overloading
  `sourceUrl`.
- Preserves URL deduplication while still recording original YouTube context.
- Contains Browserbase cost and compliance risk by requiring an explicit env
  flag and rejecting credentialed/private URL shapes.

**Consequences:**
- Local SQLite and production Postgres migrations must stay in lockstep.
- Deployment docs must make Browserbase opt-in and paid/usage-metered.
- QA needs separate smoke coverage for YouTube source continuity and the
  Browserbase-assisted public-page path.

---

## Decision: Production AI Provider — Anthropic on Vercel

**Date:** 2026-05-01
**Status:** Superseded 2026-05-03 by "Sprint 04 AI Provider — Gemini 2.5 Flash"; reaffirmed 2026-05-04 by Sprint 05 deployment posture
**Decided by:** Founder

**Context:**
Sprint 1 validated AI extraction locally using Ollama. For production deployment on Vercel the team needed to decide which AI provider to use, balancing cost, quality, and operational simplicity.

**Decision:**
Originally, `AI_PROVIDER=anthropic` for the Vercel production environment
and `AI_PROVIDER=ollama` for local development. This is no longer the current
production plan; Sprint 04/Sprint 05 replaced the production default with
Gemini while preserving the environment-driven provider boundary.

**Rationale:**
- Claude (Sonnet 4.x) delivers higher structured-output reliability than Ollama cloud relay, especially for complex recipe HTML
- No self-hosted infrastructure required; Anthropic API is stateless and serverless-compatible
- Local dev continues at zero API cost via Ollama

**Consequences:**
- `.env.example` should document Anthropic as an optional fallback only.
- `ANTHROPIC_API_KEY` is not required for the Sprint 05 Vercel demo path.
- No schema changes were needed because provider selection is environment-driven.

---

## Decision: Sprint 04 AI Provider — Gemini 2.5 Flash

**Date:** 2026-05-03
**Status:** Accepted — Sprint 04 implementation
**Decided by:** Founder

**Context:**
Sprint 03 reduced avoidable AI calls through text import, URL deduplication,
and YouTube description-first routing. Sprint 04 now needs a lower-cost
production provider path before demo/production hardening continues. The
2026-05-02 provider comparison identified Gemini 2.5 Flash as the recommended
production candidate.

**Decision:**
Use **Gemini 2.5 Flash** instead of Claude as the Sprint 04 production AI
provider target.

**Rationale:**
- Lower expected per-extraction cost than Claude Sonnet while still being a
  strong structured-output model.
- Aligns with the future YouTube/video roadmap better than an Anthropic-only
  path.
- Keeps the project moving toward a provider abstraction without making Groq,
  OpenAI, or direct video processing part of this sprint by default.

**Consequences:**
- Supersedes the 2026-05-01 Anthropic production-provider decision.
- Add `AI_PROVIDER=gemini`, `GEMINI_API_KEY`, and `GEMINI_MODEL` environment
  support.
- Rename or wrap the current Anthropic-specific provider module behind a
  neutral AI provider boundary before adding Gemini code.
- Keep Claude available only as a fallback or legacy provider unless the
  Founder changes direction.
- QA must smoke-test Gemini extraction with mocked and, if a real key is
  available, live provider calls.

---

## Decision: Sprint 05 Production Database Schema Path

**Date:** 2026-05-04
**Status:** Accepted — Sprint 05 implementation
**Decided by:** [CTO] production DB direction; `[DEV:backend]` implementation

**Context:**
CookbookAI was built locally with Prisma + SQLite, but Sprint 05 targets a
Vercel demo backed by managed Postgres, with Neon as the documented default.
Prisma datasource providers are schema-level, not runtime-swappable by
`DATABASE_URL` alone, so the SQLite schema cannot safely generate the deployed
Postgres Prisma Client.

**Decision:**
Keep `prisma/schema.prisma` as the local SQLite schema and add
`prisma-postgres/schema.prisma` plus a Postgres baseline migration for Vercel
and Neon. Vercel runs `npm run build:vercel`, which generates Prisma Client
from the Postgres schema before `next build`. Production migrations run with
`npm run db:migrate:prod`.

**Rationale:**
- Preserves the zero-friction local SQLite flow.
- Makes the deployed Prisma Client explicitly Postgres-compatible.
- Avoids silently changing every developer's local database requirement during
  deployment-readiness work.

**Consequences:**
- Local and production schema model definitions must be kept in sync.
- Production migrations live under `prisma-postgres/migrations`.
- Future schema changes need both a local SQLite migration and a production
  Postgres migration until the project chooses one database path everywhere.

---

## Decision Note: Paid AI Provider Cost Comparison

**Date:** 2026-05-02
**Status:** Superseded by accepted Gemini 2.5 Flash decision on 2026-05-03
**Decided by:** [CTO] recommendation; Founder accepted Gemini 2.5 Flash

**Context:**
During real Ollama testing, the Founder hit paid-tier limitations on Ollama
cloud and also expressed concern about Anthropic API usage based on reported
bad experiences. The then-current production-provider decision still said
`AI_PROVIDER=anthropic`, so a paid-provider comparison was needed before deploy
planning continued. This note was superseded once Gemini 2.5 Flash became the
accepted production default.

**Pricing basis:**
Prices are USD per 1M tokens for standard realtime API calls, excluding batch
discounts, cached-input discounts, tool/search charges, and free tiers.
Estimated cost assumes one recipe extraction/adaptation call uses roughly
10k input tokens and 1k output tokens.

| Provider / model | Input / 1M | Output / 1M | Est. / 1k recipe calls | Notes |
|---|---:|---:|---:|---|
| OpenAI GPT-5 nano | $0.05 | $0.40 | $0.90 | Cheapest; likely needs validation on messy recipe pages. |
| Groq GPT-OSS 20B | $0.075 | $0.30 | $1.05 | Very cheap and fast; quality needs project testing. |
| Gemini 2.5 Flash-Lite | $0.10 | $0.40 | $1.40 | Strong budget candidate for high-volume extraction. |
| Groq GPT-OSS 120B | $0.15 | $0.60 | $2.10 | Better Groq quality target while still cheap. |
| OpenAI GPT-5.4 nano | $0.20 | $1.25 | $3.25 | Newer nano-tier OpenAI model; reasonable fallback candidate. |
| OpenAI GPT-5 mini | $0.25 | $2.00 | $4.50 | Reliable structured-output fallback. |
| Gemini 2.5 Flash | $0.30 | $2.50 | $5.50 | CTO-recommended production default candidate. |
| Gemini 3 Flash Preview | $0.50 | $3.00 | $8.00 | Better capability, but preview status adds deployment risk. |
| OpenAI GPT-5.4 mini | $0.75 | $4.50 | $12.00 | Strong but likely overkill for recipe import/adaptation. |
| Claude Haiku 4.5 | $1.00 | $5.00 | $15.00 | Cheapest current Anthropic option. |
| Claude Sonnet 4.6 | $3.00 | $15.00 | $45.00 | Current implemented Anthropic target; expensive for this use case. |

**Recommendation:**
1. **Accepted production target:** Gemini 2.5 Flash. It has structured
   output support, low cost, long context, and aligns with the already planned
   Gemini path for future YouTube/video import.
2. **Cheap experiment:** Groq GPT-OSS 120B. Cost is excellent and structured
   output support exists, but extraction/adaptation quality must be tested
   against the project sample set before adoption.
3. **Reliability fallback:** OpenAI GPT-5 mini. More expensive than Gemini
   Flash, but strong structured-output support and easy fit with the existing
   `@ai-sdk/openai` dependency.
4. **Budget models:** Gemini Flash-Lite, OpenAI nano, and Groq 20B should only
   become defaults if QA proves they handle noisy recipe pages cleanly.

**Consequences now that Founder accepted Gemini 2.5 Flash:**
- Supersede the 2026-05-01 "Production AI Provider — Anthropic on Vercel"
  decision.
- Rename `src/lib/anthropic.ts` to `src/lib/ai-provider.ts` before adding
  more provider branches.
- Add `AI_PROVIDER=gemini`, `GEMINI_API_KEY`, and `GEMINI_MODEL` env support.
- Keep local Ollama or LM Studio as the no-bill dev path.
- Retain OpenAI/Groq as optional fallback experiments, not the first
  production default.

**Sources checked 2026-05-02:**
- Google Gemini pricing: https://ai.google.dev/gemini-api/docs/pricing
- Google Gemini structured outputs: https://ai.google.dev/gemini-api/docs/structured-output
- OpenAI pricing: https://openai.com/api/pricing/
- OpenAI model docs: https://developers.openai.com/api/docs/models
- Groq pricing: https://groq.com/pricing
- Groq structured outputs: https://console.groq.com/docs/structured-outputs
- Anthropic pricing: https://platform.claude.com/docs/en/about-claude/pricing

---

## Decision: Guest Mode + URL-Level Recipe Deduplication

**Date:** 2026-05-01
**Status:** Accepted — implementation deferred post-Sprint 2
**Decided by:** Founder

**Context:**
The Founder wants users to try the app without registering (guest mode) and wants to avoid paying for duplicate AI extractions when two users import the same URL.

**Options Considered:**

*Guest session approach:*
1. Ephemeral (session-only, no persistence) — rejected: Founder explicitly wants persistence
2. **Cookie-based guest User record** (chosen) — a real `User` row is created on first import, identified by a random `guestToken` stored in a cookie. Recipes are owned by that guest user normally. On account upgrade the guest user row is merged into the new authenticated user.
3. Shared "anonymous" user — rejected: no per-session isolation, recipes bleed across visitors

*Deduplication approach:*
1. No deduplication — rejected: wastes AI compute for identical URLs
2. **Reuse extracted data, create per-user recipe row** (chosen) — before calling AI, check `Recipe.sourceUrl` across all users. If a match exists, copy its extracted fields (title, description, ingredients, steps, servings, tags) into a new Recipe for the current user. No AI call. Each user still owns an independent copy (can edit/delete independently).
3. Shared recipe row across users — rejected: breaks per-user isolation and independent editing

**Decisions:**
- Add `isGuest Boolean @default(false)` and `guestToken String? @unique` to `User` model
- Add `@@index([sourceUrl])` to `Recipe` for fast deduplication lookups
- Import route: before AI call, query `db.recipe.findFirst({ where: { sourceUrl } })`. If found, shallow-copy extracted fields for the current user and return immediately.
- Guest sessions: on import without auth, create or retrieve the guest `User` via `guestToken` cookie; proceed normally from there
- Account upgrade flow: out of scope for MVP — guest recipes remain on the guest user row

**Consequences:**
- Schema migration needed: `User.isGuest`, `User.guestToken`, `Recipe.sourceUrl` index
- Import route gains a deduplication check before the AI call
- Auth middleware must allow unauthenticated access to import for guest flow
- Guest mode UI: out of scope for Sprint 2; flag as Sprint 3+

---

## Decision: YouTube Import — Description-First Strategy

**Date:** 2026-05-01
**Status:** Accepted — Sprint 3+ implementation
**Decided by:** Founder

**Context:**
Many YouTube cooking creators either paste a link to their blog/recipe post in the video description, or write the full recipe out as text directly in the description. In both cases the app should not process video at all — the existing import pipelines handle both paths. This reduces cost and complexity significantly.

**Decision:**
Implement YouTube import as a four-tier waterfall. Tiers 1a and 1b both operate on the video description (fetched in a single YouTube Data API call) before touching any video content:

1. **Tier 1a — Description has external blog URL (Sprint 3, first priority):** Detect YouTube URL → fetch video metadata via YouTube Data API → parse description for external HTTP/HTTPS URLs → filter out social links (youtube.com, instagram.com, twitter.com, etc.) → import the first candidate URL using the existing HTML import pipeline. If successful, done.

2. **Tier 1b — Description contains recipe text (Sprint 3):** If no external URL found (or the linked site blocks the agent), run `looksLikeRecipePage()` on the description text. If it passes, send the description text directly to the AI extraction pipeline (same path as the text/paste import). If successful, done.

3. **Tier 2 — Transcript fallback (Sprint 4):** If description has no URL and no recipe-like text, fetch the video's caption track and pass the transcript to the AI extraction pipeline.

4. **Tier 3 — Gemini direct (Sprint 4+):** If no captions available, pass the YouTube URL as `fileData` to the Gemini API for audio+frame processing. Requires adding `AI_PROVIDER=gemini` branch.

**Rationale:**
- Tiers 1a and 1b cost one YouTube Data API call, zero AI calls in most cases
- Tier 1b covers creators who paste the recipe as plain text in the description (common for short-form recipe channels)
- The same `looksLikeRecipePage()` pre-screen already used for HTML import doubles as the description recipe detector — no new logic
- Layering avoids over-engineering for edge cases

**Implementation notes:**
- YouTube URL detection: `youtube.com/watch`, `youtu.be/`
- YouTube Data API key: add `YOUTUBE_API_KEY` to `.env.example` (free tier: 10,000 units/day)
- Description URL extraction: simple regex for `https?://` links; exclude known social/non-recipe domains
- Description text import uses the existing text/paste extraction path, not the HTML fetch path
- Sprint 4 added the `AI_PROVIDER=gemini` extraction path for structured text
  extraction. Direct video understanding is still separate and remains
  post-Sprint 4 unless promoted.
- The Gemini Developer API (API key auth) does NOT interact with the user's personal Google account or watch history — confirmed; that concern only applies to Google AI Studio (OAuth web UI)

---

## Decision: Unit Conversion — Bidirectional + Cups/Spoons → ml

**Date:** 2026-05-01
**Status:** Accepted — Sprint 2 implementation (task B5)
**Decided by:** [CTO] + Founder

**Context:**
The original `convertUnit` function was one-directional (metric→imperial only)
and assumed all recipes are stored in metric units. Two bugs and a feature
request surfaced during Sprint 1 QA that required revisiting the design.

**Bugs identified:**
1. Long-form units (`gram`, `grams`, `pound`, `pounds`, etc.) stored by the AI
   pass through `RECOGNIZED_UNITS` validation but do not match any switch case
   in `convertUnit` — silent no-op when toggling.
2. The `system === "metric"` early-return meant imperial units stored from
   US recipes (`lb`, `oz`) never converted in either direction.

**Feature request:** Convert cooking volume measures (cups, tbsp, tsp) to ml
when the user selects metric. The Founder noted this is distinct from
imperial/metric but agreed bundling it into the existing toggle is preferable
to a second control.

**Decisions:**
- **Normalize long-form units at extraction time** in `normalizeUnit()` before
  DB storage. Canonical short forms: `g`, `kg`, `ml`, `l`, `oz`, `lb`,
  `tbsp`, `tsp`. The switch in `convertUnit` does not need extra arms.
- **Make `convertUnit` bidirectional:**
  - Metric mode: `oz→g`, `lb→kg`, `fl oz→ml`, `qt→l`
  - Imperial mode: `g→oz`, `kg→lb`, `ml→fl oz`, `l→qt` (existing behaviour)
- **Bundle cups/tbsp/tsp → ml into the metric toggle:**
  - Metric: `cup→240ml`, `tbsp→15ml`, `tsp→5ml`
  - Imperial: cups/tbsp/tsp pass through unchanged
  - Gram conversion for cups is density-dependent — out of scope for MVP.
- Recipes already in the DB with long-form units are not migrated (re-import
  fixes them). Not worth the migration complexity for the MVP.

---

## Decision: YouTube Video Import Strategy

**Date:** 2026-05-01
**Status:** Superseded for Sprint 3 by description-first scope; transcript fallback promoted to Sprint 4 on 2026-05-03
**Decided by:** [CTO] + Founder

**Context:**
The import form placeholder mentions "YouTube link" but the current URL-fetch
path cannot handle video content. Two implementation paths were evaluated.

**Options Considered:**

*Option A — YouTube transcript + extraction AI (Sprint 4)*
- Detect YouTube URL pattern (`youtube.com/watch`, `youtu.be/`)
- Fetch public caption track after description-first paths fail
- Send transcript text to the existing Ollama/Anthropic extraction pipeline
- No new AI provider needed; cost is effectively $0 for the transcript fetch
- Covers ~90%+ of cooking videos — recipe creators narrate what they do

*Option B — Gemini direct video processing (post-Sprint 4 unless separately approved)*
- Pass YouTube URL as `fileData` to Gemini API; model processes audio + frames
- Handles videos without captions and reads on-screen quantities
- Cost: ~$0.02–0.025 per 10-min video at Gemini 2.0 Flash pricing
- Requires adding `AI_PROVIDER=gemini` branch; `src/lib/anthropic.ts` should
  be renamed `src/lib/ai-provider.ts` when this lands

**Decision:** Superseded by the later description-first Sprint 3 decision
above. Sprint 3 implements description external-link and description-text
paths only. On 2026-05-03 the Founder promoted transcript fallback into
Sprint 4. Gemini direct video processing remains a later enhancement for
caption-less videos or where visual cues are critical.

**Watch-history clarification:**
Watch history was added during Founder testing because **Google AI Studio**
(the interactive web UI) runs under the user's personal Google OAuth session.
The **Gemini Developer API** (API key auth) is billed to the Cloud project and
does not interact with or modify the user's personal Google account.

**Action required before live YouTube validation:** Obtain a YouTube Data API
key (Google Cloud console, free tier sufficient). `YOUTUBE_API_KEY` is
documented in `.env.example`.

---

## Decision: Design Language — Warm Domestic with Editorial Discipline

**Date:** 2026-04-30
**Status:** Accepted
**Decided by:** Founder (Alice proposed; approved 2026-04-29)

**Context:**
CookbookAI sits at the intersection of an AI product (typically cold and tool-shaped) and a food product (typically decorative and twee). A design register needed to be locked before Sprint 1 UI implementation begins so that all visual decisions have a single authoritative source.

**Options Considered:**
1. Modern utility (Notion-for-recipes) — rejected: reads like a database, not food
2. Editorial pure (NYT Cooking) — rejected: trustworthy but undifferentiated
3. Warm domestic pure (paper + handwriting everywhere) — rejected: charming at 24 recipes, decorative noise at 200
4. Playful AI-native (dark mode, AI is hero) — rejected: foregrounds the tool, not the food
5. **Warm Domestic with editorial discipline** — chosen: kitchen warmth restrained by typographic discipline

**Decision:**
Option 5. Three typefaces (Fraunces / Inter / Caveat), five base colors plus terracotta as the sole AI accent, mobile-first, no gradients or drop shadows.

**Rationale:**
The hybrid earns differentiation through scarcity — warm moments (handwritten notes, Caveat) are budgeted per-screen, making them meaningful rather than decorative noise. Terracotta as a consistent AI signal teaches users "warm orange = AI did this" without explicit labeling.

**Consequences:**
All color, type, spacing, and copy decisions must trace to `docs/ui/UI_KIT.md` and `docs/ui/REGISTER.md`. The full design system is in `docs/ui/` (5 files, all locked). Devs may not invent tokens or copy.

---

## Decision: Topbar Mobile Collapse Strategy

**Date:** 2026-04-30
**Status:** Accepted
**Decided by:** Founder (Alice proposed)

**Context:**
The Topbar has brand, nav links, search, and Import button. On mobile (< 768px) the full bar doesn't fit. Three collapse strategies were considered.

**Options Considered:**
1. Hamburger — collapse nav into a menu, show search icon
2. Two-row — brand + import on row 1; search full-width on row 2
3. **Minimal** — brand left, Import button right; no nav links on mobile; Equipment reachable from library page header

**Decision:** Option 3 — Minimal.

**Rationale:**
Two routes (Library and Equipment) is too few to justify a hamburger. Minimal topbar preserves screen real estate for the recipe content — which is what users came for. Equipment is reachable from the library header on mobile.

---

## Decision: Post-Import Flow

**Date:** 2026-04-30
**Status:** Accepted
**Decided by:** Founder (Alice proposed)

**Context:**
After AI extraction finishes, two flows were considered: require the user to click "Save to library", or save automatically and navigate.

**Options Considered:**
1. **Auto-navigate** — save server-side on extraction complete; redirect to `/recipes/[id]` after ~1.5s
2. Manual save — import progress panel shows "Save to library" CTA; user clicks

**Decision:** Option 1 — Auto-navigate.

**Rationale:**
The user's intent when pasting a URL is to bring the recipe in. Requiring an extra click after extraction completes adds friction with no benefit — they can always delete from the library if the extraction was wrong. Auto-save + navigate makes the success state feel instant.

---

## Decision: Full-Stack Framework + Deployment Target

**Date:** 2026-04-29
**Status:** Accepted
**Decided by:** Founder (options presented by [CTO])

**Context:**
CookbookAI requires a browser-based UI, multi-user auth, persistent data storage, AI provider integration, and eventual deployment to Vercel. The stack choice shapes every downstream technical decision and is not easily reversed.

**Options Considered:**
1. **Next.js 15 full-stack (monorepo)** — Next.js API Routes as backend, Vercel AI SDK/provider adapters where useful, Prisma + SQLite/Neon for data, Auth.js for auth. Single repo, single language, Vercel-native.
2. **Vite React + Node/Express (two services)** — React frontend on Vercel, Express backend on Railway/Render. No serverless timeout pressure, but two deployments; Railway/Render free tiers spin down after inactivity.
3. **SvelteKit full-stack** — Same deployment story as Option 1 but lighter framework; smaller ecosystem and fewer AI tooling examples.

**Decision:**
Option 1 — Next.js 15 full-stack monorepo.

**Rationale:**
- Vercel built Next.js: zero-config deployment, first-class support, long-running API and edge deployment paths
- Vercel AI SDK/provider adapters keep cloud AI integration available while Sprint 1 validates locally with Ollama
- Prisma lets us run SQLite locally (zero cloud setup) and swap to Neon Postgres for production with a single env var change
- Single TypeScript codebase reduces coordination overhead for a vibe-coded project
- shadcn/ui is the dominant React component library for this stack — accessible, fully owned, no runtime dependency

**Tradeoffs accepted:**
- Serverless cold starts on first request after inactivity (minor, acceptable for Hobby tier)
- Cloud AI responses may need streaming or background handling; Sprint 1 local Ollama validation accepts longer blocking calls because it is not a production deployment path

---

## Decision: Switch Active Ollama Model to qwen3.5:cloud

**Date:** 2026-05-01
**Status:** Accepted
**Decided by:** Founder

**Context:**
During Sprint 1 QA, live URL imports were tested against real recipe pages.
`gemma4:e4b` (local GPU model) was the original default. QA revealed that
Ollama cloud models provide better extraction quality and no local GPU
requirement, making them practical for developer validation.

**Options Considered:**
1. Keep `gemma4:e4b` — requires local GPU; slower; lower structured-output
   reliability.
2. **Switch to `qwen3.5:cloud`** — Ollama-relayed cloud model (Qwen3 397B);
   no local GPU; stronger instruction following; ~15–30s extraction time.

**Decision:**
`OLLAMA_MODEL=qwen3.5:cloud` is now the active default in `.env.example`.
`gemma4:e4b` is retained as a commented-out alternative for GPU users.
`MAX_SOURCE_CHARS` for cloud Ollama models is 15 000 characters;
`num_ctx` is 32 768 tokens.

**Rationale:**
- Sprint 1 validation requires reliable extraction across diverse real URLs.
  The cloud model outperforms the local GPU model at this without requiring
  any infrastructure change — Ollama handles the relay transparently.
- The provider is still `AI_PROVIDER=ollama`; the switch is a model-name
  change only. Fully reversible.

**Consequences:**
- `ARCHITECTURE.md` references to `gemma4:e4b` should be updated to reflect
  the current active model.
- Extraction still blocks (non-streaming) and takes up to 30s on cloud.
- `.env` files keep the old model commented out; switching back is one line.

---

## Decision: Ollama-First AI Provider for Sprint 1 Local Validation

**Date:** 2026-05-01
**Status:** Accepted
**Decided by:** Founder

**Context:**
Sprint 1 needs real recipe extraction behavior without requiring paid cloud
AI calls during local iteration. The first implementation targeted Claude
streaming, but the Founder chose local Ollama models for the current
validation loop.

**Options Considered:**
1. Claude-only extraction — strongest structured-output behavior, but
   requires paid cloud calls for every local test.
2. Ollama-only extraction — local and free, but slower and less reliable
   at structured extraction.
3. **Configurable provider, Ollama default** — validate locally with
   Ollama while preserving the Anthropic path for later production tests.

**Decision:**
Option 3. Sprint 1 defaults to `AI_PROVIDER=ollama` with
`OLLAMA_MODEL=gemma4:e4b`. Anthropic remains supported behind
`AI_PROVIDER=anthropic`, but it is not the current validation path.

**Rationale:**
- Local development should work without cloud credentials or per-call cost.
- Ollama exposes native JSON-schema output; this is more reliable than
  asking a local model for freeform JSON text.
- The decision is reversible: provider selection is environment-driven.

**Consequences:**
- `/api/ai/import` no longer treats Claude streaming as the Sprint 1
  acceptance target. It returns structured JSON after extraction.
- Local imports may take close to the configured
  `OLLAMA_EXTRACTION_TIMEOUT_MS` of 120 seconds.
- Extraction quality needs QA against several real URLs because local
  models still misplace quantities, units, or notes.
- `src/lib/recipe-jsonld.ts` exists as an optional structured-data
  shortcut, but it is disabled by default during AI validation via
  `ENABLE_RECIPE_STRUCTURED_DATA_IMPORT=false`.

---

## Decision: Claude Model Selection

**Date:** 2026-04-29
**Status:** Superseded for Sprint 1 local validation; retained as a configurable cloud option
**Decided by:** [CTO]

**Context:**
Recipe extraction from HTML/video transcripts and equipment adaptation require instruction-following quality and structured JSON output. Speed and cost matter since each import triggers a Claude call.

**Decision:**
Originally `claude-sonnet-4-6` for all AI features. As of
2026-05-01, Sprint 1 defaults to Ollama for local validation. Claude is
still available via `AI_PROVIDER=anthropic` for fallback cloud evaluation.

**Rationale:**
- Best balance of quality and speed in the current Claude 4.x family
- Structured output (JSON mode) reliable on Sonnet
- Prompt caching applied to system prompts (extraction schema, adaptation instructions) to reduce latency and cost on repeated calls

---

## Decision: Database Strategy (Local vs. Production)

**Date:** 2026-04-29
**Status:** Accepted
**Decided by:** [CTO]

**Context:**
Developers need to run the app locally without cloud accounts. Production needs a serverless-compatible Postgres for Vercel.

**Decision:**
SQLite via Prisma for local development; Neon serverless Postgres for production. The swap is a single `DATABASE_URL` env var — no code changes.

**Rationale:**
- SQLite: zero install, zero config, file-based — ideal for local dev
- Neon: Vercel's recommended partner, generous free tier, serverless driver compatible with Vercel's request model
- Prisma abstracts the dialect difference; migrations run identically against both

**Tradeoffs accepted:**
- SQLite and Postgres have minor dialect differences (e.g., `String[]` arrays not supported in SQLite — stored as comma-separated strings and split in the app layer)
- Recipe `ingredients` and `steps` are stored as JSON-serialized strings
  in SQLite-compatible columns for the MVP. App code owns parsing and
  serialization at service boundaries.

---

## Decision: Prisma Version Pin

**Date:** 2026-04-30
**Status:** Accepted
**Proposed by:** [DEV:backend]
**Accepted by:** [CTO]

**Context:**
Backend Sprint 1 needs Prisma schema/client generation and local SQLite
development. Prisma 6.19.3 validated the schema and generated SQL, but
its schema engine failed silently during SQLite migration commands in
the local environment.

**Decision:**
Pin `prisma` and `@prisma/client` to `^5.22.0` for the MVP scaffold.

**Rationale:**
- Prisma 5.22.0 is stable for Next.js + SQLite scaffolds.
- It keeps the same Prisma Client programming model needed by the app.
- It reduces moving parts while auth, recipes, and import flows are
  still being built.

**Tradeoffs accepted:**
- We may revisit Prisma 6 after the MVP database/API surface is stable.

---

## Decision: SQLite Migration Preflight

**Date:** 2026-04-30
**Status:** Accepted
**Proposed by:** [DEV:backend]
**Accepted by:** [CTO]

**Context:**
`prisma migrate dev` failed with a blank schema-engine error when the
SQLite database file did not yet exist. Running the schema engine
directly revealed the underlying `P1003` missing-database condition.

**Decision:**
Add `scripts/ensure-sqlite-db.mjs` and run it before Prisma migrations
through `npm run db:migrate`.

**Rationale:**
- The preflight only touches `file:` SQLite URLs; Postgres/Neon URLs are
  ignored.
- It keeps local setup reproducible without committing `dev.db`.
- Once the file exists, `npx prisma migrate dev` applies migrations and
  generates Prisma Client normally.

**Tradeoffs accepted:**
- The raw `npx prisma migrate dev` command still expects the SQLite file
  to exist first. Project docs and scripts should use `npm run db:migrate`
  for local setup.

---

## Decision: Auth Strategy

**Date:** 2026-04-29
**Status:** Accepted
**Decided by:** [CTO]

**Context:**
Multi-user app needs registration, login, and session persistence. Must work on Vercel free tier. Should be extensible to OAuth later without a rewrite.

**Decision:**
Auth.js v5 (NextAuth) with Prisma adapter and credentials provider (email + password).

**Rationale:**
- De-facto standard for Next.js auth; large community, well-maintained
- Prisma adapter stores sessions in the same DB as app data — no extra service
- Credentials provider handles email/password MVP; OAuth providers can be added later with minimal changes
- `bcryptjs` for password hashing

**Tradeoffs accepted:**
- Auth.js v5 is relatively new (some rough edges vs. v4); chosen for App Router compatibility

---

## Decision: Sprint 05 Deployment Demo Posture

**Date:** 2026-05-04
**Status:** Accepted
**Decided by:** Founder + [CTO]

**Context:**
Sprint 05 needs to make CookbookAI deployable and demoable on Vercel without
expanding into new product features. Sprint 04 already proved the local
Gemini/YouTube smoke path, but production needs a clear environment,
database, auth-domain, and rollback contract.

**Decision:**
Use Vercel preview deployment first, promote to production only after smoke
checks pass. Keep managed Postgres as the production database path, with Neon
as the documented default unless dev discovers a Vercel-specific blocker or a
cleaner Vercel-native fit. Use Gemini as the production AI provider default.
Demo the app with an authenticated account; no guest mode or email
verification requirement in Sprint 05.

**Rationale:**
- Preview-first deployment keeps the first cloud pass reversible.
- Managed Postgres matches the existing Prisma production direction.
- Gemini is the preferred provider for this project, while Anthropic remains
  optional fallback posture rather than the primary plan.
- Authenticated demo account matches the app's current behavior and avoids
  adding guest-mode scope before deployment is stable.

**Tradeoffs accepted:**
- Public guest onboarding remains deferred.
- Direct Gemini video understanding, Browserbase fallback, recipe macros, and
  YouTube embeds are valid backlog items, but not Sprint 05 blockers.
