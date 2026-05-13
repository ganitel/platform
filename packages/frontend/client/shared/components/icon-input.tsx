import { forwardRef, type InputHTMLAttributes } from "react";
import type { LucideIcon } from "lucide-react";

import { cn } from "@/shared/lib/cn";
import { INPUT_CLASS } from "@/shared/lib/form-styles";

interface Props extends InputHTMLAttributes<HTMLInputElement> {
  icon: LucideIcon;
}

export const IconInput = forwardRef<HTMLInputElement, Props>(
  ({ icon: Icon, className, ...props }, ref) => (
    <div className="relative">
      <Icon
        className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-ganitel-text-placeholder"
        aria-hidden
      />
      <input
        ref={ref}
        className={cn(INPUT_CLASS, "pl-10", className)}
        {...props}
      />
    </div>
  ),
);
IconInput.displayName = "IconInput";
