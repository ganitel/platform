import { redirect } from "react-router";
import { useState } from "react";
import { useNavigate } from "react-router";

import type { Route } from "./+types/complete-profile";

import { AuthLayout } from "@/features/auth/components/auth-layout";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import { getServerToken } from "@/shared/api/server";
import { serverFetch } from "@/shared/api/server";
import type { UserMe } from "@/features/auth/api/me";
import { apiClient } from "@/shared/api/client";

export const meta: Route.MetaFunction = () => [
  { title: "Compléter votre profil — Ganitel" },
  { name: "robots", content: "noindex" },
];

export async function loader({ request }: Route.LoaderArgs) {
  const token = await getServerToken(request);
  if (!token) return redirect("/sign-in");
  const me = await serverFetch<UserMe>("/me", { token });
  // If display_name is already set, redirect away.
  if (me.display_name) return redirect("/");
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
      await apiClient.patch("/me", { display_name: name.trim() });
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
