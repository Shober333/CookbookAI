import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { findRecipeById, toRecipeResponse } from "@/lib/recipe-service";
import { RecipeDetail } from "@/components/recipe/RecipeDetail";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function RecipeDetailPage({ params }: PageProps) {
  const { id } = await params;
  const session = await auth();

  const raw = await findRecipeById(id);

  if (!raw || raw.userId !== session?.user?.id) {
    notFound();
  }

  const recipe = toRecipeResponse(raw);

  return <RecipeDetail recipe={recipe} />;
}
