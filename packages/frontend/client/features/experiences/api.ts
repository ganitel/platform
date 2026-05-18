import { apiClient } from "@/shared/api/client";
import type {
  ExperienceAdminListOut,
  ExperienceCreateInput,
  ExperienceDetail,
} from "@/features/experiences/types";

export async function listAdminExperiences(): Promise<ExperienceAdminListOut> {
  const r = await apiClient.get<ExperienceAdminListOut>("/experiences/admin");
  return r.data;
}

export async function createExperience(
  body: ExperienceCreateInput,
): Promise<ExperienceDetail> {
  const r = await apiClient.post<ExperienceDetail>("/experiences", body);
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
