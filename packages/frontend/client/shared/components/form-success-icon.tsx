import { CheckCircle2 } from "lucide-react";

import { cn } from "@/shared/lib/cn";

type Size = "md" | "lg";

const WRAPPER: Record<Size, string> = {
  md: "mb-4 size-14",
  lg: "mb-5 size-16",
};

const ICON: Record<Size, string> = {
  md: "size-7",
  lg: "size-8",
};

export function FormSuccessIcon({ size = "lg" }: { size?: Size }) {
  return (
    <div
      className={cn(
        "grid place-items-center rounded-full bg-ganitel-accent-green",
        WRAPPER[size],
      )}
    >
      <CheckCircle2
        className={cn("text-ganitel-moss", ICON[size])}
        aria-hidden
      />
    </div>
  );
}
