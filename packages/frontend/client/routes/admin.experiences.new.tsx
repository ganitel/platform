import { useMutation } from "@tanstack/react-query";
import { Link, useNavigate } from "react-router";

import { createExperience } from "@/features/experiences/api";
import { ExperienceForm } from "@/features/experiences/components/experience-form";
import type { ExperienceCreateInput } from "@/features/experiences/types";
import { AdminGuard } from "@/shared/components/admin-guard";
import type { Route } from "./+types/admin.experiences.new";

export const meta: Route.MetaFunction = () => [
  { title: "Admin — Nouvelle expérience" },
  { name: "robots", content: "noindex" },
];

export default function AdminExperiencesNewRoute() {
  return (
    <AdminGuard>
      <AdminExperiencesNewPage />
    </AdminGuard>
  );
}

function AdminExperiencesNewPage() {
  const navigate = useNavigate();
  const create = useMutation({
    mutationFn: (body: ExperienceCreateInput) => createExperience(body),
    onSuccess: () => navigate("/admin/experiences"),
  });

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <header className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-ganitel-text-title">
            Nouvelle expérience
          </h1>
          <p className="mt-1 text-sm text-ganitel-text-body">
            Création d’un brouillon. Les photos sont attachées séparément avant
            publication.
          </p>
        </div>
        <Link
          to="/admin/experiences"
          className="text-sm text-ganitel-text-body hover:underline"
        >
          ← Retour
        </Link>
      </header>

      <ExperienceForm
        initial={null}
        submitLabel="Créer le brouillon"
        pendingLabel="Création…"
        isPending={create.isPending}
        error={create.error}
        onSubmit={(payload) => create.mutate(payload)}
      />
    </div>
  );
}
