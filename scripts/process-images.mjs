// Web-optimize the curriculum textbook cover for the site.
// We use the TITLE-ONLY crop (top of the cover: the "ELA Bible · Grade 7"
// scroll and sky) — the full cover art was intentionally not used.
import sharp from 'sharp';

const IN = 'incoming';
const OUT = 'public/images';

const coverSrc = `${IN}/ELA_Bible_Grade7_Unit1_WraparoundCover_BlankBanner(ok).png`;
const meta = await sharp(coverSrc).metadata();
console.log(`wraparound: ${meta.width}x${meta.height}`);

// Front cover ≈ right panel, past the spine. Crop the top 55% = scroll + sky,
// which sits above the figures in the cover art.
const left = Math.round(meta.width * 0.539);
const cropW = meta.width - left;
const cropH = Math.round(meta.height * 0.55);

await sharp(coverSrc)
  .extract({ left, top: 0, width: cropW, height: cropH })
  .resize({ width: 1000, withoutEnlargement: true })
  .jpeg({ quality: 84, mozjpeg: true })
  .toFile(`${OUT}/curriculum-cover-grade7-title.jpg`);

const m = await sharp(`${OUT}/curriculum-cover-grade7-title.jpg`).metadata();
console.log(`title crop → ${m.width}x${m.height}`);
