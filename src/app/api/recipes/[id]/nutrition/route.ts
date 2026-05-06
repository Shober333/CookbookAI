import { NextResponse } from "next/server";
import {
  calculateAndStoreNutritionEstimate,
  NutritionCalculationError,
} from "@/lib/nutrition-service";
import { findRecipeById } from "@/lib/recipe-service";
import { getAuthenticatedUserId, jsonError } from "@/lib/route-helpers";

export const maxDuration = 120;

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function POST(_request: Request, context: RouteContext) {
  const userId = await getAuthenticatedUserId();

  if (!userId) {
    return jsonError("Authentication required.", 401);
  }

  const { id } = await context.params;
  const recipe = await findRecipeById(id);

  if (!recipe) {
    return jsonError("Recipe not found.", 404);
  }

  if (recipe.userId !== userId) {
    return jsonError("Forbidden.", 403);
  }

  try {
    const updatedRecipe = await calculateAndStoreNutritionEstimate(recipe);
    return NextResponse.json({ recipe: updatedRecipe });
  } catch (error) {
    if (error instanceof NutritionCalculationError) {
      return jsonError(error.message, error.status);
    }

    console.error("[nutrition] calculation failed", {
      recipeId: recipe.id,
      error: error instanceof Error ? error.name : "UnknownError",
    });
    return jsonError("Could not calculate macros for this recipe.", 502);
  }
}
