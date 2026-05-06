# Sprint 07 - Nutrition, Direct Video Fallback, and Groq GPT-OSS

| Field | Value |
|-------|-------|
| **Sprint** | 07 |
| **Goal** | Add recipe macro estimates, add an optional AI-direct YouTube video fallback for caption-less videos, and introduce Groq GPT-OSS as a selectable text AI provider |
| **Status** | Founder confirmed 2026-05-06 — dev body active |
| **Start** | 2026-05-06 |
| **End** | TBD |

---

## Why This Sprint

Sprint 06 made source import more reliable. Sprint 07 should turn that
reliability into richer recipe output while tightening the AI provider boundary:
recipes should show useful macro estimates, YouTube videos without usable
description or public transcript should have one more opt-in recovery path, and
the app should be able to run text extraction/adaptation through Groq GPT-OSS.

There is one important split: Groq GPT-OSS is a text model, not a video/audio
model. Direct video fallback therefore belongs behind a separate
video-capable provider setting. The recommended Sprint 07 path is:

- Text recipe extraction/adaptation/macros: add `AI_PROVIDER=groq` with
  `GROQ_MODEL=openai/gpt-oss-120b`.
- AI-direct YouTube video fallback: keep this behind
  `AI_VIDEO_TRANSCRIPTION_ENABLED=true` and `AI_VIDEO_PROVIDER=gemini`.
- Nutrition source of truth: use USDA FoodData Central data where possible;
  use AI only for ingredient cleanup/matching assistance, not as the final
  nutrition authority.

---

## Scope

1. **Macros estimate for recipes** - calculate per-recipe and per-serving
   calories, protein, carbohydrates, and fat; include fiber if available.
2. **Nutrition data boundary** - add USDA FoodData Central lookup/matching with
   explicit uncertainty, unmatched ingredients, and source attribution.
3. **AI ingredient normalization for nutrition** - use the configured text AI
   provider to help convert recipe ingredients into lookup-friendly food names
   and gram estimates only when deterministic parsing is insufficient.
4. **Recipe detail nutrition UI** - show macro estimates in a compact,
   non-medical presentation with loading, error, and partial-match states.
5. **Optional AI-direct video fallback** - after YouTube link, description, and
   public transcript paths fail, optionally ask a video-capable model to extract
   recipe-relevant transcript/content directly from the YouTube URL.
6. **Groq GPT-OSS provider** - add a Groq provider branch for text structured
   outputs and provider smoke tests.
7. **Provider documentation** - update env docs and deployment notes so Gemini,
   Groq, Ollama, and Anthropic responsibilities are explicit.

---

## Not In Scope Unless Promoted

- Medical, diet, allergy, weight-loss, or health recommendations.
- Micronutrient-complete nutrition labels.
- Barcode/package scanning.
- User-facing provider switching for normal users.
- Downloading YouTube media or bypassing YouTube platform restrictions.
- Using Groq GPT-OSS for direct video transcription.
- Replacing Gemini as the video-capable provider before a working alternative
  is proven.

---

## Founder Decisions Needed Before Dev Starts

| Decision | CTO recommendation |
|----------|--------------------|
| Nutrition authority | Use USDA FoodData Central as the source of truth; display estimates with uncertainty |
| Macro storage | Persist nullable nutrition estimate JSON on `Recipe` in both SQLite and Postgres schemas |
| Groq text model | Use `openai/gpt-oss-120b` for Sprint 07 because it supports strict structured outputs, long context, and better quality headroom than 20B |
| Direct video fallback provider | Use Gemini only for Sprint 07 video fallback; Groq GPT-OSS remains text-only |
| User-facing provider toggle | Do not expose provider choice to end users; keep provider selection in env/admin configuration |

---

## External References Checked

- OpenAI gpt-oss announcement: gpt-oss-120b and 20b are open-weight reasoning
  models under Apache 2.0, with 120b positioned as the stronger model and 20b
  as the lower-resource/local option:
  https://openai.com/index/introducing-gpt-oss/
- OpenAI model docs: `gpt-oss-120b` supports text input/output and structured
  outputs, but image, audio, and video are not supported:
  https://developers.openai.com/api/docs/models/gpt-oss-120b
- Groq GPT-OSS 120B docs: `openai/gpt-oss-120b` has 131,072 context tokens and
  current Groq pricing of $0.15/M input and $0.60/M output:
  https://console.groq.com/docs/model/openai/gpt-oss-120b
- Groq structured output docs: strict JSON schema mode currently supports
  `openai/gpt-oss-20b` and `openai/gpt-oss-120b`:
  https://console.groq.com/docs/structured-outputs
- Gemini video understanding docs: Gemini can process videos, including YouTube
  URLs, and all Gemini models can process video data:
  https://ai.google.dev/gemini-api/docs/video-understanding
- USDA FoodData Central API guide: FDC provides REST food search/details
  endpoints and requires a data.gov API key:
  https://fdc.nal.usda.gov/api-guide/

---

## Exit Criteria

- [ ] Founder confirms Sprint 07 scope and schema/provider decisions.
- [ ] PRD and architecture reflect macros, video fallback, and Groq provider
      boundaries.
- [ ] Both Prisma schemas/migrations include the agreed nutrition storage shape.
- [ ] Existing recipe imports continue to work with no nutrition estimate.
- [ ] Macro estimates can be generated for a saved recipe and rendered per
      recipe and per serving.
- [ ] Partial nutrition matches show controlled, user-safe UI with unmatched
      ingredients listed or summarized.
- [ ] USDA API missing key, rate limit, and no-match cases are handled without
      crashing and without fabricating exact nutrition.
- [ ] `AI_PROVIDER=groq` can extract/adapt recipes with strict structured
      output and tested error handling.
- [ ] Groq 120B is the default Groq model; 20B remains an optional experiment
      only after quality evaluation.
- [ ] AI-direct YouTube fallback runs only when explicitly enabled and only via
      a video-capable provider.
- [ ] Direct video fallback saves source metadata distinct from public
      transcript import.
- [ ] Typecheck, unit tests, production build, E2E regression, and screenshots
      for UI changes pass or blockers are documented.
- [ ] QA report and CTO Good/Bad/Ugly review are completed.

---

## Artifacts

- Team note: `team.md`
- Dev tasks: `todo/dev_todo.md`
- QA scenarios: `todo/qa_todo.md`
- Sprint report: `reports/sprint_07_report.md`
- QA report: `reports/qa_report.md`
- CTO review: `reviews/cto_sprint7_review.md`
