import { cn } from "@/shared/lib/cn";

export function LogoMark({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "grid size-7 rotate-[-4deg] place-items-center rounded-lg bg-ganitel-text-title text-[13px] font-extrabold leading-none text-ganitel-paper",
        className,
      )}
    >
      G
    </span>
  );
}
