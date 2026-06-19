import { redirect } from "react-router";

import type { Route } from "./+types/index";

export function loader(_args: Route.LoaderArgs) {
  throw redirect("/", 308);
}

export default function IndexAliasRoute() {
  return null;
}
