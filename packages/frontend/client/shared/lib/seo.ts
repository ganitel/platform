import type { MetaDescriptor } from "react-router";

import type { Locale } from "@/shared/lib/i18n";

export const SITE_NAME = "ganitel";
export const SITE_URL = (
  globalThis.process?.env?.APP_URL ?? "https://ganitel.com"
).replace(/\/+$/, "");

const DEFAULT_OG = "/og/default.png";

export type OgImage = {
  url: string;
  alt?: string;
  width?: number;
  height?: number;
};

export type SeoInput = {
  title: string;
  description: string;
  pathname?: string;
  locale?: Locale;
  alternates?: { fr?: string; en?: string };
  ogImage?: OgImage | string;
  ogType?: "website" | "article" | "product" | "place";
  twitterCard?: "summary" | "summary_large_image";
  noindex?: boolean;
  jsonLd?: object | object[];
};

export type SeoMeta = MetaDescriptor;

export function absoluteUrl(pathname?: string): string {
  if (!pathname) return SITE_URL;
  if (/^https?:/i.test(pathname)) return pathname;
  const p = pathname.startsWith("/") ? pathname : `/${pathname}`;
  return `${SITE_URL}${p}`;
}

function normalizeOg(image: OgImage | string | undefined): OgImage {
  if (!image) {
    return {
      url: absoluteUrl(DEFAULT_OG),
      alt: SITE_NAME,
      width: 1200,
      height: 630,
    };
  }
  if (typeof image === "string") {
    return { url: absoluteUrl(image), width: 1200, height: 630 };
  }
  return { ...image, url: absoluteUrl(image.url) };
}

const OG_LOCALE: Record<Locale, string> = { fr: "fr_FR", en: "en_US" };

export function seo(input: SeoInput): SeoMeta[] {
  const locale = input.locale ?? "fr";
  const url = absoluteUrl(input.pathname);
  const og = normalizeOg(input.ogImage);
  const out: SeoMeta[] = [
    { title: input.title },
    { name: "description", content: input.description },
    { property: "og:site_name", content: SITE_NAME },
    { property: "og:title", content: input.title },
    { property: "og:description", content: input.description },
    { property: "og:type", content: input.ogType ?? "website" },
    { property: "og:url", content: url },
    { property: "og:locale", content: OG_LOCALE[locale] },
    { property: "og:image", content: og.url },
    { property: "og:image:width", content: String(og.width ?? 1200) },
    { property: "og:image:height", content: String(og.height ?? 630) },
    { property: "og:image:alt", content: og.alt ?? input.title },
    {
      name: "twitter:card",
      content: input.twitterCard ?? "summary_large_image",
    },
    { name: "twitter:title", content: input.title },
    { name: "twitter:description", content: input.description },
    { name: "twitter:image", content: og.url },
    { name: "twitter:image:alt", content: og.alt ?? input.title },
    { tagName: "link", rel: "canonical", href: url },
  ];

  if (input.alternates) {
    const { fr, en } = input.alternates;
    if (fr)
      out.push({
        tagName: "link",
        rel: "alternate",
        href: absoluteUrl(fr),
        hrefLang: "fr",
      });
    if (en)
      out.push({
        tagName: "link",
        rel: "alternate",
        href: absoluteUrl(en),
        hrefLang: "en",
      });
    out.push({
      tagName: "link",
      rel: "alternate",
      href: url,
      hrefLang: "x-default",
    });
  }

  if (input.noindex) {
    out.push({ name: "robots", content: "noindex,nofollow" });
  }

  if (input.jsonLd) {
    const blobs = Array.isArray(input.jsonLd) ? input.jsonLd : [input.jsonLd];
    for (const blob of blobs) {
      out.push({ "script:ld+json": blob });
    }
  }

  return out;
}

export const organizationJsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: SITE_NAME,
  url: SITE_URL,
  logo: absoluteUrl("/icons/Menu, Burger, Square.svg"),
  sameAs: [] as string[],
};

export const websiteJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: SITE_NAME,
  url: SITE_URL,
  potentialAction: {
    "@type": "SearchAction",
    target: `${SITE_URL}/browse?q={search_term_string}`,
    "query-input": "required name=search_term_string",
  },
};
