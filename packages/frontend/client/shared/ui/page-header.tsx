import type { ReactNode } from "react";

import { cn } from "@/shared/lib/cn";

export interface PageHeaderProps {
  eyebrow?: ReactNode;
  title: ReactNode;
  emphasis?: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  className?: string;
}

export function PageHeader({
  eyebrow,
  title,
  emphasis,
  description,
  actions,
  className,
}: PageHeaderProps) {
  return (
    <header
      className={cn(
        "mb-10 flex flex-col gap-6 border-b border-ganitel-stroke-neutral pb-8 sm:flex-row sm:items-end sm:justify-between",
        className,
      )}
    >
      <div className="min-w-0">
        {eyebrow ? (
          <p className="mb-3 text-[11px] font-medium uppercase tracking-[0.18em] text-ganitel-brown">
            {eyebrow}
          </p>
        ) : null}
        <h1 className="text-[32px] leading-[1.04] tracking-[-0.01em] text-ganitel-text-title md:text-[48px]">
          {title}
          {emphasis ? (
            <>
              {" "}
              <em className="italic text-ganitel-brown">{emphasis}</em>
            </>
          ) : null}
        </h1>
        {description ? (
          <p className="mt-4 max-w-2xl text-[15px] leading-relaxed text-ganitel-text-subtitle md:text-base">
            {description}
          </p>
        ) : null}
        <span
          aria-hidden
          className="ganitel-rule-grow mt-6 block h-px w-12 bg-ganitel-rule"
        />
      </div>
      {actions ? (
        <div className="flex shrink-0 flex-wrap items-center gap-2">
          {actions}
        </div>
      ) : null}
    </header>
  );
}
