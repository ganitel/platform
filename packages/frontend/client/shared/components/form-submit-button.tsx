import { type ButtonHTMLAttributes, type ReactNode } from "react";

import { cn } from "@/shared/lib/cn";

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  isSubmitting?: boolean;
  submittingLabel?: ReactNode;
}

export function FormSubmitButton({
  isSubmitting,
  submittingLabel,
  disabled,
  className,
  children,
  type = "submit",
  ...props
}: Props) {
  return (
    <button
      type={type}
      disabled={disabled || isSubmitting}
      className={cn(
        "w-full rounded-xl bg-ganitel-primary py-3.5 text-sm font-semibold text-white transition-all hover:bg-ganitel-primary/90 active:scale-[0.98] disabled:opacity-60",
        className,
      )}
      {...props}
    >
      {isSubmitting && submittingLabel ? submittingLabel : children}
    </button>
  );
}
