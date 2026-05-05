import { chromium } from "playwright-core";

export class BrowserbaseFetchError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = "BrowserbaseFetchError";
  }
}

type BrowserbaseSession = {
  id: string;
  connectUrl: string;
};

export type BrowserbaseRenderedPage = {
  rawText: string;
  sourceText: string;
  contentType: string;
  finalUrl: string;
};

export function isBrowserbaseFallbackEnabled(): boolean {
  return process.env.BROWSERBASE_FALLBACK_ENABLED === "true";
}

export async function renderPublicRecipePageWithBrowserbase(
  sourceUrl: string,
): Promise<BrowserbaseRenderedPage> {
  const url = normalizePublicBrowserbaseUrl(sourceUrl);
  const apiKey = process.env.BROWSERBASE_API_KEY;

  if (!apiKey) {
    throw new BrowserbaseFetchError(
      "Browserbase fallback is enabled, but BROWSERBASE_API_KEY is not configured.",
      503,
    );
  }

  const timeoutMs = getBrowserbaseTimeoutMs();
  let session: BrowserbaseSession | null = null;
  let browser: Awaited<ReturnType<typeof chromium.connectOverCDP>> | null = null;

  try {
    session = await createBrowserbaseSession(apiKey, timeoutMs);
    browser = await chromium.connectOverCDP(session.connectUrl, {
      timeout: timeoutMs,
    });
    const context = browser.contexts()[0] ?? (await browser.newContext());
    const page = context.pages()[0] ?? (await context.newPage());

    await page.goto(url, { waitUntil: "domcontentloaded", timeout: timeoutMs });
    await page.waitForLoadState("networkidle", { timeout: Math.min(timeoutMs, 10_000) }).catch(() => {});

    const rawText = await page.locator("body").innerText({ timeout: 5_000 });
    const sourceText = rawText.replace(/\s+/g, " ").trim();

    if (sourceText.length < 80) {
      throw new BrowserbaseFetchError(
        "Browserbase rendered the page, but couldn't find readable recipe text.",
        422,
      );
    }

    return {
      rawText,
      sourceText,
      contentType: "text/browserbase-rendered",
      finalUrl: page.url(),
    };
  } catch (error) {
    if (error instanceof BrowserbaseFetchError) throw error;

    throw new BrowserbaseFetchError(
      "Browserbase couldn't render that public recipe page right now.",
      502,
    );
  } finally {
    if (browser) {
      await Promise.resolve(browser.close()).catch(() => {});
    }
    if (session) {
      await releaseBrowserbaseSession(apiKey, session.id).catch(() => {});
    }
  }
}

function normalizePublicBrowserbaseUrl(value: string): string {
  let url: URL;

  try {
    url = new URL(value);
  } catch {
    throw new BrowserbaseFetchError("A valid recipe URL is required.", 400);
  }

  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new BrowserbaseFetchError(
      "Only public HTTP and HTTPS recipe URLs can use Browserbase fallback.",
      400,
    );
  }

  if (url.username || url.password) {
    throw new BrowserbaseFetchError(
      "Browserbase fallback does not support credentialed or private URLs.",
      400,
    );
  }

  return url.toString();
}

function getBrowserbaseTimeoutMs(): number {
  const timeout = Number(process.env.BROWSERBASE_TIMEOUT_MS);
  return Number.isInteger(timeout) && timeout >= 10_000 ? timeout : 30_000;
}

async function createBrowserbaseSession(
  apiKey: string,
  timeoutMs: number,
): Promise<BrowserbaseSession> {
  const body: Record<string, unknown> = {
    timeout: Math.max(60, Math.ceil(timeoutMs / 1000)),
    keepAlive: false,
    userMetadata: { source: "cookbookai-import" },
  };

  if (process.env.BROWSERBASE_PROJECT_ID) {
    body.projectId = process.env.BROWSERBASE_PROJECT_ID;
  }

  const response = await fetch("https://api.browserbase.com/v1/sessions", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-bb-api-key": apiKey,
    },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(timeoutMs),
  });

  if (!response.ok) {
    throw new BrowserbaseFetchError(
      `Browserbase session creation failed (${response.status}).`,
      response.status === 401 || response.status === 403 ? 503 : 502,
    );
  }

  const session = (await response.json()) as Partial<BrowserbaseSession>;

  if (!session.id || !session.connectUrl) {
    throw new BrowserbaseFetchError(
      "Browserbase did not return a usable browser session.",
      502,
    );
  }

  return { id: session.id, connectUrl: session.connectUrl };
}

async function releaseBrowserbaseSession(
  apiKey: string,
  sessionId: string,
): Promise<void> {
  const body: Record<string, unknown> = { status: "REQUEST_RELEASE" };

  if (process.env.BROWSERBASE_PROJECT_ID) {
    body.projectId = process.env.BROWSERBASE_PROJECT_ID;
  }

  await fetch(`https://api.browserbase.com/v1/sessions/${sessionId}`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-bb-api-key": apiKey,
    },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(5_000),
  });
}
