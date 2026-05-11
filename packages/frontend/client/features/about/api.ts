import { serverFetch } from "@/shared/api/server";
import type { TeamMember, TeamRole } from "@/features/about/types";

export async function listTeamMembersServer(
  role?: TeamRole,
): Promise<TeamMember[]> {
  const query = role ? `?role=${encodeURIComponent(role)}` : "";
  return serverFetch<TeamMember[]>(`/team-members${query}`);
}
