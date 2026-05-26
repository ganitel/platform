import type { HostPublic } from "@/features/properties/types";
import { Avatar, AvatarFallback, AvatarImage } from "@/shared/ui/avatar";
import { useT, type TranslationKey } from "@/shared/lib/i18n";

type HostKind = "host" | "guide";

const LABEL_BY_KIND: Record<HostKind, TranslationKey> = {
  host: "property.host",
  guide: "experience.guide",
};

export function HostCard({
  host,
  kind = "host",
}: {
  host: HostPublic;
  kind?: HostKind;
}) {
  const t = useT();
  const initials = host.display_name
    .split(/\s+/)
    .map((s) => s[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div className="flex items-center gap-4 rounded-2xl border border-ganitel-stroke-neutral bg-ganitel-background-neutral1 p-4">
      <Avatar className="size-14">
        {host.avatar_url ? (
          <AvatarImage src={host.avatar_url} alt={host.display_name} />
        ) : null}
        <AvatarFallback>{initials || "?"}</AvatarFallback>
      </Avatar>
      <div>
        <p className="text-xs uppercase tracking-wide text-ganitel-text-subtitle">
          {t(LABEL_BY_KIND[kind])}
        </p>
        <p className="text-base font-semibold text-ganitel-text-title">
          {host.display_name}
        </p>
      </div>
    </div>
  );
}
