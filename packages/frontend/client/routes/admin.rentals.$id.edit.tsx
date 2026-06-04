import { useMutation, useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router";

import { getProperty, updateProperty } from "@/features/properties/api";
import { RentalForm } from "@/features/properties/components/rental-form";
import type { PropertyCreateInput } from "@/features/properties/types";
import { AdminGuard } from "@/shared/components/admin-guard";
import {
  itemFromServerMedia,
  type UploaderItem,
} from "@/shared/components/media-uploader.types";
import { translateApiError } from "@/shared/lib/form-error";
import { localeFromAcceptLanguage, t, useT } from "@/shared/lib/i18n";
import type { Route } from "./+types/admin.rentals.$id.edit";

export async function loader({ request }: Route.LoaderArgs) {
  return {
    locale: localeFromAcceptLanguage(request.headers.get("Accept-Language")),
  };
}

export const meta: Route.MetaFunction = ({ data }) => [
  { title: t("admin.rentals.edit.meta.title", data?.locale ?? "fr") },
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
  const tr = useT();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const detail = useQuery({
    queryKey: ["properties", "detail", id],
    queryFn: () => getProperty(id!),
    enabled: !!id,
  });

  const [mediaItems, setMediaItems] = useState<UploaderItem[]>([]);
  const [seededId, setSeededId] = useState<string | null>(null);
  if (detail.data && seededId !== detail.data.id) {
    setSeededId(detail.data.id);
    setMediaItems(detail.data.media.map((m) => itemFromServerMedia(m)));
  }

  const update = useMutation({
    mutationFn: (body: PropertyCreateInput) => updateProperty(id!, body),
    onSuccess: () => navigate("/admin/rentals"),
  });

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <header className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-ganitel-text-title">
            {tr("admin.rentals.edit.title")}
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
          {tr("common.back")}
        </Link>
      </header>

      {detail.isPending ? (
        <p className="text-sm text-ganitel-text-body">{tr("common.loading")}</p>
      ) : detail.isError ? (
        <p className="text-sm text-red-600">
          {translateApiError(detail.error, tr)}
        </p>
      ) : (
        <RentalForm
          initial={detail.data}
          submitLabel={tr("admin.rentals.edit.submit")}
          pendingLabel={tr("admin.rentals.edit.submitting")}
          isPending={update.isPending}
          error={update.error}
          onSubmit={(payload) => update.mutate(payload)}
          mediaState={{
            mode: "listing",
            listingId: id!,
            items: mediaItems,
            setItems: setMediaItems,
          }}
        />
      )}
    </div>
  );
}
