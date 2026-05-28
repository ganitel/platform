import { useMutation } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router";

import { createProperty } from "@/features/properties/api";
import { HotelForm } from "@/features/properties/components/hotel-form";
import type { PropertyCreateInput } from "@/features/properties/types";
import { AdminGuard } from "@/shared/components/admin-guard";
import type { UploaderItem } from "@/shared/components/media-uploader.types";
import {
  localeFromAcceptLanguage,
  t,
  type TranslationKey,
  useT,
} from "@/shared/lib/i18n";
import type { Route } from "./+types/admin.hotels.new";

const k = (key: string) => key as TranslationKey;

export async function loader({ request }: Route.LoaderArgs) {
  return {
    locale: localeFromAcceptLanguage(request.headers.get("Accept-Language")),
  };
}

export const meta: Route.MetaFunction = ({ data }) => [
  { title: t(k("admin.hotels.new.meta.title"), data?.locale ?? "fr") },
  { name: "robots", content: "noindex" },
];

export default function AdminHotelsNewRoute() {
  return (
    <AdminGuard>
      <AdminHotelsNewPage />
    </AdminGuard>
  );
}

function AdminHotelsNewPage() {
  const tr = useT();
  const navigate = useNavigate();
  const draftId = useMemo(() => crypto.randomUUID(), []);
  const [mediaItems, setMediaItems] = useState<UploaderItem[]>([]);
  const create = useMutation({
    mutationFn: (body: PropertyCreateInput) => createProperty(body),
    onSuccess: (created) => navigate(`/admin/hotels/${created.id}/rooms`),
  });

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <header className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-ganitel-text-title">
            {tr(k("admin.hotels.new.title"))}
          </h1>
          <p className="mt-1 text-sm text-ganitel-text-body">
            {tr(k("admin.hotels.new.subtitle"))}
          </p>
        </div>
        <Link
          to="/admin/hotels"
          className="text-sm text-ganitel-text-body hover:underline"
        >
          {tr("common.back")}
        </Link>
      </header>

      <HotelForm
        initial={null}
        submitLabel={tr(k("admin.hotels.new.submit"))}
        pendingLabel={tr(k("admin.hotels.new.submitting"))}
        isPending={create.isPending}
        error={create.error}
        onSubmit={(payload) => create.mutate(payload)}
        mediaState={{
          mode: "draft",
          draftId,
          items: mediaItems,
          setItems: setMediaItems,
        }}
      />
    </div>
  );
}
