import { useNavigate, useSearchParams } from "react-router";

import type { Route } from "./+types/_index";

import {
  PropertyGrid,
  PropertyGridSkeleton,
} from "@/features/properties/components/property-grid";
import { SearchBar } from "@/features/properties/components/search-bar";
import { ErrorState } from "@/shared/components/error-state";
import { useT } from "@/shared/lib/i18n";
import { serverFetch } from "@/shared/api/server";
import type { SearchOut } from "@/features/properties/types";

export const meta: Route.MetaFunction = ({ location }) => {
  const params = new URLSearchParams(location.search);
  const q = params.get("q");
  const title = q
    ? `Logements pour « ${q} » — Ganitel`
    : "Ganitel — séjours et expériences en Afrique centrale";
  const description = q
    ? `Trouvez des logements pour « ${q} » à Douala, Yaoundé, Dakar, Abidjan et plus.`
    : "Séjours et expériences soigneusement sélectionnés à travers le Cameroun, le Sénégal et la Côte d'Ivoire.";
  return [
    { title },
    { name: "description", content: description },
    { property: "og:title", content: title },
    { property: "og:description", content: description },
    { property: "og:type", content: "website" },
  ];
};

export async function loader({ request }: Route.LoaderArgs) {
  const url = new URL(request.url);
  const params = new URLSearchParams();
  const q = url.searchParams.get("q");
  if (q) params.set("q", q);
  params.set("limit", "24");

  const data = await serverFetch<SearchOut>(`/properties?${params.toString()}`);
  return { search: data, q };
}

export default function BrowseRoute({ loaderData }: Route.ComponentProps) {
  const { search, q } = loaderData;
  const t = useT();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const handleSearch = (next: string) => {
    const nextParams = new URLSearchParams(searchParams);
    if (next) nextParams.set("q", next);
    else nextParams.delete("q");
    navigate(`/?${nextParams.toString()}`, { replace: true });
  };

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8 md:px-8 md:py-12">
      <header className="mb-8 flex flex-col gap-3">
        <p className="text-xs uppercase tracking-[0.2em] text-ganitel-secondary">
          Ganitel
        </p>
        <h1 className="font-infoma text-4xl text-ganitel-text-title md:text-5xl">
          {t("browse.title")}
        </h1>
        <p className="max-w-xl text-sm text-ganitel-text-subtitle">
          {t("browse.subtitle")}
        </p>
      </header>

      <div className="mb-10 max-w-3xl">
        <SearchBar initialQuery={q ?? ""} onSubmit={handleSearch} />
      </div>

      {search.items.length === 0 ? (
        <p className="py-16 text-center text-sm text-ganitel-text-subtitle">
          {t("browse.empty")}
        </p>
      ) : (
        <PropertyGrid items={search.items} />
      )}
    </div>
  );
}

export function HydrateFallback() {
  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8 md:px-8 md:py-12">
      <PropertyGridSkeleton />
    </div>
  );
}

export function ErrorBoundary() {
  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-12 md:px-8">
      <ErrorState />
    </div>
  );
}
