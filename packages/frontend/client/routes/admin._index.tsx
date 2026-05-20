import { useQuery } from "@tanstack/react-query";
import {
  ArrowUpRight,
  Compass,
  Eye,
  EyeOff,
  FileText,
  Home,
  Trash2,
} from "lucide-react";
import { Link } from "react-router";

import { AdminShell } from "@/features/admin/admin-shell";
import { listAdminExperiences } from "@/features/experiences/api";
import type { ExperienceStatus } from "@/features/experiences/types";
import { listAdminProperties } from "@/features/properties/api";
import type { PropertyStatus } from "@/features/properties/types";
import { AdminGuard } from "@/shared/components/admin-guard";
import { cn } from "@/shared/lib/cn";
import { t, useT, type TranslationKey } from "@/shared/lib/i18n";
import type { Route } from "./+types/admin._index";

export const meta: Route.MetaFunction = () => [
  { title: t("admin.meta.dashboard", "fr") },
  { name: "robots", content: "noindex" },
];

export default function AdminIndexRoute() {
  return (
    <AdminGuard>
      <AdminIndexPage />
    </AdminGuard>
  );
}

function AdminIndexPage() {
  const tr = useT();
  return (
    <AdminShell
      eyebrow={tr("admin.dashboard.eyebrow")}
      title={tr("admin.dashboard.title")}
      description={tr("admin.dashboard.description")}
    >
      <StatsRow />
      <SectionsGrid />
    </AdminShell>
  );
}

type StatusCounts = Record<
  "draft" | "published" | "unlisted" | "removed",
  number
>;

function emptyCounts(): StatusCounts {
  return { draft: 0, published: 0, unlisted: 0, removed: 0 };
}

function StatsRow() {
  const tr = useT();
  const rentals = useQuery({
    queryKey: ["admin", "rentals", "summary"],
    queryFn: () => listAdminProperties({ limit: 200, offset: 0 }),
  });
  const experiences = useQuery({
    queryKey: ["admin", "experiences", "summary"],
    queryFn: () => listAdminExperiences({ limit: 200, offset: 0 }),
  });

  const rentalCounts = countByStatus<PropertyStatus>(rentals.data?.items);
  const experienceCounts = countByStatus<ExperienceStatus>(
    experiences.data?.items,
  );
  const combined: StatusCounts = {
    draft: rentalCounts.draft + experienceCounts.draft,
    published: rentalCounts.published + experienceCounts.published,
    unlisted: rentalCounts.unlisted + experienceCounts.unlisted,
    removed: rentalCounts.removed + experienceCounts.removed,
  };

  const loading = rentals.isPending || experiences.isPending;
  const totalCatalog =
    (rentals.data?.total ?? 0) + (experiences.data?.total ?? 0);

  return (
    <section className="mb-10 grid grid-cols-2 gap-3 lg:grid-cols-4">
      <StatCard
        label={tr("admin.stats.catalog")}
        value={totalCatalog}
        sub={tr("admin.stats.catalog_sub")}
        loading={loading}
        accent="primary"
      />
      <StatCard
        label={tr("admin.stats.published")}
        value={combined.published}
        sub={tr("admin.stats.published_sub")}
        loading={loading}
        accent="moss"
        icon={<Eye className="size-3.5" strokeWidth={1.75} />}
      />
      <StatCard
        label={tr("admin.stats.drafts")}
        value={combined.draft}
        sub={tr("admin.stats.drafts_sub")}
        loading={loading}
        accent="warm"
        icon={<FileText className="size-3.5" strokeWidth={1.75} />}
      />
      <StatCard
        label={tr("admin.stats.unlisted")}
        value={combined.unlisted}
        sub={tr("admin.stats.unlisted_sub")}
        loading={loading}
        accent="neutral"
        icon={<EyeOff className="size-3.5" strokeWidth={1.75} />}
      />
    </section>
  );
}

type Accent = "primary" | "moss" | "warm" | "neutral";

const ACCENT_CARD: Record<Accent, string> = {
  primary: "bg-ganitel-primary text-ganitel-paper border-transparent",
  moss: "bg-ganitel-accent-green text-ganitel-moss border-ganitel-moss/15",
  warm: "bg-ganitel-paper-warm text-ganitel-text-title border-ganitel-secondary/20",
  neutral:
    "bg-ganitel-background-secondary text-ganitel-text-title border-ganitel-stroke-neutral",
};

const ACCENT_SUB: Record<Accent, string> = {
  primary: "text-ganitel-paper/60",
  moss: "text-ganitel-moss/70",
  warm: "text-ganitel-text-subtitle",
  neutral: "text-ganitel-text-placeholder",
};

function StatCard({
  label,
  value,
  sub,
  loading,
  accent,
  icon,
}: {
  label: string;
  value: number;
  sub: string;
  loading: boolean;
  accent: Accent;
  icon?: React.ReactNode;
}) {
  return (
    <article
      className={cn(
        "relative flex flex-col gap-2 overflow-hidden rounded-3xl border p-5 shadow-[0_30px_60px_-50px_rgba(24,16,12,0.25)]",
        ACCENT_CARD[accent],
      )}
    >
      <div className="flex items-center gap-2">
        {icon ? (
          <span className="inline-flex size-6 items-center justify-center rounded-full bg-white/15">
            {icon}
          </span>
        ) : null}
        <span className="text-[10px] font-semibold uppercase tracking-[0.22em] opacity-80">
          {label}
        </span>
      </div>
      <p className="font-display text-4xl leading-none tabular-nums">
        {loading ? <span className="opacity-30">—</span> : value}
      </p>
      <p className={cn("text-xs", ACCENT_SUB[accent])}>{sub}</p>
    </article>
  );
}

function SectionsGrid() {
  const tr = useT();
  const rentals = useQuery({
    queryKey: ["admin", "rentals", "summary"],
    queryFn: () => listAdminProperties({ limit: 200, offset: 0 }),
  });
  const experiences = useQuery({
    queryKey: ["admin", "experiences", "summary"],
    queryFn: () => listAdminExperiences({ limit: 200, offset: 0 }),
  });

  const rentalCounts = countByStatus<PropertyStatus>(rentals.data?.items);
  const experienceCounts = countByStatus<ExperienceStatus>(
    experiences.data?.items,
  );

  return (
    <section className="grid grid-cols-1 gap-5 md:grid-cols-2">
      <SectionCard
        to="/admin/rentals"
        eyebrow={tr("admin.section.rentals.eyebrow")}
        title={tr("admin.section.rentals.title")}
        description={tr("admin.section.rentals.description")}
        icon={<Home className="size-5" strokeWidth={1.5} />}
        total={rentals.data?.total ?? 0}
        counts={rentalCounts}
        loading={rentals.isPending}
      />
      <SectionCard
        to="/admin/experiences"
        eyebrow={tr("admin.section.experiences.eyebrow")}
        title={tr("admin.section.experiences.title")}
        description={tr("admin.section.experiences.description")}
        icon={<Compass className="size-5" strokeWidth={1.5} />}
        total={experiences.data?.total ?? 0}
        counts={experienceCounts}
        loading={experiences.isPending}
      />
    </section>
  );
}

function SectionCard({
  to,
  eyebrow,
  title,
  description,
  icon,
  total,
  counts,
  loading,
}: {
  to: string;
  eyebrow: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  total: number;
  counts: StatusCounts;
  loading: boolean;
}) {
  return (
    <Link
      to={to}
      className="group relative flex flex-col gap-5 overflow-hidden rounded-3xl border border-ganitel-stroke-neutral bg-ganitel-background-secondary p-6 shadow-[0_30px_60px_-50px_rgba(24,16,12,0.25)] transition hover:-translate-y-0.5 hover:shadow-[0_30px_60px_-30px_rgba(24,16,12,0.3)]"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="inline-flex size-10 items-center justify-center rounded-2xl bg-ganitel-paper-warm text-ganitel-primary">
            {icon}
          </span>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-ganitel-secondary">
              {eyebrow}
            </p>
            <h2 className="font-display text-2xl leading-tight text-ganitel-text-title">
              {title}
            </h2>
          </div>
        </div>
        <ArrowUpRight
          className="size-5 shrink-0 text-ganitel-text-placeholder transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-ganitel-text-title"
          strokeWidth={1.5}
        />
      </div>

      <p className="text-sm leading-relaxed text-ganitel-text-subtitle">
        {description}
      </p>

      <dl className="grid grid-cols-4 gap-3 border-t border-ganitel-stroke-neutral pt-5">
        <Stat
          labelKey="admin.section.total"
          value={loading ? null : total}
          accent="primary"
        />
        <Stat
          labelKey="admin.section.published"
          value={loading ? null : counts.published}
          accent="moss"
        />
        <Stat
          labelKey="admin.section.drafts"
          value={loading ? null : counts.draft}
          accent="warm"
        />
        <Stat
          labelKey="admin.section.hidden"
          value={loading ? null : counts.unlisted + counts.removed}
          accent="neutral"
          icon={<Trash2 className="size-3" strokeWidth={1.75} />}
        />
      </dl>
    </Link>
  );
}

function Stat({
  labelKey,
  value,
  accent,
  icon,
}: {
  labelKey: TranslationKey;
  value: number | null;
  accent: "primary" | "moss" | "warm" | "neutral";
  icon?: React.ReactNode;
}) {
  const tr = useT();
  const dot = {
    primary: "bg-ganitel-primary",
    moss: "bg-ganitel-moss",
    warm: "bg-ganitel-secondary",
    neutral: "bg-ganitel-text-placeholder",
  }[accent];
  return (
    <div className="flex flex-col gap-1">
      <dt className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-ganitel-text-placeholder">
        <span className={cn("size-1.5 rounded-full", dot)} aria-hidden />
        {tr(labelKey)}
        {icon}
      </dt>
      <dd className="font-display text-2xl leading-none tabular-nums text-ganitel-text-title">
        {value === null ? <span className="opacity-30">—</span> : value}
      </dd>
    </div>
  );
}

function countByStatus<T extends string>(
  items: { status: T }[] | undefined,
): StatusCounts {
  const out = emptyCounts();
  if (!items) return out;
  for (const item of items) {
    if (item.status in out) {
      out[item.status as keyof StatusCounts] += 1;
    }
  }
  return out;
}
