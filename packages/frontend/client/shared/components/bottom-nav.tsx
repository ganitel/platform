import { Compass, Heart, Home, Sparkles, User as UserIcon } from "lucide-react";
import { NavLink, useLocation } from "react-router";

import { cn } from "@/shared/lib/cn";
import { useT, type TranslationKey } from "@/shared/lib/i18n";
import { usePrelaunch } from "@/shared/hooks/use-prelaunch";

interface NavItem {
  to: string;
  labelKey: TranslationKey;
  icon: typeof Compass;
  showInPrelaunch?: boolean;
  showAfterLaunch?: boolean;
}

const ITEMS: NavItem[] = [
  {
    to: "/",
    labelKey: "nav.home",
    icon: Home,
    showInPrelaunch: true,
    showAfterLaunch: true,
  },
  {
    to: "/browse",
    labelKey: "nav.browse",
    icon: Compass,
    showInPrelaunch: true,
    showAfterLaunch: true,
  },
  {
    to: "/about",
    labelKey: "nav.about",
    icon: Sparkles,
    showInPrelaunch: true,
    showAfterLaunch: false,
  },
  {
    to: "/bookings",
    labelKey: "nav.bookings",
    icon: Heart,
    showInPrelaunch: false,
    showAfterLaunch: true,
  },
  {
    to: "/profile",
    labelKey: "nav.profile",
    icon: UserIcon,
    showInPrelaunch: false,
    showAfterLaunch: true,
  },
];

const DETAIL_PAGE_RE = /^\/(properties|experiences)\//;

export function BottomNav() {
  const t = useT();
  const isPrelaunch = usePrelaunch();
  const { pathname } = useLocation();

  if (DETAIL_PAGE_RE.test(pathname)) return null;

  const items = ITEMS.filter((it) =>
    isPrelaunch ? it.showInPrelaunch : it.showAfterLaunch,
  );

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-30 border-t border-ganitel-stroke-neutral bg-ganitel-paper/95 backdrop-blur supports-[backdrop-filter]:bg-ganitel-paper/85 md:hidden"
      aria-label="Primary"
    >
      <ul
        className="mx-auto flex max-w-md justify-around px-1 pt-1.5"
        style={{ paddingBottom: "max(env(safe-area-inset-bottom, 0px), 8px)" }}
      >
        {items.map(({ to, labelKey, icon: Icon }) => (
          <li key={to} className="flex-1">
            <NavLink
              to={to}
              end={to === "/"}
              className={({ isActive }) =>
                cn(
                  "relative flex min-h-[56px] flex-col items-center justify-center gap-0.5 rounded-2xl px-1 py-1.5 text-[11px] transition-colors duration-150",
                  isActive
                    ? "font-semibold text-ganitel-text-title"
                    : "font-medium text-ganitel-text-subtitle active:bg-ganitel-stroke-neutral/40",
                )
              }
            >
              {({ isActive }) => (
                <>
                  {isActive && (
                    <span
                      aria-hidden
                      className="absolute inset-x-3 top-0 h-0.5 rounded-b-full bg-ganitel-text-title"
                    />
                  )}
                  <Icon
                    className={cn(
                      "size-[22px] transition-transform duration-150",
                      isActive
                        ? "scale-[1.02] text-ganitel-text-title"
                        : "text-ganitel-text-placeholder",
                    )}
                    strokeWidth={isActive ? 2.2 : 1.7}
                    aria-hidden
                  />
                  <span className="leading-tight">{t(labelKey)}</span>
                </>
              )}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}
