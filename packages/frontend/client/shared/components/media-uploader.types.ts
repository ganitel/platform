import type { MediaItemPublic } from "@/features/properties/types";

export type UploaderItemStatus = "uploading" | "ready" | "attached" | "error";

export interface UploaderItem {
  /** Local id for React keys; not the server media id. */
  localId: string;
  /** Server media id, available once POST /media returns. */
  mediaId: string | null;
  /** Listing-media join row id, only in listing mode after attach. */
  itemId: string | null;
  kind: "image" | "video";
  mimeType: string;
  fileName: string;
  /** A local objectURL for preview before upload completes. */
  previewUrl: string;
  /** For videos: server-side poster_url once uploaded. */
  posterUrl: string | null;
  durationMs: number | null;
  sizeBytes: number;
  status: UploaderItemStatus;
  errorMessage: string | null;
  progress: number;
}

export type UploaderOnChange = (
  next: UploaderItem[] | ((prev: UploaderItem[]) => UploaderItem[]),
) => void;

export type UploaderProps =
  | {
      mode: "draft";
      draftId: string;
      value: UploaderItem[];
      onChange: UploaderOnChange;
      disabled?: boolean;
    }
  | {
      mode: "listing";
      listingKind: "property" | "experience";
      listingId: string;
      value: UploaderItem[];
      onChange: UploaderOnChange;
      disabled?: boolean;
    };

export function itemFromServerMedia(media: MediaItemPublic): UploaderItem {
  return {
    localId: `srv-${media.id}`,
    mediaId: media.id,
    itemId: media.media_item_id,
    kind: media.kind,
    mimeType: media.mime_type,
    fileName: "",
    previewUrl: media.url,
    posterUrl: media.poster_url,
    durationMs: media.duration_ms,
    sizeBytes: 0,
    status: "attached",
    errorMessage: null,
    progress: 1,
  };
}
