# `[UI/UX]` → `[CTO]` — U1 Handoff Note

> **From:** `[UI/UX]`
> **To:** `[CTO]`
> **Date:** 2026-05-02
> **Subject:** U1 locked; backend contract additions for B5 + B3 + B2

U1 is locked. The canonical Sprint 03 design contract is at
`docs/sprints/sprint_03/sprint_03_design_brief.md`.

This note flags items the dev_todo doesn't currently spell out, so they
don't get lost when you sequence the backend work and write the
acceptance criteria for `[DEV:backend]`.

---

## 1. New backend contract requirement (B5) — YouTube candidate domain

**What's new:** Founder approved (2026-05-02) showing the candidate
recipe domain in the streaming box at phase 2 of the YouTube-link
path:

> *"Following the link in the description… (nytimes.com)"*

**What B5 needs to surface:** the resolved candidate URL's domain at
or before phase 2. Two acceptable shapes:

- **Streaming option:** emit a phase token at the boundary point that
  carries `{ phase: "youtube-link-following", domain: "nytimes.com" }`
- **Response-only option:** include the resolved candidate URL/domain
  in the final `ImportResponse` (e.g., a `sourceDomain` or
  `sourceUrl` field) — the UI will retroactively display the hint as
  it folds the YouTube phases into the line list

If the candidate domain is genuinely unavailable when phase 2 renders,
the UI drops the hint and shows the bare phase copy. The backend
should **never fabricate** a domain.

**Rule for the domain string:** strip `www.` and any path; bare host
only.

**Files affected:** `src/lib/youtube-import.ts`, `src/app/api/ai/import/route.ts`.

---

## 2. Response contract formalization (B3 + B5)

The dev_todo defines `reused: true` (B3) and `sourceKind` values
(F2/B5) but doesn't pin the response shape. The UI brief §6 formalizes
it as:

```ts
type ImportResponse = {
  recipe: Recipe              // existing
  reused?: boolean            // B3 — true if dedupe short-circuited the AI call
  sourceKind?:
    | "url"
    | "text"
    | "youtube-link"
    | "youtube-description"
}
```

Defaults when fields are absent: `reused = false`; `sourceKind` falls
back to the user-chosen mode.

If the backend wants different field names, that's fine — file a
contract change to `[UI/UX]` and we'll keep the brief in sync. The
shape above is what F2 reads.

---

## 3. Text-mode payload (B1 + B2)

For F1 the frontend sends:

```ts
// link mode
{ mode: "url", url: string }

// text mode
{ mode: "text", text: string }
```

The `mode` field is **new** — current B1 task copy describes the
service-level shape `{ kind: "url" | "text", ... }` but the dev_todo
doesn't explicitly state the request-body field name. UI sends `mode`
to match the user-facing concept. If backend prefers `kind`, either
the backend can map at the route boundary or we align on `mode` —
backend's call. Just needs one decision before F1 starts.

---

## 4. Three Founder decisions logged

For your decision log / DECISIONS.md if you keep one for sprint
artifacts:

| # | Decision | Locked |
|---|---|---|
| Q1 | No source-URL field in text-mode UI for v1 (backend keeps it available) | 2026-05-02 |
| Q2 | Mode switch is stateless across visits — `link` always default | 2026-05-02 |
| Q3 | Show YouTube candidate domain at phase 2 in italic muted ink | 2026-05-02 |

---

## 5. What I think is unblocked / blocked

- **Unblocked on design:** F1, F2 — frontend can start building against
  the brief. They still wait on backend route contracts per your team
  coordination note.
- **Unblocked on design:** B1, B2, B3, B4, B5 — design has nothing
  more to add for backend. The brief §6 contract is the only UI-facing
  requirement.
- **Blocked on you:** confirming the request-body field name (`mode`
  vs `kind`) before F1 ships, and aligning B5 on how it surfaces the
  YouTube candidate domain.

---

## 6. Open to you

Nothing pending from `[UI/UX]`. Ping me if a backend constraint forces
a contract change — I'll update the brief same-day rather than let it
drift.

— `[UI/UX]`
