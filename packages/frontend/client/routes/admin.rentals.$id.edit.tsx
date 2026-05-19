import { useMutation, useQuery } from "@tanstack/react-query";
import { Link, useNavigate, useParams } from "react-router";

import { getProperty, updateProperty } from "@/features/properties/api";
import { RentalForm } from "@/features/properties/components/rental-form";
import type { PropertyCreateInput } from "@/features/properties/types";
import { AdminGuard } from "@/shared/components/admin-guard";
import type { Route } from "./+types/admin.rentals.$id.edit";

export const meta: Route.MetaFunction = () => [
  { title: "Admin — Modifier l’hébergement" },
  { name: "robots", content: "noindex" },
];

export default function AdminRentalsEditRoute() {
  return (
    <AdminGuard>
      <AdminRentalsEditPage />
    </AdminGuard>
  );
}

function AdminRentalsEditPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const detail = useQuery({
    queryKey: ["properties", "detail", id],
    queryFn: () => getProperty(id!),
    enabled: !!id,
  });

  const update = useMutation({
    mutationFn: (body: PropertyCreateInput) => updateProperty(id!, body),
    onSuccess: () => navigate("/admin/rentals"),
  });

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <header className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-ganitel-text-title">
            Modifier l’hébergement
          </h1>
          {detail.data && (
            <p className="mt-1 text-sm text-ganitel-text-body">
              {detail.data.title}
            </p>
          )}
        </div>
        <Link
          to="/admin/rentals"
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
        <RentalForm
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
