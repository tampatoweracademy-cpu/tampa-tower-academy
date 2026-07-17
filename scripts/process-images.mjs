// Crop the front cover out of the wraparound and web-optimize the curriculum art.
import sharp from 'sharp';

const IN = 'incoming';
const OUT = 'public/images';

// --- 1. Textbook front cover (crop right-hand panel from the wraparound) ---
const coverSrc = `${IN}/ELA_Bible_Grade7_Unit1_WraparoundCover_BlankBanner(ok).png`;
const meta = await sharp(coverSrc).metadata();
console.log(`wraparound: ${meta.width}x${meta.height}`);

// Front cover ≈ right panel, past the spine. Tuned to the ~5514px-wide art.
const left = Math.round(meta.width * 0.539);
const cropW = meta.width - left;
await sharp(coverSrc)
  .extract({ left, top: 0, width: cropW, height: meta.height })
  .resize({ width: 1000, withoutEnlargement: true })
  .jpeg({ quality: 84, mozjpeg: true })
  .toFile(`${OUT}/curriculum-cover-grade7.jpg`);
const cc = await sharp(`${OUT}/curriculum-cover-grade7.jpg`).metadata();
console.log(`front cover → ${cc.width}x${cc.height}`);

// --- 2. Garden / curriculum illustrations ---
const scenes = [
  ['hf_20260621_235442_50f38e1f-b937-4d47-960a-70687f5131f3.png', 'eden-garden.jpg'],
  ['hf_20260622_012554_90b893bc-9ed1-4f07-8688-192e056a4356.png', 'eden-temptation.jpg'],
  ['hf_20260622_013006_104c31cd-e63c-468a-81d1-f7aec44b6222.png', 'eden-offering.jpg'],
];
for (const [src, out] of scenes) {
  await sharp(`${IN}/${src}`)
    .resize({ width: 1400, withoutEnlargement: true })
    .jpeg({ quality: 82, mozjpeg: true })
    .toFile(`${OUT}/${out}`);
  const m = await sharp(`${OUT}/${out}`).metadata();
  console.log(`${out} → ${m.width}x${m.height}`);
}
