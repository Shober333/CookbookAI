import { describe, expect, it } from "vitest";
import {
  normalizeExtractedRecipe,
  prepareRecipeSourceForAi,
} from "./recipe-ai-extractor";

describe("normalizeExtractedRecipe", () => {
  it("normalizes a complete AI recipe payload", () => {
    expect(
      normalizeExtractedRecipe(
        {
          title: "Cacio e pepe",
          description: undefined,
          sourceUrl: null,
          servings: "2 servings",
          ingredients: [
            { amount: "200", unit: "g", name: "spaghetti" },
            { amount: null, unit: "null", name: "black pepper" },
          ],
          steps: ["Cook pasta.", "Toss with cheese."],
          tags: "pasta",
        },
        "https://example.com/cacio",
      ),
    ).toEqual({
      title: "Cacio e pepe",
      description: null,
      sourceUrl: "https://example.com/cacio",
      servings: 2,
      ingredients: [
        { amount: 200, unit: "g", name: "spaghetti" },
        { amount: null, unit: "", name: "black pepper" },
      ],
      steps: ["Cook pasta.", "Toss with cheese."],
      tags: ["pasta"],
    });
  });

  it("repairs quantities that local models put in ingredient notes", () => {
    expect(
      normalizeExtractedRecipe(
        {
          title: "Italian Seafood Pasta",
          description: null,
          sourceUrl: "https://example.com/seafood-pasta",
          servings: 3,
          ingredients: [
            { amount: null, unit: "cup", name: "olive oil", notes: "1/4" },
            { amount: null, unit: "cloves", name: "garlic", notes: "1-2, minced" },
            {
              amount: null,
              unit: "grape or cherry tomatoes",
              name: "tomatoes",
              notes: "12, halved",
            },
          ],
          steps: ["Cook the sauce.", "Toss with pasta."],
          tags: ["pasta"],
        },
        "https://example.com/seafood-pasta",
      ),
    ).toMatchObject({
      ingredients: [
        { amount: 0.25, unit: "cup", name: "olive oil" },
        { amount: 1, unit: "cloves", name: "garlic", notes: "to 2, minced" },
        { amount: 12, unit: "", name: "grape or cherry tomatoes", notes: "halved" },
      ],
    });
  });

  it("repairs ingredient names that include the quantity", () => {
    expect(
      normalizeExtractedRecipe(
        {
          title: "Cacio e pepe",
          servings: 3,
          ingredients: [
            {
              amount: null,
              unit: "",
              name: "1¼ cups freshly grated pecorino cheese",
            },
          ],
          steps: ["Toss the pasta with cheese."],
        },
        "https://example.com/cacio",
      ),
    ).toMatchObject({
      ingredients: [
        {
          amount: 1.25,
          unit: "cups",
          name: "freshly grated pecorino cheese",
        },
      ],
    });
  });

  it("canonicalizes long-form units during extraction", () => {
    expect(
      normalizeExtractedRecipe(
        {
          title: "Unit Soup",
          servings: 4,
          ingredients: [
            { amount: 100, unit: "grams", name: "carrots" },
            { amount: 1, unit: "kilogram", name: "potatoes" },
            { amount: 500, unit: "millilitres", name: "stock" },
            { amount: 1, unit: "liter", name: "water" },
            { amount: 2, unit: "tablespoons", name: "oil" },
            { amount: 1, unit: "teaspoon", name: "salt" },
            { amount: 4, unit: "ounces", name: "cheese" },
            { amount: 1, unit: "pound", name: "beef" },
          ],
          steps: ["Simmer."],
        },
        "https://example.com/unit-soup",
      ),
    ).toMatchObject({
      ingredients: [
        { amount: 100, unit: "g", name: "carrots" },
        { amount: 1, unit: "kg", name: "potatoes" },
        { amount: 500, unit: "ml", name: "stock" },
        { amount: 1, unit: "l", name: "water" },
        { amount: 2, unit: "tbsp", name: "oil" },
        { amount: 1, unit: "tsp", name: "salt" },
        { amount: 4, unit: "oz", name: "cheese" },
        { amount: 1, unit: "lb", name: "beef" },
      ],
    });
  });

  it("passes through AI error payloads", () => {
    expect(
      normalizeExtractedRecipe(
        { error: "No recipe found." },
        "https://example.com/not-a-recipe",
      ),
    ).toEqual({ error: "No recipe found." });
  });

  it("supports pasted-text extraction without a source URL", () => {
    expect(
      normalizeExtractedRecipe(
        {
          title: "No-Link Soup",
          description: null,
          servings: 4,
          ingredients: [{ amount: 1, unit: "cup", name: "lentils" }],
          steps: ["Simmer until tender."],
          tags: ["soup"],
        },
        null,
      ),
    ).toEqual({
      title: "No-Link Soup",
      description: null,
      sourceUrl: null,
      servings: 4,
      ingredients: [{ amount: 1, unit: "cup", name: "lentils" }],
      steps: ["Simmer until tender."],
      tags: ["soup"],
    });
  });

  it("returns an error payload when required recipe fields are missing", () => {
    expect(
      normalizeExtractedRecipe(
        {
          title: "Incomplete",
          servings: 4,
          ingredients: [],
          steps: [],
        },
        "https://example.com/incomplete",
      ),
    ).toEqual({
      error:
        "We couldn't extract a complete recipe from that page. Try another link, or paste the recipe text directly.",
    });
  });
});

describe("prepareRecipeSourceForAi", () => {
  it("focuses the source text around recipe markers", () => {
    const source = `${"navigation ".repeat(100)}Recipe Ingredients flour sugar milk Instructions mix and cook`;

    const focused = prepareRecipeSourceForAi(source, 120);

    expect(focused).toContain("Recipe Ingredients");
    expect(focused).toContain("Instructions");
    expect(focused.length).toBeLessThanOrEqual(120);
  });

  it("falls back to the beginning when no recipe marker is present", () => {
    expect(prepareRecipeSourceForAi("one two three four", 7)).toBe("one two");
  });
});
