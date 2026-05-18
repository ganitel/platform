import type { ReactNode } from "react";
import { Navigate } from "react-router";

import { useMe } from "@/features/auth/hooks/use-me";

interface AdminGuardProps {
  children: ReactNode;
}

export function AdminGuard({ children }: AdminGuardProps) {
  const { data, isPending, isError } = useMe();
  if (isPending) {
    return (
      <div className="flex min-h-screen items-center justify-center text-sm text-ganitel-text-body">
        Chargement…
      </div>
    );
  }
  if (isError || !data?.is_admin) {
    return <Navigate to="/" replace />;
  }
  return <>{children}</>;
}
