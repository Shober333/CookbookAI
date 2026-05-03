# Sprint 03 — QA Scenarios

> **Owner:** [DEV-QA]
> Run after Phase 2 is complete. Screenshots required for UI changes.
> **Run date:** 2026-05-03 · **Status:** Passed after UI/UX fix pass.

---

## Status Key

- `[ ]` Not tested
- `[x]` Pass
- `[!]` Fail — log bug below

---

## PRD / Governance

| # | Scenario | Steps | Expected | Status |
|---|----------|-------|----------|--------|
| G1 | PRD import scope updated | Review `docs/PRD.md` after P1 | Text/paste and YouTube scope match Sprint 03 decision; no claim that all import Must Haves are done before implementation | `[x]` |
| G2 | Provider migration not accidentally included | Review code and docs | No Gemini/OpenAI/Groq runtime branch added unless Founder explicitly approved it | `[x]` |

---

## Text/Paste Import

| # | Scenario | Steps | Expected | Status |
|---|----------|-------|----------|--------|
| T1 | Text import happy path | Log in → `/import` → switch to text mode → paste recipe text → submit | Recipe is extracted, saved, and user lands on recipe detail | `[x]` |
| T2 | Text import with HTML | Paste recipe-like HTML snippet | Extraction receives text/HTML source and saves structured recipe | `[x]` |
| T3 | Blank text rejected | Text mode → submit blank input | Client or API rejects without AI call; user sees designed validation copy | `[x]` |
| T4 | Non-recipe text rejected | Paste non-recipe prose | API returns user-safe failure without creating recipe | `[x]` |
| T5 | Optional source URL persists | Submit text mode with valid source URL if UI supports it | Recipe detail shows source domain; API stores `sourceUrl` | `[x]` |
| T6 | Auth boundary | POST text import without session | Returns 401 | `[x]` |

---

## URL Deduplication

| # | Scenario | Steps | Expected | Status |
|---|----------|-------|----------|--------|
| D1 | Same URL avoids second AI call | User A imports URL; import same URL again with mocked AI call counter | Second import uses cached extraction path; AI route/helper is not called | `[x]` |
| D2 | Cross-user dedupe keeps privacy | User A imports URL; User B imports same URL | User B gets a private recipe row; User B never sees User A's recipe id/library data | `[x]` |
| D3 | Deduped copy excludes adapted steps | User A saves adapted version; User B imports same URL | User B recipe has original steps but `adaptedSteps` is null | `[x]` |
| D4 | Unique URL still extracts | Import a new URL | AI extraction path is called normally | `[x]` |
| D5 | Reuse feedback visible | Mock reused response in UI | Import form shows quiet `[UI/UX]`-approved reuse status before auto-navigation | `[x]` |

---

## YouTube Description-First Import

| # | Scenario | Steps | Expected | Status |
|---|----------|-------|----------|--------|
| Y1 | YouTube URL with external recipe link | Mock YouTube metadata response with recipe URL in description | Import follows the external URL path, saves recipe, and response includes `sourceKind: "youtube-link"`, `sourceUrl`, and normalized `sourceDomain` | `[x]` |
| Y2 | YouTube URL with multiple social links | Mock description with social links and one recipe link | Social/video links are filtered; recipe candidate is selected | `[x]` |
| Y3 | YouTube URL with recipe-like description | Mock description with recipe text and no external URL | Import uses text extraction path and saves recipe | `[x]` |
| Y4 | YouTube URL with no recipe signal | Mock description without recipe link/text | User sees designed unsupported/no-recipe state; no recipe created | `[x]` |
| Y5 | Missing YouTube API key | Clear `YOUTUBE_API_KEY`; submit YouTube URL | API returns controlled configuration error; UI shows designed failure | `[x]` |
| Y6 | Candidate URL dedupe | YouTube description points to already-imported URL | Import reuses cached extraction and avoids AI call | `[x]` |

---

## Import UI

| # | Scenario | Steps | Expected | Status |
|---|----------|-------|----------|--------|
| U1 | URL mode remains default | Open `/import` | Existing URL import flow is the first visible mode | `[x]` |
| U2 | Mode switch keyboard accessible | Tab through mode control and switch modes with keyboard | Focus states visible; mode changes without mouse | `[x]` |
| U3 | Mobile layout at 375px | Open `/import` at 375px and switch modes | No horizontal scroll; mode switch, URL input, submit button, and textarea all fit; interactive tap targets are >= 44x44px | `[x]` |
| U4 | Reduced motion | Enable reduced motion and submit import | Progress state respects `prefers-reduced-motion` | `[x]` |
| U5 | Import form screenshots | Capture URL mode, text mode, reused URL status, YouTube status | Screenshots saved under `tests/screenshots/` | `[x]` |

---

## Regression

| # | Scenario | Expected | Status |
|---|----------|----------|--------|
| R1 | `npm run typecheck` | Clean | `[x]` |
| R2 | `npm test` | Unit suite green, including new import helper tests | `[x]` |
| R3 | `npm run build` | Production build clean | `[x]` |
| R4 | `npx playwright test` | Existing Sprint 1/2 suites plus Sprint 3 tests green | `[x]` |
| R5 | Existing URL import | Current mocked URL import E2E still passes | `[x]` |
| R6 | Library privacy | Existing cross-user library privacy still passes | `[x]` |

---

## Screenshots Required

- [x] `import-url-mode.png` — default URL mode.
- [x] `import-text-mode.png` — text/paste mode active.
- [x] `import-reused-url.png` — quiet duplicate-reuse feedback.
- [x] `import-youtube-link.png` — YouTube external recipe-link path.
- [x] `import-youtube-description.png` — YouTube description-text path.
- [x] Existing Sprint 1/2 import screenshots regenerated if visual layout changes.

---

## QA Evidence

- `npm run db:migrate` passed on 2026-05-03 and applied
  `20260501120000_add_adapted_steps` locally before generating Prisma Client.
- `npm run typecheck` passed on 2026-05-03.
- `npm test` passed on 2026-05-03: 95 / 95 tests across 8 files.
- `npm run build` passed on 2026-05-03.
- `npx playwright test` passed on 2026-05-03: 26 / 26 Chromium tests across
  Sprint 1, Sprint 2, and Sprint 3 suites.
- First Playwright run failed because a stale `localhost:3000` dev server was
  being reused. After stopping it, the fresh server run passed.

---

## Bugs Found

No blocking Sprint 03 QA bugs remain open.

---

## Recommendation

Ready for CTO Good/Bad/Ugly review.
