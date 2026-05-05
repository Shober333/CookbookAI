# Sprint 06 — Browserbase Boundary

> Owner: `[CTO]`  
> Status: Founder requested promotion into Sprint 06 on 2026-05-05

## Decision

Sprint 06 includes a bounded Browserbase fallback for **public recipe pages**
that normal server-side fetch cannot read because the site blocks Vercel
traffic or requires JavaScript rendering before recipe text appears.

Browserbase is not a new primary import path. The order remains:

1. Normal server fetch.
2. Existing structured/text extraction checks.
3. Browserbase fallback only when enabled and justified by fetch failure or
   unusable JavaScript-heavy content.
4. Existing AI recipe extraction from the extracted page text.

## Allowed

- Public recipe pages that render in a normal browser.
- JavaScript-heavy pages where recipe text appears after client rendering.
- Public pages that block Vercel/serverless fetch but are otherwise accessible
  without credentials.
- Session Inspector / replay for debugging failed imports during development
  or QA.

## Not Allowed

- Paywalls.
- Login-required pages.
- Private pages or user-specific content.
- CAPTCHA solving or anti-abuse bypass.
- Storing Browserbase recordings or page content beyond what is needed for the
  recipe import flow.

## Implementation Preference

- Prefer deterministic Playwright-style rendering through Browserbase browser
  sessions.
- Do not add Stagehand/AI browser control unless a later sprint proves simple
  rendering is insufficient.
- Always close Browserbase sessions.
- Keep the fallback behind environment configuration so local development and
  demos can disable it cleanly.

## Expected Environment

- `BROWSERBASE_API_KEY`
- `BROWSERBASE_PROJECT_ID` if required by the chosen SDK/API path
- `BROWSERBASE_FALLBACK_ENABLED`
- `BROWSERBASE_TIMEOUT_MS`

## Review Gate

The CTO review blocks Sprint 06 if Browserbase is used to bypass access
controls rather than to render public pages.
