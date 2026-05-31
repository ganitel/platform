import type { ReactNode } from "react";

import { cn } from "@/shared/lib/cn";

export interface StatementProps {
  eyebrow?: ReactNode;
  body: ReactNode;
  sub?: ReactNode;
  className?: string;
}

export function Statement({ eyebrow, body, sub, className }: StatementProps) {
  return (
    <section
      className={cn("mx-auto w-full max-w-3xl px-6 py-16 md:py-24", className)}
    >
      {eyebrow ? (
        <p className="mb-4 text-xs font-medium uppercase tracking-[0.18em] text-ganitel-brown">
          {eyebrow}
        </p>
      ) : null}
      <span
        aria-hidden
        className="ganitel-rule-grow mb-6 block h-px w-12 bg-ganitel-rule"
      />
      <p
        className="text-3xl leading-[1.18] text-ganitel-text-title md:text-4xl"
        style={{ fontFamily: "var(--font-display)" }}
      >
        {body}
      </p>
      {sub ? (
        <p className="mt-5 max-w-prose text-sm leading-[1.55] text-ganitel-text-subtitle">
          {sub}
        </p>
      ) : null}
    </section>
  );
}
