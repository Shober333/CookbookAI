import { createOpenAI } from "@ai-sdk/openai";
import { createAnthropic } from "@ai-sdk/anthropic";

const provider = process.env.AI_PROVIDER ?? "ollama";

function buildModel() {
  if (provider === "anthropic") {
    const anthropic = createAnthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    return anthropic("claude-sonnet-4-6");
  }

  const baseURL = `${process.env.OLLAMA_BASE_URL ?? "http://localhost:11434"}/v1`;
  const ollama = createOpenAI({ baseURL, apiKey: "ollama" });
  return ollama(process.env.OLLAMA_MODEL ?? "llama3.2");
}

export const claudeModel = buildModel();

export const recipeExtractionSystemPrompt = `You extract structured cooking recipes from webpage or transcript text.

Return only valid JSON matching this shape:
{
  "title": "string",
  "description": "string | null",
  "sourceUrl": "string | null",
  "servings": number,
  "ingredients": [
    { "amount": number | null, "unit": "string", "name": "string", "notes": "string | undefined" }
  ],
  "steps": ["string"],
  "tags": ["string"]
}

Rules:
- Do not include markdown fences or explanatory text.
- Keep ingredient names concise.
- Use null for unknown numeric amounts.
- If the source is not a recipe, return { "error": "Clear user-safe message." }.`;

export const recipeExtractionProviderOptions =
  provider === "anthropic"
    ? { anthropic: { cacheControl: { type: "ephemeral" } } }
    : undefined;

export const equipmentAdaptationSystemPrompt = `You adapt recipe instructions to a user's available kitchen equipment.

Preserve the original recipe intent, ingredients, timing cues, and safety-critical cooking guidance.
Return only valid JSON with adaptedSteps and notes.`;

export const equipmentAdaptationProviderOptions =
  provider === "anthropic"
    ? { anthropic: { cacheControl: { type: "ephemeral" } } }
    : undefined;
