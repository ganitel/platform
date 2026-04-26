import { Button } from "@/shared/ui/button";
import { useT } from "@/shared/lib/i18n";

interface Props {
  message?: string;
  onRetry?: () => void;
}

export function ErrorState({ message, onRetry }: Props) {
  const t = useT();
  return (
    <div className="flex min-h-[40vh] flex-col items-center justify-center gap-3 text-center">
      <p className="text-sm text-ganitel-text-subtitle">{message ?? t("common.error.generic")}</p>
      {onRetry ? (
        <Button variant="outline" size="sm" onClick={onRetry}>
          {t("common.retry")}
        </Button>
      ) : null}
    </div>
  );
}
