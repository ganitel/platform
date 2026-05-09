import { Link, useNavigate, useSearchParams } from "react-router";
import { motion } from "framer-motion";
import type { ReactNode } from "react";

import type { Route } from "./+types/browse";

import {
  PropertyGrid,
  PropertyGridSkeleton,
} from "@/features/properties/components/property-grid";
import { ExperienceGrid } from "@/features/experiences/components/experience-grid";
import { SearchBar } from "@/features/properties/components/search-bar";
import { ErrorState } from "@/shared/components/error-state";
import { useT, type TranslationKey } from "@/shared/lib/i18n";
import { cn } from "@/shared/lib/cn";
import { serverFetch } from "@/shared/api/server";
import { SectionHeader } from "@/shared/ui/section-header";
import type { PropertyPublic, SearchOut } from "@/features/properties/types";
import type {
  ExperiencePublic,
  ExperienceSearchOut,
} from "@/features/experiences/types";

type BrowseKind = "stays" | "experiences";

function parseKind(value: string | null): BrowseKind {
  return value === "experiences" ? "experiences" : "stays";
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

export const meta: Route.MetaFunction = ({ location }) => {
  const params = new URLSearchParams(location.search);
  const kind = parseKind(params.get("kind"));
  const q = params.get("q");
  const sectionFR = kind === "experiences" ? "Expériences" : "Logements";
  const sectionEN = kind === "experiences" ? "Experiences" : "Stays";
  const title = q
    ? `${sectionFR} pour « ${q} » — Ganitel`
    : `${sectionFR} — Ganitel`;
  const description =
    kind === "experiences"
      ? "Expériences à vivre au Cameroun, au Sénégal et en Côte d'Ivoire autour de nos logements ou en escapade."
      : "Logements soigneusement sélectionnés à Douala, Yaoundé, Dakar, Abidjan et plus.";
  return [
    { title },
    { name: "description", content: description },
    { property: "og:title", content: title },
    { property: "og:description", content: description },
    { property: "og:type", content: "website" },
    { name: "x-section-en", content: sectionEN },
  ];
};

type StaysData = {
  kind: "stays";
  q: string | null;
  items: PropertyPublic[];
  total: number;
};

type ExperiencesData = {
  kind: "experiences";
  q: string | null;
  items: ExperiencePublic[];
  total: number;
};

type LoaderData = StaysData | ExperiencesData;

export async function loader({
  request,
}: Route.LoaderArgs): Promise<LoaderData> {
  const url = new URL(request.url);
  const kind = parseKind(url.searchParams.get("kind"));
  const params = new URLSearchParams();
  const q = url.searchParams.get("q");
  if (q) params.set("q", q);
  params.set("limit", "24");

  if (kind === "experiences") {
    try {
      const data = await serverFetch<ExperienceSearchOut>(
        `/experiences?${params.toString()}`,
      );
      return { kind, q, items: data.items, total: data.total };
    } catch {
      return { kind, q, items: [], total: 0 };
    }
  }

  try {
    const data = await serverFetch<SearchOut>(
      `/properties?${params.toString()}`,
    );
    return { kind, q, items: data.items, total: data.total };
  } catch {
    return { kind, q, items: [], total: 0 };
  }
}

export default function BrowseRoute({ loaderData }: Route.ComponentProps) {
  const { kind, q } = loaderData;
  const t = useT();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const handleSearch = (next: string) => {
    const nextParams = new URLSearchParams(searchParams);
    if (next) nextParams.set("q", next);
    else nextParams.delete("q");
    navigate(`/browse?${nextParams.toString()}`, { replace: true });
  };

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-12 md:px-8 md:py-20">
      <SectionHeader
        level="h1"
        tag={t("nav.browse")}
        title={t(TITLE_KEY[kind])}
        lede={t(LEDE_KEY[kind])}
        animate={false}
        className="mb-10 md:mb-14"
      />

      <BrowseTabs kind={kind} q={q} />

      <div className="mb-12 max-w-3xl md:mb-16">
        <SearchBar initialQuery={q ?? ""} onSubmit={handleSearch} />
      </div>

      {loaderData.items.length === 0 ? (
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
    if (target === "experiences") params.set("kind", "experiences");
    if (q) params.set("q", q);
    const qs = params.toString();
    return qs ? `/browse?${qs}` : "/browse";
  };

  return (
    <div className="mb-10 flex flex-wrap items-center gap-x-8 border-b border-ganitel-stroke-neutral md:mb-12">
      <BrowseTab to={hrefFor("stays")} active={kind === "stays"}>
        {t("browse.tabs.stays")}
      </BrowseTab>
      <BrowseTab to={hrefFor("experiences")} active={kind === "experiences"}>
        {t("browse.tabs.experiences")}
      </BrowseTab>
    </div>
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
      className={cn(
        "font-display relative pb-3 pt-2 text-[15px] tracking-tight transition-colors duration-200",
        active
          ? "font-semibold text-ganitel-text-title"
          : "font-medium text-ganitel-text-placeholder hover:text-ganitel-text-title",
      )}
    >
      {children}
      {active ? (
        <motion.span
          layoutId="browse-tab-underline"
          aria-hidden
          className="absolute inset-x-0 -bottom-px h-0.5 bg-ganitel-text-title"
          transition={{ type: "spring", stiffness: 380, damping: 32 }}
        />
      ) : null}
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
