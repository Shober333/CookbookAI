# Product Requirements Document (PRD)

> **Status:** Draft — Sprint 2
> **Owner:** [CTO] — updated 2026-05-01

---

## 1. Overview

**Project Name:** CookbookAI

**One-line description:** A web app that imports recipes from the internet and adapts them to your kitchen with AI.

**Problem:** Home cooks discover recipes across dozens of websites and videos. Saving them is messy (bookmarks, screenshots, copy-paste), and adapting them — to the portions you need, the equipment you own, or the ingredients you have — requires manual effort or re-searching. CookbookAI collapses that friction: one click to import, one prompt to adapt.

**Target Users:** Home cooks who regularly browse recipes online and want a personal, AI-assisted recipe library.

---

## 2. Core Features

| # | Feature | Description | Priority |
|---|---------|-------------|----------|
| 1 | Recipe import | Paste a URL (webpage or YouTube video); AI extracts and structures the full recipe | Must Have |
| 2 | Recipe library | Browse, search, and organize saved recipes; each user has their own private library | Must Have |
| 3 | Serving scaler | Rescale ingredient quantities for any number of servings | Must Have |
| 4 | Unit conversion | Toggle between metric and imperial throughout a recipe | Must Have |
| 5 | Equipment adapter | User specifies available appliances; AI rewrites the cooking method accordingly | Must Have |
| 6 | Recipe tagging / search | Tag recipes by cuisine, dietary label, or equipment; full-text search | Nice to Have |
| 7 | Ingredient substitution | Ask AI to swap an ingredient (e.g., "replace butter with olive oil") | Nice to Have |

---

## 3. User Stories

### Story 1: Recipe Import
> As a home cook, I want to paste a URL (or YouTube link) and have the recipe extracted automatically, so that I don't have to copy it by hand.

**Acceptance Criteria:**
- [ ] User pastes a URL; the app fetches the page content and sends it to the configured AI provider
- [ ] AI returns a structured recipe: title, description, servings, ingredients (with amounts + units), steps
- [ ] Extracted recipe is saved and the user is taken to the recipe detail page
- [ ] Unsupported or unparseable URLs show a clear error message

### Story 2: Recipe Library
> As a home cook, I want a personal library of my saved recipes, so that I can find and revisit them easily.

**Acceptance Criteria:**
- [ ] Authenticated users see only their own recipes
- [ ] Library displays recipe cards (title, source URL, creation date)
- [ ] User can open, edit the title/notes on, or delete a saved recipe
- [ ] Search bar filters recipes by title

### Story 3: Serving Scaler
> As a home cook, I want to change the serving count on any recipe and have all ingredient amounts update automatically.

**Acceptance Criteria:**
- [ ] Recipes store a canonical serving count and per-ingredient quantities
- [ ] User can set a target serving count; all quantities rescale proportionally
- [ ] Fractional amounts are rendered sensibly (e.g., "1/3 cup" not "0.333 cup")
- [ ] Scaling is non-destructive (original amounts are preserved in storage)

### Story 4: Equipment Adapter
> As a home cook, I want to tell the app what appliances I have and get the recipe steps rewritten for my equipment.

**Acceptance Criteria:**
- [ ] User can specify available appliances (air fryer, microwave, slow cooker, oven, stovetop, grill, etc.)
- [ ] Clicking "Adapt for my kitchen" sends the recipe + equipment profile to the configured AI provider
- [ ] AI returns a rewritten steps section; original steps are preserved for comparison
- [ ] User can save the adapted version or discard it

### Story 5: User Account
> As a user, I want to sign up and log in so that my recipe library is private and persists across sessions.

**Acceptance Criteria:**
- [ ] Email + password registration and login
- [ ] Passwords hashed; no plaintext storage
- [ ] Session persists across page refreshes
- [ ] User can log out

---

## 4. Out of Scope (MVP)

- Social features: sharing recipes, following other users, public library
- Meal planning, weekly schedules, or shopping list generation
- Nutritional analysis or calorie tracking
- Native mobile app (iOS/Android)
- Custom recipe creation from scratch (non-import)
- Offline mode
- Paid tiers or subscription management
- Recipe versioning / history

---

## 5. Success Criteria

- [ ] A user can register, import a recipe from a real URL, and see a structured result
- [ ] Sprint 1 local Ollama imports complete within the configured 120s timeout; later production target is under 30 seconds
- [ ] Serving scaler correctly rescales all numeric ingredient quantities
- [ ] Equipment adaptation produces a coherent, usable rewrite of the cooking steps
- [ ] All user data is isolated per account (no cross-user data leakage)
- [ ] App deploys to Vercel and runs without a dedicated always-on backend server

---

## 6. Technical Constraints

- **Must support:** local Ollama models for Sprint 1 recipe extraction and adaptation validation
- **Should keep configurable:** Anthropic/Claude provider support for later cloud and production validation
- **Must run in:** browser (web app)
- **Must support:** multi-user with authentication and persistent data storage
- **Must deploy to:** Vercel (free / Hobby tier — hundreds of users at scale target)
- **Must not use:** paid third-party services for the Sprint 1 local validation path
- **Should support:** local development without cloud dependencies
