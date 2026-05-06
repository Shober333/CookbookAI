"use client";

import { useState } from "react";
import type { RecipeNutritionEstimate } from "@/types/recipe";
import {
  scaledPerServing,
  isFullMatch,
  shouldShowRecalculate,
  unmatchedLine,
  classifyNutritionError,
  matchedIngredientCount,
  totalIngredientCount,
} from "@/lib/nutrition-utils";

interface NutritionPanelProps {
  recipeId: string;
  canonicalServings: number;
  currentServings: number;
  initialEstimate: RecipeNutritionEstimate | null;
  ingredientsChangedSince?: string | null;
}

type PanelStatus = "idle" | "calculating" | "done" | "error";
type ErrorKind = "config" | "service" | "no-match" | null;

export function NutritionPanel({
  recipeId,
  canonicalServings: _canonicalServings,
  currentServings,
  initialEstimate,
  ingredientsChangedSince,
}: NutritionPanelProps) {
  const [status, setStatus] = useState<PanelStatus>(
    initialEstimate ? "done" : "idle",
  );
  const [errorKind, setErrorKind] = useState<ErrorKind>(null);
  const [estimate, setEstimate] = useState<RecipeNutritionEstimate | null>(
    initialEstimate,
  );

  async function runCalculation() {
    setStatus("calculating");
    setErrorKind(null);

    try {
      const res = await fetch(`/api/recipes/${recipeId}/nutrition`, {
        method: "POST",
      });

      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as {
          error?: string;
        };
        setErrorKind(classifyNutritionError(res.status, body.error ?? ""));
        setStatus("error");
        return;
      }

      const data = (await res.json()) as {
        recipe?: { nutritionEstimate?: RecipeNutritionEstimate | null };
      };
      setEstimate(data.recipe?.nutritionEstimate ?? null);
      setStatus("done");
    } catch {
      setErrorKind("service");
      setStatus("error");
    }
  }

  const showRecalculate = shouldShowRecalculate(estimate, ingredientsChangedSince);

  // Compute displayed per-serving macros scaled to currentServings
  function scaled(base: number): number {
    if (!estimate) return 0;
    return scaledPerServing(base, currentServings, estimate.servings);
  }

  const fullMatch = estimate ? isFullMatch(estimate) : false;

  return (
    <section
      aria-label="Macros"
      className="mt-[44px] border-t-[0.5px] border-border pt-5"
    >
      {/* Eyebrow */}
      <h2 className="font-ui text-eyebrow uppercase tracking-[0.16em] text-ink-faint">
        Macros
      </h2>

      {/* State 1 — Idle */}
      {status === "idle" && (
        <>
          <p className="mt-1 font-display text-deck italic text-ink-muted">
            Get an idea of what&rsquo;s in this recipe.
          </p>
          <button
            type="button"
            onClick={runCalculation}
            className="mt-3 min-h-[44px] rounded-none bg-ink px-4 font-ui text-ui uppercase tracking-[0.14em] text-paper hover:opacity-[0.92] disabled:cursor-not-allowed disabled:opacity-30 md:min-h-[38px]"
          >
            Calculate
          </button>
        </>
      )}

      {/* State 2 — Calculating */}
      {status === "calculating" && (
        <div
          role="status"
          className="mt-3 flex items-center"
        >
          <span
            className="h-1.5 w-1.5 shrink-0 rounded-full bg-ink animate-pulse motion-reduce:animate-none"
            aria-hidden="true"
          />
          <span className="ml-2 font-ui text-ui text-ink">
            Looking up the ingredients&hellip;
          </span>
        </div>
      )}

      {/* States 3 and 4 — Estimate (full or partial) */}
      {status === "done" && estimate && (
        <>
          {/* Calories headline */}
          <p className="mt-3">
            <span
              aria-label={`Approximately ${scaled(estimate.perServing.calories)} calories per serving`}
              className="font-display text-display-lg font-medium text-ink"
            >
              ~{scaled(estimate.perServing.calories)}
            </span>
          </p>
          <p
            className="mt-1 font-ui text-ui-sm uppercase tracking-[0.08em] text-ink-faint"
            aria-hidden="true"
          >
            {fullMatch
              ? "cal per serving"
              : "cal per serving (estimated from matched ingredients)"}
          </p>

          {/* Macro row */}
          <div className="mt-3 flex gap-6">
            {(
              [
                {
                  label: "Protein",
                  value: scaled(estimate.perServing.proteinGrams),
                },
                {
                  label: "Carbs",
                  value: scaled(estimate.perServing.carbohydrateGrams),
                },
                {
                  label: "Fat",
                  value: scaled(estimate.perServing.fatGrams),
                },
              ] as const
            ).map(({ label, value }) => (
              <div key={label}>
                <div>
                  <span
                    className="font-display text-body font-medium text-ink"
                    style={{ fontFeatureSettings: "'tnum'" }}
                  >
                    {value}
                  </span>
                  <span className="ml-[2px] font-ui text-ui-sm text-ink-faint">
                    g
                  </span>
                </div>
                <p className="mt-[2px] font-ui text-ui-sm uppercase tracking-[0.08em] text-ink-faint">
                  {label}
                </p>
              </div>
            ))}
          </div>

          {/* Fiber — full match only */}
          {fullMatch && estimate.perServing.fiberGrams !== undefined && (
            <p className="mt-2 font-ui text-ui-sm text-ink-faint">
              Fiber:{" "}
              <span
                className="font-display text-body-sm font-medium text-ink"
                style={{ fontFeatureSettings: "'tnum'" }}
              >
                {scaled(estimate.perServing.fiberGrams)}
              </span>
              <span className="ml-[2px] font-ui text-ui-sm text-ink-faint">g</span>
            </p>
          )}

          {/* Unmatched list — partial only */}
          {!fullMatch && estimate.unmatchedIngredients.length > 0 && (
            <p className="mt-2 font-ui text-ui-sm text-ink-faint">
              {unmatchedLine(estimate.unmatchedIngredients)}
            </p>
          )}

          {/* Footer */}
          <p className="mt-3 font-ui text-ui-sm text-ink-faint">
            {fullMatch
              ? `Approximate values · USDA food data · ${estimate.servings} servings`
              : `Values cover ${matchedIngredientCount(estimate)} of ${totalIngredientCount(estimate)} ingredients. · USDA food data`}
          </p>

          {/* State 5 — Recalculate prompt */}
          {showRecalculate && (
            <p className="mt-2 font-ui text-ui-sm text-ink-faint">
              Recipe changed since last calculation.{" "}
              <span aria-hidden="true">·</span>{" "}
              <button
                type="button"
                onClick={runCalculation}
                className="cursor-pointer underline-offset-2 hover:underline hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-focus-ring)]"
              >
                Recalculate
              </button>
            </p>
          )}
        </>
      )}

      {/* State 6 — Errors */}
      {status === "error" && (
        <>
          {errorKind === "config" && (
            <div role="alert" className="mt-1">
              <p className="font-display text-deck italic text-ink-faint">
                Macro lookup isn&rsquo;t available on this installation.
              </p>
            </div>
          )}

          {errorKind === "service" && (
            <div role="alert" className="mt-1">
              <p className="font-display text-deck italic text-ink-muted">
                We can&rsquo;t reach the nutrition database right now.
              </p>
              <button
                type="button"
                onClick={runCalculation}
                className="mt-2 font-ui text-ui text-ink-muted underline-offset-2 hover:underline hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-focus-ring)]"
              >
                Try again
              </button>
            </div>
          )}

          {errorKind === "no-match" && (
            <div role="alert" className="mt-1">
              <p className="font-display text-deck italic text-ink-muted">
                We couldn&rsquo;t match the ingredients to our database.
                <br />
                The recipe may have unusual or ambiguous ingredient names.
              </p>
            </div>
          )}
        </>
      )}
    </section>
  );
}
