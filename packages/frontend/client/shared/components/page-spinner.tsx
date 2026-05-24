import { useT } from "@/shared/lib/i18n";

export function PageSpinner() {
  const tr = useT();
  return (
    <div className="flex min-h-[40vh] items-center justify-center">
      <span
        className="size-8 animate-spin rounded-full border-2 border-ganitel-stroke-neutral border-t-ganitel-primary"
        aria-label={tr("common.loading_aria")}
        role="status"
      />
    </div>
  );
}
