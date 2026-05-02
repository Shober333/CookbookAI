# Sprint 03 — QA Scenarios

> **Owner:** [DEV-QA]
> Run after Phase 2 is complete. Screenshots required for UI changes.
> **Run date:** TBD · **Status:** Founder approved; not yet run.

---

## Status Key

- `[ ]` Not tested
- `[x]` Pass
- `[!]` Fail — log bug below

---

## PRD / Governance

| # | Scenario | Steps | Expected | Status |
|---|----------|-------|----------|--------|
| G1 | PRD import scope updated | Review `docs/PRD.md` after P1 | Text/paste and YouTube scope match Sprint 03 decision; no claim that all import Must Haves are done before implementation | `[ ]` |
| G2 | Provider migration not accidentally included | Review code and docs | No Gemini/OpenAI/Groq runtime branch added unless Founder explicitly approved it | `[ ]` |

---

## Text/Paste Import

| # | Scenario | Steps | Expected | Status |
|---|----------|-------|----------|--------|
| T1 | Text import happy path | Log in → `/import` → switch to text mode → paste recipe text → submit | Recipe is extracted, saved, and user lands on recipe detail | `[ ]` |
| T2 | Text import with HTML | Paste recipe-like HTML snippet | Extraction receives text/HTML source and saves structured recipe | `[ ]` |
| T3 | Blank text rejected | Text mode → submit blank input | Client or API rejects without AI call; user sees designed validation copy | `[ ]` |
| T4 | Non-recipe text rejected | Paste non-recipe prose | API returns user-safe failure without creating recipe | `[ ]` |
| T5 | Optional source URL persists | Submit text mode with valid source URL if UI supports it | Recipe detail shows source domain; API stores `sourceUrl` | `[ ]` |
| T6 | Auth boundary | POST text import without session | Returns 401 | `[ ]` |

---

## URL Deduplication

| # | Scenario | Steps | Expected | Status |
|---|----------|-------|----------|--------|
| D1 | Same URL avoids second AI call | User A imports URL; import same URL again with mocked AI call counter | Second import uses cached extraction path; AI route/helper is not called | `[ ]` |
| D2 | Cross-user dedupe keeps privacy | User A imports URL; User B imports same URL | User B gets a private recipe row; User B never sees User A's recipe id/library data | `[ ]` |
| D3 | Deduped copy excludes adapted steps | User A saves adapted version; User B imports same URL | User B recipe has original steps but `adaptedSteps` is null | `[ ]` |
| D4 | Unique URL still extracts | Import a new URL | AI extraction path is called normally | `[ ]` |
| D5 | Reuse feedback visible | Mock reused response in UI | Import form shows quiet `[UI/UX]`-approved reuse status before auto-navigation | `[ ]` |

---

## YouTube Description-First Import

| # | Scenario | Steps | Expected | Status |
|---|----------|-------|----------|--------|
| Y1 | YouTube URL with external recipe link | Mock YouTube metadata response with recipe URL in description | Import follows the external URL path, saves recipe, and response includes `sourceKind: "youtube-link"`, `sourceUrl`, and normalized `sourceDomain` | `[ ]` |
| Y2 | YouTube URL with multiple social links | Mock description with social links and one recipe link | Social/video links are filtered; recipe candidate is selected | `[ ]` |
| Y3 | YouTube URL with recipe-like description | Mock description with recipe text and no external URL | Import uses text extraction path and saves recipe | `[ ]` |
| Y4 | YouTube URL with no recipe signal | Mock description without recipe link/text | User sees designed unsupported/no-recipe state; no recipe created | `[ ]` |
| Y5 | Missing YouTube API key | Clear `YOUTUBE_API_KEY`; submit YouTube URL | API returns controlled configuration error; UI shows designed failure | `[ ]` |
| Y6 | Candidate URL dedupe | YouTube description points to already-imported URL | Import reuses cached extraction and avoids AI call | `[ ]` |

---

## Import UI

| # | Scenario | Steps | Expected | Status |
|---|----------|-------|----------|--------|
| U1 | URL mode remains default | Open `/import` | Existing URL import flow is the first visible mode | `[ ]` |
| U2 | Mode switch keyboard accessible | Tab through mode control and switch modes with keyboard | Focus states visible; mode changes without mouse | `[ ]` |
| U3 | Mobile layout at 375px | Open `/import` at 375px and switch modes | No horizontal scroll; mode switch, URL input, submit button, and textarea all fit; interactive tap targets are >= 44x44px | `[ ]` |
| U4 | Reduced motion | Enable reduced motion and submit import | Progress state respects `prefers-reduced-motion` | `[ ]` |
| U5 | Import form screenshots | Capture URL mode, text mode, reused URL status, YouTube status | Screenshots saved under `tests/screenshots/` | `[ ]` |

---

## Regression

| # | Scenario | Expected | Status |
|---|----------|----------|--------|
| R1 | `npm run typecheck` | Clean | `[ ]` |
| R2 | `npm test` | Unit suite green, including new import helper tests | `[ ]` |
| R3 | `npm run build` | Production build clean | `[ ]` |
| R4 | `npx playwright test` | Existing Sprint 1/2 suites plus Sprint 3 tests green | `[ ]` |
| R5 | Existing URL import | Current mocked URL import E2E still passes | `[ ]` |
| R6 | Library privacy | Existing cross-user library privacy still passes | `[ ]` |

---

## Screenshots Required

- [ ] `import-url-mode.png` — default URL mode.
- [ ] `import-text-mode.png` — text/paste mode active.
- [ ] `import-reused-url.png` — quiet duplicate-reuse feedback.
- [ ] `import-youtube-link.png` — YouTube external recipe-link path.
- [ ] `import-youtube-description.png` — YouTube description-text path.
- [ ] Existing Sprint 1/2 import screenshots regenerated if visual layout changes.

---

## Bugs Found

None yet.

---

## Recommendation

QA begins after `[DEV-LEAD]` marks Phase 2 complete.
