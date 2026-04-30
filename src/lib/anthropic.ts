import Anthropic from "@anthropic-ai/sdk";
import { createAnthropic } from "@ai-sdk/anthropic";

export const CLAUDE_MODEL = "claude-sonnet-4-6";

export const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export const anthropicProvider = createAnthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export const claudeModel = anthropicProvider(CLAUDE_MODEL);

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

export const recipeExtractionProviderOptions = {
  anthropic: {
    cacheControl: { type: "ephemeral" },
  },
} as const;

export const equipmentAdaptationSystemPrompt = `You adapt recipe instructions to a user's available kitchen equipment.

Preserve the original recipe intent, ingredients, timing cues, and safety-critical cooking guidance.
Return only valid JSON with adaptedSteps and notes.`;

export const equipmentAdaptationProviderOptions = {
  anthropic: {
    cacheControl: { type: "ephemeral" },
  },
} as const;
