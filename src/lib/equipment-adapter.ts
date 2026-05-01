import { generateObject } from "ai";
import { z } from "zod";
import {
  aiProvider,
  claudeModel,
  equipmentAdaptationProviderOptions,
  equipmentAdaptationSystemPrompt,
  isOllamaCloudModel,
  ollamaBaseUrl,
  ollamaModel,
} from "@/lib/anthropic";
import { normalizeAppliances } from "@/lib/equipment-service";
import { parseJsonObjectFromText } from "@/lib/recipe-utils";

export const equipmentAdaptationSchema = z.object({
  adaptedSteps: z.array(z.string().trim().min(1)).min(1),
  notes: z.string().trim(),
});

const equipmentAdaptationJsonSchema = {
  type: "object",
  additionalProperties: false,
  required: ["adaptedSteps", "notes"],
  properties: {
    adaptedSteps: {
      type: "array",
      minItems: 1,
      items: { type: "string" },
    },
    notes: { type: "string" },
  },
};

export type EquipmentAdaptation = z.infer<typeof equipmentAdaptationSchema>;

export function normalizeEquipmentAdaptation(
  value: unknown,
): EquipmentAdaptation {
  const parsed = equipmentAdaptationSchema.safeParse(value);

  if (!parsed.success) {
    throw new Error("Invalid equipment adaptation response.");
  }

  return {
    adaptedSteps: parsed.data.adaptedSteps.map((step) => step.trim()),
    notes: parsed.data.notes.trim(),
  };
}

export async function adaptRecipeStepsWithAi(params: {
  title: string;
  steps: string[];
  appliances: string[];
}): Promise<EquipmentAdaptation> {
  const appliances = normalizeAppliances(params.appliances);
  const response =
    aiProvider === "ollama"
      ? await adaptRecipeStepsWithOllama(params.title, params.steps, appliances)
      : await adaptRecipeStepsWithModel(params.title, params.steps, appliances);

  return normalizeEquipmentAdaptation(response);
}

async function adaptRecipeStepsWithModel(
  title: string,
  steps: string[],
  appliances: string[],
): Promise<unknown> {
  const result = await generateObject({
    model: claudeModel,
    schema: equipmentAdaptationSchema,
    schemaName: "EquipmentAdaptation",
    schemaDescription: "Recipe steps adapted to available kitchen equipment.",
    system: equipmentAdaptationSystemPrompt,
    prompt: buildEquipmentAdaptationPrompt(title, steps, appliances),
    temperature: 0,
    providerOptions: equipmentAdaptationProviderOptions,
    experimental_repairText: async ({ text }) => {
      try {
        return JSON.stringify(parseJsonObjectFromText(text));
      } catch {
        return null;
      }
    },
  });

  return result.object;
}

async function adaptRecipeStepsWithOllama(
  title: string,
  steps: string[],
  appliances: string[],
): Promise<unknown> {
  const controller = new AbortController();
  const timeoutId = setTimeout(
    () => controller.abort(),
    getOllamaAdaptationTimeoutMs(),
  );

  let response: Response;
  try {
    response = await fetch(`${ollamaBaseUrl}/api/chat`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        model: ollamaModel,
        stream: false,
        format: equipmentAdaptationJsonSchema,
        options: { temperature: 0, num_ctx: isOllamaCloudModel ? 32_768 : 4096 },
        messages: [
          {
            role: "system",
            content:
              `${equipmentAdaptationSystemPrompt}\n\n` +
              "Return a JSON object matching the provided schema.",
          },
          {
            role: "user",
            content: buildEquipmentAdaptationPrompt(title, steps, appliances),
          },
        ],
      }),
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timeoutId);
  }

  if (!response.ok) {
    throw new Error("Ollama equipment adaptation failed.");
  }

  const body = (await response.json()) as { message?: { content?: string } };
  const content = body.message?.content;

  if (!content) {
    throw new Error("Ollama equipment adaptation returned no content.");
  }

  return parseJsonObjectFromText(content);
}

function buildEquipmentAdaptationPrompt(
  title: string,
  steps: string[],
  appliances: string[],
): string {
  const applianceText =
    appliances.length > 0 ? appliances.join(", ") : "no special appliances";
  const stepText = steps
    .map((step, index) => `${index + 1}. ${step}`)
    .join("\n");

  return `Recipe: ${title}

Available appliances: ${applianceText}

Original steps:
${stepText}

Adapt these steps to the available appliances. Preserve food safety guidance and return concise, cookable instructions.`;
}

function getOllamaAdaptationTimeoutMs(): number {
  const timeout = Number(process.env.OLLAMA_EXTRACTION_TIMEOUT_MS);

  return Number.isInteger(timeout) && timeout > 0 ? timeout : 120_000;
}
