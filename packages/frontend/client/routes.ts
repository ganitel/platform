import {
  index,
  layout,
  route,
  type RouteConfig,
} from "@react-router/dev/routes";

export default [
  // better-auth catch-all: must come before other routes so /api/auth/* is served by SSR.
  route("api/auth/*", "routes/api.auth.$.ts"),

  // Every public page shares the same chrome (Header + BottomNav).
  layout("routes/_app.tsx", [
    index("routes/_index.tsx"),
    route("browse", "routes/browse.tsx"),
    route("properties/:id", "routes/properties.$id.tsx"),
    route("bookings", "routes/bookings.tsx"),
    route("profile", "routes/profile.tsx"),
  ]),

  // Auth pages — no app shell.
  route("sign-in", "routes/sign-in.tsx"),
  route("sign-up", "routes/sign-up.tsx"),
  route("complete-profile", "routes/complete-profile.tsx"),
] satisfies RouteConfig;
