import { generateObject } from "ai";
import type { z } from "zod";
import {
  aiProvider,
  claudeModel,
  isOllamaCloudModel,
  ollamaBaseUrl,
  ollamaModel,
  recipeExtractionProviderOptions,
} from "@/lib/anthropic";
import { parseJsonObjectFromText } from "@/lib/recipe-utils";

export type AiProvider = "ollama" | "anthropic" | "gemini" | "groq";

export type GenerateRecipeObjectParams = {
  schema: object;
  zodSchema: z.ZodType;
  schemaName: string;
  schemaDescription: string;
  system: string;
  prompt: string;
};

export const selectedAiProvider = normalizeAiProvider(aiProvider);
export const geminiModel = process.env.GEMINI_MODEL ?? "gemini-2.5-flash";
export const geminiFallbackModel =
  process.env.GEMINI_FALLBACK_MODEL ?? "gemini-2.5-flash-lite";
export const groqModel = process.env.GROQ_MODEL ?? "openai/gpt-oss-120b";

export function getRecipeSourceLimit(): number {
  if (selectedAiProvider === "ollama") {
    return isOllamaCloudModel ? 15_000 : 3_500;
  }

  return 60_000;
}

export async function generateRecipeObject(
  params: GenerateRecipeObjectParams,
): Promise<Record<string, unknown>> {
  if (selectedAiProvider === "ollama") {
    return generateWithOllama(params);
  }

  if (selectedAiProvider === "gemini") {
    return generateWithGemini(params);
  }

  if (selectedAiProvider === "groq") {
    return generateWithGroq(params);
  }

  const result = await generateObject({
    model: claudeModel,
    schema: params.zodSchema,
    schemaName: params.schemaName,
    schemaDescription: params.schemaDescription,
    system: params.system,
    prompt: params.prompt,
    temperature: 0,
    providerOptions: recipeExtractionProviderOptions,
    experimental_repairText: async ({ text }: { text: string }) => {
      try {
        return JSON.stringify(parseJsonObjectFromText(text));
      } catch {
        return null;
      }
    },
  });

  return result.object as Record<string, unknown>;
}

function normalizeAiProvider(value: string): AiProvider {
  if (
    value === "anthropic" ||
    value === "gemini" ||
    value === "groq" ||
    value === "ollama"
  ) {
    return value;
  }

  return "ollama";
}

async function generateWithOllama(
  params: GenerateRecipeObjectParams,
): Promise<Record<string, unknown>> {
  const controller = new AbortController();
  const timeoutId = setTimeout(
    () => controller.abort(),
    getAiExtractionTimeoutMs(),
  );

  let response: Response;
  try {
    response = await fetch(`${ollamaBaseUrl}/api/chat`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        model: ollamaModel,
        stream: false,
        format: params.schema,
        options: { temperature: 0, num_ctx: isOllamaCloudModel ? 32_768 : 4096 },
        messages: [
          {
            role: "system",
            content:
              `${params.system}\n\n` +
              "Return a JSON object matching the provided schema. " +
              "Use an empty string for unknown ingredient units.",
          },
          {
            role: "user",
            content: params.prompt,
          },
        ],
      }),
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timeoutId);
  }

  if (!response.ok) {
    throw new Error(`Ollama generation failed: ${await readErrorBody(response)}`);
  }

  const body = (await response.json()) as { message?: { content?: string } };
  const content = body.message?.content;

  if (!content) {
    throw new Error("Ollama generation returned no content.");
  }

  return parseJsonObjectFromText(content);
}

export function toGroqStrictSchema(schema: object): object {
  return transformGroqStrictNode(schema as Record<string, unknown>);
}

function transformGroqStrictNode(
  node: Record<string, unknown>,
): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  const properties =
    node.properties && typeof node.properties === "object" && !Array.isArray(node.properties)
      ? (node.properties as Record<string, unknown>)
      : null;
  const originallyRequired = new Set(
    Array.isArray(node.required)
      ? node.required.filter((item): item is string => typeof item === "string")
      : [],
  );

  for (const [key, value] of Object.entries(node)) {
    if (key === "minimum" || key === "minItems") {
      continue;
    }

    if (key === "properties" && properties) {
      result.properties = Object.fromEntries(
        Object.entries(properties).map(([propertyName, propertyValue]) => {
          const transformed = transformGroqStrictNode(
            propertyValue as Record<string, unknown>,
          );
          return [
            propertyName,
            originallyRequired.has(propertyName)
              ? transformed
              : makeNullableSchema(transformed),
          ];
        }),
      );
      result.required = Object.keys(properties);
      result.additionalProperties = false;
      continue;
    }

    if (key === "required" || key === "additionalProperties") {
      continue;
    }

    if (key === "items" && value && typeof value === "object" && !Array.isArray(value)) {
      result.items = transformGroqStrictNode(value as Record<string, unknown>);
      continue;
    }

    result[key] = value;
  }

  return result;
}

function makeNullableSchema(schema: Record<string, unknown>): Record<string, unknown> {
  if (
    Array.isArray(schema.anyOf) &&
    schema.anyOf.some((item) => (item as Record<string, unknown>).type === "null")
  ) {
    return schema;
  }

  return {
    anyOf: [schema, { type: "null" }],
  };
}

export function toGeminiSchema(schema: object): object {
  return transformGeminiNode(schema as Record<string, unknown>);
}

function transformGeminiNode(
  node: Record<string, unknown>,
): Record<string, unknown> {
  const result: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(node)) {
    if (key === "additionalProperties" || key === "minItems" || key === "minimum") {
      continue;
    }

    if (key === "anyOf" && Array.isArray(value) && value.length === 2) {
      const nullItem = value.find(
        (v) => (v as Record<string, unknown>).type === "null",
      );
      const nonNullItem = value.find(
        (v) => (v as Record<string, unknown>).type !== "null",
      );
      if (nullItem && nonNullItem) {
        Object.assign(result, {
          ...transformGeminiNode(nonNullItem as Record<string, unknown>),
          nullable: true,
        });
        continue;
      }
    }

    if (key === "properties" && value && typeof value === "object") {
      result[key] = Object.fromEntries(
        Object.entries(value as Record<string, unknown>).map(([k, v]) => [
          k,
          transformGeminiNode(v as Record<string, unknown>),
        ]),
      );
      continue;
    }

    if (key === "items" && value && typeof value === "object" && !Array.isArray(value)) {
      result[key] = transformGeminiNode(value as Record<string, unknown>);
      continue;
    }

    result[key] = value;
  }

  return result;
}

async function generateWithGroq(
  params: GenerateRecipeObjectParams,
): Promise<Record<string, unknown>> {
  const apiKey = process.env.GROQ_API_KEY;

  if (!apiKey) {
    throw new Error("Groq generation failed: missing GROQ_API_KEY.");
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(
    () => controller.abort(),
    getAiExtractionTimeoutMs(),
  );

  let response: Response;
  try {
    response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        authorization: `Bearer ${apiKey}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: groqModel,
        temperature: 0,
        messages: [
          { role: "system", content: params.system },
          { role: "user", content: params.prompt },
        ],
        response_format: {
          type: "json_schema",
          json_schema: {
            name: params.schemaName,
            description: params.schemaDescription,
            schema: toGroqStrictSchema(params.schema),
            strict: true,
          },
        },
      }),
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timeoutId);
  }

  if (!response.ok) {
    throw new Error(`Groq generation failed: ${await readErrorBody(response)}`);
  }

  const body = (await response.json()) as {
    choices?: Array<{
      message?: {
        content?: string | null;
        refusal?: string | null;
      };
    }>;
  };
  const message = body.choices?.[0]?.message;

  if (message?.refusal) {
    throw new Error(`Groq generation refused: ${message.refusal}`);
  }

  if (!message?.content) {
    throw new Error("Groq generation returned no content.");
  }

  return parseJsonObjectFromText(message.content);
}

async function generateWithGemini(
  params: GenerateRecipeObjectParams,
): Promise<Record<string, unknown>> {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    throw new Error("Gemini generation failed: missing GEMINI_API_KEY.");
  }

  try {
    return await generateWithGeminiModel(params, apiKey, geminiModel);
  } catch (error) {
    if (
      error instanceof Error &&
      shouldRetryGeminiWithFallback(error.message) &&
      geminiFallbackModel !== geminiModel
    ) {
      return generateWithGeminiModel(params, apiKey, geminiFallbackModel);
    }

    throw error;
  }
}

async function generateWithGeminiModel(
  params: GenerateRecipeObjectParams,
  apiKey: string,
  model: string,
): Promise<Record<string, unknown>> {
  const url = new URL(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
  );
  url.searchParams.set("key", apiKey);

  const controller = new AbortController();
  const timeoutId = setTimeout(
    () => controller.abort(),
    getAiExtractionTimeoutMs(),
  );

  let response: Response;
  try {
    response = await fetch(url, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        systemInstruction: {
          parts: [{ text: params.system }],
        },
        contents: [
          {
            role: "user",
            parts: [{ text: params.prompt }],
          },
        ],
        generationConfig: {
          temperature: 0,
          responseMimeType: "application/json",
          responseSchema: toGeminiSchema(params.schema),
        },
      }),
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timeoutId);
  }

  if (!response.ok) {
    throw new Error(`Gemini generation failed: ${await readErrorBody(response)}`);
  }

  const body = (await response.json()) as {
    candidates?: Array<{
      content?: {
        parts?: Array<{ text?: string }>;
      };
    }>;
  };
  const content = body.candidates?.[0]?.content?.parts
    ?.map((part) => part.text ?? "")
    .join("")
    .trim();

  if (!content) {
    throw new Error("Gemini generation returned no content.");
  }

  return parseJsonObjectFromText(content);
}

function shouldRetryGeminiWithFallback(message: string): boolean {
  const lower = message.toLowerCase();

  return (
    lower.includes("high demand") ||
    lower.includes("overloaded") ||
    lower.includes("unavailable") ||
    lower.includes("503")
  );
}

function getAiExtractionTimeoutMs(): number {
  const timeout = Number(process.env.AI_EXTRACTION_TIMEOUT_MS);
  if (Number.isInteger(timeout) && timeout > 0) return timeout;

  const ollamaTimeout = Number(process.env.OLLAMA_EXTRACTION_TIMEOUT_MS);
  return Number.isInteger(ollamaTimeout) && ollamaTimeout > 0
    ? ollamaTimeout
    : 120_000;
}

async function readErrorBody(response: Response): Promise<string> {
  try {
    const body = (await response.json()) as {
      error?: { message?: unknown } | string;
    };

    if (typeof body.error === "string" && body.error.trim().length > 0) {
      return body.error.trim();
    }

    if (
      body.error &&
      typeof body.error === "object" &&
      typeof body.error.message === "string" &&
      body.error.message.trim().length > 0
    ) {
      return body.error.message.trim();
    }
  } catch {
    // Fall through to the status text below.
  }

  return `${response.status} ${response.statusText}`.trim();
}
