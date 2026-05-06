import { expect, test, type Page } from "@playwright/test";
import path from "node:path";
import type { RecipeNutritionEstimate } from "@/types/recipe";

const PASSWORD = "correct-horse-42";
const SCREENSHOT_DIR = path.join("tests", "screenshots");

type Ingredient = {
  amount: number | null;
  unit: string;
  name: string;
  notes?: string;
};

type RecipePayload = {
  title: string;
  description?: string | null;
  sourceUrl?: string | null;
  servings: number;
  ingredients: Ingredient[];
  steps: string[];
  nutritionEstimate?: RecipeNutritionEstimate | null;
  tags?: string[];
};

function uniqueEmail(label: string) {
  return `qa-s7-${label}-${Date.now()}-${Math.random().toString(36).slice(2)}@example.com`;
}

async function register(page: Page, email: string, password = PASSWORD) {
  await page.goto("/register");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: "Create account" }).click();
  await expect(page.getByRole("button", { name: "+ Import" })).toBeVisible({
    timeout: 15_000,
  });
}

async function createRecipe(page: Page, recipe: RecipePayload) {
  const response = await page.request.post("/api/recipes", { data: recipe });
  expect(response.status()).toBe(201);
  const body = await response.json();
  return body.recipe as RecipePayload & { id: string };
}

function sampleRecipe(overrides: Partial<RecipePayload> = {}): RecipePayload {
  return {
    title: "S7 Tomato Bean Toast",
    description: "A simple recipe for Sprint 7 nutrition QA.",
    sourceUrl: "https://example.com/s7-tomato-bean-toast",
    servings: 2,
    ingredients: [
      { amount: 200, unit: "g", name: "tomatoes" },
      { amount: 150, unit: "g", name: "white beans" },
      { amount: 2, unit: "slices", name: "toast" },
    ],
    steps: ["Warm the beans.", "Spoon over toast.", "Finish with tomatoes."],
    tags: ["qa", "nutrition"],
    ...overrides,
  };
}

function fullNutritionEstimate(): RecipeNutritionEstimate {
  return {
    source: "usda-fdc",
    calculatedAt: "2026-05-06T09:00:00.000Z",
    servings: 2,
    total: {
      calories: 840,
      proteinGrams: 36,
      carbohydrateGrams: 120,
      fatGrams: 24,
      fiberGrams: 18,
    },
    perServing: {
      calories: 420,
      proteinGrams: 18,
      carbohydrateGrams: 60,
      fatGrams: 12,
      fiberGrams: 9,
    },
    ingredients: [
      {
        ingredientName: "tomatoes",
        normalizedName: "tomatoes",
        amount: 200,
        unit: "g",
        grams: 200,
        fdcId: 11529,
        foodDescription: "Tomatoes, raw",
        confidence: "high",
        macros: {
          calories: 36,
          proteinGrams: 1.8,
          carbohydrateGrams: 7.8,
          fatGrams: 0.4,
          fiberGrams: 2.4,
        },
      },
      {
        ingredientName: "white beans",
        normalizedName: "white beans",
        amount: 150,
        unit: "g",
        grams: 150,
        fdcId: 16043,
        foodDescription: "Beans, white, mature seeds, cooked",
        confidence: "high",
        macros: {
          calories: 210,
          proteinGrams: 12,
          carbohydrateGrams: 37,
          fatGrams: 0.5,
          fiberGrams: 9,
        },
      },
      {
        ingredientName: "toast",
        normalizedName: "bread",
        amount: 2,
        unit: "slices",
        grams: 64,
        fdcId: 18069,
        foodDescription: "Bread, whole-wheat",
        confidence: "medium",
        macros: {
          calories: 160,
          proteinGrams: 8,
          carbohydrateGrams: 28,
          fatGrams: 2,
          fiberGrams: 4,
        },
      },
    ],
    unmatchedIngredients: [],
    warnings: [],
  };
}

function partialNutritionEstimate(): RecipeNutritionEstimate {
  const estimate = fullNutritionEstimate();
  return {
    ...estimate,
    total: {
      calories: 246,
      proteinGrams: 13.8,
      carbohydrateGrams: 44.8,
      fatGrams: 0.9,
      fiberGrams: 11.4,
    },
    perServing: {
      calories: 123,
      proteinGrams: 6.9,
      carbohydrateGrams: 22.4,
      fatGrams: 0.5,
      fiberGrams: 5.7,
    },
    ingredients: [
      estimate.ingredients[0],
      estimate.ingredients[1],
      {
        ingredientName: "pink pepper dust",
        normalizedName: "pink pepper dust",
        amount: 1,
        unit: "pinch",
        grams: null,
        confidence: "unmatched",
        warnings: ["Could not match ingredient to FoodData Central."],
      },
    ],
    unmatchedIngredients: ["pink pepper dust"],
    warnings: ["Some ingredients could not be converted to grams."],
  };
}

test.describe("Sprint 7 nutrition UI", () => {
  test("renders saved full nutrition estimate on desktop", async ({ page }) => {
    await register(page, uniqueEmail("nutrition-full"));
    const recipe = await createRecipe(
      page,
      sampleRecipe({ nutritionEstimate: fullNutritionEstimate() }),
    );

    await page.goto(`/recipes/${recipe.id}`);
    await expect(page.getByRole("heading", { name: "Macros" })).toBeVisible();
    await expect(
      page.getByLabel("Approximately 420 calories per serving"),
    ).toBeVisible();
    await expect(page.getByText("Protein", { exact: true })).toBeVisible();
    await expect(page.getByText("Whole recipe")).toBeVisible();
    await expect(page.getByText("Approximate values · USDA food data · 2 servings")).toBeVisible();

    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, "recipe-nutrition-full-desktop.png"),
      fullPage: true,
    });
  });

  test("renders partial nutrition estimate within mobile viewport", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await register(page, uniqueEmail("nutrition-partial"));
    const recipe = await createRecipe(
      page,
      sampleRecipe({
        title: "S7 Partial Macro Toast",
        nutritionEstimate: partialNutritionEstimate(),
      }),
    );

    await page.goto(`/recipes/${recipe.id}`);
    await expect(page.getByRole("heading", { name: "Macros" })).toBeVisible();
    await expect(page.getByText("cal per serving (estimated from matched ingredients)")).toBeVisible();
    await expect(page.getByText("pink pepper dust couldn't be looked up.")).toBeVisible();
    await expect(page.getByText("Values cover 2 of 3 ingredients. · USDA food data")).toBeVisible();

    const horizontalOverflow = await page.evaluate(
      () => document.documentElement.scrollWidth > window.innerWidth,
    );
    expect(horizontalOverflow).toBe(false);

    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, "recipe-nutrition-partial-mobile.png"),
      fullPage: true,
    });
  });

  test("shows controlled configuration error when USDA key is missing", async ({
    page,
  }) => {
    await register(page, uniqueEmail("nutrition-config"));
    const recipe = await createRecipe(page, sampleRecipe({ title: "S7 No Key Toast" }));

    await page.goto(`/recipes/${recipe.id}`);
    await page.getByRole("button", { name: "Calculate" }).click();
    await expect(
      page.getByRole("region", { name: "Macros" }).getByRole("alert"),
    ).toContainText(/Macro lookup isn.t available on this installation\./, {
      timeout: 15_000,
    });
  });
});
