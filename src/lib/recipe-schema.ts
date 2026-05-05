import { z } from "zod";

export const recipeIngredientSchema = z.object({
  amount: z.number().finite().nullable(),
  unit: z.string().trim().default(""),
  name: z.string().trim().min(1),
  notes: z.string().trim().optional(),
});

export const recipePayloadSchema = z.object({
  title: z.string().trim().min(1).max(160),
  description: z.string().trim().max(2000).nullable().optional(),
  sourceUrl: z.string().url().nullable().optional(),
  sourceVideoUrl: z.string().url().nullable().optional(),
  sourceKind: z
    .enum(["url", "text", "youtube-link", "youtube-description", "youtube-transcript"])
    .nullable()
    .optional(),
  sourceImportMethod: z.enum(["fetch", "browserbase", "text"]).nullable().optional(),
  servings: z.number().int().positive().max(1000),
  ingredients: z.array(recipeIngredientSchema).min(1),
  steps: z.array(z.string().trim().min(1)).min(1),
  adaptedSteps: z.array(z.string().trim().min(1)).min(1).nullable().optional(),
  tags: z.array(z.string().trim().min(1).max(40)).max(20).optional(),
});

export const recipePatchSchema = recipePayloadSchema
  .pick({
    title: true,
    description: true,
    sourceUrl: true,
    sourceVideoUrl: true,
    sourceKind: true,
    sourceImportMethod: true,
    servings: true,
    ingredients: true,
    steps: true,
    adaptedSteps: true,
    tags: true,
  })
  .partial()
  .refine((value) => Object.keys(value).length > 0, {
    message: "At least one field is required.",
  });

export const importRecipeSchema = z.object({
  url: z.string().url(),
});

export const importRecipeRequestSchema = z.discriminatedUnion("mode", [
  z.object({
    mode: z.literal("url"),
    url: z.string().url(),
  }),
  z.object({
    mode: z.literal("text"),
    text: z.string(),
    sourceUrl: z.string().url().nullable().optional(),
  }),
]);
