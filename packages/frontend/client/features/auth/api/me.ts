import { apiClient } from "@/shared/api/client";

export interface UserMe {
  id: string;
  email: string | null;
  phone: string | null;
  display_name: string;
  avatar_url: string | null;
  language: string;
  is_host: boolean;
  is_admin: boolean;
  status: string;
  created_at: string;
}

export interface UpdateMePayload {
  display_name?: string;
  language?: "fr" | "en";
  avatar_url?: string | null;
}

export async function fetchMe(): Promise<UserMe> {
  const r = await apiClient.get<UserMe>("/me");
  return r.data;
}

export async function patchMe(body: UpdateMePayload): Promise<UserMe> {
  const r = await apiClient.patch<UserMe>("/me", body);
  return r.data;
}
