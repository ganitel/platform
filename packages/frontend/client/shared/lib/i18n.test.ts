import { describe, expect, it } from "vitest";

import { localeFromAcceptLanguage, localeFromCookie } from "./i18n";

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

describe("localeFromCookie", () => {
  it("returns null when no pinned locale is present", () => {
    expect(localeFromCookie(null)).toBeNull();
    expect(localeFromCookie(undefined)).toBeNull();
    expect(localeFromCookie("")).toBeNull();
    expect(localeFromCookie("other=1; foo=bar")).toBeNull();
  });

  it("reads a pinned locale among other cookies", () => {
    expect(localeFromCookie("ganitel_locale=en")).toBe("en");
    expect(localeFromCookie("foo=bar; ganitel_locale=fr; baz=2")).toBe("fr");
  });

  it("ignores an unsupported cookie value", () => {
    expect(localeFromCookie("ganitel_locale=de")).toBeNull();
  });
});

describe("default locale resolution (loader precedence)", () => {
  const resolve = (cookie: string | null, acceptLanguage: string | null) =>
    localeFromCookie(cookie) ?? localeFromAcceptLanguage(acceptLanguage);

  it("falls back to Accept-Language when no language is pinned", () => {
    expect(resolve(null, "en-US,fr;q=0.9")).toBe("en");
    expect(resolve(null, "fr-CA")).toBe("fr");
    expect(resolve(null, null)).toBe("fr");
  });

  it("lets a pinned cookie override Accept-Language", () => {
    expect(resolve("ganitel_locale=en", "fr-FR")).toBe("en");
    expect(resolve("ganitel_locale=fr", "en-US")).toBe("fr");
  });
});
