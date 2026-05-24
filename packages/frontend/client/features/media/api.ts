import { apiClient } from "@/shared/api/client";
import type {
  MediaUploadInput,
  MediaUploadOutput,
} from "@/features/media/types";

export async function requestUpload(
  body: MediaUploadInput,
): Promise<MediaUploadOutput> {
  const r = await apiClient.post<MediaUploadOutput>("/media", body);
  return r.data;
}

export async function putToPresignedUrl(
  url: string,
  blob: Blob,
  contentType: string,
  signal?: AbortSignal,
): Promise<void> {
  const response = await fetch(url, {
    method: "PUT",
    headers: { "Content-Type": contentType },
    body: blob,
    signal,
  });
  if (!response.ok) {
    throw new Error(
      `upload to presigned URL failed (${response.status}): ${response.statusText}`,
    );
  }
}

export async function deleteDraftMedia(draftId: string): Promise<void> {
  await apiClient.delete(`/media/draft/${draftId}`);
}
