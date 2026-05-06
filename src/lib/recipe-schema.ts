import { z } from "zod";

export const recipeIngredientSchema = z.object({
  amount: z.number().finite().nullable(),
  unit: z.string().trim().default(""),
  name: z.string().trim().min(1),
  notes: z.string().trim().optional(),
});

export const macroNutrientsSchema = z.object({
  calories: z.number().finite().nonnegative(),
  proteinGrams: z.number().finite().nonnegative(),
  carbohydrateGrams: z.number().finite().nonnegative(),
  fatGrams: z.number().finite().nonnegative(),
  fiberGrams: z.number().finite().nonnegative().optional(),
});

export const nutritionIngredientMatchSchema = z.object({
  ingredientName: z.string().trim().min(1),
  normalizedName: z.string().trim().min(1),
  amount: z.number().finite().nullable(),
  unit: z.string().trim(),
  grams: z.number().finite().positive().nullable(),
  fdcId: z.number().int().positive().optional(),
  foodDescription: z.string().trim().min(1).optional(),
  confidence: z.enum(["high", "medium", "low", "unmatched"]),
  macros: macroNutrientsSchema.optional(),
  warnings: z.array(z.string().trim().min(1)).optional(),
});

export const recipeNutritionEstimateSchema = z.object({
  source: z.literal("usda-fdc"),
  calculatedAt: z.string().datetime(),
  servings: z.number().int().positive().max(1000),
  total: macroNutrientsSchema,
  perServing: macroNutrientsSchema,
  ingredients: z.array(nutritionIngredientMatchSchema),
  unmatchedIngredients: z.array(z.string().trim().min(1)),
  warnings: z.array(z.string().trim().min(1)),
});

export const recipePayloadSchema = z.object({
  title: z.string().trim().min(1).max(160),
  description: z.string().trim().max(2000).nullable().optional(),
  sourceUrl: z.string().url().nullable().optional(),
  sourceVideoUrl: z.string().url().nullable().optional(),
  sourceKind: z
    .enum([
      "url",
      "text",
      "youtube-link",
      "youtube-description",
      "youtube-transcript",
      "youtube-direct-video",
    ])
    .nullable()
    .optional(),
  sourceImportMethod: z
    .enum(["fetch", "browserbase", "text", "video-ai"])
    .nullable()
    .optional(),
  servings: z.number().int().positive().max(1000),
  ingredients: z.array(recipeIngredientSchema).min(1),
  steps: z.array(z.string().trim().min(1)).min(1),
  adaptedSteps: z.array(z.string().trim().min(1)).min(1).nullable().optional(),
  nutritionEstimate: recipeNutritionEstimateSchema.nullable().optional(),
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
    nutritionEstimate: true,
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
