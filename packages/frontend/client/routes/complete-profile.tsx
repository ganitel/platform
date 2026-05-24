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
import { localeFromAcceptLanguage, t, useT } from "@/shared/lib/i18n";

export const meta: Route.MetaFunction = ({ data }) => [
  { title: t("complete_profile.meta.title", data?.locale ?? "fr") },
  { name: "robots", content: "noindex" },
];

export async function loader({ request }: Route.LoaderArgs) {
  const locale = localeFromAcceptLanguage(
    request.headers.get("Accept-Language"),
  );
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
  return { locale };
}

export default function CompleteProfilePage() {
  const tr = useT();
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
      setError(tr("common.error.generic"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthLayout
      title={tr("complete_profile.title")}
      subtitle={tr("complete_profile.subtitle")}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="name">{tr("complete_profile.full_name.label")}</Label>
          <Input
            id="name"
            type="text"
            placeholder={tr("complete_profile.full_name.placeholder")}
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
          {loading
            ? tr("complete_profile.submitting")
            : tr("complete_profile.submit")}
        </Button>
      </form>
    </AuthLayout>
  );
}
