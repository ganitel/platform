import type { ReactNode } from "react";

import { cn } from "@/shared/lib/cn";

export interface FormFieldProps {
  label: ReactNode;
  htmlFor: string;
  required?: boolean;
  error?: ReactNode;
  hint?: ReactNode;
  className?: string;
  children: ReactNode;
}

export function FormField({
  label,
  htmlFor,
  required,
  error,
  hint,
  className,
  children,
}: FormFieldProps) {
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <label
        htmlFor={htmlFor}
        className="text-[13px] font-medium text-ganitel-text-label"
      >
        {label}
        {required ? (
          <span
            aria-label="required"
            className="ml-1 italic text-ganitel-brown"
            style={{ fontFamily: "var(--font-display)" }}
          >
            *
          </span>
        ) : null}
      </label>
      {children}
      {hint && !error ? (
        <p className="text-[12px] text-ganitel-text-placeholder">{hint}</p>
      ) : null}
      {error ? <p className="text-[12px] text-destructive">{error}</p> : null}
    </div>
  );
}
