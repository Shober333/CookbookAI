# Sprint 07 - Dev Tasks

> **Owner:** [DEV-LEAD]  
> **Sprint goal:** Recipe macro estimates, optional AI-direct video fallback,
> and Groq GPT-OSS provider support.
> **Status:** Planned by [CTO]; not started.

---

## Status Key

- `[ ]` Not started
- `[/]` In progress
- `[~]` Blocked or needs Founder/CTO input
- `[x]` Done
- `[-]` Deferred

---

## Phase 0 - Scope + Contracts

| # | Task | Owner | Status | Acceptance Criteria |
|---|------|--------|--------|---------------------|
| 7.1 | Confirm Sprint 07 scope | `[CTO]` + Founder | `[~]` | Founder confirms macros, Groq GPT-OSS provider, and AI-direct video fallback boundaries before implementation |
| 7.2 | Define nutrition estimate contract | `[DEV-LEAD]` + `[DEV:backend]` | `[ ]` | Contract covers per-recipe/per-serving macros, confidence, unmatched ingredients, source attribution, recalculation timestamp, and no-medical-advice boundary |
| 7.3 | UI/UX nutrition presentation handoff | `[UI/UX]` | `[ ]` | Nutrition panel anatomy, partial/error states, and copy are approved against `docs/ui/` |
| 7.4 | Define provider routing contract | `[DEV-LEAD]` + `[DEV:backend]` | `[ ]` | Text provider and video provider are separate; env names, defaults, fallback behavior, and user-safe errors are documented |

---

## Phase 1 - Data + Nutrition Service

| # | Task | Owner | Status | Acceptance Criteria |
|---|------|--------|--------|---------------------|
| 7.5 | Add nutrition storage | `[DEV:backend]` | `[ ]` | Local SQLite and Postgres schemas/migrations add nullable nutrition estimate storage without breaking old recipes |
| 7.6 | Add nutrition types/schema | `[DEV:backend]` | `[ ]` | Shared types parse/serialize nutrition estimates and reject malformed data at module boundaries |
| 7.7 | Add USDA FoodData Central client | `[DEV:backend]` | `[ ]` | Client searches foods and fetches details with `FOODDATA_CENTRAL_API_KEY`; missing key/rate limit/no-match are controlled errors |
| 7.8 | Implement ingredient-to-macro calculation | `[DEV:backend]` | `[ ]` | Service converts matched ingredient quantities to calories/protein/carbs/fat/fiber totals with per-ingredient confidence and unmatched tracking |
| 7.9 | Add optional AI normalization assist | `[DEV:backend]` | `[ ]` | AI may normalize ingredient names/gram estimates only when deterministic parsing cannot; output is schema-validated and never treated as exact nutrition authority |
| 7.10 | Add nutrition calculation endpoint | `[DEV:backend]` | `[ ]` | Authenticated owner can calculate/recalculate macros for a recipe; response includes estimate, warnings, and updated recipe payload |

---

## Phase 2 - Groq GPT-OSS Provider

| # | Task | Owner | Status | Acceptance Criteria |
|---|------|--------|--------|---------------------|
| 7.11 | Add Groq env contract | `[DEV:backend]` | `[ ]` | `.env.example` and architecture docs include `AI_PROVIDER=groq`, `GROQ_API_KEY`, `GROQ_MODEL=openai/gpt-oss-120b`, timeout, and cost note |
| 7.12 | Implement Groq text generation branch | `[DEV:backend]` | `[ ]` | `generateRecipeObject` supports Groq Chat Completions with strict JSON schema mode and robust error messages |
| 7.13 | Make recipe schema strict-compatible | `[DEV:backend]` | `[ ]` | JSON schemas used with Groq strict mode have all properties required, nested `additionalProperties: false`, and nullable fields represented safely |
| 7.14 | Provider smoke tests | `[DEV:backend]` + `[DEV-QA]` | `[ ]` | Mocked tests cover Groq success, missing key, 401/403, non-JSON, schema refusal, and timeout; live smoke runs if key is available |
| 7.15 | Keep 20B as experiment only | `[DEV-LEAD]` | `[ ]` | Docs state `openai/gpt-oss-20b` is not default until it passes the project recipe sample set |

---

## Phase 3 - Optional AI-Direct Video Fallback

| # | Task | Owner | Status | Acceptance Criteria |
|---|------|--------|--------|---------------------|
| 7.16 | Add video fallback env contract | `[DEV:backend]` | `[ ]` | Env docs include `AI_VIDEO_TRANSCRIPTION_ENABLED=false`, `AI_VIDEO_PROVIDER=gemini`, video model setting, timeout, and cost/quota warning |
| 7.17 | Implement Gemini YouTube video extraction adapter | `[DEV:backend]` | `[ ]` | Adapter sends YouTube URL to Gemini only when enabled and asks for recipe-relevant transcript/content in structured form |
| 7.18 | Wire fallback after current YouTube paths | `[DEV:backend]` | `[ ]` | Order remains link -> description text -> public transcript -> AI-direct video fallback -> controlled no-recipe error |
| 7.19 | Persist source metadata | `[DEV:backend]` | `[ ]` | Direct video fallback saves a new source kind or metadata value that distinguishes AI-direct video extraction from public transcript |
| 7.20 | Add video fallback safeguards | `[DEV:backend]` | `[ ]` | Unsupported provider, disabled flag, invalid URL, provider quota, no recipe, and unsafe/private content all return controlled user-safe errors |

---

## Phase 4 - Frontend

| # | Task | Owner | Status | Acceptance Criteria |
|---|------|--------|--------|---------------------|
| 7.21 | Add nutrition panel to recipe detail | `[DEV:frontend]` | `[ ]` | Shows per-serving and full-recipe macros if present; does not disrupt ingredients, steps, source embed, scaler, or adaptation controls |
| 7.22 | Add calculate/recalculate control | `[DEV:frontend]` | `[ ]` | Owner can request macro calculation; loading, partial, error, and success states follow `[UI/UX]` handoff |
| 7.23 | Add unmatched/estimate disclosure | `[DEV:frontend]` | `[ ]` | UI clearly communicates estimates and partial matches without medical claims or alarmist copy |
| 7.24 | Add optional video fallback import state | `[DEV:frontend]` | `[ ]` | Import UI can communicate when AI-direct video fallback is running or unavailable; no user-facing provider internals leak unnecessarily |
| 7.25 | Mobile/a11y pass | `[DEV:frontend]` | `[ ]` | Nutrition panel and controls fit at 375px, preserve keyboard focus, and meet 44px tap target floor |

---

## Phase 5 - Reports + Closeout

| # | Task | Owner | Status | Acceptance Criteria |
|---|------|--------|--------|---------------------|
| 7.26 | Dev report | `[DEV-LEAD]` | `[ ]` | `docs/sprints/sprint_07/reports/sprint_07_report.md` summarizes implementation, tests, live-provider evidence, deferrals, and blockers |
| 7.27 | QA report | `[DEV-QA]` | `[ ]` | `docs/sprints/sprint_07/reports/qa_report.md` includes nutrition, Groq, video fallback, mobile, and deployed smoke evidence |
| 7.28 | CTO review | `[CTO]` | `[ ]` | Good/Bad/Ugly review completed before Founder demo |

---

## Explicit Deferrals

- Full nutrition labels and micronutrients.
- Health/diet recommendations.
- User-facing provider switching.
- Groq audio transcription through Whisper.
- Downloading or extracting YouTube audio server-side.
- Making Groq GPT-OSS the default production provider before QA proves quality.
