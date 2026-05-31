import type { ReactNode } from "react";

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
  return (
    <div
      role="tablist"
      aria-label={ariaLabel}
      className={cn(
        "flex gap-8 border-b border-ganitel-stroke-neutral",
        className,
      )}
    >
      {items.map((item) => {
        const active = item.value === value;
        return (
          <button
            key={item.value}
            type="button"
            role="tab"
            aria-selected={active}
            tabIndex={active ? 0 : -1}
            onClick={() => onChange(item.value)}
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
