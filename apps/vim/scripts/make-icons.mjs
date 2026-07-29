// Generates the app icon at every size the three surfaces need, from one SVG defined here.
// Run with `npm run icons`. Committed output, so a clean checkout builds without sharp.
//
// The mark is the Wheel: five concentric arcs, each a real planet colour from
// src/theme/tokens.ts, each filled to a different fraction — because five rulers at five
// speeds is the entire product and the icon should say so before the app opens.

import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const here = dirname(fileURLToPath(import.meta.url));
const outDir = resolve(here, '../public/icons');

const BASE = '#1B1D24';
const WELL = '#181A20';
const TRACK = '#24272F';

/** [radius, stroke, colour, fraction filled] — outermost first, fastest first. */
const RINGS = [
  [206, 26, '#F2EDE4', 0.82], // Moon      — Messenger
  [166, 24, '#61C7F0', 0.64], // Ketu      — Magistrate
  [128, 22, '#2FBF71', 0.46], // Mercury   — Governor
  [92, 20, '#FF6FA5', 0.3], // Venus     — Prime Minister
  [58, 18, '#FF7A18', 0.58], // Sun       — King
];

function svg({ size = 512, padding = 0 } = {}) {
  const vb = 512;
  const c = vb / 2;
  const scale = (vb - padding * 2) / vb;
  const arcs = RINGS.map(([r, w, colour, frac]) => {
    const circumference = 2 * Math.PI * r;
    return `
      <circle cx="${c}" cy="${c}" r="${r}" fill="none" stroke="${TRACK}" stroke-width="${w}" opacity="0.85"/>
      <circle cx="${c}" cy="${c}" r="${r}" fill="none" stroke="${colour}" stroke-width="${w}"
              stroke-linecap="round"
              stroke-dasharray="${circumference}"
              stroke-dashoffset="${circumference * (1 - frac)}"
              transform="rotate(-90 ${c} ${c})"/>`;
  }).join('');

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${vb} ${vb}">
  <rect width="${vb}" height="${vb}" fill="${BASE}"/>
  <g transform="translate(${c} ${c}) scale(${scale}) translate(${-c} ${-c})">
    <circle cx="${c}" cy="${c}" r="238" fill="${WELL}"/>
    ${arcs}
  </g>
</svg>`;
}

const TARGETS = [
  // PWA + web
  { name: 'icon-192.png', size: 192, padding: 0 },
  { name: 'icon-512.png', size: 512, padding: 0 },
  // Maskable icons get cropped to a circle or squircle by the OS, so the art is inset
  // to the 80% safe zone. Skipping this is why so many Android icons look decapitated.
  { name: 'icon-maskable-512.png', size: 512, padding: 52 },
  { name: 'apple-touch-icon.png', size: 180, padding: 0 },
  { name: 'favicon-32.png', size: 32, padding: 0 },
];

await mkdir(outDir, { recursive: true });
for (const t of TARGETS) {
  const buf = Buffer.from(svg({ size: t.size, padding: t.padding }));
  await sharp(buf, { density: 384 }).resize(t.size, t.size).png({ compressionLevel: 9 }).toFile(
    resolve(outDir, t.name),
  );
  console.log(`wrote icons/${t.name}`);
}
// The SVG itself, for the browser tab: sharp isn't needed to serve it and it stays crisp.
await writeFile(resolve(outDir, 'icon.svg'), svg({ size: 512 }), 'utf8');
console.log('wrote icons/icon.svg');
