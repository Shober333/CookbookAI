# Sprint 03 — Dev Tasks

> **Owner:** [DEV-LEAD]
> **Sprint goal:** Import resilience + cost control.
> **Status:** Founder approved 2026-05-02. `[UI/UX]` U1 is locked;
> implementation may start against `sprint_03_design_brief.md`.

---

## Phase 0 — Governance + Design

### Task P1 — PRD import-scope cleanup `[CTO]` · Small

**What:** Resolve the Sprint 02 CTO review finding that `docs/PRD.md`
still marks text/paste import as a Must Have while the report implied all
remaining Must Haves were complete.

**Behaviour:**
- Update `docs/PRD.md` so URL import, text/paste fallback, and YouTube import
  priorities reflect the Founder-approved Sprint 03 scope.
- Keep the distinction clear:
  - URL import: already implemented, still core.
  - Text/paste fallback: Sprint 03 target.
  - YouTube description-first: Sprint 03 target.
  - Transcript/video direct processing: later.

**Files:**
- `docs/PRD.md`
- `docs/DECISIONS.md` only if the Founder changes priority or scope.

**Tests:** Docs review only.

---

### Task U1 — Import fallback UI spec `[UI/UX]` · Medium

**What:** Add or update design specs for the `/import` page to support
multiple import modes: URL, text/paste, and YouTube URL handling.

**Behaviour:**
- Specify the mode switch. Preferred draft: segmented control or tabs near the
  existing input, not a new page.
- Specify empty, loading, success, and error copy for:
  - URL import.
  - Text/paste import.
  - Duplicate URL reused from library cache.
  - YouTube description external-link path.
  - YouTube description text path.
  - YouTube unsupported/no-recipe-found path.
- Specify mobile behavior at 375px.
- Confirm screenshots required for QA.
- Do not introduce new tokens without Founder approval.

**Files:**
- `docs/ui/PAGE_LAYOUTS.md`
- `docs/ui/STATES.md`
- `docs/ui/COMPONENT_SPECS.md` if a new component or variant is needed.
- Optional sprint-local supplement: `docs/sprints/sprint_03/sprint_03_design_brief.md`

**Tests:** `[UI/UX]` self-review against `REGISTER.md` and `UI_KIT.md`.

---

## Sprint 03 API Contract

Public request bodies use `mode` at the route/UI boundary. The shared
backend service may translate that into an internal `kind` discriminant,
but the external `POST /api/ai/import` contract stays mode-based:

```ts
{ mode: "url", url: string }
{ mode: "text", text: string, sourceUrl?: string | null }
```

The response shape used by B3, B5, and F2 is:

```ts
type ImportResponse = {
  recipe: Recipe
  reused?: boolean
  sourceKind?: "url" | "text" | "youtube-link" | "youtube-description"
  sourceUrl?: string | null
  sourceDomain?: string | null
}
```

Defaults: `reused = false`; `sourceKind` falls back to the submitted
mode. For `sourceKind: "youtube-link"`, B5 must populate `sourceUrl`
with the resolved recipe URL and `sourceDomain` with a display-normalized
bare host (strip `www.`, path, query, fragment). UI must not fabricate
`sourceDomain` if it is absent or `null`.

---

## Phase 1 — Backend Foundation

### Task B1 — Extract shared import service `[DEV:backend]` · Medium

**What:** Refactor the current URL import route so all import inputs can
share validation, AI extraction, persistence, and error handling.

**Behaviour:**
- Preserve existing `/api/ai/import` URL-import behavior.
- Introduce a service-level function that accepts one of:
  - `{ kind: "url", url: string }`
  - `{ kind: "text", text: string, sourceUrl?: string | null }`
- The API route translates public `mode` request bodies into this internal
  service shape.
- Keep auth requirements unchanged for Sprint 03: authenticated users only.
- Keep existing recipe schema validation and normalization behavior.
- Keep `looksLikeRecipePage()` or equivalent pre-screening for text sources.
- Maintain current user isolation and post-import response shape.

**Files:**
- `src/app/api/ai/import/route.ts`
- `src/lib/recipe-ai-extractor.ts`
- New or existing service file under `src/lib/` for import orchestration.

**Tests:**
- Unit tests for text-source import orchestration and pre-screening.
- Regression tests for existing URL import route behavior.

---

### Task B2 — Text/paste import API `[DEV:backend]` · Medium

**What:** Support raw recipe text or HTML as an import source.

**Request body draft:**

```ts
{
  mode: "text",
  text: string,
  sourceUrl?: string | null
}
```

**Behaviour:**
- Trim input; reject blank or too-short text with a clear 400 response.
- Cap maximum text length using the same source-excerpt limits as URL import.
- Run the recipe-like pre-screen before calling AI.
- Send the text directly to the extraction pipeline without trying to fetch it
  as a URL.
- Save and return a Recipe exactly like URL import.
- If `sourceUrl` is supplied, validate it as a URL and store it on the Recipe.

**Files:**
- `src/app/api/ai/import/route.ts`
- `src/lib/recipe-ai-extractor.ts`
- `src/lib/recipe-service.ts` if source metadata handling changes.

**Tests:**
- Valid recipe text imports successfully.
- Non-recipe text returns fast failure without AI call.
- Blank/short text returns 400.
- Optional `sourceUrl` is persisted when valid.
- Auth boundary remains 401 when unauthenticated.

---

### Task B3 — URL deduplication before AI calls `[DEV:backend]` · Medium

**What:** Avoid paid AI calls when a source URL has already been imported by
any user.

**Behaviour:**
- Before URL fetch and AI extraction, look for an existing Recipe with the same
  normalized `sourceUrl` across all users.
- If found:
  - Create a new Recipe row for the current user by copying extracted fields.
  - Do not copy user-specific fields that should remain personal, such as
    adapted steps.
  - Preserve title, description, source URL, servings, ingredients, steps, and
    tags.
  - Return the same response shape as a fresh import.
  - Include a machine-readable marker such as `reused: true` so the UI can show
    quiet feedback.
- If not found, continue through the existing URL import pipeline.
- Keep per-user libraries private: dedupe may reuse extracted data, but users
  never see another user's library entry.

**Files:**
- `src/lib/recipe-service.ts`
- `src/app/api/ai/import/route.ts`
- `prisma/schema.prisma` only if the existing `sourceUrl` index is missing.

**Tests:**
- Same user importing same URL gets a new or reused row per decided behavior
  without AI call. Approved default: create a fresh per-user copy.
- Different user importing same URL gets a private copy without AI call.
- Reused import does not copy `adaptedSteps`.
- Unique URL still calls AI.

---

### Task B4 — YouTube metadata + description parser `[DEV:backend]` · Medium

**What:** Add a YouTube description-first helper layer.

**Behaviour:**
- Detect supported YouTube URLs:
  - `youtube.com/watch?v=...`
  - `youtu.be/...`
  - `youtube.com/shorts/...` if practical.
- Fetch video metadata via YouTube Data API using `YOUTUBE_API_KEY`.
- Extract description text.
- Extract `http://` and `https://` links from the description.
- Filter out known non-recipe/social/video domains:
  - `youtube.com`, `youtu.be`, `instagram.com`, `tiktok.com`, `x.com`,
    `twitter.com`, `facebook.com`, `pinterest.com`, `threads.net`, common
    merch/link-in-bio domains unless later approved.
- Return structured result:

```ts
{
  videoId: string,
  title: string,
  description: string,
  candidateUrls: string[]
}
```

**Files:**
- New helper file under `src/lib/`, e.g. `youtube-import.ts`.
- `.env.example`, `README.md`, and `CLAUDE.md` env sections for `YOUTUBE_API_KEY`.

**Tests:**
- URL detection for watch, youtu.be, and shorts.
- Description link extraction and filtering.
- Missing API key returns a controlled error before network call.
- No candidate URLs still returns description for Tier 1b.

---

### Task B5 — YouTube description-first import route `[DEV:backend]` · Medium

**What:** Route YouTube URLs through the description-first waterfall.

**Behaviour:**
- If an import URL is YouTube:
  1. Fetch description metadata.
  2. If candidate external URL exists, attempt normal URL import for the first
     candidate.
  3. If candidate URL import fails because the linked page blocks extraction or
     is not recipe-like, try description text import if the description passes
     pre-screening.
  4. If neither path works, return a clear unsupported/no-recipe response.
- Do not implement transcript fallback in Sprint 03.
- Do not implement Gemini direct video processing in Sprint 03.
- Avoid duplicate AI calls where possible:
  - Candidate URL should go through URL dedupe first.
  - Description text should only call AI after pre-screening.
- When the external-link path succeeds, return
  `sourceKind: "youtube-link"`, `sourceUrl`, and normalized `sourceDomain`
  per the Sprint 03 API contract above.
- When the description-text path succeeds, return
  `sourceKind: "youtube-description"`.

**Files:**
- `src/app/api/ai/import/route.ts`
- Shared import service from B1.
- YouTube helper from B4.

**Tests:**
- YouTube URL with external recipe link imports that linked URL.
- YouTube URL with recipe-like description and no external link imports from text.
- YouTube URL with no recipe link/text returns user-safe failure.
- Candidate URL dedupe prevents AI call.
- API key/network failures produce useful error response.
- YouTube external-link response includes `sourceUrl` and normalized
  `sourceDomain`.

---

## Phase 2 — Frontend

### Task F1 — Import mode UI `[DEV:frontend]` · Medium

**What:** Update `/import` so users can choose URL or text/paste mode.

**Behaviour:**
- Follow `[UI/UX]` spec from U1.
- URL mode remains the default.
- Text mode provides a textarea for raw recipe text or HTML.
- Client validation:
  - URL mode requires valid URL.
  - Text mode requires non-empty text with a useful minimum length.
- Submit payload includes `mode`.
- Existing success auto-navigate behavior remains.
- Existing URL import screenshots should remain visually consistent aside from
  the new mode control.

**Files:**
- `src/components/import/ImportForm.tsx`
- Any UI support component only if specified by `[UI/UX]`.

**Tests:**
- E2E: URL import still works.
- E2E: text import posts text payload and navigates to recipe detail.
- Screenshot: import form with text mode active.

---

### Task F2 — Import feedback for reused and YouTube paths `[DEV:frontend]` · Small

**What:** Surface quiet import feedback when the backend reports a reused
duplicate URL or a YouTube description path.

**Behaviour:**
- If response includes `reused: true`, show a quiet status before navigation
  using `[UI/UX]` copy.
- If response includes metadata such as `sourceKind: "youtube-link"` or
  `sourceKind: "youtube-description"`, show a status that matches the import
  progress language.
- If `sourceKind: "youtube-link"` includes `sourceDomain`, show the
  `[UI/UX]`-specified muted domain hint; if absent or `null`, show the bare
  phase copy.
- Do not add celebratory toasts.
- Preserve auto-navigate.

**Files:**
- `src/components/import/ImportForm.tsx`
- Type definitions if response shape is formalized.

**Tests:**
- E2E mocks reused import and asserts quiet feedback appears.
- E2E mocks YouTube description import and asserts progress/status copy.
- E2E mocks YouTube external-link import and asserts the candidate domain hint
  appears only when `sourceDomain` is present.

---

## Phase 3 — Verification + Reports

### Task QH1 — Sprint report handoff `[DEV-LEAD]` · Small

**What:** Produce the dev report after implementation and QA.

**Files:**
- `docs/sprints/sprint_03/reports/sprint_03_report.md`

**Required content:**
- Tasks completed/deferred.
- Test results.
- Screenshots captured.
- Known issues.
- Manual YouTube live-key validation status, if run.
- Provider decision status: unchanged, accepted, or deferred.

---

## Explicit Deferrals

- **Guest mode** is planned in `docs/DECISIONS.md`, but not included in this
  Sprint 03 scope. It pairs naturally with dedupe, but would expand auth,
  middleware, schema, and account-upgrade scope.
- **Gemini provider migration** is recommended by CTO but not included here.
  Provider migration is a separate production-readiness sprint.
- **YouTube transcript fallback** remains Sprint 4+ or later.
