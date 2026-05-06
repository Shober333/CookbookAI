# Product Requirements Document (PRD)

> **Status:** Draft — Sprint 7 planning
> **Owner:** [CTO] — updated 2026-05-06

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
| 1 | Recipe import — URL | Paste a URL; AI fetches the page and extracts the full recipe | Must Have |
| 2 | Recipe import — text/paste | Paste raw recipe text or HTML directly (fallback for bot-blocked sites) | Must Have |
| 3 | Recipe library | Browse, search, and organize saved recipes; each user has their own private library | Must Have |
| 4 | Serving scaler | Rescale ingredient quantities for any number of servings | Must Have |
| 5 | Unit conversion | Toggle between metric and imperial throughout a recipe | Must Have |
| 6 | Equipment adapter | User specifies available appliances; AI rewrites the cooking method accordingly | Must Have |
| 7 | Recipe export | Download a recipe as a Markdown file | Nice to Have |
| 8 | Video import (YouTube) | Paste a YouTube URL; app checks the description for a linked blog URL (imports it directly) or a written-out recipe (extracts from description text). Falls back to transcript via YouTube Data API if description has neither. Gemini direct for caption-less videos (Sprint 4+) | Nice to Have |
| 9 | Guest mode | Try the app without creating an account; recipes are DB-persistent and tied to a cookie-based guest session. URL deduplication: if any user already imported a given URL, the extracted recipe is reused (no repeat AI call) | Nice to Have |
| 10 | Recipe tagging / search | Tag recipes by cuisine, dietary label, or equipment; full-text search | Nice to Have |
| 11 | Ingredient substitution | Ask AI to swap an ingredient (e.g., "replace butter with olive oil") | Nice to Have |
| 12 | Recipe macro estimates | Calculate estimated calories, protein, carbohydrates, and fat per recipe and per serving using USDA nutrition data where possible | Nice to Have |
| 13 | AI-direct video fallback | For YouTube imports where description, recipe links, and public transcript all fail, optionally ask a video-capable AI provider to extract recipe-relevant content directly from the video URL | Nice to Have |
| 14 | Configurable Groq provider | Allow the text AI provider to be configured as Groq running OpenAI GPT-OSS, with `openai/gpt-oss-120b` as the recommended Sprint 7 model | Nice to Have |

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

### Story 6: Recipe Macro Estimates
> As a home cook, I want a quick estimate of a recipe's macros, so that I can understand roughly how rich or light a recipe is before I cook it.

**Acceptance Criteria:**
- [ ] User can calculate or recalculate macro estimates for a saved recipe
- [ ] App shows calories, protein, carbohydrates, and fat per serving and per full recipe
- [ ] Estimates identify partial or uncertain ingredient matches instead of pretending to be exact
- [ ] Nutrition data is sourced from USDA FoodData Central where available; AI may help normalize ingredients but is not the source of truth for macro values
- [ ] UI avoids medical, diet, allergy, or weight-loss advice

### Story 7: AI-Direct Video Fallback
> As a home cook importing from YouTube, I want the app to try one more AI-based recovery path when captions or descriptions do not include the recipe, so that useful cooking videos are not dead ends.

**Acceptance Criteria:**
- [ ] Direct video fallback is disabled by default and controlled by environment configuration
- [ ] Fallback runs only after YouTube link, description text, and public transcript paths fail
- [ ] Fallback uses a video-capable provider; Groq GPT-OSS is not used for video/audio transcription
- [ ] Saved recipe metadata distinguishes AI-direct video extraction from public transcript import
- [ ] If the video has no usable recipe, the app shows a controlled no-recipe recovery state and saves nothing

---

## 4. Out of Scope (MVP)

- Social features: sharing recipes, following other users, public library
- Meal planning, weekly schedules, or shopping list generation
- Medical, diet, allergy, weight-loss, or health recommendations
- Micronutrient-complete nutrition labels or exact calorie tracking
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
- **Should support:** Groq GPT-OSS as an environment-selectable text provider after Sprint 7 validation
- **Should separate:** text AI provider from video-capable fallback provider; not every text provider can process video/audio
- **Must run in:** browser (web app)
- **Must support:** multi-user with authentication and persistent data storage
- **Must deploy to:** Vercel (free / Hobby tier — hundreds of users at scale target)
- **Must not use:** paid third-party services for the Sprint 1 local validation path
- **Should support:** local development without cloud dependencies
