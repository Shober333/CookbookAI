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
  "amazon.com",
  "amzn.to",
  "a.co",
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

type TranscriptTrack = {
  languageCode: string;
  name: string;
  isAutomatic: boolean;
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

export async function fetchYouTubeTranscript(value: string): Promise<string> {
  const videoId = parseYouTubeVideoId(value);

  if (!videoId) {
    throw new YouTubeImportError("That YouTube URL is not supported.", 400);
  }

  let listResponse: Response;

  try {
    listResponse = await fetch(
      `https://video.google.com/timedtext?type=list&v=${encodeURIComponent(videoId)}`,
      { signal: AbortSignal.timeout(10_000) },
    );
  } catch {
    throw new YouTubeImportError(
      "We couldn't read captions for that YouTube video right now.",
      502,
    );
  }

  if (!listResponse.ok) {
    throw new YouTubeImportError(
      "We couldn't read captions for that YouTube video right now.",
      502,
    );
  }

  const trackXml = await listResponse.text();
  const track = chooseTranscriptTrack(parseTranscriptTracks(trackXml));

  if (!track) {
    throw new YouTubeImportError(
      "No transcript is available for that YouTube video.",
      404,
    );
  }

  let transcriptResponse: Response;

  try {
    const url = new URL("https://video.google.com/timedtext");
    url.searchParams.set("v", videoId);
    url.searchParams.set("lang", track.languageCode);
    url.searchParams.set("fmt", "json3");
    if (track.name) url.searchParams.set("name", track.name);
    if (track.isAutomatic) url.searchParams.set("kind", "asr");

    transcriptResponse = await fetch(url, {
      signal: AbortSignal.timeout(10_000),
    });
  } catch {
    throw new YouTubeImportError(
      "We couldn't read captions for that YouTube video right now.",
      502,
    );
  }

  if (!transcriptResponse.ok) {
    throw new YouTubeImportError(
      "We couldn't read captions for that YouTube video right now.",
      502,
    );
  }

  const transcriptBody = (await transcriptResponse.json()) as {
    events?: Array<{
      segs?: Array<{ utf8?: string }>;
    }>;
  };
  const transcript = (transcriptBody.events ?? [])
    .flatMap((event) => event.segs ?? [])
    .map((seg) => seg.utf8 ?? "")
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();

  if (!transcript) {
    throw new YouTubeImportError(
      "No transcript is available for that YouTube video.",
      404,
    );
  }

  return transcript;
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

function parseTranscriptTracks(xml: string): TranscriptTrack[] {
  const trackMatches = xml.match(/<track\b[^>]*>/gi) ?? [];

  return trackMatches
    .map((tag) => ({
      languageCode: decodeXmlAttribute(
        readXmlAttribute(tag, "lang_code") ?? "",
      ),
      name: decodeXmlAttribute(readXmlAttribute(tag, "name") ?? ""),
      isAutomatic: readXmlAttribute(tag, "kind") === "asr",
    }))
    .filter((track) => track.languageCode.length > 0);
}

function chooseTranscriptTrack(
  tracks: TranscriptTrack[],
): TranscriptTrack | null {
  return (
    tracks.find((track) => track.languageCode === "en" && !track.isAutomatic) ??
    tracks.find((track) => track.languageCode.startsWith("en")) ??
    tracks[0] ??
    null
  );
}

function readXmlAttribute(tag: string, name: string): string | null {
  const match = tag.match(new RegExp(`${name}="([^"]*)"`));
  return match?.[1] ?? null;
}

function decodeXmlAttribute(value: string): string {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}
