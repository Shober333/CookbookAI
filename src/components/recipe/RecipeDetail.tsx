"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { RecipeResponse } from "@/types/recipe";
import { ServingScaler } from "./ServingScaler";
import { UnitToggle } from "./UnitToggle";
import {
  scaleAmount,
  roundScaled,
  convertUnit,
  formatAmount,
  toRoman,
  extractDomain,
} from "@/lib/recipe-utils";

interface RecipeDetailProps {
  recipe: RecipeResponse;
  marginNote?: string;
}

export function RecipeDetail({ recipe, marginNote }: RecipeDetailProps) {
  const router = useRouter();
  const [servings, setServings] = useState(recipe.servings);
  const [unitSystem, setUnitSystem] = useState<"metric" | "imperial">("metric");
  const [deleting, setDeleting] = useState(false);

  const domain = extractDomain(recipe.sourceUrl);

  // Derive display ingredients: scale then convert
  const displayIngredients = recipe.ingredients.map((ing) => {
    const scaled = scaleAmount(ing.amount, recipe.servings, servings);
    const rounded = scaled !== null ? roundScaled(scaled, ing.unit) : null;
    const { amount: converted, unit: convertedUnit } = convertUnit(
      rounded,
      ing.unit,
      unitSystem
    );
    return {
      name: ing.name,
      notes: ing.notes,
      displayAmount: formatAmount(converted),
      unit: convertedUnit,
      isToTaste: ing.amount === null,
    };
  });

  async function handleDelete() {
    if (!window.confirm("Delete this recipe? This can't be undone.")) return;
    setDeleting(true);
    try {
      await fetch(`/api/recipes/${recipe.id}`, { method: "DELETE" });
      router.push("/library");
    } catch {
      setDeleting(false);
    }
  }

  const eyebrowParts = [
    ...(recipe.tags?.slice(0, 3) ?? []),
    ...(domain ? [domain] : []),
  ];

  return (
    <article className="relative mx-auto max-w-[620px] px-5 py-[26px] md:px-0">
      {/* Eyebrow */}
      {eyebrowParts.length > 0 && (
        <p className="font-ui text-eyebrow uppercase tracking-[0.16em] text-accent">
          {eyebrowParts.join(" · ")}
        </p>
      )}

      {/* Title */}
      <h1 className="mt-1 font-display text-display-lg font-medium text-ink">
        {recipe.title}
      </h1>

      {/* Deck */}
      {recipe.description && (
        <p className="mt-1 font-display text-deck italic text-ink-muted">
          {recipe.description}
        </p>
      )}

      {/* Byline */}
      {domain && recipe.sourceUrl && (
        <p className="mt-1 font-ui text-ui-sm text-ink-faint">
          From{" "}
          <a
            href={recipe.sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="underline-offset-2 hover:underline"
          >
            {domain}
          </a>
        </p>
      )}

      {/* Margin note — mobile: in-flow below byline */}
      {marginNote && (
        <div className="ml-3 mt-3 md:hidden" aria-hidden="true">
          <span className="block font-hand text-hand text-accent opacity-70">↓</span>
          <p
            className="font-hand text-hand text-accent"
            style={{ maxWidth: "75%" }}
          >
            {marginNote}
          </p>
        </div>
      )}

      {/* Divider */}
      <div className="my-[14px] border-b-[0.5px] border-border" />

      {/* Controls bar */}
      <div className="flex flex-wrap items-center gap-x-5 gap-y-3">
        <ServingScaler
          value={servings}
          min={1}
          max={99}
          onChange={setServings}
        />
        <UnitToggle value={unitSystem} onChange={setUnitSystem} />
        <button
          type="button"
          onClick={() => router.push(`/recipes/${recipe.id}/adapt`)}
          className="w-full rounded-sm bg-accent px-3 py-[5px] font-ui text-ui text-paper transition-colors hover:bg-accent-strong md:ml-auto md:w-auto"
        >
          Adapt for my kitchen
        </button>
      </div>

      {/* Divider */}
      <div className="my-[22px] border-b-[0.5px] border-border" />

      {/* Ingredients */}
      <section aria-label="Ingredients">
        <h2 className="mb-3 font-ui text-eyebrow uppercase tracking-[0.16em] text-ink-faint">
          Ingredients
        </h2>
        <div
          className="md:[column-count:2] md:[column-gap:2rem]"
          style={
            {
              "--tw-column-rule": "0.5px solid var(--color-border-soft)",
            } as React.CSSProperties
          }
        >
          {displayIngredients.map((ing, i) => (
            <div
              key={i}
              className="mb-3 break-inside-avoid"
            >
              {ing.isToTaste ? (
                <>
                  <span className="font-display text-body text-ink">
                    {ing.name}
                  </span>
                  <span className="font-display text-body-sm italic text-ink-muted">
                    {" "}
                    — to taste
                  </span>
                </>
              ) : (
                <>
                  {ing.displayAmount && (
                    <span className="ing-amt font-ui text-body-sm text-ink-faint">
                      {ing.displayAmount}
                      {ing.unit ? ` ${ing.unit}` : ""}{" "}
                    </span>
                  )}
                  <span className="font-display text-body text-ink">
                    {ing.name}
                  </span>
                  {ing.notes && (
                    <span className="font-display text-body-sm italic text-ink-muted">
                      , {ing.notes}
                    </span>
                  )}
                </>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Divider */}
      <div className="my-[22px] border-b-[0.5px] border-border" />

      {/* Method */}
      <section aria-label="Method">
        <h2 className="mb-3 font-ui text-eyebrow uppercase tracking-[0.16em] text-ink-faint">
          Method
        </h2>
        <ol
          className="flex flex-col gap-[10px]"
          style={{ listStyleType: "lower-roman" }}
        >
          {recipe.steps.map((step, i) => (
            <li key={i} className="flex gap-3">
              <span
                className="shrink-0 font-display text-body italic text-accent"
                style={{ minWidth: "22px" }}
                aria-hidden="true"
              >
                {toRoman(i + 1)}.
              </span>
              <p className="font-display text-body text-ink">{step}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* Delete */}
      <div className="mt-[44px] border-t-[0.5px] border-border pt-5">
        <button
          type="button"
          onClick={handleDelete}
          disabled={deleting}
          className="font-ui text-ui-sm text-ink-ghost underline-offset-2 hover:text-ink-muted hover:underline disabled:opacity-50"
        >
          {deleting ? "Deleting…" : "Delete recipe"}
        </button>
      </div>

      {/* Margin note — desktop: absolute in right margin */}
      {marginNote && (
        <div
          className="pointer-events-none absolute hidden rotate-[3deg] md:block"
          style={{ right: "-130px", top: "12px", maxWidth: "110px" }}
          aria-hidden="true"
        >
          <span className="block font-hand text-[18px] text-accent opacity-70">
            ↓
          </span>
          <p className="font-hand text-hand text-accent">{marginNote}</p>
        </div>
      )}
    </article>
  );
}
