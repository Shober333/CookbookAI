# Speaker Notes

> **Deck:** `cookbookai-pitch-demo.pptx`

---

## 20-Minute Timeline

| Time | Slides | Focus |
|---:|---|---|
| 0:00-1:30 | 1 | Opening: what CookbookAI is and why the product is about cooking, not AI novelty. |
| 1:30-3:00 | 2 | Problem: scattered recipe discovery creates friction before dinner. |
| 3:00-5:00 | 3 | Product loop: bring it in, structure it, keep it, make it yours. |
| 5:00-8:00 | 4 | Demo spine: import, extraction state, library, clean recipe page. |
| 8:00-10:30 | 5 | Source resilience: YouTube link, description, transcript, and future video fallback. |
| 10:30-13:00 | 6 | Personalization: equipment profile and adapted recipe steps. |
| 13:00-15:00 | 7 | Trust boundary: source metadata, private recipes, original/adapted separation, provider routing. |
| 15:00-16:30 | 8 | Operating model: reuse, serverless posture, configurable providers. |
| 16:30-18:00 | 9 | Roadmap: macros, direct video fallback, Groq text provider. |
| 18:00-20:00 | 10 | Pitch ask and close: validate with real recipe URLs, YouTube videos, and pasted recipes. |

**Pacing rule:** if the live demo runs long, compress slides 7-9 into a
single trust/roadmap summary and preserve the full two-minute close.

## 1. CookbookAI brings recipes home.

Open with the product in one sentence: CookbookAI imports recipes from
the internet and adapts them to the kitchen a user actually has. Keep the
emphasis on cooking, not AI novelty.

## 2. Home cooks discover everywhere, but cook from nowhere.

Name the everyday pain: blogs, YouTube, screenshots, and pasted notes all
create friction before dinner. The problem is not recipe discovery; it is
turning discovery into something cookable.

## 3. One kitchen loop.

Walk left to right: bring it in, structure it, keep it, make it yours.
This is the core loop the rest of the pitch defends.

## 4. Three demo moments.

This is the demo spine. Paste a link, watch extraction resolve, then open
the clean recipe page in the library. Do not over-explain implementation
yet.

## 5. YouTube as a source tree.

Explain that YouTube is not treated as a single brittle path. The app can
look for recipe links, description text, then public transcript fallback.
Sprint 7 plans direct video fallback only after those fail and only behind
explicit configuration.

## 6. Adaptation starts from the real kitchen.

This is the emotional product wedge. A recipe is only useful if it fits
the equipment a person owns. The app preserves the original method and
shows adapted steps as a version the cook can accept or discard.

## 7. The AI boundary is constrained.

Make the trust argument. CookbookAI does not ask users to trust a black
box. It preserves sources, separates original and adapted content, keeps
recipes private, and routes providers behind a controlled boundary.

## 8. Operating model.

Avoid invented numbers. The point is architectural posture: URL reuse can
avoid repeated AI calls, serverless hosting avoids always-on operations,
and providers remain configurable.

## 9. Roadmap.

Frame Sprint 7 as a quality expansion, not feature sprawl: USDA-backed
macro estimates, opt-in direct video fallback through Gemini, and Groq as
a text provider branch.

## 10. Pitch ask.

End with a concrete validation motion: bring real recipe URLs, YouTube
videos, and pasted recipes; run the import/adapt loop; then decide which
wedge is strongest for the next build/demo.
