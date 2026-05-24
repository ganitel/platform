import type { Route } from "./+types/_index";

import { Landing } from "@/features/landing/landing";
import { PUBLIC_CDN_CACHE_LONG } from "@/shared/lib/cache";
import { localeFromAcceptLanguage, t } from "@/shared/lib/i18n";
import { seo } from "@/shared/lib/seo";

export const headers: Route.HeadersFunction = () => ({
  "Cache-Control": PUBLIC_CDN_CACHE_LONG,
});

export const meta: Route.MetaFunction = ({ data }) => {
  const locale = data?.locale ?? "fr";
  const title = t("index.meta.title", locale);
  return seo({
    title,
    description: t("index.meta.description", locale),
    pathname: "/",
    locale,
    ogImage: {
      url: "/og/default.png",
      alt: title,
    },
    alternates: { fr: "/", en: "/" },
  });
};

export async function loader({ request }: Route.LoaderArgs) {
  const locale = localeFromAcceptLanguage(
    request.headers.get("Accept-Language"),
  );
  return { locale };
}

export default function IndexRoute() {
  return <Landing />;
}
