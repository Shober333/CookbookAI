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
  return `qa-s2-${label}-${Date.now()}-${Math.random().toString(36).slice(2)}@example.com`;
}

function sampleRecipe(overrides: Partial<RecipePayload> = {}): RecipePayload {
  return {
    title: "S2 Lemon Pasta",
    description: "A bright Sprint 2 test recipe.",
    sourceUrl: "https://example.com/s2-lemon-pasta",
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
  return body.recipe as RecipePayload & { id: string; adaptedSteps: string[] | null };
}

async function setEquipment(page: Page, appliances: string[]) {
  const response = await page.request.put("/api/equipment", {
    data: { appliances },
  });
  expect(response.status()).toBe(200);
  return response.json() as Promise<{ appliances: string[] }>;
}

// ─── Equipment Profile (E1–E5) ─────────────────────────────────────────────

test.describe("Sprint 2 — equipment profile", () => {
  test("E1+E2+E3: save, update, and start empty on /equipment", async ({ page }) => {
    const email = uniqueEmail("equipment");
    await register(page, email);

    // E3 — empty state on first visit
    await page.goto("/equipment");
    await expect(page.getByRole("heading", { name: "Your kitchen." })).toBeVisible();
    await expect(page.getByText("Pick at least one to start.")).toBeVisible();
    const save = page.getByRole("button", { name: "Save changes" });
    await expect(save).toBeDisabled();

    // E1 — save with two appliances
    await page.getByRole("button", { name: "Oven" }).click();
    await page.getByRole("button", { name: "Air fryer" }).click();
    await expect(save).toBeEnabled();
    await save.click();
    await expect(page.getByText(/^(Saved\.|Last saved|Saved \d)/)).toBeVisible();

    const after = await page.request.get("/api/equipment");
    expect(after.status()).toBe(200);
    const body = (await after.json()) as { appliances: string[] };
    expect(body.appliances.sort()).toEqual(["air_fryer", "oven"]);

    // After save, button should disable (no diff)
    await expect(save).toBeDisabled();

    // E2 — update: uncheck Air fryer, check Grill, save
    await page.getByRole("button", { name: "Air fryer" }).click();
    await page.getByRole("button", { name: "Grill" }).click();
    await expect(save).toBeEnabled();
    await save.click();
    await expect(save).toBeDisabled();

    const updated = await page.request.get("/api/equipment");
    const updatedBody = (await updated.json()) as { appliances: string[] };
    expect(updatedBody.appliances.sort()).toEqual(["grill", "oven"]);
  });

  test("E4: cross-user isolation on GET /api/equipment", async ({ page }) => {
    const userA = uniqueEmail("equip-a");
    const userB = uniqueEmail("equip-b");

    await register(page, userA);
    await setEquipment(page, ["oven", "stovetop"]);
    await logout(page);

    await register(page, userB);
    await setEquipment(page, ["microwave"]);

    const me = await page.request.get("/api/equipment");
    const myBody = (await me.json()) as { appliances: string[] };
    expect(myBody.appliances).toEqual(["microwave"]);
    expect(myBody.appliances).not.toContain("oven");
  });

  test("E5: unauthenticated GET /api/equipment returns 401", async ({ page, request }) => {
    // Use a fresh request context that has no auth cookie
    await page.context().clearCookies();
    const res = await request.get("/api/equipment");
    expect(res.status()).toBe(401);
  });
});

// ─── AI adaptation (A1–A6) ────────────────────────────────────────────────

const MOCK_ADAPT_RESPONSE = {
  adaptedSteps: [
    "Heat the air fryer to 200°C / 400°F.",
    "Air fry the pasta sauce ingredients for 8 minutes.",
    "Toss the cooked pasta with the air-fried sauce.",
  ],
  notes: "Replaced stovetop sauce-making with the air fryer.",
};

test.describe("Sprint 2 — AI adaptation", () => {
  test("A1+A2+A3: adapt happy path, save, then re-adapt and discard", async ({ page }) => {
    const email = uniqueEmail("adapt-happy");
    await register(page, email);
    await setEquipment(page, ["air_fryer", "oven"]);
    const recipe = await createRecipe(page, sampleRecipe({ title: "S2 Adapt Pasta" }));

    await page.route("**/api/ai/adapt", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(MOCK_ADAPT_RESPONSE),
      });
    });

    await page.goto(`/recipes/${recipe.id}`);
    await expect(page.getByRole("heading", { name: "S2 Adapt Pasta" })).toBeVisible();

    // A1 — happy path
    const adaptBtn = page.getByRole("button", { name: "Adapt for my kitchen" });
    await expect(adaptBtn).toBeEnabled();
    await adaptBtn.click();

    await expect(page.getByText("Adapted for your kitchen", { exact: true })).toBeVisible();
    await expect(page.getByText("Air fry the pasta sauce ingredients for 8 minutes.")).toBeVisible();
    await expect(page.getByText("Replaced stovetop sauce-making with the air fryer.")).toBeVisible();

    // A2 — save this version. After save the panel is auto-expanded, so the
    // toggle reads "Hide adapted version".
    await page.getByRole("button", { name: "Save this version" }).click();
    await expect(page.getByText("Adapted for your kitchen — saved")).toBeVisible();
    await expect(page.getByRole("button", { name: /Hide adapted version/i })).toBeVisible();

    // Reload — saved state should persist; default to collapsed.
    await page.reload();
    await expect(page.getByText("Adapted for your kitchen — saved")).toBeVisible();
    await page.getByRole("button", { name: /Show adapted version/i }).click();
    await expect(page.getByText("Air fry the pasta sauce ingredients for 8 minutes.")).toBeVisible();

    // A3 — discard saved (window.confirm)
    page.once("dialog", async (dialog) => {
      expect(dialog.message()).toContain("Discard");
      await dialog.accept();
    });
    await page.getByRole("button", { name: "Discard", exact: true }).click();
    await expect(page.getByText("Adapt this for your kitchen.")).toBeVisible();
  });

  test("A4: adapt button disabled when user has no kitchen saved", async ({ page }) => {
    const email = uniqueEmail("adapt-no-equip");
    await register(page, email);
    const recipe = await createRecipe(page, sampleRecipe({ title: "S2 Adapt NoKitchen" }));

    await page.goto(`/recipes/${recipe.id}`);
    const adaptBtn = page.getByRole("button", { name: "Adapt for my kitchen" });
    await expect(adaptBtn).toBeDisabled();
    await expect(page.getByRole("link", { name: "Kitchen settings" })).toBeVisible();
    await expect(page.getByRole("link", { name: /Set up your kitchen/ })).toHaveCount(0);
  });

  test("A5: unauthenticated POST /api/ai/adapt returns 401", async ({ page, request }) => {
    await page.context().clearCookies();
    const res = await request.post("/api/ai/adapt", {
      data: { recipeId: "anything", appliances: ["oven"] },
    });
    expect(res.status()).toBe(401);
  });

  test("A6: POST /api/ai/adapt for another user's recipe returns 403", async ({ page }) => {
    const ownerEmail = uniqueEmail("adapt-owner");
    const otherEmail = uniqueEmail("adapt-other");

    await register(page, ownerEmail);
    const ownersRecipe = await createRecipe(page, sampleRecipe({ title: "S2 Owner Recipe" }));
    await logout(page);

    await register(page, otherEmail);
    await setEquipment(page, ["oven"]);

    const res = await page.request.post("/api/ai/adapt", {
      data: { recipeId: ownersRecipe.id, appliances: ["oven"] },
    });
    expect(res.status()).toBe(403);
  });
});

// ─── Library search (S1–S4) ───────────────────────────────────────────────

test.describe("Sprint 2 — library search", () => {
  test("S1+S2+S3: filter by title, empty state, and clear", async ({ page }) => {
    const email = uniqueEmail("search");
    await register(page, email);
    await createRecipe(page, sampleRecipe({ title: "S2 Lemon Pasta" }));
    await createRecipe(page, sampleRecipe({ title: "S2 Tomato Soup", tags: ["soup"] }));
    await createRecipe(page, sampleRecipe({ title: "S2 Garlic Bread" }));

    await page.goto("/library");
    await expect(page.getByRole("heading", { name: "3 recipes, kept carefully." })).toBeVisible();

    // S1 — partial title match
    const search = page.getByLabel("Search recipes");
    await search.fill("lemon");
    await expect(page).toHaveURL(/\/library\?q=lemon$/);
    await expect(page.getByRole("link", { name: /S2 Lemon Pasta/ })).toBeVisible();
    await expect(page.getByRole("link", { name: /S2 Tomato Soup/ })).toHaveCount(0);
    await expect(page.getByRole("heading", { name: "One matching recipe, kept carefully." })).toBeVisible();
    await expect(page.getByText("Matching “lemon”")).toBeVisible();

    // S2 — no matches
    await search.fill("zzzqqq");
    await expect(page.getByRole("heading", { name: "No matches yet." })).toBeVisible();
    await expect(page.getByText("No recipes matching “zzzqqq”.")).toBeVisible();
    await expect(page.getByRole("button", { name: "Clear search" })).toBeVisible();

    // S3 — clear via the Clear button
    await page.getByRole("button", { name: "Clear search" }).click();
    await expect(search).toHaveValue("");
    await expect(page.getByRole("heading", { name: "3 recipes, kept carefully." })).toBeVisible();
    await expect(page).toHaveURL(/\/library$/);
  });

  test("S4: search is per-user (private libraries)", async ({ page }) => {
    const userA = uniqueEmail("search-a");
    const userB = uniqueEmail("search-b");

    await register(page, userA);
    await createRecipe(page, sampleRecipe({ title: "S2 PrivateA Cake" }));
    await logout(page);

    await register(page, userB);
    await createRecipe(page, sampleRecipe({ title: "S2 PublicB Soup" }));

    await page.goto("/library");
    const search = page.getByLabel("Search recipes");
    await search.fill("PrivateA");

    await expect(page.getByText("No recipes matching “PrivateA”.")).toBeVisible();
    await expect(page.getByRole("link", { name: /PrivateA/ })).toHaveCount(0);
  });
});

// ─── Markdown download (F4) ───────────────────────────────────────────────

test.describe("Sprint 2 — markdown download", () => {
  test("Download .md exports the original recipe", async ({ page }) => {
    const email = uniqueEmail("download");
    await register(page, email);
    const recipe = await createRecipe(page, sampleRecipe({ title: "S2 Download Pasta" }));

    await page.goto(`/recipes/${recipe.id}`);
    const downloadPromise = page.waitForEvent("download");
    await page.getByRole("button", { name: "Download recipe as Markdown" }).click();
    const download = await downloadPromise;

    expect(download.suggestedFilename()).toBe("s2-download-pasta.md");

    const stream = await download.createReadStream();
    const chunks: Buffer[] = [];
    for await (const chunk of stream) chunks.push(chunk as Buffer);
    const content = Buffer.concat(chunks).toString("utf8");

    expect(content).toContain("# S2 Download Pasta");
    expect(content).toContain("**Servings:** 4");
    expect(content).toContain("- 200 g spaghetti");
    expect(content).toContain("1. Boil the pasta.");
    expect(content).not.toContain("(adapted for your kitchen)");
  });
});

// ─── Sprint 2 screenshots ─────────────────────────────────────────────────

test.describe("Sprint 2 screenshots", () => {
  test("captures equipment, adapt, and library-search screenshots", async ({ page }) => {
    const email = uniqueEmail("screens");
    await register(page, email);

    // equipment-empty
    await page.goto("/equipment");
    await expect(page.getByRole("heading", { name: "Your kitchen." })).toBeVisible();
    await expect(page.getByRole("button", { name: "Save changes" })).toBeDisabled();
    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, "equipment-empty.png"),
      fullPage: true,
    });

    // equipment-saved
    await page.getByRole("button", { name: "Oven" }).click();
    await page.getByRole("button", { name: "Air fryer" }).click();
    await page.getByRole("button", { name: "Save changes" }).click();
    await expect(page.getByText(/^(Saved\.|Last saved|Saved \d)/)).toBeVisible();
    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, "equipment-saved.png"),
      fullPage: true,
    });

    // Set up a recipe for adapt screenshots
    const recipe = await createRecipe(page, sampleRecipe({ title: "S2 Screenshot Adapt" }));

    // recipe-adapt-loading: hold the response open so the pulse is visible
    const releaseAdapt: { current: (() => void) | null } = { current: null };
    const heldAdapt = new Promise<void>((resolve) => {
      releaseAdapt.current = resolve;
    });

    await page.route("**/api/ai/adapt", async (route) => {
      await heldAdapt;
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(MOCK_ADAPT_RESPONSE),
      });
    });

    await page.goto(`/recipes/${recipe.id}`);
    await page.getByRole("button", { name: "Adapt for my kitchen" }).click();
    await expect(page.getByText("Rewriting…")).toBeVisible();
    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, "recipe-adapt-loading.png"),
      fullPage: true,
    });

    if (!releaseAdapt.current) {
      throw new Error("Adapt release callback was not initialised");
    }
    releaseAdapt.current();
    await expect(page.getByText("Adapted for your kitchen", { exact: true })).toBeVisible();
    await expect(page.getByText("Air fry the pasta sauce ingredients for 8 minutes.")).toBeVisible();
    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, "recipe-adapted.png"),
      fullPage: true,
    });

    // recipe-adapted-saved: save and reload
    await page.getByRole("button", { name: "Save this version" }).click();
    await expect(page.getByText("Adapted for your kitchen — saved")).toBeVisible();
    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, "recipe-adapted-saved.png"),
      fullPage: true,
    });

    // library-search
    await createRecipe(page, sampleRecipe({ title: "S2 Library Tomato Soup" }));
    await createRecipe(page, sampleRecipe({ title: "S2 Library Garlic Bread" }));
    await page.goto("/library");
    await page.getByLabel("Search recipes").fill("tomato");
    await expect(page.getByRole("link", { name: /Tomato Soup/ })).toBeVisible();
    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, "library-search.png"),
      fullPage: true,
    });
  });
});
