import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  BrowserbaseFetchError,
  isBrowserbaseFallbackEnabled,
  renderPublicRecipePageWithBrowserbase,
} from "./browserbase-fetch";

const mocks = vi.hoisted(() => ({
  closeBrowser: vi.fn(),
  connectOverCDP: vi.fn(),
  goto: vi.fn(),
  innerText: vi.fn(),
  newContext: vi.fn(),
  newPage: vi.fn(),
  pageUrl: vi.fn(),
  waitForLoadState: vi.fn(),
}));

vi.mock("playwright-core", () => ({
  chromium: {
    connectOverCDP: mocks.connectOverCDP,
  },
}));

describe("isBrowserbaseFallbackEnabled", () => {
  const originalEnabled = process.env.BROWSERBASE_FALLBACK_ENABLED;

  afterEach(() => {
    process.env.BROWSERBASE_FALLBACK_ENABLED = originalEnabled;
  });

  it("only enables fallback when explicitly set to true", () => {
    process.env.BROWSERBASE_FALLBACK_ENABLED = "true";
    expect(isBrowserbaseFallbackEnabled()).toBe(true);

    process.env.BROWSERBASE_FALLBACK_ENABLED = "false";
    expect(isBrowserbaseFallbackEnabled()).toBe(false);
  });
});

describe("renderPublicRecipePageWithBrowserbase", () => {
  const originalEnv = {
    apiKey: process.env.BROWSERBASE_API_KEY,
    projectId: process.env.BROWSERBASE_PROJECT_ID,
    timeout: process.env.BROWSERBASE_TIMEOUT_MS,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal("fetch", vi.fn());
    process.env.BROWSERBASE_API_KEY = "bb-test-key";
    process.env.BROWSERBASE_PROJECT_ID = "project-123";
    process.env.BROWSERBASE_TIMEOUT_MS = "10000";

    mocks.goto.mockResolvedValue(undefined);
    mocks.waitForLoadState.mockResolvedValue(undefined);
    mocks.innerText.mockResolvedValue(
      "Ingredients: 200 g pasta, 2 tbsp olive oil, and salt. Instructions: simmer the sauce and toss until glossy.",
    );
    mocks.pageUrl.mockReturnValue("https://example.com/recipe");

    const page = {
      goto: mocks.goto,
      waitForLoadState: mocks.waitForLoadState,
      locator: vi.fn(() => ({ innerText: mocks.innerText })),
      url: mocks.pageUrl,
    };
    const context = {
      pages: vi.fn(() => [page]),
      newPage: mocks.newPage,
    };
    const browser = {
      contexts: vi.fn(() => [context]),
      newContext: mocks.newContext,
      close: mocks.closeBrowser,
    };

    mocks.connectOverCDP.mockResolvedValue(browser);
    vi.mocked(fetch)
      .mockResolvedValueOnce(
        Response.json(
          { id: "session-123", connectUrl: "wss://connect.browserbase.test" },
          { status: 201 },
        ),
      )
      .mockResolvedValueOnce(Response.json({}, { status: 200 }));
  });

  afterEach(() => {
    process.env.BROWSERBASE_API_KEY = originalEnv.apiKey;
    process.env.BROWSERBASE_PROJECT_ID = originalEnv.projectId;
    process.env.BROWSERBASE_TIMEOUT_MS = originalEnv.timeout;
    vi.unstubAllGlobals();
  });

  it("renders a public page and releases the Browserbase session", async () => {
    await expect(
      renderPublicRecipePageWithBrowserbase("https://example.com/recipe"),
    ).resolves.toMatchObject({
      sourceText:
        "Ingredients: 200 g pasta, 2 tbsp olive oil, and salt. Instructions: simmer the sauce and toss until glossy.",
      finalUrl: "https://example.com/recipe",
    });

    expect(fetch).toHaveBeenNthCalledWith(
      1,
      "https://api.browserbase.com/v1/sessions",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({ "x-bb-api-key": "bb-test-key" }),
      }),
    );
    expect(mocks.connectOverCDP).toHaveBeenCalledWith(
      "wss://connect.browserbase.test",
      expect.objectContaining({ timeout: 10000 }),
    );
    expect(mocks.goto).toHaveBeenCalledWith(
      "https://example.com/recipe",
      expect.objectContaining({ waitUntil: "domcontentloaded" }),
    );
    expect(mocks.closeBrowser).toHaveBeenCalled();
    expect(fetch).toHaveBeenNthCalledWith(
      2,
      "https://api.browserbase.com/v1/sessions/session-123",
      expect.objectContaining({
        method: "POST",
        body: expect.stringContaining("REQUEST_RELEASE"),
      }),
    );
  });

  it("fails before network calls when the API key is missing", async () => {
    delete process.env.BROWSERBASE_API_KEY;

    await expect(
      renderPublicRecipePageWithBrowserbase("https://example.com/recipe"),
    ).rejects.toMatchObject({
      status: 503,
    });

    expect(fetch).not.toHaveBeenCalled();
    expect(mocks.connectOverCDP).not.toHaveBeenCalled();
  });

  it("rejects credentialed URLs", async () => {
    await expect(
      renderPublicRecipePageWithBrowserbase(
        "https://user:pass@example.com/recipe",
      ),
    ).rejects.toBeInstanceOf(BrowserbaseFetchError);

    expect(fetch).not.toHaveBeenCalled();
  });

  it("returns a controlled error when rendered text is unreadable", async () => {
    mocks.innerText.mockResolvedValue("Loading...");

    await expect(
      renderPublicRecipePageWithBrowserbase("https://example.com/recipe"),
    ).rejects.toMatchObject({
      status: 422,
    });

    expect(mocks.closeBrowser).toHaveBeenCalled();
  });
});
