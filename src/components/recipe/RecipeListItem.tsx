import Link from "next/link";
import type { RecipeResponse } from "@/types/recipe";
import { extractDomain } from "@/lib/recipe-utils";

interface RecipeListItemProps {
  recipe: RecipeResponse;
  isLast?: boolean;
}

export function RecipeListItem({ recipe, isLast }: RecipeListItemProps) {
  const domain = extractDomain(recipe.sourceUrl);
  const servingsLabel =
    recipe.servings === 1 ? "1 serving" : `${recipe.servings} servings`;
  const metaParts = [servingsLabel, domain].filter(Boolean);

  const isAdapted =
    !!recipe.adaptedSteps && recipe.adaptedSteps.length > 0;

  const ariaLabel = `${recipe.title}, ${servingsLabel}${isAdapted ? ", adapted" : ""}`;

  return (
    <Link
      href={`/recipes/${recipe.id}`}
      aria-label={ariaLabel}
      className={[
        "group block py-[14px] transition-colors",
        "border-b-[0.5px]",
        isLast ? "border-transparent" : "border-border-soft hover:border-accent",
      ].join(" ")}
    >
      <div className="transition-transform duration-150 ease-out group-hover:translate-x-[6px]">
        <div className="flex items-start gap-4">
          <div className="min-w-0 flex-1">
            <p className="truncate font-display text-body font-medium text-ink">
              {recipe.title}
            </p>
            {recipe.description && (
              <p className="truncate font-display text-body-sm italic text-ink-muted">
                {recipe.description}
              </p>
            )}
            <p className="mt-[3px] font-ui text-ui-sm text-ink-faint md:hidden">
              {metaParts.join(" · ")}
            </p>
          </div>

          <p className="hidden shrink-0 font-ui text-ui-sm text-ink-faint md:block md:w-[90px]">
            {metaParts.join(" · ")}
          </p>

          <div className="hidden shrink-0 items-start justify-end gap-1 md:flex md:w-[110px]">
            <TagList tags={recipe.tags ?? []} isAdapted={isAdapted} />
          </div>
        </div>

        {((recipe.tags?.length ?? 0) > 0 || isAdapted) && (
          <div className="mt-[6px] flex flex-wrap gap-1 md:hidden">
            <TagList tags={recipe.tags ?? []} isAdapted={isAdapted} />
          </div>
        )}
      </div>
    </Link>
  );
}

function TagList({ tags, isAdapted }: { tags: string[]; isAdapted: boolean }) {
  return (
    <>
      {tags.slice(0, 3).map((tag) => (
        <span
          key={tag}
          className="rounded-sm border-[0.5px] border-border px-[5px] py-[2px] font-ui text-tag uppercase tracking-[0.08em] text-ink-faint"
        >
          {tag}
        </span>
      ))}
      {isAdapted && (
        <span className="rounded-sm border-[0.5px] border-accent px-[5px] py-[2px] font-ui text-tag uppercase tracking-[0.08em] text-accent">
          Adapted
        </span>
      )}
    </>
  );
}
