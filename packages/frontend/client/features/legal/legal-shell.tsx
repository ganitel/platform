import { useT } from "@/shared/lib/i18n";
import { cn } from "@/shared/lib/cn";

interface LegalFooterNotesProps {
  className?: string;
  showContact?: boolean;
}

export function LegalFooterNotes({
  className,
  showContact = false,
}: LegalFooterNotesProps) {
  const t = useT();
  const email = t("legal.contact_email");
  return (
    <div
      className={cn(
        "flex flex-col gap-2 text-[13px] text-ganitel-text-placeholder",
        className,
      )}
    >
      <p className="m-0 uppercase tracking-[0.12em]">{t("legal.updated_at")}</p>
      <p className="m-0 italic">{t("legal.draft_notice")}</p>
      {showContact ? (
        <p className="m-0 not-italic text-ganitel-text-subtitle">
          {t("legal.contact_intro")}{" "}
          <a
            href={`mailto:${email}`}
            className="text-ganitel-text-title underline decoration-dotted underline-offset-4 hover:decoration-solid"
          >
            {email}
          </a>
          .
        </p>
      ) : null}
    </div>
  );
}
