"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";

type Status = "idle" | "streaming" | "done" | "error";

type ImportMode = "url" | "text";
type SourceKind = "url" | "text" | "youtube-link" | "youtube-description";

type ImportResponse = {
  recipe?: { id?: string };
  reused?: boolean;
  sourceKind?: SourceKind;
  sourceDomain?: string | null;
};

type StatusLine = {
  text: string;
  domain?: string | null;
  strong?: boolean;
};

const URL_PHASE_LINES: StatusLine[] = [
  { text: "Reading the page…" },
  { text: "Finding the recipe…" },
  { text: "Reading ingredients…" },
  { text: "Reading the method…" },
  { text: "Done", strong: true },
];

const TEXT_PHASE_LINES: StatusLine[] = [
  { text: "Reading what you pasted…" },
  { text: "Finding the recipe…" },
  { text: "Reading ingredients…" },
  { text: "Reading the method…" },
  { text: "Done", strong: true },
];

const YOUTUBE_LINK_PHASE_LINES = (domain?: string | null): StatusLine[] => [
  { text: "Looking up the video…" },
  { text: "Following the link in the description…", domain },
  { text: "Reading the page…" },
  { text: "Finding the recipe…" },
  { text: "Reading ingredients…" },
  { text: "Reading the method…" },
  { text: "Done", strong: true },
];

const YOUTUBE_DESCRIPTION_PHASE_LINES: StatusLine[] = [
  { text: "Looking up the video…" },
  { text: "Reading the description…" },
  { text: "Finding the recipe…" },
  { text: "Reading ingredients…" },
  { text: "Reading the method…" },
  { text: "Done", strong: true },
];

function initialLineFor(mode: ImportMode, value: string): StatusLine {
  if (mode === "url" && looksLikeYouTubeUrl(value)) {
    return { text: "Looking up the video…" };
  }

  if (mode === "text") {
    return { text: "Reading what you pasted…" };
  }

  return { text: "Reading the page…" };
}

function doneLinesFor(
  mode: ImportMode,
  response: ImportResponse,
): StatusLine[] {
  if (response.reused) {
    return [{ text: "Already in our library — adding it to yours." }];
  }

  switch (response.sourceKind ?? mode) {
    case "text":
      return TEXT_PHASE_LINES;
    case "youtube-link":
      return YOUTUBE_LINK_PHASE_LINES(response.sourceDomain);
    case "youtube-description":
      return YOUTUBE_DESCRIPTION_PHASE_LINES;
    case "url":
    default:
      return URL_PHASE_LINES;
  }
}

function looksLikeYouTubeUrl(value: string): boolean {
  try {
    const host = new URL(value).hostname.replace(/^www\./, "");
    return (
      host === "youtube.com" ||
      host === "m.youtube.com" ||
      host === "youtu.be"
    );
  } catch {
    return false;
  }
}

function mapApiError(status: number, body: { error?: string }): string {
  if (status === 400) {
    if (body.error?.toLowerCase().includes("text")) {
      return "Paste a bit more — we need ingredients and steps to work with.";
    }

    return "That doesn't look like a URL. Try something starting with https://.";
  }

  return body.error ?? "Something went wrong. Try again in a moment.";
}

function validateUrl(value: string): string {
  let parsed: URL;

  try {
    parsed = new URL(value);
  } catch {
    return "That doesn't look like a URL. Try something starting with https://.";
  }

  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    return "That doesn't look like a URL. Try something starting with https://.";
  }

  return "";
}

function validateText(value: string): string {
  const compact = value.replace(/\s/g, "");

  if (!compact) return "Paste a recipe to import.";
  if (compact.length < 40) {
    return "Paste a bit more — we need ingredients and steps to work with.";
  }

  return "";
}

export function ImportForm() {
  const router = useRouter();
  const textAreaRef = useRef<HTMLTextAreaElement>(null);

  const [mode, setMode] = useState<ImportMode>("url");
  const [url, setUrl] = useState("");
  const [text, setText] = useState("");
  const [urlError, setUrlError] = useState("");
  const [textError, setTextError] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [statusLabel, setStatusLabel] = useState("Reading the page…");
  const [lines, setLines] = useState<StatusLine[]>([]);
  const [errorMsg, setErrorMsg] = useState("");

  function resetToIdle() {
    setStatus("idle");
    setStatusLabel("Reading the page…");
    setLines([]);
    setErrorMsg("");
  }

  function selectMode(nextMode: ImportMode) {
    if (status === "streaming" || nextMode === mode) return;
    setMode(nextMode);
    setUrlError("");
    setTextError("");
  }

  function focusTextArea() {
    window.requestAnimationFrame(() => textAreaRef.current?.focus());
  }

  async function runImport() {
    const submittedUrl = url.trim();
    const submittedText = text.trim();
    const firstLine = initialLineFor(mode, submittedUrl);

    setStatus("streaming");
    setStatusLabel(responseHeaderForStreaming(firstLine.text));
    setLines([firstLine]);
    setErrorMsg("");

    try {
      const res = await fetch("/api/ai/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          mode === "url"
            ? { mode: "url", url: submittedUrl }
            : { mode: "text", text: submittedText },
        ),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setErrorMsg(mapApiError(res.status, body));
        setStatus("error");
        return;
      }

      const body = (await res.json()) as ImportResponse;
      const recipeId = body.recipe?.id;
      if (!recipeId) throw new Error("Missing imported recipe id.");

      setStatusLabel("Done");
      setLines(doneLinesFor(mode, body));
      setStatus("done");

      setTimeout(() => {
        router.push(`/recipes/${recipeId}`);
      }, 1500);
    } catch {
      setErrorMsg("Something went wrong. Try again in a moment.");
      setStatus("error");
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setUrlError("");
    setTextError("");

    if (mode === "url") {
      const nextError = validateUrl(url);
      if (nextError) {
        setUrlError(nextError);
        return;
      }
    } else {
      const nextError = validateText(text);
      if (nextError) {
        setTextError(nextError);
        return;
      }
    }

    await runImport();
  }

  function responseHeaderForStreaming(line: string) {
    if (line === "Looking up the video…") return "Looking up the video…";
    if (line === "Reading what you pasted…") return "Reading what you pasted…";
    return "Reading the page…";
  }

  function handleModeKeyDown(e: React.KeyboardEvent<HTMLButtonElement>) {
    if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
    e.preventDefault();
    selectMode(mode === "url" ? "text" : "url");
  }

  function handleRetry() {
    runImport();
  }

  function handleTryAnotherLink() {
    setUrl("");
    setMode("url");
    resetToIdle();
  }

  function handlePasteTextInstead() {
    setUrl("");
    setMode("text");
    resetToIdle();
    focusTextArea();
  }

  function handleTryAgainText() {
    setText("");
    resetToIdle();
    focusTextArea();
  }

  function isPasteTextHelpful() {
    const lower = errorMsg.toLowerCase();
    return (
      mode === "url" &&
      (lower.includes("subscription") ||
        lower.includes("paywall") ||
        lower.includes("youtube") ||
        lower.includes("paste the recipe text") ||
        lower.includes("couldn't find a recipe"))
    );
  }

  const isSubmitting = status === "streaming";
  const showStreamingBox = status !== "idle";
  const canSubmit =
    !isSubmitting &&
    (mode === "url" ? !!url.trim() : !!text.replace(/\s/g, ""));
  const activePanelId = mode === "url" ? "import-url-panel" : "import-text-panel";

  return (
    <div className="w-full max-w-[480px]">
      <form onSubmit={handleSubmit} className="flex flex-col gap-2">
        <div
          role="tablist"
          aria-label="Import mode"
          className="mb-[6px] flex justify-center gap-2"
        >
          {(["url", "text"] as const).map((option) => {
            const active = mode === option;
            const id = `import-mode-${option}`;

            return (
              <button
                key={option}
                id={id}
                type="button"
                role="tab"
                aria-selected={active}
                aria-controls={
                  option === "url" ? "import-url-panel" : "import-text-panel"
                }
                aria-disabled={isSubmitting}
                disabled={isSubmitting}
                onClick={() => selectMode(option)}
                onKeyDown={handleModeKeyDown}
                className={`min-h-[44px] px-[18px] py-3 font-ui text-ui lowercase transition-colors focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50 ${
                  active
                    ? "border-b border-accent font-medium text-ink"
                    : "border-b border-transparent text-ink-faint hover:text-ink"
                }`}
              >
                {option === "url" ? "link" : "text"}
              </button>
            );
          })}
        </div>

        {mode === "url" ? (
          <div
            id="import-url-panel"
            role="tabpanel"
            aria-labelledby="import-mode-url"
            className="flex flex-col gap-1"
          >
            <input
              type="url"
              value={url}
              onChange={(e) => {
                setUrl(e.target.value);
                if (urlError) setUrlError("");
              }}
              placeholder="Paste a recipe URL or a YouTube link"
              required={mode === "url"}
              disabled={isSubmitting}
              aria-invalid={!!urlError}
              aria-describedby={urlError ? "url-error" : undefined}
              className="min-h-[44px] w-full rounded-sm border-[0.5px] border-border bg-paper px-3 font-ui text-body text-ink placeholder:text-ink-ghost transition-colors focus-visible:border-accent focus-visible:outline-none disabled:opacity-50 md:h-[38px] md:min-h-0"
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
        ) : (
          <div
            id="import-text-panel"
            role="tabpanel"
            aria-labelledby="import-mode-text"
            className="flex flex-col gap-1"
          >
            <textarea
              ref={textAreaRef}
              value={text}
              onChange={(e) => {
                setText(e.target.value);
                if (textError) setTextError("");
              }}
              placeholder="Paste the recipe — ingredients, steps, and any notes."
              required={mode === "text"}
              disabled={isSubmitting}
              aria-invalid={!!textError}
              aria-describedby={textError ? "text-error" : undefined}
              className="max-h-[min(50vh,400px)] min-h-[200px] w-full resize-y rounded-sm border-[0.5px] border-border-strong bg-paper px-[14px] py-3 font-ui text-body text-ink placeholder:text-ink-ghost transition-colors focus-visible:border-accent focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50 md:max-h-[480px]"
              style={
                textError
                  ? {
                      borderColor: "var(--color-accent-strong)",
                      boxShadow: "0 0 0 2px var(--color-focus-ring)",
                    }
                  : undefined
              }
            />
            {textError && (
              <p
                id="text-error"
                className="font-ui text-ui-sm"
                style={{ color: "var(--color-accent-strong)" }}
              >
                {textError}
              </p>
            )}
          </div>
        )}

        <button
          type="submit"
          aria-controls={activePanelId}
          disabled={!canSubmit}
          className="min-h-[44px] w-full rounded-sm bg-accent font-ui text-ui text-paper transition-colors hover:bg-accent-strong disabled:cursor-not-allowed disabled:opacity-50 md:h-[38px] md:min-h-0"
        >
          {isSubmitting ? "Bringing it in…" : "Bring it in"}
        </button>
      </form>

      {showStreamingBox && (
        <div
          className="mt-[26px] min-h-[160px] rounded-sm border-[0.5px] border-border px-5 py-[18px]"
          style={{ background: "var(--color-paper-sunken)" }}
        >
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
              {status === "error" ? "Something went wrong" : statusLabel}
            </span>
          </div>

          <ul
            className="mt-3 flex flex-col gap-[6px]"
            role="list"
            aria-live="polite"
            aria-atomic="false"
          >
            {lines.map((line, i) => (
              <li
                key={`${line.text}-${line.domain ?? ""}-${i}`}
                className="font-ui text-body-sm text-ink-muted"
                style={{ animation: "fade-in var(--motion-fade-slow) forwards" }}
              >
                <span className={line.strong ? "font-medium text-ink" : undefined}>
                  {line.text}
                </span>
                {line.domain && (
                  <span className="italic text-ink-faint"> ({line.domain})</span>
                )}
              </li>
            ))}
          </ul>

          {status === "error" && errorMsg && (
            <div className="mt-4" role="alert">
              <p
                className="font-ui text-body-sm"
                style={{ color: "var(--color-accent-strong)" }}
              >
                {errorMsg}
              </p>
              <div className="mt-3 flex flex-wrap gap-3">
                {mode === "text" ? (
                  <button
                    type="button"
                    onClick={handleTryAgainText}
                    className="font-ui text-ui-sm text-ink underline-offset-2 hover:underline"
                  >
                    Try again
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleRetry}
                    className="font-ui text-ui-sm text-ink underline-offset-2 hover:underline"
                  >
                    Try again
                  </button>
                )}
                {isPasteTextHelpful() && (
                  <button
                    type="button"
                    onClick={handlePasteTextInstead}
                    className="font-ui text-ui-sm text-ink underline-offset-2 hover:underline"
                  >
                    Paste recipe text instead →
                  </button>
                )}
                {mode === "url" && (
                  <button
                    type="button"
                    onClick={handleTryAnotherLink}
                    className="font-ui text-ui-sm text-ink-muted underline-offset-2 hover:underline"
                  >
                    Try another link
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
