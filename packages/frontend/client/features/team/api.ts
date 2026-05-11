import { apiClient } from "@/shared/api/client";
import type { TeamMember } from "@/features/about/types";

export interface SubmissionInput {
  image: File;
  name: string;
  bio_fr: string;
  city: string;
  country: string;
  age: number;
}

export interface SubmissionResult {
  team_member_id: string;
  admins_notified: number;
}

export async function submitTeamMember(
  input: SubmissionInput,
): Promise<SubmissionResult> {
  const data = new FormData();
  data.append("image", input.image);
  data.append("name", input.name);
  data.append("bio_fr", input.bio_fr);
  data.append("city", input.city);
  data.append("country", input.country);
  data.append("age", String(input.age));
  const response = await apiClient.post<SubmissionResult>(
    "/team-members",
    data,
  );
  return response.data;
}

export interface ReviewPatch {
  name?: string;
  bio_fr?: string;
  city?: string;
  country?: string;
  age?: number;
  title_fr?: string;
  title_en?: string;
}

export async function approveTeamMember(
  teamMemberId: string,
  token: string,
  patch: ReviewPatch,
): Promise<TeamMember> {
  const response = await apiClient.post<TeamMember>(
    `/team-members/${teamMemberId}/approve?token=${encodeURIComponent(token)}`,
    patch,
  );
  return response.data;
}

export async function rejectTeamMember(
  teamMemberId: string,
  token: string,
): Promise<void> {
  await apiClient.delete(
    `/team-members/${teamMemberId}/reject?token=${encodeURIComponent(token)}`,
  );
}
