"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { RecipeResponse } from "@/types/recipe";
import { RecipeListItem } from "@/components/recipe/RecipeListItem";

type PageState = "loading" | "empty" | "loaded" | "error";

const SEED_RECIPES = [
  { label: "Cacio e Pepe with Black Pepper Brown Butter" },
  { label: "Sheet-Pan Gochujang Chicken" },
  { label: "Slow-Cooker White Bean Soup" },
] as const;

function countHeadline(n: number): string {
  if (n === 1) return "One recipe, kept carefully.";
  return `${n} recipes, kept carefully.`;
}

export default function LibraryPage() {
  const [pageState, setPageState] = useState<PageState>("loading");
  const [recipes, setRecipes] = useState<RecipeResponse[]>([]);

  useEffect(() => {
    fetch("/api/recipes")
      .then((res) => {
        if (!res.ok) throw new Error();
        return res.json();
      })
      .then((data: { recipes: RecipeResponse[] }) => {
        const list = data.recipes ?? [];
        setRecipes(list);
        setPageState(list.length === 0 ? "empty" : "loaded");
      })
      .catch(() => setPageState("error"));
  }, []);

  return (
    <div className="mx-auto max-w-[880px] px-5 py-[26px] md:px-7">
      {/* Page header */}
      <div className="mb-[22px]">
        <p className="font-ui text-eyebrow uppercase tracking-[0.16em] text-accent">
          Your library
        </p>
        <h1 className="mt-1 font-display text-display-md font-medium text-ink">
          {pageState === "loading"
            ? "Loading your library…"
            : pageState === "error"
              ? "Your library"
              : pageState === "empty"
                ? "It's quiet in here."
                : countHeadline(recipes.length)}
        </h1>
        {pageState === "loaded" && (
          <p className="mt-1 font-display text-deck italic text-ink-muted">
            Most recently added.
          </p>
        )}
      </div>

      <div className="border-t-[0.5px] border-border" />

      {/* Loading skeleton */}
      {pageState === "loading" && (
        <div aria-busy="true" aria-live="polite">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="flex items-start gap-4 border-b-[0.5px] border-border-soft py-[14px]"
            >
              <div className="flex-1">
                <div
                  className="mb-1 h-[1.65em] rounded-sm"
                  style={{
                    width: `${60 + (i % 3) * 10}%`,
                    fontSize: "14.5px",
                    background: "var(--color-border-soft)",
                  }}
                />
                <div
                  className="h-[1.6em] rounded-sm"
                  style={{
                    width: `${35 + (i % 4) * 8}%`,
                    fontSize: "13px",
                    background: "var(--color-border-soft)",
                  }}
                />
              </div>
              <div
                className="hidden h-5 w-[90px] rounded-sm md:block"
                style={{ background: "var(--color-border-soft)" }}
              />
              <div className="hidden gap-1 md:flex">
                <div
                  className="h-5 w-6 rounded-sm"
                  style={{ background: "var(--color-border-soft)" }}
                />
                <div
                  className="h-5 w-6 rounded-sm"
                  style={{ background: "var(--color-border-soft)" }}
                />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Error */}
      {pageState === "error" && (
        <div className="pt-[40px]" role="alert">
          <p className="font-display text-deck italic text-ink-muted">
            We had trouble loading your recipes. Try refreshing the page.
          </p>
        </div>
      )}

      {/* Empty state */}
      {pageState === "empty" && (
        <div className="mx-auto max-w-[480px] py-[40px] pb-[60px]">
          <p className="mt-2 font-display text-deck italic text-ink-muted">
            Bring something home — a link, a video, or a half-remembered recipe.
          </p>

          <div className="mt-6 rounded-sm border-[0.5px] border-border px-5 py-[18px]">
            {/* Caveat warm moment */}
            <div className="mb-3" aria-hidden="true">
              <span
                className="block font-hand text-[18px] text-accent opacity-70"
                style={{ transform: "rotate(-2deg)" }}
              >
                ↓
              </span>
              <p
                className="font-hand text-hand text-accent"
                style={{ transform: "rotate(-2deg)" }}
              >
                Try one of these to start
              </p>
            </div>

            <ul role="list" className="flex flex-col gap-2">
              {SEED_RECIPES.map(({ label }) => (
                <li key={label}>
                  <Link
                    href="/import"
                    className="font-display text-body text-ink underline-offset-2 hover:underline"
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>

            <div className="mt-[22px]">
              <Link
                href="/import"
                className="inline-block h-[38px] rounded-sm bg-accent px-4 font-ui text-ui leading-[38px] text-paper transition-colors hover:bg-accent-strong"
              >
                Bring a recipe in →
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Recipe list */}
      {pageState === "loaded" && (
        <div>
          {recipes.map((recipe, i) => (
            <RecipeListItem
              key={recipe.id}
              recipe={recipe}
              isLast={i === recipes.length - 1}
            />
          ))}
        </div>
      )}
    </div>
  );
}
