import { apiClient } from "@/shared/api/client";
import type {
  ExperienceAdminListOut,
  ExperienceCreateInput,
  ExperienceDetail,
  ExperienceUpdateInput,
} from "@/features/experiences/types";

export interface AdminListParams {
  limit?: number;
  offset?: number;
}

export async function listAdminExperiences(
  params: AdminListParams = {},
): Promise<ExperienceAdminListOut> {
  const r = await apiClient.get<ExperienceAdminListOut>("/experiences/admin", {
    params: params as Record<string, unknown>,
  });
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
