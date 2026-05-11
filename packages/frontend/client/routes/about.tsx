import type { Route } from "./+types/about";

import { About } from "@/features/about/about";
import { listTeamMembersServer } from "@/features/about/api";
import type { TeamMember } from "@/features/about/types";

export const meta: Route.MetaFunction = () => {
  const title = "À propos — Ganitel";
  const description =
    "Nous aimons le Cameroun et sa diversité. Des séjours et expériences sur mesure, conçus pour faire ressentir chaque recoin du pays.";
  return [
    { title },
    { name: "description", content: description },
    { property: "og:title", content: title },
    { property: "og:description", content: description },
    { property: "og:type", content: "website" },
  ];
};

export async function loader() {
  try {
    const team = await listTeamMembersServer();
    return { team };
  } catch {
    return { team: [] as TeamMember[] };
  }
}

export default function AboutRoute({ loaderData }: Route.ComponentProps) {
  return <About team={loaderData.team} />;
}
