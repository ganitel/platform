import { useMutation, useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router";

import { getProperty, updateProperty } from "@/features/properties/api";
import { HotelForm } from "@/features/properties/components/hotel-form";
import type { PropertyCreateInput } from "@/features/properties/types";
import { AdminGuard } from "@/shared/components/admin-guard";
import {
  itemFromServerMedia,
  type UploaderItem,
} from "@/shared/components/media-uploader.types";
import {
  localeFromAcceptLanguage,
  t,
  type TranslationKey,
  useT,
} from "@/shared/lib/i18n";
import type { Route } from "./+types/admin.hotels.$id.edit";

const k = (key: string) => key as TranslationKey;

export async function loader({ request }: Route.LoaderArgs) {
  return {
    locale: localeFromAcceptLanguage(request.headers.get("Accept-Language")),
  };
}

export const meta: Route.MetaFunction = ({ data }) => [
  { title: t(k("admin.hotels.edit.meta.title"), data?.locale ?? "fr") },
  { name: "robots", content: "noindex" },
];

export default function AdminHotelsEditRoute() {
  return (
    <AdminGuard>
      <AdminHotelsEditPage />
    </AdminGuard>
  );
}

function AdminHotelsEditPage() {
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
    onSuccess: () => navigate("/admin/hotels"),
  });

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <header className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-ganitel-text-title">
            {tr(k("admin.hotels.edit.title"))}
          </h1>
          {detail.data && (
            <p className="mt-1 text-sm text-ganitel-text-body">
              {detail.data.title}
            </p>
          )}
        </div>
        <Link
          to="/admin/hotels"
          className="text-sm text-ganitel-text-body hover:underline"
        >
          {tr("common.back")}
        </Link>
      </header>

      {detail.isPending ? (
        <p className="text-sm text-ganitel-text-body">{tr("common.loading")}</p>
      ) : detail.isError ? (
        <p className="text-sm text-red-600">
          {tr("common.load_error_prefix")}
          {": "}
          {detail.error instanceof Error
            ? detail.error.message
            : String(detail.error)}
        </p>
      ) : (
        <HotelForm
          initial={detail.data}
          submitLabel={tr(k("admin.hotels.edit.submit"))}
          pendingLabel={tr(k("admin.hotels.edit.submitting"))}
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
