"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { EquipmentChip } from "@/components/recipe/EquipmentChip";

type ApplianceKey =
  | "stovetop"
  | "oven"
  | "air_fryer"
  | "slow_cooker"
  | "microwave"
  | "instant_pot"
  | "grill"
  | "blender";

type LoadState = "loading" | "loaded" | "load-error";
type SaveState = "idle" | "saving" | "saved" | "save-error";

const APPLIANCES: { key: ApplianceKey; label: string }[] = [
  { key: "stovetop", label: "Stovetop" },
  { key: "oven", label: "Oven" },
  { key: "air_fryer", label: "Air fryer" },
  { key: "slow_cooker", label: "Slow cooker" },
  { key: "microwave", label: "Microwave" },
  { key: "instant_pot", label: "Instant Pot" },
  { key: "grill", label: "Grill" },
  { key: "blender", label: "Blender" },
];

function setsEqual(a: Set<string>, b: Set<string>): boolean {
  if (a.size !== b.size) return false;
  for (const item of a) if (!b.has(item)) return false;
  return true;
}

function formatRelativeSavedTime(savedAtMs: number, nowMs: number): string {
  const elapsed = Math.max(0, nowMs - savedAtMs);
  const seconds = Math.floor(elapsed / 1000);
  if (seconds < 5) return "Saved.";
  if (seconds < 60)
    return `Saved ${seconds} second${seconds === 1 ? "" : "s"} ago.`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60)
    return `Last saved ${minutes} minute${minutes === 1 ? "" : "s"} ago.`;
  const hours = Math.floor(minutes / 60);
  return `Last saved ${hours} hour${hours === 1 ? "" : "s"} ago.`;
}

export default function EquipmentPage() {
  const [loadState, setLoadState] = useState<LoadState>("loading");
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [saveError, setSaveError] = useState<string>("");
  const [savedAppliances, setSavedAppliances] = useState<Set<string>>(
    () => new Set(),
  );
  const [selected, setSelected] = useState<Set<string>>(() => new Set());
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const [now, setNow] = useState<number>(() => Date.now());
  const initialFetchRan = useRef(false);

  useEffect(() => {
    if (initialFetchRan.current) return;
    initialFetchRan.current = true;

    fetch("/api/equipment")
      .then(async (res) => {
        if (!res.ok) throw new Error();
        return res.json() as Promise<{ appliances: string[] }>;
      })
      .then((data) => {
        const initial = new Set(data.appliances ?? []);
        setSavedAppliances(initial);
        setSelected(new Set(initial));
        setLoadState("loaded");
      })
      .catch(() => setLoadState("load-error"));
  }, []);

  useEffect(() => {
    if (savedAt === null) return;
    const id = setInterval(() => setNow(Date.now()), 15_000);
    return () => clearInterval(id);
  }, [savedAt]);

  const hasChanges = useMemo(
    () => !setsEqual(selected, savedAppliances),
    [selected, savedAppliances],
  );
  const canSave =
    loadState === "loaded" &&
    saveState !== "saving" &&
    selected.size >= 1 &&
    hasChanges;
  const chipsDisabled = loadState !== "loaded" || saveState === "saving";

  function toggle(key: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
    if (saveState === "save-error") {
      setSaveState("idle");
      setSaveError("");
    }
  }

  async function handleSave() {
    if (!canSave) return;
    setSaveState("saving");
    setSaveError("");

    try {
      const res = await fetch("/api/equipment", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ appliances: Array.from(selected) }),
      });
      if (!res.ok) throw new Error();
      const data = (await res.json()) as { appliances: string[] };
      const next = new Set(data.appliances ?? []);
      setSavedAppliances(next);
      setSelected(new Set(next));
      setSaveState("saved");
      setSavedAt(Date.now());
      setNow(Date.now());
    } catch {
      setSaveState("save-error");
      setSaveError("Couldn't save. Try again.");
    }
  }

  return (
    <div className="mx-auto max-w-[620px] px-5 py-[26px] md:px-7">
      {/* Page header */}
      <div>
        <p className="font-ui text-eyebrow uppercase tracking-[0.16em] text-accent">
          Settings
        </p>
        <h1 className="mt-1 font-display text-display-md font-medium text-ink">
          Your kitchen.
        </h1>
        <p className="mt-1 font-display text-deck italic text-ink-muted">
          Tell us what you have, and we&rsquo;ll adapt recipes to fit.
        </p>
      </div>

      {/* Load error */}
      {loadState === "load-error" && (
        <p
          className="mt-4 font-ui text-body-sm"
          style={{ color: "var(--color-accent-strong)" }}
          role="alert"
        >
          We couldn&rsquo;t load your kitchen settings. Refresh to try again.
        </p>
      )}

      {/* Divider */}
      <div className="mt-[22px] border-t-[0.5px] border-border" />

      {/* Chip grid */}
      <fieldset className="mt-[22px]" disabled={chipsDisabled}>
        <legend className="sr-only">Your equipment</legend>
        <div
          className="grid grid-cols-3 gap-2"
          aria-busy={loadState === "loading" ? true : undefined}
        >
          {APPLIANCES.map(({ key, label }) => (
            <EquipmentChip
              key={key}
              equipment={label}
              equipmentKey={key}
              isSelected={selected.has(key)}
              onToggle={() => toggle(key)}
              disabled={chipsDisabled}
            />
          ))}
        </div>
      </fieldset>

      {/* Empty hint */}
      {loadState === "loaded" && selected.size === 0 && (
        <p className="mt-3 font-display text-body-sm italic text-ink-muted">
          Pick at least one to start.
        </p>
      )}

      {/* Save row */}
      <div className="mt-[28px] flex flex-col gap-2 md:flex-row md:items-center md:gap-3">
        <button
          type="button"
          onClick={handleSave}
          disabled={!canSave}
          aria-describedby="equipment-save-status"
          className="h-[38px] w-full rounded-none bg-ink px-4 font-ui text-ui uppercase tracking-[0.14em] text-paper transition-opacity hover:opacity-[0.92] disabled:cursor-not-allowed disabled:opacity-30 md:w-auto"
        >
          {saveState === "saving" ? "Saving…" : "Save changes"}
        </button>

        <p
          id="equipment-save-status"
          aria-live="polite"
          className="font-ui text-ui-sm"
          style={{
            color:
              saveState === "save-error"
                ? "var(--color-accent-strong)"
                : "var(--color-ink-muted)",
          }}
        >
          {saveState === "save-error"
            ? saveError
            : saveState === "saved" && savedAt !== null
              ? formatRelativeSavedTime(savedAt, now)
              : ""}
        </p>
      </div>
    </div>
  );
}
