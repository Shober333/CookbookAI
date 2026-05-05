# Sprint 06 — QA Scenarios

> **Owner:** [DEV-QA]  
> **Run date:** TBD · **Status:** Not started.

---

## Status Key

- `[ ]` Not run
- `[/]` Running
- `[x]` Passed
- `[!]` Failed
- `[-]` Deferred

---

## Local Regression

| # | Scenario | Steps | Expected | Status |
|---|----------|-------|----------|--------|
| Q6.1 | Typecheck | Run `npm run typecheck` | Clean | `[ ]` |
| Q6.2 | Unit tests | Run `npm test` | All tests pass | `[ ]` |
| Q6.3 | Local production build | Run `npm run build` | Build succeeds | `[ ]` |
| Q6.4 | Vercel-style build | Run `DATABASE_URL="postgresql://..." npm run build:vercel` with safe/stub Postgres URL as documented | Build path generates Postgres Prisma Client and succeeds or blocker is documented | `[ ]` |
| Q6.5 | E2E regression | Run `npx playwright test --project=chromium` | Existing flows pass | `[ ]` |

---

## Source Metadata

| # | Scenario | Steps | Expected | Status |
|---|----------|-------|----------|--------|
| Q6.6 | Existing non-YouTube recipe | Open/import normal URL recipe | No embed appears; existing source link behavior remains intact | `[ ]` |
| Q6.7 | YouTube link import metadata | Import video with recipe link in description | Saved recipe records original YouTube URL and resolved recipe URL separately | `[ ]` |
| Q6.8 | YouTube description import metadata | Import video with recipe-like description text | Saved recipe records original YouTube URL and `youtube-description` source kind | `[ ]` |
| Q6.9 | YouTube transcript metadata | Import video requiring transcript fallback if stable sample exists | Saved recipe records original YouTube URL and `youtube-transcript` source kind | `[ ]` |

---

## Browserbase Fallback

| # | Scenario | Steps | Expected | Status |
|---|----------|-------|----------|--------|
| Q6.10 | Browserbase disabled | Import public page that normal fetch cannot read with fallback disabled | Existing controlled connection/error state appears; no Browserbase call is required | `[ ]` |
| Q6.11 | Browserbase missing key | Enable fallback without `BROWSERBASE_API_KEY` | User-safe provider configuration error appears; app does not crash | `[ ]` |
| Q6.12 | Browserbase-assisted public page | Import stable public blocked/JS-heavy recipe page with fallback enabled | Browserbase renders/extracts page text; recipe saves or shows controlled no-recipe state | `[ ]` |
| Q6.13 | Browserbase boundary | Try a login/paywall/CAPTCHA-gated sample only if safe to identify without bypassing | App does not attempt credentialed/private bypass; outcome is documented as unsupported | `[ ]` |

---

## Recipe Detail UI

| # | Scenario | Steps | Expected | Status |
|---|----------|-------|----------|--------|
| Q6.14 | YouTube embed desktop | Open YouTube-sourced recipe detail on desktop | Responsive embed renders without overlapping ingredients/method | `[ ]` |
| Q6.15 | YouTube embed mobile | Open same recipe at 375px | Embed fits viewport; controls remain reachable; no text overlap | `[ ]` |
| Q6.16 | Keyboard/a11y smoke | Tab through recipe detail | Focus order remains coherent; iframe has accessible title | `[ ]` |
| Q6.17 | Non-YouTube detail regression | Open existing non-YouTube recipe | No empty video frame or broken source label appears | `[ ]` |

---

## Deployed Smoke

| # | Scenario | Steps | Expected | Status |
|---|----------|-------|----------|--------|
| Q6.18 | Deployed auth baseline | Register/login on Vercel | Auth still works after schema/API changes | `[ ]` |
| Q6.19 | Deployed YouTube link path | Import stable video with recipe link | Recipe saves; detail embeds original video and shows resolved source | `[ ]` |
| Q6.20 | Deployed YouTube description path | Import stable video with recipe-like description | Recipe saves; detail embeds original video | `[ ]` |
| Q6.21 | Deployed YouTube no-recipe recovery | Import stable no-recipe video | Designed recovery state appears; no recipe is saved | `[ ]` |
| Q6.22 | Deployed Browserbase fallback | Import stable public blocked/JS-heavy recipe page | Recipe saves through fallback or account/quota blocker is documented | `[ ]` |
| Q6.23 | Screenshots | Capture recipe detail with embed on desktop and mobile | Screenshots saved if UI changed | `[ ]` |

---

## Bugs Found

None yet.

---

## Recommendation

QA begins after `[DEV-LEAD]` provides stable demo videos, one public
Browserbase fallback sample, and `[DEV:backend]` confirms local and Postgres
schemas are in sync.
