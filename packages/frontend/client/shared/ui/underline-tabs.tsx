import type { KeyboardEvent, ReactNode } from "react";
import { useRef } from "react";

import { cn } from "@/shared/lib/cn";

export interface UnderlineTabItem<T extends string = string> {
  value: T;
  label: ReactNode;
}

export interface UnderlineTabsProps<T extends string = string> {
  items: ReadonlyArray<UnderlineTabItem<T>>;
  value: T;
  onChange: (value: T) => void;
  className?: string;
  ariaLabel?: string;
}

export function UnderlineTabs<T extends string = string>({
  items,
  value,
  onChange,
  className,
  ariaLabel,
}: UnderlineTabsProps<T>) {
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([]);

  const handleKeyDown = (
    event: KeyboardEvent<HTMLButtonElement>,
    currentIndex: number,
  ) => {
    if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
    const offset = event.key === "ArrowRight" ? 1 : -1;
    const nextIndex = (currentIndex + offset + items.length) % items.length;
    event.preventDefault();
    onChange(items[nextIndex].value);
    tabRefs.current[nextIndex]?.focus();
  };

  return (
    <div
      role="tablist"
      aria-label={ariaLabel}
      className={cn(
        "flex gap-8 border-b border-ganitel-stroke-neutral",
        className,
      )}
    >
      {items.map((item, index) => {
        const active = item.value === value;
        return (
          <button
            key={item.value}
            ref={(el) => {
              tabRefs.current[index] = el;
            }}
            type="button"
            role="tab"
            aria-selected={active}
            tabIndex={active ? 0 : -1}
            onClick={() => onChange(item.value)}
            onKeyDown={(event) => handleKeyDown(event, index)}
            className={cn(
              "relative -mb-px pb-3 text-sm transition-colors duration-150",
              active
                ? "font-medium text-ganitel-text-title"
                : "font-medium text-ganitel-text-placeholder hover:text-ganitel-text-title",
            )}
          >
            {item.label}
            <span
              aria-hidden
              className={cn(
                "absolute inset-x-0 -bottom-px h-[2px] origin-left rounded-full bg-ganitel-rule transition-transform duration-200",
                active ? "scale-x-100" : "scale-x-0",
              )}
            />
          </button>
        );
      })}
    </div>
  );
}
