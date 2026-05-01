export type RecipeIngredient = {
  amount: number | null;
  unit: string;
  name: string;
  notes?: string;
};

export type RecipePayload = {
  title: string;
  description?: string | null;
  sourceUrl?: string | null;
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
