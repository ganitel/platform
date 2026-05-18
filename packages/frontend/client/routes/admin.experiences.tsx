import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router";

import {
  listAdminExperiences,
  publishExperience,
  removeExperience,
  unpublishExperience,
} from "@/features/experiences/api";
import type {
  ExperienceAdminListItem,
  ExperienceStatus,
} from "@/features/experiences/types";
import { AdminGuard } from "@/shared/components/admin-guard";
import type { Route } from "./+types/admin.experiences";

export const meta: Route.MetaFunction = () => [
  { title: "Admin — Expériences" },
  { name: "robots", content: "noindex" },
];

const adminExperiencesKey = ["admin", "experiences"] as const;

const STATUS_LABEL: Record<ExperienceStatus, string> = {
  draft: "Brouillon",
  published: "Publié",
  unlisted: "Masqué",
  removed: "Supprimé",
};

const STATUS_CLASS: Record<ExperienceStatus, string> = {
  draft: "bg-yellow-100 text-yellow-800",
  published: "bg-green-100 text-green-800",
  unlisted: "bg-gray-200 text-gray-700",
  removed: "bg-red-100 text-red-800",
};

export default function AdminExperiencesRoute() {
  return (
    <AdminGuard>
      <AdminExperiencesPage />
    </AdminGuard>
  );
}

function AdminExperiencesPage() {
  const query = useQuery({
    queryKey: adminExperiencesKey,
    queryFn: listAdminExperiences,
  });

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <header className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-ganitel-text-title">
            Expériences
          </h1>
          <p className="mt-1 text-sm text-ganitel-text-body">
            Backoffice Ganitel — toutes les expériences, tous statuts confondus.
          </p>
        </div>
        <div className="flex gap-2">
          <Link
            to="/admin"
            className="rounded-xl border border-ganitel-stroke-neutral px-4 py-2 text-sm font-medium text-ganitel-text-body hover:bg-ganitel-neutral-1"
          >
            ← Backoffice
          </Link>
          <Link
            to="/admin/experiences/new"
            className="rounded-xl bg-ganitel-secondary px-4 py-2 text-sm font-medium text-white hover:opacity-90"
          >
            Ajouter une expérience
          </Link>
        </div>
      </header>

      {query.isPending ? (
        <p className="text-sm text-ganitel-text-body">Chargement…</p>
      ) : query.isError ? (
        <p className="text-sm text-red-600">
          Erreur de chargement: {String(query.error)}
        </p>
      ) : query.data.items.length === 0 ? (
        <p className="text-sm text-ganitel-text-body">
          Aucune expérience pour le moment.
        </p>
      ) : (
        <ExperienceTable items={query.data.items} />
      )}
    </div>
  );
}

function ExperienceTable({ items }: { items: ExperienceAdminListItem[] }) {
  return (
    <div className="overflow-x-auto rounded-xl border border-ganitel-stroke-neutral">
      <table className="w-full text-sm">
        <thead className="bg-ganitel-neutral-1 text-left text-xs uppercase tracking-wide text-ganitel-text-body">
          <tr>
            <th className="px-4 py-3">Titre</th>
            <th className="px-4 py-3">Ville</th>
            <th className="px-4 py-3">Type</th>
            <th className="px-4 py-3">Durée</th>
            <th className="px-4 py-3">Prix</th>
            <th className="px-4 py-3">Statut</th>
            <th className="px-4 py-3 text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-ganitel-stroke-neutral">
          {items.map((item) => (
            <ExperienceRow key={item.id} item={item} />
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ExperienceRow({ item }: { item: ExperienceAdminListItem }) {
  const qc = useQueryClient();
  const invalidate = () =>
    qc.invalidateQueries({ queryKey: adminExperiencesKey });

  const publish = useMutation({
    mutationFn: () => publishExperience(item.id),
    onSuccess: invalidate,
  });
  const unpublish = useMutation({
    mutationFn: () => unpublishExperience(item.id),
    onSuccess: invalidate,
  });
  const remove = useMutation({
    mutationFn: () => removeExperience(item.id),
    onSuccess: invalidate,
  });

  const isBusy = publish.isPending || unpublish.isPending || remove.isPending;
  const lastError = publish.error ?? unpublish.error ?? remove.error ?? null;

  return (
    <tr className={isBusy ? "opacity-60" : undefined}>
      <td className="px-4 py-3 font-medium text-ganitel-text-title">
        {item.title}
      </td>
      <td className="px-4 py-3">
        {item.city}, {item.country_code}
      </td>
      <td className="px-4 py-3">{item.experience_type}</td>
      <td className="px-4 py-3">{item.duration_minutes} min</td>
      <td className="px-4 py-3">
        {item.base_price.amount} {item.base_price.currency}
      </td>
      <td className="px-4 py-3">
        <span
          className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_CLASS[item.status]}`}
        >
          {STATUS_LABEL[item.status]}
        </span>
      </td>
      <td className="px-4 py-3">
        <div className="flex justify-end gap-2">
          {(item.status === "draft" || item.status === "unlisted") && (
            <button
              type="button"
              onClick={() => publish.mutate()}
              disabled={isBusy}
              className="rounded-lg border border-green-600 px-3 py-1 text-xs font-medium text-green-700 hover:bg-green-50 disabled:opacity-50"
            >
              Publier
            </button>
          )}
          {item.status === "published" && (
            <button
              type="button"
              onClick={() => unpublish.mutate()}
              disabled={isBusy}
              className="rounded-lg border border-gray-600 px-3 py-1 text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            >
              Masquer
            </button>
          )}
          {item.status !== "removed" && (
            <button
              type="button"
              onClick={() => {
                if (confirm(`Supprimer "${item.title}" ?`)) remove.mutate();
              }}
              disabled={isBusy}
              className="rounded-lg border border-red-600 px-3 py-1 text-xs font-medium text-red-700 hover:bg-red-50 disabled:opacity-50"
            >
              Supprimer
            </button>
          )}
        </div>
        {lastError && (
          <p className="mt-1 text-right text-xs text-red-600">
            {String(lastError)}
          </p>
        )}
      </td>
    </tr>
  );
}
