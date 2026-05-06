import { describe, expect, it, vi } from "vitest";
import {
  calculateNutritionEstimate,
  estimateIngredientGrams,
  macrosFromUsdaNutrients,
  searchFoodDataCentral,
} from "./nutrition-service";

describe("estimateIngredientGrams", () => {
  it("converts common weight and volume units to rough grams", () => {
    expect(estimateIngredientGrams({ amount: 200, unit: "g" })).toBe(200);
    expect(estimateIngredientGrams({ amount: 1, unit: "kg" })).toBe(1000);
    expect(estimateIngredientGrams({ amount: 2, unit: "tbsp" })).toBe(30);
    expect(estimateIngredientGrams({ amount: 0.5, unit: "cup" })).toBe(120);
  });

  it("returns null for count-style units that cannot be reliably weighed", () => {
    expect(estimateIngredientGrams({ amount: 2, unit: "cloves" })).toBeNull();
    expect(estimateIngredientGrams({ amount: null, unit: "g" })).toBeNull();
  });
});

describe("macrosFromUsdaNutrients", () => {
  it("extracts macro values from FoodData Central nutrient names", () => {
    expect(
      macrosFromUsdaNutrients([
        { nutrientName: "Energy", value: 250 },
        { nutrientName: "Protein", value: 10 },
        { nutrientName: "Carbohydrate, by difference", value: 30 },
        { nutrientName: "Total lipid (fat)", value: 8 },
        { nutrientName: "Fiber, total dietary", value: 5 },
      ]),
    ).toEqual({
      calories: 250,
      proteinGrams: 10,
      carbohydrateGrams: 30,
      fatGrams: 8,
      fiberGrams: 5,
    });
  });
});

describe("calculateNutritionEstimate", () => {
  it("calculates total and per-serving macros from matched ingredients", async () => {
    const searchFood = vi.fn().mockResolvedValue({
      fdcId: 123,
      description: "Tomatoes, raw",
      per100g: {
        calories: 20,
        proteinGrams: 1,
        carbohydrateGrams: 4,
        fatGrams: 0.2,
        fiberGrams: 1.2,
      },
    });

    const estimate = await calculateNutritionEstimate({
      title: "Tomato Salad",
      servings: 2,
      ingredients: [{ amount: 200, unit: "g", name: "tomatoes" }],
      searchFood,
    });

    expect(estimate.total).toEqual({
      calories: 40,
      proteinGrams: 2,
      carbohydrateGrams: 8,
      fatGrams: 0.4,
      fiberGrams: 2.4,
    });
    expect(estimate.perServing.calories).toBe(20);
    expect(estimate.ingredients[0]).toMatchObject({
      fdcId: 123,
      confidence: "high",
      grams: 200,
    });
  });

  it("returns a controlled no-match error when every ingredient is unmatched", async () => {
    await expect(
      calculateNutritionEstimate({
        title: "Garlic Oil",
        servings: 4,
        ingredients: [{ amount: 2, unit: "cloves", name: "garlic" }],
        searchFood: vi.fn().mockResolvedValue(null),
      }),
    ).rejects.toMatchObject({
      message: expect.stringContaining("match"),
      status: 422,
    });
  });

  it("keeps partial matches as estimates without fabricating unmatched macros", async () => {
    const searchFood = vi.fn().mockImplementation((query: string) => {
      if (query === "tomatoes") {
        return Promise.resolve({
          fdcId: 123,
          description: "Tomatoes, raw",
          per100g: {
            calories: 20,
            proteinGrams: 1,
            carbohydrateGrams: 4,
            fatGrams: 0.2,
            fiberGrams: 1.2,
          },
        });
      }

      return Promise.resolve(null);
    });

    const estimate = await calculateNutritionEstimate({
      title: "Garlic Oil",
      servings: 4,
      ingredients: [
        { amount: 200, unit: "g", name: "tomatoes" },
        { amount: 2, unit: "cloves", name: "garlic" },
      ],
      searchFood,
    });

    expect(estimate.total.calories).toBe(40);
    expect(estimate.perServing.calories).toBe(10);
    expect(estimate.unmatchedIngredients).toEqual(["garlic"]);
    expect(estimate.warnings).toContain(
      "Some ingredients could not be converted to grams.",
    );
  });
});

describe("searchFoodDataCentral", () => {
  it("fails before network calls when the USDA key is missing", async () => {
    const originalKey = process.env.FOODDATA_CENTRAL_API_KEY;
    delete process.env.FOODDATA_CENTRAL_API_KEY;
    vi.stubGlobal("fetch", vi.fn());

    await expect(searchFoodDataCentral("tomato")).rejects.toThrow(
      "FoodData Central API key",
    );
    expect(fetch).not.toHaveBeenCalled();

    process.env.FOODDATA_CENTRAL_API_KEY = originalKey;
    vi.unstubAllGlobals();
  });

  it("returns null when FoodData Central has no match", async () => {
    const originalKey = process.env.FOODDATA_CENTRAL_API_KEY;
    process.env.FOODDATA_CENTRAL_API_KEY = "test-fdc-key";
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(Response.json({ foods: [] })));

    await expect(searchFoodDataCentral("pink pepper dust")).resolves.toBeNull();

    process.env.FOODDATA_CENTRAL_API_KEY = originalKey;
    vi.unstubAllGlobals();
  });

  it("maps FoodData Central rate limits to a controlled service error", async () => {
    const originalKey = process.env.FOODDATA_CENTRAL_API_KEY;
    process.env.FOODDATA_CENTRAL_API_KEY = "test-fdc-key";
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("", { status: 429 })));

    await expect(searchFoodDataCentral("tomato")).rejects.toMatchObject({
      message: expect.stringContaining("rate-limiting"),
      status: 503,
    });

    process.env.FOODDATA_CENTRAL_API_KEY = originalKey;
    vi.unstubAllGlobals();
  });

  it("maps FoodData Central network failures to a controlled service error", async () => {
    const originalKey = process.env.FOODDATA_CENTRAL_API_KEY;
    process.env.FOODDATA_CENTRAL_API_KEY = "test-fdc-key";
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("network down")));

    await expect(searchFoodDataCentral("tomato")).rejects.toMatchObject({
      message: expect.stringContaining("FoodData Central"),
      status: 502,
    });

    process.env.FOODDATA_CENTRAL_API_KEY = originalKey;
    vi.unstubAllGlobals();
  });
});
