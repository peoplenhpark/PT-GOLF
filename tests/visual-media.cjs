
/* Run with NODE_PATH pointing to Playwright and PTGOLF_BASE_URL to a served checkout. */
const fs=require('fs'),path=require('path'),vm=require('vm'),assert=require('node:assert/strict');
const {chromium}=require('playwright');
const root=path.resolve(__dirname,'..'),base=process.env.PTGOLF_BASE_URL||'http://127.0.0.1:8792/';
const seed=JSON.parse(fs.readFileSync(path.join(root,'data/seed.json'),'utf8').replace(/^\uFEFF/,'')),ctx={window:{}};
vm.runInNewContext(fs.readFileSync(path.join(root,'js/exercise-media.js'),'utf8'),ctx);
const media=ctx.window.ExerciseMedia,poses=require('../media/3d/poses.js');
const assetVersion=fs.readFileSync(path.join(root,'sw.js'),'utf8').match(/ptgolf-v(\d+)/)[1];
for(const e of seed.exercises){
 if(e.part==='golf'){assert(!media[e.id]);continue;}
 assert(media[e.id],e.id+' media missing');
 if(!process.env.SKIP_IMAGE_CHECK)for(const file of media[e.id].images)assert(fs.existsSync(path.join(root,file)),file);
 if(e.id==='pt_pushdown'||media[e.id].kind==='golf')continue; // Dedicated golf engine is covered by golf-3d.cjs.
 for(let i=0;i<=50;i++){
  const p=poses.pose(media[e.id].kind,Math.min(.99999,i/50),e.id);
  for(const key of ['hip','head','chest','neck','hips','shoulders','elbows','wrists','knees','ankles'])
   assert(p[key].flat().every(Number.isFinite),e.id+' invalid joint '+key);
  for(let j=0;j<2;j++)for(const [a,b,l]of [['shoulders','elbows',.29],['elbows','wrists',.285],['hips','knees',.43],['knees','ankles',.425]]){
   assert(Math.abs(poses.len(poses.sub(p[a][j],p[b][j]))-l)<.081,e.id+' excessive limb length '+a);
  }
 }
}
// Personal coaching invariants.
const deadStart=poses.pose('deadbug',0,'pt_deadbug'),deadEnd=poses.pose('deadbug',.5,'pt_deadbug');
assert.deepEqual(deadStart.ankles[0],deadEnd.ankles[0]);assert.deepEqual(deadStart.wrists[1],deadEnd.wrists[1]);assert(deadEnd.ankles[1][1]>.25);
const slr=poses.pose('slr',.5,'pt_rehab_slr');assert(slr.ankles[1][1]<.1&&slr.knees[1][1]>.3);
const clam0=poses.pose('clamshell',0,'pt_rehab_clamshell'),clam1=poses.pose('clamshell',.5,'pt_rehab_clamshell');assert.deepEqual(clam0.ankles,clam1.ankles);assert.deepEqual(clam0.hip,clam1.hip);
const curls=[0,.25,.5].map(t=>poses.pose('curl',t,'pt_armcurl').wrists[0]);assert(curls.every(p=>Math.abs(p[2]-.17)<.001));
const norm=s=>s.replace(/\s+/g,' ').trim();
(async()=>{
 const browser=await chromium.launch({headless:true,channel:'chrome'});
 const report={exercises:0,sourceLines:0,images:0,models:0,errors:[],memoPreserved:false,nativePinch:false,modelTouch:false,offline:false};
 try{
  const context=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,serviceWorkers:'block'});
  const page=await context.newPage();page.on('pageerror',e=>report.errors.push(e.message));
  for(const e of seed.exercises){
   await page.goto(base+'?v='+assetVersion+'#exercise/'+e.id);await page.waitForSelector('.d-title');
   const actual=norm(await page.locator('#app').innerText());
   const pr=seed.principles.find(p=>p.part===e.part&&p.scope===e.category)||seed.principles.find(p=>p.part===e.part&&p.scope==='*');
   const lines=[e.name,e.spec,...(e.prep||[]),...(e.steps||[]),...e.cues,...e.reminders,...Object.values(e.focus),...(pr?.items||[]),...(pr?.reminders||[]),e.memo,'내 메모'].filter(Boolean);
   for(const line of lines){assert(actual.includes(norm(line)),e.id+' content lost: '+line);report.sourceLines++;}
   if(!media[e.id]){assert.equal(await page.locator('.guide-shot,.exercise-3d,.ex-figure').count(),0);assert(!(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth)),e.id+' horizontal overflow');report.exercises++;continue;}
   assert.equal(await page.locator('.guide-shot').count(),2);assert.equal(await page.locator('.exercise-3d summary').innerText(),'입체로 자세 보기');
   assert.equal(await page.locator('iframe').count(),0);
   const order=await page.locator('.scr').evaluate(el=>Array.from(el.children).filter(x=>x.matches('.pushdown-guide,.exercise-guide,.exercise-3d,.focus-box')).map(x=>x.className.split(' ')[0]));
   assert.deepEqual(order,e.id==='pt_pushdown'?['focus-box','pushdown-guide','exercise-3d']:['focus-box','exercise-guide','exercise-3d']);
   assert(!(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth)),e.id+' horizontal overflow');
   if(!process.env.SKIP_IMAGE_CHECK){
    await page.waitForFunction(()=>[...document.querySelectorAll('.guide-shot img')].every(i=>i.complete&&i.naturalWidth>0));
    report.images+=2;
   }
   await page.locator('.exercise-3d summary').click();
   const frame=page.frameLocator('.exercise-3d-frame');await frame.locator('canvas[data-yaw]').waitFor();
   await frame.locator('#progress').fill('500');await frame.locator('#progress').dispatchEvent('input');
   await frame.getByRole('button',{name:'뒤',exact:true}).click();
   assert(Math.abs(Number(await frame.locator('canvas').getAttribute('data-yaw'))-Math.PI)<.001);
   await frame.getByRole('button',{name:'처음 시점',exact:true}).click();
   if(e.id!=='pt_pushdown'){
    const model=await frame.locator('canvas').evaluate(()=>window.exerciseViewer.snapshot());assert.equal(model.id,e.id);assert.equal(model.kind,media[e.id].kind);if(model.kind==='golf')assert.equal(model.renderer,'golf-mocap-v2');else assert(model.meshCount>50);
   }
   await page.waitForTimeout(40);
   const frameHeight=await page.locator('iframe').evaluate(el=>el.getBoundingClientRect().height),bodyHeight=await frame.locator('body').evaluate(el=>el.getBoundingClientRect().height);
   assert(frameHeight>=bodyHeight,e.id+' iframe clips controls');
   if(process.env.SCREENSHOT_DIR){
    fs.mkdirSync(process.env.SCREENSHOT_DIR,{recursive:true});
    await frame.locator('#viewport').screenshot({path:path.join(process.env.SCREENSHOT_DIR,e.id+'.png')});
   }
   await page.locator('.exercise-3d summary').click();await page.waitForFunction(()=>!document.querySelector('iframe'));
   report.models++;report.exercises++;
  }
  // Existing full-object overlays must never be rewritten by new media.
  const ex=seed.exercises.find(e=>e.id==='pt_deadbug');
  const overlay={overrides:{[ex.id]:{...ex,memo:'예전 메모\n<b>문자 그대로</b>',favorite:true,cues:[...ex.cues,'개인 확인사항']}},deleted:[]};
  const legacy=await browser.newContext({viewport:{width:390,height:844},serviceWorkers:'block'});
  await legacy.addInitScript(o=>localStorage.setItem('ptgolf_overlay_v1',JSON.stringify(o)),overlay);
  const lp=await legacy.newPage();await lp.goto(base+'#exercise/'+ex.id);await lp.waitForSelector('.memo-box');
  assert.equal(await lp.locator('.memo-box').innerText(),overlay.overrides[ex.id].memo);assert.equal(await lp.locator('.memo-box b').count(),0);
  assert.equal(await lp.locator('.fav.on').count(),1);assert((await lp.locator('#app').innerText()).includes('개인 확인사항'));
  assert.equal(await lp.evaluate(()=>localStorage.getItem('ptgolf_overlay_v1')),JSON.stringify(overlay));
  await page.goto(base+'#exercise/pt_deadbug');await page.waitForSelector('.memo-edit');await page.locator('.memo-edit').click();
  await page.locator('#memo-input').fill('새 메모\n허리 고정 <check>');await page.locator('#memo-save').click();await page.reload();await page.waitForSelector('.memo-box');
  assert.equal(await page.locator('.memo-box').innerText(),'새 메모\n허리 고정 <check>');report.memoPreserved=true;
  if(!process.env.SKIP_IMAGE_CHECK){
   await page.goto(base+'#exercise/pt_deadbug');await page.waitForSelector('.guide-pair img');
   await page.bringToFront();
   const cdp=await context.newCDPSession(page);
   await page.locator('.guide-shot img').first().scrollIntoViewIfNeeded();
   const imageBox=await page.locator('.guide-shot img').first().boundingBox();
   const ix=195,iy=imageBox.y+imageBox.height/2;
   await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:ix-45,y:iy,id:1},{x:ix+45,y:iy,id:2}]});
   for(let i=1;i<=8;i++){
    await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:ix-45-i*10,y:iy,id:1},{x:ix+45+i*10,y:iy,id:2}]});
    await page.waitForTimeout(30);
   }
   await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
   await page.waitForTimeout(400);assert((await page.evaluate(()=>visualViewport.scale))>1.1);report.nativePinch=true;
   await cdp.send('Emulation.setPageScaleFactor',{pageScaleFactor:1});
   await page.locator('.exercise-3d summary').click();
   const mf=page.frameLocator('iframe');await mf.locator('canvas[data-ready]').waitFor();await mf.locator('canvas').scrollIntoViewIfNeeded();
   const box=await mf.locator('canvas').boundingBox(),x=box.x+box.width/2,y=box.y+box.height/2;
   const yawBefore=Number(await mf.locator('canvas').getAttribute('data-yaw')),distBefore=Number(await mf.locator('canvas').getAttribute('data-distance'));
   await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:x-30,y,id:1}]});
   await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:x+30,y:y+5,id:1}]});
   await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
   assert(Math.abs(Number(await mf.locator('canvas').getAttribute('data-yaw'))-yawBefore)>.1);
   await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:x-30,y,id:1},{x:x+30,y,id:2}]});
   await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:x-35,y,id:1},{x:x+35,y,id:2}]});
   await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:x-60,y,id:1},{x:x+60,y,id:2}]});
   await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
   assert(Number(await mf.locator('canvas').getAttribute('data-distance'))<distBefore);report.modelTouch=true;
   const offline=await browser.newContext({viewport:{width:390,height:844},serviceWorkers:'allow'}),op=await offline.newPage();
   await op.goto(base+'#exercise/pt_deadbug');await op.waitForSelector('.guide-pair');await op.evaluate(()=>navigator.serviceWorker.ready);
   await op.reload();await op.waitForFunction(()=>[...document.querySelectorAll('.guide-shot img')].length===2&&[...document.querySelectorAll('.guide-shot img')].every(i=>i.complete&&i.naturalWidth>0));
   await op.locator('.exercise-3d summary').click();await op.frameLocator('iframe').locator('canvas[data-ready]').waitFor();
   await offline.setOffline(true);await op.reload();await op.waitForSelector('.guide-pair');
   await op.waitForFunction(()=>[...document.querySelectorAll('.guide-shot img')].every(i=>i.complete&&i.naturalWidth>0));
   await op.locator('.exercise-3d summary').click();await op.frameLocator('iframe').locator('canvas[data-ready]').waitFor();report.offline=true;
  }
  assert.equal(report.errors.length,0);
  fs.writeFileSync(path.join(root,'docs/visuals/verification.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report));
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exit(1);});
