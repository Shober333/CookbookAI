import { parseJsonObjectFromText } from "@/lib/recipe-utils";
import { isYouTubeUrl } from "@/lib/youtube-import";

export type YouTubeVideoRecipeExtraction = {
  hasRecipe: boolean;
  recipeText: string;
  notes: string;
};

export class YouTubeVideoAiError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = "YouTubeVideoAiError";
  }
}

export function isAiVideoTranscriptionEnabled(): boolean {
  return process.env.AI_VIDEO_TRANSCRIPTION_ENABLED === "true";
}

export async function extractRecipeTextFromYouTubeVideo(
  url: string,
): Promise<YouTubeVideoRecipeExtraction | null> {
  if (!isAiVideoTranscriptionEnabled()) return null;

  if (!isYouTubeUrl(url)) {
    throw new YouTubeVideoAiError("That YouTube URL is not supported.", 400);
  }

  const provider = process.env.AI_VIDEO_PROVIDER ?? "gemini";

  if (provider !== "gemini") {
    throw new YouTubeVideoAiError(
      "Direct video import needs a video-capable AI provider.",
      503,
    );
  }

  return extractWithGeminiVideo(url);
}

async function extractWithGeminiVideo(
  url: string,
): Promise<YouTubeVideoRecipeExtraction | null> {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    throw new YouTubeVideoAiError(
      "Direct video import needs a configured Gemini API key.",
      503,
    );
  }

  const model =
    process.env.AI_VIDEO_MODEL ??
    process.env.GEMINI_MODEL ??
    "gemini-2.5-flash";
  const requestUrl = new URL(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
  );
  requestUrl.searchParams.set("key", apiKey);

  const response = await fetch(requestUrl, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      contents: [
        {
          role: "user",
          parts: [
            {
              text:
                "Watch this public YouTube video and extract only recipe-relevant " +
                "content. Return JSON with hasRecipe, recipeText, and notes. " +
                "recipeText should include ingredients, amounts, timings, and ordered " +
                "steps when present. If there is no cookable recipe, set hasRecipe false.",
            },
            {
              file_data: {
                file_uri: url,
              },
            },
          ],
        },
      ],
      generationConfig: {
        temperature: 0,
        responseMimeType: "application/json",
        responseSchema: {
          type: "object",
          required: ["hasRecipe", "recipeText", "notes"],
          properties: {
            hasRecipe: { type: "boolean" },
            recipeText: { type: "string" },
            notes: { type: "string" },
          },
        },
      },
    }),
    signal: AbortSignal.timeout(getVideoTimeoutMs()),
  });

  if (!response.ok) {
    throw new YouTubeVideoAiError(
      `Direct video import failed (${response.status}).`,
      response.status === 401 || response.status === 403 ? 503 : 502,
    );
  }

  const body = (await response.json()) as {
    candidates?: Array<{
      content?: {
        parts?: Array<{ text?: string }>;
      };
    }>;
  };
  const content = body.candidates?.[0]?.content?.parts
    ?.map((part) => part.text ?? "")
    .join("")
    .trim();

  if (!content) {
    throw new YouTubeVideoAiError("Direct video import returned no content.", 502);
  }

  const parsed = parseJsonObjectFromText(content) as Record<string, unknown>;
  const hasRecipe = parsed.hasRecipe === true;
  const recipeText =
    typeof parsed.recipeText === "string" ? parsed.recipeText.trim() : "";
  const notes = typeof parsed.notes === "string" ? parsed.notes.trim() : "";

  if (!hasRecipe || recipeText.length === 0) return null;

  return { hasRecipe, recipeText, notes };
}

function getVideoTimeoutMs(): number {
  const timeout = Number(process.env.AI_VIDEO_TIMEOUT_MS);
  return Number.isInteger(timeout) && timeout > 0 ? timeout : 120_000;
}
