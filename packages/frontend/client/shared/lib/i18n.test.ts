import { describe, expect, it } from "vitest";

import { localeFromAcceptLanguage } from "./i18n";

describe("localeFromAcceptLanguage", () => {
  it("defaults to fr when header is missing or empty", () => {
    expect(localeFromAcceptLanguage(null)).toBe("fr");
    expect(localeFromAcceptLanguage(undefined)).toBe("fr");
    expect(localeFromAcceptLanguage("")).toBe("fr");
    expect(localeFromAcceptLanguage("   ")).toBe("fr");
  });

  it("picks the first supported language by q-value order", () => {
    expect(localeFromAcceptLanguage("en-US,fr;q=0.9")).toBe("en");
    expect(localeFromAcceptLanguage("en-GB")).toBe("en");
    expect(localeFromAcceptLanguage("fr-CA,en;q=0.8")).toBe("fr");
  });

  it("falls back to fr when no fr/en tag matches", () => {
    expect(localeFromAcceptLanguage("de-DE,es")).toBe("fr");
  });

  it("finds supported language after unsupported prefixes", () => {
    expect(localeFromAcceptLanguage("de,en;q=0.9")).toBe("en");
  });
});
