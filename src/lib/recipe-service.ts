import type { Recipe } from "@prisma/client";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import type { RecipePayload, RecipeResponse } from "@/types/recipe";

function serializeStringArray(values: string[] | undefined): string {
  return (values ?? []).join(",");
}

function deserializeStringArray(value: string): string[] {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function parseJsonField<T>(value: string, fallback: T): T {
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

export function toRecipeResponse(recipe: Recipe): RecipeResponse {
  return {
    id: recipe.id,
    userId: recipe.userId,
    title: recipe.title,
    description: recipe.description,
    sourceUrl: recipe.sourceUrl,
    servings: recipe.servings,
    ingredients: parseJsonField(recipe.ingredients, []),
    steps: parseJsonField(recipe.steps, []),
    adaptedSteps: recipe.adaptedSteps
      ? parseJsonField(recipe.adaptedSteps, [])
      : null,
    tags: deserializeStringArray(recipe.tags),
    createdAt: recipe.createdAt.toISOString(),
    updatedAt: recipe.updatedAt.toISOString(),
  };
}

export function buildRecipeListWhere(
  userId: string,
  query?: string | null,
): Prisma.RecipeWhereInput {
  const q = query?.trim();

  return {
    userId,
    ...(q ? { title: { contains: q } } : {}),
  };
}

export async function listRecipesForUser(
  userId: string,
  query?: string | null,
): Promise<RecipeResponse[]> {
  const recipes = await prisma.recipe.findMany({
    where: buildRecipeListWhere(userId, query),
    orderBy: { createdAt: "desc" },
  });

  return recipes.map(toRecipeResponse);
}

export async function createRecipeForUser(
  userId: string,
  payload: RecipePayload,
): Promise<RecipeResponse> {
  const recipe = await prisma.recipe.create({
    data: {
      userId,
      title: payload.title,
      description: payload.description ?? null,
      sourceUrl: payload.sourceUrl ?? null,
      servings: payload.servings,
      ingredients: JSON.stringify(payload.ingredients),
      steps: JSON.stringify(payload.steps),
      adaptedSteps:
        payload.adaptedSteps === undefined || payload.adaptedSteps === null
          ? null
          : JSON.stringify(payload.adaptedSteps),
      tags: serializeStringArray(payload.tags),
    },
  });

  return toRecipeResponse(recipe);
}

export async function findRecipeByNormalizedSourceUrl(
  sourceUrl: string,
): Promise<Recipe | null> {
  return prisma.recipe.findFirst({
    where: { sourceUrl },
    orderBy: { createdAt: "asc" },
  });
}

export async function copyRecipeForUser(
  userId: string,
  source: Recipe,
): Promise<RecipeResponse> {
  const recipe = await prisma.recipe.create({
    data: {
      userId,
      title: source.title,
      description: source.description,
      sourceUrl: source.sourceUrl,
      servings: source.servings,
      ingredients: source.ingredients,
      steps: source.steps,
      adaptedSteps: null,
      tags: source.tags,
    },
  });

  return toRecipeResponse(recipe);
}

export async function findRecipeById(id: string): Promise<Recipe | null> {
  return prisma.recipe.findUnique({
    where: { id },
  });
}

export async function updateRecipeForUser(
  id: string,
  userId: string,
  payload: Partial<RecipePayload>,
): Promise<RecipeResponse | null> {
  const recipe = await prisma.recipe.update({
    where: { id, userId },
    data: {
      ...(payload.title !== undefined && { title: payload.title }),
      ...(payload.description !== undefined && {
        description: payload.description ?? null,
      }),
      ...(payload.sourceUrl !== undefined && {
        sourceUrl: payload.sourceUrl ?? null,
      }),
      ...(payload.servings !== undefined && { servings: payload.servings }),
      ...(payload.ingredients !== undefined && {
        ingredients: JSON.stringify(payload.ingredients),
      }),
      ...(payload.steps !== undefined && {
        steps: JSON.stringify(payload.steps),
      }),
      ...(payload.adaptedSteps !== undefined && {
        adaptedSteps:
          payload.adaptedSteps === null
            ? null
            : JSON.stringify(payload.adaptedSteps),
      }),
      ...(payload.tags !== undefined && {
        tags: serializeStringArray(payload.tags),
      }),
    },
  });

  return toRecipeResponse(recipe);
}

export async function deleteRecipeForUser(
  id: string,
  userId: string,
): Promise<void> {
  await prisma.recipe.delete({
    where: { id, userId },
  });
}
