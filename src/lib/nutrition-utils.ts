import type { RecipeNutritionEstimate } from "@/types/recipe";

export type NutritionErrorKind = "config" | "service" | "no-match";

export function scaledPerServing(
  base: number,
  currentServings: number,
  servingsUsed: number,
): number {
  if (servingsUsed === 0) return 0;
  return Math.round(base * (currentServings / servingsUsed));
}

export function matchedIngredientCount(
  estimate: RecipeNutritionEstimate,
): number {
  return estimate.ingredients.filter(
    (ingredient) => ingredient.confidence !== "unmatched",
  ).length;
}

export function totalIngredientCount(estimate: RecipeNutritionEstimate): number {
  return estimate.ingredients.length;
}

export function isFullMatch(estimate: RecipeNutritionEstimate): boolean {
  return matchedIngredientCount(estimate) === totalIngredientCount(estimate);
}

export function shouldShowRecalculate(
  estimate: RecipeNutritionEstimate | null,
  ingredientsChangedSince?: string | null,
): boolean {
  if (!estimate) return false;
  if (!ingredientsChangedSince) return false;
  return new Date(ingredientsChangedSince) > new Date(estimate.calculatedAt);
}

export function unmatchedLine(items: string[]): string {
  if (items.length === 0) return "";
  if (items.length === 1) return `${items[0]} couldn't be looked up.`;
  if (items.length <= 3) return `${items.join(", ")} couldn't be looked up.`;
  return `${items.length} ingredients couldn't be looked up.`;
}

export function classifyNutritionError(
  status: number,
  errorText: string,
): NutritionErrorKind {
  const lower = errorText.toLowerCase();
  if (status === 501 || lower.includes("config") || lower.includes("key")) {
    return "config";
  }
  if (lower.includes("match")) {
    return "no-match";
  }
  return "service";
}
