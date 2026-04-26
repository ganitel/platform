import {
  index,
  layout,
  route,
  type RouteConfig,
} from "@react-router/dev/routes";

export default [
  // Marketing landing — its own chrome (custom nav strip), no app shell.
  index("routes/_index.tsx"),

  // Pages with the public app shell (header / nav / footer).
  layout("routes/_app.tsx", [
    route("browse", "routes/browse.tsx"),
    route("properties/:id", "routes/properties.$id.tsx"),
    route("bookings", "routes/bookings.tsx"),
    route("profile", "routes/profile.tsx"),
  ]),

  // Auth pages — no app shell. Splat (`*`) is required because Clerk's
  // <SignIn> mounts its own nested routes (verify, sso-callback, etc.).
  route("sign-in/*", "routes/sign-in.tsx"),
  route("sign-up/*", "routes/sign-up.tsx"),
] satisfies RouteConfig;
