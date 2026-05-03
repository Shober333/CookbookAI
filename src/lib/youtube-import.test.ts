import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  extractCandidateRecipeUrls,
  fetchYouTubeDescriptionMetadata,
  fetchYouTubeTranscript,
  normalizeBareHost,
  parseYouTubeVideoId,
} from "./youtube-import";

vi.mock("youtube-transcript", () => {
  class YoutubeTranscriptTooManyRequestError extends Error {
    constructor() {
      super("YouTube is receiving too many requests");
      this.name = "YoutubeTranscriptTooManyRequestError";
    }
  }
  class YoutubeTranscriptDisabledError extends Error {
    constructor(videoId: string) {
      super(`Transcript is disabled on this video (${videoId})`);
      this.name = "YoutubeTranscriptDisabledError";
    }
  }
  return {
    YoutubeTranscript: { fetchTranscript: vi.fn() },
    YoutubeTranscriptTooManyRequestError,
    YoutubeTranscriptDisabledError,
  };
});

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
        Affiliate: https://amzn.to/pan
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

describe("fetchYouTubeTranscript", () => {
  let mockFetchTranscript: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    const mod = await import("youtube-transcript");
    mockFetchTranscript = vi.mocked(mod.YoutubeTranscript.fetchTranscript);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("joins segments into a single transcript string", async () => {
    mockFetchTranscript.mockResolvedValue([
      { text: "Ingredients: tomatoes and oil.", duration: 3000, offset: 0 },
      { text: "Instructions: simmer until thick.", duration: 4000, offset: 3000 },
    ]);

    await expect(
      fetchYouTubeTranscript("https://youtu.be/abc_123-xyz"),
    ).resolves.toBe("Ingredients: tomatoes and oil. Instructions: simmer until thick.");
  });

  it("returns a 404 error when transcript is disabled or unavailable", async () => {
    const { YoutubeTranscriptDisabledError } = await import("youtube-transcript");
    mockFetchTranscript.mockRejectedValue(
      new YoutubeTranscriptDisabledError("abc_123-xyz"),
    );

    await expect(
      fetchYouTubeTranscript("https://youtu.be/abc_123-xyz"),
    ).rejects.toMatchObject({ status: 404 });
  });

  it("returns a 503 error when YouTube is rate-limiting", async () => {
    const { YoutubeTranscriptTooManyRequestError } = await import("youtube-transcript");
    mockFetchTranscript.mockRejectedValue(new YoutubeTranscriptTooManyRequestError());

    await expect(
      fetchYouTubeTranscript("https://youtu.be/abc_123-xyz"),
    ).rejects.toMatchObject({ status: 503 });
  });
});
