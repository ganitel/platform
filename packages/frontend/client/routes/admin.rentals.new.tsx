import { useMutation } from "@tanstack/react-query";
import { Link, useNavigate } from "react-router";

import { createProperty } from "@/features/properties/api";
import { RentalForm } from "@/features/properties/components/rental-form";
import type { PropertyCreateInput } from "@/features/properties/types";
import { AdminGuard } from "@/shared/components/admin-guard";
import type { Route } from "./+types/admin.rentals.new";

export const meta: Route.MetaFunction = () => [
  { title: "Admin — Nouvel hébergement" },
  { name: "robots", content: "noindex" },
];

export default function AdminRentalsNewRoute() {
  return (
    <AdminGuard>
      <AdminRentalsNewPage />
    </AdminGuard>
  );
}

function AdminRentalsNewPage() {
  const navigate = useNavigate();
  const create = useMutation({
    mutationFn: (body: PropertyCreateInput) => createProperty(body),
    onSuccess: () => navigate("/admin/rentals"),
  });

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <header className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-ganitel-text-title">
            Nouvel hébergement
          </h1>
          <p className="mt-1 text-sm text-ganitel-text-body">
            Création d’un brouillon. Les photos sont attachées séparément avant
            publication.
          </p>
        </div>
        <Link
          to="/admin/rentals"
          className="text-sm text-ganitel-text-body hover:underline"
        >
          ← Retour
        </Link>
      </header>

      <RentalForm
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
