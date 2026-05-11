import { serverFetch } from "@/shared/api/server";
import type { TeamMember } from "@/features/about/types";

export async function getForReviewServer(
  teamMemberId: string,
  token: string,
): Promise<TeamMember> {
  return serverFetch<TeamMember>(
    `/team-members/${teamMemberId}/review?token=${encodeURIComponent(token)}`,
  );
}
