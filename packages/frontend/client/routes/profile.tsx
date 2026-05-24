import { redirect } from "react-router";

import type { Route } from "./+types/profile";

import { Avatar, AvatarFallback, AvatarImage } from "@/shared/ui/avatar";
import { ErrorState } from "@/shared/components/error-state";
import {
  getServerToken,
  serverFetch,
  ServerApiError,
} from "@/shared/api/server";
import type { UserMe } from "@/features/auth/api/me";
import { localeFromAcceptLanguage, t, useT } from "@/shared/lib/i18n";

export const meta: Route.MetaFunction = ({ data }) => [
  { title: t("profile.meta.title", data?.locale ?? "fr") },
  { name: "robots", content: "noindex" },
];

export async function loader({ request }: Route.LoaderArgs) {
  if (import.meta.env.VITE_PRELAUNCH_MODE === "true") {
    return redirect("/");
  }
  const locale = localeFromAcceptLanguage(
    request.headers.get("Accept-Language"),
  );
  const token = await getServerToken(request);
  const signInRedirect = () => {
    const url = new URL(request.url);
    return redirect(
      `/sign-in?redirect_url=${encodeURIComponent(url.pathname + url.search)}`,
    );
  };
  if (!token) return signInRedirect();
  try {
    const me = await serverFetch<UserMe>("/me", { token });
    return { me, locale };
  } catch (error) {
    if (error instanceof ServerApiError && error.status === 401) {
      return signInRedirect();
    }
    throw error;
  }
}

export default function ProfileRoute({ loaderData }: Route.ComponentProps) {
  const tr = useT();
  const { me } = loaderData;
  const initials = me.display_name
    .split(/\s+/)
    .map((s) => s[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const yesNo = (value: boolean) =>
    value ? tr("common.yes") : tr("common.no");

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-12 md:px-8">
      <div className="flex items-center gap-5">
        <Avatar className="size-20">
          {me.avatar_url ? (
            <AvatarImage src={me.avatar_url} alt={me.display_name} />
          ) : null}
          <AvatarFallback>{initials || "?"}</AvatarFallback>
        </Avatar>
        <div>
          <h1 className="font-infoma text-3xl text-ganitel-text-title">
            {me.display_name}
          </h1>
          <p className="text-sm text-ganitel-text-subtitle">
            {me.email ?? me.phone ?? tr("common.dash")}
          </p>
        </div>
      </div>

      <dl className="mt-10 grid grid-cols-1 gap-y-4 text-sm md:grid-cols-2">
        <div>
          <dt className="text-xs uppercase tracking-wide text-ganitel-text-subtitle">
            {tr("profile.label.status")}
          </dt>
          <dd className="mt-1 capitalize text-ganitel-text-title">
            {me.status}
          </dd>
        </div>
        <div>
          <dt className="text-xs uppercase tracking-wide text-ganitel-text-subtitle">
            {tr("profile.label.language")}
          </dt>
          <dd className="mt-1 uppercase text-ganitel-text-title">
            {me.language}
          </dd>
        </div>
        <div>
          <dt className="text-xs uppercase tracking-wide text-ganitel-text-subtitle">
            {tr("profile.label.host")}
          </dt>
          <dd className="mt-1 text-ganitel-text-title">{yesNo(me.is_host)}</dd>
        </div>
        <div>
          <dt className="text-xs uppercase tracking-wide text-ganitel-text-subtitle">
            {tr("profile.label.admin")}
          </dt>
          <dd className="mt-1 text-ganitel-text-title">{yesNo(me.is_admin)}</dd>
        </div>
      </dl>
    </div>
  );
}

export function ErrorBoundary() {
  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-12 md:px-8">
      <ErrorState />
    </div>
  );
}
