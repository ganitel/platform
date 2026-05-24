import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Eye, EyeOff, Pencil, Plus, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";

import { AdminShell } from "@/features/admin/admin-shell";
import {
  AdminCell,
  AdminCellTitle,
  AdminPagination,
  AdminRow,
  AdminTable,
  type AdminColumn,
} from "@/features/admin/admin-table";
import {
  ActionButton,
  ActionLink,
  AdminCard,
  EmptyState,
  FilterChip,
  StatusPill,
  useAdminStatusLabel,
} from "@/features/admin/admin-ui";
import { extractPublishIssues } from "@/features/admin/publish-error";
import {
  listAdminProperties,
  publishProperty,
  removeProperty,
  unpublishProperty,
} from "@/features/properties/api";
import type {
  PropertyAdminListItem,
  PropertyStatus,
} from "@/features/properties/types";
import { usePropertyTypeLabel } from "@/features/reference/hooks";
import { AdminGuard } from "@/shared/components/admin-guard";
import { formatPriceAmount } from "@/shared/lib/format";
import { pickPriceForLocale } from "@/shared/lib/price";
import { transformImage } from "@/shared/lib/image";
import { thumbnailUrl } from "@/shared/lib/media";
import {
  localeFromAcceptLanguage,
  t,
  useLocale,
  useT,
} from "@/shared/lib/i18n";
import type { Route } from "./+types/admin.rentals";

export async function loader({ request }: Route.LoaderArgs) {
  return {
    locale: localeFromAcceptLanguage(request.headers.get("Accept-Language")),
  };
}

export const meta: Route.MetaFunction = ({ data }) => [
  { title: t("admin.meta.rentals", data?.locale ?? "fr") },
  { name: "robots", content: "noindex" },
];

const PAGE_SIZE = 50;
const ALL_STATUSES: PropertyStatus[] = [
  "draft",
  "published",
  "unlisted",
  "removed",
];

const adminRentalsKey = (offset: number, statuses: PropertyStatus[]) =>
  ["admin", "rentals", { offset, limit: PAGE_SIZE, statuses }] as const;

export default function AdminRentalsRoute() {
  return (
    <AdminGuard>
      <AdminRentalsPage />
    </AdminGuard>
  );
}

function AdminRentalsPage() {
  const tr = useT();
  const statusLabel = useAdminStatusLabel();
  const [offset, setOffset] = useState(0);
  const [statuses, setStatuses] = useState<PropertyStatus[]>([]);
  const query = useQuery({
    queryKey: adminRentalsKey(offset, statuses),
    queryFn: () =>
      listAdminProperties({
        limit: PAGE_SIZE,
        offset,
        status: statuses.length > 0 ? statuses : undefined,
      }),
  });

  const columns: AdminColumn[] = useMemo(
    () => [
      { key: "title", label: tr("admin.rentals.col.title"), width: "auto" },
      {
        key: "location",
        label: tr("admin.rentals.col.location"),
        width: "180px",
      },
      { key: "type", label: tr("admin.rentals.col.type"), width: "140px" },
      { key: "price", label: tr("admin.rentals.col.price"), width: "160px" },
      { key: "status", label: tr("admin.rentals.col.status"), width: "130px" },
      {
        key: "actions",
        label: tr("admin.rentals.col.actions"),
        width: "320px",
        align: "right",
      },
    ],
    [tr],
  );

  function toggleStatus(s: PropertyStatus) {
    setOffset(0);
    setStatuses((prev) =>
      prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s],
    );
  }

  return (
    <AdminShell
      eyebrow={tr("admin.rentals.eyebrow")}
      title={tr("admin.rentals.title")}
      description={tr("admin.rentals.description")}
      actions={
        <ActionLink
          to="/admin/rentals/new"
          tone="primary"
          icon={<Plus className="size-3.5" strokeWidth={2} />}
        >
          {tr("admin.rentals.add")}
        </ActionLink>
      }
    >
      <div className="mb-6 flex flex-wrap items-center gap-2">
        <span className="mr-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-ganitel-text-placeholder">
          {tr("admin.filter.label")}
        </span>
        {ALL_STATUSES.map((s) => (
          <FilterChip
            key={s}
            status={s}
            active={statuses.includes(s)}
            onClick={() => toggleStatus(s)}
          >
            {statusLabel(s)}
          </FilterChip>
        ))}
        {statuses.length > 0 ? (
          <button
            type="button"
            onClick={() => {
              setOffset(0);
              setStatuses([]);
            }}
            className="ml-1 text-xs font-medium text-ganitel-text-subtitle underline-offset-4 hover:text-ganitel-text-title hover:underline"
          >
            {tr("admin.filter.reset")}
          </button>
        ) : null}
      </div>

      {query.isPending ? (
        <AdminCard>
          <p className="px-6 py-12 text-center text-sm text-ganitel-text-subtitle">
            {tr("admin.state.loading")}
          </p>
        </AdminCard>
      ) : query.isError ? (
        <AdminCard>
          <p className="px-6 py-12 text-center text-sm text-red-600">
            {tr("admin.state.error_prefix")}{" "}
            {query.error instanceof Error
              ? query.error.message
              : String(query.error)}
          </p>
        </AdminCard>
      ) : query.data.total === 0 ? (
        <EmptyState
          title={tr("admin.rentals.empty.title")}
          description={tr("admin.rentals.empty.description")}
          action={
            <ActionLink
              to="/admin/rentals/new"
              tone="primary"
              icon={<Plus className="size-3.5" strokeWidth={2} />}
            >
              {tr("admin.rentals.add")}
            </ActionLink>
          }
        />
      ) : (
        <>
          <AdminTable columns={columns}>
            {query.data.items.map((item) => (
              <RentalRow key={item.id} item={item} />
            ))}
          </AdminTable>
          <AdminPagination
            offset={offset}
            limit={query.data.limit}
            total={query.data.total}
            shown={query.data.items.length}
            onOffsetChange={setOffset}
          />
        </>
      )}
    </AdminShell>
  );
}

function RentalRow({ item }: { item: PropertyAdminListItem }) {
  const tr = useT();
  const locale = useLocale();
  const typeLabel = usePropertyTypeLabel();
  const qc = useQueryClient();
  const invalidate = () =>
    qc.invalidateQueries({ queryKey: ["admin", "rentals"] });

  const publish = useMutation({
    mutationFn: () => publishProperty(item.id),
    onSuccess: invalidate,
  });
  const unpublish = useMutation({
    mutationFn: () => unpublishProperty(item.id),
    onSuccess: invalidate,
  });
  const remove = useMutation({
    mutationFn: () => removeProperty(item.id),
    onSuccess: invalidate,
  });

  const isBusy = publish.isPending || unpublish.isPending || remove.isPending;
  const lastError = publish.error ?? unpublish.error ?? remove.error ?? null;
  const cover = item.cover_media
    ? {
        url: transformImage(thumbnailUrl(item.cover_media), {
          width: 120,
          quality: 70,
        }),
        alt: item.title,
      }
    : null;

  return (
    <AdminRow isBusy={isBusy}>
      <AdminCell>
        <AdminCellTitle title={item.title} cover={cover} />
      </AdminCell>
      <AdminCell>
        <span className="text-ganitel-text-title">{item.city}</span>
        <span className="ml-1 text-ganitel-text-placeholder">
          · {item.country_code}
        </span>
      </AdminCell>
      <AdminCell>
        <span className="inline-flex items-center rounded-full bg-ganitel-neutral-2 px-2.5 py-1 text-xs font-medium text-ganitel-text-subtitle">
          {typeLabel(item.property_type)}
        </span>
      </AdminCell>
      <AdminCell>
        {(() => {
          const p = pickPriceForLocale(item.prices, locale);
          return p ? (
            <>
              <span className="font-medium tabular-nums text-ganitel-text-title">
                {formatPriceAmount(p.amount, locale)}
              </span>
              <span className="ml-1 text-xs uppercase tracking-wider text-ganitel-text-placeholder">
                {p.currency}
              </span>
            </>
          ) : null;
        })()}
      </AdminCell>
      <AdminCell>
        <StatusPill status={item.status} />
      </AdminCell>
      <AdminCell align="right">
        <div className="flex flex-wrap items-center justify-end gap-1.5">
          <ActionLink
            to={`/admin/rentals/${item.id}/edit`}
            icon={<Pencil className="size-3.5" strokeWidth={1.75} />}
          >
            {tr("admin.action.edit")}
          </ActionLink>
          {(item.status === "draft" || item.status === "unlisted") && (
            <ActionButton
              tone="success"
              icon={<Eye className="size-3.5" strokeWidth={1.75} />}
              onClick={() => publish.mutate()}
              disabled={isBusy}
            >
              {tr("admin.action.publish")}
            </ActionButton>
          )}
          {item.status === "published" && (
            <ActionButton
              icon={<EyeOff className="size-3.5" strokeWidth={1.75} />}
              onClick={() => unpublish.mutate()}
              disabled={isBusy}
            >
              {tr("admin.action.unpublish")}
            </ActionButton>
          )}
          {item.status !== "removed" && (
            <ActionButton
              tone="danger"
              icon={<Trash2 className="size-3.5" strokeWidth={1.75} />}
              onClick={() => {
                const msg = tr("admin.confirm.delete").replace(
                  "{title}",
                  item.title,
                );
                if (confirm(msg)) remove.mutate();
              }}
              disabled={isBusy}
            >
              {tr("admin.action.delete")}
            </ActionButton>
          )}
        </div>
        {lastError ? <RowError tr={tr} error={lastError} /> : null}
      </AdminCell>
    </AdminRow>
  );
}

function RowError({
  tr,
  error,
}: {
  tr: ReturnType<typeof useT>;
  error: unknown;
}) {
  const issues = extractPublishIssues(error);
  if (issues) {
    return (
      <div className="mt-2 text-right text-xs text-red-600">
        <p className="font-medium">{tr("admin.publish_error.intro")}</p>
        <ul className="mt-1 space-y-0.5">
          {issues.map((issue) => (
            <li key={issue.field}>
              {issue.key
                ? tr(issue.key)
                : tr("admin.publish_error.generic").replace(
                    "{field}",
                    issue.field,
                  )}
            </li>
          ))}
        </ul>
      </div>
    );
  }
  return (
    <p className="mt-2 text-right text-xs text-red-600">
      {error instanceof Error ? error.message : String(error)}
    </p>
  );
}
