interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function RecipeDetailPage({ params }: PageProps) {
  const { id } = await params;

  return (
    <div className="mx-auto max-w-[620px] px-5 py-[26px] md:px-7">
      <p className="text-eyebrow uppercase tracking-[0.16em] text-accent">
        Recipe
      </p>
      <h1 className="mt-1 font-display text-display-lg font-medium text-ink">
        Loading recipe…
      </h1>
      <p className="mt-2 font-ui text-ui-sm text-ink-faint">
        id: {id}
      </p>
    </div>
  );
}
