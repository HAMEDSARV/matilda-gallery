import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const categories = ['Ring','Necklace','Bracelet','Partial jewelry set (half set)','Full jewelry set','Leather bracelet','Gold bracelet','Accessory bracelet','Chain','Earrings','Bangle','Coin','Custom products'];
const expected = '1399911ee6a009fc6fee4f96da015d5453984280dfb081c2494f9cb56c5360de';
const hash = data => crypto.createHash('sha256').update(data).digest('hex');
const prompt = await fs.readFile(path.join(root, 'PROMPT/PROMPT.txt'));
if (hash(prompt) !== expected) throw new Error('Original prompt changed; planning stopped.');
const exists = async p => { try { await fs.access(p); return true; } catch (e) { if(e.code === 'ENOENT') return false; throw e; } };
const report = { promptSha256: expected, products: [], summary: {} };
for (const category of categories) {
  const categoryPath = path.join(root, category);
  if (!await exists(categoryPath)) continue;
  const folders = (await fs.readdir(categoryPath, { withFileTypes: true })).filter(e => e.isDirectory() && e.name !== 'out put').sort((a,b) => a.name.localeCompare(b.name, 'en', {numeric:true}));
  for (const folder of folders) {
    const dir = path.join(categoryPath, folder.name);
    const output = path.join(dir, 'out put');
    const item = { product: `${category}/${folder.name}`, status: '', issues: [] };
    try {
      const names = (await fs.readdir(dir, {withFileTypes:true})).filter(e => e.isFile()).map(e => e.name);
      const images = names.filter(n => /\.(png|jpe?g|jfif|webp)$/i.test(n));
      const backgrounds = images.filter(n => /^background\./i.test(n));
      const colors = images.filter(n => /^color\./i.test(n));
      const photos = images.filter(n => /^\d+\./.test(n));
      if(backgrounds.length !== 1) item.issues.push('Exactly one local background required');
      if(colors.length !== 1) item.issues.push('Exactly one local color reference required');
      if(!photos.length) item.issues.push('Numbered product photos missing');
      const sources = [...backgrounds,...colors,...photos].sort();
      const fingerprints = {};
      for(const name of sources) {
        const bytes = await fs.readFile(path.join(dir,name));
        await sharp(bytes).stats(); // Decode locally; no image-model call.
        fingerprints[name] = hash(bytes);
      }
      const fingerprint = hash(JSON.stringify({prompt:expected,files:fingerprints}));
      const statePath = path.join(output,'workflow-state.json');
      let previous;
      if(await exists(statePath)) previous = JSON.parse(await fs.readFile(statePath,'utf8'));
      const png = path.join(output,'final.png');
      const webp = path.join(output,'final.webp');
      const hasPng = await exists(png), hasWebp = await exists(webp);
      if(item.issues.length) item.status = 'blocked_inputs';
      else if(previous && previous.inputFingerprint !== fingerprint) item.status = 'changed_inputs_review';
      else if(hasPng && hasWebp) {
        const [a,b,pm,wm] = await Promise.all([
          sharp(png).toColourspace('srgb').ensureAlpha().raw().toBuffer(),
          sharp(webp).toColourspace('srgb').ensureAlpha().raw().toBuffer(),
          sharp(png).metadata(),sharp(webp).metadata()
        ]);
        if(pm.format !== 'png' || wm.format !== 'webp' || pm.width !== wm.width || pm.height !== wm.height || !a.equals(b)) throw new Error('Existing output pair is invalid or has different pixels');
        item.status = 'delivered_skip';
        item.dimensions = [pm.width,pm.height];
        item.exactTargetDimensions = pm.width === 1080 && pm.height === 1920;
        item.visualApproval = previous?.visualApproval ?? 'See review.txt; not inferred by planner';
        item.inputBaseline = previous ? 'previously recorded' : 'recorded now; historical input provenance not verified';
      } else if(hasPng) item.status = 'export_only';
      else if(hasWebp || await exists(path.join(output,'request.txt')) || previous) item.status = 'interrupted_review';
      else item.status = 'ready';
      if(!previous && item.status !== 'blocked_inputs') {
        await fs.mkdir(output,{recursive:true});
        await fs.writeFile(statePath, JSON.stringify({inputFingerprint:fingerprint,sourceHashes:fingerprints,status:item.status,visualApproval:item.visualApproval ?? 'pending',baselineRecordedAt:new Date().toISOString()},null,2)+'\n',{flag:'wx'});
      }
    } catch(error) { item.status = 'failed_review'; item.issues.push(error.message); }
    report.products.push(item);
    report.summary[item.status] = (report.summary[item.status] ?? 0) + 1;
  }
}
await fs.writeFile(path.join(root,'workflow-plan.json'),JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify(report.summary));
console.log('Details: workflow-plan.json. No images generated.');
