"use client";

interface ServingScalerProps {
  value: number;
  min?: number;
  max?: number;
  onChange: (next: number) => void;
}

export function ServingScaler({
  value,
  min = 1,
  max = 12,
  onChange,
}: ServingScalerProps) {
  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "ArrowUp") {
      e.preventDefault();
      if (value < max) onChange(value + 1);
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      if (value > min) onChange(value - 1);
    }
  }

  return (
    <div
      role="group"
      aria-label="Servings"
      className="flex items-center gap-2"
    >
      <span className="font-ui text-eyebrow uppercase tracking-[0.16em] text-ink-faint">
        Serves
      </span>

      <div
        className="inline-flex border-[0.5px] border-ink"
        tabIndex={0}
        onKeyDown={handleKeyDown}
      >
        <button
          type="button"
          onClick={() => onChange(Math.max(value - 1, min))}
          disabled={value <= min}
          aria-label="Decrease servings"
          className="px-[10px] py-[3px] font-display text-body font-medium text-ink transition-colors hover:bg-ink hover:text-paper disabled:cursor-not-allowed disabled:opacity-30"
          tabIndex={-1}
        >
          −
        </button>

        <div
          className="serving-count border-x-[0.5px] border-ink px-[10px] py-[3px] font-display text-body text-ink"
          aria-live="polite"
        >
          {value}
        </div>

        <button
          type="button"
          onClick={() => onChange(Math.min(value + 1, max))}
          disabled={value >= max}
          aria-label="Increase servings"
          className="px-[10px] py-[3px] font-display text-body font-medium text-ink transition-colors hover:bg-ink hover:text-paper disabled:cursor-not-allowed disabled:opacity-30"
          tabIndex={-1}
        >
          +
        </button>
      </div>
    </div>
  );
}
