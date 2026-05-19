import { useMutation, useQuery } from "@tanstack/react-query";
import { Link, useNavigate, useParams } from "react-router";

import { getExperience, updateExperience } from "@/features/experiences/api";
import { ExperienceForm } from "@/features/experiences/components/experience-form";
import type { ExperienceCreateInput } from "@/features/experiences/types";
import { AdminGuard } from "@/shared/components/admin-guard";
import type { Route } from "./+types/admin.experiences.$id.edit";

export const meta: Route.MetaFunction = () => [
  { title: "Admin — Modifier l’expérience" },
  { name: "robots", content: "noindex" },
];

export default function AdminExperiencesEditRoute() {
  return (
    <AdminGuard>
      <AdminExperiencesEditPage />
    </AdminGuard>
  );
}

function AdminExperiencesEditPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const detail = useQuery({
    queryKey: ["experiences", "detail", id],
    queryFn: () => getExperience(id!),
    enabled: !!id,
  });

  const update = useMutation({
    mutationFn: (body: ExperienceCreateInput) => updateExperience(id!, body),
    onSuccess: () => navigate("/admin/experiences"),
  });

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <header className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-ganitel-text-title">
            Modifier l’expérience
          </h1>
          {detail.data && (
            <p className="mt-1 text-sm text-ganitel-text-body">
              {detail.data.title}
            </p>
          )}
        </div>
        <Link
          to="/admin/experiences"
          className="text-sm text-ganitel-text-body hover:underline"
        >
          ← Retour
        </Link>
      </header>

      {detail.isPending ? (
        <p className="text-sm text-ganitel-text-body">Chargement…</p>
      ) : detail.isError ? (
        <p className="text-sm text-red-600">
          Erreur de chargement:{" "}
          {detail.error instanceof Error
            ? detail.error.message
            : String(detail.error)}
        </p>
      ) : (
        <ExperienceForm
          initial={detail.data}
          submitLabel="Enregistrer les modifications"
          pendingLabel="Enregistrement…"
          isPending={update.isPending}
          error={update.error}
          onSubmit={(payload) => update.mutate(payload)}
        />
      )}
    </div>
  );
}
