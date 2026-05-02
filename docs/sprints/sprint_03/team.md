# Sprint 03 — Active Team

**Activated by:** [CTO] — 2026-05-02, after Founder approval

---

| Role | Tag | Agent Files | Owns |
|------|-----|-------------|------|
| Dev Lead | `[DEV-LEAD]` | `.claude/agents/dev-lead.md`, `.codex/roles/dev-lead.md` | Sprint coordination; dev report; cross-dev sequencing |
| UI/UX | `[UI/UX]` | `.claude/agents/uiux.md`, `.codex/roles/uiux.md` | Import-form mode design; copy; state review; visual gate |
| Backend Dev | `[DEV:backend]` | `.claude/agents/dev-backend.md`, `.codex/roles/dev-backend.md` | Import service refactor, text extraction path, URL dedupe, YouTube metadata/description pipeline |
| Frontend Dev | `[DEV:frontend]` | `.claude/agents/dev-frontend.md`, `.codex/roles/dev-frontend.md` | Import UI modes, user feedback, route integration, screenshots |
| QA | `[DEV-QA]` | `.claude/agents/qa.md`, `.codex/roles/qa.md` | E2E coverage, mocked YouTube flows, screenshot evidence, regression verification |

---

## Coordination Notes

- `[UI/UX]` specs the import-form mode switch and states before `[DEV:frontend]` implements F1/F2.
- `[DEV:backend]` completes the import service refactor before text/paste and YouTube flows are wired to the UI.
- `[DEV-QA]` mocks AI and YouTube network calls in E2E; one manual live-key YouTube check is allowed but not required for CI.
- Dev Lead should keep backend and frontend work split by phase to avoid UI work depending on unstable route contracts.
