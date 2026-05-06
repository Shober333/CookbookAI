import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { recipeJsonSchema } from "./recipe-ai-extractor";
import { recipePayloadSchema } from "./recipe-schema";

describe("Groq provider", () => {
  const originalApiKey = process.env.GROQ_API_KEY;
  const originalModel = process.env.GROQ_MODEL;
  const originalTimeout = process.env.AI_EXTRACTION_TIMEOUT_MS;

  const request = {
    schema: recipeJsonSchema,
    zodSchema: recipePayloadSchema,
    schemaName: "Recipe",
    schemaDescription: "A complete structured cooking recipe.",
    system: "Extract a recipe.",
    prompt: "Ingredients and instructions.",
  };

  beforeEach(() => {
    vi.resetModules();
    vi.stubGlobal("fetch", vi.fn());
    process.env.GROQ_API_KEY = "test-groq-key";
    process.env.GROQ_MODEL = "openai/gpt-oss-120b";
    delete process.env.AI_EXTRACTION_TIMEOUT_MS;
    vi.doMock("@/lib/anthropic", () => ({
      aiProvider: "groq",
      claudeModel: {},
      isOllamaCloudModel: false,
      ollamaBaseUrl: "http://localhost:11434",
      ollamaModel: "test-model",
      recipeExtractionProviderOptions: undefined,
    }));
  });

  afterEach(() => {
    process.env.GROQ_API_KEY = originalApiKey;
    process.env.GROQ_MODEL = originalModel;
    process.env.AI_EXTRACTION_TIMEOUT_MS = originalTimeout;
    vi.doUnmock("@/lib/anthropic");
    vi.unstubAllGlobals();
  });

  it("calls Groq strict JSON schema mode and parses the returned object", async () => {
    vi.mocked(fetch).mockResolvedValue(
      Response.json({
        choices: [
          {
            message: {
              content: JSON.stringify({
                title: "Tomato Soup",
                servings: 4,
                ingredients: [{ amount: 1, unit: "cup", name: "tomatoes" }],
                steps: ["Simmer."],
                tags: ["soup"],
              }),
            },
          },
        ],
      }),
    );

    const { generateRecipeObject } = await import("./ai-provider");
    const result = await generateRecipeObject(request);

    expect(result).toMatchObject({ title: "Tomato Soup" });
    expect(fetch).toHaveBeenCalledWith(
      "https://api.groq.com/openai/v1/chat/completions",
      expect.objectContaining({
        method: "POST",
        body: expect.stringContaining('"model":"openai/gpt-oss-120b"'),
      }),
    );
    expect(fetch).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        body: expect.stringContaining('"strict":true'),
      }),
    );
  });

  it("fails before network calls when GROQ_API_KEY is missing", async () => {
    delete process.env.GROQ_API_KEY;

    const { generateRecipeObject } = await import("./ai-provider");
    await expect(generateRecipeObject(request)).rejects.toThrow(
      "missing GROQ_API_KEY",
    );

    expect(fetch).not.toHaveBeenCalled();
  });

  it.each([
    [401, "Unauthorized"],
    [403, "Forbidden"],
    [429, "Rate limit reached"],
    [500, "Internal server error"],
    [503, "Service unavailable"],
  ])("maps Groq HTTP %i responses to controlled errors", async (status, message) => {
    vi.mocked(fetch).mockResolvedValue(
      Response.json({ error: { message } }, { status }),
    );

    const { generateRecipeObject } = await import("./ai-provider");

    await expect(generateRecipeObject(request)).rejects.toThrow(
      `Groq generation failed: ${message}`,
    );
  });

  it("surfaces Groq schema refusals without returning bad structured data", async () => {
    vi.mocked(fetch).mockResolvedValue(
      Response.json({
        choices: [
          {
            message: {
              content: null,
              refusal: "The request could not be completed.",
            },
          },
        ],
      }),
    );

    const { generateRecipeObject } = await import("./ai-provider");

    await expect(generateRecipeObject(request)).rejects.toThrow(
      "Groq generation refused: The request could not be completed.",
    );
  });

  it("rejects malformed Groq content instead of returning a partial recipe", async () => {
    vi.mocked(fetch).mockResolvedValue(
      Response.json({
        choices: [{ message: { content: "not json" } }],
      }),
    );

    const { generateRecipeObject } = await import("./ai-provider");

    await expect(generateRecipeObject(request)).rejects.toThrow(
      "No JSON object found",
    );
  });

  it("passes an abort signal to Groq requests for timeout handling", async () => {
    process.env.AI_EXTRACTION_TIMEOUT_MS = "25";
    vi.mocked(fetch).mockResolvedValue(
      Response.json({
        choices: [
          {
            message: {
              content: JSON.stringify({
                title: "Tomato Soup",
                servings: 4,
                ingredients: [{ amount: 1, unit: "cup", name: "tomatoes" }],
                steps: ["Simmer."],
                tags: ["soup"],
              }),
            },
          },
        ],
      }),
    );

    const { generateRecipeObject } = await import("./ai-provider");
    await generateRecipeObject(request);

    const init = vi.mocked(fetch).mock.calls[0]?.[1] as RequestInit | undefined;
    expect(init?.signal).toBeInstanceOf(AbortSignal);
  });
});

describe("toGroqStrictSchema", () => {
  it("requires every object property and makes optional properties nullable", async () => {
    vi.resetModules();
    vi.doMock("@/lib/anthropic", () => ({
      aiProvider: "ollama",
      claudeModel: {},
      isOllamaCloudModel: false,
      ollamaBaseUrl: "http://localhost:11434",
      ollamaModel: "test-model",
      recipeExtractionProviderOptions: undefined,
    }));
    const { toGroqStrictSchema } = await import("./ai-provider");
    const result = toGroqStrictSchema(recipeJsonSchema) as Record<string, unknown>;
    const ingredients = (result.properties as Record<string, unknown>)
      .ingredients as Record<string, unknown>;
    const ingredient = ingredients.items as Record<string, unknown>;
    const ingredientProps = ingredient.properties as Record<string, unknown>;

    expect(result).toMatchObject({
      additionalProperties: false,
      required: [
        "title",
        "description",
        "sourceUrl",
        "servings",
        "ingredients",
        "steps",
        "tags",
      ],
    });
    expect(ingredient.required).toEqual(["amount", "unit", "name", "notes"]);
    expect(ingredientProps.notes).toEqual({
      anyOf: [{ type: "string" }, { type: "null" }],
    });
    vi.doUnmock("@/lib/anthropic");
  });
});
