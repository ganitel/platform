import type { Route } from "./+types/about";

import { About } from "@/features/about/about";
import { listTeamMembersServer } from "@/features/about/api";
import type { TeamMember } from "@/features/about/types";
import { localeFromAcceptLanguage } from "@/shared/lib/i18n";

const META = {
  fr: {
    title: "À propos — Ganitel",
    description:
      "Nous aimons le Cameroun et sa diversité. Des séjours et expériences sur mesure, conçus pour faire ressentir chaque recoin du pays.",
  },
  en: {
    title: "About — Ganitel",
    description:
      "We love Cameroon and its diversity. Custom stays and experiences crafted to make you feel every corner of the country.",
  },
} as const;

export const meta: Route.MetaFunction = ({ data }) => {
  const { title, description } = META[data?.locale ?? "fr"];
  return [
    { title },
    { name: "description", content: description },
    { property: "og:title", content: title },
    { property: "og:description", content: description },
    { property: "og:type", content: "website" },
  ];
};

export async function loader({ request }: Route.LoaderArgs) {
  const locale = localeFromAcceptLanguage(request.headers.get("Accept-Language"));
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
