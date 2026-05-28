import { AdminShell } from "@/features/admin/admin-shell";
import { RoomTypeManager } from "@/features/properties/components/room-type-manager";
import { AdminGuard } from "@/shared/components/admin-guard";
import { localeFromAcceptLanguage, t, useT } from "@/shared/lib/i18n";
import type { Route } from "./+types/admin.hotels.$id.rooms";

export async function loader({ request, params }: Route.LoaderArgs) {
  return {
    locale: localeFromAcceptLanguage(request.headers.get("Accept-Language")),
    propertyId: params.id,
  };
}

export const meta: Route.MetaFunction = ({ data }) => [
  { title: t("admin.hotels.rooms.meta_title", data?.locale ?? "fr") },
  { name: "robots", content: "noindex" },
];

export default function Route({ loaderData }: Route.ComponentProps) {
  return (
    <AdminGuard>
      <Inner propertyId={loaderData.propertyId} />
    </AdminGuard>
  );
}

function Inner({ propertyId }: { propertyId: string }) {
  const tr = useT();
  return (
    <AdminShell
      eyebrow={tr("admin.hotels.rooms.eyebrow")}
      title={tr("admin.hotels.rooms.title")}
      description={tr("admin.hotels.rooms.description")}
    >
      <RoomTypeManager propertyId={propertyId} />
    </AdminShell>
  );
}
