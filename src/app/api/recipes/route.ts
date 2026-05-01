import { NextResponse } from "next/server";
import {
  createRecipeForUser,
  listRecipesForUser,
} from "@/lib/recipe-service";
import { recipePayloadSchema } from "@/lib/recipe-schema";
import { getAuthenticatedUserId, jsonError } from "@/lib/route-helpers";

export async function GET(request: Request) {
  const userId = await getAuthenticatedUserId();

  if (!userId) {
    return jsonError("Authentication required.", 401);
  }

  const { searchParams } = new URL(request.url);
  const recipes = await listRecipesForUser(userId, searchParams.get("q"));

  return NextResponse.json({ recipes });
}

export async function POST(request: Request) {
  const userId = await getAuthenticatedUserId();

  if (!userId) {
    return jsonError("Authentication required.", 401);
  }

  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return jsonError("Request body must be valid JSON.", 400);
  }

  const parsed = recipePayloadSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid recipe payload.", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const recipe = await createRecipeForUser(userId, parsed.data);

  return NextResponse.json({ recipe }, { status: 201 });
}
