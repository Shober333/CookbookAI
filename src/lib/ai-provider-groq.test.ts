import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { recipeJsonSchema } from "./recipe-ai-extractor";
import { recipePayloadSchema } from "./recipe-schema";

describe("Groq provider", () => {
  const originalApiKey = process.env.GROQ_API_KEY;
  const originalModel = process.env.GROQ_MODEL;

  beforeEach(() => {
    vi.resetModules();
    vi.stubGlobal("fetch", vi.fn());
    process.env.GROQ_API_KEY = "test-groq-key";
    process.env.GROQ_MODEL = "openai/gpt-oss-120b";
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
    await expect(
      generateRecipeObject({
        schema: recipeJsonSchema,
        zodSchema: recipePayloadSchema,
        schemaName: "Recipe",
        schemaDescription: "A complete structured cooking recipe.",
        system: "Extract a recipe.",
        prompt: "Ingredients and instructions.",
      }),
    ).rejects.toThrow("missing GROQ_API_KEY");

    expect(fetch).not.toHaveBeenCalled();
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
