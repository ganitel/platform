import { Link, NavLink } from "react-router";

import { useSession } from "@/lib/supabase";
import { UserMenu } from "@/features/auth/components/user-menu";
import { cn } from "@/shared/lib/cn";
import { useT, type TranslationKey } from "@/shared/lib/i18n";
import { usePrelaunch } from "@/shared/hooks/use-prelaunch";
import { PillLink } from "@/shared/ui/pill-link";

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
  const { session, isPending } = useSession();

  const visibleItems = isPrelaunch
    ? NAV_ITEMS.filter(({ hideInPrelaunch }) => !hideInPrelaunch)
    : NAV_ITEMS;

  return (
    <header className="sticky top-0 z-30 border-b border-ganitel-stroke-neutral bg-ganitel-paper/85 backdrop-blur supports-[backdrop-filter]:bg-ganitel-paper/70">
      {isPrelaunch && (
        <div className="border-b border-ganitel-secondary/20 bg-ganitel-secondary/10 px-4 py-2 text-center text-xs text-ganitel-text-subtitle">
          {t("prelaunch.banner")}
        </div>
      )}
      <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between gap-6 px-4 md:px-8">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-ganitel-text-title"
          aria-label="Ganitel"
        >
          <span className="grid size-7 rotate-[-4deg] place-items-center rounded-lg bg-ganitel-text-title text-[13px] font-extrabold leading-none text-ganitel-paper">
            G
          </span>
          <span className="font-display text-[22px] font-extrabold leading-none tracking-[-0.045em]">
            Ganitel
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
            <UserMenu session={session} />
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
