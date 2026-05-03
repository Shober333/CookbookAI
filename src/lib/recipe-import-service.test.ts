import type { Recipe } from "@prisma/client";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { importRecipeForUser } from "./recipe-import-service";

const mocks = vi.hoisted(() => ({
  copyRecipeForUser: vi.fn(),
  createRecipeForUser: vi.fn(),
  extractRecipeFromJsonLd: vi.fn(),
  extractRecipeWithAi: vi.fn(),
  fetchYouTubeDescriptionMetadata: vi.fn(),
  findRecipeByNormalizedSourceUrl: vi.fn(),
  isYouTubeUrl: vi.fn((_url: string) => false),
  normalizeBareHost: vi.fn((hostname: string) =>
    hostname.toLowerCase().replace(/^www\./, ""),
  ),
  prepareRecipeSourceForAi: vi.fn((text: string, maxChars: number) =>
    text.slice(0, maxChars),
  ),
  YouTubeImportError: class YouTubeImportError extends Error {
    constructor(
      message: string,
      readonly status: number,
    ) {
      super(message);
    }
  },
}));

vi.mock("@/lib/anthropic", () => ({
  aiProvider: "anthropic",
  isOllamaCloudModel: false,
}));

vi.mock("@/lib/recipe-ai-extractor", () => ({
  extractRecipeWithAi: mocks.extractRecipeWithAi,
  prepareRecipeSourceForAi: mocks.prepareRecipeSourceForAi,
}));

vi.mock("@/lib/recipe-jsonld", () => ({
  extractRecipeFromJsonLd: mocks.extractRecipeFromJsonLd,
}));

vi.mock("@/lib/recipe-service", () => ({
  copyRecipeForUser: mocks.copyRecipeForUser,
  createRecipeForUser: mocks.createRecipeForUser,
  findRecipeByNormalizedSourceUrl: mocks.findRecipeByNormalizedSourceUrl,
}));

vi.mock("@/lib/youtube-import", () => ({
  fetchYouTubeDescriptionMetadata: mocks.fetchYouTubeDescriptionMetadata,
  isYouTubeUrl: mocks.isYouTubeUrl,
  normalizeBareHost: mocks.normalizeBareHost,
  YouTubeImportError: mocks.YouTubeImportError,
}));

const recipeText =
  "Ingredients: 200 g spaghetti, 1 cup cheese, black pepper. Instructions: Cook the pasta, then toss with cheese and pepper.";

const recipePayload = {
  title: "Cacio e Pepe",
  description: null,
  sourceUrl: "https://example.com/cacio",
  servings: 2,
  ingredients: [{ amount: 200, unit: "g", name: "spaghetti" }],
  steps: ["Cook pasta.", "Toss with cheese."],
  tags: ["pasta"],
};

const recipeResponse = {
  ...recipePayload,
  id: "recipe-1",
  userId: "user-1",
  adaptedSteps: null,
  createdAt: "2026-05-03T00:00:00.000Z",
  updatedAt: "2026-05-03T00:00:00.000Z",
};

describe("importRecipeForUser", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.createRecipeForUser.mockResolvedValue(recipeResponse);
    mocks.extractRecipeWithAi.mockResolvedValue(recipePayload);
    mocks.findRecipeByNormalizedSourceUrl.mockResolvedValue(null);
    mocks.isYouTubeUrl.mockReturnValue(false);
    vi.stubGlobal("fetch", vi.fn());
  });

  it("imports pasted recipe text without fetching a URL", async () => {
    const result = await importRecipeForUser("user-1", {
      kind: "text",
      text: recipeText,
      sourceUrl: "https://example.com/cacio",
    });

    expect(fetch).not.toHaveBeenCalled();
    expect(mocks.extractRecipeWithAi).toHaveBeenCalledWith(
      recipeText,
      "https://example.com/cacio",
    );
    expect(mocks.createRecipeForUser).toHaveBeenCalledWith(
      "user-1",
      recipePayload,
    );
    expect(result).toEqual({
      recipe: recipeResponse,
      reused: false,
      sourceKind: "text",
      sourceUrl: "https://example.com/cacio",
    });
  });

  it("accepts recipe-like pasted HTML by stripping tags before AI extraction", async () => {
    await importRecipeForUser("user-1", {
      kind: "text",
      text: `<article><h1>Cacio</h1><p>${recipeText}</p></article>`,
    });

    expect(fetch).not.toHaveBeenCalled();
    expect(mocks.extractRecipeWithAi).toHaveBeenCalledWith(
      `Cacio ${recipeText}`,
      null,
    );
  });

  it("rejects short pasted text before calling AI", async () => {
    await expect(
      importRecipeForUser("user-1", { kind: "text", text: "Ingredients" }),
    ).rejects.toMatchObject({
      status: 400,
    });

    expect(mocks.extractRecipeWithAi).not.toHaveBeenCalled();
    expect(mocks.createRecipeForUser).not.toHaveBeenCalled();
  });

  it("rejects non-recipe pasted text before calling AI", async () => {
    await expect(
      importRecipeForUser("user-1", {
        kind: "text",
        text: "This is a long block of writing about a dinner party, but it never includes the markers needed to identify a recipe.",
      }),
    ).rejects.toMatchObject({
      status: 422,
    });

    expect(mocks.extractRecipeWithAi).not.toHaveBeenCalled();
    expect(mocks.createRecipeForUser).not.toHaveBeenCalled();
  });

  it("reuses an existing source URL without fetching or calling AI", async () => {
    const sourceRecipe = {
      id: "existing-1",
      userId: "other-user",
      title: "Cacio e Pepe",
      description: null,
      sourceUrl: "https://example.com/cacio",
      servings: 2,
      ingredients: JSON.stringify(recipePayload.ingredients),
      steps: JSON.stringify(recipePayload.steps),
      adaptedSteps: JSON.stringify(["Personal adaptation."]),
      tags: "pasta",
      createdAt: new Date("2026-05-02T00:00:00.000Z"),
      updatedAt: new Date("2026-05-02T00:00:00.000Z"),
    } satisfies Recipe;
    mocks.findRecipeByNormalizedSourceUrl.mockResolvedValue(sourceRecipe);
    mocks.copyRecipeForUser.mockResolvedValue({
      ...recipeResponse,
      id: "recipe-copy",
      adaptedSteps: null,
    });

    const result = await importRecipeForUser("user-1", {
      kind: "url",
      url: "https://example.com/cacio",
    });

    expect(mocks.copyRecipeForUser).toHaveBeenCalledWith(
      "user-1",
      sourceRecipe,
    );
    expect(fetch).not.toHaveBeenCalled();
    expect(mocks.extractRecipeWithAi).not.toHaveBeenCalled();
    expect(mocks.createRecipeForUser).not.toHaveBeenCalled();
    expect(result).toMatchObject({
      reused: true,
      sourceKind: "url",
      sourceUrl: "https://example.com/cacio",
      recipe: { id: "recipe-copy", adaptedSteps: null },
    });
  });

  it("fetches, extracts, and saves a unique URL import", async () => {
    vi.mocked(fetch).mockResolvedValue(
      new Response(`<main>${recipeText}</main>`, {
        headers: { "content-type": "text/html; charset=utf-8" },
      }),
    );

    const result = await importRecipeForUser("user-1", {
      kind: "url",
      url: "https://example.com/cacio",
    });

    expect(fetch).toHaveBeenCalledWith(
      "https://example.com/cacio",
      expect.objectContaining({ headers: expect.any(Object) }),
    );
    expect(mocks.extractRecipeWithAi).toHaveBeenCalledWith(
      recipeText,
      "https://example.com/cacio",
    );
    expect(mocks.createRecipeForUser).toHaveBeenCalledWith(
      "user-1",
      recipePayload,
    );
    expect(result).toMatchObject({
      reused: false,
      sourceKind: "url",
      recipe: recipeResponse,
    });
  });

  it("imports the first recipe candidate from a YouTube description", async () => {
    mocks.isYouTubeUrl.mockImplementation((url: string) =>
      url.includes("youtube.com"),
    );
    mocks.fetchYouTubeDescriptionMetadata.mockResolvedValue({
      videoId: "abc1234",
      title: "Pasta video",
      description: "Full recipe linked below.",
      candidateUrls: ["https://www.example.com/cacio"],
    });
    vi.mocked(fetch).mockResolvedValue(
      new Response(`<main>${recipeText}</main>`, {
        headers: { "content-type": "text/html; charset=utf-8" },
      }),
    );

    const result = await importRecipeForUser("user-1", {
      kind: "url",
      url: "https://www.youtube.com/watch?v=abc1234",
    });

    expect(mocks.fetchYouTubeDescriptionMetadata).toHaveBeenCalledWith(
      "https://www.youtube.com/watch?v=abc1234",
    );
    expect(fetch).toHaveBeenCalledWith(
      "https://www.example.com/cacio",
      expect.objectContaining({ headers: expect.any(Object) }),
    );
    expect(result).toMatchObject({
      sourceKind: "youtube-link",
      sourceUrl: "https://www.example.com/cacio",
      sourceDomain: "example.com",
      recipe: recipeResponse,
    });
  });

  it("falls back to recipe-like YouTube description text", async () => {
    mocks.isYouTubeUrl.mockImplementation((url: string) =>
      url.includes("youtu.be"),
    );
    mocks.fetchYouTubeDescriptionMetadata.mockResolvedValue({
      videoId: "abc1234",
      title: "Pasta video",
      description: recipeText,
      candidateUrls: [],
    });
    mocks.extractRecipeWithAi.mockResolvedValue({
      ...recipePayload,
      sourceUrl: "https://youtu.be/abc1234",
    });

    const result = await importRecipeForUser("user-1", {
      kind: "url",
      url: "https://youtu.be/abc1234",
    });

    expect(fetch).not.toHaveBeenCalled();
    expect(mocks.extractRecipeWithAi).toHaveBeenCalledWith(
      recipeText,
      "https://youtu.be/abc1234",
    );
    expect(result).toMatchObject({
      sourceKind: "youtube-description",
      sourceUrl: "https://youtu.be/abc1234",
    });
  });

  it("returns a clear failure when the YouTube description has no recipe", async () => {
    mocks.isYouTubeUrl.mockReturnValue(true);
    mocks.fetchYouTubeDescriptionMetadata.mockResolvedValue({
      videoId: "abc1234",
      title: "Pasta video",
      description: "Subscribe for more dinner ideas and behind-the-scenes notes.",
      candidateUrls: [],
    });

    await expect(
      importRecipeForUser("user-1", {
        kind: "url",
        url: "https://www.youtube.com/watch?v=abc1234",
      }),
    ).rejects.toMatchObject({
      status: 422,
      message:
        "We couldn't find a recipe in that YouTube description. Paste the recipe text directly if the creator included it elsewhere.",
    });

    expect(mocks.extractRecipeWithAi).not.toHaveBeenCalled();
    expect(mocks.createRecipeForUser).not.toHaveBeenCalled();
  });
});
