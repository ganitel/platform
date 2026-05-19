import { apiClient } from "@/shared/api/client";
import type {
  AdminListOut,
  PropertyCreateInput,
  PropertyDetail,
  PropertyUpdateInput,
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

export interface AdminListParams {
  limit?: number;
  offset?: number;
}

export async function listAdminProperties(
  params: AdminListParams = {},
): Promise<AdminListOut> {
  const r = await apiClient.get<AdminListOut>("/properties/admin", {
    params: params as Record<string, unknown>,
  });
  return r.data;
}

export async function createProperty(
  body: PropertyCreateInput,
): Promise<PropertyDetail> {
  const r = await apiClient.post<PropertyDetail>("/properties", body);
  return r.data;
}

export async function updateProperty(
  id: string,
  body: PropertyUpdateInput,
): Promise<PropertyDetail> {
  const r = await apiClient.patch<PropertyDetail>(`/properties/${id}`, body);
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
