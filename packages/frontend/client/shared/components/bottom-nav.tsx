import { NavLink, useLocation } from "react-router";

import { cn } from "@/shared/lib/cn";
import { useT, type TranslationKey } from "@/shared/lib/i18n";
import { usePrelaunch } from "@/shared/hooks/use-prelaunch";
import {
  AboutGlyph,
  BookingsGlyph,
  ExploreGlyph,
  HomeGlyph,
  ProfileGlyph,
  type NavGlyphProps,
} from "@/shared/components/nav-glyphs";

interface NavItem {
  to: string;
  labelKey: TranslationKey;
  icon: (props: NavGlyphProps) => React.ReactElement;
  showInPrelaunch?: boolean;
  showAfterLaunch?: boolean;
}

const ITEMS: NavItem[] = [
  {
    to: "/",
    labelKey: "nav.home",
    icon: HomeGlyph,
    showInPrelaunch: true,
    showAfterLaunch: true,
  },
  {
    to: "/browse?kind=experiences",
    labelKey: "nav.browse",
    icon: ExploreGlyph,
    showInPrelaunch: true,
    showAfterLaunch: true,
  },
  {
    to: "/about",
    labelKey: "nav.about",
    icon: AboutGlyph,
    showInPrelaunch: true,
    showAfterLaunch: false,
  },
  {
    to: "/bookings",
    labelKey: "nav.bookings",
    icon: BookingsGlyph,
    showInPrelaunch: false,
    showAfterLaunch: true,
  },
  {
    to: "/profile",
    labelKey: "nav.profile",
    icon: ProfileGlyph,
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
              className="group flex min-h-[58px] touch-manipulation select-none flex-col items-center justify-center gap-1 px-1 pb-1 pt-1.5 text-[11px]"
            >
              {({ isActive }) => (
                <>
                  <span
                    className={cn(
                      "flex h-8 w-14 items-center justify-center rounded-full transition-colors duration-200",
                      isActive
                        ? "bg-ganitel-surface-2"
                        : "group-active:bg-ganitel-stroke-neutral/50",
                    )}
                  >
                    <Icon
                      filled={isActive}
                      className={cn(
                        "size-6",
                        isActive
                          ? "text-ganitel-text-title"
                          : "text-ganitel-text-subtitle",
                      )}
                    />
                  </span>
                  <span
                    className={cn(
                      "leading-none",
                      isActive
                        ? "font-semibold text-ganitel-text-title"
                        : "font-medium text-ganitel-text-subtitle",
                    )}
                  >
                    {t(labelKey)}
                  </span>
                </>
              )}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}
