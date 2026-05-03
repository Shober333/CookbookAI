import { NextResponse } from "next/server";
import {
  extractRecipePayload,
  importRecipeForUser,
  RecipeImportError,
} from "@/lib/recipe-import-service";
import {
  importRecipeRequestSchema,
  importRecipeSchema,
} from "@/lib/recipe-schema";
import { getAuthenticatedUserId, jsonError } from "@/lib/route-helpers";

export const maxDuration = 120;

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

  try {
    const parsed = importRecipeRequestSchema.safeParse(body);

    if (parsed.success) {
      const result = await importRecipeForUser(
        userId,
        parsed.data.mode === "url"
          ? { kind: "url", url: parsed.data.url }
          : {
              kind: "text",
              text: parsed.data.text,
              sourceUrl: parsed.data.sourceUrl,
            },
      );

      return NextResponse.json(result);
    }

    const legacyParsed = importRecipeSchema.safeParse(body);

    if (!legacyParsed.success) {
      return jsonError("A valid recipe URL is required.", 400);
    }

    const recipe = await extractRecipePayload({
      kind: "url",
      url: legacyParsed.data.url,
    });

    return new Response(JSON.stringify(recipe), {
      headers: {
        "content-type": "text/plain; charset=utf-8",
        "x-cookbookai-stream": "recipe-import",
      },
    });
  } catch (error) {
    if (error instanceof RecipeImportError) {
      return jsonError(error.message, error.status);
    }

    console.error("[recipe-import] unexpected failure", {
      error: error instanceof Error ? error.name : "UnknownError",
    });
    return jsonError("Something went wrong. Try again in a moment.", 500);
  }
}
