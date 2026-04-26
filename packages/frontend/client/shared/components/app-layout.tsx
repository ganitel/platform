import { Outlet } from "react-router-dom";

import { Header } from "@/shared/components/header";
import { BottomNav } from "@/shared/components/bottom-nav";

export function AppLayout() {
  return (
    <div className="flex min-h-screen flex-col bg-ganitel-background-secondary">
      <Header />
      <main className="flex-1 pb-24 md:pb-0">
        <Outlet />
      </main>
      <BottomNav />
    </div>
  );
}
