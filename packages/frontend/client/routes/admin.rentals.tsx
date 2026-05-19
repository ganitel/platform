import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Link } from "react-router";

import {
  listAdminProperties,
  publishProperty,
  removeProperty,
  unpublishProperty,
} from "@/features/properties/api";
import type {
  PropertyAdminListItem,
  PropertyStatus,
} from "@/features/properties/types";
import { AdminGuard } from "@/shared/components/admin-guard";
import type { Route } from "./+types/admin.rentals";

export const meta: Route.MetaFunction = () => [
  { title: "Admin — Hébergements" },
  { name: "robots", content: "noindex" },
];

const PAGE_SIZE = 50;
const adminRentalsKey = (offset: number) =>
  ["admin", "rentals", { offset, limit: PAGE_SIZE }] as const;

const STATUS_LABEL: Record<PropertyStatus, string> = {
  draft: "Brouillon",
  published: "Publié",
  unlisted: "Masqué",
  removed: "Supprimé",
};

const STATUS_CLASS: Record<PropertyStatus, string> = {
  draft: "bg-yellow-100 text-yellow-800",
  published: "bg-green-100 text-green-800",
  unlisted: "bg-gray-200 text-gray-700",
  removed: "bg-red-100 text-red-800",
};

export default function AdminRentalsRoute() {
  return (
    <AdminGuard>
      <AdminRentalsPage />
    </AdminGuard>
  );
}

function AdminRentalsPage() {
  const [offset, setOffset] = useState(0);
  const query = useQuery({
    queryKey: adminRentalsKey(offset),
    queryFn: () => listAdminProperties({ limit: PAGE_SIZE, offset }),
  });

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <header className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-ganitel-text-title">
            Hébergements
          </h1>
          <p className="mt-1 text-sm text-ganitel-text-body">
            Backoffice Ganitel — tous les hébergements, tous statuts confondus.
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
            to="/admin/rentals/new"
            className="rounded-xl bg-ganitel-secondary px-4 py-2 text-sm font-medium text-white hover:opacity-90"
          >
            Ajouter un hébergement
          </Link>
        </div>
      </header>

      {query.isPending ? (
        <p className="text-sm text-ganitel-text-body">Chargement…</p>
      ) : query.isError ? (
        <p className="text-sm text-red-600">
          Erreur de chargement:{" "}
          {query.error instanceof Error
            ? query.error.message
            : String(query.error)}
        </p>
      ) : query.data.total === 0 ? (
        <p className="text-sm text-ganitel-text-body">
          Aucun hébergement pour le moment.
        </p>
      ) : (
        <>
          <RentalTable items={query.data.items} offset={offset} />
          <Pagination
            offset={offset}
            limit={query.data.limit}
            total={query.data.total}
            shown={query.data.items.length}
            onOffsetChange={setOffset}
          />
        </>
      )}
    </div>
  );
}

function Pagination({
  offset,
  limit,
  total,
  shown,
  onOffsetChange,
}: {
  offset: number;
  limit: number;
  total: number;
  shown: number;
  onOffsetChange: (n: number) => void;
}) {
  const from = total === 0 ? 0 : offset + 1;
  const to = offset + shown;
  const hasPrev = offset > 0;
  const hasNext = to < total;
  return (
    <div className="mt-4 flex items-center justify-between text-sm text-ganitel-text-body">
      <span>
        {from}–{to} sur {total}
      </span>
      <div className="flex gap-2">
        <button
          type="button"
          disabled={!hasPrev}
          onClick={() => onOffsetChange(Math.max(0, offset - limit))}
          className="rounded-lg border border-ganitel-stroke-neutral px-3 py-1 text-xs font-medium hover:bg-ganitel-neutral-1 disabled:cursor-not-allowed disabled:opacity-50"
        >
          ← Précédent
        </button>
        <button
          type="button"
          disabled={!hasNext}
          onClick={() => onOffsetChange(offset + limit)}
          className="rounded-lg border border-ganitel-stroke-neutral px-3 py-1 text-xs font-medium hover:bg-ganitel-neutral-1 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Suivant →
        </button>
      </div>
    </div>
  );
}

function RentalTable({
  items,
  offset,
}: {
  items: PropertyAdminListItem[];
  offset: number;
}) {
  return (
    <div className="overflow-x-auto rounded-xl border border-ganitel-stroke-neutral">
      <table className="w-full text-sm">
        <thead className="bg-ganitel-neutral-1 text-left text-xs uppercase tracking-wide text-ganitel-text-body">
          <tr>
            <th className="px-4 py-3">Titre</th>
            <th className="px-4 py-3">Ville</th>
            <th className="px-4 py-3">Type</th>
            <th className="px-4 py-3">Prix</th>
            <th className="px-4 py-3">Statut</th>
            <th className="px-4 py-3 text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-ganitel-stroke-neutral">
          {items.map((item) => (
            <RentalRow key={item.id} item={item} offset={offset} />
          ))}
        </tbody>
      </table>
    </div>
  );
}

function RentalRow({
  item,
  offset,
}: {
  item: PropertyAdminListItem;
  offset: number;
}) {
  const qc = useQueryClient();
  const invalidate = () =>
    qc.invalidateQueries({ queryKey: adminRentalsKey(offset) });

  const publish = useMutation({
    mutationFn: () => publishProperty(item.id),
    onSuccess: invalidate,
  });
  const unpublish = useMutation({
    mutationFn: () => unpublishProperty(item.id),
    onSuccess: invalidate,
  });
  const remove = useMutation({
    mutationFn: () => removeProperty(item.id),
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
      <td className="px-4 py-3">{item.property_type}</td>
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
          <Link
            to={`/admin/rentals/${item.id}/edit`}
            className="rounded-lg border border-ganitel-stroke-neutral px-3 py-1 text-xs font-medium text-ganitel-text-body hover:bg-ganitel-neutral-1"
          >
            Modifier
          </Link>
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
            {lastError instanceof Error ? lastError.message : String(lastError)}
          </p>
        )}
      </td>
    </tr>
  );
}
