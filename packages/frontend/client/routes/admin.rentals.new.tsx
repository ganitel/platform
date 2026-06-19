import { useMutation } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router";

import { createProperty } from "@/features/properties/api";
import { RentalForm } from "@/features/properties/components/rental-form";
import type { PropertyCreateInput } from "@/features/properties/types";
import { AdminGuard } from "@/shared/components/admin-guard";
import type { UploaderItem } from "@/shared/components/media-uploader.types";
import { localeFromAcceptLanguage, t, useT } from "@/shared/lib/i18n";
import type { Route } from "./+types/admin.rentals.new";

export async function loader({ request }: Route.LoaderArgs) {
  return {
    locale: localeFromAcceptLanguage(request.headers.get("Accept-Language")),
  };
}

export const meta: Route.MetaFunction = ({ loaderData }) => [
  { title: t("admin.rentals.new.meta.title", loaderData?.locale ?? "fr") },
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
  const tr = useT();
  const navigate = useNavigate();
  const draftId = useMemo(() => crypto.randomUUID(), []);
  const [mediaItems, setMediaItems] = useState<UploaderItem[]>([]);
  const create = useMutation({
    mutationFn: (body: PropertyCreateInput) => createProperty(body),
    onSuccess: () => navigate("/admin/rentals"),
  });

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <header className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-ganitel-text-title">
            {tr("admin.rentals.new.title")}
          </h1>
          <p className="mt-1 text-sm text-ganitel-text-body">
            {tr("admin.rentals.new.subtitle")}
          </p>
        </div>
        <Link
          to="/admin/rentals"
          className="text-sm text-ganitel-text-body hover:underline"
        >
          {tr("common.back")}
        </Link>
      </header>

      <RentalForm
        initial={null}
        submitLabel={tr("admin.rentals.new.submit")}
        pendingLabel={tr("admin.rentals.new.submitting")}
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
