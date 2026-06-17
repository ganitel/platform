import { apiClient } from "@/shared/api/client";
import type {
  AdminStatusSummary,
  ExperienceAdminListOut,
  ExperienceCreateInput,
  ExperienceDetail,
  ExperienceSearchOut,
  ExperienceStatus,
  ExperienceUpdateInput,
} from "@/features/experiences/types";

export interface ExperienceSearchFilters {
  q?: string;
  limit?: number;
  offset?: number;
}

export async function searchExperiences(
  filters: ExperienceSearchFilters = {},
): Promise<ExperienceSearchOut> {
  const r = await apiClient.get<ExperienceSearchOut>("/experiences", {
    params: filters as Record<string, unknown>,
  });
  return r.data;
}

export interface AdminListParams {
  status?: ExperienceStatus[];
  limit?: number;
  offset?: number;
}

export async function listAdminExperiences(
  params: AdminListParams = {},
): Promise<ExperienceAdminListOut> {
  const r = await apiClient.get<ExperienceAdminListOut>("/admin/experiences", {
    params: params as Record<string, unknown>,
  });
  return r.data;
}

export async function getAdminExperiencesSummary(): Promise<AdminStatusSummary> {
  const r = await apiClient.get<AdminStatusSummary>(
    "/admin/experiences/summary",
  );
  return r.data;
}

export async function getExperience(id: string): Promise<ExperienceDetail> {
  const r = await apiClient.get<ExperienceDetail>(`/experiences/${id}`);
  return r.data;
}

export async function createExperience(
  body: ExperienceCreateInput,
): Promise<ExperienceDetail> {
  const r = await apiClient.post<ExperienceDetail>("/experiences", body);
  return r.data;
}

export async function updateExperience(
  id: string,
  body: ExperienceUpdateInput,
): Promise<ExperienceDetail> {
  const r = await apiClient.patch<ExperienceDetail>(`/experiences/${id}`, body);
  return r.data;
}

export async function publishExperience(id: string): Promise<ExperienceDetail> {
  const r = await apiClient.post<ExperienceDetail>(
    `/experiences/${id}/publish`,
  );
  return r.data;
}

export async function unpublishExperience(
  id: string,
): Promise<ExperienceDetail> {
  const r = await apiClient.post<ExperienceDetail>(
    `/experiences/${id}/unpublish`,
  );
  return r.data;
}

export async function removeExperience(id: string): Promise<ExperienceDetail> {
  const r = await apiClient.post<ExperienceDetail>(`/experiences/${id}/remove`);
  return r.data;
}

export async function attachExperienceMedia(
  experienceId: string,
  body: { media_id: string; position: number },
): Promise<{ id: string; position: number }> {
  const r = await apiClient.post<{ id: string; position: number }>(
    `/experiences/${experienceId}/media`,
    body,
  );
  return r.data;
}

export async function detachExperienceMedia(
  experienceId: string,
  itemId: string,
): Promise<void> {
  await apiClient.delete(`/experiences/${experienceId}/media/${itemId}`);
}

export async function reorderExperienceMedia(
  experienceId: string,
  order: { media_item_id: string; position: number }[],
): Promise<ExperienceDetail> {
  const r = await apiClient.patch<ExperienceDetail>(
    `/experiences/${experienceId}/media`,
    { order },
  );
  return r.data;
}
