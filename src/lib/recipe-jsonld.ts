type JsonRecord = Record<string, unknown>;

const UNIT_WORDS = new Set([
  "cup",
  "cups",
  "tbsp",
  "tablespoon",
  "tablespoons",
  "tsp",
  "teaspoon",
  "teaspoons",
  "g",
  "gram",
  "grams",
  "kg",
  "ml",
  "l",
  "oz",
  "ounce",
  "ounces",
  "lb",
  "lbs",
  "pound",
  "pounds",
]);

export function extractRecipeFromJsonLd(
  html: string,
  sourceUrl: string,
): Record<string, unknown> | null {
  const candidates = extractJsonLdBlocks(html).flatMap(findRecipeNodes);
  const recipe = candidates[0];

  if (!recipe) return null;

  const title = asString(recipe.name ?? recipe.headline);
  const ingredients = asStringArray(recipe.recipeIngredient);
  const steps = extractInstructions(recipe.recipeInstructions);

  if (!title || ingredients.length === 0 || steps.length === 0) return null;

  return {
    title,
    description: asString(recipe.description) ?? null,
    sourceUrl,
    servings: extractServings(recipe.recipeYield),
    ingredients: ingredients.map(parseIngredientLine),
    steps,
    tags: extractTags(recipe),
  };
}

function extractJsonLdBlocks(html: string): unknown[] {
  const blocks: unknown[] = [];
  const scriptPattern =
    /<script\b[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;

  for (const match of html.matchAll(scriptPattern)) {
    const rawJson = decodeHtmlEntities(match[1].trim());

    try {
      blocks.push(JSON.parse(rawJson));
    } catch {
      continue;
    }
  }

  return blocks;
}

function findRecipeNodes(value: unknown): JsonRecord[] {
  if (Array.isArray(value)) return value.flatMap(findRecipeNodes);
  if (!isRecord(value)) return [];

  const nodes: JsonRecord[] = [];
  if (hasType(value, "Recipe")) nodes.push(value);

  for (const key of ["@graph", "mainEntity", "mainEntityOfPage"]) {
    nodes.push(...findRecipeNodes(value[key]));
  }

  return nodes;
}

function hasType(value: JsonRecord, type: string): boolean {
  const rawType = value["@type"];
  if (Array.isArray(rawType)) return rawType.includes(type);
  return rawType === type;
}

function extractInstructions(value: unknown): string[] {
  if (typeof value === "string") return [cleanText(value)].filter(Boolean);
  if (!Array.isArray(value)) return [];

  return value
    .flatMap((item) => {
      if (typeof item === "string") return cleanText(item);
      if (!isRecord(item)) return [];
      if (typeof item.text === "string") return cleanText(item.text);
      if (typeof item.name === "string") return cleanText(item.name);
      return extractInstructions(item.itemListElement);
    })
    .filter(Boolean);
}

function extractServings(value: unknown): number {
  const servingText = Array.isArray(value) ? asString(value[0]) : asString(value);
  const match = servingText?.match(/\d+/);
  const servings = match ? Number(match[0]) : 4;
  return Number.isInteger(servings) && servings > 0 ? servings : 4;
}

function extractTags(recipe: JsonRecord): string[] {
  const values = [
    ...asStringArray(recipe.keywords),
    ...asStringArray(recipe.recipeCategory),
    ...asStringArray(recipe.recipeCuisine),
  ];

  return [...new Set(values.map(cleanText).filter(Boolean))].slice(0, 20);
}

function parseIngredientLine(line: string): Record<string, unknown> {
  const cleaned = cleanText(line);
  const [amount, rest] = parseAmount(cleaned);
  const words = rest.trim().split(/\s+/);
  const maybeUnit = words[0]?.toLowerCase();

  if (maybeUnit && UNIT_WORDS.has(maybeUnit)) {
    return {
      amount,
      unit: words[0],
      name: words.slice(1).join(" ") || cleaned,
    };
  }

  return {
    amount,
    unit: "",
    name: rest.trim() || cleaned,
  };
}

function parseAmount(value: string): [number | null, string] {
  const match = value.match(/^(\d+(?:\.\d+)?|\d+\s*\/\s*\d+)\s+(.*)$/);
  if (!match) return [null, value];

  const rawAmount = match[1].replace(/\s+/g, "");
  const amount = rawAmount.includes("/")
    ? fractionToNumber(rawAmount)
    : Number(rawAmount);

  return [Number.isFinite(amount) ? amount : null, match[2]];
}

function fractionToNumber(value: string): number {
  const [numerator, denominator] = value.split("/").map(Number);
  return numerator / denominator;
}

function asString(value: unknown): string | null {
  return typeof value === "string" ? cleanText(value) : null;
}

function asStringArray(value: unknown): string[] {
  if (typeof value === "string") {
    return value
      .split(",")
      .map(cleanText)
      .filter(Boolean);
  }

  if (!Array.isArray(value)) return [];

  return value
    .map((item) => (typeof item === "string" ? cleanText(item) : ""))
    .filter(Boolean);
}

function cleanText(value: string): string {
  return decodeHtmlEntities(value).replace(/\s+/g, " ").trim();
}

function decodeHtmlEntities(value: string): string {
  return value
    .replace(/&quot;/g, '"')
    .replace(/&#34;/g, '"')
    .replace(/&amp;/g, "&")
    .replace(/&#038;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&#39;/g, "'");
}

function isRecord(value: unknown): value is JsonRecord {
  return !!value && typeof value === "object" && !Array.isArray(value);
}
