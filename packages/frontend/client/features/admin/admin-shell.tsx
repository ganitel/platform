import type { ReactNode } from "react";
import { Link, NavLink } from "react-router";
import { Compass, Home, LayoutGrid, LogOut, Sparkles } from "lucide-react";

import { Header } from "@/shared/components/header";
import { useT, type TranslationKey } from "@/shared/lib/i18n";
import { cn } from "@/shared/lib/cn";

type NavItem = {
  to: string;
  labelKey: TranslationKey;
  icon: typeof Home;
  // `end` makes the match exact — only "/admin" itself is active for the
  // overview link, while "/admin/rentals" is left to match its own item.
  end?: boolean;
};

const NAV: NavItem[] = [
  {
    to: "/admin",
    labelKey: "admin.nav.overview",
    icon: LayoutGrid,
    end: true,
  },
  { to: "/admin/rentals", labelKey: "admin.nav.rentals", icon: Home },
  {
    to: "/admin/experiences",
    labelKey: "admin.nav.experiences",
    icon: Compass,
  },
];

interface AdminShellProps {
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: ReactNode;
  children: ReactNode;
}

export function AdminShell({
  eyebrow,
  title,
  description,
  actions,
  children,
}: AdminShellProps) {
  return (
    <div className="min-h-screen bg-ganitel-paper">
      <Header />
      <div className="mx-auto flex max-w-[1400px] gap-8 px-4 py-8 lg:px-8">
        <AdminSidebar />
        <main className="min-w-0 flex-1">
          <PageHeader
            eyebrow={eyebrow}
            title={title}
            description={description}
            actions={actions}
          />
          {children}
        </main>
      </div>
    </div>
  );
}

function AdminSidebar() {
  const t = useT();
  return (
    <aside className="hidden w-60 shrink-0 flex-col lg:flex">
      <div className="sticky top-8 flex flex-col gap-8 rounded-3xl border border-ganitel-stroke-neutral/70 bg-ganitel-primary p-6 text-ganitel-paper shadow-[0_30px_80px_-40px_rgba(24,16,12,0.35)]">
        <div className="flex flex-col gap-1">
          <span className="font-italic-serif text-2xl leading-none text-ganitel-secondary">
            {t("admin.brand")}
          </span>
          <span className="text-xs uppercase tracking-[0.28em] text-ganitel-paper/60">
            {t("admin.shell.eyebrow")}
          </span>
        </div>

        <nav className="flex flex-col gap-1">
          {NAV.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  cn(
                    "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-ganitel-paper text-ganitel-primary"
                      : "text-ganitel-paper/75 hover:bg-white/[0.06] hover:text-ganitel-paper",
                  )
                }
              >
                {({ isActive }) => (
                  <>
                    <Icon
                      className={cn(
                        "size-4",
                        isActive
                          ? "text-ganitel-primary"
                          : "text-ganitel-paper/55 group-hover:text-ganitel-paper",
                      )}
                      strokeWidth={1.75}
                    />
                    <span>{t(item.labelKey)}</span>
                  </>
                )}
              </NavLink>
            );
          })}
        </nav>

        <div className="mt-auto flex flex-col gap-3 border-t border-white/[0.08] pt-5">
          <div className="flex items-center gap-2 text-xs text-ganitel-paper/55">
            <Sparkles className="size-3.5" strokeWidth={1.75} />
            <span className="font-medium uppercase tracking-[0.18em]">
              {t("admin.shell.mode")}
            </span>
          </div>
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-xs text-ganitel-paper/70 transition-colors hover:text-ganitel-paper"
          >
            <LogOut className="size-3.5" strokeWidth={1.75} />
            <span>{t("admin.shell.exit")}</span>
          </Link>
        </div>
      </div>
    </aside>
  );
}

function PageHeader({
  eyebrow,
  title,
  description,
  actions,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: ReactNode;
}) {
  return (
    <header className="mb-8 flex flex-col gap-6 border-b border-ganitel-stroke-neutral pb-8 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        {eyebrow ? (
          <p className="mb-2 text-xs font-medium uppercase tracking-[0.28em] text-ganitel-secondary">
            {eyebrow}
          </p>
        ) : null}
        <h1 className="font-display text-[2.4rem] leading-[1.05] text-ganitel-text-title sm:text-[2.75rem]">
          {title}
        </h1>
        {description ? (
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-ganitel-text-subtitle">
            {description}
          </p>
        ) : null}
      </div>
      {actions ? (
        <div className="flex shrink-0 flex-wrap items-center gap-2">
          {actions}
        </div>
      ) : null}
    </header>
  );
}
