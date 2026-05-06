import { describe, it, expect } from "vitest";
import {
  scaledPerServing,
  isFullMatch,
  shouldShowRecalculate,
  unmatchedLine,
  classifyNutritionError,
  matchedIngredientCount,
  totalIngredientCount,
} from "./nutrition-utils";
import type { RecipeNutritionEstimate } from "@/types/recipe";

function makeEstimate(
  overrides: Partial<RecipeNutritionEstimate> = {},
): RecipeNutritionEstimate {
  const ingredients = [
    {
      ingredientName: "tomatoes",
      normalizedName: "tomatoes",
      amount: 200,
      unit: "g",
      grams: 200,
      confidence: "high" as const,
    },
    {
      ingredientName: "olive oil",
      normalizedName: "olive oil",
      amount: 1,
      unit: "tbsp",
      grams: 15,
      confidence: "high" as const,
    },
  ];

  return {
    source: "usda-fdc",
    calculatedAt: "2026-01-01T12:00:00.000Z",
    servings: 4,
    total: {
      calories: 1600,
      proteinGrams: 128,
      carbohydrateGrams: 112,
      fatGrams: 72,
      fiberGrams: 16,
    },
    perServing: {
      calories: 400,
      proteinGrams: 32,
      carbohydrateGrams: 28,
      fatGrams: 18,
      fiberGrams: 4,
    },
    ingredients,
    unmatchedIngredients: [],
    warnings: [],
    ...overrides,
  };
}

describe("scaledPerServing", () => {
  it("returns the base value unchanged when currentServings matches servingsUsed", () => {
    expect(scaledPerServing(400, 4, 4)).toBe(400);
  });

  it("scales the displayed value proportionally", () => {
    expect(scaledPerServing(400, 2, 4)).toBe(200);
    expect(scaledPerServing(400, 8, 4)).toBe(800);
  });

  it("rounds to nearest integer and guards against division by zero", () => {
    expect(scaledPerServing(100, 1, 3)).toBe(33);
    expect(scaledPerServing(400, 4, 0)).toBe(0);
  });
});

describe("match counts", () => {
  it("counts matched and total ingredients from the backend estimate", () => {
    const estimate = makeEstimate();
    expect(matchedIngredientCount(estimate)).toBe(2);
    expect(totalIngredientCount(estimate)).toBe(2);
    expect(isFullMatch(estimate)).toBe(true);
  });

  it("treats unmatched confidence as a partial estimate", () => {
    const estimate = makeEstimate({
      ingredients: [
        {
          ingredientName: "garlic",
          normalizedName: "garlic",
          amount: 2,
          unit: "cloves",
          grams: null,
          confidence: "unmatched",
        },
      ],
      unmatchedIngredients: ["garlic"],
    });

    expect(matchedIngredientCount(estimate)).toBe(0);
    expect(totalIngredientCount(estimate)).toBe(1);
    expect(isFullMatch(estimate)).toBe(false);
  });
});

describe("shouldShowRecalculate", () => {
  it("returns false without an estimate or change timestamp", () => {
    expect(shouldShowRecalculate(null, "2026-02-01T00:00:00.000Z")).toBe(false);
    expect(shouldShowRecalculate(makeEstimate(), null)).toBe(false);
  });

  it("returns true only when ingredients changed after calculation", () => {
    expect(
      shouldShowRecalculate(makeEstimate(), "2026-01-02T00:00:00.000Z"),
    ).toBe(true);
    expect(
      shouldShowRecalculate(makeEstimate(), "2025-12-31T00:00:00.000Z"),
    ).toBe(false);
  });
});

describe("unmatchedLine", () => {
  it("formats empty, short, and long unmatched ingredient lists", () => {
    expect(unmatchedLine([])).toBe("");
    expect(unmatchedLine(["Parmesan cheese"])).toBe(
      "Parmesan cheese couldn't be looked up.",
    );
    expect(unmatchedLine(["Parmesan cheese", "pancetta"])).toBe(
      "Parmesan cheese, pancetta couldn't be looked up.",
    );
    expect(unmatchedLine(["A", "B", "C", "D"])).toBe(
      "4 ingredients couldn't be looked up.",
    );
  });
});

describe("classifyNutritionError", () => {
  it("maps config, no-match, and service failures", () => {
    expect(classifyNutritionError(501, "")).toBe("config");
    expect(classifyNutritionError(403, "API key missing")).toBe("config");
    expect(classifyNutritionError(404, "No ingredients matched the database")).toBe(
      "no-match",
    );
    expect(classifyNutritionError(503, "Service unavailable")).toBe("service");
  });
});
