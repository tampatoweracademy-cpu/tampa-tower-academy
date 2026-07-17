// One-off: turn the crest's solid pale background transparent, trim, optimize.
// Flood-fills from the image borders, so the cream banner/book INSIDE the
// crest (walled off by the dark outline) are preserved.
import sharp from 'sharp';

const SRC = 'incoming/Logo Tampa Tower.png';
const OUT = 'public/images/logo.png';
const TOL = 46; // color distance tolerance for "background"

const { data, info } = await sharp(SRC)
  .ensureAlpha()
  .raw()
  .toBuffer({ resolveWithObject: true });

const { width, height, channels } = info;
if (channels !== 4) throw new Error(`expected 4 channels, got ${channels}`);

const at = (x, y) => (y * width + x) * channels;
const corners = [at(0, 0), at(width - 1, 0), at(0, height - 1), at(width - 1, height - 1)];
const bg = [0, 1, 2].map((c) => Math.round(corners.reduce((s, i) => s + data[i + c], 0) / 4));
console.log('detected background rgb:', bg);

const close = (i) => {
  const dr = data[i] - bg[0], dg = data[i + 1] - bg[1], db = data[i + 2] - bg[2];
  return Math.sqrt(dr * dr + dg * dg + db * db) <= TOL;
};

const visited = new Uint8Array(width * height);
const stack = [];
const tryPush = (x, y) => {
  if (x < 0 || y < 0 || x >= width || y >= height) return;
  const p = y * width + x;
  if (visited[p]) return;
  const i = p * channels;
  if (close(i)) { visited[p] = 1; data[i + 3] = 0; stack.push(p); }
};

for (let x = 0; x < width; x++) { tryPush(x, 0); tryPush(x, height - 1); }
for (let y = 0; y < height; y++) { tryPush(0, y); tryPush(width - 1, y); }
while (stack.length) {
  const p = stack.pop();
  const x = p % width, y = (p - x) / width;
  tryPush(x + 1, y); tryPush(x - 1, y); tryPush(x, y + 1); tryPush(x, y - 1);
}

let removed = 0;
for (let p = 0; p < width * height; p++) if (visited[p]) removed++;
console.log(`made ${removed} px transparent (${((removed / (width * height)) * 100).toFixed(1)}%)`);

await sharp(Buffer.from(data), { raw: { width, height, channels } })
  .png()
  .trim() // crop the now-transparent margin
  .resize({ width: 800, height: 800, fit: 'inside', withoutEnlargement: true })
  .png({ compressionLevel: 9, palette: true })
  .toFile(OUT);

const meta = await sharp(OUT).metadata();
console.log(`wrote ${OUT} → ${meta.width}x${meta.height}`);
