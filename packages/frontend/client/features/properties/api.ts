import { apiClient } from "@/shared/api/client";
import type {
  AdminListOut,
  AdminStatusSummary,
  PropertyCreateInput,
  PropertyDetail,
  PropertyKind,
  PropertyStatus,
  PropertyUpdateInput,
  RoomTypeCreateInput,
  RoomTypePublic,
  RoomTypeUpdateInput,
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
  status?: PropertyStatus[];
  kind?: PropertyKind[];
  limit?: number;
  offset?: number;
}

export async function listAdminProperties(
  params: AdminListParams = {},
): Promise<AdminListOut> {
  const r = await apiClient.get<AdminListOut>("/admin/properties", {
    params: params as Record<string, unknown>,
  });
  return r.data;
}

export async function getAdminPropertiesSummary(): Promise<AdminStatusSummary> {
  const r = await apiClient.get<AdminStatusSummary>(
    "/admin/properties/summary",
  );
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

export async function attachPropertyMedia(
  propertyId: string,
  body: { media_id: string; position: number },
): Promise<{ id: string; position: number }> {
  const r = await apiClient.post<{ id: string; position: number }>(
    `/properties/${propertyId}/media`,
    body,
  );
  return r.data;
}

export async function detachPropertyMedia(
  propertyId: string,
  itemId: string,
): Promise<void> {
  await apiClient.delete(`/properties/${propertyId}/media/${itemId}`);
}

export async function reorderPropertyMedia(
  propertyId: string,
  order: { media_item_id: string; position: number }[],
): Promise<PropertyDetail> {
  const r = await apiClient.patch<PropertyDetail>(
    `/properties/${propertyId}/media`,
    { order },
  );
  return r.data;
}

export interface ListPropertyRoomsParams {
  check_in?: string;
  check_out?: string;
  guests?: number;
  currency?: string;
}

export async function listPropertyRooms(
  propertyId: string,
  opts: ListPropertyRoomsParams = {},
): Promise<RoomTypePublic[]> {
  const r = await apiClient.get<RoomTypePublic[]>(
    `/properties/${propertyId}/rooms`,
    { params: opts as Record<string, unknown> },
  );
  return r.data;
}

export async function createRoom(
  propertyId: string,
  body: RoomTypeCreateInput,
): Promise<RoomTypePublic> {
  const r = await apiClient.post<RoomTypePublic>(
    `/properties/${propertyId}/rooms`,
    body,
  );
  return r.data;
}

export async function updateRoom(
  propertyId: string,
  roomId: string,
  body: RoomTypeUpdateInput,
): Promise<RoomTypePublic> {
  const r = await apiClient.patch<RoomTypePublic>(
    `/properties/${propertyId}/rooms/${roomId}`,
    body,
  );
  return r.data;
}

export async function deleteRoom(
  propertyId: string,
  roomId: string,
): Promise<RoomTypePublic> {
  const r = await apiClient.delete<RoomTypePublic>(
    `/properties/${propertyId}/rooms/${roomId}`,
  );
  return r.data;
}
