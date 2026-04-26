import { Link, type LinkProps } from "react-router";
import type { ReactNode } from "react";
import { ArrowRight } from "lucide-react";

import { cn } from "@/shared/lib/cn";

const VARIANTS = {
  solid:
    "bg-ganitel-text-title text-ganitel-paper shadow-[0_18px_36px_-16px_rgba(20,20,14,0.45)] hover:bg-ganitel-moss hover:-translate-y-0.5",
  paper:
    "bg-ganitel-paper text-ganitel-text-title shadow-[0_18px_36px_-16px_rgba(0,0,0,0.45)] hover:bg-white hover:-translate-y-0.5",
  ghost:
    "border border-ganitel-text-title text-ganitel-text-title hover:bg-ganitel-text-title hover:text-ganitel-paper",
  outline:
    "border border-[rgba(20,20,14,0.18)] text-ganitel-text-title hover:border-ganitel-text-title hover:bg-[rgba(20,20,14,0.05)]",
} as const;

type Variant = keyof typeof VARIANTS;
type Size = "sm" | "md";

const SIZES: Record<Size, string> = {
  sm: "px-4 py-2.5 text-[13px] gap-2",
  md: "px-7 py-4 text-sm gap-3",
};

export interface PillLinkProps extends Omit<LinkProps, "children"> {
  variant?: Variant;
  size?: Size;
  arrow?: boolean;
  children: ReactNode;
}

export function PillLink({
  variant = "solid",
  size = "md",
  arrow = false,
  className,
  children,
  ...rest
}: PillLinkProps) {
  return (
    <Link
      className={cn(
        "group inline-flex items-center rounded-full font-medium tracking-tight transition-all duration-200",
        SIZES[size],
        VARIANTS[variant],
        className,
      )}
      {...rest}
    >
      <span>{children}</span>
      {arrow ? (
        <ArrowRight
          className={cn(
            "transition-transform duration-200 group-hover:translate-x-1",
            size === "sm" ? "size-3" : "size-3.5",
          )}
          strokeWidth={2}
          aria-hidden
        />
      ) : null}
    </Link>
  );
}
