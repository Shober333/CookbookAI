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
