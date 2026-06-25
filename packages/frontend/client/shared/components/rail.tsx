import type { ReactNode } from "react";

import { cn } from "@/shared/lib/cn";
import { useReveal } from "@/shared/hooks/use-reveal";

interface RailProps {
  children: ReactNode;
  /** Accessible label for the scrollable region (e.g. the section title). */
  ariaLabel: string;
  className?: string;
}

/**
 * Horizontal snap-scroll track used by the home rails (cities, experiences,
 * stories). Bleeds to the page gutter, fades at both scroll edges, and hides
 * its scrollbar. Cards stagger in as the rail enters the viewport; each child
 * carries `snap-start` and its own min-width.
 */
export function Rail({ children, ariaLabel, className }: RailProps) {
  const revealRef = useReveal<HTMLDivElement>({
    rootMargin: "0px 0px -8% 0px",
  });
  return (
    <div
      ref={revealRef}
      data-reveal=""
      data-reveal-children=""
      role="region"
      aria-label={ariaLabel}
      className={cn(
        "rail-edge-mask scrollbar-none flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-px-5 px-5 pb-2 md:gap-6 md:scroll-px-12 md:px-12",
        className,
      )}
    >
      {children}
    </div>
  );
}
