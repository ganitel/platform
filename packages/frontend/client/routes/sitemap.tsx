import type { Route } from "./+types/sitemap";

import { serverFetch } from "@/shared/api/server";
import { SITE_URL } from "@/shared/lib/seo";
import type { SearchOut } from "@/features/properties/types";
import type { ExperienceSearchOut } from "@/features/experiences/types";

const STATIC_PATHS: Array<{
  path: string;
  changefreq: "daily" | "weekly" | "monthly" | "yearly";
  priority: number;
}> = [
  { path: "/", changefreq: "daily", priority: 1.0 },
  { path: "/browse?kind=experiences", changefreq: "daily", priority: 0.9 },
  { path: "/browse?kind=stays", changefreq: "daily", priority: 0.9 },
  { path: "/about", changefreq: "monthly", priority: 0.6 },
  { path: "/faq", changefreq: "monthly", priority: 0.5 },
  { path: "/terms", changefreq: "yearly", priority: 0.3 },
  { path: "/privacy", changefreq: "yearly", priority: 0.3 },
];

function xmlEscape(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export async function loader(_: Route.LoaderArgs) {
  const [properties, experiences] = await Promise.allSettled([
    serverFetch<SearchOut>("/properties?limit=1000"),
    serverFetch<ExperienceSearchOut>("/experiences?limit=1000"),
  ]);

  const propertyItems =
    properties.status === "fulfilled" ? properties.value.items : [];
  const experienceItems =
    experiences.status === "fulfilled" ? experiences.value.items : [];

  const urls: Array<{ loc: string; changefreq: string; priority: number }> = [
    ...STATIC_PATHS.map((p) => ({
      loc: `${SITE_URL}${p.path}`,
      changefreq: p.changefreq,
      priority: p.priority,
    })),
    ...propertyItems.map((p) => ({
      loc: `${SITE_URL}/properties/${p.id}`,
      changefreq: "weekly",
      priority: 0.8,
    })),
    ...experienceItems.map((e) => ({
      loc: `${SITE_URL}/experiences/${e.id}`,
      changefreq: "weekly",
      priority: 0.7,
    })),
  ];

  const body = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls
  .map(
    (u) =>
      `  <url>\n    <loc>${xmlEscape(u.loc)}</loc>\n    <changefreq>${u.changefreq}</changefreq>\n    <priority>${u.priority.toFixed(1)}</priority>\n  </url>`,
  )
  .join("\n")}
</urlset>
`;

  return new Response(body, {
    status: 200,
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=300, s-maxage=3600",
    },
  });
}
