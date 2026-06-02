import type { Route } from "./+types/terms";

import { Terms } from "@/features/legal/terms";
import { PUBLIC_HTML_CACHE_LONG } from "@/shared/lib/cache";
import { localeFromAcceptLanguage, t as translate } from "@/shared/lib/i18n";
import { seo } from "@/shared/lib/seo";

export const headers: Route.HeadersFunction = () => ({
  "Cache-Control": PUBLIC_HTML_CACHE_LONG,
});

export const meta: Route.MetaFunction = ({ data }) => {
  const locale = data?.locale ?? "fr";
  return seo({
    title: translate("terms.meta.title", locale),
    description: translate("terms.meta.description", locale),
    pathname: "/terms",
    locale,
    alternates: { fr: "/terms", en: "/terms" },
  });
};

export function loader({ request }: Route.LoaderArgs) {
  const locale = localeFromAcceptLanguage(
    request.headers.get("Accept-Language"),
  );
  return { locale };
}

export default function TermsRoute() {
  return <Terms />;
}
