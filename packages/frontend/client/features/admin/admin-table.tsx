import type { ReactNode } from "react";

import { cn } from "@/shared/lib/cn";
import { useT } from "@/shared/lib/i18n";

export interface AdminColumn {
  key: string;
  label: string;
  align?: "left" | "right";
  width?: string;
  className?: string;
}

export function AdminTable({
  columns,
  children,
}: {
  columns: AdminColumn[];
  children: ReactNode;
}) {
  return (
    <div className="overflow-hidden rounded-3xl border border-ganitel-stroke-neutral bg-ganitel-background-secondary shadow-[0_30px_60px_-50px_rgba(24,16,12,0.25)]">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[960px] border-separate border-spacing-0 text-sm">
          <colgroup>
            {columns.map((col) => (
              <col
                key={col.key}
                style={col.width ? { width: col.width } : undefined}
              />
            ))}
          </colgroup>
          <thead>
            <tr>
              {columns.map((col) => (
                <th
                  key={col.key}
                  scope="col"
                  className={cn(
                    "sticky top-0 z-10 border-b border-ganitel-stroke-neutral bg-ganitel-neutral-2 px-5 py-3.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-ganitel-text-placeholder",
                    col.align === "right" ? "text-right" : "text-left",
                    col.className,
                  )}
                >
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>{children}</tbody>
        </table>
      </div>
    </div>
  );
}

export function AdminRow({
  children,
  isBusy,
}: {
  children: ReactNode;
  isBusy?: boolean;
}) {
  return (
    <tr
      className={cn(
        "group transition-colors hover:bg-ganitel-neutral-1/60",
        isBusy && "opacity-60",
      )}
    >
      {children}
    </tr>
  );
}

export function AdminCell({
  children,
  align = "left",
  className,
}: {
  children: ReactNode;
  align?: "left" | "right";
  className?: string;
}) {
  return (
    <td
      className={cn(
        "border-b border-ganitel-stroke-neutral/70 px-5 py-4 align-middle text-sm text-ganitel-text-subtitle",
        align === "right" ? "text-right" : "text-left",
        className,
      )}
    >
      {children}
    </td>
  );
}

export function AdminCellTitle({
  title,
  subtitle,
  cover,
}: {
  title: string;
  subtitle?: string;
  cover?: { url: string; alt: string } | null;
}) {
  return (
    <div className="flex min-w-0 items-center gap-3">
      <div className="size-12 shrink-0 overflow-hidden rounded-xl bg-ganitel-neutral-3">
        {cover ? (
          <img
            src={cover.url}
            alt={cover.alt}
            loading="lazy"
            decoding="async"
            className="size-full object-cover"
          />
        ) : (
          <div
            className="size-full bg-gradient-to-br from-ganitel-paper to-ganitel-accent-grey"
            aria-hidden
          />
        )}
      </div>
      <div className="min-w-0">
        <p className="truncate font-medium text-ganitel-text-title">{title}</p>
        {subtitle ? (
          <p className="truncate text-xs text-ganitel-text-placeholder">
            {subtitle}
          </p>
        ) : null}
      </div>
    </div>
  );
}

export function AdminPagination({
  offset,
  limit,
  total,
  shown,
  onOffsetChange,
}: {
  offset: number;
  limit: number;
  total: number;
  shown: number;
  onOffsetChange: (n: number) => void;
}) {
  const t = useT();
  const from = total === 0 ? 0 : offset + 1;
  const to = offset + shown;
  const hasPrev = offset > 0;
  const hasNext = to < total;
  return (
    <div className="mt-5 flex flex-col items-start justify-between gap-3 text-sm text-ganitel-text-subtitle sm:flex-row sm:items-center">
      <span className="font-medium tabular-nums">
        <span className="text-ganitel-text-title">
          {from}–{to}
        </span>
        <span className="text-ganitel-text-placeholder">
          {" "}
          {t("admin.pagination.of")} {total}
        </span>
      </span>
      <div className="flex items-center gap-2">
        <button
          type="button"
          disabled={!hasPrev}
          onClick={() => onOffsetChange(Math.max(0, offset - limit))}
          className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border border-ganitel-stroke-neutral bg-white/70 px-3 py-1.5 text-xs font-medium text-ganitel-text-title transition hover:border-ganitel-text-placeholder/40 hover:bg-white disabled:cursor-not-allowed disabled:opacity-40"
        >
          {t("admin.action.prev")}
        </button>
        <button
          type="button"
          disabled={!hasNext}
          onClick={() => onOffsetChange(offset + limit)}
          className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border border-ganitel-stroke-neutral bg-white/70 px-3 py-1.5 text-xs font-medium text-ganitel-text-title transition hover:border-ganitel-text-placeholder/40 hover:bg-white disabled:cursor-not-allowed disabled:opacity-40"
        >
          {t("admin.action.next")}
        </button>
      </div>
    </div>
  );
}
