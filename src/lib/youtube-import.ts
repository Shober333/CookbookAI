const YOUTUBE_HOSTS = new Set([
  "youtube.com",
  "www.youtube.com",
  "m.youtube.com",
  "youtu.be",
]);

const NON_RECIPE_DOMAINS = new Set([
  "youtube.com",
  "youtu.be",
  "instagram.com",
  "tiktok.com",
  "x.com",
  "twitter.com",
  "facebook.com",
  "pinterest.com",
  "threads.net",
  "linktr.ee",
  "beacons.ai",
  "bio.site",
  "stan.store",
  "shopify.com",
  "teespring.com",
  "spring.com",
]);

export type YouTubeDescriptionMetadata = {
  videoId: string;
  title: string;
  description: string;
  candidateUrls: string[];
};

export class YouTubeImportError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = "YouTubeImportError";
  }
}

export function parseYouTubeVideoId(value: string): string | null {
  let url: URL;

  try {
    url = new URL(value);
  } catch {
    return null;
  }

  const host = url.hostname.toLowerCase();

  if (!YOUTUBE_HOSTS.has(host)) return null;

  if (host === "youtu.be") {
    return cleanVideoId(url.pathname.slice(1).split("/")[0]);
  }

  if (url.pathname === "/watch") {
    return cleanVideoId(url.searchParams.get("v"));
  }

  if (url.pathname.startsWith("/shorts/")) {
    return cleanVideoId(url.pathname.split("/")[2]);
  }

  return null;
}

export function isYouTubeUrl(value: string): boolean {
  return parseYouTubeVideoId(value) !== null;
}

export async function fetchYouTubeDescriptionMetadata(
  value: string,
): Promise<YouTubeDescriptionMetadata> {
  const videoId = parseYouTubeVideoId(value);

  if (!videoId) {
    throw new YouTubeImportError("That YouTube URL is not supported.", 400);
  }

  const apiKey = process.env.YOUTUBE_API_KEY;

  if (!apiKey) {
    throw new YouTubeImportError(
      "YouTube import needs a configured YouTube API key.",
      503,
    );
  }

  let response: Response;

  try {
    const url = new URL("https://www.googleapis.com/youtube/v3/videos");
    url.searchParams.set("part", "snippet");
    url.searchParams.set("id", videoId);
    url.searchParams.set("key", apiKey);

    response = await fetch(url, { signal: AbortSignal.timeout(10_000) });
  } catch {
    throw new YouTubeImportError(
      "We couldn't read that YouTube description right now.",
      502,
    );
  }

  if (!response.ok) {
    throw new YouTubeImportError(
      "We couldn't read that YouTube description right now.",
      502,
    );
  }

  const body = (await response.json()) as {
    items?: Array<{ snippet?: { title?: string; description?: string } }>;
  };
  const snippet = body.items?.[0]?.snippet;

  if (!snippet) {
    throw new YouTubeImportError("That YouTube video was not found.", 404);
  }

  const description = snippet.description ?? "";

  return {
    videoId,
    title: snippet.title ?? "",
    description,
    candidateUrls: extractCandidateRecipeUrls(description),
  };
}

export function extractCandidateRecipeUrls(description: string): string[] {
  const urls = description.match(/https?:\/\/[^\s<>"']+/gi) ?? [];
  const seen = new Set<string>();

  return urls
    .map((url) => url.replace(/[),.;\]]+$/g, ""))
    .filter((url) => {
      try {
        const parsed = new URL(url);
        const host = normalizeBareHost(parsed.hostname);

        if (isBlockedDomain(host) || seen.has(parsed.toString())) return false;

        seen.add(parsed.toString());
        return true;
      } catch {
        return false;
      }
    });
}

export function normalizeBareHost(hostname: string): string {
  return hostname.toLowerCase().replace(/^www\./, "");
}

function cleanVideoId(value: string | null | undefined): string | null {
  if (!value) return null;

  const match = value.match(/^[A-Za-z0-9_-]{6,}$/);
  return match ? value : null;
}

function isBlockedDomain(host: string): boolean {
  return [...NON_RECIPE_DOMAINS].some(
    (domain) => host === domain || host.endsWith(`.${domain}`),
  );
}
