import { NextResponse } from "next/server";
import { z } from "zod";
import { adaptRecipeStepsWithAi } from "@/lib/equipment-adapter";
import { normalizeAppliances } from "@/lib/equipment-service";
import { findRecipeById } from "@/lib/recipe-service";
import { getAuthenticatedUserId, jsonError } from "@/lib/route-helpers";

export const maxDuration = 120;

const adaptRequestSchema = z.object({
  recipeId: z.string().trim().min(1),
  appliances: z.array(z.string()).transform((values) => normalizeAppliances(values)),
});

function parseSteps(value: string): string[] {
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed)
      ? parsed.filter((step): step is string => typeof step === "string" && step.trim() !== "")
      : [];
  } catch {
    return [];
  }
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

  const parsed = adaptRequestSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid adaptation payload.", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const recipe = await findRecipeById(parsed.data.recipeId);

  if (!recipe) {
    return jsonError("Recipe not found.", 404);
  }

  if (recipe.userId !== userId) {
    return jsonError("Forbidden.", 403);
  }

  const steps = parseSteps(recipe.steps);

  if (steps.length === 0) {
    return jsonError("Recipe steps are unavailable.", 422);
  }

  try {
    const adaptation = await adaptRecipeStepsWithAi({
      title: recipe.title,
      steps,
      appliances: parsed.data.appliances,
    });

    return NextResponse.json(adaptation);
  } catch (error) {
    console.error("[equipment-adapt] AI adaptation failed", {
      provider: process.env.AI_PROVIDER ?? "ollama",
      recipeId: recipe.id,
      error: error instanceof Error ? error.name : "UnknownError",
    });

    return jsonError("Could not adapt the recipe for your equipment.", 502);
  }
}
