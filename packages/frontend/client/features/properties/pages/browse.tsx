import { useSearchParams } from "react-router-dom";
import { useMemo } from "react";

import { useSearchProperties } from "@/features/properties/hooks";
import {
  PropertyGrid,
  PropertyGridSkeleton,
} from "@/features/properties/components/property-grid";
import { SearchBar } from "@/features/properties/components/search-bar";
import { ErrorState } from "@/shared/components/error-state";
import { useT } from "@/shared/lib/i18n";
import type { SearchFilters } from "@/features/properties/types";

export function BrowsePage() {
  const t = useT();
  const [searchParams, setSearchParams] = useSearchParams();
  const q = searchParams.get("q") ?? "";

  const filters = useMemo<SearchFilters>(
    () => ({ q: q || undefined, limit: 24 }),
    [q],
  );

  const { data, isLoading, isError, refetch } = useSearchProperties(filters);

  const handleSearch = (next: string) => {
    const params = new URLSearchParams(searchParams);
    if (next) params.set("q", next);
    else params.delete("q");
    setSearchParams(params, { replace: true });
  };

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8 md:px-8 md:py-12">
      <header className="mb-8 flex flex-col gap-3">
        <p className="text-xs uppercase tracking-[0.2em] text-ganitel-secondary">Ganitel</p>
        <h1 className="font-infoma text-4xl text-ganitel-text-title md:text-5xl">
          {t("browse.title")}
        </h1>
        <p className="max-w-xl text-sm text-ganitel-text-subtitle">{t("browse.subtitle")}</p>
      </header>

      <div className="mb-10 max-w-3xl">
        <SearchBar initialQuery={q} onSubmit={handleSearch} />
      </div>

      {isLoading ? <PropertyGridSkeleton /> : null}

      {isError ? <ErrorState onRetry={() => refetch()} /> : null}

      {!isLoading && !isError && data ? (
        data.items.length === 0 ? (
          <p className="py-16 text-center text-sm text-ganitel-text-subtitle">
            {t("browse.empty")}
          </p>
        ) : (
          <PropertyGrid items={data.items} />
        )
      ) : null}
    </div>
  );
}
