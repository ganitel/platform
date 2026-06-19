import { useMutation, useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router";

import { getExperience, updateExperience } from "@/features/experiences/api";
import { ExperienceForm } from "@/features/experiences/components/experience-form";
import type { ExperienceCreateInput } from "@/features/experiences/types";
import { AdminGuard } from "@/shared/components/admin-guard";
import {
  itemFromServerMedia,
  type UploaderItem,
} from "@/shared/components/media-uploader.types";
import { translateApiError } from "@/shared/lib/form-error";
import { localeFromAcceptLanguage, t, useT } from "@/shared/lib/i18n";
import type { Route } from "./+types/admin.experiences.$id.edit";

export async function loader({ request }: Route.LoaderArgs) {
  return {
    locale: localeFromAcceptLanguage(request.headers.get("Accept-Language")),
  };
}

export const meta: Route.MetaFunction = ({ loaderData }) => [
  { title: t("admin.experiences.edit.meta.title", loaderData?.locale ?? "fr") },
  { name: "robots", content: "noindex" },
];

export default function AdminExperiencesEditRoute() {
  return (
    <AdminGuard>
      <AdminExperiencesEditPage />
    </AdminGuard>
  );
}

function AdminExperiencesEditPage() {
  const tr = useT();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const detail = useQuery({
    queryKey: ["experiences", "detail", id],
    queryFn: () => getExperience(id!),
    enabled: !!id,
  });

  const [mediaItems, setMediaItems] = useState<UploaderItem[]>([]);
  const [seededId, setSeededId] = useState<string | null>(null);
  if (detail.data && seededId !== detail.data.id) {
    setSeededId(detail.data.id);
    setMediaItems(detail.data.media.map((m) => itemFromServerMedia(m)));
  }

  const update = useMutation({
    mutationFn: (body: ExperienceCreateInput) => updateExperience(id!, body),
    onSuccess: () => navigate("/admin/experiences"),
  });

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <header className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-ganitel-text-title">
            {tr("admin.experiences.edit.title")}
          </h1>
          {detail.data && (
            <p className="mt-1 text-sm text-ganitel-text-body">
              {detail.data.title}
            </p>
          )}
        </div>
        <Link
          to="/admin/experiences"
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
        <ExperienceForm
          initial={detail.data}
          submitLabel={tr("admin.experiences.edit.submit")}
          pendingLabel={tr("admin.experiences.edit.submitting")}
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
