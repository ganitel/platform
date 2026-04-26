import type { Route } from "./+types/_index";

import { Landing } from "@/features/landing/landing";

export const meta: Route.MetaFunction = () => {
  const title = "Ganitel — Là où la lumière prend son temps";
  const description =
    "Logements et expériences soigneusement sélectionnés au Cameroun, au Sénégal et en Côte d'Ivoire.";
  return [
    { title },
    { name: "description", content: description },
    { property: "og:title", content: title },
    { property: "og:description", content: description },
    { property: "og:type", content: "website" },
  ];
};

export default function IndexRoute() {
  return <Landing />;
}
