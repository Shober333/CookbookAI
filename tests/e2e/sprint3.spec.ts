import { expect, test, type Page } from "@playwright/test";
import path from "node:path";

const PASSWORD = "correct-horse-42";
const SCREENSHOT_DIR = path.join("tests", "screenshots");

type Ingredient = {
  amount: number | null;
  unit: string;
  name: string;
  notes?: string;
};

type RecipePayload = {
  title: string;
  description?: string | null;
  sourceUrl?: string | null;
  servings: number;
  ingredients: Ingredient[];
  steps: string[];
  tags?: string[];
};

function uniqueEmail(label: string) {
  return `qa-s3-${label}-${Date.now()}-${Math.random().toString(36).slice(2)}@example.com`;
}

function sampleRecipe(overrides: Partial<RecipePayload> = {}): RecipePayload {
  return {
    title: "S3 Tomato Soup",
    description: "A Sprint 3 import test recipe.",
    sourceUrl: "https://example.com/s3-tomato-soup",
    servings: 4,
    ingredients: [
      { amount: 2, unit: "tbsp", name: "olive oil" },
      { amount: 1, unit: "", name: "onion", notes: "chopped" },
      { amount: 800, unit: "g", name: "tomatoes" },
      { amount: null, unit: "", name: "salt", notes: "to taste" },
    ],
    steps: [
      "Warm the oil.",
      "Cook the onion until soft.",
      "Add tomatoes and simmer.",
    ],
    tags: ["soup", "qa"],
    ...overrides,
  };
}

async function register(page: Page, email: string, password = PASSWORD) {
  await page.goto("/register");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: "Create account" }).click();
  await expect(page).toHaveURL(/\/library$/);
}

async function createRecipe(page: Page, recipe: RecipePayload) {
  const response = await page.request.post("/api/recipes", { data: recipe });
  expect(response.status()).toBe(201);
  const body = await response.json();
  return body.recipe as RecipePayload & { id: string };
}

test.describe("Sprint 3 import modes", () => {
  test("URL mode remains default and reused imports show quiet feedback", async ({
    page,
  }) => {
    await register(page, uniqueEmail("reused"));
    const recipe = await createRecipe(
      page,
      sampleRecipe({ title: "S3 Reused Soup" }),
    );

    await page.route("**/api/ai/import", async (route) => {
      expect(route.request().postDataJSON()).toEqual({
        mode: "url",
        url: "https://example.com/reused-soup",
      });
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          recipe,
          reused: true,
          sourceKind: "url",
        }),
      });
    });

    await page.goto("/import");
    await expect(page.getByRole("tab", { name: "link" })).toHaveAttribute(
      "aria-selected",
      "true",
    );
    await page.getByPlaceholder("Paste a recipe URL or a YouTube link").fill(
      "https://example.com/reused-soup",
    );
    await page.getByRole("button", { name: "Bring it in" }).click();

    await expect(
      page.getByText("Already in our library — adding it to yours."),
    ).toBeVisible();
    await expect(page).toHaveURL(/\/recipes\/.+/);
  });

  test("text mode posts pasted recipe text and navigates to detail", async ({
    page,
  }) => {
    await register(page, uniqueEmail("text"));
    const recipe = await createRecipe(
      page,
      sampleRecipe({ title: "S3 Pasted Soup" }),
    );
    const pastedRecipe =
      "Ingredients: tomatoes, olive oil, onion, salt. Steps: warm the oil, cook the onion, add tomatoes, and simmer until cozy.";

    await page.route("**/api/ai/import", async (route) => {
      expect(route.request().postDataJSON()).toEqual({
        mode: "text",
        text: pastedRecipe,
      });
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          recipe,
          reused: false,
          sourceKind: "text",
        }),
      });
    });

    await page.goto("/import");
    await page.getByRole("tab", { name: "text" }).click();
    await expect(page.getByRole("tab", { name: "text" })).toHaveAttribute(
      "aria-selected",
      "true",
    );
    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, "import-text-mode.png"),
      fullPage: true,
    });

    await page.getByPlaceholder(/Paste the recipe/).fill(pastedRecipe);
    await page.getByRole("button", { name: "Bring it in" }).click();

    await expect(page.getByText("Reading what you pasted…")).toBeVisible();
    await expect(page.getByRole("status").getByText("Done")).toBeVisible();
    await expect(page).toHaveURL(/\/recipes\/.+/);
    await expect(page.getByRole("heading", { name: "S3 Pasted Soup" })).toBeVisible();
  });

  test("text mode validates very short pasted text before posting", async ({
    page,
  }) => {
    await register(page, uniqueEmail("short-text"));

    let importRequests = 0;
    page.on("request", (request) => {
      if (request.url().includes("/api/ai/import")) importRequests += 1;
    });

    await page.goto("/import");
    await page.getByRole("tab", { name: "text" }).click();
    await page.getByPlaceholder(/Paste the recipe/).fill("Ingredients only");
    await page.getByRole("button", { name: "Bring it in" }).click();

    await expect(
      page.getByText("Paste a bit more — we need ingredients and steps to work with."),
    ).toBeVisible();
    expect(importRequests).toBe(0);
  });

  test("YouTube external-link imports show the candidate domain when present", async ({
    page,
  }) => {
    await register(page, uniqueEmail("youtube-link"));
    const recipe = await createRecipe(
      page,
      sampleRecipe({ title: "S3 YouTube Link Soup" }),
    );

    await page.route("**/api/ai/import", async (route) => {
      expect(route.request().postDataJSON()).toEqual({
        mode: "url",
        url: "https://www.youtube.com/watch?v=abc123",
      });
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          recipe,
          sourceKind: "youtube-link",
          sourceDomain: "smittenkitchen.com",
        }),
      });
    });

    await page.goto("/import");
    await page.getByPlaceholder("Paste a recipe URL or a YouTube link").fill(
      "https://www.youtube.com/watch?v=abc123",
    );
    await page.getByRole("button", { name: "Bring it in" }).click();

    await expect(
      page.getByText("Following the link in the description…"),
    ).toBeVisible();
    await expect(page.getByText("(smittenkitchen.com)")).toBeVisible();
  });

  test("YouTube description imports show description-path feedback", async ({
    page,
  }) => {
    await register(page, uniqueEmail("youtube-description"));
    const recipe = await createRecipe(
      page,
      sampleRecipe({ title: "S3 YouTube Description Soup" }),
    );

    await page.route("**/api/ai/import", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          recipe,
          sourceKind: "youtube-description",
        }),
      });
    });

    await page.goto("/import");
    await page.getByPlaceholder("Paste a recipe URL or a YouTube link").fill(
      "https://youtu.be/abc123",
    );
    await page.getByRole("button", { name: "Bring it in" }).click();

    await expect(page.getByText("Reading the description…")).toBeVisible();
    await expect(page.getByRole("status").getByText("Done")).toBeVisible();
  });

  test("YouTube external-link feedback omits the domain hint when absent", async ({
    page,
  }) => {
    await register(page, uniqueEmail("youtube-no-domain"));
    const recipe = await createRecipe(
      page,
      sampleRecipe({ title: "S3 YouTube No Domain Soup" }),
    );

    await page.route("**/api/ai/import", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          recipe,
          sourceKind: "youtube-link",
          sourceDomain: null,
        }),
      });
    });

    await page.goto("/import");
    await page.getByPlaceholder("Paste a recipe URL or a YouTube link").fill(
      "https://www.youtube.com/watch?v=no-domain",
    );
    await page.getByRole("button", { name: "Bring it in" }).click();

    await expect(
      page.getByText("Following the link in the description…"),
    ).toBeVisible();
    await expect(page.getByText(/\([^)]+\.com\)/)).toHaveCount(0);
  });
});
