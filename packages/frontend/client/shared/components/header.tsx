import { UserButton, useAuth, useClerk } from "@clerk/react-router";
import { Link } from "react-router";

import { Button } from "@/shared/ui/button";
import { useT } from "@/shared/lib/i18n";

export function Header() {
  const t = useT();
  const { isLoaded, isSignedIn } = useAuth();
  // Force a render once Clerk has booted; on first paint (incl. SSR) we render
  // the signed-out chrome so anonymous browsing has no flash.
  useClerk();

  return (
    <header className="sticky top-0 z-30 border-b border-ganitel-stroke-neutral bg-ganitel-background-secondary/85 backdrop-blur supports-[backdrop-filter]:bg-ganitel-background-secondary/70">
      <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between px-4 md:px-8">
        <Link
          to="/"
          className="font-infoma text-2xl tracking-tight text-ganitel-text-title"
        >
          Ganitel
        </Link>

        <nav className="hidden gap-6 text-sm text-ganitel-text-subtitle md:flex">
          <Link to="/" className="hover:text-ganitel-text-title">
            {t("nav.home")}
          </Link>
          <Link to="/browse" className="hover:text-ganitel-text-title">
            {t("nav.browse")}
          </Link>
          <Link to="/bookings" className="hover:text-ganitel-text-title">
            {t("nav.bookings")}
          </Link>
          <Link to="/profile" className="hover:text-ganitel-text-title">
            {t("nav.profile")}
          </Link>
        </nav>

        <div className="flex items-center gap-2">
          {isLoaded && isSignedIn ? (
            <UserButton />
          ) : (
            <>
              <Button asChild variant="ghost" size="sm">
                <Link to="/sign-in">{t("common.signin")}</Link>
              </Button>
              <Button
                asChild
                size="sm"
                className="bg-ganitel-primary text-ganitel-text-button hover:bg-ganitel-primary/90"
              >
                <Link to="/sign-up">{t("common.signup")}</Link>
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
