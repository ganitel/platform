import type { Route } from "./+types/_index";

import { Landing } from "@/features/landing/landing";
import { serverFetch } from "@/shared/api/server";
import { seo } from "@/shared/lib/seo";
import type { PropertyPublic, SearchOut } from "@/features/properties/types";

export const meta: Route.MetaFunction = () =>
  seo({
    title: "Ganitel — Là où la lumière prend son temps",
    description:
      "Logements et expériences soigneusement sélectionnés au Cameroun, au Sénégal et en Côte d'Ivoire.",
    pathname: "/",
    ogImage: {
      url: "/og/default.png",
      alt: "Ganitel — Là où la lumière prend son temps",
    },
    alternates: { fr: "/", en: "/" },
  });

export async function loader() {
  // Marketing page keeps rendering if the catalog API is unreachable; the
  // featured grid is decorative, not load-bearing for the pitch.
  try {
    const data = await serverFetch<SearchOut>("/properties?limit=8");
    return { items: data.items };
  } catch {
    return { items: [] as PropertyPublic[] };
  }
}

export default function IndexRoute({ loaderData }: Route.ComponentProps) {
  return <Landing items={loaderData.items} />;
}
