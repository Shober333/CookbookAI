# Pitch Demo Deck Review

> **Owner:** [SLIDES]  
> **Deck:** `cookbookai-pitch-demo.pptx`  
> **Date:** 2026-05-06

---

## Good

- The deck is product-specific: import, YouTube source handling, recipe
  library, equipment profile, adapted steps, provider boundary, and Sprint 7
  roadmap all come from project docs or screenshots.
- Actual product screenshots anchor the deck. It does not rely on generic AI
  visuals or invented brand marks.
- Claims are pitch-safe: the deck avoids fabricated revenue, retention,
  cost-reduction, or usage metrics.
- The contact sheet has varied rhythm across cover, problem map, product loop,
  screenshot sequence, source tree, adaptation proof, architecture boundary,
  operating posture, roadmap, and close.

## Bad

- Screenshots are desktop QA fixtures with test recipe names. Good enough for
  an internal pitch/demo, but not a polished public pitch.
- The deck uses PPTX as the delivered artifact. LaTeX/Beamer can be produced
  later if the presentation needs printable academic/technical polish.
- Some slide text is intentionally sparse; the presenter should use
  `speaker_notes.md` rather than reading from the slide.

## Ugly

None blocking.

## Verification

- Exported `cookbookai-pitch-demo.pptx` with 10 slides.
- Rendered all slides to PNG via artifact-tool.
- Reviewed the rendered contact sheet visually.
- Ran layout QA: 0 errors remained. Warnings were accepted after visual
  inspection because they were tight single-line labels or known false
  positives on rendered text boxes.
