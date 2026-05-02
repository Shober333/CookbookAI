"use client";

import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import type { RecipeResponse } from "@/types/recipe";
import { RecipeListItem } from "@/components/recipe/RecipeListItem";

type PageState = "loading" | "empty" | "loaded" | "error";

const SEED_RECIPES = [
  { label: "Cacio e Pepe with Black Pepper Brown Butter" },
  { label: "Sheet-Pan Gochujang Chicken" },
  { label: "Slow-Cooker White Bean Soup" },
] as const;

const DEBOUNCE_MS = 300;

function countHeadline(n: number, isSearching: boolean): string {
  if (isSearching) {
    if (n === 1) return "One matching recipe, kept carefully.";
    return `${n} matching recipes, kept carefully.`;
  }
  if (n === 1) return "One recipe, kept carefully.";
  return `${n} recipes, kept carefully.`;
}

export default function LibraryPage() {
  return (
    <Suspense fallback={<LibraryFallback />}>
      <LibraryBody />
    </Suspense>
  );
}

function LibraryFallback() {
  return (
    <div className="mx-auto max-w-[880px] px-5 py-[26px] md:px-7">
      <div className="mb-[22px]">
        <p className="font-ui text-eyebrow uppercase tracking-[0.16em] text-accent">
          Your library
        </p>
        <h1 className="mt-1 font-display text-display-md font-medium text-ink">
          Loading your library…
        </h1>
      </div>
    </div>
  );
}

function LibraryBody() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialQ = searchParams.get("q") ?? "";

  const [pageState, setPageState] = useState<PageState>("loading");
  const [recipes, setRecipes] = useState<RecipeResponse[]>([]);
  const [searchInput, setSearchInput] = useState<string>(initialQ);
  const [activeQuery, setActiveQuery] = useState<string>(initialQ.trim());
  const [isFetching, setIsFetching] = useState<boolean>(false);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const requestSeq = useRef(0);

  const fetchRecipes = useCallback(async (query: string) => {
    const seq = ++requestSeq.current;
    setIsFetching(true);

    try {
      const url = query ? `/api/recipes?q=${encodeURIComponent(query)}` : "/api/recipes";
      const res = await fetch(url);
      if (!res.ok) throw new Error();
      const data = (await res.json()) as { recipes: RecipeResponse[] };
      if (seq !== requestSeq.current) return;
      const list = data.recipes ?? [];
      setRecipes(list);
      setPageState(list.length === 0 ? "empty" : "loaded");
    } catch {
      if (seq !== requestSeq.current) return;
      setPageState("error");
    } finally {
      if (seq === requestSeq.current) setIsFetching(false);
    }
  }, []);

  useEffect(() => {
    fetchRecipes(activeQuery);
  }, [activeQuery, fetchRecipes]);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    const trimmed = searchInput.trim();
    debounceRef.current = setTimeout(() => {
      if (trimmed === activeQuery) return;
      setActiveQuery(trimmed);
      const params = new URLSearchParams();
      if (trimmed) params.set("q", trimmed);
      const qs = params.toString();
      router.replace(qs ? `/library?${qs}` : "/library");
    }, DEBOUNCE_MS);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [searchInput, activeQuery, router]);

  function handleClearSearch() {
    setSearchInput("");
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Escape") {
      e.preventDefault();
      setSearchInput("");
    }
  }

  const isSearching = activeQuery.length > 0;
  const showSearchEmpty =
    pageState === "empty" && isSearching;
  const showLibraryEmpty = pageState === "empty" && !isSearching;
  const showRecipes = pageState === "loaded";

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
              : showLibraryEmpty
                ? "It's quiet in here."
                : showSearchEmpty
                  ? "No matches yet."
                  : countHeadline(recipes.length, isSearching)}
        </h1>
        {showRecipes && (
          <p className="mt-1 font-display text-deck italic text-ink-muted">
            {isSearching ? `Matching “${activeQuery}”` : "Most recently added."}
          </p>
        )}
      </div>

      <div className="border-t-[0.5px] border-border" />

      {/* Search input — visible whenever the library has been loaded at least once */}
      {pageState !== "error" && (
        <div className="mt-[22px]">
          <label htmlFor="library-search" className="sr-only">
            Search recipes
          </label>
          <div className="relative">
            <span
              aria-hidden="true"
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-faint"
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="11" cy="11" r="7" />
                <path d="M21 21l-4.3-4.3" />
              </svg>
            </span>
            <input
              id="library-search"
              type="search"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Search recipes…"
              className="h-[44px] w-full rounded-md border-[0.5px] border-border-strong bg-paper pl-9 pr-[14px] font-ui text-body text-ink placeholder:text-ink-faint focus-visible:border-accent focus-visible:outline-none md:h-[38px]"
              style={{
                boxShadow: undefined,
              }}
            />
          </div>
        </div>
      )}

      {/* Loading skeleton — only on first load (no recipes yet) */}
      {pageState === "loading" && (
        <div aria-busy="true" aria-live="polite" className="mt-[22px]">
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

      {/* Empty library — only when no search */}
      {showLibraryEmpty && (
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

      {/* Empty search */}
      {showSearchEmpty && (
        <div className="py-[40px] pb-[60px] text-center" role="status">
          <p className="font-display text-deck italic text-ink-muted">
            No recipes matching &ldquo;{activeQuery}&rdquo;.
          </p>
          <button
            type="button"
            onClick={handleClearSearch}
            className="mt-3 font-ui text-ui-sm text-ink-muted underline-offset-2 hover:text-ink hover:underline"
          >
            Clear search
          </button>
        </div>
      )}

      {/* Recipe list */}
      {showRecipes && (
        <div
          className="mt-[22px] transition-opacity duration-200 ease-out"
          aria-busy={isFetching || undefined}
          style={{
            opacity: isFetching ? 0.5 : 1,
            pointerEvents: isFetching ? "none" : undefined,
          }}
        >
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
