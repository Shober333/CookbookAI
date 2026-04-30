import { streamText } from "ai";
import {
  claudeModel,
  recipeExtractionProviderOptions,
  recipeExtractionSystemPrompt,
} from "@/lib/anthropic";
import { importRecipeSchema } from "@/lib/recipe-schema";
import { getAuthenticatedUserId, jsonError } from "@/lib/route-helpers";

export const maxDuration = 60;

const MAX_SOURCE_CHARS = 60_000;

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
    sourceText = contentType.includes("html") ? stripHtml(rawText) : rawText;
  } catch {
    return jsonError("Could not fetch the recipe URL.", 502);
  }

  const clippedSource = sourceText.slice(0, MAX_SOURCE_CHARS);

  const result = streamText({
    model: claudeModel,
    system: recipeExtractionSystemPrompt,
    prompt: `Source URL: ${sourceUrl.toString()}

Extract the recipe from this source text and return only JSON.

${clippedSource}`,
    providerOptions: recipeExtractionProviderOptions,
  });

  return result.toTextStreamResponse({
    headers: {
      "x-cookbookai-stream": "recipe-import",
    },
  });
}
