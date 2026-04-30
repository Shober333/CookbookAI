import { NextResponse } from "next/server";
import {
  deleteRecipeForUser,
  findRecipeById,
  toRecipeResponse,
  updateRecipeForUser,
} from "@/lib/recipe-service";
import { recipePatchSchema } from "@/lib/recipe-schema";
import { getAuthenticatedUserId, jsonError } from "@/lib/route-helpers";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

async function getOwnedRecipe(id: string, userId: string) {
  const recipe = await findRecipeById(id);

  if (!recipe) {
    return { recipe: null, response: jsonError("Recipe not found.", 404) };
  }

  if (recipe.userId !== userId) {
    return { recipe: null, response: jsonError("Forbidden.", 403) };
  }

  return { recipe, response: null };
}

export async function GET(_request: Request, context: RouteContext) {
  const userId = await getAuthenticatedUserId();

  if (!userId) {
    return jsonError("Authentication required.", 401);
  }

  const { id } = await context.params;
  const { recipe, response } = await getOwnedRecipe(id, userId);

  if (response) {
    return response;
  }

  return NextResponse.json({ recipe: toRecipeResponse(recipe) });
}

export async function PATCH(request: Request, context: RouteContext) {
  const userId = await getAuthenticatedUserId();

  if (!userId) {
    return jsonError("Authentication required.", 401);
  }

  const { id } = await context.params;
  const { response } = await getOwnedRecipe(id, userId);

  if (response) {
    return response;
  }

  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return jsonError("Request body must be valid JSON.", 400);
  }

  const parsed = recipePatchSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid recipe payload.", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const recipe = await updateRecipeForUser(id, userId, parsed.data);

  return NextResponse.json({ recipe });
}

export async function DELETE(_request: Request, context: RouteContext) {
  const userId = await getAuthenticatedUserId();

  if (!userId) {
    return jsonError("Authentication required.", 401);
  }

  const { id } = await context.params;
  const { response } = await getOwnedRecipe(id, userId);

  if (response) {
    return response;
  }

  await deleteRecipeForUser(id, userId);

  return NextResponse.json({ ok: true });
}
