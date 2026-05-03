import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  extractCandidateRecipeUrls,
  fetchYouTubeDescriptionMetadata,
  normalizeBareHost,
  parseYouTubeVideoId,
} from "./youtube-import";

describe("parseYouTubeVideoId", () => {
  it("supports watch, short, and youtu.be URLs", () => {
    expect(
      parseYouTubeVideoId("https://www.youtube.com/watch?v=abc_123-xyz"),
    ).toBe("abc_123-xyz");
    expect(parseYouTubeVideoId("https://youtu.be/abc_123-xyz?t=4")).toBe(
      "abc_123-xyz",
    );
    expect(
      parseYouTubeVideoId("https://www.youtube.com/shorts/abc_123-xyz"),
    ).toBe("abc_123-xyz");
  });

  it("rejects unsupported YouTube paths and non-YouTube URLs", () => {
    expect(parseYouTubeVideoId("https://www.youtube.com/feed/subscriptions")).toBeNull();
    expect(parseYouTubeVideoId("https://example.com/watch?v=abc_123-xyz")).toBeNull();
  });
});

describe("extractCandidateRecipeUrls", () => {
  it("deduplicates links and filters social, video, and link-in-bio domains", () => {
    expect(
      extractCandidateRecipeUrls(`
        Recipe: https://www.example.com/cacio.
        Again: https://www.example.com/cacio
        Instagram: https://instagram.com/cook
        Link in bio: https://linktr.ee/cook
        Video: https://youtu.be/abc1234
      `),
    ).toEqual(["https://www.example.com/cacio"]);
  });
});

describe("normalizeBareHost", () => {
  it("strips www and lowercases domains", () => {
    expect(normalizeBareHost("WWW.Example.COM")).toBe("example.com");
  });
});

describe("fetchYouTubeDescriptionMetadata", () => {
  const originalApiKey = process.env.YOUTUBE_API_KEY;

  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
  });

  afterEach(() => {
    process.env.YOUTUBE_API_KEY = originalApiKey;
    vi.unstubAllGlobals();
  });

  it("requires an API key before making a network call", async () => {
    delete process.env.YOUTUBE_API_KEY;

    await expect(
      fetchYouTubeDescriptionMetadata(
        "https://www.youtube.com/watch?v=abc_123-xyz",
      ),
    ).rejects.toMatchObject({
      status: 503,
    });
    expect(fetch).not.toHaveBeenCalled();
  });

  it("returns description metadata even when no candidate URLs are found", async () => {
    process.env.YOUTUBE_API_KEY = "test-key";
    vi.mocked(fetch).mockResolvedValue(
      Response.json({
        items: [
          {
            snippet: {
              title: "Dinner video",
              description: "Ingredients and instructions are in the video.",
            },
          },
        ],
      }),
    );

    await expect(
      fetchYouTubeDescriptionMetadata("https://youtu.be/abc_123-xyz"),
    ).resolves.toEqual({
      videoId: "abc_123-xyz",
      title: "Dinner video",
      description: "Ingredients and instructions are in the video.",
      candidateUrls: [],
    });
  });
});
