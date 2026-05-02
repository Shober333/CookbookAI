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
  return `qa-${label}-${Date.now()}-${Math.random().toString(36).slice(2)}@example.com`;
}

function sampleRecipe(overrides: Partial<RecipePayload> = {}): RecipePayload {
  return {
    title: "QA Lemon Pasta",
    description: "A bright test recipe.",
    sourceUrl: "https://example.com/qa-lemon-pasta",
    servings: 4,
    ingredients: [
      { amount: 200, unit: "g", name: "spaghetti" },
      { amount: 120, unit: "ml", name: "cream" },
      { amount: 2, unit: "tbsp", name: "lemon juice" },
      { amount: null, unit: "", name: "salt", notes: "to taste" },
    ],
    steps: ["Boil the pasta.", "Make the sauce.", "Toss everything together."],
    tags: ["pasta", "qa"],
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

async function login(page: Page, email: string, password = PASSWORD) {
  await page.goto("/login");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page).toHaveURL(/\/library$/);
}

async function logout(page: Page) {
  await page.getByRole("button", { name: "Sign out" }).click();
  await expect(page).toHaveURL(/\/login/);
}

async function createRecipe(page: Page, recipe: RecipePayload) {
  const response = await page.request.post("/api/recipes", { data: recipe });
  expect(response.status()).toBe(201);
  const body = await response.json();
  return body.recipe as RecipePayload & { id: string };
}

async function expectEmptyLibrary(page: Page) {
  await page.goto("/library");
  await expect(page.getByRole("heading", { name: "It's quiet in here." })).toBeVisible();
  await expect(page.getByText("Bring something home")).toBeVisible();
}

test.describe("Sprint 1 auth", () => {
  test("registers, blocks duplicate emails, validates invalid email, logs in, logs out, and protects app routes", async ({
    page,
  }) => {
    const email = uniqueEmail("auth");

    await register(page, email);
    await expect(page.getByRole("heading", { name: "It's quiet in here." })).toBeVisible();

    await logout(page);
    await page.goto("/library");
    await expect(page).toHaveURL(/\/login/);

    await login(page, email);
    await logout(page);

    await page.goto("/login");
    await page.getByLabel("Email").fill(email);
    await page.getByLabel("Password").fill("wrong-password");
    await page.getByRole("button", { name: "Sign in" }).click();
    await expect(page.getByText("Invalid email or password.")).toBeVisible();

    await page.goto("/register");
    await page.getByLabel("Email").fill(email);
    await page.getByLabel("Password").fill(PASSWORD);
    await page.getByRole("button", { name: "Create account" }).click();
    await expect(page.getByText("An account with this email already exists.")).toBeVisible();

    let registerRequests = 0;
    page.on("request", (request) => {
      if (request.url().includes("/api/auth/register")) registerRequests += 1;
    });

    await page.goto("/register");
    await page.getByLabel("Email").fill("notanemail");
    await page.getByLabel("Password").fill(PASSWORD);
    await page.getByRole("button", { name: "Create account" }).click();
    await expect(page.locator("input#email:invalid")).toHaveCount(1);
    expect(registerRequests).toBe(0);
  });
});

test.describe("Sprint 1 recipe library", () => {
  test("keeps user libraries private and supports detail, scaling, unit conversion, and delete", async ({
    page,
  }) => {
    const ownerEmail = uniqueEmail("owner");
    const otherEmail = uniqueEmail("other");

    await register(page, ownerEmail);
    const first = await createRecipe(page, sampleRecipe());
    await createRecipe(page, sampleRecipe({ title: "QA Tomato Soup", tags: ["soup"] }));

    await page.goto("/library");
    await expect(page.getByRole("heading", { name: "2 recipes, kept carefully." })).toBeVisible();
    await expect(page.getByRole("link", { name: /QA Lemon Pasta, 4 servings/ })).toBeVisible();
    await expect(page.getByRole("link", { name: /QA Tomato Soup, 4 servings/ })).toBeVisible();

    await page.getByRole("link", { name: /QA Lemon Pasta, 4 servings/ }).click();
    await expect(page.getByRole("heading", { name: "QA Lemon Pasta" })).toBeVisible();
    await expect(page.getByText("200 g spaghetti")).toBeVisible();
    await expect(page.getByText("Boil the pasta.")).toBeVisible();

    const increase = page.getByRole("button", { name: "Increase servings" });
    const decrease = page.getByRole("button", { name: "Decrease servings" });

    for (let i = 0; i < 4; i += 1) await increase.click();
    await expect(page.locator(".serving-count")).toHaveText("8");
    await expect(page.getByText("400 g spaghetti")).toBeVisible();

    for (let i = 0; i < 6; i += 1) await decrease.click();
    await expect(page.locator(".serving-count")).toHaveText("2");
    await expect(page.getByText("100 g spaghetti")).toBeVisible();

    for (let i = 0; i < 2; i += 1) await increase.click();
    await expect(page.locator(".serving-count")).toHaveText("4");
    await expect(page.getByText("200 g spaghetti")).toBeVisible();

    await page.getByRole("button", { name: "imperial" }).click();
    await expect(page.getByRole("button", { name: "imperial" })).toHaveAttribute("aria-pressed", "true");
    await expect(page.getByText("7.1 oz spaghetti")).toBeVisible();
    await expect(page.getByRole("button", { name: "imperial" })).toHaveCSS("border-bottom-color", "rgb(184, 92, 56)");
    await expect(page.getByRole("button", { name: "metric" })).toHaveCSS("border-bottom-color", "rgba(0, 0, 0, 0)");

    await page.getByRole("button", { name: "metric" }).click();
    await expect(page.getByText("200 g spaghetti")).toBeVisible();

    await logout(page);
    await register(page, otherEmail);
    await expectEmptyLibrary(page);

    const forbidden = await page.request.get(`/api/recipes/${first.id}`);
    expect(forbidden.status()).toBe(403);

    await logout(page);
    await login(page, ownerEmail);
    await page.goto(`/recipes/${first.id}`);
    await expect(page.getByRole("heading", { name: "QA Lemon Pasta" })).toBeVisible();

    page.once("dialog", async (dialog) => {
      expect(dialog.message()).toContain("Delete this recipe?");
      await dialog.dismiss();
    });
    await page.getByRole("button", { name: "Delete recipe" }).click();
    await expect(page.getByRole("heading", { name: "QA Lemon Pasta" })).toBeVisible();

    page.once("dialog", async (dialog) => {
      await dialog.accept();
    });
    await page.getByRole("button", { name: "Delete recipe" }).click();
    await expect(page).toHaveURL(/\/library$/);
    await expect(page.getByRole("link", { name: /QA Lemon Pasta/ })).toHaveCount(0);
  });
});

test.describe("Sprint 1 import", () => {
  test("validates bad URLs, handles provider failures, saves a mocked extraction, and redirects to detail", async ({
    page,
  }) => {
    await register(page, uniqueEmail("import"));

    let importRequests = 0;
    page.on("request", (request) => {
      if (request.url().includes("/api/ai/import")) importRequests += 1;
    });

    await page.goto("/import");
    await page.getByPlaceholder("Paste a recipe URL or a YouTube link").fill("not-a-url");
    await page.getByRole("button", { name: "Bring it in" }).click();
    await expect(page.locator("input[type='url']:invalid")).toHaveCount(1);
    expect(importRequests).toBe(0);

    await page.route("**/api/ai/import", async (route) => {
      await route.fulfill({
        status: 502,
        contentType: "application/json",
        body: JSON.stringify({ error: "Could not fetch page." }),
      });
    });
    await page.getByPlaceholder("Paste a recipe URL or a YouTube link").fill("https://example.invalid/recipe");
    await page.getByRole("button", { name: "Bring it in" }).click();
    await expect(page.getByText("Could not fetch page.")).toBeVisible();
    await page.unroute("**/api/ai/import");

    await page.route("**/api/ai/import", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(sampleRecipe({ title: "QA Imported Cake" })),
      });
    });

    await page.getByRole("button", { name: "Try another link" }).click();
    await page.getByPlaceholder("Paste a recipe URL or a YouTube link").fill("https://example.com/imported-cake");
    await page.getByRole("button", { name: "Bring it in" }).click();
    await expect(page.getByRole("status").getByText("Done")).toBeVisible();
    await expect(page).toHaveURL(/\/recipes\/.+/);
    await expect(page.getByRole("heading", { name: "QA Imported Cake" })).toBeVisible();

    await page.goto("/library");
    await expect(page.getByRole("link", { name: /QA Imported Cake, 4 servings/ })).toBeVisible();
  });
});

test.describe("Sprint 1 screenshots", () => {
  test("captures required desktop screenshots", async ({ page }) => {
    const email = uniqueEmail("screens");

    await page.goto("/register");
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, "register.png"), fullPage: true });

    await page.goto("/login");
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, "login.png"), fullPage: true });

    await register(page, email);
    await expectEmptyLibrary(page);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, "library-empty.png"), fullPage: true });

    await page.goto("/import");
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, "import-form.png"), fullPage: true });

    const recipe = await createRecipe(page, sampleRecipe({ title: "QA Screenshot Pasta" }));
    await page.goto("/library");
    await expect(page.getByRole("link", { name: /QA Screenshot Pasta, 4 servings/ })).toBeVisible();
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, "library-populated.png"), fullPage: true });

    await page.goto(`/recipes/${recipe.id}`);
    await expect(page.getByRole("heading", { name: "QA Screenshot Pasta" })).toBeVisible();
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, "recipe-detail.png"), fullPage: true });

    await page.getByRole("button", { name: "Increase servings" }).click();
    await expect(page.locator(".serving-count")).toHaveText("5");
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, "recipe-scaled.png"), fullPage: true });

    await page.getByRole("button", { name: "imperial" }).click();
    await expect(page.getByRole("button", { name: "imperial" })).toHaveAttribute("aria-pressed", "true");
    await expect(page.getByRole("button", { name: "imperial" })).toHaveCSS("border-bottom-color", "rgb(184, 92, 56)");
    await expect(page.getByRole("button", { name: "metric" })).toHaveCSS("border-bottom-color", "rgba(0, 0, 0, 0)");
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, "recipe-unit-toggled.png"), fullPage: true });

    await page.route("**/api/ai/import", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(sampleRecipe({ title: "QA Screenshot Import" })),
      });
    });
    await page.goto("/import");
    await page.getByPlaceholder("Paste a recipe URL or a YouTube link").fill("https://example.com/screenshot-import");
    await page.getByRole("button", { name: "Bring it in" }).click();
    await expect(page.getByRole("status").getByText("Done")).toBeVisible();
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, "import-preview.png"), fullPage: true });
  });
});
