import { aiProvider } from "@/lib/anthropic";
import {
  extractRecipeWithAi,
  prepareRecipeSourceForAi,
} from "@/lib/recipe-ai-extractor";
import { extractRecipeFromJsonLd } from "@/lib/recipe-jsonld";
import { importRecipeSchema } from "@/lib/recipe-schema";
import { getAuthenticatedUserId, jsonError } from "@/lib/route-helpers";

export const maxDuration = 120;

const MAX_SOURCE_CHARS = aiProvider === "ollama" ? 3_500 : 60_000;
const ENABLE_STRUCTURED_DATA_IMPORT =
  process.env.ENABLE_RECIPE_STRUCTURED_DATA_IMPORT === "true";

function stripHtml(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function assertImportableUrl(url: URL): boolean {
  return url.protocol === "http:" || url.protocol === "https:";
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

  const parsed = importRecipeSchema.safeParse(body);

  if (!parsed.success) {
    return jsonError("A valid recipe URL is required.", 400);
  }

  const sourceUrl = new URL(parsed.data.url);

  if (!assertImportableUrl(sourceUrl)) {
    return jsonError("Only HTTP and HTTPS recipe URLs are supported.", 400);
  }

  let sourceText: string;

  try {
    const response = await fetch(sourceUrl, {
      headers: {
        "user-agent": "CookbookAI recipe importer",
      },
      signal: AbortSignal.timeout(15_000),
    });

    if (!response.ok) {
      return jsonError("Could not fetch the recipe URL.", 502);
    }

    const contentType = response.headers.get("content-type") ?? "";
    const rawText = await response.text();
    const jsonLdRecipe =
      ENABLE_STRUCTURED_DATA_IMPORT && contentType.includes("html")
        ? extractRecipeFromJsonLd(rawText, sourceUrl.toString())
        : null;

    if (jsonLdRecipe) {
      return new Response(JSON.stringify(jsonLdRecipe), {
        headers: {
          "content-type": "text/plain; charset=utf-8",
          "x-cookbookai-stream": "recipe-import",
        },
      });
    }

    sourceText = contentType.includes("html") ? stripHtml(rawText) : rawText;
  } catch {
    return jsonError("Could not fetch the recipe URL.", 502);
  }

  const clippedSource =
    aiProvider === "ollama"
      ? prepareRecipeSourceForAi(sourceText, MAX_SOURCE_CHARS)
      : sourceText.slice(0, MAX_SOURCE_CHARS);
  let recipe: Record<string, unknown>;

  try {
    recipe = await extractRecipeWithAi(clippedSource, sourceUrl.toString());
  } catch (error) {
    console.error("[recipe-import] AI extraction failed", {
      provider: aiProvider,
      host: sourceUrl.hostname,
      sourceChars: clippedSource.length,
      error: error instanceof Error ? error.name : "UnknownError",
    });
    return jsonError("Could not extract the recipe from that URL.", 502);
  }

  return new Response(JSON.stringify(recipe), {
    headers: {
      "content-type": "text/plain; charset=utf-8",
      "x-cookbookai-stream": "recipe-import",
    },
  });
}
