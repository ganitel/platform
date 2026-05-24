import { useState } from "react";
import { Link, useNavigate } from "react-router";

import { getSupabase, type Session } from "@/lib/supabase";
import { useT } from "@/shared/lib/i18n";
import { Avatar, AvatarFallback, AvatarImage } from "@/shared/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/shared/ui/dropdown-menu";

interface UserMenuProps {
  session: Session;
}

export function UserMenu({ session }: UserMenuProps) {
  const tr = useT();
  const navigate = useNavigate();
  const [signingOut, setSigningOut] = useState(false);

  const meta = session.user.user_metadata as Record<string, unknown> | null;
  const name =
    (meta?.name as string | undefined) ??
    (meta?.full_name as string | undefined) ??
    session.user.email ??
    session.user.phone ??
    "?";
  const avatar = meta?.avatar_url as string | undefined;

  const initials = name
    .split(/\s+/)
    .map((s) => s[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();

  async function handleSignOut() {
    setSigningOut(true);
    await getSupabase().auth.signOut();
    navigate("/");
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          disabled={signingOut}
          aria-label={tr("auth.menu.aria")}
          className="rounded-full ring-offset-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ganitel-primary"
        >
          <Avatar className="size-8">
            {avatar ? <AvatarImage src={avatar} alt={name} /> : null}
            <AvatarFallback className="text-xs">{initials}</AvatarFallback>
          </Avatar>
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-44">
        <DropdownMenuItem asChild>
          <Link to="/profile">{tr("nav.profile")}</Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link to="/bookings">{tr("nav.bookings")}</Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={handleSignOut}
          className="text-red-600 focus:text-red-600"
        >
          {signingOut ? tr("common.loading") : tr("common.signout")}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
