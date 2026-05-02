import { Compass, Heart, Home, User as UserIcon } from "lucide-react";
import { NavLink, useLocation } from "react-router";

import { cn } from "@/shared/lib/cn";
import { useT, type TranslationKey } from "@/shared/lib/i18n";
import { usePrelaunch } from "@/shared/hooks/use-prelaunch";

const ALL_ITEMS: {
  to: string;
  labelKey: TranslationKey;
  icon: typeof Compass;
  hideInPrelaunch?: boolean;
}[] = [
  { to: "/", labelKey: "nav.home", icon: Home },
  { to: "/browse", labelKey: "nav.browse", icon: Compass },
  { to: "/bookings", labelKey: "nav.bookings", icon: Heart, hideInPrelaunch: true },
  { to: "/profile", labelKey: "nav.profile", icon: UserIcon, hideInPrelaunch: true },
];

const DETAIL_PAGE_RE = /^\/(properties|experiences)\//;

export function BottomNav() {
  const t = useT();
  const isPrelaunch = usePrelaunch();
  const { pathname } = useLocation();

  if (DETAIL_PAGE_RE.test(pathname)) return null;

  const items = isPrelaunch
    ? ALL_ITEMS.filter(({ hideInPrelaunch }) => !hideInPrelaunch)
    : ALL_ITEMS;

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-30 border-t border-ganitel-stroke-neutral bg-ganitel-paper md:hidden"
      aria-label="Primary"
    >
      <ul
        className="mx-auto flex max-w-md justify-around px-2 pt-2"
        style={{ paddingBottom: "max(env(safe-area-inset-bottom, 0px), 8px)" }}
      >
        {items.map(({ to, labelKey, icon: Icon }) => (
          <li key={to} className="flex-1">
            <NavLink
              to={to}
              end={to === "/"}
              className={({ isActive }) =>
                cn(
                  "flex flex-col items-center gap-1 rounded-xl px-2 py-2 text-xs transition-colors duration-150",
                  isActive
                    ? "bg-ganitel-primary/8 font-semibold text-ganitel-text-active"
                    : "text-ganitel-text-subtitle",
                )
              }
            >
              {({ isActive }) => (
                <>
                  <Icon
                    className={cn(
                      "size-5 transition-colors duration-150",
                      isActive ? "text-ganitel-text-title" : "text-ganitel-text-placeholder",
                    )}
                    aria-hidden
                  />
                  <span>{t(labelKey)}</span>
                </>
              )}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}
