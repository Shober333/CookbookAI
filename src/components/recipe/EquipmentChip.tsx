"use client";

interface EquipmentChipProps {
  equipment: string;
  equipmentKey: string;
  isSelected: boolean;
  onToggle: () => void;
  disabled?: boolean;
}

export function EquipmentChip({
  equipment,
  isSelected,
  onToggle,
  disabled = false,
}: EquipmentChipProps) {
  return (
    <button
      type="button"
      aria-pressed={isSelected}
      onClick={onToggle}
      disabled={disabled}
      className={[
        "flex min-h-[44px] w-full items-center gap-2 rounded-md border-[0.5px] px-3 py-[10px] text-left transition-colors",
        "disabled:opacity-50 disabled:pointer-events-none",
        isSelected
          ? "border-accent bg-accent-bg"
          : "border-border bg-transparent hover:border-accent",
      ].join(" ")}
    >
      <span
        aria-hidden="true"
        className={[
          "flex h-3 w-3 shrink-0 items-center justify-center rounded-full border-[0.5px]",
          isSelected
            ? "border-accent bg-accent text-paper"
            : "border-border-strong bg-transparent",
        ].join(" ")}
      >
        {isSelected && (
          <svg
            viewBox="0 0 12 12"
            className="h-2 w-2"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M2.5 6.5l2.5 2.5 4.5-5.5" />
          </svg>
        )}
      </span>
      <span
        className={[
          "font-display text-body-sm",
          isSelected
            ? "font-medium text-ink"
            : "italic text-ink-muted",
        ].join(" ")}
      >
        {equipment}
      </span>
    </button>
  );
}
