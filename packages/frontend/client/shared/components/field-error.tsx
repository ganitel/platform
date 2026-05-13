import { cn } from "@/shared/lib/cn";

interface Props {
  message?: string | null;
  className?: string;
}

export function FieldError({ message, className }: Props) {
  if (!message) return null;
  return (
    <p className={cn("mt-1 text-xs text-red-500", className)}>{message}</p>
  );
}
