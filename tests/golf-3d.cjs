/* Dedicated golf regression: actual bone/club constraints, framing and controls.
   Run against a local checkout; uses isolated Chrome contexts, never user storage. */
const assert=require('node:assert/strict'),fs=require('fs'),path=require('path');
const {chromium}=require('playwright'),P=require('../media/golf3d/poses.js');
const root=path.resolve(__dirname,'..'),base=process.env.PTGOLF_BASE_URL||'http://127.0.0.1:8792/';
const version=fs.readFileSync(path.join(root,'sw.js'),'utf8').match(/ptgolf-v(\d+)/)[1];
const near=(a,b,epsilon=1e-8)=>assert(Math.abs(a-b)<epsilon,`${a} != ${b}`);
let samples=0;
assert.equal(P.source,'CMU 64_01');
for(const id of Object.keys(P.clubs)){
 let previous;
 for(let i=0;i<=1000;i++){
  const p=P.pose(id,i/1000);
  for(const key of ['hip','head','neck','chest','shoulders','elbows','wrists','hips','knees','ankles','tip','grip','dir'])assert(p[key].flat().every(Number.isFinite),id+' invalid '+key);
  for(let j=0;j<2;j++)for(const [a,b,l]of [['shoulders','elbows',.35],['elbows','wrists',.285],['hips','knees',.47],['knees','ankles',.44]])near(P.len(P.sub(p[a][j],p[b][j])),l*p.scale);
  for(const v of [p.up,p.right,p.front])near(P.len(v),1);
  near(P.dot(p.up,p.right),0);near(P.dot(p.up,p.front),0);near(P.dot(p.right,p.front),0);
  near(P.len(P.sub(p.tip,p.grip)),p.club.length);near(P.len(P.sub(p.hands[0],p.hands[1])),.095*p.scale);
  assert.deepEqual(p.hands[0],p.grip);
  for(let j=0;j<2;j++)assert(P.len(P.sub(p.wrists[j],p.hands[j]))<.115*p.scale,id+' detached hand');
  assert(p.tip[1]>.015,id+' club passes through ground');
  if(previous)for(const key of ['tip','head','wrists','elbows','knees']){
   const before=Array.isArray(previous[key][0])?previous[key]:[previous[key]],after=Array.isArray(p[key][0])?p[key]:[p[key]];
   for(let j=0;j<before.length;j++)assert(P.len(P.sub(before[j],after[j]))<.08,id+' discontinuity '+key);
  }
  previous=p;samples++;
 }
 const p=P.pose(id,P.stages[5].t);near(P.len(P.sub(p.tip,p.contact)),0);
 // Stage labels must not act as artificial stops. Both velocity and direction
 // remain continuous through the original v53 stop locations and new labels.
 for(const t of [...P.stages.slice(1,-1).map(s=>s.t),.18,.28,.38,.47,.56,.67,.80]){
  const h=.0001,a=P.pose(id,t-h),b=P.pose(id,t),c=P.pose(id,t+h);
  const before=P.mul(P.sub(b.grip,a.grip),1/h),after=P.mul(P.sub(c.grip,b.grip),1/h);
  assert(P.len(before)>.05,id+' artificial pause at '+t);
  assert(P.len(P.sub(before,after))<.09,id+' velocity break at '+t);
 }
 const top=P.pose(id,P.stages[2].t),shift=P.pose(id,P.stages[3].t),drop=P.pose(id,P.stages[4].t),finish=P.pose(id,1);
 assert(shift.hip[0]>top.hip[0]);assert(drop.grip[1]<shift.grip[1]);assert(finish.feet[1].heel[1]>finish.feet[1].toe[1]);
}
(async()=>{
 const browser=await chromium.launch({headless:true,channel:'chrome'}),errors=[];
 const report={version:Number(version),clubs:4,poseSamples:samples,limbsAndGrip:true,source:'CMU 64_01',recordedFrames:281,continuousVelocity:true,contact:true,continuous:true,cameraStable:false,widths:[320,390,768],stageViews:0,playback:false,touch:false,legacyLink:false,offline:false,errors};
 const shots=process.env.SCREENSHOT_DIR;if(shots)fs.mkdirSync(shots,{recursive:true});
 try{
  const context=await browser.newContext({viewport:{width:390,height:844},hasTouch:true,isMobile:true,serviceWorkers:'block'});
  const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));
  for(const width of report.widths){
   await page.setViewportSize({width,height:950});
   for(const id of Object.keys(P.clubs)){
    await page.goto(base+`media/golf3d/viewer.html?exercise=${id}&v=${version}`);await page.locator('canvas[data-ready]').waitFor();
    assert.equal(await page.locator('canvas').getAttribute('data-playing'),'false');assert.equal(await page.locator('#play').innerText(),'재생');
    assert(!(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth)));
    const cameraByView={};
    for(let i=0;i<P.stages.length;i++){
     await page.locator(`[data-stage="${i}"]`).click();
     for(const view of ['reset','front','side','back']){
      await page.locator(`[data-view="${view}"]`).click();
      const snap=await page.evaluate(()=>window.exerciseViewer.snapshot());
      if(i===0)cameraByView[view]=snap.camera;else assert.deepEqual(snap.camera,cameraByView[view],id+' camera jumps between stages');report.cameraStable=true;
      assert.equal(snap.renderer,'golf-mocap-v2');assert.equal(snap.pose.stage,i);assert.equal(snap.playing,false);
      for(const v of snap.projected)assert(Math.abs(v[0])<.99&&Math.abs(v[1])<.99,id+' clipped '+i+' '+view);
      assert.equal(await page.locator('[data-stage][aria-pressed=true]').count(),1);report.stageViews++;
      if(shots&&width===390&&view==='reset')await page.locator('#viewport').screenshot({path:path.join(shots,`${id}-${i}.png`)});
     }
    }
   }
  }
  await page.setViewportSize({width:390,height:950});
  await page.goto(base+`media/3d/viewer.html?exercise=golf_driver&v=${version}`);await page.waitForURL('**/golf3d/viewer.html?**');await page.locator('canvas[data-ready]').waitFor();report.legacyLink=true;
  const beforePlayCamera=await page.evaluate(()=>window.exerciseViewer.snapshot().camera);
  await page.locator('#play').click();assert.deepEqual(await page.evaluate(()=>window.exerciseViewer.snapshot().camera),beforePlayCamera);assert.equal(await page.locator('canvas').getAttribute('data-playing'),'true');
  await page.waitForFunction(()=>document.querySelector('canvas').dataset.phase==='1',{},{timeout:20000});
  assert.equal(await page.locator('#play').innerText(),'다시 재생');assert.equal(await page.locator('canvas').getAttribute('data-playing'),'false');
  await page.locator('#play').click();await page.waitForTimeout(250);await page.locator('#play').click();
  const paused=await page.locator('canvas').getAttribute('data-phase');await page.waitForTimeout(150);assert.equal(await page.locator('canvas').getAttribute('data-phase'),paused);report.playback=true;
  await page.locator('#progress').fill(String(Math.round(P.stages[5].t*1000)));await page.locator('#progress').dispatchEvent('input');assert.equal(await page.locator('#phaseTitle').innerText(),'6 · 임팩트');
  await page.locator('canvas').focus();await page.keyboard.press('ArrowRight');assert(Number(await page.locator('canvas').getAttribute('data-yaw'))>.38);
  await page.locator('[data-view=reset]').click();await page.bringToFront();
  const cdp=await context.newCDPSession(page),box=await page.locator('canvas').boundingBox(),x=box.x+box.width/2,y=box.y+box.height/2;
  await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:x-30,y,id:1}]});
  await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:x+30,y:y+5,id:1}]});
  await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});assert(Math.abs(Number(await page.locator('canvas').getAttribute('data-yaw'))-.38)>.1);
  await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:x-30,y,id:1},{x:x+30,y,id:2}]});
  for(const d of [35,60])await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:x-d,y,id:1},{x:x+d,y,id:2}]});
  await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});assert(Number(await page.locator('canvas').getAttribute('data-distance'))<1);report.touch=true;
  const offline=await browser.newContext({viewport:{width:390,height:844},serviceWorkers:'allow'}),op=await offline.newPage();op.on('pageerror',e=>errors.push(e.message));
  await op.goto(base+'?v='+version+'#golf/notes');await op.evaluate(()=>navigator.serviceWorker.ready);await op.reload();await op.waitForFunction(()=>navigator.serviceWorker.controller);
  await offline.setOffline(true);
  // New golf viewer is precached, so even a club never opened online must work.
  await op.goto(base+`?v=${version}#exercise/golf_ironp`);await op.locator('.exercise-3d summary').click();
  const frame=op.frameLocator('iframe');await frame.locator('canvas[data-ready]').waitFor();await frame.locator('[data-stage="5"]').click();assert.equal(await frame.locator('#phaseTitle').innerText(),'6 · 임팩트');report.offline=true;
  assert.deepEqual(errors,[]);fs.writeFileSync(path.join(root,'docs/visuals/golf-3d-verification.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report));
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exit(1);});
