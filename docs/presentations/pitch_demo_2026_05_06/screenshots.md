# Screenshot Review

> **Owner:** [SLIDES]  
> **Purpose:** Required visual evidence review before slide production.

---

## Screenshots Inspected

- `tests/screenshots/import-form.png`
- `tests/screenshots/import-preview.png`
- `tests/screenshots/library-populated.png`
- `tests/screenshots/recipe-detail.png`
- `tests/screenshots/recipe-adapted.png`
- `tests/screenshots/equipment-saved.png`
- `tests/screenshots/import-youtube-link.png`

## Used In Deck

- Cover: `recipe-detail.png`
- Product loop: `import-form.png`, `library-populated.png`,
  `recipe-detail.png`, `recipe-adapted.png`
- Demo sequence: `import-preview.png`, `library-populated.png`,
  `recipe-detail.png`
- Import resilience: `import-youtube-link.png`
- Personalization: `equipment-saved.png`, `recipe-adapted.png`
- Close: `recipe-detail.png`

## Findings

- The screenshots are strong enough to tell the pitch demo story:
  import, extraction state, library, recipe detail, YouTube import, equipment
  profile, and adapted recipe.
- The available screenshots are desktop test fixtures. The deck therefore
  avoids claiming mobile visual proof, even though mobile support is a product
  requirement in `docs/ui/REGISTER.md`.
- The screenshots include test data such as `QA Screenshot Pasta`; this is
  acceptable for a first internal pitch/demo deck, but a public-facing pitch
  should replace them with a more appetizing seeded recipe.

## Missing For A Public Pitch

- A polished mobile screenshot at 375px.
- A real imported recipe with food-specific source context.
- A screenshot showing YouTube source provenance on recipe detail after
  Sprint 6.
- A nutrition/macros screenshot after Sprint 7 ships.
