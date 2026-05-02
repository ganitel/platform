import { Compass, Heart, Home, User as UserIcon } from "lucide-react";
import { NavLink } from "react-router";

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

export function BottomNav() {
  const t = useT();
  const isPrelaunch = usePrelaunch();

  const items = isPrelaunch
    ? ALL_ITEMS.filter(({ hideInPrelaunch }) => !hideInPrelaunch)
    : ALL_ITEMS;

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-30 border-t border-ganitel-stroke-neutral bg-ganitel-paper md:hidden"
      aria-label="Primary"
    >
      <ul className="mx-auto flex max-w-md justify-around px-2 py-2">
        {items.map(({ to, labelKey, icon: Icon }) => (
          <li key={to}>
            <NavLink
              to={to}
              end={to === "/"}
              className={({ isActive }) =>
                cn(
                  "flex flex-col items-center gap-1 rounded-md px-3 py-2 text-xs",
                  isActive
                    ? "text-ganitel-text-active"
                    : "text-ganitel-text-subtitle hover:text-ganitel-text-title",
                )
              }
            >
              <Icon className="size-5" aria-hidden />
              <span>{t(labelKey)}</span>
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}
