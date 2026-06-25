import { Link } from "react-router";
import { ArrowRight } from "lucide-react";

import { cn } from "@/shared/lib/cn";

interface SectionHeadingProps {
  title: string;
  subtitle?: string;
  eyebrow?: string;
  action?: { to: string; label: string };
  className?: string;
  align?: "start" | "center";
}

/**
 * The repeated "Title + subtitle + See all" header above home sections and
 * rails. An optional eyebrow (with a small accent rule) adds editorial
 * character. Title uses the display face (Manrope); subtitle is muted body.
 */
export function SectionHeading({
  title,
  subtitle,
  eyebrow,
  action,
  className,
  align = "start",
}: SectionHeadingProps) {
  return (
    <div
      className={cn(
        "flex items-end justify-between gap-4",
        align === "center" && "flex-col items-center text-center",
        className,
      )}
    >
      <div className="min-w-0">
        {eyebrow && (
          <span
            className={cn(
              "mb-2 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-ganitel-olive",
              align === "center" && "justify-center",
            )}
          >
            <span aria-hidden className="h-px w-6 bg-ganitel-olive/50" />
            {eyebrow}
          </span>
        )}
        <h2 className="text-2xl font-semibold tracking-[-0.02em] text-ganitel-text-title md:text-[28px]">
          {title}
        </h2>
        {subtitle && (
          <p className="mt-1 text-sm leading-relaxed text-ganitel-text-subtitle md:text-base">
            {subtitle}
          </p>
        )}
      </div>
      {action && (
        <Link
          to={action.to}
          className="group inline-flex shrink-0 items-center gap-1 whitespace-nowrap pb-1 text-sm font-semibold text-ganitel-accent transition-opacity hover:opacity-70"
        >
          {action.label}
          <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
        </Link>
      )}
    </div>
  );
}
