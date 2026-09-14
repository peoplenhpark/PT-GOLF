const {chromium}=require('playwright');
const assert=require('node:assert/strict'),fs=require('node:fs');
(async()=>{
 const browser=await chromium.launch({channel:'chrome',headless:true});
 const context=await browser.newContext({viewport:{width:390,height:844},serviceWorkers:'allow'}),page=await context.newPage(),errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 const base='http://127.0.0.1:8792/';
 await page.goto(base+'?v=55#golf/videos/du58mmLNMnQ');
 await page.getByRole('link',{name:'60초 임팩트 3D 레슨 열기 →'}).waitFor();
 await page.evaluate(()=>navigator.serviceWorker.ready);await page.reload();await page.waitForFunction(()=>navigator.serviceWorker.controller);
 await page.getByRole('link',{name:'60초 임팩트 3D 레슨 열기 →'}).click();
 await page.waitForFunction(()=>window.golfLesson);
 for(const width of [320,390,768]){
  await page.setViewportSize({width,height:950});
  for(let i=0;i<7;i++){
   await page.locator('[data-chapter="'+i+'"]').click();
   const s=await page.evaluate(()=>window.golfLesson.snapshot());assert.equal(s.index,i);assert.equal(s.playing,false);
   assert.equal(await page.locator('[data-chapter][aria-pressed=true]').count(),1);
   assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
   for(const name of ['손목 확대','전신 동작']){await page.getByRole('button',{name,exact:true}).click();assert.equal(await page.locator('canvas:visible').count(),1);}
  }
 }
 await page.setViewportSize({width:390,height:844});
 await page.locator('[data-chapter="2"]').click();await page.locator('#wristViewport canvas').focus();const yaw=await page.evaluate(()=>window.golfLesson.snapshot().wristYaw);await page.keyboard.press('ArrowRight');assert((await page.evaluate(()=>window.golfLesson.snapshot().wristYaw))>yaw);
 await page.screenshot({path:'C:/Users/peopl/Documents/PT-GOLF-samples/lesson-v55-wrist.png',fullPage:true});
 await page.locator('[data-chapter="3"]').click();await page.screenshot({path:'C:/Users/peopl/Documents/PT-GOLF-samples/lesson-v55-body.png',fullPage:true});
 await page.locator('[data-chapter="0"]').click();await page.locator('#lessonPlay').click();await page.waitForTimeout(500);await page.locator('#lessonPlay').click();const paused=await page.evaluate(()=>window.golfLesson.snapshot().time);await page.waitForTimeout(150);assert.equal(await page.evaluate(()=>window.golfLesson.snapshot().time),paused);
 await page.locator('#lessonProgress').fill('59.6');await page.locator('#lessonProgress').dispatchEvent('input');await page.locator('#lessonPlay').click();await page.waitForFunction(()=>window.golfLesson.snapshot().time===60);assert.equal(await page.locator('#lessonPlay').innerText(),'처음부터 다시 보기');
 await page.locator('#lessonPlay').click();assert((await page.evaluate(()=>window.golfLesson.snapshot().time))<1);await page.locator('#lessonPlay').click();
 await context.setOffline(true);await page.reload();await page.waitForFunction(()=>window.golfLesson);await page.locator('[data-chapter="4"]').click();assert.equal(await page.locator('#wristViewport canvas').getAttribute('data-ready'),'true');await context.setOffline(false);
 // Verify a full real-time presentation reaches its final state without a loop.
 await page.locator('[data-chapter="0"]').click();await page.locator('#lessonPlay').click();await page.waitForFunction(()=>window.golfLesson.snapshot().time===60,null,{timeout:75000});assert.equal(await page.evaluate(()=>window.golfLesson.snapshot().playing),false);
 assert.deepEqual(errors,[]);const report={widths:[320,390,768],chapters:7,views:2,pause:true,scrub:true,replay:true,keyboard:true,offline:true,full60seconds:true,errors};fs.writeFileSync('docs/visuals/golf-lesson-verification.json',JSON.stringify(report,null,2));console.log(report);await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});
