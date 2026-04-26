import { apiClient } from "@/shared/api/client";
import type { PropertyDetail, SearchFilters, SearchOut } from "@/features/properties/types";

export async function searchProperties(filters: SearchFilters = {}): Promise<SearchOut> {
  const r = await apiClient.get<SearchOut>("/properties", { params: filters });
  return r.data;
}

export async function getProperty(id: string): Promise<PropertyDetail> {
  const r = await apiClient.get<PropertyDetail>(`/properties/${id}`);
  return r.data;
}
