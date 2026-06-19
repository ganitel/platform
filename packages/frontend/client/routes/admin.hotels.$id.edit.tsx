import { useMutation, useQuery } from "@tanstack/react-query";
import { useCallback, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router";

import { getProperty, updateProperty } from "@/features/properties/api";
import { HotelForm } from "@/features/properties/components/hotel-form";
import { RoomTypeManager } from "@/features/properties/components/room-type-manager";
import type {
  PropertyCreateInput,
  PropertyDetail,
} from "@/features/properties/types";
import { AdminGuard } from "@/shared/components/admin-guard";
import {
  itemFromServerMedia,
  type UploaderItem,
} from "@/shared/components/media-uploader.types";
import { translateApiError } from "@/shared/lib/form-error";
import { localeFromAcceptLanguage, t, useT } from "@/shared/lib/i18n";
import type { Route } from "./+types/admin.hotels.$id.edit";

export async function loader({ request }: Route.LoaderArgs) {
  return {
    locale: localeFromAcceptLanguage(request.headers.get("Accept-Language")),
  };
}

export const meta: Route.MetaFunction = ({ loaderData }) => [
  { title: t("admin.hotels.edit.meta.title", loaderData?.locale ?? "fr") },
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
  const { hash } = useLocation();

  const detail = useQuery({
    queryKey: ["properties", "detail", id],
    queryFn: () => getProperty(id!),
    enabled: !!id,
  });

  // The section mounts only after the query resolves, which is too late for
  // ScrollRestoration's hash handling — scroll when the node appears instead.
  const scrollToRoomsOnMount = useCallback(
    (node: HTMLElement | null) => {
      if (node && hash === "#rooms") node.scrollIntoView();
    },
    [hash],
  );

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <header className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-ganitel-text-title">
            {tr("admin.hotels.edit.title")}
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
          {translateApiError(detail.error, tr)}
        </p>
      ) : (
        <>
          <HotelEditFormContainer key={detail.data.id} detail={detail.data} />
          <section
            id="rooms"
            ref={scrollToRoomsOnMount}
            className="mt-12 scroll-mt-8"
          >
            <h2 className="text-xl font-semibold text-ganitel-text-title">
              {tr("admin.hotels.rooms.title")}
            </h2>
            <p className="mt-1 mb-6 text-sm text-ganitel-text-body">
              {tr("admin.hotels.rooms.description")}
            </p>
            <RoomTypeManager propertyId={detail.data.id} />
          </section>
        </>
      )}
    </div>
  );
}

function HotelEditFormContainer({ detail }: { detail: PropertyDetail }) {
  const tr = useT();
  const navigate = useNavigate();
  const [mediaItems, setMediaItems] = useState<UploaderItem[]>(() =>
    detail.media.map((m) => itemFromServerMedia(m)),
  );
  const update = useMutation({
    mutationFn: (body: PropertyCreateInput) => updateProperty(detail.id, body),
    onSuccess: () => navigate("/admin/hotels"),
  });
  return (
    <HotelForm
      initial={detail}
      submitLabel={tr("admin.hotels.edit.submit")}
      pendingLabel={tr("admin.hotels.edit.submitting")}
      isPending={update.isPending}
      error={update.error}
      onSubmit={(payload) => update.mutate(payload)}
      mediaState={{
        mode: "listing",
        listingId: detail.id,
        items: mediaItems,
        setItems: setMediaItems,
      }}
    />
  );
}
