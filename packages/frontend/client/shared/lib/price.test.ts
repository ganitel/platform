import { describe, expect, test } from "vitest";

import { pickBasePriceForLocale } from "./price";

describe("pickBasePriceForLocale", () => {
  test("ignores group flat-rate overrides for per-person display", () => {
    const price = pickBasePriceForLocale(
      [
        { amount: "35000", currency: "XAF", group_size: 4 },
        { amount: "10000", currency: "XAF", group_size: 1 },
      ],
      "fr",
    );

    expect(price).toEqual({ amount: "10000", currency: "XAF", group_size: 1 });
  });
});
