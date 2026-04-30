"use client";

type UnitSystem = "metric" | "imperial";

interface UnitToggleProps {
  value: UnitSystem;
  onChange: (next: UnitSystem) => void;
}

const SYSTEMS: UnitSystem[] = ["metric", "imperial"];

export function UnitToggle({ value, onChange }: UnitToggleProps) {
  return (
    <div role="group" aria-label="Units" className="inline-flex items-center">
      {SYSTEMS.map((system, i) => (
        <span key={system} className="inline-flex items-center">
          {i > 0 && (
            <span className="mx-1 font-ui text-ui-sm text-ink-ghost select-none">
              |
            </span>
          )}
          <button
            type="button"
            onClick={() => onChange(system)}
            aria-pressed={value === system}
            className={[
              "px-[10px] py-[3px] font-ui text-ui-sm lowercase transition-colors",
              "border-b",
              value === system
                ? "font-medium text-ink border-accent"
                : "text-ink-faint border-transparent hover:text-ink",
            ].join(" ")}
          >
            {system}
          </button>
        </span>
      ))}
    </div>
  );
}
