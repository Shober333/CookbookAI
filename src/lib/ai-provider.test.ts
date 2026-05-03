import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { generateRecipeObject } from "./ai-provider";
import { recipeJsonSchema } from "./recipe-ai-extractor";
import { recipePayloadSchema } from "./recipe-schema";

vi.mock("@/lib/anthropic", () => ({
  aiProvider: "gemini",
  claudeModel: {},
  isOllamaCloudModel: false,
  ollamaBaseUrl: "http://localhost:11434",
  ollamaModel: "test-model",
  recipeExtractionProviderOptions: undefined,
}));

describe("generateRecipeObject with Gemini", () => {
  const originalApiKey = process.env.GEMINI_API_KEY;
  const originalModel = process.env.GEMINI_MODEL;

  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
    process.env.GEMINI_API_KEY = "test-gemini-key";
    process.env.GEMINI_MODEL = "gemini-2.5-flash";
  });

  afterEach(() => {
    process.env.GEMINI_API_KEY = originalApiKey;
    process.env.GEMINI_MODEL = originalModel;
    vi.unstubAllGlobals();
  });

  it("calls Gemini JSON mode and parses the returned recipe object", async () => {
    vi.mocked(fetch).mockResolvedValue(
      Response.json({
        candidates: [
          {
            content: {
              parts: [
                {
                  text: JSON.stringify({
                    title: "Tomato Soup",
                    servings: 4,
                    ingredients: [{ amount: 1, unit: "cup", name: "tomatoes" }],
                    steps: ["Simmer."],
                    tags: ["soup"],
                  }),
                },
              ],
            },
          },
        ],
      }),
    );

    const result = await generateRecipeObject({
      schema: recipeJsonSchema,
      zodSchema: recipePayloadSchema,
      schemaName: "Recipe",
      schemaDescription: "A complete structured cooking recipe.",
      system: "Extract a recipe.",
      prompt: "Ingredients and instructions.",
    });

    expect(result).toMatchObject({ title: "Tomato Soup" });
    expect(fetch).toHaveBeenCalledWith(
      expect.objectContaining({
        hostname: "generativelanguage.googleapis.com",
        pathname: "/v1beta/models/gemini-2.5-flash:generateContent",
      }),
      expect.objectContaining({
        method: "POST",
        body: expect.stringContaining('"responseMimeType":"application/json"'),
      }),
    );
  });

  it("fails before network calls when GEMINI_API_KEY is missing", async () => {
    delete process.env.GEMINI_API_KEY;

    await expect(
      generateRecipeObject({
        schema: recipeJsonSchema,
        zodSchema: recipePayloadSchema,
        schemaName: "Recipe",
        schemaDescription: "A complete structured cooking recipe.",
        system: "Extract a recipe.",
        prompt: "Ingredients and instructions.",
      }),
    ).rejects.toThrow("missing GEMINI_API_KEY");

    expect(fetch).not.toHaveBeenCalled();
  });
});
