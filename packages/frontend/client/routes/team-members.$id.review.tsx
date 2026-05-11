import { redirect } from "react-router";

import type { Route } from "./+types/team-members.$id.review";

import { ApiError } from "@/shared/api/client";
import { getForReviewServer } from "@/features/team/api.server";
import { ReviewForm } from "@/features/team/review-form";

export const meta: Route.MetaFunction = () => [
  { title: "Review submission — Ganitel" },
  { name: "robots", content: "noindex" },
];

export async function loader({ request, params }: Route.LoaderArgs) {
  const url = new URL(request.url);
  const token = url.searchParams.get("token");
  if (!token) {
    throw redirect("/");
  }
  try {
    const member = await getForReviewServer(params.id, token);
    return { member, token };
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) {
      throw new Response("Invalid or expired token", { status: 401 });
    }
    throw error;
  }
}

export default function TeamReviewRoute({ loaderData }: Route.ComponentProps) {
  return <ReviewForm member={loaderData.member} token={loaderData.token} />;
}
