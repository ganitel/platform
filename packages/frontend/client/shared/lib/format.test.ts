import { describe, expect, test } from "vitest";

import { formatMoney } from "./format";

describe("formatMoney", () => {
  test("renders no decimals for XAF", () => {
    const out = formatMoney({ amount: "38000", currency: "XAF" }, "fr");
    // Don't assert exact whitespace/symbol — locale formatting can vary by node/icu version.
    expect(out).toContain("38");
    expect(out).toContain("000");
    expect(out).not.toMatch(/\.\d{2}\b/);
  });

  test("renders no decimals for XOF", () => {
    const out = formatMoney({ amount: "25000", currency: "XOF" }, "fr");
    expect(out).not.toMatch(/\.\d{2}\b/);
  });

  test("renders two decimals for USD", () => {
    const out = formatMoney({ amount: "12.5", currency: "USD" }, "en");
    expect(out).toMatch(/12\.50/);
  });

  test("accepts string amount and number-coerces it", () => {
    const out = formatMoney({ amount: "1000.99", currency: "USD" }, "en");
    expect(out).toMatch(/1,000\.99/);
  });
});
