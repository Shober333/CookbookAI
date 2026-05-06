# CookbookAI Presentations

> **Owner:** [SLIDES]
> **Purpose:** Deck briefs, editable slide sources, screenshot plans,
> speaker notes, and deck reviews for CookbookAI demos and pitches.

---

## Standards

- Ground every claim in `docs/PRD.md`, `docs/ARCHITECTURE.md`,
  `docs/DECISIONS.md`, sprint reports, verified app behavior, or an
  explicit Founder decision.
- Echo the `docs/ui/REGISTER.md` design language:
  **Warm Domestic with editorial discipline**.
- Prefer product screenshots, diagrams, flows, and charts over text-heavy
  slides.
- Before building slides, read the screenshot plan and visually inspect
  the available screenshots under `tests/screenshots/`, this directory,
  or the relevant sprint folder.
- Use LaTeX/Beamer/TikZ when precise authored layout, technical diagrams,
  or print-quality source control matters.
- Keep deck sources editable and reproducible. Generated exports may live
  beside their sources when useful.

## Suggested Structure

```text
docs/presentations/
├── README.md
├── reviews/
├── demo_YYYY_MM_DD/
│   ├── brief.md
│   ├── deck.tex
│   ├── speaker_notes.md
│   └── screenshots.md
└── pitch_YYYY_MM_DD/
    ├── brief.md
    ├── deck.tex
    └── speaker_notes.md
```

Decks do not need to use this exact layout when the assignment calls for
something smaller, but they should preserve the same intent: audience,
story, source, visuals, and review trail are easy to find.
