import { Link } from "react-router";
import { ArrowRight } from "lucide-react";

import { cn } from "@/shared/lib/cn";

interface SectionHeadingProps {
  title: string;
  subtitle?: string;
  action?: { to: string; label: string };
  className?: string;
  align?: "start" | "center";
}

/**
 * The repeated "Title + subtitle + See all" header above home sections and
 * rails. Title uses the display face (Manrope); subtitle is muted body.
 */
export function SectionHeading({
  title,
  subtitle,
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
