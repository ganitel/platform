import type { ButtonHTMLAttributes, ReactNode } from "react";
import { Link } from "react-router";

import { cn } from "@/shared/lib/cn";
import { useT, type TranslationKey } from "@/shared/lib/i18n";

export type AdminStatus = "draft" | "published" | "unlisted" | "removed";

export const ADMIN_STATUS_LABEL_KEY: Record<AdminStatus, TranslationKey> = {
  draft: "admin.status.draft",
  published: "admin.status.published",
  unlisted: "admin.status.unlisted",
  removed: "admin.status.removed",
};

export function useAdminStatusLabel() {
  const t = useT();
  return (status: AdminStatus) => t(ADMIN_STATUS_LABEL_KEY[status]);
}

const STATUS_STYLES: Record<
  AdminStatus,
  { dot: string; chip: string; ring: string }
> = {
  draft: {
    dot: "bg-amber-500",
    chip: "bg-amber-50 text-amber-900",
    ring: "ring-amber-300/60",
  },
  published: {
    dot: "bg-ganitel-moss",
    chip: "bg-ganitel-accent-green text-ganitel-moss",
    ring: "ring-ganitel-moss/30",
  },
  unlisted: {
    dot: "bg-ganitel-text-placeholder",
    chip: "bg-ganitel-accent-grey text-ganitel-text-subtitle",
    ring: "ring-ganitel-text-placeholder/30",
  },
  removed: {
    dot: "bg-red-500",
    chip: "bg-red-50 text-red-700",
    ring: "ring-red-300/50",
  },
};

export function StatusPill({ status }: { status: AdminStatus }) {
  const s = STATUS_STYLES[status];
  const t = useT();
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-[11px] font-medium uppercase tracking-[0.12em]",
        s.chip,
      )}
    >
      <span className={cn("size-1.5 rounded-full", s.dot)} aria-hidden />
      {t(ADMIN_STATUS_LABEL_KEY[status])}
    </span>
  );
}

export function FilterChip({
  active,
  status,
  onClick,
  children,
}: {
  active: boolean;
  status: AdminStatus;
  onClick: () => void;
  children: ReactNode;
}) {
  const s = STATUS_STYLES[status];
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border px-3 py-1.5 text-xs font-medium uppercase tracking-[0.12em] transition",
        active
          ? cn(
              s.chip,
              "border-transparent ring-1 ring-inset",
              s.ring,
              "shadow-[0_1px_0_rgba(24,16,12,0.04)]",
            )
          : "border-ganitel-stroke-neutral bg-white/70 text-ganitel-text-subtitle hover:border-ganitel-text-placeholder/40 hover:text-ganitel-text-title",
      )}
    >
      <span className={cn("size-1.5 rounded-full", s.dot)} aria-hidden />
      {children}
    </button>
  );
}

type ActionTone = "neutral" | "primary" | "success" | "danger";

const ACTION_TONE: Record<ActionTone, string> = {
  neutral:
    "border-ganitel-stroke-neutral bg-white/70 text-ganitel-text-title hover:border-ganitel-text-placeholder/40 hover:bg-white",
  primary:
    "border-ganitel-primary bg-ganitel-primary text-ganitel-paper hover:bg-ganitel-primary/90",
  success:
    "border-ganitel-moss/40 bg-ganitel-accent-green text-ganitel-moss hover:border-ganitel-moss",
  danger:
    "border-red-200 bg-red-50 text-red-700 hover:border-red-300 hover:bg-red-100",
};

const ACTION_BASE =
  "inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border px-3 py-1.5 text-xs font-medium transition disabled:cursor-not-allowed disabled:opacity-50";

interface ActionButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  tone?: ActionTone;
  icon?: ReactNode;
}

export function ActionButton({
  tone = "neutral",
  icon,
  children,
  className,
  ...rest
}: ActionButtonProps) {
  return (
    <button
      type="button"
      className={cn(ACTION_BASE, ACTION_TONE[tone], className)}
      {...rest}
    >
      {icon}
      <span>{children}</span>
    </button>
  );
}

interface ActionLinkProps {
  to: string;
  tone?: ActionTone;
  icon?: ReactNode;
  children: ReactNode;
  className?: string;
}

export function ActionLink({
  to,
  tone = "neutral",
  icon,
  children,
  className,
}: ActionLinkProps) {
  return (
    <Link to={to} className={cn(ACTION_BASE, ACTION_TONE[tone], className)}>
      {icon}
      <span>{children}</span>
    </Link>
  );
}

export function AdminCard({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "overflow-hidden rounded-3xl border border-ganitel-stroke-neutral bg-ganitel-background-secondary shadow-[0_30px_60px_-50px_rgba(24,16,12,0.25)]",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <AdminCard>
      <div className="flex flex-col items-center justify-center gap-3 px-6 py-16 text-center">
        <h3 className="text-xl font-semibold tracking-tight text-ganitel-text-title">
          {title}
        </h3>
        {description ? (
          <p className="max-w-md text-sm text-ganitel-text-subtitle">
            {description}
          </p>
        ) : null}
        {action ? <div className="mt-2">{action}</div> : null}
      </div>
    </AdminCard>
  );
}
