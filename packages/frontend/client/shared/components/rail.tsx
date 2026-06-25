import type { ReactNode } from "react";

import { cn } from "@/shared/lib/cn";

interface RailProps {
  children: ReactNode;
  /** Accessible label for the scrollable region (e.g. the section title). */
  ariaLabel: string;
  className?: string;
}

/**
 * Horizontal snap-scroll track used by the home rails (cities, experiences,
 * stories). Bleeds to the page gutter and hides its scrollbar; each child
 * should carry `snap-start` and its own min-width.
 */
export function Rail({ children, ariaLabel, className }: RailProps) {
  return (
    <div
      role="region"
      aria-label={ariaLabel}
      className={cn(
        "scrollbar-none flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-px-5 px-5 pb-2 md:gap-6 md:scroll-px-12 md:px-12",
        className,
      )}
    >
      {children}
    </div>
  );
}
