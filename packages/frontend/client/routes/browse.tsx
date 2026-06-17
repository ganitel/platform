import {
  Link,
  useNavigate,
  useNavigation,
  useSearchParams,
} from "react-router";
import type { ReactNode } from "react";

import type { Route } from "./+types/browse";

import {
  PropertyGrid,
  PropertyGridSkeleton,
} from "@/features/properties/components/property-grid";
import { ExperienceGrid } from "@/features/experiences/components/experience-grid";
import { SearchBar } from "@/features/properties/components/search-bar";
import { ErrorState } from "@/shared/components/error-state";
import {
  type Locale,
  localeFromAcceptLanguage,
  t as translate,
  useT,
  type TranslationKey,
} from "@/shared/lib/i18n";
import { cn } from "@/shared/lib/cn";
import { serverFetch } from "@/shared/api/server";
import { PUBLIC_HTML_CACHE } from "@/shared/lib/cache";
import { seo } from "@/shared/lib/seo";
import { PageHeader } from "@/shared/ui/page-header";
import type { PropertyPublic, SearchOut } from "@/features/properties/types";
import type {
  ExperiencePublic,
  ExperienceSearchOut,
} from "@/features/experiences/types";

export const headers: Route.HeadersFunction = () => ({
  "Cache-Control": PUBLIC_HTML_CACHE,
});

type BrowseKind = "stays" | "experiences";

function parseKind(value: string | null): BrowseKind {
  return value === "stays" ? "stays" : "experiences";
}

const TITLE_KEY: Record<BrowseKind, TranslationKey> = {
  stays: "browse.tabs.stays",
  experiences: "browse.tabs.experiences",
};

const LEDE_KEY: Record<BrowseKind, TranslationKey> = {
  stays: "browse.lede.stays",
  experiences: "browse.lede.experiences",
};

const EMPTY_KEY: Record<BrowseKind, TranslationKey> = {
  stays: "browse.empty.stays",
  experiences: "browse.empty.experiences",
};

export const meta: Route.MetaFunction = ({ location, data }) => {
  const locale = data?.locale ?? "fr";
  const params = new URLSearchParams(location.search);
  const kind = parseKind(params.get("kind"));
  const q = params.get("q");
  const section = translate(
    kind === "experiences"
      ? "browse.section.experiences"
      : "browse.section.stays",
    locale,
  );
  const title = q ? `${section} « ${q} » — Ganitel` : `${section} — Ganitel`;
  const description = translate(
    kind === "experiences"
      ? "browse.meta.description.experiences"
      : "browse.meta.description.stays",
    locale,
  );
  const ogPath = kind === "stays" ? "/og/stays.png" : "/og/experiences.png";
  const pathname = `/browse${kind === "stays" ? "?kind=stays" : ""}`;
  return seo({
    title,
    description,
    pathname,
    locale,
    ogImage: { url: ogPath, alt: title },
  });
};

type StaysData = {
  kind: "stays";
  q: string | null;
  items: PropertyPublic[];
  total: number;
  locale: Locale;
};

type ExperiencesData = {
  kind: "experiences";
  q: string | null;
  items: ExperiencePublic[];
  total: number;
  locale: Locale;
};

type LoaderData = StaysData | ExperiencesData;

export async function loader({
  request,
}: Route.LoaderArgs): Promise<LoaderData> {
  const url = new URL(request.url);
  const kind = parseKind(url.searchParams.get("kind"));
  const locale = localeFromAcceptLanguage(
    request.headers.get("Accept-Language"),
  );
  const params = new URLSearchParams();
  const q = url.searchParams.get("q");
  if (q) params.set("q", q);
  params.set("limit", "24");

  if (kind === "experiences") {
    const data = await serverFetch<ExperienceSearchOut>(
      `/experiences?${params.toString()}`,
    );
    return { kind, q, items: data.items, total: data.total, locale };
  }

  const data = await serverFetch<SearchOut>(`/properties?${params.toString()}`);
  return { kind, q, items: data.items, total: data.total, locale };
}

export default function BrowseRoute({ loaderData }: Route.ComponentProps) {
  const { kind, q } = loaderData;
  const t = useT();
  const navigate = useNavigate();
  const navigation = useNavigation();
  const [searchParams] = useSearchParams();

  // The tab header flips as soon as the user taps, while the grid shows a
  // skeleton until the loader lands — on slow connections the tap must
  // respond instantly even though the data takes a while.
  const pendingKind =
    navigation.location?.pathname === "/browse"
      ? parseKind(new URLSearchParams(navigation.location.search).get("kind"))
      : null;
  const activeKind = pendingKind ?? kind;
  const switching = pendingKind !== null && pendingKind !== kind;

  const handleSearch = (next: string) => {
    const nextParams = new URLSearchParams(searchParams);
    if (next) nextParams.set("q", next);
    else nextParams.delete("q");
    navigate(`/browse?${nextParams.toString()}`, { replace: true });
  };

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-12 md:px-8 md:py-20">
      <PageHeader
        eyebrow={t("nav.browse")}
        title={t(TITLE_KEY[activeKind])}
        description={t(LEDE_KEY[activeKind])}
      />

      <BrowseTabs kind={activeKind} q={q} />

      <div className="mb-12 max-w-3xl md:mb-16">
        <SearchBar initialQuery={q ?? ""} onSubmit={handleSearch} />
      </div>

      {switching ? (
        <PropertyGridSkeleton count={6} />
      ) : loaderData.items.length === 0 ? (
        <p className="py-16 text-center text-sm text-ganitel-text-subtitle">
          {t(EMPTY_KEY[kind])}
        </p>
      ) : loaderData.kind === "stays" ? (
        <PropertyGrid items={loaderData.items} />
      ) : (
        <ExperienceGrid items={loaderData.items} />
      )}
    </div>
  );
}

function BrowseTabs({ kind, q }: { kind: BrowseKind; q: string | null }) {
  const t = useT();

  const hrefFor = (target: BrowseKind): string => {
    const params = new URLSearchParams();
    if (target === "stays") params.set("kind", "stays");
    if (q) params.set("q", q);
    const qs = params.toString();
    return qs ? `/browse?${qs}` : "/browse";
  };

  return (
    <nav
      aria-label={t("nav.browse")}
      className="-mx-4 mb-10 flex border-b border-ganitel-stroke-neutral px-1 md:mx-0 md:mb-12 md:gap-8 md:px-0"
    >
      <BrowseTab to={hrefFor("experiences")} active={kind === "experiences"}>
        {t("browse.tabs.experiences")}
      </BrowseTab>
      <BrowseTab to={hrefFor("stays")} active={kind === "stays"}>
        {t("browse.tabs.stays")}
      </BrowseTab>
    </nav>
  );
}

function BrowseTab({
  to,
  active,
  children,
}: {
  to: string;
  active: boolean;
  children: ReactNode;
}) {
  return (
    <Link
      to={to}
      prefetch="intent"
      aria-current={active ? "page" : undefined}
      className={cn(
        "relative -mb-px flex min-h-12 touch-manipulation select-none items-center rounded-t-xl px-3 text-[15px] transition-colors duration-150 active:bg-ganitel-surface-2/70 md:min-h-0 md:rounded-none md:px-0 md:pb-3 md:text-sm md:active:bg-transparent",
        active
          ? "font-medium text-ganitel-text-title"
          : "font-medium text-ganitel-text-subtitle hover:text-ganitel-text-title",
      )}
    >
      {children}
      <span
        aria-hidden
        className={cn(
          "absolute inset-x-3 -bottom-px h-[2px] origin-left rounded-full bg-ganitel-rule transition-transform duration-200 md:inset-x-0",
          active ? "scale-x-100" : "scale-x-0",
        )}
      />
    </Link>
  );
}

export function HydrateFallback() {
  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-12 md:px-8 md:py-20">
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
