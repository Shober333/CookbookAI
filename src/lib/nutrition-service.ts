import type { Recipe } from "@prisma/client";
import { z } from "zod";
import { generateRecipeObject } from "@/lib/ai-provider";
import { prisma } from "@/lib/db";
import { recipeNutritionEstimateSchema } from "@/lib/recipe-schema";
import { toRecipeResponse } from "@/lib/recipe-service";
import type {
  MacroNutrients,
  RecipeIngredient,
  RecipeNutritionEstimate,
  RecipeResponse,
} from "@/types/recipe";

const FDC_BASE_URL = "https://api.nal.usda.gov/fdc/v1";
const AI_NUTRITION_NORMALIZATION_ENABLED =
  process.env.AI_NUTRITION_NORMALIZATION_ENABLED === "true";

const nutritionNormalizationSchema = z.object({
  normalizedName: z.string().trim().min(1),
  grams: z.number().finite().positive().nullable(),
  confidence: z.enum(["medium", "low"]),
  notes: z.string().trim(),
});

const nutritionNormalizationJsonSchema = {
  type: "object",
  additionalProperties: false,
  required: ["normalizedName", "grams", "confidence", "notes"],
  properties: {
    normalizedName: { type: "string" },
    grams: { anyOf: [{ type: "number" }, { type: "null" }] },
    confidence: { type: "string", enum: ["medium", "low"] },
    notes: { type: "string" },
  },
};

export class NutritionCalculationError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = "NutritionCalculationError";
  }
}

type UsdaNutrient = {
  nutrientName?: string;
  nutrientNumber?: string;
  unitName?: string;
  value?: number;
};

type UsdaFood = {
  fdcId?: number;
  description?: string;
  foodNutrients?: UsdaNutrient[];
};

type FoodLookup = {
  fdcId: number;
  description: string;
  per100g: MacroNutrients;
};

export async function calculateAndStoreNutritionEstimate(
  recipe: Recipe,
): Promise<RecipeResponse> {
  const estimate = await calculateNutritionEstimate({
    title: recipe.title,
    servings: recipe.servings,
    ingredients: parseIngredients(recipe.ingredients),
  });

  const updated = await prisma.recipe.update({
    where: { id: recipe.id, userId: recipe.userId },
    data: { nutritionEstimate: JSON.stringify(estimate) },
  });

  return toRecipeResponse(updated);
}

export async function calculateNutritionEstimate(params: {
  title: string;
  servings: number;
  ingredients: RecipeIngredient[];
  searchFood?: (query: string) => Promise<FoodLookup | null>;
}): Promise<RecipeNutritionEstimate> {
  if (params.ingredients.length === 0) {
    throw new NutritionCalculationError("Recipe ingredients are unavailable.", 422);
  }

  const searchFood = params.searchFood ?? searchFoodDataCentral;
  const ingredientMatches: RecipeNutritionEstimate["ingredients"] = [];
  const unmatchedIngredients: string[] = [];
  const warnings = new Set<string>();
  let total = zeroMacros();

  for (const ingredient of params.ingredients) {
    const normalized = normalizeIngredientName(ingredient.name);
    let grams = estimateIngredientGrams(ingredient);
    let normalizedName = normalized;
    let confidence: "high" | "medium" | "low" | "unmatched" =
      grams === null ? "low" : "high";
    const ingredientWarnings: string[] = [];

    if (grams === null && AI_NUTRITION_NORMALIZATION_ENABLED) {
      const aiEstimate = await normalizeIngredientForNutritionWithAi(
        params.title,
        ingredient,
      );
      if (aiEstimate) {
        normalizedName = aiEstimate.normalizedName;
        grams = aiEstimate.grams;
        confidence = aiEstimate.confidence;
        if (aiEstimate.notes) ingredientWarnings.push(aiEstimate.notes);
      }
    }

    if (grams === null) {
      const message = "No reliable gram estimate for this ingredient.";
      ingredientWarnings.push(message);
      warnings.add("Some ingredients could not be converted to grams.");
    }

    const food = await searchFood(normalizedName);

    if (!food || grams === null) {
      unmatchedIngredients.push(ingredient.name);
      ingredientMatches.push({
        ingredientName: ingredient.name,
        normalizedName,
        amount: ingredient.amount,
        unit: ingredient.unit,
        grams,
        confidence: "unmatched",
        warnings: ingredientWarnings,
      });
      continue;
    }

    const macros = scaleMacros(food.per100g, grams / 100);
    total = addMacros(total, macros);

    ingredientMatches.push({
      ingredientName: ingredient.name,
      normalizedName,
      amount: ingredient.amount,
      unit: ingredient.unit,
      grams: roundNumber(grams),
      fdcId: food.fdcId,
      foodDescription: food.description,
      confidence,
      macros,
      warnings: ingredientWarnings,
    });
  }

  if (ingredientMatches.length === unmatchedIngredients.length) {
    throw new NutritionCalculationError(
      "We couldn't match any recipe ingredients to nutrition data.",
      422,
    );
  }

  const estimate: RecipeNutritionEstimate = {
    source: "usda-fdc",
    calculatedAt: new Date().toISOString(),
    servings: params.servings,
    total: roundMacros(total),
    perServing: roundMacros(scaleMacros(total, 1 / params.servings)),
    ingredients: ingredientMatches,
    unmatchedIngredients,
    warnings: [...warnings],
  };

  const parsed = recipeNutritionEstimateSchema.safeParse(estimate);
  if (!parsed.success) {
    throw new NutritionCalculationError("Nutrition estimate could not be validated.", 502);
  }

  return parsed.data;
}

export async function searchFoodDataCentral(
  query: string,
): Promise<FoodLookup | null> {
  const apiKey = process.env.FOODDATA_CENTRAL_API_KEY;

  if (!apiKey) {
    throw new NutritionCalculationError(
      "Macro calculation needs a configured FoodData Central API key.",
      503,
    );
  }

  const url = new URL(`${FDC_BASE_URL}/foods/search`);
  url.searchParams.set("api_key", apiKey);
  url.searchParams.set("query", query);
  url.searchParams.set("pageSize", "1");
  url.searchParams.set("dataType", "Foundation,SR Legacy");

  let response: Response;
  try {
    response = await fetch(url, { signal: AbortSignal.timeout(10_000) });
  } catch {
    throw new NutritionCalculationError(
      "We couldn't reach FoodData Central right now.",
      502,
    );
  }

  if (response.status === 429) {
    throw new NutritionCalculationError(
      "FoodData Central is rate-limiting requests. Try again later.",
      503,
    );
  }

  if (!response.ok) {
    throw new NutritionCalculationError(
      "FoodData Central lookup failed.",
      response.status === 401 || response.status === 403 ? 503 : 502,
    );
  }

  const body = (await response.json()) as { foods?: UsdaFood[] };
  const first = body.foods?.find((food) => food.fdcId && food.description);

  if (!first?.fdcId || !first.description) return null;

  return {
    fdcId: first.fdcId,
    description: first.description,
    per100g: macrosFromUsdaNutrients(first.foodNutrients ?? []),
  };
}

export function macrosFromUsdaNutrients(nutrients: UsdaNutrient[]): MacroNutrients {
  const byName = (patterns: RegExp[]) => {
    const nutrient = nutrients.find((item) => {
      const name = `${item.nutrientName ?? ""} ${item.nutrientNumber ?? ""}`;
      return patterns.some((pattern) => pattern.test(name));
    });
    return typeof nutrient?.value === "number" ? nutrient.value : 0;
  };

  return {
    calories: byName([/energy/i, /\b208\b/]),
    proteinGrams: byName([/protein/i, /\b203\b/]),
    carbohydrateGrams: byName([/carbohydrate/i, /\b205\b/]),
    fatGrams: byName([/total lipid/i, /\bfat\b/i, /\b204\b/]),
    fiberGrams: byName([/fiber/i, /\b291\b/]),
  };
}

export function estimateIngredientGrams(
  ingredient: Pick<RecipeIngredient, "amount" | "unit">,
): number | null {
  if (ingredient.amount === null || ingredient.amount <= 0) return null;

  const unit = ingredient.unit.trim().toLowerCase();
  const amount = ingredient.amount;
  const multipliers: Record<string, number> = {
    g: 1,
    gram: 1,
    grams: 1,
    kg: 1000,
    kilogram: 1000,
    kilograms: 1000,
    oz: 28.3495,
    ounce: 28.3495,
    ounces: 28.3495,
    lb: 453.592,
    lbs: 453.592,
    pound: 453.592,
    pounds: 453.592,
    ml: 1,
    milliliter: 1,
    millilitre: 1,
    milliliters: 1,
    millilitres: 1,
    l: 1000,
    liter: 1000,
    litre: 1000,
    liters: 1000,
    litres: 1000,
    tsp: 5,
    teaspoon: 5,
    teaspoons: 5,
    tbsp: 15,
    tablespoon: 15,
    tablespoons: 15,
    cup: 240,
    cups: 240,
  };

  return multipliers[unit] ? amount * multipliers[unit] : null;
}

function parseIngredients(value: string): RecipeIngredient[] {
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function normalizeIngredientName(value: string): string {
  return value
    .toLowerCase()
    .replace(/\([^)]*\)/g, " ")
    .replace(/\b(chopped|diced|minced|sliced|fresh|optional|to taste)\b/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

async function normalizeIngredientForNutritionWithAi(
  title: string,
  ingredient: RecipeIngredient,
) {
  try {
    const response = await generateRecipeObject({
      schema: nutritionNormalizationJsonSchema,
      zodSchema: nutritionNormalizationSchema,
      schemaName: "NutritionIngredientNormalization",
      schemaDescription: "Ingredient name and gram estimate for nutrition lookup.",
      system:
        "Normalize recipe ingredients for nutrition lookup. Return only JSON. " +
        "Do not provide nutrition values.",
      prompt: `Recipe: ${title}

Ingredient:
- amount: ${ingredient.amount ?? "unknown"}
- unit: ${ingredient.unit || "unknown"}
- name: ${ingredient.name}
- notes: ${ingredient.notes ?? ""}

Return a concise FoodData Central search name and a conservative gram estimate if the amount and unit imply one. Use null grams when uncertain.`,
    });
    const parsed = nutritionNormalizationSchema.safeParse(response);
    return parsed.success ? parsed.data : null;
  } catch {
    return null;
  }
}

function zeroMacros(): MacroNutrients {
  return {
    calories: 0,
    proteinGrams: 0,
    carbohydrateGrams: 0,
    fatGrams: 0,
    fiberGrams: 0,
  };
}

function addMacros(a: MacroNutrients, b: MacroNutrients): MacroNutrients {
  return {
    calories: a.calories + b.calories,
    proteinGrams: a.proteinGrams + b.proteinGrams,
    carbohydrateGrams: a.carbohydrateGrams + b.carbohydrateGrams,
    fatGrams: a.fatGrams + b.fatGrams,
    fiberGrams: (a.fiberGrams ?? 0) + (b.fiberGrams ?? 0),
  };
}

function scaleMacros(macros: MacroNutrients, factor: number): MacroNutrients {
  return {
    calories: macros.calories * factor,
    proteinGrams: macros.proteinGrams * factor,
    carbohydrateGrams: macros.carbohydrateGrams * factor,
    fatGrams: macros.fatGrams * factor,
    fiberGrams:
      macros.fiberGrams === undefined ? undefined : macros.fiberGrams * factor,
  };
}

function roundMacros(macros: MacroNutrients): MacroNutrients {
  return {
    calories: roundNumber(macros.calories),
    proteinGrams: roundNumber(macros.proteinGrams),
    carbohydrateGrams: roundNumber(macros.carbohydrateGrams),
    fatGrams: roundNumber(macros.fatGrams),
    ...(macros.fiberGrams !== undefined && {
      fiberGrams: roundNumber(macros.fiberGrams),
    }),
  };
}

function roundNumber(value: number): number {
  return Math.round(value * 10) / 10;
}
