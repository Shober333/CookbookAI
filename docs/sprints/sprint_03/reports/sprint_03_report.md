# Sprint 03 — Dev / QA Report

| Field | Value |
|-------|-------|
| **Sprint** | 03 |
| **Goal** | Import resilience + cost control |
| **Status** | Complete; accepted by CTO for Founder review |
| **Dev tasks completed** | P1, U1, B1-B5, F1-F2, QH1 |
| **QA scenarios completed** | 30 / 30 |
| **Report date** | 2026-05-03 |

---

## Delivered

- PRD and decision docs now distinguish URL import, text/paste fallback,
  description-first YouTube import, transcript fallback, and future provider
  work.
- `/api/ai/import` now routes through a shared import service for URL, text,
  duplicate URL reuse, and YouTube description-first flows.
- Text/paste import accepts recipe text or HTML, validates short/non-recipe
  text before AI calls, and preserves optional source URL metadata.
- URL dedupe reuses an existing normalized `sourceUrl` across users while
  creating a private per-user recipe copy and excluding `adaptedSteps`.
- YouTube import detects watch, shorts, and youtu.be URLs; fetches description
  metadata with `YOUTUBE_API_KEY`; filters social/video/link-in-bio domains;
  then imports either the first candidate recipe URL or recipe-like description
  text.
- `/import` now supports `link` and `text` modes, quiet reused-import feedback,
  YouTube link/description status copy, mobile 44px tap targets, and visible
  focus rings.

## Fix Pass

- Stale Playwright server reuse was corrected by stopping the old
  `localhost:3000` process and rerunning against a fresh dev server.
- UI/UX review initially blocked acceptance on focus rings and error CTAs.
  Both were fixed:
  - import mode tabs, URL input, and textarea now expose the focus ring token
  - URL-mode error CTAs now match the locked states: network gets `Try again`;
    URL no-recipe gets `Try another link`; paywall / YouTube no-recipe get
    `Paste recipe text instead ->` plus `Try another link`
- UI docs were reconciled so the visible tab label remains `link`, while the
  API payload contract is `{ mode: "url", url }`.

## Verification

- `npm run db:migrate` — pass; applied `20260501120000_add_adapted_steps` and
  regenerated Prisma Client locally.
- `npm run typecheck` — pass.
- `npm test` — pass, 95 / 95 tests across 8 files.
- `npm run build` — pass.
- `npx playwright test` — pass, 26 / 26 Chromium tests.

Screenshots captured under `tests/screenshots/`:

- `import-url-mode.png`
- `import-text-mode.png`
- `import-reused-url.png`
- `import-youtube-link.png`
- `import-youtube-description.png`
- Existing Sprint 1/2 screenshots regenerated as part of the full run.

## Known Issues

- Live YouTube validation still requires a real `YOUTUBE_API_KEY` in `.env`.
  Automated QA mocks YouTube/API/AI responses, which is the correct CI posture.
- Provider migration remains deferred. No Gemini/OpenAI/Groq runtime branch was
  added in Sprint 03.
- `Auth.js` logs expected `CredentialsSignin` noise during the wrong-password
  E2E scenario. This is not a failing condition.

## Recommendation

Sprint 03 is ready for Founder review. Production/provider planning and live
YouTube-key validation should remain separate follow-up work.
