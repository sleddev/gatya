// Renders the 🩳 brand mark (Twemoji U+1FA73, CC-BY 4.0) into every icon Expo needs.
// Run with: node scripts/make-icons.mjs
import { readFileSync, writeFileSync } from 'node:fs';
import { Resvg } from '@resvg/resvg-js';

const BG = '#E9F2E4';
const src = readFileSync(new URL('../assets/brand/shorts.svg', import.meta.url), 'utf8');
const inner = src.replace(/^<svg[^>]*>/, '').replace(/<\/svg>\s*$/, '');
const mono = inner.replace(/fill="#[0-9A-Fa-f]{6}"/g, 'fill="#000000"');

// Place the 36x36 emoji at `scale` (fraction of the canvas) in the centre.
function compose({ size, scale, bg, body = inner }) {
  const s = (size * scale) / 36;
  const off = (size - 36 * s) / 2;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">${
    bg ? `<rect width="${size}" height="${size}" fill="${bg}"/>` : ''
  }<g transform="translate(${off} ${off}) scale(${s})">${body}</g></svg>`;
}

function png(name, svg) {
  const out = new Resvg(svg, { background: 'rgba(0,0,0,0)' }).render().asPng();
  writeFileSync(new URL(`../assets/images/${name}`, import.meta.url), out);
  console.log('wrote', name);
}

png('icon.png', compose({ size: 1024, scale: 0.64, bg: BG }));
png('android-icon-foreground.png', compose({ size: 1024, scale: 0.46 }));
png('android-icon-background.png', `<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024"><rect width="1024" height="1024" fill="${BG}"/></svg>`);
png('android-icon-monochrome.png', compose({ size: 1024, scale: 0.46, body: mono }));
png('splash-icon.png', compose({ size: 1024, scale: 0.9 }));
png('favicon.png', compose({ size: 96, scale: 0.92 }));
