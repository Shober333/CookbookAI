import type { RecipeResponse } from "@/types/recipe";

// scaleAmount: proportionally scales an ingredient amount.
// Returns null for "to taste" ingredients (null input → passthrough).
export function scaleAmount(
  original: number | null,
  baseline: number,
  target: number
): number | null {
  if (original === null) return null;
  if (baseline === 0) return original;
  return original * (target / baseline);
}

// roundScaled: applies display rounding rules per COMPONENT_SPECS §3.
export function roundScaled(amount: number, unit: string): number {
  const u = unit.toLowerCase().trim();
  if (u === "g") return amount >= 50 ? Math.round(amount) : roundTo(amount, 1);
  if (u === "tsp" || u === "tbsp") return roundTo(amount, 1);
  if (u === "cup" || u === "cups") return roundTo(amount, 2);
  return roundTo(amount, 1);
}

// convertUnit: converts display units between metric and imperial systems.
// Stored recipe data remains unchanged; this only affects presentation.
export function convertUnit(
  amount: number | null,
  unit: string,
  system: "metric" | "imperial"
): { amount: number | null; unit: string } {
  if (amount === null) return { amount, unit };
  const u = unit.toLowerCase().trim();

  if (system === "metric") {
    switch (u) {
      case "oz": {
        const grams = amount * 28.35;
        return {
          amount: grams >= 50 ? Math.round(grams) : roundTo(grams, 1),
          unit: "g",
        };
      }
      case "lb":
      case "lbs":
        return { amount: roundTo(amount * 0.4536, 2), unit: "kg" };
      case "fl oz":
        return { amount: Math.round(amount * 29.57), unit: "ml" };
      case "qt":
        return { amount: roundTo(amount * 0.946, 2), unit: "l" };
      case "cup":
      case "cups":
        return { amount: Math.round(amount * 240), unit: "ml" };
      case "tbsp":
        return { amount: Math.round(amount * 15), unit: "ml" };
      case "tsp":
        return { amount: Math.round(amount * 5), unit: "ml" };
      default:
        return { amount, unit };
    }
  }

  switch (u) {
    case "g":
      return { amount: roundTo(amount / 28.35, 1), unit: "oz" };
    case "kg":
      return { amount: roundTo(amount / 0.4536, 1), unit: "lb" };
    case "ml":
      return { amount: roundTo(amount / 29.57, 1), unit: "fl oz" };
    case "l":
      return { amount: roundTo(amount / 0.946, 2), unit: "qt" };
    default:
      return { amount, unit };
  }
}

// convertTemperatureText: converts Fahrenheit/Celsius mentions in freeform
// method text for display. Stored recipe steps remain unchanged.
export function convertTemperatureText(
  text: string,
  system: "metric" | "imperial",
): string {
  const withoutDualTemps = text.replace(
    /(\d{2,3})\s*(?:°\s*)?(?:degrees?\s*)?(f|c|fahrenheit|celsius)\b\s*(?:\/|\(|,)?\s*(\d{2,3})\s*(?:°\s*)?(?:degrees?\s*)?(f|c|fahrenheit|celsius)\b\)?/gi,
    (match, firstValue, firstUnit, secondValue, secondUnit) => {
      const first = Number(firstValue);
      const second = Number(secondValue);
      const firstU = normalizeTemperatureUnit(firstUnit);
      const secondU = normalizeTemperatureUnit(secondUnit);

      if (!Number.isFinite(first) || !Number.isFinite(second) || firstU === secondU) {
        return match;
      }

      const metricValue = firstU === "C" ? first : second;
      const imperialValue = firstU === "F" ? first : second;
      return system === "metric"
        ? formatTemperature(metricValue, "C")
        : formatTemperature(imperialValue, "F");
    },
  );

  return withoutDualTemps.replace(
    /(\d{2,3})\s*(?:°\s*)?(?:degrees?\s*)?(f|c|fahrenheit|celsius)\b/gi,
    (match, value, unit) => {
      const amount = Number(value);
      const sourceUnit = normalizeTemperatureUnit(unit);

      if (!Number.isFinite(amount)) return match;

      if (system === "metric" && sourceUnit === "F") {
        return formatTemperature(fahrenheitToCelsius(amount), "C");
      }

      if (system === "imperial" && sourceUnit === "C") {
        return formatTemperature(celsiusToFahrenheit(amount), "F");
      }

      return formatTemperature(amount, sourceUnit);
    },
  );
}

// formatAmount: formats a number for display, dropping trailing .0
export function formatAmount(amount: number | null): string {
  if (amount === null) return "";
  return String(amount).replace(/\.0$/, "");
}

// toRoman: converts a positive integer to a lowercase Roman numeral string.
export function toRoman(n: number): string {
  const vals = [1000, 900, 500, 400, 100, 90, 50, 40, 10, 9, 5, 4, 1];
  const syms = ["m", "cm", "d", "cd", "c", "xc", "l", "xl", "x", "ix", "v", "iv", "i"];
  let result = "";
  for (let i = 0; i < vals.length; i++) {
    while (n >= vals[i]) {
      result += syms[i];
      n -= vals[i];
    }
  }
  return result;
}

// extractDomain: strips protocol, www, and path from a URL string.
export function extractDomain(url?: string | null): string | null {
  if (!url) return null;
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return null;
  }
}

// parseJsonObjectFromText: accepts raw JSON or a JSON object wrapped by model prose/fences.
export function parseJsonObjectFromText(text: string): Record<string, unknown> {
  const trimmed = text.trim();

  try {
    return parseRecord(JSON.parse(trimmed));
  } catch {
    const objectText = extractFirstJsonObject(trimmed);
    if (!objectText) throw new Error("No JSON object found.");
    return parseRecord(JSON.parse(objectText));
  }
}

function parseRecord(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error("Expected a JSON object.");
  }

  return value as Record<string, unknown>;
}

function extractFirstJsonObject(text: string): string | null {
  const start = text.indexOf("{");
  if (start === -1) return null;

  let depth = 0;
  let inString = false;
  let escaped = false;

  for (let i = start; i < text.length; i++) {
    const char = text[i];

    if (escaped) {
      escaped = false;
      continue;
    }

    if (char === "\\") {
      escaped = true;
      continue;
    }

    if (char === '"') {
      inString = !inString;
      continue;
    }

    if (inString) continue;

    if (char === "{") depth += 1;
    if (char === "}") depth -= 1;

    if (depth === 0) {
      return text.slice(start, i + 1);
    }
  }

  return null;
}

function roundTo(n: number, decimals: number): number {
  const f = Math.pow(10, decimals);
  return Math.round(n * f) / f;
}

function fahrenheitToCelsius(value: number): number {
  return (value - 32) * (5 / 9);
}

function celsiusToFahrenheit(value: number): number {
  return value * (9 / 5) + 32;
}

function normalizeTemperatureUnit(unit: string): "C" | "F" {
  return unit.toLowerCase().startsWith("c") ? "C" : "F";
}

function formatTemperature(value: number, unit: "C" | "F"): string {
  const rounded =
    value >= 100 ? Math.round(value / 5) * 5 : Math.round(value);

  return `${rounded}°${unit}`;
}

const COMBINING_MARKS_RE = /[̀-ͯ]/g;

// slugify: lowercase ASCII title with hyphen-separated words.
export function slugify(title: string): string {
  return title
    .toLowerCase()
    .normalize("NFKD")
    .replace(COMBINING_MARKS_RE, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export interface RecipeMarkdownOptions {
  servings: number;
  unitSystem: "metric" | "imperial";
  useAdapted: boolean;
}

// recipeToMarkdown: serializes a recipe to a Markdown export.
// Renders the user's currently-displayed amounts (scaled + converted),
// and either the original or adapted method per `useAdapted`.
export function recipeToMarkdown(
  recipe: RecipeResponse,
  options: RecipeMarkdownOptions,
): string {
  const { servings, unitSystem, useAdapted } = options;
  const lines: string[] = [];

  const titleSuffix = useAdapted ? " (adapted for your kitchen)" : "";
  lines.push(`# ${recipe.title}${titleSuffix}`);
  lines.push("");

  if (recipe.description && recipe.description.trim().length > 0) {
    lines.push(`*${recipe.description.trim()}*`);
    lines.push("");
  }

  const domain = extractDomain(recipe.sourceUrl);
  if (domain) {
    lines.push(`_Source: ${domain}_  `);
  }
  lines.push(`**Servings:** ${servings}`);
  lines.push("");

  if (recipe.ingredients.length > 0) {
    lines.push("## Ingredients");
    lines.push("");
    for (const ing of recipe.ingredients) {
      const scaled = scaleAmount(ing.amount, recipe.servings, servings);
      const rounded = scaled !== null ? roundScaled(scaled, ing.unit) : null;
      const { amount, unit } = convertUnit(rounded, ing.unit, unitSystem);
      const noteSuffix = ing.notes ? `, ${ing.notes}` : "";

      if (ing.amount === null) {
        lines.push(`- ${ing.name} — to taste${noteSuffix}`);
        continue;
      }

      const amountStr = formatAmount(amount);
      const unitStr = unit ? ` ${unit}` : "";
      const prefix = amountStr ? `${amountStr}${unitStr} ` : "";
      lines.push(`- ${prefix}${ing.name}${noteSuffix}`);
    }
    lines.push("");
  }

  const stepsToExport =
    useAdapted && recipe.adaptedSteps && recipe.adaptedSteps.length > 0
      ? recipe.adaptedSteps
      : recipe.steps;

  if (stepsToExport.length > 0) {
    lines.push("## Method");
    lines.push("");
    stepsToExport.forEach((step, i) => {
      lines.push(`${i + 1}. ${convertTemperatureText(step, unitSystem)}`);
    });
    lines.push("");
  }

  return lines.join("\n").replace(/\n+$/, "\n");
}
