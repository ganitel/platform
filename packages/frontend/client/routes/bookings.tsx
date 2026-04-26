import { redirect } from "react-router";
import { getAuth } from "@clerk/react-router/server";

import type { Route } from "./+types/bookings";

export const meta: Route.MetaFunction = () => [
  { title: "Mes réservations — Ganitel" },
  { name: "robots", content: "noindex" },
];

export async function loader(args: Route.LoaderArgs) {
  const auth = await getAuth(args);
  if (!auth.userId) {
    const url = new URL(args.request.url);
    const redirectUrl = encodeURIComponent(url.pathname + url.search);
    return redirect(`/sign-in?redirect_url=${redirectUrl}`);
  }
  // Wire to GET /api/bookings/me in a follow-up.
  return null;
}

export default function MyBookingsRoute() {
  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-12 md:px-8">
      <h1 className="font-infoma text-3xl text-ganitel-text-title">Mes réservations</h1>
      <p className="mt-3 text-sm text-ganitel-text-subtitle">
        Cette page sera reliée à <code>GET /api/bookings/me</code> lors de la
        prochaine itération.
      </p>
    </div>
  );
}
