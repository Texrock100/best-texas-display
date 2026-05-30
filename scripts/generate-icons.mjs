// Generates PWA icons from the brand mark using sharp.
// Run: node scripts/generate-icons.mjs
import sharp from "sharp";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const publicDir = join(__dirname, "..", "public");

// Rounded-tile mark (matches favicon.svg) — used for the standard "any" icons.
const tileSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" fill="none">
  <rect width="64" height="64" rx="12" fill="#1B3A5C"/>
  <polygon points="32,6 40.5,24 58,24 44,35 49,54 32,42 15,54 20,35 6,24 23.5,24" fill="#D4A843"/>
  <polygon points="32,12 37.5,25.5 51,25.5 40,33 44,47 32,38 20,47 24,33 13,25.5 26.5,25.5" fill="#1B3A5C"/>
</svg>`;

// Full-bleed navy square with a centered star — safe for Android maskable icons
// (star sits well within the 80% safe zone).
const maskableSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <rect width="512" height="512" fill="#1B3A5C"/>
  <g transform="translate(256,256) scale(4.2) translate(-32,-32)">
    <polygon points="32,6 40.5,24 58,24 44,35 49,54 32,42 15,54 20,35 6,24 23.5,24" fill="#D4A843"/>
    <polygon points="32,12 37.5,25.5 51,25.5 40,33 44,47 32,38 20,47 24,33 13,25.5 26.5,25.5" fill="#1B3A5C"/>
  </g>
</svg>`;

async function render(svg, size, outName) {
  await sharp(Buffer.from(svg))
    .resize(size, size)
    .png()
    .toFile(join(publicDir, outName));
  console.log(`  wrote public/${outName} (${size}x${size})`);
}

console.log("Generating PWA icons...");
await render(tileSvg, 192, "icon-192.png");
await render(tileSvg, 512, "icon-512.png");
await render(maskableSvg, 512, "icon-maskable-512.png");
await render(tileSvg, 180, "apple-touch-icon.png");
console.log("Done.");
