import type { CSSProperties, ReactNode } from "react";
import { motion } from "framer-motion";

import { cn } from "@/shared/lib/cn";

const TITLE_STYLE: CSSProperties = {
  fontSize: "clamp(2.25rem, 4.4vw, 4.5rem)",
};

const ENTRANCE_EASE = [0.2, 0.7, 0.2, 1] as const;

export interface SectionHeaderProps {
  tag?: ReactNode;
  title: ReactNode;
  emphasis?: ReactNode;
  lede?: ReactNode;
  align?: "split" | "stacked";
  inverted?: boolean;
  level?: "h1" | "h2";
  className?: string;
  animate?: boolean;
}

export function SectionHeader({
  tag,
  title,
  emphasis,
  lede,
  align = "split",
  inverted = false,
  level = "h2",
  className,
  animate = true,
}: SectionHeaderProps) {
  const tagColor = inverted ? "text-ganitel-paper-warm" : "text-ganitel-text-title";
  const titleColor = inverted ? "text-ganitel-paper" : "text-ganitel-text-title";
  const ledeColor = inverted ? "text-ganitel-paper-warm/80" : "text-ganitel-text-subtitle";

  const Heading = level === "h1" ? "h1" : "h2";

  const content = (
    <>
      <div>
        {tag ? (
          <span
            className={cn(
              "font-display text-[12px] font-semibold uppercase tracking-[0.18em]",
              tagColor,
            )}
          >
            {tag}
          </span>
        ) : null}
        <Heading
          style={TITLE_STYLE}
          className={cn(
            "font-display mt-4 text-balance font-bold leading-[1.02] tracking-[-0.04em]",
            titleColor,
          )}
        >
          {title}
          {emphasis ? (
            <>
              {" "}
              <em className="font-italic-serif text-ganitel-secondary">{emphasis}</em>
            </>
          ) : null}
        </Heading>
      </div>
      {lede ? (
        <p className={cn("m-0 max-w-prose text-sm leading-[1.6] md:text-[15px]", ledeColor)}>
          {lede}
        </p>
      ) : null}
    </>
  );

  const layout = cn(
    align === "split"
      ? "grid gap-x-12 gap-y-6 md:grid-cols-[1fr_minmax(0,520px)] md:items-end"
      : "flex flex-col gap-6",
    className,
  );

  if (!animate) {
    return <header className={layout}>{content}</header>;
  }

  return (
    <motion.header
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-15%" }}
      transition={{ duration: 0.8, ease: ENTRANCE_EASE }}
      className={layout}
    >
      {content}
    </motion.header>
  );
}
