import {
  DndContext,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  rectSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useCallback, useEffect, useRef } from "react";

import {
  deleteDraftMedia,
  putToPresignedUrl,
  requestUpload,
} from "@/features/media/api";
import {
  ACCEPTED_IMAGE_MIMES,
  ACCEPTED_VIDEO_MIMES,
  MAX_IMAGE_BYTES,
  MAX_MEDIA_PER_LISTING,
  MAX_VIDEOS_PER_LISTING,
  MAX_VIDEO_BYTES,
  MAX_VIDEO_DURATION_MS,
  type MediaMimeType,
} from "@/features/media/types";
import { useT } from "@/shared/lib/i18n";

import { type UploaderItem, type UploaderProps } from "./media-uploader.types";

const ACCEPT_ATTR = [...ACCEPTED_IMAGE_MIMES, ...ACCEPTED_VIDEO_MIMES].join(
  ",",
);
const MAX_IMAGE_MB = Math.round(MAX_IMAGE_BYTES / (1024 * 1024));
const MAX_VIDEO_MB = Math.round(MAX_VIDEO_BYTES / (1024 * 1024));
const MAX_VIDEO_SECONDS = Math.round(MAX_VIDEO_DURATION_MS / 1000);

type Translator = ReturnType<typeof useT>;

function isImageMime(m: string): boolean {
  return (ACCEPTED_IMAGE_MIMES as readonly string[]).includes(m);
}

function isVideoMime(m: string): boolean {
  return (ACCEPTED_VIDEO_MIMES as readonly string[]).includes(m);
}

function rejectionReason(file: File, t: Translator): string | null {
  const isImg = isImageMime(file.type);
  const isVid = isVideoMime(file.type);
  if (!isImg && !isVid)
    return t("media_uploader.error.unsupported_format").replace(
      "{mime}",
      file.type || t("media_uploader.error.unknown_mime"),
    );
  if (isImg && file.size > MAX_IMAGE_BYTES)
    return t("media_uploader.error.image_too_large").replace(
      "{mb}",
      String(MAX_IMAGE_MB),
    );
  if (isVid && file.size > MAX_VIDEO_BYTES)
    return t("media_uploader.error.video_too_large").replace(
      "{mb}",
      String(MAX_VIDEO_MB),
    );
  return null;
}

function newLocalId(): string {
  return `loc-${crypto.randomUUID()}`;
}

function isLocalItem(item: UploaderItem): boolean {
  return item.localId.startsWith("loc-");
}

export function MediaUploader(props: UploaderProps) {
  const { value, onChange, disabled } = props;
  const t = useT();
  const inputRef = useRef<HTMLInputElement | null>(null);
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
  );
  const reorderTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Tracks latest value for cleanup effects that should see the most recent
  // state when unmounting, not the snapshot from a stale render.
  const valueRef = useRef(value);
  useEffect(() => {
    valueRef.current = value;
  }, [value]);

  const remainingSlots = MAX_MEDIA_PER_LISTING - value.length;
  const currentVideos = value.filter((v) => v.kind === "video").length;

  useEffect(() => {
    if (props.mode !== "draft") return;
    const draftId = props.draftId;
    const handler = () => {
      void deleteDraftMedia(draftId).catch(() => {});
    };
    window.addEventListener("pagehide", handler);
    return () => window.removeEventListener("pagehide", handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props.mode === "draft" ? props.draftId : null]);

  useEffect(() => {
    return () => {
      if (reorderTimer.current) {
        clearTimeout(reorderTimer.current);
        reorderTimer.current = null;
      }
      for (const item of valueRef.current) {
        if (isLocalItem(item)) URL.revokeObjectURL(item.previewUrl);
      }
    };
  }, []);

  const handleFiles = useCallback(
    async (files: FileList | null) => {
      if (!files || files.length === 0) return;
      const accepted: File[] = [];
      let videoCount = 0;

      for (const file of Array.from(files)) {
        const reason = rejectionReason(file, t);
        if (reason) {
          console.warn("MediaUploader rejected:", file.name, reason);
          continue;
        }
        if (isVideoMime(file.type)) {
          if (currentVideos + videoCount >= MAX_VIDEOS_PER_LISTING) continue;
          videoCount++;
        }
        if (accepted.length + 1 > remainingSlots) break;
        accepted.push(file);
      }

      const startLen = value.length;
      const placeholders: UploaderItem[] = accepted.map((file) => ({
        localId: newLocalId(),
        mediaId: null,
        itemId: null,
        kind: isVideoMime(file.type) ? "video" : "image",
        mimeType: file.type,
        fileName: file.name,
        previewUrl: URL.createObjectURL(file),
        posterUrl: null,
        durationMs: null,
        sizeBytes: file.size,
        status: "uploading",
        errorMessage: null,
        progress: 0,
      }));
      onChange((prev) => [...prev, ...placeholders]);

      for (let i = 0; i < accepted.length; i++) {
        const file = accepted[i];
        const placeholder = placeholders[i];
        const position = startLen + i;
        try {
          await uploadOne(props, file, placeholder, position, t);
        } catch (cause) {
          const message =
            cause instanceof Error
              ? cause.message
              : t("media_uploader.error.upload_failed");
          props.onChange((prev) =>
            prev.map((v) =>
              v.localId === placeholder.localId
                ? { ...v, status: "error", errorMessage: message }
                : v,
            ),
          );
        }
      }
    },
    [t, onChange, currentVideos, remainingSlots, value.length, props],
  );

  function onDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = value.findIndex((v) => v.localId === active.id);
    const newIndex = value.findIndex((v) => v.localId === over.id);
    if (oldIndex < 0 || newIndex < 0) return;
    const next = arrayMove(value, oldIndex, newIndex);
    onChange(next);
    if (props.mode === "listing") {
      if (reorderTimer.current) clearTimeout(reorderTimer.current);
      reorderTimer.current = setTimeout(() => {
        const order = next
          .filter((it) => it.itemId !== null)
          .map((it, idx) => ({
            media_item_id: it.itemId as string,
            position: idx,
          }));
        const reorder =
          props.listingKind === "property"
            ? import("@/features/properties/api").then((m) =>
                m.reorderPropertyMedia(props.listingId, order),
              )
            : import("@/features/experiences/api").then((m) =>
                m.reorderExperienceMedia(props.listingId, order),
              );
        void reorder.catch((err) => {
          console.error("reorder failed", err);
        });
      }, 500);
    }
  }

  function removeItem(localId: string) {
    const item = value.find((v) => v.localId === localId);
    if (!item) return;
    if (isLocalItem(item)) URL.revokeObjectURL(item.previewUrl);
    if (props.mode === "listing" && item.itemId) {
      const itemId = item.itemId;
      void (
        props.listingKind === "property"
          ? import("@/features/properties/api").then((m) =>
              m.detachPropertyMedia(props.listingId, itemId),
            )
          : import("@/features/experiences/api").then((m) =>
              m.detachExperienceMedia(props.listingId, itemId),
            )
      ).catch((err) => {
        console.error("detach failed", err);
      });
    }
    onChange((prev) => prev.filter((v) => v.localId !== localId));
  }

  return (
    <div className="space-y-3">
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPT_ATTR}
        multiple
        hidden
        onChange={(e) => handleFiles(e.target.files)}
      />
      <button
        type="button"
        disabled={disabled || remainingSlots <= 0}
        onClick={() => inputRef.current?.click()}
        className="cursor-pointer rounded-md border border-dashed px-4 py-3 text-sm disabled:cursor-not-allowed"
      >
        {t("media_uploader.add")
          .replace("{count}", String(value.length))
          .replace("{max}", String(MAX_MEDIA_PER_LISTING))}
      </button>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={onDragEnd}
      >
        <SortableContext
          items={value.map((v) => v.localId)}
          strategy={rectSortingStrategy}
        >
          <ul className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5">
            {value.map((item, idx) => (
              <SortableTile
                key={item.localId}
                item={item}
                index={idx}
                onRemove={removeItem}
                coverLabel={t("media_uploader.cover")}
                uploadingLabel={t("media_uploader.uploading")}
              />
            ))}
          </ul>
        </SortableContext>
      </DndContext>
    </div>
  );
}

function SortableTile({
  item,
  index,
  onRemove,
  coverLabel,
  uploadingLabel,
}: {
  item: UploaderItem;
  index: number;
  onRemove: (localId: string) => void;
  coverLabel: string;
  uploadingLabel: string;
}) {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({
      id: item.localId,
    });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };
  return (
    <li
      ref={setNodeRef}
      style={style}
      className="relative aspect-square overflow-hidden rounded-md border bg-gray-50"
      {...attributes}
      {...listeners}
    >
      {item.kind === "image" ? (
        <img
          src={item.previewUrl}
          alt=""
          className="h-full w-full object-cover"
        />
      ) : (
        <video
          src={item.previewUrl}
          muted
          playsInline
          preload="metadata"
          poster={item.posterUrl ?? undefined}
          className="h-full w-full object-cover"
        />
      )}
      {index === 0 && (
        <span className="absolute left-1 top-1 rounded bg-black/70 px-2 py-0.5 text-xs text-white">
          {coverLabel}
        </span>
      )}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onRemove(item.localId);
        }}
        className="absolute right-1 top-1 rounded bg-black/60 px-1.5 py-0.5 text-xs text-white"
      >
        ×
      </button>
      {item.status === "uploading" && (
        <div className="absolute inset-0 grid place-items-center bg-black/40 text-xs text-white">
          {uploadingLabel}
        </div>
      )}
      {item.status === "error" && (
        <div className="absolute inset-0 grid place-items-center bg-red-600/70 px-1 text-center text-xs text-white">
          {item.errorMessage}
        </div>
      )}
    </li>
  );
}

async function uploadOne(
  props: UploaderProps,
  file: File,
  placeholder: UploaderItem,
  position: number,
  t: Translator,
): Promise<void> {
  const mime = file.type as MediaMimeType;
  if (isVideoMime(file.type)) {
    await uploadVideo(props, file, mime, placeholder, position, t);
  } else {
    await uploadImage(props, file, mime, placeholder, position);
  }
}

async function uploadImage(
  props: UploaderProps,
  file: File,
  mime: MediaMimeType,
  placeholder: UploaderItem,
  position: number,
): Promise<void> {
  const out = await requestUpload({
    mime_type: mime,
    kind: "image",
    size_bytes: file.size,
    draft_id: props.mode === "draft" ? props.draftId : undefined,
  });
  await putToPresignedUrl(out.upload_url, file, mime);
  props.onChange((prev) =>
    prev.map((v) =>
      v.localId === placeholder.localId
        ? { ...v, mediaId: out.media_id, status: "ready", progress: 1 }
        : v,
    ),
  );
  await maybeAttachListing(props, placeholder.localId, out.media_id, position);
}

async function uploadVideo(
  props: UploaderProps,
  file: File,
  mime: MediaMimeType,
  placeholder: UploaderItem,
  position: number,
  t: Translator,
): Promise<void> {
  const tooLongMessage = t("media_uploader.error.video_too_long").replace(
    "{seconds}",
    String(MAX_VIDEO_SECONDS),
  );
  let posterMediaId: string | null = null;
  let durationMs = 0;
  try {
    const { posterBlob, duration } = await extractPoster(file);
    durationMs = Math.round(duration * 1000);
    if (durationMs > MAX_VIDEO_DURATION_MS) {
      throw new Error(tooLongMessage);
    }
    if (posterBlob) {
      const posterOut = await requestUpload({
        mime_type: "image/jpeg",
        kind: "image",
        size_bytes: posterBlob.size,
        draft_id: props.mode === "draft" ? props.draftId : undefined,
      });
      await putToPresignedUrl(posterOut.upload_url, posterBlob, "image/jpeg");
      posterMediaId = posterOut.media_id;
    }
  } catch (cause) {
    if (cause instanceof Error && cause.message === tooLongMessage) throw cause;
    console.warn(
      "poster generation failed; uploading video without poster",
      cause,
    );
  }

  if (durationMs === 0) {
    durationMs = await readVideoDurationMs(file);
    if (durationMs > MAX_VIDEO_DURATION_MS) {
      throw new Error(tooLongMessage);
    }
  }

  const out = await requestUpload({
    mime_type: mime,
    kind: "video",
    size_bytes: file.size,
    duration_ms: durationMs,
    poster_media_id: posterMediaId ?? undefined,
    draft_id: props.mode === "draft" ? props.draftId : undefined,
  });
  await putToPresignedUrl(out.upload_url, file, mime);
  props.onChange((prev) =>
    prev.map((v) =>
      v.localId === placeholder.localId
        ? {
            ...v,
            mediaId: out.media_id,
            status: "ready",
            progress: 1,
            durationMs,
          }
        : v,
    ),
  );
  await maybeAttachListing(props, placeholder.localId, out.media_id, position);
}

async function extractPoster(
  file: File,
): Promise<{ posterBlob: Blob | null; duration: number }> {
  const url = URL.createObjectURL(file);
  try {
    const video = document.createElement("video");
    video.muted = true;
    video.playsInline = true;
    video.preload = "metadata";
    video.src = url;

    await new Promise<void>((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error("poster timeout")), 5000);
      video.addEventListener(
        "loadedmetadata",
        () => {
          clearTimeout(timer);
          resolve();
        },
        { once: true },
      );
      video.addEventListener(
        "error",
        () => reject(new Error("video metadata error")),
        { once: true },
      );
    });

    await new Promise<void>((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error("seek timeout")), 5000);
      video.addEventListener(
        "seeked",
        () => {
          clearTimeout(timer);
          resolve();
        },
        { once: true },
      );
      video.currentTime = Math.min(0.1, Math.max(0, video.duration / 4));
    });

    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return { posterBlob: null, duration: video.duration };
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/jpeg", 0.85),
    );
    return { posterBlob: blob, duration: video.duration };
  } finally {
    URL.revokeObjectURL(url);
  }
}

async function readVideoDurationMs(file: File): Promise<number> {
  const url = URL.createObjectURL(file);
  try {
    const video = document.createElement("video");
    video.muted = true;
    video.preload = "metadata";
    video.src = url;
    await new Promise<void>((resolve, reject) => {
      const timer = setTimeout(
        () => reject(new Error("duration timeout")),
        5000,
      );
      video.addEventListener(
        "loadedmetadata",
        () => {
          clearTimeout(timer);
          resolve();
        },
        { once: true },
      );
      video.addEventListener(
        "error",
        () => reject(new Error("duration error")),
        {
          once: true,
        },
      );
    });
    return Math.round(video.duration * 1000);
  } finally {
    URL.revokeObjectURL(url);
  }
}

async function maybeAttachListing(
  props: UploaderProps,
  localId: string,
  mediaId: string,
  position: number,
): Promise<void> {
  if (props.mode === "draft") return;
  const out =
    props.listingKind === "property"
      ? await import("@/features/properties/api").then((m) =>
          m.attachPropertyMedia(props.listingId, {
            media_id: mediaId,
            position,
          }),
        )
      : await import("@/features/experiences/api").then((m) =>
          m.attachExperienceMedia(props.listingId, {
            media_id: mediaId,
            position,
          }),
        );
  props.onChange((prev) =>
    prev.map((v) =>
      v.localId === localId ? { ...v, itemId: out.id, status: "attached" } : v,
    ),
  );
}
