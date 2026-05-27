import { lazy, Suspense } from "react";
import { Link, NavLink } from "react-router";

import { useDeferredSession } from "@/features/auth/hooks/use-deferred-session";
import { cn } from "@/shared/lib/cn";
import { useT, type TranslationKey } from "@/shared/lib/i18n";
import { usePrelaunch } from "@/shared/hooks/use-prelaunch";
import { PillLink } from "@/shared/ui/pill-link";

const UserMenu = lazy(() =>
  import("@/features/auth/components/user-menu").then((m) => ({
    default: m.UserMenu,
  })),
);

const NAV_ITEMS: {
  to: string;
  labelKey: TranslationKey;
  hideInPrelaunch?: boolean;
}[] = [
  { to: "/", labelKey: "nav.home" },
  { to: "/browse", labelKey: "nav.browse" },
  { to: "/about", labelKey: "nav.about" },
  { to: "/bookings", labelKey: "nav.bookings", hideInPrelaunch: true },
  { to: "/profile", labelKey: "nav.profile", hideInPrelaunch: true },
];

export function Header() {
  const t = useT();
  const isPrelaunch = usePrelaunch();
  const { session, isPending } = useDeferredSession();

  const visibleItems = isPrelaunch
    ? NAV_ITEMS.filter(({ hideInPrelaunch }) => !hideInPrelaunch)
    : NAV_ITEMS;

  return (
    <header
      className="sticky top-0 z-30 border-b border-ganitel-stroke-neutral bg-ganitel-paper/85 backdrop-blur supports-[backdrop-filter]:bg-ganitel-paper/70"
      style={{ paddingTop: "env(safe-area-inset-top, 0px)" }}
    >
      {isPrelaunch && (
        <div className="border-b border-ganitel-secondary/20 bg-ganitel-secondary/10 px-4 py-1.5 text-center text-[11px] leading-snug text-ganitel-text-subtitle md:py-2 md:text-xs">
          {t("prelaunch.banner")}
        </div>
      )}
      <div className="mx-auto flex h-14 w-full max-w-7xl items-center justify-between gap-3 px-4 md:h-16 md:gap-6 md:px-8">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-ganitel-text-title"
          aria-label="ganitel"
        >
          <span className="grid size-7 rotate-[-4deg] place-items-center rounded-lg bg-ganitel-text-title text-[13px] font-extrabold leading-none text-ganitel-paper">
            G
          </span>
          <span className="font-display text-[24px] font-bold leading-none tracking-[-0.01em]">
            ganitel
          </span>
        </Link>

        <nav className="hidden gap-9 md:inline-flex" aria-label="Primary">
          {visibleItems.map(({ to, labelKey }) => (
            <HeaderNavItem key={to} to={to}>
              {t(labelKey)}
            </HeaderNavItem>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          {!isPending && session ? (
            <Suspense fallback={null}>
              <UserMenu session={session} />
            </Suspense>
          ) : isPrelaunch ? (
            <PillLink to="/join" size="sm" variant="solid">
              {t("join.submit")}
            </PillLink>
          ) : (
            <>
              <PillLink to="/sign-in" size="sm" variant="outline">
                {t("common.signin")}
              </PillLink>
              <PillLink
                to="/sign-in"
                size="sm"
                variant="solid"
                className="hidden sm:inline-flex"
              >
                {t("common.signup")}
              </PillLink>
            </>
          )}
        </div>
      </div>
    </header>
  );
}

function HeaderNavItem({
  to,
  children,
}: {
  to: string;
  children: React.ReactNode;
}) {
  return (
    <NavLink
      to={to}
      end={to === "/"}
      className={({ isActive }) =>
        cn(
          "group relative pb-1 pt-1.5 text-sm tracking-tight transition-colors duration-200",
          isActive
            ? "font-semibold text-ganitel-text-title"
            : "font-medium text-ganitel-text-placeholder hover:text-ganitel-text-title",
        )
      }
    >
      {({ isActive }) => (
        <>
          {children}
          {isActive ? (
            <span
              aria-hidden
              className="absolute -bottom-2 left-1/2 size-1 -translate-x-1/2 rounded-full bg-ganitel-text-title"
            />
          ) : (
            <span
              aria-hidden
              className="absolute inset-x-0 -bottom-0.5 h-px origin-left scale-x-0 bg-ganitel-text-title transition-transform duration-300 ease-out group-hover:scale-x-100"
            />
          )}
        </>
      )}
    </NavLink>
  );
}
