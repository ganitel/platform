import type { Route } from "./+types/add-team";

import { AddTeamForm } from "@/features/team/add-team-form";

export const meta: Route.MetaFunction = () => [
  { title: "Rejoindre l'équipe — Ganitel" },
  { name: "robots", content: "noindex" },
];

export default function AddTeamRoute() {
  return <AddTeamForm />;
}
