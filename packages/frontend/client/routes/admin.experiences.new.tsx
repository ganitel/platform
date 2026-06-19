import { useMutation } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router";

import { createExperience } from "@/features/experiences/api";
import { ExperienceForm } from "@/features/experiences/components/experience-form";
import type { ExperienceCreateInput } from "@/features/experiences/types";
import { AdminGuard } from "@/shared/components/admin-guard";
import type { UploaderItem } from "@/shared/components/media-uploader.types";
import { localeFromAcceptLanguage, t, useT } from "@/shared/lib/i18n";
import type { Route } from "./+types/admin.experiences.new";

export async function loader({ request }: Route.LoaderArgs) {
  return {
    locale: localeFromAcceptLanguage(request.headers.get("Accept-Language")),
  };
}

export const meta: Route.MetaFunction = ({ loaderData }) => [
  { title: t("admin.experiences.new.meta.title", loaderData?.locale ?? "fr") },
  { name: "robots", content: "noindex" },
];

export default function AdminExperiencesNewRoute() {
  return (
    <AdminGuard>
      <AdminExperiencesNewPage />
    </AdminGuard>
  );
}

function AdminExperiencesNewPage() {
  const tr = useT();
  const navigate = useNavigate();
  const draftId = useMemo(() => crypto.randomUUID(), []);
  const [mediaItems, setMediaItems] = useState<UploaderItem[]>([]);
  const create = useMutation({
    mutationFn: (body: ExperienceCreateInput) => createExperience(body),
    onSuccess: () => navigate("/admin/experiences"),
  });

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <header className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-ganitel-text-title">
            {tr("admin.experiences.new.title")}
          </h1>
          <p className="mt-1 text-sm text-ganitel-text-body">
            {tr("admin.experiences.new.subtitle")}
          </p>
        </div>
        <Link
          to="/admin/experiences"
          className="text-sm text-ganitel-text-body hover:underline"
        >
          {tr("common.back")}
        </Link>
      </header>

      <ExperienceForm
        initial={null}
        submitLabel={tr("admin.experiences.new.submit")}
        pendingLabel={tr("admin.experiences.new.submitting")}
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
