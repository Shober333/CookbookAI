"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { RecipeResponse } from "@/types/recipe";
import { ServingScaler } from "./ServingScaler";
import { UnitToggle } from "./UnitToggle";
import { AdaptPanel, type AdaptResponse } from "./AdaptPanel";
import {
  scaleAmount,
  roundScaled,
  convertUnit,
  formatAmount,
  toRoman,
  extractDomain,
  recipeToMarkdown,
  slugify,
} from "@/lib/recipe-utils";

interface RecipeDetailProps {
  recipe: RecipeResponse;
  marginNote?: string;
  userAppliances?: string[];
}

export function RecipeDetail({
  recipe,
  marginNote,
  userAppliances = [],
}: RecipeDetailProps) {
  const router = useRouter();
  const [servings, setServings] = useState(recipe.servings);
  const [unitSystem, setUnitSystem] = useState<"metric" | "imperial">("metric");
  const [deleting, setDeleting] = useState(false);
  const [savedAdaptedSteps, setSavedAdaptedSteps] = useState<string[] | null>(
    recipe.adaptedSteps ?? null,
  );
  const [isShowingAdapted, setIsShowingAdapted] = useState(false);

  const domain = extractDomain(recipe.sourceUrl);

  const displayIngredients = recipe.ingredients.map((ing) => {
    const scaled = scaleAmount(ing.amount, recipe.servings, servings);
    const rounded = scaled !== null ? roundScaled(scaled, ing.unit) : null;
    const { amount: converted, unit: convertedUnit } = convertUnit(
      rounded,
      ing.unit,
      unitSystem,
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

  async function handleAdapt(
    recipeId: string,
    appliances: string[],
  ): Promise<AdaptResponse> {
    const res = await fetch("/api/ai/adapt", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ recipeId, appliances }),
    });
    if (!res.ok) {
      throw new Error("Adapt request failed");
    }
    const data = (await res.json()) as AdaptResponse;
    return data;
  }

  async function handleSaveAdapted(
    recipeId: string,
    adaptedSteps: string[],
  ): Promise<void> {
    const res = await fetch(`/api/recipes/${recipeId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ adaptedSteps }),
    });
    if (!res.ok) {
      throw new Error("Save failed");
    }
    setSavedAdaptedSteps(adaptedSteps);
  }

  async function handleDiscardAdapted(recipeId: string): Promise<void> {
    const res = await fetch(`/api/recipes/${recipeId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ adaptedSteps: null }),
    });
    if (!res.ok) {
      throw new Error("Discard failed");
    }
    setSavedAdaptedSteps(null);
  }

  function handleDownload() {
    const useAdapted =
      isShowingAdapted &&
      savedAdaptedSteps !== null &&
      savedAdaptedSteps.length > 0;
    const markdown = recipeToMarkdown(
      { ...recipe, adaptedSteps: savedAdaptedSteps },
      { servings, unitSystem, useAdapted },
    );
    const blob = new Blob([markdown], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${slugify(recipe.title)}${useAdapted ? "-adapted" : ""}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
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

      {/* Adapt panel */}
      <AdaptPanel
        recipeId={recipe.id}
        originalSteps={recipe.steps}
        savedAdaptedSteps={savedAdaptedSteps}
        savedAdaptedNotes={null}
        userAppliances={userAppliances}
        isShowingAdapted={isShowingAdapted}
        onShowingAdaptedChange={setIsShowingAdapted}
        onAdapt={handleAdapt}
        onSaveAdapted={handleSaveAdapted}
        onDiscardAdapted={handleDiscardAdapted}
      />

      {/* Bottom action row */}
      <div className="mt-[44px] flex flex-wrap items-center gap-3 border-t-[0.5px] border-border pt-5">
        <button
          type="button"
          onClick={handleDownload}
          aria-label="Download recipe as Markdown"
          className="font-ui text-ui-sm text-ink-muted underline-offset-2 hover:text-ink hover:underline"
        >
          Download .md
        </button>
        <span aria-hidden="true" className="font-ui text-ui-sm text-ink-faint">
          ·
        </span>
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
