import { describe, expect, it } from "vitest";
import { extractRecipeFromJsonLd } from "./recipe-jsonld";

describe("extractRecipeFromJsonLd", () => {
  it("extracts a Recipe node from JSON-LD", () => {
    const html = `
      <script type="application/ld+json">
        {
          "@context": "https://schema.org",
          "@type": "Recipe",
          "name": "Cacio e Pepe",
          "description": "A Roman pasta.",
          "recipeYield": "4 servings",
          "recipeIngredient": [
            "400 g spaghetti",
            "1 cup Pecorino Romano",
            "black pepper"
          ],
          "recipeInstructions": [
            { "@type": "HowToStep", "text": "Cook the pasta." },
            { "@type": "HowToStep", "text": "Toss with cheese and pepper." }
          ],
          "keywords": "pasta, Italian",
          "recipeCuisine": "Italian"
        }
      </script>
    `;

    expect(extractRecipeFromJsonLd(html, "https://example.com/recipe")).toEqual({
      title: "Cacio e Pepe",
      description: "A Roman pasta.",
      sourceUrl: "https://example.com/recipe",
      servings: 4,
      ingredients: [
        { amount: 400, unit: "g", name: "spaghetti" },
        { amount: 1, unit: "cup", name: "Pecorino Romano" },
        { amount: null, unit: "", name: "black pepper" },
      ],
      steps: ["Cook the pasta.", "Toss with cheese and pepper."],
      tags: ["pasta", "Italian"],
    });
  });

  it("extracts a Recipe node from an @graph", () => {
    const html = `
      <script type="application/ld+json">
        {
          "@graph": [
            { "@type": "WebPage", "name": "Page" },
            {
              "@type": ["Recipe", "Article"],
              "name": "Soup",
              "recipeIngredient": ["1 cup water"],
              "recipeInstructions": "Simmer."
            }
          ]
        }
      </script>
    `;

    expect(extractRecipeFromJsonLd(html, "https://example.com/soup")).toMatchObject({
      title: "Soup",
      servings: 4,
      ingredients: [{ amount: 1, unit: "cup", name: "water" }],
      steps: ["Simmer."],
    });
  });

  it("returns null when no complete recipe data is present", () => {
    const html = '<script type="application/ld+json">{"@type":"WebPage"}</script>';

    expect(extractRecipeFromJsonLd(html, "https://example.com")).toBeNull();
  });
});
