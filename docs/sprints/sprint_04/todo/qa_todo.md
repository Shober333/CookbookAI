# Sprint 04 — QA Scenarios

> **Owner:** [DEV-QA]
> **Run date:** TBD · **Status:** Not started.

---

## Status Key

- `[ ]` Not run
- `[/]` Running
- `[x]` Passed
- `[!]` Failed
- `[-]` Deferred

---

## Environment

| # | Scenario | Steps | Expected | Status |
|---|----------|-------|----------|--------|
| Q4.1 | Clean setup | Start from current `main` or Sprint 04 branch, create `.env`, run database migration | App starts without missing-secret or missing-database blockers | `[ ]` |
| Q4.2 | Missing live keys | Run import routes without optional provider keys | App returns stable user-facing errors; startup still works | `[ ]` |

---

## Import Regression

| # | Scenario | Steps | Expected | Status |
|---|----------|-------|----------|--------|
| Q4.3 | URL import | Import a normal recipe URL through `/import` | Recipe saves and appears in library | `[ ]` |
| Q4.4 | Text import | Paste recipe-like text into text mode | Recipe saves and appears in library | `[ ]` |
| Q4.5 | Duplicate URL reuse | Import a URL already present in extracted-data cache | AI extraction is skipped and quiet reuse feedback appears | `[ ]` |
| Q4.6 | Non-recipe URL/text | Submit non-recipe content | No recipe is saved; targeted recovery action appears | `[ ]` |

---

## YouTube Live Validation

| # | Scenario | Steps | Expected | Status |
|---|----------|-------|----------|--------|
| Q4.7 | Real YouTube recipe link | With `YOUTUBE_API_KEY`, import a video description containing a recipe URL | Import follows the candidate recipe URL and records `youtube-link` metadata | `[ ]` |
| Q4.8 | Real YouTube recipe description | With `YOUTUBE_API_KEY`, import a video whose description contains recipe-like text | Import extracts from description text and records `youtube-description` metadata | `[ ]` |
| Q4.9 | YouTube no recipe | Import a video without recipe text or candidate recipe URL | User sees "No recipe in this video" recovery state | `[ ]` |
| Q4.10 | Invalid/missing YouTube key | Use missing or invalid key | App returns a clear typed error and no recipe is saved | `[ ]` |

---

## Optional Transcript Fallback

| # | Scenario | Expected | Status |
|---|----------|----------|--------|
| Q4.11 | Transcript available | If approved and implemented, transcript is used only after description-first fails | `[-]` |
| Q4.12 | Transcript unavailable | If approved and implemented, unavailable transcript produces stable fallback/no-recipe state | `[-]` |

---

## Demo Hardening

| # | Scenario | Steps | Expected | Status |
|---|----------|-------|----------|--------|
| Q4.13 | Desktop demo pass | Visit login, import, library, and recipe detail on desktop viewport | No layout overlap; screenshots captured if UI changed | `[ ]` |
| Q4.14 | Mobile smoke pass | Repeat core import/library flow at mobile viewport | Layout remains usable and readable | `[ ]` |
| Q4.15 | Test suite regression | Run typecheck, unit tests, build, and Playwright | All checks pass or failures are documented with owner | `[ ]` |
