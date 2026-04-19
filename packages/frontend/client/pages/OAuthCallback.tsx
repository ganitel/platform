import { useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuthContext } from "@/contexts/AuthContext";
import { Loader2 } from "lucide-react";

export default function OAuthCallback() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const auth = useAuthContext();
  const processed = useRef(false);

  useEffect(() => {
    if (processed.current) return;
    processed.current = true;

    const code = searchParams.get("code");
    if (!code) {
      navigate("/sign-in", { replace: true });
      return;
    }

    auth
      .handleGoogleCallback(code)
      .then(() => {
        navigate("/", { replace: true });
      })
      .catch(() => {
        navigate("/sign-in", { replace: true });
      });
  }, [searchParams, auth, navigate]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-ganitel-background-secondary">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-ganitel-primary" />
        <p className="text-sm text-ganitel-text-subtitle">Connexion en cours...</p>
      </div>
    </div>
  );
}
