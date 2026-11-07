import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import sharp from 'sharp';
import {execFileSync} from 'node:child_process';
const root=process.cwd();
const mode=process.argv[2];
const plan=JSON.parse(await fs.readFile('workflow-plan.json','utf8'));
async function pairs(dir){
  let entries; try{entries=await fs.readdir(dir,{withFileTypes:true});}catch(e){if(e.code==='ENOENT')return [];throw e;}
  const result=[];
  if(entries.some(e=>e.name==='final.png')&&entries.some(e=>e.name==='final.webp')){
    const a=path.join(dir,'final.png'), b=path.join(dir,'final.webp');
    const [am,bm,ap,bp]=await Promise.all([sharp(a).metadata(),sharp(b).metadata(),sharp(a).toColourspace('srgb').ensureAlpha().raw().toBuffer(),sharp(b).toColourspace('srgb').ensureAlpha().raw().toBuffer()]);
    if(am.format==='png'&&bm.format==='webp'&&am.width===bm.width&&am.height===bm.height&&ap.equals(bp)) result.push({directory:dir,dimensions:[am.width,am.height],pixelsIdentical:true});
  }
  for(const e of entries.filter(e=>e.isDirectory()))result.push(...await pairs(path.join(dir,e.name)));
  return result;
}
if(mode==='accept'){
 const runPath=process.argv[3],run=JSON.parse(await fs.readFile(runPath,'utf8'));
 const sample=run.completed.find(p=>p.product==='Necklace/178794');
 const record=JSON.parse(await fs.readFile(sample.review,'utf8'));record.approval='User explicitly approved image and requested continuation without further visual review on 2026-11-04';record.status='user_accepted';await fs.writeFile(sample.review,JSON.stringify(record,null,2));sample.status='user_accepted';
 run.status='running';run.previousBlocker=run.blocker;delete run.blocker;run.continuationAuthorization=record.approval;await fs.writeFile(runPath,JSON.stringify(run,null,2));console.log('Approval recorded; continuation authorized.');
}else if(mode==='audit'){
  const report={startedAt:new Date().toISOString(),status:'prepared',order:[],skipped:[],review:[],completed:[],failed:[],modelRequested:'GPT Image 2.5 Sunburst / max',modelVerified:false};
  for(const p of plan.products){const outputs=await pairs(path.join(p.product,'out put'));if(outputs.length){report.skipped.push({product:p.product,status:p.status,outputs});}else if(p.status==='ready'){report.order.push(p.product);}else report.review.push(p);}
  const name='continuation-2026-11-04-'+Date.now()+'.json';await fs.writeFile(name,JSON.stringify(report,null,2));console.log(JSON.stringify({report:name,remaining:report.order.length,skipped:report.skipped.length,review:report.review.map(p=>({product:p.product,status:p.status})),next:report.order[0]}));
}else if(mode==='finish'){
 const dir=process.argv[3],source=process.argv[4];
 if(!path.resolve(dir).startsWith(root+path.sep))throw Error('Output outside project');
 const record=JSON.parse(await fs.readFile(path.join(dir,'review.json'),'utf8'));
 const request=await fs.readFile(path.join(dir,'request.txt'),'utf8');
 const generated=path.join(dir,'generated.png');await fs.copyFile(source,generated,fs.constants.COPYFILE_EXCL);
 const delivery=JSON.parse(execFileSync(process.execPath,['scripts/prepare-delivery.mjs',generated],{encoding:'utf8'}));
 const outputs=await pairs(delivery.destination);if(outputs.length!==1)throw Error('Delivery verification failed');
 Object.assign(record,{requestSha256:crypto.createHash('sha256').update(request).digest('hex'),status:'delivered_visual_review_waived',delivery,technical:{...(outputs[0]),losslessWebp:true,colourSpace:'srgb'},visual:{verification:'Detailed visual review waived by user on 2026-11-04 after approval of sample 178794; no exact geometry/background/color certification'},finishedAt:new Date().toISOString()});
 if(process.argv[6]==='wrong_product'){record.status='failed_wrong_product';record.visual={verdict:'Generated crown-heart material-reference product instead of photographed three-circle charm; incorrect result retained, no approval inferred'};}
 await fs.writeFile(path.join(dir,'review.json'),JSON.stringify(record,null,2));
 const statePath=path.join(record.product,'out put','workflow-state.json');const state=JSON.parse(await fs.readFile(statePath,'utf8'));state.status=record.status;state.visualApproval='review waived by user';state.latestReview=path.join(dir,'review.json');await fs.writeFile(statePath,JSON.stringify(state,null,2));
 const runPath=process.argv[5];const run=JSON.parse(await fs.readFile(runPath,'utf8'));(record.status.startsWith('failed')?run.failed:run.completed).push({product:record.product,status:record.status,review:path.join(dir,'review.json'),delivery:delivery.destination});run.remaining=run.order.filter(p=>![...run.completed,...run.failed].some(c=>c.product===p));run.status=run.remaining.length?'running':'completed';await fs.writeFile(runPath,JSON.stringify(run,null,2));
 console.log(JSON.stringify({review:path.join(dir,'review.json'),delivery:delivery.destination,dimensions:delivery.dimensions,pixelsIdentical:true,remaining:run.remaining.length}));
}else if(mode==='prepare'){
 const product=process.argv[3];let primary=process.argv[4];
 const p=plan.products.find(p=>p.product===product);if(!p||p.status!=='ready')throw Error('Product is not ready');
 if((await pairs(path.join(product,'out put'))).length)throw Error('Existing delivery: skip generation');
 const names=await fs.readdir(product);const photos=names.filter(n=>/^\d+\.(png|jpe?g|webp|jfif)$/i.test(n)).sort((a,b)=>a.localeCompare(b,'en',{numeric:true}));
 if(!primary)primary=photos.includes('2.jpeg')?'2.jpeg':photos[0];
 if(!photos.includes(primary))throw Error('Primary photo missing');
 const dir=path.join(product,'out put','continuation-'+Date.now());await fs.mkdir(dir);
 const parts=JSON.parse(await fs.readFile(product.startsWith('Necklace/')?'tmp/category-necklace.json':'tmp/category-leather-bracelet.json','utf8'));
 const category=parts.map(p=>p.text).join('\n\n');
 const lighting=await fs.readFile('PROMPT/ADDENDUM-lighting-polish.txt','utf8'), metal=await fs.readFile('PROMPT/ADDENDUM-metallic-reference.txt','utf8');
 const background=names.find(n=>/^background\./i.test(n)), color=names.find(n=>/^color\./i.test(n));
 const material=path.join(dir,'material-reference.png');await fs.copyFile('Necklace/178793/out put/careful-1793718667375/material-reference.png',material,fs.constants.COPYFILE_EXCL);
 const supporting=photos.filter(n=>n!==primary).slice(0,1);
 const refs=[primary,...supporting,background,color].map(n=>path.resolve(product,n));refs.push(path.resolve(material));
 const extra=`PROJECT EXECUTION ADDENDUM — does not replace the original prompt\nProduct folder: ${product}\nPrimary product photograph: ${path.resolve(product,primary)}. Preserve its photographed geometry, arrangement and partial view.\nSupporting photographs: ${supporting.join(', ')} — details verification only; never mix poses.\nBackground asset: ${path.resolve(product,background)} — fulfills background.webp role.\nGold color reference: ${path.resolve(product,color)} — fulfills color.webp role.\nMaterial reference: ${path.resolve(material)} — authorized polished gold material response only; no geometry, layout or background transfer.\nUse only this product folder's product references. Keep all visible primary-photo components together as one proportionally scaled object within the placement rectangle; source-cropped endpoints remain inside the placement rectangle, with no unseen completion.\nThe first comparison samples in the retained addenda were already produced. This is the user-authorized continuation of remaining products.\nCreate one finished composition. Local export creates lossless PNG and WebP from the same image.\nDestination: ${dir}`;
 const prompt=[category,lighting,metal,extra].join('\n\n');await fs.writeFile(path.join(dir,'request.txt'),prompt,{flag:'wx'});
 const record={product,directory:dir,primary,refs,promptFile:p.promptFile,promptSha256:p.promptSha256,requestSha256:crypto.createHash('sha256').update(prompt).digest('hex'),modelRequested:'GPT Image 2.5 Sunburst / max',actualModel:'not independently exposed',quality:'not independently exposed',status:'prepared',numericGoldAccuracy:'not measured',pixelExactPreservation:'not certified'};
 await fs.writeFile(path.join(dir,'review.json'),JSON.stringify(record,null,2));console.log(JSON.stringify({...record,prompt}));
}
