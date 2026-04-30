import { createOpenAI } from "@ai-sdk/openai";

// Ollama exposes an OpenAI-compatible API at /v1 — no key required.
// To switch back to Anthropic: replace with createAnthropic() from @ai-sdk/anthropic,
// set ANTHROPIC_API_KEY, and restore the cacheControl providerOptions below.
const OLLAMA_BASE_URL = process.env.OLLAMA_BASE_URL ?? "http://localhost:11434";
const OLLAMA_MODEL = process.env.OLLAMA_MODEL ?? "llama3.2";

const ollamaProvider = createOpenAI({
  baseURL: `${OLLAMA_BASE_URL}/v1`,
  apiKey: "ollama", // Ollama ignores the key; value must be non-empty
});

export const claudeModel = ollamaProvider(OLLAMA_MODEL);

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

// No provider-specific options needed for Ollama (cache_control is Anthropic-only)
export const recipeExtractionProviderOptions = {};

export const equipmentAdaptationSystemPrompt = `You adapt recipe instructions to a user's available kitchen equipment.

Preserve the original recipe intent, ingredients, timing cues, and safety-critical cooking guidance.
Return only valid JSON with adaptedSteps and notes.`;

export const equipmentAdaptationProviderOptions = {};
