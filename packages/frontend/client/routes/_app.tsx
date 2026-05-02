/**
 * Public app shell — header, main, footer, mobile bottom-nav. Every public
 * page (landing, browse, bookings, profile, properties detail) renders
 * inside this layout. Bare auth pages (sign-in/sign-up) are siblings.
 */
import { Outlet } from "react-router";

import { Header } from "@/shared/components/header";
import { Footer } from "@/shared/components/footer";
import { BottomNav } from "@/shared/components/bottom-nav";

export default function AppShell() {
  return (
    <div className="flex min-h-screen flex-col bg-ganitel-paper">
      <Header />
      {/*
       * pb-28 on mobile reserves space for the fixed bottom nav (56px) plus
       * env(safe-area-inset-bottom) on notched devices. md:pb-0 removes it
       * once the bottom nav is hidden (md:hidden).
       */}
      <main className="flex-1 pb-28 md:pb-0">
        <Outlet />
      </main>
      <Footer />
      <BottomNav />
    </div>
  );
}
