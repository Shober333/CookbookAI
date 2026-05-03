import { aiProvider, isOllamaCloudModel } from "@/lib/anthropic";
import {
  extractRecipeWithAi,
  prepareRecipeSourceForAi,
} from "@/lib/recipe-ai-extractor";
import { extractRecipeFromJsonLd } from "@/lib/recipe-jsonld";
import {
  copyRecipeForUser,
  createRecipeForUser,
  findRecipeByNormalizedSourceUrl,
} from "@/lib/recipe-service";
import { recipePayloadSchema } from "@/lib/recipe-schema";
import {
  fetchYouTubeDescriptionMetadata,
  isYouTubeUrl,
  normalizeBareHost,
  YouTubeImportError,
} from "@/lib/youtube-import";
import type { RecipePayload, RecipeResponse } from "@/types/recipe";

export const maxRecipeSourceChars =
  aiProvider !== "ollama" ? 60_000 : isOllamaCloudModel ? 15_000 : 3_500;

const ENABLE_STRUCTURED_DATA_IMPORT =
  process.env.ENABLE_RECIPE_STRUCTURED_DATA_IMPORT === "true";
const MIN_TEXT_IMPORT_CHARS = 80;
const RECIPE_KEYWORDS = [
  "ingredient",
  "instructions",
  "directions",
  "how to make",
  "prep time",
  "cook time",
];

export type RecipeImportSource =
  | { kind: "url"; url: string }
  | { kind: "text"; text: string; sourceUrl?: string | null };

export type RecipeImportResult = {
  recipe: RecipeResponse;
  reused?: boolean;
  sourceKind?: "url" | "text" | "youtube-link" | "youtube-description";
  sourceUrl?: string | null;
  sourceDomain?: string | null;
};

export class RecipeImportError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = "RecipeImportError";
  }
}

export async function importRecipeForUser(
  userId: string,
  source: RecipeImportSource,
): Promise<RecipeImportResult> {
  if (source.kind === "url") {
    if (isYouTubeUrl(source.url)) {
      return importRecipeFromYouTube(userId, source.url);
    }

    const sourceUrl = normalizeImportableUrl(source.url);
    const existing = await findRecipeByNormalizedSourceUrl(sourceUrl);

    if (existing) {
      const recipe = await copyRecipeForUser(userId, existing);

      return {
        recipe,
        reused: true,
        sourceKind: "url",
        sourceUrl,
      };
    }
  }

  const payload = await extractRecipePayload(source);
  const recipe = await createRecipeForUser(userId, payload);

  return {
    recipe,
    reused: false,
    sourceKind: source.kind,
    sourceUrl: payload.sourceUrl ?? null,
  };
}

async function importRecipeFromYouTube(
  userId: string,
  url: string,
): Promise<RecipeImportResult> {
  let metadata: Awaited<ReturnType<typeof fetchYouTubeDescriptionMetadata>>;

  try {
    metadata = await fetchYouTubeDescriptionMetadata(url);
  } catch (error) {
    if (error instanceof YouTubeImportError) {
      throw new RecipeImportError(error.message, error.status);
    }

    throw error;
  }

  const candidateUrl = metadata.candidateUrls[0];

  if (candidateUrl) {
    try {
      const result = await importRecipeForUser(userId, {
        kind: "url",
        url: candidateUrl,
      });

      return {
        ...result,
        sourceKind: "youtube-link",
        sourceUrl: normalizeImportableUrl(candidateUrl),
        sourceDomain: normalizeBareHost(new URL(candidateUrl).hostname),
      };
    } catch (error) {
      if (
        !(error instanceof RecipeImportError) ||
        (error.status !== 422 && error.status !== 502)
      ) {
        throw error;
      }
    }
  }

  try {
    const payload = await extractRecipePayload({
      kind: "text",
      text: metadata.description,
      sourceUrl: url,
    });
    const recipe = await createRecipeForUser(userId, payload);

    return {
      recipe,
      reused: false,
      sourceKind: "youtube-description",
      sourceUrl: payload.sourceUrl ?? normalizeImportableUrl(url),
    };
  } catch (error) {
    if (error instanceof RecipeImportError) {
      throw new RecipeImportError(
        "We couldn't find a recipe in that YouTube description. Paste the recipe text directly if the creator included it elsewhere.",
        422,
      );
    }

    throw error;
  }
}

export async function extractRecipePayload(
  source: RecipeImportSource,
): Promise<RecipePayload> {
  if (source.kind === "url") {
    return extractRecipePayloadFromUrl(source.url);
  }

  return extractRecipePayloadFromText(source.text, source.sourceUrl ?? null);
}

export function looksLikeRecipeSource(text: string): boolean {
  const lower = text.toLowerCase();
  return RECIPE_KEYWORDS.some((kw) => lower.includes(kw));
}

export function stripHtml(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function normalizeImportableUrl(value: string): string {
  let url: URL;

  try {
    url = new URL(value);
  } catch {
    throw new RecipeImportError("A valid recipe URL is required.", 400);
  }

  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new RecipeImportError(
      "Only HTTP and HTTPS recipe URLs are supported.",
      400,
    );
  }

  return url.toString();
}

function clipSourceForAi(sourceText: string): string {
  return aiProvider === "ollama"
    ? prepareRecipeSourceForAi(sourceText, maxRecipeSourceChars)
    : sourceText.slice(0, maxRecipeSourceChars);
}

async function extractRecipePayloadFromUrl(value: string): Promise<RecipePayload> {
  const sourceUrl = normalizeImportableUrl(value);
  const { rawText, sourceText, contentType } = await fetchRecipeSource(sourceUrl);

  if (ENABLE_STRUCTURED_DATA_IMPORT && contentType.includes("html")) {
    const jsonLdRecipe = extractRecipeFromJsonLd(rawText, sourceUrl);
    const parsed = recipePayloadSchema.safeParse(jsonLdRecipe);

    if (parsed.success) {
      return parsed.data;
    }
  }

  if (!looksLikeRecipeSource(sourceText)) {
    throw new RecipeImportError(
      "We couldn't find a recipe at that link. Make sure it's a page with ingredients and steps.",
      422,
    );
  }

  return extractPayloadWithAi(clipSourceForAi(sourceText), sourceUrl);
}

async function extractRecipePayloadFromText(
  value: string,
  sourceUrl: string | null,
): Promise<RecipePayload> {
  const text = value.trim();

  if (text.length < MIN_TEXT_IMPORT_CHARS) {
    throw new RecipeImportError(
      "Paste a little more of the recipe so we can find the ingredients and steps.",
      400,
    );
  }

  const normalizedSourceUrl =
    sourceUrl === null ? null : normalizeImportableUrl(sourceUrl);
  const sourceText = stripHtml(text);

  if (!looksLikeRecipeSource(sourceText)) {
    throw new RecipeImportError(
      "We couldn't find a recipe in that text. Make sure it includes ingredients and steps.",
      422,
    );
  }

  return extractPayloadWithAi(clipSourceForAi(sourceText), normalizedSourceUrl);
}

async function fetchRecipeSource(sourceUrl: string): Promise<{
  rawText: string;
  sourceText: string;
  contentType: string;
}> {
  try {
    const response = await fetch(sourceUrl, {
      headers: {
        "user-agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
        accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
        "accept-language": "en-US,en;q=0.9",
      },
      signal: AbortSignal.timeout(15_000),
    });

    if (!response.ok) {
      throw new RecipeImportError(
        `We couldn't fetch that page (HTTP ${response.status}). The site may be blocking automated access.`,
        502,
      );
    }

    const contentType = response.headers.get("content-type") ?? "";
    const rawText = await response.text();

    return {
      rawText,
      sourceText: contentType.includes("html") ? stripHtml(rawText) : rawText,
      contentType,
    };
  } catch (error) {
    if (error instanceof RecipeImportError) throw error;

    throw new RecipeImportError(
      "We couldn't reach that page. Check the URL and try again.",
      502,
    );
  }
}

async function extractPayloadWithAi(
  sourceText: string,
  sourceUrl: string | null,
): Promise<RecipePayload> {
  let recipe: Record<string, unknown>;

  try {
    recipe = await extractRecipeWithAi(sourceText, sourceUrl);
  } catch (error) {
    console.error("[recipe-import] AI extraction failed", {
      provider: aiProvider,
      host: sourceUrl ? new URL(sourceUrl).hostname : null,
      sourceChars: sourceText.length,
      error: error instanceof Error ? error.name : "UnknownError",
    });
    throw new RecipeImportError(
      sourceUrl
        ? "Could not extract the recipe from that URL."
        : "Could not extract the recipe from that text.",
      502,
    );
  }

  if (typeof recipe.error === "string") {
    throw new RecipeImportError(recipe.error, 422);
  }

  const parsed = recipePayloadSchema.safeParse(recipe);

  if (!parsed.success) {
    throw new RecipeImportError(
      "We couldn't extract a complete recipe from that source. Try another link, or paste the recipe text directly.",
      422,
    );
  }

  return parsed.data;
}
