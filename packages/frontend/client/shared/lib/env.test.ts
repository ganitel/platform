import { describe, expect, it } from "vitest";

import { paymentProviderFromEnv } from "./env";

describe("paymentProviderFromEnv", () => {
  it("defaults production builds to a real payment provider", () => {
    expect(paymentProviderFromEnv(undefined, true)).toBe("tranzak");
  });

  it("keeps noop as the local/test default", () => {
    expect(paymentProviderFromEnv(undefined, false)).toBe("noop");
  });

  it("honors explicit supported providers", () => {
    expect(paymentProviderFromEnv("stripe", true)).toBe("stripe");
    expect(paymentProviderFromEnv("noop", false)).toBe("noop");
  });
});
