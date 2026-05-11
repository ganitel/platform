#!/usr/bin/env node
/**
 * Generates branded OG images (1200×630 PNG + SVG source) for share previews.
 * Run with: `bun scripts/og/build.mjs` from packages/frontend.
 *
 * Outputs land in public/og/. Re-run after editing variants.
 */
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { Resvg } from "@resvg/resvg-js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const FRONTEND_ROOT = path.resolve(__dirname, "..", "..");
const OUT_DIR = path.join(FRONTEND_ROOT, "public", "og");
const FONT_CACHE = path.join(__dirname, ".fonts");

const FONTS = [
  {
    file: "Inter-Variable.ttf",
    url: "https://raw.githubusercontent.com/google/fonts/main/ofl/inter/Inter%5Bopsz%2Cwght%5D.ttf",
  },
  {
    file: "InstrumentSerif-Italic.ttf",
    url: "https://raw.githubusercontent.com/google/fonts/main/ofl/instrumentserif/InstrumentSerif-Italic.ttf",
  },
];

const PAPER = "#F6F3EA";
const PAPER_WARM = "#EFE9D6";
const INK = "#18100C";
const COPPER = "#D39E70";
const SUBTITLE = "#4D4744";

const VARIANTS = [
  {
    name: "default",
    eyebrow: "GANITEL",
    title: ["Là où la lumière", "prend son ", { italic: "temps." }],
    caption:
      "Logements & expériences sélectionnés · Cameroun · Sénégal · Côte d'Ivoire",
    url: "ganitel.com",
  },
  {
    name: "stays",
    eyebrow: "LOGEMENTS",
    title: ["Une sélection,", "un seul ", { italic: "ton." }],
    caption:
      "Chaque logement est visité avant d'être listé. Si nous n'y dormirions pas, vous ne le trouverez pas ici.",
    url: "ganitel.com/browse",
  },
  {
    name: "experiences",
    eyebrow: "EXPÉRIENCES",
    title: ["Le pays,", "à votre ", { italic: "rythme." }],
    caption:
      "Expériences soigneusement choisies, autour de nos logements ou en escapade.",
    url: "ganitel.com/browse?kind=experiences",
  },
  {
    name: "about",
    eyebrow: "À PROPOS",
    title: [
      "Au plus près du",
      "Cameroun, Sénégal,",
      [{ italic: "Côte d'Ivoire." }],
    ],
    caption: "L'équipe qui visite, écoute et choisit chaque adresse.",
    url: "ganitel.com/about",
  },
];

async function fetchFonts() {
  await fs.mkdir(FONT_CACHE, { recursive: true });
  const buffers = [];
  for (const f of FONTS) {
    const dest = path.join(FONT_CACHE, f.file);
    let buf;
    try {
      buf = await fs.readFile(dest);
    } catch {
      const res = await fetch(f.url);
      if (!res.ok) throw new Error(`Failed to fetch ${f.url}: ${res.status}`);
      buf = Buffer.from(await res.arrayBuffer());
      await fs.writeFile(dest, buf);
    }
    buffers.push(buf);
  }
  return buffers;
}

function escapeXml(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function renderLineParts(line) {
  const parts = Array.isArray(line) ? line : [line];
  return parts
    .map((part) => {
      if (typeof part === "string") {
        return `<tspan font-family="Inter" font-weight="600" fill="${INK}">${escapeXml(part)}</tspan>`;
      }
      if (part && part.italic) {
        return `<tspan font-family="Instrument Serif" font-style="italic" font-weight="400" fill="${COPPER}">${escapeXml(part.italic)}</tspan>`;
      }
      return "";
    })
    .join("");
}

function svgFor(v) {
  const titleLines = v.title
    .map(
      (line, i) =>
        `<tspan x="80" dy="${i === 0 ? 0 : 108}">${renderLineParts(line)}</tspan>`,
    )
    .join("");

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <defs>
    <linearGradient id="paper" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="${PAPER}"/>
      <stop offset="100%" stop-color="${PAPER_WARM}"/>
    </linearGradient>
    <radialGradient id="sun" cx="0.5" cy="0.5" r="0.5">
      <stop offset="0%" stop-color="${COPPER}" stop-opacity="0.95"/>
      <stop offset="100%" stop-color="${COPPER}" stop-opacity="0"/>
    </radialGradient>
    <filter id="grain">
      <feTurbulence type="fractalNoise" baseFrequency="1.4" numOctaves="2" stitchTiles="stitch" seed="3"/>
      <feColorMatrix values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 0.07 0"/>
    </filter>
  </defs>

  <rect width="1200" height="630" fill="url(#paper)"/>

  <!-- Horizon arcs -->
  <g opacity="0.85">
    <circle cx="980" cy="560" r="320" fill="url(#sun)"/>
    <path d="M 760 560 Q 980 460 1200 560" fill="none" stroke="${INK}" stroke-opacity="0.12" stroke-width="1.5"/>
    <path d="M 720 590 Q 980 470 1240 590" fill="none" stroke="${INK}" stroke-opacity="0.10" stroke-width="1.5"/>
    <path d="M 680 620 Q 980 480 1280 620" fill="none" stroke="${INK}" stroke-opacity="0.08" stroke-width="1.5"/>
  </g>

  <!-- Wordmark + rule -->
  <g>
    <text x="80" y="92" font-family="Inter" font-weight="700" font-size="26" letter-spacing="6" fill="${INK}">${escapeXml(v.eyebrow)}</text>
    <rect x="80" y="108" width="44" height="2" fill="${COPPER}"/>
  </g>

  <!-- Headline -->
  <text x="80" y="260" font-family="Inter" font-weight="600" font-size="84" fill="${INK}" letter-spacing="-2">
    ${titleLines}
  </text>

  <!-- Caption -->
  <text x="80" y="538" font-family="Inter" font-weight="500" font-size="22" fill="${SUBTITLE}" letter-spacing="0">
    ${escapeXml(v.caption)}
  </text>

  <!-- URL -->
  <text x="80" y="578" font-family="Inter" font-weight="600" font-size="20" fill="${INK}" letter-spacing="3">
    ${escapeXml(v.url.toUpperCase())}
  </text>

  <!-- Hairline frame -->
  <rect x="40" y="40" width="1120" height="550" fill="none" stroke="${INK}" stroke-opacity="0.18" stroke-width="1"/>

  <!-- Grain overlay -->
  <rect width="1200" height="630" filter="url(#grain)" opacity="0.55"/>
</svg>`;
}

async function main() {
  const fontBuffers = await fetchFonts();
  await fs.mkdir(OUT_DIR, { recursive: true });

  for (const v of VARIANTS) {
    const svg = svgFor(v);
    const resvg = new Resvg(svg, {
      fitTo: { mode: "width", value: 1200 },
      background: PAPER,
      font: {
        fontBuffers,
        loadSystemFonts: false,
        defaultFontFamily: "Inter",
        serifFamily: "Instrument Serif",
        sansSerifFamily: "Inter",
      },
      shapeRendering: 2,
      textRendering: 2,
    });
    const png = resvg.render().asPng();
    const pngPath = path.join(OUT_DIR, `${v.name}.png`);
    const svgPath = path.join(OUT_DIR, `${v.name}.svg`);
    await fs.writeFile(pngPath, png);
    await fs.writeFile(svgPath, svg);
    process.stdout.write(
      `✓ ${path.relative(FRONTEND_ROOT, pngPath)} (${png.length} bytes)\n`,
    );
  }
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
