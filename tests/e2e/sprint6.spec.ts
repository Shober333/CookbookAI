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
  sourceVideoUrl?: string | null;
  sourceKind?:
    | "url"
    | "text"
    | "youtube-link"
    | "youtube-description"
    | "youtube-transcript"
    | null;
  sourceImportMethod?: "fetch" | "browserbase" | "text" | null;
  servings: number;
  ingredients: Ingredient[];
  steps: string[];
  tags?: string[];
};

function uniqueEmail(label: string) {
  return `qa-s6-${label}-${Date.now()}-${Math.random().toString(36).slice(2)}@example.com`;
}

function sampleRecipe(overrides: Partial<RecipePayload> = {}): RecipePayload {
  return {
    title: "S6 Sesame Noodles",
    description: "A Sprint 6 source continuity recipe.",
    sourceUrl: "https://example.com/s6-sesame-noodles",
    sourceKind: "url",
    sourceImportMethod: "fetch",
    servings: 4,
    ingredients: [
      { amount: 250, unit: "g", name: "noodles" },
      { amount: 2, unit: "tbsp", name: "sesame paste" },
      { amount: 1, unit: "tbsp", name: "soy sauce" },
      { amount: null, unit: "", name: "chile oil", notes: "to taste" },
    ],
    steps: ["Cook the noodles.", "Whisk the sauce.", "Toss and serve."],
    tags: ["noodles", "qa"],
    ...overrides,
  };
}

async function register(page: Page, email: string, password = PASSWORD) {
  await page.goto("/register");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: "Create account" }).click();
  await expect(page.getByRole("button", { name: "+ Import" })).toBeVisible({
    timeout: 15_000,
  });
  await page.goto("/library");
  await expect(page).toHaveURL(/\/library$/);
}

async function createRecipe(page: Page, recipe: RecipePayload) {
  const response = await page.request.post("/api/recipes", { data: recipe });
  expect(response.status()).toBe(201);
  const body = await response.json();
  return body.recipe as RecipePayload & { id: string };
}

test.describe("Sprint 6 source continuity", () => {
  test("renders YouTube source embed and provenance on recipe detail", async ({
    page,
  }) => {
    await register(page, uniqueEmail("youtube-detail"));
    const recipe = await createRecipe(
      page,
      sampleRecipe({
        title: "S6 YouTube Noodles",
        sourceUrl: "https://www.smittenkitchen.com/2026/05/sesame-noodles",
        sourceVideoUrl: "https://www.youtube.com/watch?v=abc_123-xyz",
        sourceKind: "youtube-link",
        sourceImportMethod: "fetch",
      }),
    );

    await page.goto(`/recipes/${recipe.id}`);
    await expect(
      page.getByText("From smittenkitchen.com · first found on YouTube"),
    ).toBeVisible();
    await expect(page.getByRole("heading", { name: "Original video" })).toBeVisible();

    const frame = page.locator("iframe[title='Original video for S6 YouTube Noodles']");
    await expect(frame).toHaveAttribute(
      "src",
      "https://www.youtube-nocookie.com/embed/abc_123-xyz",
    );
    await expect(
      page.getByRole("link", { name: "Watch on YouTube" }),
    ).toHaveAttribute("href", "https://www.youtube.com/watch?v=abc_123-xyz");
    await expect(page.getByRole("button", { name: "Increase servings" })).toBeVisible();

    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, "recipe-youtube-source-desktop.png"),
      fullPage: true,
    });
  });

  test("keeps YouTube embed within 375px mobile gutters", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await register(page, uniqueEmail("youtube-mobile"));
    const recipe = await createRecipe(
      page,
      sampleRecipe({
        title: "S6 Mobile Video Noodles",
        sourceUrl: "https://www.smittenkitchen.com/2026/05/mobile-noodles",
        sourceVideoUrl: "https://youtu.be/mobile_123",
        sourceKind: "youtube-link",
      }),
    );

    await page.goto(`/recipes/${recipe.id}`);
    const embed = page.locator("iframe[title='Original video for S6 Mobile Video Noodles']");
    await expect(embed).toBeVisible();

    const box = await embed.boundingBox();
    if (!box) throw new Error("Expected visible YouTube embed");
    expect(box.x).toBeGreaterThanOrEqual(19);
    expect(box.width).toBeLessThanOrEqual(337);

    const horizontalOverflow = await page.evaluate(
      () => document.documentElement.scrollWidth > window.innerWidth,
    );
    expect(horizontalOverflow).toBe(false);
    await expect(page.getByRole("button", { name: "Increase servings" })).toBeVisible();

    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, "recipe-youtube-source-mobile.png"),
      fullPage: true,
    });
  });

  test("omits empty video slots and shows browser-assisted provenance", async ({
    page,
  }) => {
    await register(page, uniqueEmail("provenance"));
    const browserRead = await createRecipe(
      page,
      sampleRecipe({
        title: "S6 Browser Read Noodles",
        sourceUrl: "https://www.example.com/js-heavy-noodles",
        sourceKind: "url",
        sourceImportMethod: "browserbase",
      }),
    );
    const invalidVideo = await createRecipe(
      page,
      sampleRecipe({
        title: "S6 Invalid Video Noodles",
        sourceUrl: "https://www.youtube.com/watch?v=not-valid",
        sourceVideoUrl: "https://example.com/not-a-youtube-video",
        sourceKind: "youtube-description",
        sourceImportMethod: "text",
      }),
    );
    const plain = await createRecipe(
      page,
      sampleRecipe({
        title: "S6 Plain Noodles",
        sourceUrl: "https://www.example.com/plain-noodles",
        sourceKind: "url",
        sourceImportMethod: "fetch",
      }),
    );

    await page.goto(`/recipes/${browserRead.id}`);
    await expect(page.getByText("From example.com · read in a browser")).toBeVisible();
    await expect(page.getByRole("heading", { name: "Original video" })).toHaveCount(0);

    await page.goto(`/recipes/${invalidVideo.id}`);
    await expect(page.getByText("From YouTube description")).toBeVisible();
    await expect(page.getByRole("heading", { name: "Original video" })).toHaveCount(0);
    await expect(page.locator("iframe")).toHaveCount(0);

    await page.goto(`/recipes/${plain.id}`);
    await expect(page.getByText("From example.com")).toBeVisible();
    await expect(page.getByText("first found on YouTube")).toHaveCount(0);
    await expect(page.getByRole("heading", { name: "Original video" })).toHaveCount(0);
  });
});
