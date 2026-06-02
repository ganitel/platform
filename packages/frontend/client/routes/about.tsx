import type { Route } from "./+types/about";

import { About } from "@/features/about/about";
import { listTeamMembersServer } from "@/features/about/api";
import type { TeamMember } from "@/features/about/types";
import { PUBLIC_HTML_CACHE } from "@/shared/lib/cache";
import { localeFromAcceptLanguage } from "@/shared/lib/i18n";
import { seo } from "@/shared/lib/seo";

export const headers: Route.HeadersFunction = () => ({
  "Cache-Control": PUBLIC_HTML_CACHE,
});

const META = {
  fr: {
    title: "À propos — ganitel",
    description:
      "Nous aimons le Cameroun et sa diversité. Des séjours et expériences sur mesure, conçus pour faire ressentir chaque recoin du pays.",
  },
  en: {
    title: "About — ganitel",
    description:
      "We love Cameroon and its diversity. Custom stays and experiences crafted to make you feel every corner of the country.",
  },
} as const;

export const meta: Route.MetaFunction = ({ data }) => {
  const locale = data?.locale ?? "fr";
  const { title, description } = META[locale];
  return seo({
    title,
    description,
    pathname: "/about",
    locale,
    ogImage: { url: "/og/about.png", alt: title },
    alternates: { fr: "/about", en: "/about" },
  });
};

export async function loader({ request }: Route.LoaderArgs) {
  const locale = localeFromAcceptLanguage(
    request.headers.get("Accept-Language"),
  );
  try {
    const team = await listTeamMembersServer();
    return { team, locale };
  } catch {
    return { team: [] as TeamMember[], locale };
  }
}

export default function AboutRoute({ loaderData }: Route.ComponentProps) {
  return <About team={loaderData.team} />;
}
