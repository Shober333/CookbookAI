import {
  generateRecipeObject,
  getRecipeSourceLimit,
} from "@/lib/ai-provider";
import { recipeExtractionSystemPrompt } from "@/lib/anthropic";
import { recipePayloadSchema } from "@/lib/recipe-schema";

export const recipeJsonSchema = {
  type: "object",
  additionalProperties: false,
  required: [
    "title",
    "description",
    "sourceUrl",
    "servings",
    "ingredients",
    "steps",
    "tags",
  ],
  properties: {
    title: { type: "string" },
    description: { anyOf: [{ type: "string" }, { type: "null" }] },
    sourceUrl: { anyOf: [{ type: "string" }, { type: "null" }] },
    servings: { type: "integer", minimum: 1 },
    ingredients: {
      type: "array",
      minItems: 1,
      items: {
        type: "object",
        additionalProperties: false,
        required: ["amount", "unit", "name"],
        properties: {
          amount: { anyOf: [{ type: "number" }, { type: "null" }] },
          unit: { type: "string" },
          name: { type: "string" },
          notes: { type: "string" },
        },
      },
    },
    steps: {
      type: "array",
      minItems: 1,
      items: { type: "string" },
    },
    tags: {
      type: "array",
      items: { type: "string" },
    },
  },
};

const RECOGNIZED_UNITS = new Set([
  "",
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
  "kilogram",
  "kilograms",
  "ml",
  "milliliter",
  "millilitre",
  "milliliters",
  "millilitres",
  "l",
  "liter",
  "litre",
  "liters",
  "litres",
  "oz",
  "ounce",
  "ounces",
  "lb",
  "lbs",
  "pound",
  "pounds",
  "clove",
  "cloves",
  "dash",
  "dashes",
  "pinch",
  "pinches",
  "can",
  "cans",
  "package",
  "packages",
  "bunch",
  "bunches",
  "sprig",
  "sprigs",
]);

const UNICODE_FRACTIONS: Record<string, number> = {
  "¼": 0.25,
  "½": 0.5,
  "¾": 0.75,
  "⅓": 1 / 3,
  "⅔": 2 / 3,
  "⅛": 0.125,
  "⅜": 0.375,
  "⅝": 0.625,
  "⅞": 0.875,
};

export function prepareRecipeSourceForAi(
  sourceText: string,
  maxChars: number,
): string {
  const normalizedSource = sourceText.replace(/\s+/g, " ").trim();
  const lowerSource = normalizedSource.toLowerCase();
  const markers = [
    "recipe ingredients",
    "ingredients",
    "instructions",
    "directions",
    "method",
    "how to make",
  ];
  const markerIndex = markers.reduce<number | null>((bestIndex, marker) => {
    const index = lowerSource.indexOf(marker);
    if (index === -1) return bestIndex;
    return bestIndex === null ? index : Math.min(bestIndex, index);
  }, null);
  const contextBeforeMarker = Math.min(500, Math.floor(maxChars * 0.2));
  const start =
    markerIndex === null ? 0 : Math.max(0, markerIndex - contextBeforeMarker);

  return normalizedSource.slice(start, start + maxChars);
}

export async function extractRecipeWithAi(
  sourceText: string,
  sourceUrl: string | null,
): Promise<Record<string, unknown>> {
  const recipe = await generateRecipeObject({
    schema: recipeJsonSchema,
    zodSchema: recipePayloadSchema,
    schemaName: "Recipe",
    schemaDescription: "A complete structured cooking recipe.",
    system: recipeExtractionSystemPrompt,
    prompt: buildRecipePrompt(sourceText, sourceUrl),
  });

  return normalizeExtractedRecipe(recipe, sourceUrl);
}

export function normalizeExtractedRecipe(
  value: Record<string, unknown>,
  sourceUrl: string | null,
): Record<string, unknown> {
  if (typeof value.error === "string") {
    return { error: value.error };
  }

  const normalized = {
    ...value,
    description:
      typeof value.description === "string" ? value.description : null,
    sourceUrl:
      typeof value.sourceUrl === "string" && value.sourceUrl.startsWith("http")
        ? value.sourceUrl
        : sourceUrl,
    servings: toPositiveInteger(value.servings),
    ingredients: normalizeIngredients(value.ingredients),
    steps: normalizeStringArray(value.steps),
    tags: normalizeStringArray(value.tags),
  };

  const parsed = recipePayloadSchema.safeParse(normalized);

  if (!parsed.success) {
    return {
      error:
        "We couldn't extract a complete recipe from that page. Try another link, or paste the recipe text directly.",
    };
  }

  return parsed.data;
}

function buildRecipePrompt(sourceText: string, sourceUrl: string | null): string {
  return `Source URL: ${sourceUrl ?? "none (pasted text)"}

Extract the cooking recipe from this source text.

Rules:
- Extract the actual recipe, not comments, navigation, ads, or related posts.
- Preserve cooking steps in order.
- Split ingredient amount, unit, name, and notes.
- Use null for unknown numeric amounts.
- Use an empty string for unknown units.
- Never put quantities in notes. For "1/4 cup olive oil", use amount 0.25, unit "cup", name "olive oil".
- Notes are only prep details such as minced, halved, optional, or to taste.
- If the source is not a recipe, return an object with an "error" string.

${sourceText}`;
}

export { getRecipeSourceLimit };

function normalizeIngredients(value: unknown): unknown[] {
  if (!Array.isArray(value)) return [];

  return value.map((ingredient) => {
    if (typeof ingredient === "string") {
      return {
        amount: null,
        unit: "",
        name: ingredient,
      };
    }

    if (!ingredient || typeof ingredient !== "object") {
      return {
        amount: null,
        unit: "",
        name: "",
      };
    }

    const item = ingredient as Record<string, unknown>;

    return normalizeIngredient({
      amount: toNumberOrNull(item.amount),
      unit: normalizeUnit(item.unit),
      name: typeof item.name === "string" ? item.name.trim() : "",
      notes:
        typeof item.notes === "string" && item.notes.trim()
          ? item.notes.trim()
          : undefined,
    });
  });
}

function normalizeIngredient(ingredient: {
  amount: number | null;
  unit: string;
  name: string;
  notes?: string;
}): Record<string, unknown> {
  let { amount, unit, name, notes } = ingredient;

  if (amount === null && notes) {
    const quantity = parseLeadingQuantity(notes);
    if (quantity) {
      amount = quantity.amount;
      notes = joinNotes(quantity.rangeNote, quantity.rest);
    }
  }

  if (amount === null) {
    const quantity = parseLeadingQuantity(name);
    if (quantity) {
      amount = quantity.amount;
      const split = splitUnitAndName(quantity.rest);
      unit = unit || split.unit;
      name = split.name || name;
      notes = joinNotes(quantity.rangeNote, notes);
    }
  }

  if (unit && !RECOGNIZED_UNITS.has(unit.toLowerCase())) {
    const lowerUnit = unit.toLowerCase();
    const lowerName = name.toLowerCase();

    if (lowerUnit.includes(lowerName)) {
      name = unit;
    } else if (!lowerName.includes(lowerUnit)) {
      notes = joinNotes(unit, notes);
    }

    unit = "";
  }

  return {
    amount,
    unit,
    name,
    ...(notes ? { notes } : {}),
  };
}

function parseLeadingQuantity(
  value: string,
): { amount: number; rest: string; rangeNote?: string } | null {
  const fractionChars = Object.keys(UNICODE_FRACTIONS).join("");
  const quantityPattern = String.raw`(\d+\s+\d+\s*\/\s*\d+|\d+\s*\/\s*\d+|\d+(?:\.\d+)?\s*[${fractionChars}]?|[${fractionChars}])`;
  const match = value
    .trim()
    .match(new RegExp(`^${quantityPattern}(?:\\s*[-–]\\s*${quantityPattern})?\\s*(.*)$`));

  if (!match) return null;

  const amount = parseQuantity(match[1]);
  if (amount === null) return null;

  const rangeNote = match[2] ? `to ${match[2].replace(/\s+/g, " ").trim()}` : undefined;
  const rest = match[3].replace(/^,\s*/, "").trim();

  return { amount, rest, rangeNote };
}

function parseQuantity(value: string): number | null {
  const normalized = value.replace(/\s+/g, " ").trim();
  const mixedAscii = normalized.match(/^(\d+)\s+(\d+)\s*\/\s*(\d+)$/);
  if (mixedAscii) {
    return Number(mixedAscii[1]) + Number(mixedAscii[2]) / Number(mixedAscii[3]);
  }

  const asciiFraction = normalized.match(/^(\d+)\s*\/\s*(\d+)$/);
  if (asciiFraction) {
    return Number(asciiFraction[1]) / Number(asciiFraction[2]);
  }

  const unicodeFraction = normalized.match(/^(\d+)?\s*([¼½¾⅓⅔⅛⅜⅝⅞])$/);
  if (unicodeFraction) {
    return Number(unicodeFraction[1] ?? 0) + UNICODE_FRACTIONS[unicodeFraction[2]];
  }

  const amount = Number(normalized);
  return Number.isFinite(amount) ? amount : null;
}

function splitUnitAndName(value: string): { unit: string; name: string } {
  const [firstWord = "", ...rest] = value.trim().split(/\s+/);

  if (RECOGNIZED_UNITS.has(firstWord.toLowerCase())) {
    return { unit: firstWord, name: rest.join(" ") };
  }

  return { unit: "", name: value.trim() };
}

function joinNotes(...values: Array<string | undefined>): string | undefined {
  const notes = values.map((value) => value?.trim()).filter(Boolean);

  return notes.length > 0 ? notes.join(", ") : undefined;
}

function normalizeStringArray(value: unknown): string[] {
  if (typeof value === "string") {
    return [value.trim()].filter(Boolean);
  }

  if (!Array.isArray(value)) return [];

  return value
    .map((item) => (typeof item === "string" ? item.trim() : ""))
    .filter(Boolean);
}

function normalizeUnit(value: unknown): string {
  if (typeof value !== "string") return "";

  const unit = value.trim().toLowerCase();
  if (unit === "null" || unit === "undefined") return "";

  const canonicalUnits: Record<string, string> = {
    gram: "g",
    grams: "g",
    kilogram: "kg",
    kilograms: "kg",
    milliliter: "ml",
    millilitre: "ml",
    milliliters: "ml",
    millilitres: "ml",
    liter: "l",
    litre: "l",
    liters: "l",
    litres: "l",
    tablespoon: "tbsp",
    tablespoons: "tbsp",
    teaspoon: "tsp",
    teaspoons: "tsp",
    ounce: "oz",
    ounces: "oz",
    pound: "lb",
    pounds: "lb",
  };

  return canonicalUnits[unit] ?? unit;
}

function toPositiveInteger(value: unknown): number {
  const numericValue =
    typeof value === "number"
      ? value
      : typeof value === "string"
        ? Number(value.match(/\d+/)?.[0])
        : NaN;

  return Number.isInteger(numericValue) && numericValue > 0 ? numericValue : 4;
}

function toNumberOrNull(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;

  if (typeof value !== "string") return null;

  const fraction = value.match(/^(\d+)\s*\/\s*(\d+)$/);
  if (fraction) {
    const amount = Number(fraction[1]) / Number(fraction[2]);
    return Number.isFinite(amount) ? amount : null;
  }

  const amount = Number(value);
  return Number.isFinite(amount) ? amount : null;
}
