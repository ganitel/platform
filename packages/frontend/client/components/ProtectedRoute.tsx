import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Loader2 } from "lucide-react";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const { isAuthenticated, isLoadingUser } = useAuth();
  const location = useLocation();

  if (isLoadingUser) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="mt-4 text-muted-foreground animate-pulse">Chargement de votre session...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    // Stocker l'URL actuelle pour y revenir après authentification
    const returnUrl = encodeURIComponent(location.pathname + location.search);
    return <Navigate to={`/sign-in?returnUrl=${returnUrl}`} replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
