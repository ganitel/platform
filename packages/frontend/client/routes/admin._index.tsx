import { Link } from "react-router";

import { AdminGuard } from "@/shared/components/admin-guard";
import type { Route } from "./+types/admin._index";

export const meta: Route.MetaFunction = () => [
  { title: "Admin — Ganitel" },
  { name: "robots", content: "noindex" },
];

export default function AdminIndexRoute() {
  return (
    <AdminGuard>
      <AdminIndexPage />
    </AdminGuard>
  );
}

function AdminIndexPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <header className="mb-8">
        <h1 className="text-2xl font-semibold text-ganitel-text-title">
          Backoffice
        </h1>
        <p className="mt-1 text-sm text-ganitel-text-body">
          Outils internes Ganitel.
        </p>
      </header>
      <nav className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Link
          to="/admin/rentals"
          className="rounded-2xl border border-ganitel-stroke-neutral bg-white p-6 hover:border-ganitel-secondary"
        >
          <h2 className="text-lg font-semibold text-ganitel-text-title">
            Hébergements
          </h2>
          <p className="mt-1 text-sm text-ganitel-text-body">
            Ajouter, masquer ou supprimer des locations.
          </p>
        </Link>
        <Link
          to="/admin/experiences"
          className="rounded-2xl border border-ganitel-stroke-neutral bg-white p-6 hover:border-ganitel-secondary"
        >
          <h2 className="text-lg font-semibold text-ganitel-text-title">
            Expériences
          </h2>
          <p className="mt-1 text-sm text-ganitel-text-body">
            Ajouter, masquer ou supprimer des expériences.
          </p>
        </Link>
      </nav>
    </div>
  );
}
