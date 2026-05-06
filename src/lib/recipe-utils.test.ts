import { describe, it, expect } from "vitest";
import {
  scaleAmount,
  roundScaled,
  convertUnit,
  convertTemperatureText,
  formatAmount,
  toRoman,
  extractDomain,
  extractYouTubeVideoId,
  getRecipeSourceProvenance,
  parseYouTubeEmbedVideoId,
  parseJsonObjectFromText,
  slugify,
  recipeToMarkdown,
} from "./recipe-utils";
import type { RecipeResponse } from "@/types/recipe";

// ─── scaleAmount ─────────────────────────────────────────────────────────────

describe("scaleAmount", () => {
  it("scales up proportionally", () => {
    expect(scaleAmount(2, 4, 8)).toBe(4);
  });

  it("scales down proportionally", () => {
    expect(scaleAmount(3, 6, 2)).toBe(1);
  });

  it("returns same value when baseline equals target", () => {
    expect(scaleAmount(5, 4, 4)).toBe(5);
  });

  it("passes through null (to taste)", () => {
    expect(scaleAmount(null, 4, 8)).toBeNull();
  });

  it("returns original when baseline is 0 (guard against division by zero)", () => {
    expect(scaleAmount(3, 0, 8)).toBe(3);
  });

  it("handles fractional scaling", () => {
    expect(scaleAmount(1, 4, 6)).toBeCloseTo(1.5);
  });
});

// ─── roundScaled ─────────────────────────────────────────────────────────────

describe("roundScaled", () => {
  it("rounds grams ≥ 50 to whole number", () => {
    expect(roundScaled(53.7, "g")).toBe(54);
    expect(roundScaled(100.9, "g")).toBe(101);
  });

  it("rounds grams < 50 to 1 decimal place", () => {
    expect(roundScaled(12.36, "g")).toBe(12.4);
    expect(roundScaled(5.05, "g")).toBe(5.1);
  });

  it("rounds tsp to 1 decimal place", () => {
    expect(roundScaled(1.333, "tsp")).toBe(1.3);
  });

  it("rounds tbsp to 1 decimal place", () => {
    expect(roundScaled(2.66, "tbsp")).toBe(2.7);
  });

  it("preserves fractional cups", () => {
    expect(roundScaled(1.25, "cup")).toBe(1.25);
    expect(roundScaled(0.25, "cups")).toBe(0.25);
    expect(roundScaled(1.756, "cups")).toBe(1.76);
  });

  it("defaults to 1 decimal place for unknown units", () => {
    expect(roundScaled(3.456, "lb")).toBe(3.5);
  });

  it("is case-insensitive for units", () => {
    expect(roundScaled(60.5, "G")).toBe(61);
    expect(roundScaled(1.25, "TSP")).toBe(1.3);
  });
});

// ─── convertUnit ─────────────────────────────────────────────────────────────

describe("convertUnit", () => {
  it("passes through metric units when system is metric", () => {
    expect(convertUnit(200, "g", "metric")).toEqual({ amount: 200, unit: "g" });
  });

  it("passes through null amount regardless of system", () => {
    expect(convertUnit(null, "g", "imperial")).toEqual({ amount: null, unit: "g" });
  });

  it("converts g to oz", () => {
    // 100g / 28.35 = 3.527... → 3.5
    expect(convertUnit(100, "g", "imperial")).toEqual({ amount: 3.5, unit: "oz" });
  });

  it("converts g to oz as an imperial regression check", () => {
    expect(convertUnit(200, "g", "imperial")).toEqual({ amount: 7.1, unit: "oz" });
  });

  it("converts kg to lb", () => {
    // 1kg / 0.4536 = 2.204... → 2.2
    expect(convertUnit(1, "kg", "imperial")).toEqual({ amount: 2.2, unit: "lb" });
  });

  it("converts ml to fl oz", () => {
    // 240ml / 29.57 = 8.11... → 8.1
    expect(convertUnit(240, "ml", "imperial")).toEqual({ amount: 8.1, unit: "fl oz" });
  });

  it("converts l to qt", () => {
    // 1l / 0.946 = 1.0571... → 1.06
    expect(convertUnit(1, "l", "imperial")).toEqual({ amount: 1.06, unit: "qt" });
  });

  it("converts oz to g in metric mode", () => {
    expect(convertUnit(2, "oz", "metric")).toEqual({ amount: 57, unit: "g" });
  });

  it("converts small oz amounts to g with one decimal", () => {
    expect(convertUnit(1, "oz", "metric")).toEqual({ amount: 28.4, unit: "g" });
  });

  it("converts lb to kg in metric mode", () => {
    expect(convertUnit(2, "lb", "metric")).toEqual({ amount: 0.91, unit: "kg" });
  });

  it("converts cup to ml in metric mode", () => {
    expect(convertUnit(1, "cup", "metric")).toEqual({ amount: 240, unit: "ml" });
  });

  it("converts tbsp to ml in metric mode", () => {
    expect(convertUnit(1, "tbsp", "metric")).toEqual({ amount: 15, unit: "ml" });
  });

  it("converts tsp to ml in metric mode", () => {
    expect(convertUnit(1, "tsp", "metric")).toEqual({ amount: 5, unit: "ml" });
  });

  it("passes through tsp unchanged", () => {
    expect(convertUnit(2, "tsp", "imperial")).toEqual({ amount: 2, unit: "tsp" });
  });

  it("passes through tbsp unchanged", () => {
    expect(convertUnit(1, "tbsp", "imperial")).toEqual({ amount: 1, unit: "tbsp" });
  });

  it("passes through cup unchanged", () => {
    expect(convertUnit(0.5, "cup", "imperial")).toEqual({ amount: 0.5, unit: "cup" });
  });

  it("passes through unknown units unchanged", () => {
    expect(convertUnit(3, "clove", "imperial")).toEqual({ amount: 3, unit: "clove" });
  });

  it("is case-insensitive for units", () => {
    expect(convertUnit(100, "G", "imperial")).toEqual({ amount: 3.5, unit: "oz" });
  });
});

// ─── convertTemperatureText ────────────────────────────────────────────────

describe("convertTemperatureText", () => {
  it("converts Fahrenheit oven temperatures to Celsius in metric mode", () => {
    expect(convertTemperatureText("Bake at 375°F until crisp.", "metric")).toBe(
      "Bake at 190°C until crisp.",
    );
  });

  it("converts Fahrenheit safety temperatures to Celsius without coarse rounding", () => {
    expect(convertTemperatureText("Cook to 165 degrees F.", "metric")).toBe(
      "Cook to 74°C.",
    );
  });

  it("converts spelled-out Fahrenheit temperatures in metric mode", () => {
    expect(convertTemperatureText("Roast at 350 degrees Fahrenheit.", "metric")).toBe(
      "Roast at 175°C.",
    );
  });

  it("converts Celsius temperatures to Fahrenheit in imperial mode", () => {
    expect(convertTemperatureText("Bake at 190°C until crisp.", "imperial")).toBe(
      "Bake at 375°F until crisp.",
    );
  });

  it("chooses the selected system from dual-unit temperatures", () => {
    const step = "Preheat to 375°F (190°C).";

    expect(convertTemperatureText(step, "metric")).toBe("Preheat to 190°C.");
    expect(convertTemperatureText(step, "imperial")).toBe("Preheat to 375°F.");
  });
});

// ─── formatAmount ─────────────────────────────────────────────────────────────

describe("formatAmount", () => {
  it("returns empty string for null", () => {
    expect(formatAmount(null)).toBe("");
  });

  it("drops trailing .0", () => {
    expect(formatAmount(2.0)).toBe("2");
    expect(formatAmount(100.0)).toBe("100");
  });

  it("keeps meaningful decimals", () => {
    expect(formatAmount(1.5)).toBe("1.5");
    expect(formatAmount(3.14)).toBe("3.14");
  });
});

// ─── toRoman ─────────────────────────────────────────────────────────────────

describe("toRoman", () => {
  it("converts single digits", () => {
    expect(toRoman(1)).toBe("i");
    expect(toRoman(4)).toBe("iv");
    expect(toRoman(5)).toBe("v");
    expect(toRoman(9)).toBe("ix");
  });

  it("converts teens", () => {
    expect(toRoman(10)).toBe("x");
    expect(toRoman(11)).toBe("xi");
    expect(toRoman(14)).toBe("xiv");
    expect(toRoman(19)).toBe("xix");
  });

  it("converts larger numbers", () => {
    expect(toRoman(40)).toBe("xl");
    expect(toRoman(50)).toBe("l");
    expect(toRoman(90)).toBe("xc");
    expect(toRoman(100)).toBe("c");
  });

  it("converts typical recipe step counts", () => {
    expect(toRoman(3)).toBe("iii");
    expect(toRoman(8)).toBe("viii");
    expect(toRoman(12)).toBe("xii");
  });
});

// ─── extractDomain ───────────────────────────────────────────────────────────

describe("extractDomain", () => {
  it("extracts bare domain", () => {
    expect(extractDomain("https://seriouseats.com/recipe/123")).toBe("seriouseats.com");
  });

  it("strips www prefix", () => {
    expect(extractDomain("https://www.allrecipes.com/recipe/123")).toBe("allrecipes.com");
  });

  it("returns null for null", () => {
    expect(extractDomain(null)).toBeNull();
  });

  it("returns null for undefined", () => {
    expect(extractDomain(undefined)).toBeNull();
  });

  it("returns null for empty string", () => {
    expect(extractDomain("")).toBeNull();
  });

  it("returns null for an invalid URL", () => {
    expect(extractDomain("not-a-url")).toBeNull();
  });
});

// ─── extractYouTubeVideoId ─────────────────────────────────────────────────

describe("extractYouTubeVideoId", () => {
  it("extracts video IDs from watch URLs", () => {
    expect(
      extractYouTubeVideoId("https://www.youtube.com/watch?v=abc_123-xyz"),
    ).toBe("abc_123-xyz");
  });

  it("extracts video IDs from short URLs", () => {
    expect(extractYouTubeVideoId("https://youtu.be/abc1234?t=30")).toBe(
      "abc1234",
    );
  });

  it("extracts video IDs from Shorts URLs", () => {
    expect(extractYouTubeVideoId("https://m.youtube.com/shorts/short_123")).toBe(
      "short_123",
    );
  });

  it("returns null for non-YouTube URLs", () => {
    expect(extractYouTubeVideoId("https://example.com/watch?v=abc1234")).toBeNull();
  });

  it("returns null for invalid or missing values", () => {
    expect(extractYouTubeVideoId("not-a-url")).toBeNull();
    expect(extractYouTubeVideoId(null)).toBeNull();
  });
});

// ─── parseJsonObjectFromText ────────────────────────────────────────────────

describe("parseJsonObjectFromText", () => {
  it("parses raw JSON objects", () => {
    expect(parseJsonObjectFromText('{"title":"Soup","servings":4}')).toEqual({
      title: "Soup",
      servings: 4,
    });
  });

  it("parses JSON objects wrapped in markdown fences", () => {
    const output = '```json\n{"title":"Soup","steps":["Simmer."]}\n```';

    expect(parseJsonObjectFromText(output)).toEqual({
      title: "Soup",
      steps: ["Simmer."],
    });
  });

  it("parses JSON objects wrapped in model prose", () => {
    const output = 'Here is the recipe:\n{"title":"Soup","notes":"Use } in text safely."}\nEnjoy.';

    expect(parseJsonObjectFromText(output)).toEqual({
      title: "Soup",
      notes: "Use } in text safely.",
    });
  });

  it("rejects text without a JSON object", () => {
    expect(() => parseJsonObjectFromText("I could not find a recipe.")).toThrow();
  });
});

// ─── slugify ──────────────────────────────────────────────────────────────

describe("slugify", () => {
  it("lowercases and joins words with hyphens", () => {
    expect(slugify("Cacio e Pepe with Brown Butter")).toBe(
      "cacio-e-pepe-with-brown-butter",
    );
  });

  it("strips non-ASCII punctuation", () => {
    expect(slugify("Mom's Sunday Bolognese")).toBe("moms-sunday-bolognese");
  });

  it("strips trailing punctuation", () => {
    expect(slugify("Hot Dogs!")).toBe("hot-dogs");
  });

  it("collapses repeated whitespace and hyphens", () => {
    expect(slugify("  Spicy   Soba   Bowl  ")).toBe("spicy-soba-bowl");
    expect(slugify("Cookies---and---cream")).toBe("cookies-and-cream");
  });

  it("strips diacritics", () => {
    expect(slugify("Crème brûlée")).toBe("creme-brulee");
  });
});

// ─── source presentation helpers ──────────────────────────────────────────

describe("parseYouTubeEmbedVideoId", () => {
  it("parses standard, short, shorts, and embed YouTube URLs", () => {
    expect(
      parseYouTubeEmbedVideoId("https://www.youtube.com/watch?v=abc_123-xyz"),
    ).toBe("abc_123-xyz");
    expect(parseYouTubeEmbedVideoId("https://youtu.be/abc_123-xyz")).toBe(
      "abc_123-xyz",
    );
    expect(
      parseYouTubeEmbedVideoId("https://www.youtube.com/shorts/abc_123-xyz"),
    ).toBe("abc_123-xyz");
    expect(
      parseYouTubeEmbedVideoId("https://www.youtube.com/embed/abc_123-xyz"),
    ).toBe("abc_123-xyz");
  });

  it("rejects non-YouTube and malformed video URLs", () => {
    expect(parseYouTubeEmbedVideoId("https://example.com/watch?v=abc123")).toBeNull();
    expect(parseYouTubeEmbedVideoId("https://www.youtube.com/feed/subscriptions")).toBeNull();
    expect(parseYouTubeEmbedVideoId("not a url")).toBeNull();
  });
});

describe("getRecipeSourceProvenance", () => {
  it("formats Browser-assisted URL provenance without naming the provider", () => {
    expect(
      getRecipeSourceProvenance({
        sourceKind: "url",
        sourceUrl: "https://www.example.com/recipe",
        sourceImportMethod: "browserbase",
      }),
    ).toEqual({
      label: "example.com",
      href: "https://www.example.com/recipe",
      suffix: "read in a browser",
    });
  });

  it("formats YouTube link provenance with the resolved recipe domain", () => {
    expect(
      getRecipeSourceProvenance({
        sourceKind: "youtube-link",
        sourceUrl: "https://www.seriouseats.com/cacio",
        sourceImportMethod: "fetch",
      }),
    ).toEqual({
      label: "seriouseats.com",
      href: "https://www.seriouseats.com/cacio",
      suffix: "first found on YouTube",
    });
  });

  it("formats text and YouTube transcript provenance", () => {
    expect(
      getRecipeSourceProvenance({
        sourceKind: "text",
        sourceUrl: null,
        sourceImportMethod: "text",
      }),
    ).toEqual({ label: "pasted text" });

    expect(
      getRecipeSourceProvenance({
        sourceKind: "youtube-transcript",
        sourceUrl: "https://youtu.be/abc1234",
        sourceImportMethod: "fetch",
      }),
    ).toEqual({
      label: "YouTube transcript",
      href: "https://youtu.be/abc1234",
    });

    expect(
      getRecipeSourceProvenance({
        sourceKind: "youtube-direct-video",
        sourceUrl: "https://youtu.be/abc1234",
        sourceImportMethod: "video-ai",
      }),
    ).toEqual({
      label: "YouTube video",
      href: "https://youtu.be/abc1234",
      suffix: "read by AI",
    });
  });

  it("falls back to legacy source URL behavior", () => {
    expect(
      getRecipeSourceProvenance({
        sourceKind: null,
        sourceUrl: "https://www.example.com/recipe",
        sourceImportMethod: null,
      }),
    ).toEqual({
      label: "example.com",
      href: "https://www.example.com/recipe",
    });
  });
});

// ─── recipeToMarkdown ─────────────────────────────────────────────────────

const FIXTURE: RecipeResponse = {
  id: "r1",
  userId: "u1",
  title: "Cacio e Pepe",
  description: "A simple Roman pasta.",
  sourceUrl: "https://www.seriouseats.com/recipe/123",
  servings: 4,
  ingredients: [
    { amount: 200, unit: "g", name: "spaghetti" },
    { amount: 1, unit: "cup", name: "pecorino", notes: "grated" },
    { amount: null, unit: "", name: "black pepper" },
  ],
  steps: ["Boil the pasta.", "Toss with pepper and cheese."],
  adaptedSteps: ["Air fry the noodles.", "Stir in the cheese off heat."],
  tags: ["italian", "pasta"],
  createdAt: "2026-05-01T00:00:00.000Z",
  updatedAt: "2026-05-01T00:00:00.000Z",
};

describe("recipeToMarkdown", () => {
  it("renders the original recipe with metric units", () => {
    const md = recipeToMarkdown(FIXTURE, {
      servings: 4,
      unitSystem: "metric",
      useAdapted: false,
    });
    expect(md).toContain("# Cacio e Pepe\n");
    expect(md).toContain("*A simple Roman pasta.*");
    expect(md).toContain("_Source: seriouseats.com_  ");
    expect(md).toContain("**Servings:** 4");
    expect(md).toContain("## Ingredients");
    expect(md).toContain("- 200 g spaghetti");
    expect(md).toContain("- 240 ml pecorino, grated");
    expect(md).toContain("- black pepper — to taste");
    expect(md).toContain("## Method");
    expect(md).toContain("1. Boil the pasta.");
    expect(md).toContain("2. Toss with pepper and cheese.");
    expect(md).not.toContain("Air fry");
  });

  it("scales ingredient amounts when servings change", () => {
    const md = recipeToMarkdown(FIXTURE, {
      servings: 8,
      unitSystem: "metric",
      useAdapted: false,
    });
    expect(md).toContain("- 400 g spaghetti");
    expect(md).toContain("**Servings:** 8");
  });

  it("converts to imperial when requested", () => {
    const md = recipeToMarkdown(FIXTURE, {
      servings: 4,
      unitSystem: "imperial",
      useAdapted: false,
    });
    expect(md).toContain("- 7.1 oz spaghetti");
    expect(md).toContain("- 1 cup pecorino, grated");
  });

  it("appends '(adapted for your kitchen)' and uses adapted steps when useAdapted=true", () => {
    const md = recipeToMarkdown(FIXTURE, {
      servings: 4,
      unitSystem: "metric",
      useAdapted: true,
    });
    expect(md).toContain("# Cacio e Pepe (adapted for your kitchen)");
    expect(md).toContain("1. Air fry the noodles.");
    expect(md).toContain("2. Stir in the cheese off heat.");
    expect(md).not.toContain("Boil the pasta.");
  });

  it("falls back to original steps when useAdapted=true but no adapted steps", () => {
    const md = recipeToMarkdown(
      { ...FIXTURE, adaptedSteps: null },
      { servings: 4, unitSystem: "metric", useAdapted: true },
    );
    expect(md).toContain("1. Boil the pasta.");
  });

  it("converts method temperatures in Markdown exports", () => {
    const md = recipeToMarkdown(
      { ...FIXTURE, steps: ["Bake at 375°F (190°C)."] },
      { servings: 4, unitSystem: "metric", useAdapted: false },
    );

    expect(md).toContain("1. Bake at 190°C.");
    expect(md).not.toContain("375°F");
  });

  it("skips empty fields cleanly", () => {
    const minimal: RecipeResponse = {
      ...FIXTURE,
      description: null,
      sourceUrl: null,
      ingredients: [],
      adaptedSteps: null,
    };
    const md = recipeToMarkdown(minimal, {
      servings: 4,
      unitSystem: "metric",
      useAdapted: false,
    });
    expect(md).not.toContain("Source");
    expect(md).not.toContain("undefined");
    expect(md).not.toContain("## Ingredients");
    expect(md).toContain("**Servings:** 4");
    expect(md).toContain("## Method");
  });
});
