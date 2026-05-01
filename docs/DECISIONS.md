# Decision Log

> Non-obvious technical decisions, with context and rationale.
> **Owner:** [CTO]

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
still available via `AI_PROVIDER=anthropic` for later production/cloud
evaluation.

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
