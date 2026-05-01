# Sample URLs — Import QA

Run each URL through the import flow. Mark Result as `pass`, `partial`, or `fail` and add notes on what was wrong.

---

## Recipe Pages (expect: full extraction)

| URL | Source | Notes | Result |
|-----|--------|-------|--------|
| https://www.allrecipes.com/recipe/202463/shoyu-chicken/ | AllRecipes | | |
| https://www.seriouseats.com/strawberry-rhubarb-creme-brulee-recipe-11960374 | Serious Eats | | |
| https://www.foodnetwork.com/recipes/bobby-flay/perfectly-grilled-steak-recipe-1973350 | Food Network | | |
| https://www.brianlagerstrom.com/recipes/chicken-piccata | Brian Lagerstrom (blog) | | |
| https://www.bonappetit.com/recipe/green-eggs-and-ham-frittata | Bon Appétit | | |
| https://sallysbakingaddiction.com/vanilla-bean-shamrock-cookies/ | Sally's Baking Addiction | | |

---

## Non-Recipe Pages (expect: graceful error, no crash)

| URL | Type | Notes | Result |
|-----|------|-------|--------|
| https://dev.to/nfrankel/three-mastodon-issues-because-of-cloudflare-bot-protection-1el3 | Tech blog post | | |
| https://aicademy.neat-tech.com/ | Marketing landing page | | |

---

## Edge Cases

| URL | Edge Case | Notes | Result |
|-----|-----------|-------|--------|
| https://www.hellofresh.com/recipes/one-pan-tuscan-chicken-sausage-white-beans-6334741c9ce24bc7af00244f | Possibly paywalled / bot-blocked | | |
