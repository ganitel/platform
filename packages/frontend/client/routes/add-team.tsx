import type { Route } from "./+types/add-team";

import { AddTeamForm } from "@/features/team/add-team-form";
import { localeFromAcceptLanguage, t } from "@/shared/lib/i18n";

export async function loader({ request }: Route.LoaderArgs) {
  return {
    locale: localeFromAcceptLanguage(request.headers.get("Accept-Language")),
  };
}

export const meta: Route.MetaFunction = ({ data }) => [
  { title: t("add_team.meta.title", data?.locale ?? "fr") },
  { name: "robots", content: "noindex" },
];

export default function AddTeamRoute() {
  return <AddTeamForm />;
}
