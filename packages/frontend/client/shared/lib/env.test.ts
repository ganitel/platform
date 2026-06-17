import { describe, expect, it } from "vitest";

import { resolvePaymentProvider } from "./env";

describe("resolvePaymentProvider", () => {
  it("defaults production builds to tranzak", () => {
    expect(resolvePaymentProvider(undefined, true)).toBe("tranzak");
  });

  it("defaults non-production builds to noop", () => {
    expect(resolvePaymentProvider(undefined, false)).toBe("noop");
  });

  it("honors supported explicit providers", () => {
    expect(resolvePaymentProvider("stripe", true)).toBe("stripe");
    expect(resolvePaymentProvider("NOOP", false)).toBe("noop");
  });

  it("falls back when the explicit provider is unsupported", () => {
    expect(resolvePaymentProvider("paypal", true)).toBe("tranzak");
    expect(resolvePaymentProvider("paypal", false)).toBe("noop");
  });
});
