"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Status = "idle" | "streaming" | "done" | "error";

type Phase = "reading" | "finding" | "ingredients" | "method" | "done";

const PHASE_LABELS: Record<Phase, string> = {
  reading: "Reading the page…",
  finding: "Finding the recipe…",
  ingredients: "Reading ingredients…",
  method: "Reading the method…",
  done: "Done",
};

function detectPhase(text: string): Phase {
  if (text.includes('"steps"')) return "method";
  if (text.includes('"ingredients"')) return "ingredients";
  if (text.includes('"title"')) return "finding";
  return "reading";
}

function mapApiError(status: number, body: { error?: string }): string {
  if (status === 502)
    return "We can't reach our recipe service right now. Try again in a moment.";
  if (status === 400)
    return "That doesn't look like a URL. Try something starting with https://.";
  return body.error ?? "We can't reach our recipe service right now. Try again in a moment.";
}

export function ImportForm() {
  const router = useRouter();

  const [url, setUrl] = useState("");
  const [urlError, setUrlError] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [phase, setPhase] = useState<Phase>("reading");
  const [lines, setLines] = useState<string[]>([]);
  const [errorMsg, setErrorMsg] = useState("");

  function resetToIdle() {
    setStatus("idle");
    setPhase("reading");
    setLines([]);
    setErrorMsg("");
  }

  async function runImport(importUrl: string) {
    setStatus("streaming");
    setPhase("reading");
    setLines([PHASE_LABELS.reading]);
    setErrorMsg("");

    let accumulated = "";
    let lastPhase: Phase = "reading";

    try {
      const res = await fetch("/api/ai/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: importUrl }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setErrorMsg(mapApiError(res.status, body));
        setStatus("error");
        return;
      }

      const reader = res.body!.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        accumulated += decoder.decode(value, { stream: true });

        const newPhase = detectPhase(accumulated);
        if (newPhase !== lastPhase) {
          lastPhase = newPhase;
          setPhase(newPhase);
          setLines((prev) => [...prev, PHASE_LABELS[newPhase]]);
        }
      }
    } catch {
      setErrorMsg(
        "We can't reach our recipe service right now. Try again in a moment."
      );
      setStatus("error");
      return;
    }

    // Parse extracted recipe JSON
    let recipe: Record<string, unknown>;
    try {
      recipe = JSON.parse(accumulated);
    } catch {
      setErrorMsg(
        "We had trouble structuring this recipe. It happens occasionally — try again, or paste the recipe text directly."
      );
      setStatus("error");
      return;
    }

    if (recipe.error) {
      setErrorMsg(
        "We couldn't find a recipe at that link. Make sure it's a page with ingredients and steps."
      );
      setStatus("error");
      return;
    }

    // Save recipe
    let saved: { id: string };
    try {
      const saveRes = await fetch("/api/recipes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(recipe),
      });

      if (!saveRes.ok) {
        throw new Error();
      }

      saved = await saveRes.json();
    } catch {
      setErrorMsg(
        "The recipe was found but couldn't be saved. Try again in a moment."
      );
      setStatus("error");
      return;
    }

    setPhase("done");
    setLines((prev) => [...prev, PHASE_LABELS.done]);
    setStatus("done");

    setTimeout(() => {
      router.push(`/recipes/${saved.id}`);
    }, 1500);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setUrlError("");

    let parsed: URL;
    try {
      parsed = new URL(url);
    } catch {
      setUrlError(
        "That doesn't look like a URL. Try something starting with https://."
      );
      return;
    }

    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      setUrlError(
        "That doesn't look like a URL. Try something starting with https://."
      );
      return;
    }

    await runImport(url);
  }

  function handleRetry() {
    runImport(url);
  }

  function handleTryAnother() {
    setUrl("");
    resetToIdle();
  }

  const isSubmitting = status === "streaming";
  const showStreamingBox = status !== "idle";

  return (
    <div className="w-full max-w-[480px]">
      <form onSubmit={handleSubmit} className="flex flex-col gap-2">
        {/* URL input */}
        <div className="flex flex-col gap-1">
          <input
            type="url"
            value={url}
            onChange={(e) => {
              setUrl(e.target.value);
              if (urlError) setUrlError("");
            }}
            placeholder="Paste a recipe URL or a YouTube link"
            required
            disabled={isSubmitting}
            aria-invalid={!!urlError}
            aria-describedby={urlError ? "url-error" : undefined}
            className="h-[38px] w-full rounded-sm border-[0.5px] border-border bg-paper px-3 font-ui text-body text-ink placeholder:text-ink-ghost transition-colors focus-visible:border-accent focus-visible:outline-none disabled:opacity-50"
            style={
              urlError
                ? { borderColor: "var(--color-accent-strong)" }
                : undefined
            }
          />
          {urlError && (
            <p
              id="url-error"
              className="font-ui text-ui-sm"
              style={{ color: "var(--color-accent-strong)" }}
            >
              {urlError}
            </p>
          )}
        </div>

        {/* Submit button */}
        <button
          type="submit"
          disabled={isSubmitting || !url.trim()}
          className="h-[38px] w-full rounded-sm bg-accent font-ui text-ui text-paper transition-colors hover:bg-accent-strong disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isSubmitting ? "Bringing it in…" : "Bring it in"}
        </button>
      </form>

      {/* Streaming box */}
      {showStreamingBox && (
        <div
          className="mt-[26px] min-h-[160px] rounded-sm border-[0.5px] border-border px-5 py-[18px]"
          style={{ background: "var(--color-paper-sunken)" }}
        >
          {/* Status header */}
          <div className="flex items-center gap-2" role="status">
            {status === "streaming" && (
              <span
                className="inline-block h-[6px] w-[6px] shrink-0 rounded-full bg-accent"
                style={{
                  animation: "pulse-dot var(--motion-pulse)",
                }}
                aria-hidden="true"
              />
            )}
            <span className="font-ui text-eyebrow uppercase tracking-[0.16em] text-accent">
              {status === "error" ? "Something went wrong" : PHASE_LABELS[phase]}
            </span>
          </div>

          {/* Phase lines */}
          <ul
            className="mt-3 flex flex-col gap-[6px]"
            role="list"
            aria-live="polite"
            aria-atomic="false"
          >
            {lines.map((line, i) => (
              <li
                key={`${line}-${i}`}
                className="font-ui text-body-sm text-ink-muted"
                style={{ animation: "fade-in var(--motion-fade-slow) forwards" }}
              >
                {i === lines.length - 1 && status === "done" ? (
                  <span className="font-medium text-ink">{line}</span>
                ) : (
                  line
                )}
              </li>
            ))}
          </ul>

          {/* Error section */}
          {status === "error" && errorMsg && (
            <div className="mt-4" role="alert">
              <p
                className="font-ui text-body-sm"
                style={{ color: "var(--color-accent-strong)" }}
              >
                {errorMsg}
              </p>
              <div className="mt-3 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={handleRetry}
                  className="font-ui text-ui-sm text-ink underline-offset-2 hover:underline"
                >
                  Try again
                </button>
                <button
                  type="button"
                  onClick={handleTryAnother}
                  className="font-ui text-ui-sm text-ink-muted underline-offset-2 hover:underline"
                >
                  Try another link
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
