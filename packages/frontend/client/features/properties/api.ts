import { apiClient } from "@/shared/api/client";
import type {
  AdminListOut,
  PropertyCreateInput,
  PropertyDetail,
  SearchFilters,
  SearchOut,
} from "@/features/properties/types";

export async function searchProperties(
  filters: SearchFilters = {},
): Promise<SearchOut> {
  const r = await apiClient.get<SearchOut>("/properties", {
    params: filters as Record<string, unknown>,
  });
  return r.data;
}

export async function getProperty(id: string): Promise<PropertyDetail> {
  const r = await apiClient.get<PropertyDetail>(`/properties/${id}`);
  return r.data;
}

export async function listAdminProperties(): Promise<AdminListOut> {
  const r = await apiClient.get<AdminListOut>("/properties/admin");
  return r.data;
}

export async function createProperty(
  body: PropertyCreateInput,
): Promise<PropertyDetail> {
  const r = await apiClient.post<PropertyDetail>("/properties", body);
  return r.data;
}

export async function publishProperty(id: string): Promise<PropertyDetail> {
  const r = await apiClient.post<PropertyDetail>(`/properties/${id}/publish`);
  return r.data;
}

export async function unpublishProperty(id: string): Promise<PropertyDetail> {
  const r = await apiClient.post<PropertyDetail>(`/properties/${id}/unpublish`);
  return r.data;
}

export async function removeProperty(id: string): Promise<PropertyDetail> {
  const r = await apiClient.post<PropertyDetail>(`/properties/${id}/remove`);
  return r.data;
}
