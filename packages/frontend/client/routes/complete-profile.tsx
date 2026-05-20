import { redirect } from "react-router";
import { useState } from "react";
import { useNavigate } from "react-router";

import type { Route } from "./+types/complete-profile";

import { AuthLayout } from "@/features/auth/components/auth-layout";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import {
  getServerToken,
  serverFetch,
  ServerApiError,
} from "@/shared/api/server";
import type { UserMe } from "@/features/auth/api/me";
import { apiClient } from "@/shared/api/client";
import { getSupabase } from "@/lib/supabase";

export const meta: Route.MetaFunction = () => [
  { title: "Compléter votre profil — Ganitel" },
  { name: "robots", content: "noindex" },
];

export async function loader({ request }: Route.LoaderArgs) {
  const token = await getServerToken(request);
  if (!token) return redirect("/sign-in");
  try {
    const me = await serverFetch<UserMe>("/me", { token });
    if (me.display_name) return redirect("/");
  } catch (error) {
    if (error instanceof ServerApiError && error.status === 401) {
      return redirect("/sign-in");
    }
    // Non-auth failure: render the form so the user can still attempt PATCH /me
    // and see the real error rather than an opaque 500.
  }
  return null;
}

export default function CompleteProfilePage() {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const trimmed = name.trim();
      await apiClient.patch("/me", { display_name: trimmed });
      await getSupabase().auth.updateUser({ data: { name: trimmed } });
      navigate("/");
    } catch {
      setError("Une erreur s'est produite. Réessayez.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthLayout title="Presque prêt" subtitle="Votre profil">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="name">Votre prénom ou nom</Label>
          <Input
            id="name"
            type="text"
            placeholder="Ex. Daniel Mvondo"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="h-11"
          />
        </div>

        {error && <p className="text-sm text-red-500">{error}</p>}

        <Button
          type="submit"
          disabled={loading || !name.trim()}
          className="h-11 w-full rounded-xl bg-ganitel-primary text-ganitel-text-button hover:bg-ganitel-primary/90"
        >
          {loading ? "Enregistrement…" : "Continuer"}
        </Button>
      </form>
    </AuthLayout>
  );
}
