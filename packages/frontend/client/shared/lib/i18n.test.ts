import { describe, expect, test } from "vitest";

import { t } from "./i18n";

describe("t()", () => {
  test("returns French copy for fr locale", () => {
    expect(t("common.signin", "fr")).toBe("Se connecter");
  });

  test("returns English copy for en locale", () => {
    expect(t("common.signin", "en")).toBe("Sign in");
  });

  test("nav keys resolve in both locales", () => {
    expect(t("nav.bookings", "fr")).toBe("Réservations");
    expect(t("nav.bookings", "en")).toBe("Trips");
  });

  test("property keys resolve in both locales", () => {
    expect(t("property.per_night", "fr")).toBe("par nuit");
    expect(t("property.per_night", "en")).toBe("per night");
  });
});
