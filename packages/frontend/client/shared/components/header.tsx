import { lazy, Suspense, useState } from "react";
import { Link, NavLink, useLocation } from "react-router";
import { Menu } from "lucide-react";

import { useDeferredSession } from "@/features/auth/hooks/use-deferred-session";
import { cn } from "@/shared/lib/cn";
import { useT, type TranslationKey } from "@/shared/lib/i18n";
import { usePrelaunch } from "@/shared/hooks/use-prelaunch";
import { PillLink } from "@/shared/ui/pill-link";
import { MobileDrawer } from "@/shared/components/mobile-drawer";
import { LanguageSwitcher } from "@/shared/components/language-switcher";
import { LogoMark } from "@/shared/components/logo-mark";

const UserMenu = lazy(() =>
  import("@/features/auth/components/user-menu").then((m) => ({
    default: m.UserMenu,
  })),
);

interface NavLinkSpec {
  to: string;
  labelKey: TranslationKey;
  hideInPrelaunch?: boolean;
}

const DESKTOP_NAV: NavLinkSpec[] = [
  { to: "/browse", labelKey: "nav.browse" },
  { to: "/about", labelKey: "nav.about" },
];

const DRAWER_BROWSE: NavLinkSpec[] = [
  { to: "/", labelKey: "nav.home" },
  { to: "/browse", labelKey: "nav.browse" },
];

const DRAWER_ACCOUNT: NavLinkSpec[] = [
  { to: "/bookings", labelKey: "nav.bookings", hideInPrelaunch: true },
  { to: "/profile", labelKey: "nav.profile", hideInPrelaunch: true },
];

const DRAWER_GANITEL: NavLinkSpec[] = [{ to: "/about", labelKey: "nav.about" }];

export function Header() {
  const t = useT();
  const isPrelaunch = usePrelaunch();
  const { session, isPending } = useDeferredSession();
  const location = useLocation();
  // Derive open from location: the drawer is open only while the user is on the
  // path it was opened from. Any navigation away resets it, no effect required.
  const [openOnPath, setOpenOnPath] = useState<string | null>(null);
  const open = openOnPath === location.pathname;
  const setOpen = (next: boolean) =>
    setOpenOnPath(next ? location.pathname : null);

  const filter = (items: NavLinkSpec[]) =>
    isPrelaunch ? items.filter((it) => !it.hideInPrelaunch) : items;

  const desktopItems = filter(DESKTOP_NAV);

  return (
    <>
      <header
        className="sticky top-0 z-30 border-b border-ganitel-stroke-neutral bg-ganitel-paper/95 backdrop-blur supports-[backdrop-filter]:bg-ganitel-paper/85"
        style={{ paddingTop: "env(safe-area-inset-top, 0px)" }}
      >
        {isPrelaunch && (
          <div className="border-b border-ganitel-secondary/20 bg-ganitel-secondary/10 px-4 py-1.5 text-center text-xs leading-snug text-ganitel-text-subtitle md:py-2">
            {t("prelaunch.banner")}
          </div>
        )}
        <div className="mx-auto grid h-14 w-full max-w-7xl grid-cols-[auto_1fr_auto] items-center gap-3 px-4 md:h-16 md:px-8">
          <div className="flex items-center">
            {!isPrelaunch && (
              <button
                type="button"
                aria-label={t("nav.open_menu")}
                onClick={() => setOpen(true)}
                className="inline-flex size-10 items-center justify-center rounded-full text-ganitel-text-title transition-colors hover:bg-ganitel-stroke-neutral/40 md:hidden"
              >
                <Menu className="size-5" strokeWidth={1.7} />
              </button>
            )}
            <Link
              to="/"
              className={cn(
                "items-center text-ganitel-text-title",
                isPrelaunch ? "inline-flex" : "hidden md:inline-flex",
              )}
              aria-label="Ganitel"
            >
              <LogoMark />
            </Link>
          </div>

          <div className="flex items-center justify-center md:justify-start md:gap-9">
            {!isPrelaunch && (
              <Link
                to="/"
                className="text-ganitel-text-title md:hidden"
                aria-label="Ganitel"
              >
                <LogoMark />
              </Link>
            )}
            <nav className="hidden gap-9 md:inline-flex" aria-label="Primary">
              {desktopItems.map(({ to, labelKey }) => (
                <HeaderNavItem key={to} to={to}>
                  {t(labelKey)}
                </HeaderNavItem>
              ))}
            </nav>
          </div>

          <div className="flex items-center gap-2">
            <LanguageSwitcher />
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

      {!isPrelaunch && (
        <MobileDrawer
          open={open}
          onOpenChange={setOpen}
          title={t("nav.brand_long")}
          closeLabel={t("nav.close_menu")}
        >
          <DrawerGroup
            label={t("nav.group.browse")}
            items={filter(DRAWER_BROWSE)}
            t={t}
            onNavigate={() => setOpen(false)}
          />
          <DrawerGroup
            label={t("nav.group.account")}
            items={filter(DRAWER_ACCOUNT)}
            t={t}
            onNavigate={() => setOpen(false)}
          />
          <DrawerGroup
            label={t("nav.group.ganitel")}
            items={filter(DRAWER_GANITEL)}
            t={t}
            onNavigate={() => setOpen(false)}
          />
        </MobileDrawer>
      )}
    </>
  );
}

function DrawerGroup({
  label,
  items,
  t,
  onNavigate,
}: {
  label: string;
  items: NavLinkSpec[];
  t: (k: TranslationKey) => string;
  onNavigate: () => void;
}) {
  if (items.length === 0) return null;
  return (
    <div className="mb-4">
      <p className="mb-2 text-[10px] font-medium uppercase tracking-[0.18em] text-ganitel-brown">
        {label}
      </p>
      <ul className="flex flex-col">
        {items.map(({ to, labelKey }) => (
          <li key={to}>
            <NavLink
              to={to}
              end={to === "/"}
              onClick={onNavigate}
              className={({ isActive }) =>
                cn(
                  "flex items-center justify-between border-b border-ganitel-stroke-neutral/60 py-3 text-sm transition-colors",
                  isActive
                    ? "font-medium text-ganitel-text-title"
                    : "font-normal text-ganitel-text-subtitle hover:text-ganitel-text-title",
                )
              }
            >
              {t(labelKey)}
            </NavLink>
          </li>
        ))}
      </ul>
    </div>
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
