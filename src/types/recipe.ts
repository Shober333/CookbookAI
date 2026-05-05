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
  | "youtube-transcript";

export type RecipeSourceImportMethod = "fetch" | "browserbase" | "text";

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
  tags?: string[];
};

export type RecipeResponse = RecipePayload & {
  id: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
};
