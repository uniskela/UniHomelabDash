import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const publicDir = path.join(root, "public");
const brandingDir = path.join(root, "docs", "branding");

const exports = [
  { input: path.join(publicDir, "icon.svg"), output: path.join(publicDir, "icon-192.png"), size: 192 },
  { input: path.join(publicDir, "icon.svg"), output: path.join(publicDir, "icon-512.png"), size: 512 },
  { input: path.join(publicDir, "icon.svg"), output: path.join(publicDir, "apple-touch-icon.png"), size: 180 },
  {
    input: path.join(brandingDir, "icon-maskable-burgundy.svg"),
    output: path.join(publicDir, "icon-512-maskable.png"),
    size: 512,
  },
  {
    input: path.join(brandingDir, "github-avatar-control-rail.svg"),
    output: path.join(brandingDir, "github-avatar-512.png"),
    size: 512,
  },
];

for (const item of exports) {
  await sharp(item.input).resize(item.size, item.size).png().toFile(item.output);
  console.log(`Wrote ${path.relative(root, item.output)}`);
}

const faviconSizes = [32, 16];
const faviconBuffers = await Promise.all(
  faviconSizes.map((size) => sharp(path.join(publicDir, "icon.svg")).resize(size, size).png().toBuffer())
);

await sharp(faviconBuffers[0])
  .resize(32, 32)
  .toFormat("png")
  .toFile(path.join(publicDir, "favicon-32.png"));

console.log(`Wrote public/favicon-32.png`);
