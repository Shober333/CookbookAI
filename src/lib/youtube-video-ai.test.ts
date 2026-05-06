import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { extractRecipeTextFromYouTubeVideo } from "./youtube-video-ai";

describe("extractRecipeTextFromYouTubeVideo", () => {
  const originalEnabled = process.env.AI_VIDEO_TRANSCRIPTION_ENABLED;
  const originalProvider = process.env.AI_VIDEO_PROVIDER;
  const originalGeminiKey = process.env.GEMINI_API_KEY;
  const originalModel = process.env.AI_VIDEO_MODEL;

  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
    process.env.AI_VIDEO_TRANSCRIPTION_ENABLED = "true";
    process.env.AI_VIDEO_PROVIDER = "gemini";
    process.env.GEMINI_API_KEY = "test-gemini-key";
    process.env.AI_VIDEO_MODEL = "gemini-2.5-flash";
  });

  afterEach(() => {
    process.env.AI_VIDEO_TRANSCRIPTION_ENABLED = originalEnabled;
    process.env.AI_VIDEO_PROVIDER = originalProvider;
    process.env.GEMINI_API_KEY = originalGeminiKey;
    process.env.AI_VIDEO_MODEL = originalModel;
    vi.unstubAllGlobals();
  });

  it("returns null without network when video fallback is disabled", async () => {
    process.env.AI_VIDEO_TRANSCRIPTION_ENABLED = "false";

    await expect(
      extractRecipeTextFromYouTubeVideo("https://www.youtube.com/watch?v=abc1234"),
    ).resolves.toBeNull();
    expect(fetch).not.toHaveBeenCalled();
  });

  it("sends the YouTube URL to Gemini and parses recipe text", async () => {
    vi.mocked(fetch).mockResolvedValue(
      Response.json({
        candidates: [
          {
            content: {
              parts: [
                {
                  text: JSON.stringify({
                    hasRecipe: true,
                    recipeText: "Ingredients: 1 cup rice. Steps: Cook it.",
                    notes: "Extracted from video.",
                  }),
                },
              ],
            },
          },
        ],
      }),
    );

    const result = await extractRecipeTextFromYouTubeVideo(
      "https://www.youtube.com/watch?v=abc1234",
    );

    expect(result?.recipeText).toContain("1 cup rice");
    expect(fetch).toHaveBeenCalledWith(
      expect.objectContaining({
        hostname: "generativelanguage.googleapis.com",
        pathname: "/v1beta/models/gemini-2.5-flash:generateContent",
      }),
      expect.objectContaining({
        method: "POST",
        body: expect.stringContaining(
          '"file_uri":"https://www.youtube.com/watch?v=abc1234"',
        ),
      }),
    );
  });

  it("returns null when Gemini says the video has no recipe", async () => {
    vi.mocked(fetch).mockResolvedValue(
      Response.json({
        candidates: [
          {
            content: {
              parts: [
                {
                  text: JSON.stringify({
                    hasRecipe: false,
                    recipeText: "",
                    notes: "No cooking instructions.",
                  }),
                },
              ],
            },
          },
        ],
      }),
    );

    await expect(
      extractRecipeTextFromYouTubeVideo("https://www.youtube.com/watch?v=abc1234"),
    ).resolves.toBeNull();
  });

  it("rejects unsupported video providers before network calls", async () => {
    process.env.AI_VIDEO_PROVIDER = "groq";

    await expect(
      extractRecipeTextFromYouTubeVideo("https://www.youtube.com/watch?v=abc1234"),
    ).rejects.toThrow("video-capable AI provider");
    expect(fetch).not.toHaveBeenCalled();
  });
});
