import { useMe } from "@/features/auth/hooks/use-me";
import { PageSpinner } from "@/shared/components/page-spinner";
import { ErrorState } from "@/shared/components/error-state";
import { Avatar, AvatarFallback, AvatarImage } from "@/shared/ui/avatar";

export function ProfilePage() {
  const { data: me, isLoading, isError, refetch } = useMe();

  if (isLoading) return <PageSpinner />;
  if (isError || !me) return <ErrorState onRetry={() => refetch()} />;

  const initials = me.display_name
    .split(/\s+/)
    .map((s) => s[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-12 md:px-8">
      <div className="flex items-center gap-5">
        <Avatar className="size-20">
          {me.avatar_url ? <AvatarImage src={me.avatar_url} alt={me.display_name} /> : null}
          <AvatarFallback>{initials || "?"}</AvatarFallback>
        </Avatar>
        <div>
          <h1 className="font-infoma text-3xl text-ganitel-text-title">{me.display_name}</h1>
          <p className="text-sm text-ganitel-text-subtitle">{me.email ?? me.phone ?? "—"}</p>
        </div>
      </div>

      <dl className="mt-10 grid grid-cols-1 gap-y-4 text-sm md:grid-cols-2">
        <div>
          <dt className="text-xs uppercase tracking-wide text-ganitel-text-subtitle">Statut</dt>
          <dd className="mt-1 capitalize text-ganitel-text-title">{me.status}</dd>
        </div>
        <div>
          <dt className="text-xs uppercase tracking-wide text-ganitel-text-subtitle">Langue</dt>
          <dd className="mt-1 uppercase text-ganitel-text-title">{me.language}</dd>
        </div>
        <div>
          <dt className="text-xs uppercase tracking-wide text-ganitel-text-subtitle">Hôte</dt>
          <dd className="mt-1 text-ganitel-text-title">{me.is_host ? "Oui" : "Non"}</dd>
        </div>
        <div>
          <dt className="text-xs uppercase tracking-wide text-ganitel-text-subtitle">Admin</dt>
          <dd className="mt-1 text-ganitel-text-title">{me.is_admin ? "Oui" : "Non"}</dd>
        </div>
      </dl>
    </div>
  );
}
