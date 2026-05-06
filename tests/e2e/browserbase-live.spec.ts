import { expect, test, type Page } from "@playwright/test";

const PASSWORD = "correct-horse-42";
const LIVE_BROWSERBASE_SMOKE = process.env.LIVE_BROWSERBASE_SMOKE === "true";
const APP_BASE_URL = process.env.LIVE_BASE_URL ?? "";

const BROWSERBASE_RECIPE_SAMPLES = [
  {
    site: "Allrecipes",
    url:
      process.env.LIVE_BROWSERBASE_ALLRECIPES_URL ??
      "https://www.allrecipes.com/recipe/23600/worlds-best-lasagna/",
    expectedDomain: "allrecipes.com",
    expectedImportMethod: "browserbase",
  },
  {
    site: "Serious Eats",
    url:
      process.env.LIVE_BROWSERBASE_SERIOUSEATS_URL ??
      "https://www.seriouseats.com/the-best-roast-potatoes-ever-recipe",
    expectedDomain: "seriouseats.com",
    expectedImportMethod: "browserbase",
  },
  {
    site: "Joshua Weissman",
    url:
      process.env.LIVE_BROWSERBASE_JOSHUA_WEISSMAN_URL ??
      "https://www.joshuaweissman.com/recipes/ultimate-crispy-potato-chips-recipe",
    expectedDomain: "joshuaweissman.com",
    expectedImportMethod: "fetch",
  },
] as const;

function appPath(path: string) {
  if (!APP_BASE_URL) return path;
  return new URL(path, APP_BASE_URL).toString();
}

function uniqueEmail(label: string) {
  return `qa-browserbase-${label}-${Date.now()}-${Math.random()
    .toString(36)
    .slice(2)}@example.com`;
}

async function register(page: Page, email: string, password = PASSWORD) {
  await page.goto(appPath("/register"));
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: "Create account" }).click();
  await expect(page.getByRole("button", { name: "+ Import" })).toBeVisible({
    timeout: 30_000,
  });
}

const browserbaseLive = LIVE_BROWSERBASE_SMOKE
  ? test.describe
  : test.describe.skip;

async function waitForImportOutcome(page: Page) {
  const errorMessage = page.locator("[role='alert'] p").first();
  const outcome = await Promise.race([
    page.waitForURL(/\/recipes\/[^/]+$/, { timeout: 150_000 }).then(() => ({
      status: "success" as const,
      message: "",
    })),
    errorMessage.waitFor({ state: "visible", timeout: 150_000 }).then(async () => ({
      status: "error" as const,
      message: await errorMessage.innerText(),
    })),
  ]);

  if (outcome.status === "error") {
    throw new Error(`Recipe import failed before save: ${outcome.message}`);
  }
}

browserbaseLive("Browserbase live recipe import", () => {
  test.describe.configure({ timeout: 180_000 });

  for (const sample of BROWSERBASE_RECIPE_SAMPLES) {
    test(`imports a ${sample.site} recipe through browser-assisted fallback`, async ({
      page,
    }) => {
      await register(page, uniqueEmail(sample.expectedDomain.replace(/\W/g, "-")));

      await page.goto(appPath("/import"));
      await page.getByPlaceholder("Paste a recipe URL or a YouTube link").fill(sample.url);
      await page.getByRole("button", { name: "Bring it in" }).click();

      await waitForImportOutcome(page);
      const expectedSource =
        sample.expectedImportMethod === "browserbase"
          ? `From ${sample.expectedDomain} · read in a browser`
          : `From ${sample.expectedDomain}`;
      await expect(page.getByText(expectedSource)).toBeVisible({
        timeout: 30_000,
      });
      await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    });
  }
});
