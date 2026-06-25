import type { LucideIcon } from "lucide-react";

import { cn } from "@/shared/lib/cn";

interface Props {
  icon: LucideIcon;
  title: string;
  body: string;
  tone: "olive" | "tan" | "brown" | "sage";
}

const TONE_CHIP: Record<Props["tone"], string> = {
  olive: "bg-ganitel-olive-soft text-ganitel-olive",
  tan: "bg-ganitel-tan-soft text-ganitel-brown",
  brown: "bg-ganitel-tan-soft/60 text-ganitel-brown",
  sage: "bg-ganitel-sage/25 text-ganitel-olive",
};

export function TrustCard({ icon: Icon, title, body, tone }: Props) {
  return (
    <div className="flex flex-col gap-3 rounded-card border border-ganitel-outline-soft/50 bg-ganitel-surface-card p-5">
      <span
        className={cn(
          "inline-flex size-10 items-center justify-center rounded-full",
          TONE_CHIP[tone],
        )}
      >
        <Icon className="size-5" />
      </span>
      <div>
        <h3 className="text-sm font-semibold tracking-tight text-ganitel-text-title">
          {title}
        </h3>
        <p className="mt-1 text-[13px] leading-relaxed text-ganitel-text-subtitle">
          {body}
        </p>
      </div>
    </div>
  );
}
