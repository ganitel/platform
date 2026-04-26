import { UserButton, useAuth, useClerk } from "@clerk/react-router";
import { Link, NavLink } from "react-router";

import { cn } from "@/shared/lib/cn";
import { useT, type TranslationKey } from "@/shared/lib/i18n";
import { PillLink } from "@/shared/ui/pill-link";

const NAV_ITEMS: { to: string; labelKey: TranslationKey }[] = [
  { to: "/", labelKey: "nav.home" },
  { to: "/browse", labelKey: "nav.browse" },
  { to: "/bookings", labelKey: "nav.bookings" },
  { to: "/profile", labelKey: "nav.profile" },
];

export function Header() {
  const t = useT();
  const { isLoaded, isSignedIn } = useAuth();
  // Force a render once Clerk has booted; first paint (incl. SSR) shows
  // the signed-out chrome to avoid a flash for anonymous visitors.
  useClerk();

  return (
    <header className="sticky top-0 z-30 border-b border-ganitel-stroke-neutral bg-ganitel-paper/85 backdrop-blur supports-[backdrop-filter]:bg-ganitel-paper/70">
      <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between gap-6 px-4 md:px-8">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-ganitel-text-title"
          aria-label="Ganitel"
        >
          <span className="grid size-7 -rotate-[4deg] place-items-center rounded-lg bg-ganitel-text-title text-[13px] font-extrabold leading-none text-ganitel-paper">
            G
          </span>
          <span className="font-display text-[22px] font-extrabold leading-none tracking-[-0.045em]">
            Ganitel
          </span>
        </Link>

        <nav className="hidden gap-9 md:inline-flex" aria-label="Primary">
          {NAV_ITEMS.map(({ to, labelKey }) => (
            <HeaderNavItem key={to} to={to}>
              {t(labelKey)}
            </HeaderNavItem>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          {isLoaded && isSignedIn ? (
            <UserButton />
          ) : (
            <>
              <PillLink to="/sign-in" size="sm" variant="outline">
                {t("common.signin")}
              </PillLink>
              <PillLink to="/sign-up" size="sm" variant="solid">
                {t("common.signup")}
              </PillLink>
            </>
          )}
        </div>
      </div>
    </header>
  );
}

function HeaderNavItem({ to, children }: { to: string; children: React.ReactNode }) {
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
