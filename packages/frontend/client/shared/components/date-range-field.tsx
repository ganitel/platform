import { Calendar } from "lucide-react";

import { cn } from "@/shared/lib/cn";
import { INPUT_CLASS, LABEL_CLASS } from "@/shared/lib/form-styles";

interface Props {
  startValue: string;
  endValue: string;
  onStartChange: (next: string) => void;
  onEndChange: (next: string) => void;
  startLabel: string;
  endLabel: string;
  startPlaceholder: string;
  endPlaceholder: string;
  todayIso: string;
  startId?: string;
  endId?: string;
}

const DATE_INPUT_CLASS = cn(
  INPUT_CLASS,
  "pl-10 [&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:inset-0 [&::-webkit-calendar-picker-indicator]:w-full [&::-webkit-calendar-picker-indicator]:h-full [&::-webkit-calendar-picker-indicator]:cursor-pointer",
);

export function DateRangeField({
  startValue,
  endValue,
  onStartChange,
  onEndChange,
  startLabel,
  endLabel,
  startPlaceholder,
  endPlaceholder,
  todayIso,
  startId = "date-range-start",
  endId = "date-range-end",
}: Props) {
  const endMin = startValue || todayIso;
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      <div>
        <label htmlFor={startId} className={LABEL_CLASS}>
          {startLabel}
        </label>
        <div className="relative">
          <Calendar
            className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-ganitel-text-placeholder"
            aria-hidden
          />
          <input
            id={startId}
            type="date"
            value={startValue}
            min={todayIso}
            placeholder={startPlaceholder}
            onChange={(e) => onStartChange(e.target.value)}
            className={DATE_INPUT_CLASS}
          />
        </div>
      </div>
      <div>
        <label htmlFor={endId} className={LABEL_CLASS}>
          {endLabel}
        </label>
        <div className="relative">
          <Calendar
            className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-ganitel-text-placeholder"
            aria-hidden
          />
          <input
            id={endId}
            type="date"
            value={endValue}
            min={endMin}
            placeholder={endPlaceholder}
            onChange={(e) => onEndChange(e.target.value)}
            className={DATE_INPUT_CLASS}
          />
        </div>
      </div>
    </div>
  );
}
