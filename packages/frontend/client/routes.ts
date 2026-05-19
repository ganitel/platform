import {
  index,
  layout,
  route,
  type RouteConfig,
} from "@react-router/dev/routes";

export default [
  // Every public page shares the same chrome (Header + BottomNav).
  layout("routes/_app.tsx", [
    index("routes/_index.tsx"),
    route("browse", "routes/browse.tsx"),
    route("properties/:id", "routes/properties.$id.tsx"),
    route("experiences/:id", "routes/experiences.$id.tsx"),
    route("bookings", "routes/bookings.tsx"),
    route("profile", "routes/profile.tsx"),
    route("about", "routes/about.tsx"),
  ]),

  // Auth pages — no app shell.
  route("sign-in", "routes/sign-in.tsx"),
  route("sign-up", "routes/sign-up.tsx"),
  route("complete-profile", "routes/complete-profile.tsx"),
  route("join", "routes/join.tsx"),

  // Unlinked admin / self-serve forms — no app shell, no nav entry.
  route("add-team", "routes/add-team.tsx"),
  route("team-members/:id/review", "routes/team-members.$id.review.tsx"),
  route("admin", "routes/admin._index.tsx"),
  route("admin/rentals", "routes/admin.rentals.tsx"),
  route("admin/rentals/new", "routes/admin.rentals.new.tsx"),
  route("admin/rentals/:id/edit", "routes/admin.rentals.$id.edit.tsx"),
  route("admin/experiences", "routes/admin.experiences.tsx"),
  route("admin/experiences/new", "routes/admin.experiences.new.tsx"),
  route("admin/experiences/:id/edit", "routes/admin.experiences.$id.edit.tsx"),

  // Resource routes (no UI).
  route("sitemap.xml", "routes/sitemap.tsx"),
] satisfies RouteConfig;
