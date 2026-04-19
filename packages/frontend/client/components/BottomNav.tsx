import { Bell, Gift, Heart, Home } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";

const navItems = [
  { label: "Home", to: "/", icon: Home },
  { label: "Wishlist", to: "/my-wishlist", icon: Heart },
  { label: "Offers", to: "/offers", icon: Gift },
  { label: "Notifications", to: "/notifications", icon: Bell },
];

export function BottomNav() {
  const location = useLocation();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-ganitel-accent-grey bg-ganitel-neutral-2">
      <div className="mx-auto flex h-[60px] w-full max-w-md items-center justify-between px-2">
        {navItems.map((item) => {
          const isSelected = item.to && location.pathname === item.to;
          const Icon = item.icon;

          return (
            <Link key={item.label} className="flex flex-1 justify-center" to={item.to}>
              <div className="flex flex-1 flex-col items-center gap-1 py-1">
                <div
                  className={cn(
                    "flex h-8 w-14 items-center justify-center rounded-2xl",
                    isSelected ? "bg-[#E1E0DF]" : "bg-transparent"
                  )}
                >
                  <Icon className="h-5 w-5 text-[#18100C]" strokeWidth={1.5} />
                </div>
                <span
                  className={cn(
                    "text-[14px] leading-4 tracking-[-0.28px]",
                    isSelected ? "text-[#625B71]" : "text-[#49454F]"
                  )}
                >
                  {item.label}
                </span>
              </div>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
