# Sprint 07 - QA Scenarios

> **Owner:** [DEV-QA]  
> **Run date:** 2026-05-06  
> **Status:** Local regression and nutrition UI QA pass; live-provider/deployed smoke deferred.

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
| Q7.1 | Typecheck | Run `npm run typecheck` | Clean | `[x]` |
| Q7.2 | Unit tests | Run `npm test` | All tests pass | `[x]` |
| Q7.3 | Local production build | Run `npm run build` | Build succeeds | `[x]` |
| Q7.4 | Vercel-style build | Run documented `npm run build:vercel` path with safe/stub Postgres URL | Build path succeeds or blocker is documented | `[x]` |
| Q7.5 | E2E regression | Run `npx playwright test --project=chromium` | Existing auth/import/library/recipe flows pass | `[x]` |

---

## Nutrition / Macros

| # | Scenario | Steps | Expected | Status |
|---|----------|-------|----------|--------|
| Q7.6 | Existing recipe without nutrition | Open an old recipe | Recipe renders normally with no broken nutrition panel | `[x]` |
| Q7.7 | Simple macro calculation | Calculate macros for a recipe with common ingredients and clear units | Per-serving and full-recipe calories/protein/carbs/fat render with source/estimate disclosure | `[x]` |
| Q7.8 | Partial match | Calculate macros for recipe with one ambiguous ingredient | UI shows partial estimate and unmatched/uncertain ingredient handling | `[x]` |
| Q7.9 | No USDA key | Run macro calculation without `FOODDATA_CENTRAL_API_KEY` | Controlled configuration error; no crash and no fabricated exact values | `[x]` |
| Q7.10 | USDA no-match | Use rare or malformed ingredient names | No-match result is controlled and visible as estimate/needs review | `[x]` |
| Q7.11 | Recalculate after serving/ingredient data | Recalculate a saved recipe | Stored nutrition estimate updates timestamp and still uses canonical recipe servings | `[-]` |

---

## Groq GPT-OSS Provider

| # | Scenario | Steps | Expected | Status |
|---|----------|-------|----------|--------|
| Q7.12 | Groq missing key | Set `AI_PROVIDER=groq` without `GROQ_API_KEY` | User-safe provider configuration error appears | `[x]` |
| Q7.13 | Groq mocked structured success | Run provider unit tests | Strict JSON schema response parses into recipe/adaptation/nutrition contracts | `[x]` |
| Q7.14 | Groq provider errors | Mock 401, 403, 429, 5xx, timeout, and malformed response | Each maps to controlled errors and does not save bad recipes | `[x]` |
| Q7.15 | Groq live smoke | If key is available, import one stable URL and adapt one recipe | Recipe saves and adaptation works with `openai/gpt-oss-120b`; evidence captured in QA report | `[-]` |
| Q7.16 | Provider regression | Run same stable sample on Gemini or current default provider | Existing provider behavior remains intact | `[x]` |

---

## AI-Direct YouTube Video Fallback

| # | Scenario | Steps | Expected | Status |
|---|----------|-------|----------|--------|
| Q7.17 | Fallback disabled | Import video with no link/description/public transcript while fallback disabled | Existing designed no-recipe recovery appears | `[x]` |
| Q7.18 | Gemini missing key | Enable video fallback without required Gemini key | Controlled configuration error; no recipe saved | `[x]` |
| Q7.19 | Direct video success | Import stable YouTube video where description/transcript path is unavailable but Gemini can extract recipe content | Recipe saves with direct-video source metadata and original video embed | `[-]` |
| Q7.20 | No recipe in video | Import stable non-recipe YouTube video with fallback enabled | No-recipe recovery appears; no hallucinated recipe saved | `[x]` |
| Q7.21 | Groq text provider with Gemini video provider | Set `AI_PROVIDER=groq` and `AI_VIDEO_PROVIDER=gemini` | Text extraction uses Groq where applicable; video fallback uses Gemini only | `[-]` |

---

## UI / Accessibility

| # | Scenario | Steps | Expected | Status |
|---|----------|-------|----------|--------|
| Q7.22 | Nutrition panel desktop | Open recipe detail with macro estimate | Panel is scannable, compact, and does not overlap source video/ingredients/steps | `[x]` |
| Q7.23 | Nutrition panel mobile | Open same recipe at 375px | Text fits, controls are reachable, tap targets meet 44px floor | `[x]` |
| Q7.24 | Keyboard flow | Tab through recipe detail including nutrition controls | Focus order is coherent and visible | `[-]` |
| Q7.25 | Reduced motion | Verify loading/progress states with reduced motion preference | No motion-dependent information; reduced-motion respected | `[-]` |
| Q7.26 | Screenshots | Capture desktop and 375px mobile nutrition states | Screenshots saved in `tests/screenshots/` for UI change evidence | `[x]` |

---

## Deployed Smoke

| # | Scenario | Steps | Expected | Status |
|---|----------|-------|----------|--------|
| Q7.27 | Deployed auth/library baseline | Register/login on Vercel and open library | Auth and library still work | `[-]` |
| Q7.28 | Deployed macro calculation | Calculate macros for one stable saved recipe | Macro estimate saves and renders | `[-]` |
| Q7.29 | Deployed Groq smoke | If Groq key is configured, run one stable text/URL import | Recipe saves through Groq or blocker is documented | `[-]` |
| Q7.30 | Deployed video fallback smoke | If Gemini video fallback is configured, run stable direct-video sample | Recipe saves or no-recipe recovery appears as expected | `[-]` |

---

## Required Bug Report Format

```
**Bug:** [short description]
**Steps to Reproduce:**
1. ...
2. ...
**Expected:** [what should happen]
**Actual:** [what actually happens]
**Severity:** Critical / High / Medium / Low
**Repro environment:** [browser, viewport, dev command run]
```
