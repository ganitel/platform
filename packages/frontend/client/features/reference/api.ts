import { apiClient } from "@/shared/api/client";

export interface PropertyTypeRef {
  code: string;
  label_en: string;
  label_fr: string;
}

export interface AmenityRef {
  code: string;
  label_en: string;
  label_fr: string;
  category: string;
}

export interface CancellationPolicyRef {
  code: string;
  label_en: string;
  label_fr: string;
}

export async function listPropertyTypes(): Promise<PropertyTypeRef[]> {
  const r = await apiClient.get<PropertyTypeRef[]>("/reference/property-types");
  return r.data;
}

export async function listAmenities(): Promise<AmenityRef[]> {
  const r = await apiClient.get<AmenityRef[]>("/reference/amenities");
  return r.data;
}

export async function listCancellationPolicies(): Promise<
  CancellationPolicyRef[]
> {
  const r = await apiClient.get<CancellationPolicyRef[]>(
    "/reference/cancellation-policies",
  );
  return r.data;
}
