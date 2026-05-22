import { describe, expect, it } from "vitest";

import { PRIVATE_NO_STORE_CACHE } from "@/shared/lib/cache";

import { headers as experienceHeaders } from "./experiences.$id";
import { headers as propertyHeaders } from "./properties.$id";

function callHeaders(fn: unknown): Record<string, string> {
  return (fn as () => Record<string, string>)();
}

describe("detail route cache headers", () => {
  it("does not publicly cache property detail HTML", () => {
    expect(callHeaders(propertyHeaders)["Cache-Control"]).toBe(
      PRIVATE_NO_STORE_CACHE,
    );
  });

  it("does not publicly cache experience detail HTML", () => {
    expect(callHeaders(experienceHeaders)["Cache-Control"]).toBe(
      PRIVATE_NO_STORE_CACHE,
    );
  });
});
