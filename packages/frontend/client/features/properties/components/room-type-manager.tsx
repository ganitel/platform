import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { BedDouble, Pencil, Plus, Trash2, Users } from "lucide-react";
import { useMemo, useState } from "react";

import { ActionButton, AdminCard, EmptyState } from "@/features/admin/admin-ui";
import {
  createRoom,
  deleteRoom,
  listPropertyRooms,
  updateRoom,
} from "@/features/properties/api";
import { listBedTypes } from "@/features/reference/api";
import type {
  RoomTypeCreateInput,
  RoomTypePublic,
} from "@/features/properties/types";
import { RoomTypeForm } from "@/features/properties/components/room-type-form";
import {
  itemFromServerMedia,
  type UploaderItem,
} from "@/shared/components/media-uploader.types";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/shared/ui/sheet";
import { useLocale, useT } from "@/shared/lib/i18n";

interface RoomTypeManagerProps {
  propertyId: string;
}

type DrawerState =
  | { mode: "closed" }
  | { mode: "create" }
  | { mode: "edit"; room: RoomTypePublic };

const adminRoomsKey = (propertyId: string) =>
  ["admin", "rooms", propertyId] as const;

export function RoomTypeManager({ propertyId }: RoomTypeManagerProps) {
  const tr = useT();
  const [drawer, setDrawer] = useState<DrawerState>({ mode: "closed" });

  const rooms = useQuery({
    queryKey: adminRoomsKey(propertyId),
    queryFn: () => listPropertyRooms(propertyId),
  });

  if (rooms.isPending) {
    return (
      <AdminCard>
        <p className="px-6 py-12 text-center text-sm text-ganitel-text-subtitle">
          {tr("admin.state.loading")}
        </p>
      </AdminCard>
    );
  }
  if (rooms.isError) {
    return (
      <AdminCard>
        <p className="px-6 py-12 text-center text-sm text-red-600">
          {tr("admin.state.error_prefix")}{" "}
          {rooms.error instanceof Error
            ? rooms.error.message
            : String(rooms.error)}
        </p>
      </AdminCard>
    );
  }

  const items = rooms.data;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-end gap-2">
        <ActionButton
          tone="primary"
          icon={<Plus className="size-3.5" strokeWidth={2} />}
          onClick={() => setDrawer({ mode: "create" })}
        >
          {tr("admin.rooms.add")}
        </ActionButton>
      </div>

      {items.length === 0 ? (
        <EmptyState
          title={tr("admin.rooms.empty.title")}
          description={tr("admin.rooms.empty.description")}
          action={
            <ActionButton
              tone="primary"
              icon={<Plus className="size-3.5" strokeWidth={2} />}
              onClick={() => setDrawer({ mode: "create" })}
            >
              {tr("admin.rooms.add")}
            </ActionButton>
          }
        />
      ) : (
        <ul className="space-y-3" aria-label={tr("admin.rooms.list.aria")}>
          {items.map((room) => (
            <RoomRow
              key={room.id}
              room={room}
              propertyId={propertyId}
              onEdit={() => setDrawer({ mode: "edit", room })}
            />
          ))}
        </ul>
      )}

      <RoomDrawer
        state={drawer}
        propertyId={propertyId}
        onClose={() => setDrawer({ mode: "closed" })}
      />
    </div>
  );
}

interface RoomRowProps {
  room: RoomTypePublic;
  propertyId: string;
  onEdit: () => void;
}

function RoomRow({ room, propertyId, onEdit }: RoomRowProps) {
  const tr = useT();
  const queryClient = useQueryClient();

  const remove = useMutation({
    mutationFn: () => deleteRoom(propertyId, room.id),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: adminRoomsKey(propertyId) }),
  });

  const bedSummary = useBedSummary(room.bed_config);
  const inventoryLabel = tr("admin.rooms.inventory_label").replace(
    "{n}",
    String(room.inventory_count),
  );
  const guestsLabel = tr("admin.rooms.guests_label").replace(
    "{n}",
    String(room.max_guests),
  );

  return (
    <li className="rounded-2xl border border-ganitel-stroke-neutral bg-white p-4 shadow-[0_20px_40px_-40px_rgba(24,16,12,0.2)]">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-base font-semibold text-ganitel-text-title">
              {room.title}
            </h3>
            {!room.active && (
              <span className="rounded-full bg-ganitel-neutral-2 px-2 py-0.5 text-[11px] font-medium uppercase tracking-[0.16em] text-ganitel-text-placeholder">
                {tr("admin.rooms.inactive_tag")}
              </span>
            )}
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-ganitel-text-subtitle">
            {bedSummary && (
              <span className="inline-flex items-center gap-1.5">
                <BedDouble className="size-3.5" strokeWidth={1.75} />
                {bedSummary}
              </span>
            )}
            <span className="inline-flex items-center gap-1.5">
              <Users className="size-3.5" strokeWidth={1.75} />
              {guestsLabel}
            </span>
            <span className="inline-flex items-center rounded-full bg-ganitel-neutral-2 px-2 py-0.5 text-xs font-medium tabular-nums text-ganitel-text-subtitle">
              {inventoryLabel}
            </span>
          </div>
        </div>
        <div className="flex shrink-0 flex-wrap items-center gap-1.5">
          <ActionButton
            icon={<Pencil className="size-3.5" strokeWidth={1.75} />}
            onClick={onEdit}
            disabled={remove.isPending}
          >
            {tr("admin.action.edit")}
          </ActionButton>
          <ActionButton
            tone="danger"
            icon={<Trash2 className="size-3.5" strokeWidth={1.75} />}
            onClick={() => {
              const msg = tr("admin.rooms.confirm_delete").replace(
                "{title}",
                room.title,
              );
              if (confirm(msg)) remove.mutate();
            }}
            disabled={remove.isPending}
          >
            {tr("admin.action.delete")}
          </ActionButton>
        </div>
      </div>
      {remove.error ? (
        <p className="mt-2 text-right text-xs text-red-600">
          {remove.error instanceof Error
            ? remove.error.message
            : String(remove.error)}
        </p>
      ) : null}
    </li>
  );
}

interface RoomDrawerProps {
  state: DrawerState;
  propertyId: string;
  onClose: () => void;
}

function RoomDrawer({ state, propertyId, onClose }: RoomDrawerProps) {
  const tr = useT();
  const queryClient = useQueryClient();
  const open = state.mode !== "closed";
  const isEdit = state.mode === "edit";

  return (
    <Sheet
      open={open}
      onOpenChange={(next) => {
        if (!next) onClose();
      }}
    >
      <SheetContent
        side="right"
        className="w-full overflow-y-auto bg-ganitel-paper sm:max-w-2xl"
      >
        <SheetHeader>
          <SheetTitle>
            {isEdit
              ? tr("admin.rooms.drawer.edit_title")
              : tr("admin.rooms.drawer.add_title")}
          </SheetTitle>
        </SheetHeader>
        {open ? (
          <div className="mt-4">
            {state.mode === "create" && (
              <CreateRoomForm
                propertyId={propertyId}
                onSuccess={() => {
                  void queryClient.invalidateQueries({
                    queryKey: adminRoomsKey(propertyId),
                  });
                  onClose();
                }}
              />
            )}
            {state.mode === "edit" && (
              <EditRoomForm
                key={state.room.id}
                propertyId={propertyId}
                room={state.room}
                onSuccess={() => {
                  void queryClient.invalidateQueries({
                    queryKey: adminRoomsKey(propertyId),
                  });
                  onClose();
                }}
              />
            )}
          </div>
        ) : null}
      </SheetContent>
    </Sheet>
  );
}

function CreateRoomForm({
  propertyId,
  onSuccess,
}: {
  propertyId: string;
  onSuccess: () => void;
}) {
  const tr = useT();
  const draftId = useMemo(() => crypto.randomUUID(), []);
  const [mediaItems, setMediaItems] = useState<UploaderItem[]>([]);
  const mutation = useMutation({
    mutationFn: (body: RoomTypeCreateInput) => createRoom(propertyId, body),
    onSuccess,
  });
  return (
    <RoomTypeForm
      initial={null}
      submitLabel={tr("admin.rooms.submit_create")}
      pendingLabel={tr("admin.rooms.submitting_create")}
      isPending={mutation.isPending}
      error={mutation.error}
      onSubmit={(payload) => mutation.mutate(payload)}
      mediaState={{
        mode: "draft",
        draftId,
        items: mediaItems,
        setItems: setMediaItems,
      }}
    />
  );
}

function EditRoomForm({
  propertyId,
  room,
  onSuccess,
}: {
  propertyId: string;
  room: RoomTypePublic;
  onSuccess: () => void;
}) {
  const tr = useT();
  const [mediaItems, setMediaItems] = useState<UploaderItem[]>(() =>
    room.media.map((media) => itemFromServerMedia(media)),
  );
  const mutation = useMutation({
    mutationFn: (body: RoomTypeCreateInput) =>
      updateRoom(propertyId, room.id, body),
    onSuccess,
  });
  return (
    <RoomTypeForm
      initial={room}
      submitLabel={tr("admin.rooms.submit_update")}
      pendingLabel={tr("admin.rooms.submitting_update")}
      isPending={mutation.isPending}
      error={mutation.error}
      onSubmit={(payload) => {
        const { media_ids: _ignored, ...rest } = payload;
        mutation.mutate(rest);
      }}
      mediaState={{
        mode: "listing",
        listingId: room.id,
        items: mediaItems,
        setItems: setMediaItems,
      }}
    />
  );
}

function useBedSummary(
  bedConfig: { type: string; count: number }[] | null | undefined,
): string {
  const tr = useT();
  const locale = useLocale();
  const bedTypes = useQuery({
    queryKey: ["reference", "bed-types"],
    queryFn: listBedTypes,
  });
  const labelByCode = new Map(
    (bedTypes.data ?? []).map((option) => [option.code, option]),
  );
  return (bedConfig ?? [])
    .map((bed) => {
      const ref = labelByCode.get(bed.type);
      const label = ref
        ? locale === "en"
          ? ref.label_en
          : ref.label_fr
        : bed.type;
      return tr("admin.rooms.bed_summary.row")
        .replace("{count}", String(bed.count))
        .replace("{label}", label);
    })
    .join(" · ");
}
