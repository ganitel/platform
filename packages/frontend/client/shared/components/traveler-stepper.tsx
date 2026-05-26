import { Minus, Plus } from "lucide-react";

import { cn } from "@/shared/lib/cn";

interface Props {
  label: string;
  hint?: string;
  value: number;
  min: number;
  max: number;
  onChange: (next: number) => void;
  decrementLabel: string;
  incrementLabel: string;
}

const BUTTON_CLASS =
  "flex size-10 items-center justify-center rounded-full border border-ganitel-stroke-neutral bg-ganitel-neutral-1 text-ganitel-text-title transition-all hover:border-ganitel-text-title disabled:cursor-not-allowed disabled:opacity-40";

export function TravelerStepper({
  label,
  hint,
  value,
  min,
  max,
  onChange,
  decrementLabel,
  incrementLabel,
}: Props) {
  const atMin = value <= min;
  const atMax = value >= max;

  return (
    <div className="flex items-center justify-between rounded-xl border border-ganitel-stroke-neutral bg-ganitel-neutral-1 px-4 py-3">
      <div className="min-w-0">
        <p className="text-sm font-medium text-ganitel-text-title">{label}</p>
        {hint && (
          <p className="mt-0.5 text-xs text-ganitel-text-subtitle">{hint}</p>
        )}
      </div>
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => onChange(value - 1)}
          disabled={atMin}
          aria-label={decrementLabel}
          className={BUTTON_CLASS}
        >
          <Minus className="size-4" aria-hidden />
        </button>
        <span
          aria-live="polite"
          className={cn(
            "min-w-[2ch] text-center text-base font-semibold tabular-nums text-ganitel-text-title",
          )}
        >
          {value}
        </span>
        <button
          type="button"
          onClick={() => onChange(value + 1)}
          disabled={atMax}
          aria-label={incrementLabel}
          className={BUTTON_CLASS}
        >
          <Plus className="size-4" aria-hidden />
        </button>
      </div>
    </div>
  );
}
