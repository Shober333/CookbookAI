# Sprint 06 — YouTube Source Continuity

| Field | Value |
|-------|-------|
| **Sprint** | 06 |
| **Goal** | Make external recipe sources more reliable by preserving YouTube origin metadata, embedding source videos, closing deployed YouTube smoke, and adding a bounded Browserbase fallback for public blocked/JavaScript-heavy recipe pages |
| **Status** | CTO accepted; ready for Sprint 07 planning |
| **Start** | 2026-05-05 |
| **End** | 2026-05-06 |

---

## Why This Sprint

Sprint 05 made CookbookAI Vercel-demoable, but deployed YouTube smoke was
explicitly deferred pending a stable demo key/video set, and public URL import
remains host-dependent when recipe sites block server-side fetches or require
JavaScript rendering. The strongest next move is to close those source
reliability gaps while improving the product surface users actually see:
recipes imported from YouTube should retain the original video as part of the
recipe record, even when the app follows a recipe link from the video
description.

This also prepares the app for later Gemini direct-video fallback and broader
import resilience without overloading the sprint.

---

## Scope

1. **Source metadata model** — store enough source information to distinguish
   the saved recipe URL from the original YouTube video URL.
2. **YouTube embed on recipe detail** — show the original video for recipes
   imported from YouTube.
3. **Import response contract cleanup** — make backend/frontend source fields
   explicit so UI can safely explain whether import came from URL, text,
   YouTube link, YouTube description, or transcript.
4. **Browserbase public-page fallback** — when normal server fetch fails or
   returns unusable JavaScript-heavy content, optionally render the public page
   through Browserbase and pass extracted text into the existing AI pipeline.
5. **Deployed YouTube smoke** — pick a stable demo video set and verify link,
   description, and no-recipe recovery against Vercel.
6. **Demo script update** — document a reliable demo path for text import,
   URL import, YouTube import, and expected blocked-site recovery.

---

## Not In Scope Unless Promoted

- Direct Gemini video understanding fallback.
- Recipe macros/nutrition estimates.
- Guest mode.
- Paid tiers or subscription management.
- Full recipe organization/search.
- Paywall, login wall, CAPTCHA, or private-content bypass.

---

## Founder Decisions Confirmed

| Decision | CTO recommendation |
|----------|--------------------|
| Sprint identity | Treat this as Sprint 06, because Sprint 05 was accepted on 2026-05-05 |
| Primary scope | YouTube source continuity and deployed YouTube smoke |
| Direct video fallback | Defer; design the metadata so it can be added later |
| Browserbase | Include a bounded public-page fallback this sprint |
| Macros/nutrition | Defer to a nutrition-focused sprint with a real data source |

---

## Exit Criteria

- [x] Founder confirms Sprint 06 scope.
- [x] Recipe data model stores original YouTube video URL separately from
      saved/resolved recipe source URL.
- [x] Local SQLite and production Postgres Prisma schemas/migrations stay in
      sync.
- [x] Import responses expose source metadata with a tested contract.
- [x] Recipe detail embeds the YouTube video when present.
- [x] Non-YouTube recipes render unchanged.
- [x] Browserbase fallback is implemented behind env/config and only runs for
      public URL import failures or JavaScript-heavy pages.
- [x] Browserbase missing-key, timeout, and blocked-page outcomes produce
      controlled user-safe errors.
- [x] Deployed YouTube link, description, and no-recipe recovery smoke passes
      or is blocked by a documented provider/quota issue.
- [x] Browserbase fallback is smoke-tested locally and on Vercel, or blocked
      by documented Browserbase account/quota limits.
- [x] Demo script is updated with stable URLs/videos.
- [x] QA report completed.
- [x] CTO Good/Bad/Ugly review completed.

---

## Artifacts

- Team note: `team.md`
- UI/UX source presentation: `uiux_source_presentation.md`
- Dev tasks: `todo/dev_todo.md`
- QA scenarios: `todo/qa_todo.md`
- Sprint report: `reports/sprint_06_report.md`
- QA report: `reports/qa_report.md`
- CTO review: `reviews/cto_sprint6_review.md`
