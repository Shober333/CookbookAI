import type { Recipe } from "@prisma/client";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { importRecipeForUser } from "./recipe-import-service";

const mocks = vi.hoisted(() => ({
  browserbaseEnabled: vi.fn(() => false),
  BrowserbaseFetchError: class BrowserbaseFetchError extends Error {
    constructor(
      message: string,
      readonly status: number,
    ) {
      super(message);
    }
  },
  copyRecipeForUser: vi.fn(),
  createRecipeForUser: vi.fn(),
  extractRecipeFromJsonLd: vi.fn(),
  extractRecipeWithAi: vi.fn(),
  extractRecipeTextFromYouTubeVideo: vi.fn(),
  fetchYouTubeDescriptionMetadata: vi.fn(),
  fetchYouTubeTranscript: vi.fn(),
  findRecipeByNormalizedSourceUrl: vi.fn(),
  isYouTubeUrl: vi.fn((_url: string) => false),
  normalizeBareHost: vi.fn((hostname: string) =>
    hostname.toLowerCase().replace(/^www\./, ""),
  ),
  prepareRecipeSourceForAi: vi.fn((text: string, maxChars: number) =>
    text.slice(0, maxChars),
  ),
  renderPublicRecipePageWithBrowserbase: vi.fn(),
  YouTubeImportError: class YouTubeImportError extends Error {
    constructor(
      message: string,
      readonly status: number,
    ) {
      super(message);
    }
  },
  YouTubeVideoAiError: class YouTubeVideoAiError extends Error {
    constructor(
      message: string,
      readonly status: number,
    ) {
      super(message);
    }
  },
}));

vi.mock("@/lib/browserbase-fetch", () => ({
  BrowserbaseFetchError: mocks.BrowserbaseFetchError,
  isBrowserbaseFallbackEnabled: mocks.browserbaseEnabled,
  renderPublicRecipePageWithBrowserbase: mocks.renderPublicRecipePageWithBrowserbase,
}));

vi.mock("@/lib/anthropic", () => ({
  aiProvider: "anthropic",
  isOllamaCloudModel: false,
}));

vi.mock("@/lib/ai-provider", () => ({
  selectedAiProvider: "anthropic",
}));

vi.mock("@/lib/recipe-ai-extractor", () => ({
  extractRecipeWithAi: mocks.extractRecipeWithAi,
  getRecipeSourceLimit: vi.fn(() => 60_000),
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
  fetchYouTubeTranscript: mocks.fetchYouTubeTranscript,
  isYouTubeUrl: mocks.isYouTubeUrl,
  normalizeBareHost: mocks.normalizeBareHost,
  YouTubeImportError: mocks.YouTubeImportError,
}));

vi.mock("@/lib/youtube-video-ai", () => ({
  extractRecipeTextFromYouTubeVideo: mocks.extractRecipeTextFromYouTubeVideo,
  YouTubeVideoAiError: mocks.YouTubeVideoAiError,
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
  sourceVideoUrl: null,
  sourceKind: null,
  sourceImportMethod: null,
  createdAt: "2026-05-03T00:00:00.000Z",
  updatedAt: "2026-05-03T00:00:00.000Z",
};

describe("importRecipeForUser", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.createRecipeForUser.mockResolvedValue(recipeResponse);
    mocks.extractRecipeWithAi.mockResolvedValue(recipePayload);
    mocks.extractRecipeTextFromYouTubeVideo.mockResolvedValue(null);
    mocks.fetchYouTubeTranscript.mockResolvedValue(recipeText);
    mocks.findRecipeByNormalizedSourceUrl.mockResolvedValue(null);
    mocks.isYouTubeUrl.mockReturnValue(false);
    mocks.browserbaseEnabled.mockReturnValue(false);
    mocks.renderPublicRecipePageWithBrowserbase.mockResolvedValue({
      rawText: recipeText,
      sourceText: recipeText,
      contentType: "text/browserbase-rendered",
      finalUrl: "https://example.com/cacio",
    });
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
      {
        ...recipePayload,
        sourceImportMethod: "text",
        sourceKind: "text",
      },
    );
    expect(result).toEqual({
      recipe: recipeResponse,
      reused: false,
      sourceKind: "text",
      sourceUrl: "https://example.com/cacio",
      sourceVideoUrl: null,
      sourceImportMethod: "text",
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
      nutritionEstimate: null,
      sourceVideoUrl: null,
      sourceKind: null,
      sourceImportMethod: "browserbase",
      tags: "pasta",
      createdAt: new Date("2026-05-02T00:00:00.000Z"),
      updatedAt: new Date("2026-05-02T00:00:00.000Z"),
    } satisfies Recipe;
    mocks.findRecipeByNormalizedSourceUrl.mockResolvedValue(sourceRecipe);
    mocks.copyRecipeForUser.mockResolvedValue({
      ...recipeResponse,
      id: "recipe-copy",
      adaptedSteps: null,
      sourceImportMethod: "browserbase",
    });

    const result = await importRecipeForUser("user-1", {
      kind: "url",
      url: "https://example.com/cacio",
    });

    expect(mocks.copyRecipeForUser).toHaveBeenCalledWith(
      "user-1",
      sourceRecipe,
      {
        sourceVideoUrl: null,
        sourceKind: "url",
      },
    );
    expect(fetch).not.toHaveBeenCalled();
    expect(mocks.extractRecipeWithAi).not.toHaveBeenCalled();
    expect(mocks.createRecipeForUser).not.toHaveBeenCalled();
    expect(result).toMatchObject({
      reused: true,
      sourceKind: "url",
      sourceUrl: "https://example.com/cacio",
      sourceVideoUrl: null,
      sourceImportMethod: "browserbase",
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
      {
        ...recipePayload,
        sourceUrl: "https://example.com/cacio",
        sourceImportMethod: "fetch",
        sourceKind: "url",
        sourceVideoUrl: null,
      },
    );
    expect(result).toMatchObject({
      reused: false,
      sourceKind: "url",
      sourceImportMethod: "fetch",
      sourceVideoUrl: null,
      recipe: recipeResponse,
    });
  });

  it("uses Browserbase when normal fetch fails and fallback is enabled", async () => {
    mocks.browserbaseEnabled.mockReturnValue(true);
    vi.mocked(fetch).mockRejectedValue(new Error("fetch failed"));

    const result = await importRecipeForUser("user-1", {
      kind: "url",
      url: "https://example.com/js-heavy",
    });

    expect(mocks.renderPublicRecipePageWithBrowserbase).toHaveBeenCalledWith(
      "https://example.com/js-heavy",
    );
    expect(mocks.extractRecipeWithAi).toHaveBeenCalledWith(
      recipeText,
      "https://example.com/js-heavy",
    );
    expect(mocks.createRecipeForUser).toHaveBeenCalledWith(
      "user-1",
      expect.objectContaining({
        sourceImportMethod: "browserbase",
        sourceKind: "url",
      }),
    );
    expect(result).toMatchObject({
      sourceKind: "url",
      sourceUrl: "https://example.com/js-heavy",
      sourceImportMethod: "browserbase",
    });
  });

  it("uses Browserbase when normal fetch returns an unreadable JS-heavy page", async () => {
    mocks.browserbaseEnabled.mockReturnValue(true);
    vi.mocked(fetch).mockResolvedValue(
      new Response("<main>Loading app...</main>", {
        headers: { "content-type": "text/html; charset=utf-8" },
      }),
    );

    await importRecipeForUser("user-1", {
      kind: "url",
      url: "https://example.com/js-heavy",
    });

    expect(mocks.renderPublicRecipePageWithBrowserbase).toHaveBeenCalledWith(
      "https://example.com/js-heavy",
    );
  });

  it("returns a controlled Browserbase configuration error", async () => {
    mocks.browserbaseEnabled.mockReturnValue(true);
    mocks.renderPublicRecipePageWithBrowserbase.mockRejectedValue(
      new mocks.BrowserbaseFetchError(
        "Browserbase fallback is enabled, but BROWSERBASE_API_KEY is not configured.",
        503,
      ),
    );
    vi.mocked(fetch).mockRejectedValue(new Error("fetch failed"));

    await expect(
      importRecipeForUser("user-1", {
        kind: "url",
        url: "https://example.com/js-heavy",
      }),
    ).rejects.toMatchObject({
      status: 503,
      message:
        "Browserbase fallback is enabled, but BROWSERBASE_API_KEY is not configured.",
    });

    expect(mocks.createRecipeForUser).not.toHaveBeenCalled();
  });

  it("returns a controlled provider-unavailable error when Gemini config is invalid", async () => {
    mocks.extractRecipeWithAi.mockRejectedValue(
      new Error("Gemini generation failed: missing GEMINI_API_KEY."),
    );

    await expect(
      importRecipeForUser("user-1", {
        kind: "text",
        text: recipeText,
      }),
    ).rejects.toMatchObject({
      status: 503,
      message:
        "The configured AI provider is unavailable. Check the provider key and model settings.",
    });

    expect(mocks.createRecipeForUser).not.toHaveBeenCalled();
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
      sourceVideoUrl: "https://www.youtube.com/watch?v=abc1234",
      sourceDomain: "example.com",
      recipe: recipeResponse,
    });
    expect(mocks.createRecipeForUser).toHaveBeenCalledWith(
      "user-1",
      expect.objectContaining({
        sourceKind: "youtube-link",
        sourceVideoUrl: "https://www.youtube.com/watch?v=abc1234",
      }),
    );
  });

  it("tries later YouTube candidate links before falling back to description text", async () => {
    mocks.isYouTubeUrl.mockImplementation((url: string) =>
      url.includes("youtube.com"),
    );
    mocks.fetchYouTubeDescriptionMetadata.mockResolvedValue({
      videoId: "abc1234",
      title: "Pastrami video",
      description: recipeText,
      candidateUrls: [
        "https://sponsor.example.com/deal",
        "https://www.example.com/cacio",
      ],
    });
    vi.mocked(fetch)
      .mockResolvedValueOnce(
        new Response("<main>Hydration packets and subscription discounts.</main>", {
          headers: { "content-type": "text/html; charset=utf-8" },
        }),
      )
      .mockResolvedValueOnce(
        new Response(`<main>${recipeText}</main>`, {
          headers: { "content-type": "text/html; charset=utf-8" },
        }),
      );

    const result = await importRecipeForUser("user-1", {
      kind: "url",
      url: "https://www.youtube.com/watch?v=abc1234",
    });

    expect(fetch).toHaveBeenNthCalledWith(
      1,
      "https://sponsor.example.com/deal",
      expect.objectContaining({ headers: expect.any(Object) }),
    );
    expect(fetch).toHaveBeenNthCalledWith(
      2,
      "https://www.example.com/cacio",
      expect.objectContaining({ headers: expect.any(Object) }),
    );
    expect(result).toMatchObject({
      sourceKind: "youtube-link",
      sourceUrl: "https://www.example.com/cacio",
      sourceVideoUrl: "https://www.youtube.com/watch?v=abc1234",
      sourceDomain: "example.com",
    });
    expect(mocks.createRecipeForUser).toHaveBeenCalledWith(
      "user-1",
      expect.objectContaining({
        sourceKind: "youtube-link",
        sourceVideoUrl: "https://www.youtube.com/watch?v=abc1234",
      }),
    );
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
      sourceVideoUrl: "https://youtu.be/abc1234",
    });
    expect(mocks.createRecipeForUser).toHaveBeenCalledWith(
      "user-1",
      expect.objectContaining({
        sourceKind: "youtube-description",
        sourceVideoUrl: "https://youtu.be/abc1234",
      }),
    );
  });

  it("returns a clear failure when the YouTube description has no recipe", async () => {
    mocks.isYouTubeUrl.mockReturnValue(true);
    mocks.fetchYouTubeDescriptionMetadata.mockResolvedValue({
      videoId: "abc1234",
      title: "Pasta video",
      description: "Subscribe for more dinner ideas and behind-the-scenes notes.",
      candidateUrls: [],
    });
    mocks.fetchYouTubeTranscript.mockRejectedValue(
      new mocks.YouTubeImportError("No transcript.", 404),
    );

    await expect(
      importRecipeForUser("user-1", {
        kind: "url",
        url: "https://www.youtube.com/watch?v=abc1234",
      }),
    ).rejects.toMatchObject({
      status: 422,
      message:
        "We couldn't find a recipe in that YouTube video. Paste the recipe text directly if the creator included it elsewhere.",
    });

    expect(mocks.extractRecipeWithAi).not.toHaveBeenCalled();
    expect(mocks.createRecipeForUser).not.toHaveBeenCalled();
  });

  it("falls back to a YouTube transcript after description-first finds no recipe", async () => {
    mocks.isYouTubeUrl.mockReturnValue(true);
    mocks.fetchYouTubeDescriptionMetadata.mockResolvedValue({
      videoId: "abc1234",
      title: "Pasta video",
      description: "Subscribe for more dinner ideas and behind-the-scenes notes.",
      candidateUrls: [],
    });
    mocks.fetchYouTubeTranscript.mockResolvedValue(recipeText);
    mocks.extractRecipeWithAi.mockResolvedValue({
      ...recipePayload,
      sourceUrl: "https://www.youtube.com/watch?v=abc1234",
    });

    const result = await importRecipeForUser("user-1", {
      kind: "url",
      url: "https://www.youtube.com/watch?v=abc1234",
    });

    expect(mocks.fetchYouTubeTranscript).toHaveBeenCalledWith(
      "https://www.youtube.com/watch?v=abc1234",
    );
    expect(mocks.extractRecipeWithAi).toHaveBeenCalledWith(
      recipeText,
      "https://www.youtube.com/watch?v=abc1234",
    );
    expect(result).toMatchObject({
      sourceKind: "youtube-transcript",
      sourceUrl: "https://www.youtube.com/watch?v=abc1234",
      sourceVideoUrl: "https://www.youtube.com/watch?v=abc1234",
    });
  });

  it("does not create a recipe when the transcript is also not recipe-like", async () => {
    mocks.isYouTubeUrl.mockReturnValue(true);
    mocks.fetchYouTubeDescriptionMetadata.mockResolvedValue({
      videoId: "abc1234",
      title: "Pasta video",
      description: "Subscribe for more dinner ideas and behind-the-scenes notes.",
      candidateUrls: [],
    });
    mocks.fetchYouTubeTranscript.mockResolvedValue(
      "Welcome back to the channel. Today we are chatting about dinner memories.",
    );

    await expect(
      importRecipeForUser("user-1", {
        kind: "url",
        url: "https://www.youtube.com/watch?v=abc1234",
      }),
    ).rejects.toMatchObject({ status: 422 });

    expect(mocks.extractRecipeWithAi).not.toHaveBeenCalled();
    expect(mocks.createRecipeForUser).not.toHaveBeenCalled();
  });

  it("falls back to direct AI video extraction after transcript paths fail", async () => {
    mocks.isYouTubeUrl.mockReturnValue(true);
    mocks.fetchYouTubeDescriptionMetadata.mockResolvedValue({
      videoId: "abc1234",
      title: "Pasta video",
      description: "Subscribe for more dinner ideas.",
      candidateUrls: [],
    });
    mocks.fetchYouTubeTranscript.mockRejectedValue(
      new mocks.YouTubeImportError("No transcript.", 404),
    );
    mocks.extractRecipeTextFromYouTubeVideo.mockResolvedValue({
      hasRecipe: true,
      recipeText,
      notes: "Extracted by video model.",
    });
    mocks.extractRecipeWithAi.mockResolvedValue({
      ...recipePayload,
      sourceUrl: "https://www.youtube.com/watch?v=abc1234",
    });

    const result = await importRecipeForUser("user-1", {
      kind: "url",
      url: "https://www.youtube.com/watch?v=abc1234",
    });

    expect(mocks.extractRecipeTextFromYouTubeVideo).toHaveBeenCalledWith(
      "https://www.youtube.com/watch?v=abc1234",
    );
    expect(mocks.createRecipeForUser).toHaveBeenCalledWith(
      "user-1",
      expect.objectContaining({
        sourceKind: "youtube-direct-video",
        sourceVideoUrl: "https://www.youtube.com/watch?v=abc1234",
        sourceImportMethod: "video-ai",
      }),
    );
    expect(result).toMatchObject({
      sourceKind: "youtube-direct-video",
      sourceImportMethod: "video-ai",
    });
  });
});
