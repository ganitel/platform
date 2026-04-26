import type { HostPublic } from "@/features/properties/types";
import { Avatar, AvatarFallback, AvatarImage } from "@/shared/ui/avatar";
import { useT } from "@/shared/lib/i18n";

export function HostCard({ host }: { host: HostPublic }) {
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
        {host.avatar_url ? <AvatarImage src={host.avatar_url} alt={host.display_name} /> : null}
        <AvatarFallback>{initials || "?"}</AvatarFallback>
      </Avatar>
      <div>
        <p className="text-xs uppercase tracking-wide text-ganitel-text-subtitle">{t("property.host")}</p>
        <p className="text-base font-semibold text-ganitel-text-title">{host.display_name}</p>
      </div>
    </div>
  );
}
