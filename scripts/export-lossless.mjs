import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

// Convert a generated PNG without resizing, retouching, or overwriting files.
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const input = path.resolve(root, process.argv[2] || '');
const relative = path.relative(root, input);
if (!relative || relative.startsWith('..') || path.isAbsolute(relative)) {
  throw new Error('Supply a PNG path inside this project.');
}
if (!input.toLowerCase().endsWith('.png')) throw new Error('A PNG source is required.');
const output = input.slice(0, -4) + '.webp';
const reportPath = input.slice(0, -4) + '.technical.json';
for (const target of [output, reportPath]) {
  try { await fs.access(target); throw new Error(`Output already exists: ${target}`); }
  catch (error) { if (error.code !== 'ENOENT') throw error; }
}
const source = await fs.readFile(input);
const metadata = await sharp(source).metadata();
if (metadata.format !== 'png') throw new Error('Source is not actually PNG.');
const webp = await sharp(source).keepIccProfile().webp({ lossless: true, effort: 6 }).toBuffer();
const [before, after, exported] = await Promise.all([
  sharp(source).toColourspace('srgb').ensureAlpha().raw().toBuffer({ resolveWithObject: true }),
  sharp(webp).toColourspace('srgb').ensureAlpha().raw().toBuffer({ resolveWithObject: true }),
  sharp(webp).metadata()
]);
const identical = before.info.width === after.info.width && before.info.height === after.info.height && before.data.equals(after.data);
if (!identical) throw new Error('Decoded pixels differ; export rejected.');
await fs.writeFile(output, webp, { flag: 'wx' });
const report = {
  png: path.relative(root, input), webp: path.relative(root, output),
  width: metadata.width, height: metadata.height,
  requiredWidth: 1080, requiredHeight: 1920,
  exactDimensions: metadata.width === 1080 && metadata.height === 1920,
  exactRatio: metadata.width * 16 === metadata.height * 9,
  losslessWebpRequested: true, decodedPixelsIdentical: identical,
  sourceColourspace: metadata.space, exportedColourspace: exported.space,
  sourceHasIccProfile: Boolean(metadata.icc), exportHasIccProfile: Boolean(exported.icc),
  visualApproval: 'not assessed by this script',
  note: 'Lossless encoding does not certify product, background, colour accuracy, or generation quality.'
};
await fs.writeFile(reportPath, JSON.stringify(report, null, 2) + '\n', { flag: 'wx' });
console.log(JSON.stringify(report, null, 2));
