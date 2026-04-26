/**
 * Public app shell — header, footer, bottom-nav. Authed/anonymous routes that
 * share this chrome live underneath. The bare auth pages (sign-in/sign-up)
 * are siblings of this layout, not children.
 */
import { Outlet } from "react-router";

import { Header } from "@/shared/components/header";
import { BottomNav } from "@/shared/components/bottom-nav";

export default function AppShell() {
  return (
    <div className="flex min-h-screen flex-col bg-ganitel-paper">
      <Header />
      <main className="flex-1 pb-24 md:pb-0">
        <Outlet />
      </main>
      <BottomNav />
    </div>
  );
}
