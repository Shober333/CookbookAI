"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { toRoman } from "@/lib/recipe-utils";

export type AdaptResponse = {
  adaptedSteps: string[];
  notes: string;
};

interface AdaptPanelProps {
  recipeId: string;
  originalSteps: string[];
  savedAdaptedSteps: string[] | null;
  savedAdaptedNotes?: string | null;
  userAppliances: string[];
  isShowingAdapted: boolean;
  onShowingAdaptedChange: (isShowing: boolean) => void;
  onAdapt: (recipeId: string, appliances: string[]) => Promise<AdaptResponse>;
  onSaveAdapted: (recipeId: string, adaptedSteps: string[]) => Promise<void>;
  onDiscardAdapted: (recipeId: string) => Promise<void>;
}

type Mode = "idle" | "loading" | "result" | "error";

const IDENTICAL_NOTES =
  "Your kitchen already has everything; no changes needed.";

function stepsAreIdentical(a: string[], b: string[]): boolean {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) return false;
  }
  return true;
}

export function AdaptPanel({
  recipeId,
  originalSteps,
  savedAdaptedSteps,
  userAppliances,
  isShowingAdapted,
  onShowingAdaptedChange,
  onAdapt,
  onSaveAdapted,
  onDiscardAdapted,
}: AdaptPanelProps) {
  const [mode, setMode] = useState<Mode>("idle");
  const [result, setResult] = useState<AdaptResponse | null>(null);
  const [errorMsg, setErrorMsg] = useState<string>("");
  const [expanded, setExpanded] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDiscarding, setIsDiscarding] = useState(false);
  const [saveErrorMsg, setSaveErrorMsg] = useState<string>("");

  const hasSaved =
    savedAdaptedSteps !== null && savedAdaptedSteps.length > 0;
  const noEquipment = userAppliances.length === 0;

  const showingAdapted =
    mode === "result" || (mode === "idle" && hasSaved && expanded);

  useEffect(() => {
    if (showingAdapted !== isShowingAdapted) {
      onShowingAdaptedChange(showingAdapted);
    }
  }, [showingAdapted, isShowingAdapted, onShowingAdaptedChange]);

  async function handleAdapt() {
    if (noEquipment) return;
    setMode("loading");
    setErrorMsg("");
    setSaveErrorMsg("");

    try {
      const response = await onAdapt(recipeId, userAppliances);
      const steps = (response.adaptedSteps ?? []).filter(
        (step) => typeof step === "string" && step.trim().length > 0,
      );
      if (steps.length === 0) {
        setErrorMsg(
          "Adaptation didn't produce a usable result. Try again, or change your kitchen selection.",
        );
        setMode("error");
        return;
      }
      const isIdentical = stepsAreIdentical(steps, originalSteps);
      const notes =
        response.notes && response.notes.trim().length > 0
          ? response.notes.trim()
          : isIdentical
            ? IDENTICAL_NOTES
            : "";
      setResult({ adaptedSteps: steps, notes });
      setMode("result");
    } catch {
      setErrorMsg(
        "We couldn't rewrite this. Try again, or check your kitchen settings.",
      );
      setMode("error");
    }
  }

  async function handleSave() {
    if (!result) return;
    setIsSaving(true);
    setSaveErrorMsg("");
    try {
      await onSaveAdapted(recipeId, result.adaptedSteps);
      setResult(null);
      setExpanded(true);
      setMode("idle");
    } catch {
      setSaveErrorMsg("We couldn't save that. Try again.");
    } finally {
      setIsSaving(false);
    }
  }

  function handleDiscardResult() {
    setResult(null);
    setSaveErrorMsg("");
    setMode("idle");
  }

  async function handleDiscardSaved() {
    if (!window.confirm("Discard the adapted version?")) return;
    setIsDiscarding(true);
    try {
      await onDiscardAdapted(recipeId);
      setExpanded(false);
    } catch {
      // surface failure in the same place as save errors
      setSaveErrorMsg("We couldn't discard that. Try again.");
    } finally {
      setIsDiscarding(false);
    }
  }

  return (
    <section
      aria-label="Adapt this recipe"
      className="mt-[22px] border-t-[0.5px] border-border pt-[22px]"
    >
      {mode === "loading" && <LoadingState />}

      {mode === "result" && result && (
        <ResultState
          adaptedSteps={result.adaptedSteps}
          notes={result.notes}
          isSaving={isSaving}
          saveErrorMsg={saveErrorMsg}
          onSave={handleSave}
          onDiscard={handleDiscardResult}
        />
      )}

      {mode === "error" && (
        <ErrorState
          message={errorMsg}
          onRetry={handleAdapt}
          retryLabel="Try again"
        />
      )}

      {mode === "idle" && hasSaved && (
        <SavedState
          adaptedSteps={savedAdaptedSteps ?? []}
          expanded={expanded}
          onToggle={() => setExpanded((v) => !v)}
          onReadapt={handleAdapt}
          onDiscard={handleDiscardSaved}
          isDiscarding={isDiscarding}
          saveErrorMsg={saveErrorMsg}
        />
      )}

      {mode === "idle" && !hasSaved && (
        <IdleState
          noEquipment={noEquipment}
          onAdapt={handleAdapt}
        />
      )}
    </section>
  );
}

// ─── States ────────────────────────────────────────────────────────────────

function IdleState({
  noEquipment,
  onAdapt,
}: {
  noEquipment: boolean;
  onAdapt: () => void;
}) {
  return (
    <div>
      <p className="font-ui text-eyebrow uppercase tracking-[0.16em] text-accent">
        Make it yours
      </p>
      <h2 className="mt-1 font-display text-display-md font-medium text-ink">
        Adapt this for your kitchen.
      </h2>
      <p className="mt-1 font-display text-deck italic text-ink-muted">
        We&rsquo;ll rewrite the steps using only what you&rsquo;ve got.
      </p>

      <div className="mt-[14px]">
        <button
          type="button"
          onClick={onAdapt}
          disabled={noEquipment}
          aria-describedby={noEquipment ? "adapt-no-equipment" : undefined}
          className="h-[38px] rounded-sm bg-accent px-4 font-ui text-ui uppercase tracking-[0.14em] text-paper transition-colors hover:bg-accent-strong disabled:cursor-not-allowed disabled:opacity-30"
        >
          Adapt for my kitchen
        </button>
      </div>

      {noEquipment && (
        <>
          <p
            id="adapt-no-equipment"
            className="mt-2 font-ui text-ui-sm text-ink-faint"
          >
            Save your equipment in{" "}
            <Link
              href="/equipment"
              className="text-ink-muted underline-offset-2 hover:text-ink hover:underline"
            >
              Kitchen settings
            </Link>{" "}
            first.
          </p>
          <p className="mt-2 font-ui text-ui-sm text-ink-muted">
            <Link
              href="/equipment"
              className="underline-offset-2 hover:underline"
            >
              Set up your kitchen →
            </Link>
          </p>
        </>
      )}
    </div>
  );
}

function LoadingState() {
  return (
    <div role="status" aria-live="polite">
      <p className="font-ui text-eyebrow uppercase tracking-[0.16em] text-accent">
        Adapt for your kitchen
      </p>
      <div className="mt-[14px] flex items-center gap-2">
        <span
          aria-hidden="true"
          className="inline-block h-[6px] w-[6px] shrink-0 rounded-full bg-accent"
          style={{ animation: "pulse-dot var(--motion-pulse)" }}
        />
        <span className="font-ui text-eyebrow uppercase tracking-[0.16em] text-accent">
          Rewriting…
        </span>
      </div>
    </div>
  );
}

function ResultState({
  adaptedSteps,
  notes,
  isSaving,
  saveErrorMsg,
  onSave,
  onDiscard,
}: {
  adaptedSteps: string[];
  notes: string;
  isSaving: boolean;
  saveErrorMsg: string;
  onSave: () => void;
  onDiscard: () => void;
}) {
  return (
    <div aria-live="polite">
      <p className="font-ui text-eyebrow uppercase tracking-[0.16em] text-accent">
        Adapted for your kitchen
      </p>

      {notes.length > 0 && (
        <div className="mt-3">
          <p className="font-ui text-eyebrow uppercase tracking-[0.16em] text-ink-faint">
            Notes
          </p>
          <p className="mt-1 font-display text-body italic text-ink-muted">
            {notes}
          </p>
        </div>
      )}

      <div className="mt-3">
        <p className="font-ui text-eyebrow uppercase tracking-[0.16em] text-ink-faint">
          Steps
        </p>
        <ol
          className="mt-2 flex flex-col gap-[10px]"
          style={{ listStyleType: "lower-roman" }}
        >
          {adaptedSteps.map((step, i) => (
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
      </div>

      <div className="mt-[22px] flex flex-col gap-3 md:flex-row md:items-center">
        <button
          type="button"
          onClick={onSave}
          disabled={isSaving}
          className="h-[38px] w-full rounded-none bg-ink px-4 font-ui text-ui uppercase tracking-[0.14em] text-paper transition-opacity hover:opacity-[0.92] disabled:cursor-not-allowed disabled:opacity-30 md:w-auto"
        >
          {isSaving ? "Saving…" : "Save this version"}
        </button>
        <button
          type="button"
          onClick={onDiscard}
          disabled={isSaving}
          className="font-ui text-ui-sm text-ink-muted underline-offset-2 hover:text-ink hover:underline disabled:opacity-30"
        >
          Discard
        </button>
      </div>

      {saveErrorMsg && (
        <p
          className="mt-2 font-ui text-body-sm"
          style={{ color: "var(--color-accent-strong)" }}
          role="alert"
        >
          {saveErrorMsg}
        </p>
      )}
    </div>
  );
}

function SavedState({
  adaptedSteps,
  expanded,
  onToggle,
  onReadapt,
  onDiscard,
  isDiscarding,
  saveErrorMsg,
}: {
  adaptedSteps: string[];
  expanded: boolean;
  onToggle: () => void;
  onReadapt: () => void;
  onDiscard: () => void;
  isDiscarding: boolean;
  saveErrorMsg: string;
}) {
  return (
    <div>
      <p className="font-ui text-eyebrow uppercase tracking-[0.16em] text-accent">
        Adapted for your kitchen — saved
      </p>

      <div className="mt-[14px]">
        <button
          type="button"
          onClick={onToggle}
          aria-expanded={expanded}
          className="font-ui text-ui-sm text-ink-muted underline-offset-2 hover:text-ink hover:underline"
        >
          {expanded ? "Hide adapted version ▴" : "Show adapted version ▾"}
        </button>
      </div>

      {expanded && (
        <>
          <ol
            className="mt-3 flex flex-col gap-[10px]"
            style={{ listStyleType: "lower-roman" }}
          >
            {adaptedSteps.map((step, i) => (
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

          <div className="mt-[22px] flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={onReadapt}
              disabled={isDiscarding}
              className="h-[34px] rounded-sm border-[0.5px] border-accent bg-transparent px-3 font-ui text-ui-sm uppercase tracking-[0.14em] text-accent transition-colors hover:bg-accent hover:text-paper disabled:cursor-not-allowed disabled:opacity-30"
            >
              Re-adapt with current kitchen
            </button>
            <button
              type="button"
              onClick={onDiscard}
              disabled={isDiscarding}
              className="font-ui text-ui-sm text-ink-muted underline-offset-2 hover:text-ink hover:underline disabled:opacity-30"
            >
              {isDiscarding ? "Discarding…" : "Discard"}
            </button>
          </div>
        </>
      )}

      {saveErrorMsg && (
        <p
          className="mt-2 font-ui text-body-sm"
          style={{ color: "var(--color-accent-strong)" }}
          role="alert"
        >
          {saveErrorMsg}
        </p>
      )}
    </div>
  );
}

function ErrorState({
  message,
  onRetry,
  retryLabel,
}: {
  message: string;
  onRetry: () => void;
  retryLabel: string;
}) {
  return (
    <div>
      <p className="font-ui text-eyebrow uppercase tracking-[0.16em] text-accent">
        Adapt for your kitchen
      </p>
      <p
        className="mt-3 font-ui text-body-sm"
        style={{ color: "var(--color-accent-strong)" }}
        role="alert"
      >
        {message}
      </p>
      <div className="mt-3 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={onRetry}
          className="h-[38px] rounded-sm bg-accent px-4 font-ui text-ui uppercase tracking-[0.14em] text-paper transition-colors hover:bg-accent-strong"
        >
          {retryLabel}
        </button>
        <Link
          href="/equipment"
          className="font-ui text-ui-sm text-ink-muted underline-offset-2 hover:text-ink hover:underline"
        >
          Adjust kitchen →
        </Link>
      </div>
    </div>
  );
}
