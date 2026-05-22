import type { Route } from "./+types/privacy";

import { Privacy } from "@/features/legal/privacy";
import { PUBLIC_CDN_CACHE_LONG } from "@/shared/lib/cache";
import { localeFromAcceptLanguage, t as translate } from "@/shared/lib/i18n";
import { seo } from "@/shared/lib/seo";

export const headers: Route.HeadersFunction = () => ({
  "Cache-Control": PUBLIC_CDN_CACHE_LONG,
});

export const meta: Route.MetaFunction = ({ data }) => {
  const locale = data?.locale ?? "fr";
  return seo({
    title: translate("privacy.meta.title", locale),
    description: translate("privacy.meta.description", locale),
    pathname: "/privacy",
    locale,
    alternates: { fr: "/privacy", en: "/privacy" },
  });
};

export function loader({ request }: Route.LoaderArgs) {
  const locale = localeFromAcceptLanguage(
    request.headers.get("Accept-Language"),
  );
  return { locale };
}

export default function PrivacyRoute() {
  return <Privacy />;
}
