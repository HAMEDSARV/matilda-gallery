import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const input = path.resolve(root, process.argv[2] || '');
const relative = path.relative(root, input);
if (!relative || relative.startsWith('..') || path.isAbsolute(relative)) throw new Error('Supply an image inside this project.');
const sourcePath = await fs.realpath(input);
const resolvedRelative = path.relative(root, sourcePath);
if (resolvedRelative.startsWith('..') || path.isAbsolute(resolvedRelative)) throw new Error('Source resolves outside project.');
const source = await fs.readFile(sourcePath);
const metadata = await sharp(source).metadata();
const scale = Math.max(1, Math.min(1080 / metadata.width, 1920 / metadata.height));
const width = Math.round(metadata.width * scale);
const height = Math.round(metadata.height * scale);
const destination = path.join(path.dirname(input), `delivery-${crypto.randomUUID()}`);
await fs.mkdir(destination);
await fs.writeFile(path.join(destination,'original'+path.extname(input)), source, {flag:'wx'});
let pipeline = sharp(source).toColourspace('srgb');
if (scale > 1) pipeline = pipeline.resize(width,height,{kernel:'lanczos3',fit:'fill'});
const png = await pipeline.png().toBuffer();
const webp = await sharp(png).webp({lossless:true,effort:6}).toBuffer();
const [before,after] = await Promise.all([
  sharp(png).ensureAlpha().raw().toBuffer(),
  sharp(webp).ensureAlpha().raw().toBuffer()
]);
if (!before.equals(after)) throw new Error('Lossless pixel verification failed.');
await fs.writeFile(path.join(destination,'final.png'),png,{flag:'wx'});
await fs.writeFile(path.join(destination,'final.webp'),webp,{flag:'wx'});
const report = {
  source:relative,sourceSha256:crypto.createHash('sha256').update(source).digest('hex'),
  sourceDimensions:[metadata.width,metadata.height],dimensions:[width,height],
  method:scale > 1 ? 'lanczos3' : 'no resize; source already meets a target boundary',
  aiReconstruction:false,sharpening:false,cropping:false,
  exactTargetDimensions:width===1080 && height===1920,
  decodedPixelsIdentical:true,visualApproval:'pending',
  note:'Proportions preserved with pixel rounding. Resampling changes pixels; no recovery of missing detail or exact background preservation claimed.'
};
await fs.writeFile(path.join(destination,'delivery-report.json'),JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({destination:path.relative(root,destination),...report}));
