import type { ReactNode } from "react";
import { Navigate } from "react-router";

import { useMe } from "@/features/auth/hooks/use-me";
import { useSession } from "@/lib/supabase";

interface AdminGuardProps {
  children: ReactNode;
}

export function AdminGuard({ children }: AdminGuardProps) {
  const { session, isPending: sessionPending } = useSession();
  const { data, isPending: meIsPending, isError } = useMe();

  if (sessionPending) return <Loader />;
  if (!session) return <Navigate to="/sign-in" replace />;
  if (meIsPending) return <Loader />;
  if (isError || !data?.is_admin) return <Navigate to="/" replace />;

  return <>{children}</>;
}

function Loader() {
  return (
    <div className="flex min-h-screen items-center justify-center text-sm text-ganitel-text-body">
      Chargement…
    </div>
  );
}
