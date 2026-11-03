import fs from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

// Authorized single-product experiment: proportional Lanczos, no AI or sharpening.
const source = 'Necklace/1/out put/final.png';
const destination = 'Necklace/1/out put/lanczos-preview';
await fs.mkdir(destination, { recursive: true });
const bytes = await fs.readFile(source);
const meta = await sharp(bytes).metadata();
const width = 1080;
const height = Math.round(meta.height * width / meta.width);
const pngPath = path.join(destination, 'preview.png');
const png = await sharp(bytes).resize(width, height, { kernel: 'lanczos3', fit: 'fill' }).keepIccProfile().png().toBuffer();
await fs.writeFile(pngPath, png, { flag: 'wx' });
await fs.writeFile(path.join(destination, 'review.txt'),
  `Experimental preview only; user review pending.\nSource: ${source}\nSource dimensions: ${meta.width}x${meta.height}\nPreview dimensions: ${width}x${height}\nMethod: proportional Lanczos3 resampling; no AI reconstruction, sharpening, cropping or retouching.\nNo new photographic detail is recovered. Resampling changes pixel values and may soften edges or cause ringing.\nNot exactly 1080x1920: original proportions retained rather than stretched or cropped.\nOriginal background and product pixels are resampled together; pixel-exact preservation is not claimed.\nNot enabled for batch delivery.\n`, { flag: 'wx' });
console.log(JSON.stringify({source, pngPath, width, height}));
