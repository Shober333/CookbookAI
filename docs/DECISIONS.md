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
After Claude finishes extracting a recipe, two flows were considered: require the user to click "Save to library", or save automatically and navigate.

**Options Considered:**
1. **Auto-navigate** — save server-side on streaming complete; redirect to `/recipes/[id]` after ~1.5s
2. Manual save — streaming box shows "Save to library" CTA; user clicks

**Decision:** Option 1 — Auto-navigate.

**Rationale:**
The user's intent when pasting a URL is to bring the recipe in. Requiring an extra click after streaming completes adds friction with no benefit — they can always delete from the library if the extraction was wrong. Auto-save + navigate makes the success state feel instant.

---

## Decision: Full-Stack Framework + Deployment Target

**Date:** 2026-04-29
**Status:** Accepted
**Decided by:** Founder (options presented by [CTO])

**Context:**
CookbookAI requires a browser-based UI, multi-user auth, persistent data storage, Claude API integration with streaming responses, and deployment to Vercel. The stack choice shapes every downstream technical decision and is not easily reversed.

**Options Considered:**
1. **Next.js 15 full-stack (monorepo)** — Next.js API Routes as serverless backend, Vercel AI SDK for streaming, Prisma + SQLite/Neon for data, Auth.js for auth. Single repo, single language, Vercel-native.
2. **Vite React + Node/Express (two services)** — React frontend on Vercel, Express backend on Railway/Render. No serverless timeout pressure, but two deployments; Railway/Render free tiers spin down after inactivity.
3. **SvelteKit full-stack** — Same deployment story as Option 1 but lighter framework; smaller ecosystem and fewer AI tooling examples.

**Decision:**
Option 1 — Next.js 15 full-stack monorepo.

**Rationale:**
- Vercel built Next.js: zero-config deployment, first-class support, streaming edge functions
- Vercel AI SDK solves the 10s serverless timeout problem for Claude calls via streaming
- Prisma lets us run SQLite locally (zero cloud setup) and swap to Neon Postgres for production with a single env var change
- Single TypeScript codebase reduces coordination overhead for a vibe-coded project
- shadcn/ui is the dominant React component library for this stack — accessible, fully owned, no runtime dependency

**Tradeoffs accepted:**
- Serverless cold starts on first request after inactivity (minor, acceptable for Hobby tier)
- All AI responses must stream; non-streaming Claude calls risk hitting the 10s function limit

---

## Decision: Claude Model Selection

**Date:** 2026-04-29
**Status:** Accepted
**Decided by:** [CTO]

**Context:**
Recipe extraction from HTML/video transcripts and equipment adaptation require instruction-following quality and structured JSON output. Speed and cost matter since each import triggers a Claude call.

**Decision:**
`claude-sonnet-4-6` for all AI features.

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
