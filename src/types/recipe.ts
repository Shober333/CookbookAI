export type RecipeIngredient = {
  amount: number | null;
  unit: string;
  name: string;
  notes?: string;
};

export type RecipeSourceKind =
  | "url"
  | "text"
  | "youtube-link"
  | "youtube-description"
  | "youtube-transcript"
  | "youtube-direct-video";

export type RecipeSourceImportMethod = "fetch" | "browserbase" | "text" | "video-ai";

export type MacroNutrients = {
  calories: number;
  proteinGrams: number;
  carbohydrateGrams: number;
  fatGrams: number;
  fiberGrams?: number;
};

export type NutritionIngredientMatch = {
  ingredientName: string;
  normalizedName: string;
  amount: number | null;
  unit: string;
  grams: number | null;
  fdcId?: number;
  foodDescription?: string;
  confidence: "high" | "medium" | "low" | "unmatched";
  macros?: MacroNutrients;
  warnings?: string[];
};

export type RecipeNutritionEstimate = {
  source: "usda-fdc";
  calculatedAt: string;
  servings: number;
  total: MacroNutrients;
  perServing: MacroNutrients;
  ingredients: NutritionIngredientMatch[];
  unmatchedIngredients: string[];
  warnings: string[];
};

export type RecipePayload = {
  title: string;
  description?: string | null;
  sourceUrl?: string | null;
  sourceVideoUrl?: string | null;
  sourceKind?: RecipeSourceKind | null;
  sourceImportMethod?: RecipeSourceImportMethod | null;
  servings: number;
  ingredients: RecipeIngredient[];
  steps: string[];
  adaptedSteps?: string[] | null;
  nutritionEstimate?: RecipeNutritionEstimate | null;
  tags?: string[];
};

export type RecipeResponse = RecipePayload & {
  id: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
};
