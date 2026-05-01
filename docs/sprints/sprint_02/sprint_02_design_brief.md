# Sprint 2 — Design Brief (DEPRECATED)

> **Status:** DEPRECATED 2026-05-01. This file has been superseded.
> **Owner:** [UI/UX] (Alice)

---

## Where to find the canonical Sprint 2 design contract

This file used to contain the Sprint 2 design brief. On 2026-05-01,
Alice discovered a parallel `SPRINT_02_SPECS.md` had been written at
`docs/ui/SPRINT_02_SPECS.md`, and the two files disagreed on real
points — the appliance list, the user-facing nav label, the AdaptPanel
result-state structure, and several smaller things.

The two files were merged with Founder approval on 2026-05-01. The
canonical Sprint 2 design contract now lives at:

**👉 `docs/ui/SPRINT_02_SPECS.md`**

Read that file for everything related to Sprint 2 frontend tasks F1–F4:

- §1 — `/equipment` (Kitchen) settings page
- §2 — Inline AdaptPanel on recipe detail
- §3 — Library search input
- §4 — Recipe download as Markdown
- §5 — Import progress copy revision
- §6 — Founder Decisions Log (all decisions locked 2026-05-01)
- §7 — Open questions (none currently)
- §8 — Sprint 0 spec updates required

---

## Why this file still exists

It's kept on disk as a paper trail. The Sprint 2 dev TODO and the
Sprint 1 → 2 reviews may reference this path. Rather than break those
links, this stub redirects forward.

If you arrived here, go to `docs/ui/SPRINT_02_SPECS.md` instead.

The merge consolidated:

- Appliance list aligned to backend Zod schema (8 keys: `oven`,
  `stovetop`, `microwave`, `air_fryer`, `slow_cooker`, `grill`,
  `instant_pot`, `blender`) — corrects an earlier list that had Wok
  and Sous vide
- "Kitchen" as the user-facing nav label (route stays `/equipment`)
- AdaptPanel design with five states (Idle, Idle no-equipment,
  Loading, Result, Saved) — incorporating Founder decisions on
  re-adapt-without-confirmation, identical-result handling, and the
  `Adapted` library tag
- Markdown export rules: export only the version the user is currently
  viewing; `-adapted` filename suffix when applicable
- Topbar mobile collapse: Option 3 (search-button-only); sign-out stays
  in topbar at desktop for MVP

All seven Founder decisions from this file's now-removed
"Open Questions" section are recorded in §6 of `SPRINT_02_SPECS.md`.

---

## Authority

This file is owned by **[UI/UX] (Alice)**. Do not edit it; edit the
canonical file at `docs/ui/SPRINT_02_SPECS.md` instead.
