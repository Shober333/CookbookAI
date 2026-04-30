import { describe, it, expect } from "vitest";
import {
  scaleAmount,
  roundScaled,
  convertUnit,
  formatAmount,
  toRoman,
  extractDomain,
  parseJsonObjectFromText,
} from "./recipe-utils";

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
  it("passes through when system is metric", () => {
    expect(convertUnit(200, "g", "metric")).toEqual({ amount: 200, unit: "g" });
  });

  it("passes through null amount regardless of system", () => {
    expect(convertUnit(null, "g", "imperial")).toEqual({ amount: null, unit: "g" });
  });

  it("converts g to oz", () => {
    // 100g / 28.35 = 3.527... → 3.5
    expect(convertUnit(100, "g", "imperial")).toEqual({ amount: 3.5, unit: "oz" });
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
