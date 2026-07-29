// Rasterises public/icon.svg into the PNG sizes the manifest and iOS need.
// Run with `npm run icons` after changing the mark; the PNGs are committed so
// a normal build needs no image tooling.
import { readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const publicDir = resolve(dirname(fileURLToPath(import.meta.url)), '..', 'public');
const source = await readFile(resolve(publicDir, 'icon.svg'));

// Maskable icons get cropped to a circle on some launchers, so the mark is
// inset to the 80% safe zone over a solid brand background.
const maskable = Buffer.from(
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
     <rect width="512" height="512" fill="#14563C"/>
     <g transform="translate(153.6 153.6) scale(8.53)" fill="none" stroke="#D6FD91"
        stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round">
       <path d="m2.5 19 6.2-10.6L12.4 14l2.3-3.7L21.5 19H2.5Z"/>
       <path d="m8.7 8.4 1.7-2.9"/>
     </g>
   </svg>`,
);

const outputs = [
  { file: 'icon-192.png', size: 192, svg: source },
  { file: 'icon-512.png', size: 512, svg: source },
  { file: 'icon-180.png', size: 180, svg: source },
  { file: 'icon-maskable-512.png', size: 512, svg: maskable },
];

for (const { file, size, svg } of outputs) {
  const png = await sharp(svg, { density: 384 }).resize(size, size).png().toBuffer();
  await writeFile(resolve(publicDir, file), png);
  console.log(`wrote public/${file} (${size}×${size})`);
}
