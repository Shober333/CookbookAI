import {
  extractRecipeWithAi,
  getRecipeSourceLimit,
  prepareRecipeSourceForAi,
} from "@/lib/recipe-ai-extractor";
import { selectedAiProvider } from "@/lib/ai-provider";
import {
  BrowserbaseFetchError,
  isBrowserbaseFallbackEnabled,
  renderPublicRecipePageWithBrowserbase,
} from "@/lib/browserbase-fetch";
import { extractRecipeFromJsonLd } from "@/lib/recipe-jsonld";
import {
  copyRecipeForUser,
  createRecipeForUser,
  findRecipeByNormalizedSourceUrl,
} from "@/lib/recipe-service";
import { recipePayloadSchema } from "@/lib/recipe-schema";
import {
  extractRecipeTextFromYouTubeVideo,
  YouTubeVideoAiError,
} from "@/lib/youtube-video-ai";
import {
  fetchYouTubeDescriptionMetadata,
  fetchYouTubeTranscript,
  isYouTubeUrl,
  normalizeBareHost,
  YouTubeImportError,
} from "@/lib/youtube-import";
import type {
  RecipePayload,
  RecipeResponse,
  RecipeSourceImportMethod,
  RecipeSourceKind,
} from "@/types/recipe";

export const maxRecipeSourceChars = getRecipeSourceLimit();

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

// Matches quantity + unit patterns like "3/4 cup", "1 tablespoon", "200g" — strong recipe signal
const MEASUREMENT_PATTERN = /\d\s*(cup|tbsp|tablespoon|teaspoon|tsp|oz|g|kg|ml)\b/i;

export type RecipeImportSource =
  | { kind: "url"; url: string }
  | { kind: "text"; text: string; sourceUrl?: string | null };

export type RecipeImportResult = {
  recipe: RecipeResponse;
  reused?: boolean;
  sourceKind?: RecipeSourceKind;
  sourceUrl?: string | null;
  sourceVideoUrl?: string | null;
  sourceDomain?: string | null;
  sourceImportMethod?: RecipeSourceImportMethod | null;
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

    return importRecipeFromUrl(userId, source.url, { sourceKind: "url" });
  }

  const payload = await extractRecipePayload(source);
  const recipe = await createRecipeForUser(userId, {
    ...payload,
    sourceKind: "text",
    sourceImportMethod: "text",
  });

  return {
    recipe,
    reused: false,
    sourceKind: "text",
    sourceUrl: payload.sourceUrl ?? null,
    sourceVideoUrl: null,
    sourceImportMethod: "text",
  };
}

async function importRecipeFromUrl(
  userId: string,
  value: string,
  metadata: {
    sourceKind: RecipeSourceKind;
    sourceVideoUrl?: string | null;
  },
): Promise<RecipeImportResult> {
  const sourceUrl = normalizeImportableUrl(value);
  const existing = await findRecipeByNormalizedSourceUrl(sourceUrl);

  if (existing) {
    const recipe = await copyRecipeForUser(userId, existing, {
      sourceVideoUrl: metadata.sourceVideoUrl ?? null,
      sourceKind: metadata.sourceKind,
    });

    return {
      recipe,
      reused: true,
      sourceKind: metadata.sourceKind,
      sourceUrl,
      sourceVideoUrl: metadata.sourceVideoUrl ?? null,
      sourceImportMethod: recipe.sourceImportMethod,
    };
  }

  const payload = await extractRecipePayloadFromUrl(sourceUrl);
  const recipe = await createRecipeForUser(userId, {
    ...payload,
    sourceKind: metadata.sourceKind,
    sourceVideoUrl: metadata.sourceVideoUrl ?? null,
  });

  return {
    recipe,
    reused: false,
    sourceKind: metadata.sourceKind,
    sourceUrl: payload.sourceUrl ?? sourceUrl,
    sourceVideoUrl: metadata.sourceVideoUrl ?? null,
    sourceImportMethod: payload.sourceImportMethod ?? "fetch",
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

  for (const candidateUrl of metadata.candidateUrls) {
    try {
      const videoUrl = normalizeImportableUrl(url);
      const result = await importRecipeFromUrl(userId, candidateUrl, {
        sourceKind: "youtube-link",
        sourceVideoUrl: videoUrl,
      });

      return {
        ...result,
        sourceKind: "youtube-link",
        sourceUrl: normalizeImportableUrl(candidateUrl),
        sourceVideoUrl: videoUrl,
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

  const descriptionResult = await tryImportYouTubeText(userId, {
    text: metadata.description,
    sourceUrl: url,
    sourceVideoUrl: normalizeImportableUrl(url),
    sourceKind: "youtube-description",
  });

  if (descriptionResult) {
    return descriptionResult;
  }

  const transcript = await tryFetchYouTubeTranscript(url);

  if (transcript) {
    const transcriptResult = await tryImportYouTubeText(userId, {
      text: transcript,
      sourceUrl: url,
      sourceVideoUrl: normalizeImportableUrl(url),
      sourceKind: "youtube-transcript",
    });

    if (transcriptResult) {
      return transcriptResult;
    }
  }

  const directVideoText = await tryFetchYouTubeVideoRecipeText(url);

  if (directVideoText) {
    const directVideoResult = await tryImportYouTubeText(userId, {
      text: directVideoText,
      sourceUrl: url,
      sourceVideoUrl: normalizeImportableUrl(url),
      sourceKind: "youtube-direct-video",
      sourceImportMethod: "video-ai",
    });

    if (directVideoResult) {
      return directVideoResult;
    }
  }

  throw new RecipeImportError(
    "We couldn't find a recipe in that YouTube video. Paste the recipe text directly if the creator included it elsewhere.",
    422,
  );
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
  return RECIPE_KEYWORDS.some((kw) => lower.includes(kw)) || MEASUREMENT_PATTERN.test(text);
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
  return selectedAiProvider === "ollama"
    ? prepareRecipeSourceForAi(sourceText, maxRecipeSourceChars)
    : sourceText.slice(0, maxRecipeSourceChars);
}

async function extractRecipePayloadFromUrl(value: string): Promise<RecipePayload> {
  const sourceUrl = normalizeImportableUrl(value);
  let rendered = await fetchRecipeSourceWithOptionalFallback(sourceUrl);

  if (ENABLE_STRUCTURED_DATA_IMPORT && rendered.contentType.includes("html")) {
    const jsonLdRecipe = extractRecipeFromJsonLd(rendered.rawText, sourceUrl);
    const parsed = recipePayloadSchema.safeParse(jsonLdRecipe);

    if (parsed.success) {
      return {
        ...parsed.data,
        sourceImportMethod: rendered.sourceImportMethod,
      };
    }
  }

  if (!looksLikeRecipeSource(rendered.sourceText) && shouldTryBrowserbaseFallback(rendered)) {
    rendered = await fetchRecipeSourceWithBrowserbase(sourceUrl);
  }

  if (!looksLikeRecipeSource(rendered.sourceText)) {
    throw new RecipeImportError(
      "We couldn't find a recipe at that link. Make sure it's a page with ingredients and steps.",
      422,
    );
  }

  const payload = await extractPayloadWithAi(
    clipSourceForAi(rendered.sourceText),
    sourceUrl,
  );

  return {
    ...payload,
    sourceUrl,
    sourceImportMethod: rendered.sourceImportMethod,
  };
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

  const payload = await extractPayloadWithAi(
    clipSourceForAi(sourceText),
    normalizedSourceUrl,
  );

  return {
    ...payload,
    sourceImportMethod: "text",
  };
}

type FetchedRecipeSource = {
  rawText: string;
  sourceText: string;
  contentType: string;
  sourceImportMethod: RecipeSourceImportMethod;
};

async function fetchRecipeSourceWithOptionalFallback(
  sourceUrl: string,
): Promise<FetchedRecipeSource> {
  try {
    return {
      ...(await fetchRecipeSource(sourceUrl)),
      sourceImportMethod: "fetch",
    };
  } catch (error) {
    if (!isBrowserbaseFallbackEnabled()) throw error;
    return fetchRecipeSourceWithBrowserbase(sourceUrl);
  }
}

async function fetchRecipeSourceWithBrowserbase(
  sourceUrl: string,
): Promise<FetchedRecipeSource> {
  try {
    const rendered = await renderPublicRecipePageWithBrowserbase(sourceUrl);
    return {
      rawText: rendered.rawText,
      sourceText: rendered.sourceText,
      contentType: rendered.contentType,
      sourceImportMethod: "browserbase",
    };
  } catch (error) {
    if (error instanceof BrowserbaseFetchError) {
      throw new RecipeImportError(error.message, error.status);
    }

    throw error;
  }
}

function shouldTryBrowserbaseFallback(source: FetchedRecipeSource): boolean {
  return (
    isBrowserbaseFallbackEnabled() &&
    source.sourceImportMethod !== "browserbase" &&
    source.contentType.includes("html")
  );
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
    if (isProviderConfigurationError(error)) {
      throw new RecipeImportError(
        "The configured AI provider is unavailable. Check the provider key and model settings.",
        503,
      );
    }

    console.error("[recipe-import] AI extraction failed", {
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

function isProviderConfigurationError(error: unknown): boolean {
  if (!(error instanceof Error)) return false;

  return (
    error.message.includes("missing GEMINI_API_KEY") ||
    error.message.includes("Gemini generation failed") ||
    error.message.includes("Gemini generation returned no content") ||
    error.message.includes("missing GROQ_API_KEY") ||
    error.message.includes("Groq generation failed") ||
    error.message.includes("Groq generation returned no content") ||
    error.message.includes("401") ||
    error.message.includes("403")
  );
}

async function tryImportYouTubeText(
  userId: string,
  params: {
    text: string;
    sourceUrl: string;
    sourceVideoUrl: string;
    sourceKind: Extract<
      RecipeSourceKind,
      "youtube-description" | "youtube-transcript" | "youtube-direct-video"
    >;
    sourceImportMethod?: RecipeSourceImportMethod;
  },
): Promise<RecipeImportResult | null> {
  try {
    const payload = await extractRecipePayload({
      kind: "text",
      text: params.text,
      sourceUrl: params.sourceUrl,
    });
    const recipe = await createRecipeForUser(userId, {
      ...payload,
      sourceKind: params.sourceKind,
      sourceVideoUrl: params.sourceVideoUrl,
      sourceImportMethod: params.sourceImportMethod ?? payload.sourceImportMethod,
    });
    const sourceUrl = payload.sourceUrl ?? normalizeImportableUrl(params.sourceUrl);

    return {
      recipe,
      reused: false,
      sourceKind: params.sourceKind,
      sourceUrl,
      sourceVideoUrl: params.sourceVideoUrl,
      sourceImportMethod:
        params.sourceImportMethod ?? payload.sourceImportMethod ?? "text",
    };
  } catch (error) {
    if (error instanceof RecipeImportError) {
      if (error.status === 503) throw error;
      return null;
    }

    throw error;
  }
}

async function tryFetchYouTubeVideoRecipeText(url: string): Promise<string | null> {
  try {
    const extraction = await extractRecipeTextFromYouTubeVideo(url);
    return extraction?.recipeText ?? null;
  } catch (error) {
    if (error instanceof YouTubeVideoAiError) {
      if (error.status === 503) {
        throw new RecipeImportError(error.message, error.status);
      }
      return null;
    }

    throw error;
  }
}

async function tryFetchYouTubeTranscript(url: string): Promise<string | null> {
  try {
    return await fetchYouTubeTranscript(url);
  } catch (error) {
    if (error instanceof YouTubeImportError) {
      return null;
    }

    throw error;
  }
}
