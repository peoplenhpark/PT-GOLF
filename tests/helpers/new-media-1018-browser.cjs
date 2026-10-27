const assert=require('node:assert/strict');
module.exports=async(browser,base,screenshotDir)=>{
 const ctx=await browser.newContext({viewport:{width:390,height:844}}),p=await ctx.newPage(),errors=[];p.on('pageerror',e=>errors.push(e.message));
 try{
  for(const id of ['4DyoF3OQKww','j1USTUwFnRI','4Eof_tmI0Ag']){
   await p.goto(base+'#golf/videos/'+id);await p.locator('.g-frame img').first().waitFor();
   await p.waitForFunction(()=>[...document.querySelector('.g-frame-pair').querySelectorAll('img')].every(i=>i.complete&&i.naturalWidth>0));assert.equal(await p.locator('.g-frame-pair').first().locator('img').count(),2);
  }
  await p.goto(base+'#golf/group/common');await p.locator('.g-mini-detail[href="#golf/videos/j1USTUwFnRI"]').waitFor();
  assert.equal(await p.evaluate(()=>GolfContent.videos.filter(v=>v.id==='3xsgQurjqtI').length),0);
  await p.goto(base+'#exercise/ht_squat_comparison');await p.locator('#training-movement').waitFor();
  await p.locator('.memo-edit').click();await p.locator('#memo-input').fill('HT 자세 비교 메모');await p.locator('#memo-save').click();
  const variants=await p.locator('#training-movement option').evaluateAll(es=>es.map(e=>e.value));assert.equal(variants.length,3);
  for(const [index,id] of variants.entries()){
   await p.locator('#training-movement').selectOption(id);
   await p.waitForFunction(()=>document.querySelectorAll('.guide-pair img').length===2&&[...document.querySelectorAll('.guide-pair img')].every(i=>i.complete&&i.naturalWidth>0));
   await p.locator('.exercise-3d summary').click();const frame=p.frameLocator('.exercise-3d-frame');await frame.locator('canvas[data-ready=true]').waitFor();
   assert.equal(await frame.locator('canvas').getAttribute('data-playing'),'true');await frame.locator('#play').click();
   await frame.locator('#progress').fill('500');assert.equal(await frame.locator('canvas').getAttribute('data-playing'),'false');
   const before=await frame.locator('canvas').getAttribute('data-yaw');await frame.locator('canvas').focus();await frame.locator('canvas').press('ArrowRight');assert.notEqual(await frame.locator('canvas').getAttribute('data-yaw'),before);
   await frame.locator('[data-view=side]').click();
   if(screenshotDir)await p.locator('.exercise-3d-frame').screenshot({path:screenshotDir+'/ht150-'+index+'.png'});
   for(const theme of ['light','dark'])for(const width of [320,390,768]){
    await p.setViewportSize({width,height:844});await p.evaluate(t=>document.documentElement.setAttribute('data-theme',t),theme);assert(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
   }
   await p.locator('.exercise-3d summary').click();
  }
  await p.reload();await p.locator('.memo-box').waitFor();assert.match(await p.locator('.memo-box').innerText(),/HT 자세 비교 메모/);
  await p.locator('.training-related [data-open=pt_gobletsquat]').click();await p.locator('.training-related [data-open=ht_squat_comparison]').waitFor();
  await p.goto(base+'#pt?cat=personal');await p.locator('.personal-exercises').waitFor();assert.equal(await p.locator('.personal-exercises .ex').count(),20);
  await p.goto(base+'#exercise/ht_squat_comparison');await p.locator('[data-offline]').waitFor();
  await p.waitForFunction(()=>navigator.serviceWorker.controller);await p.locator('[data-offline]').click();await p.locator('[data-offline-status]').filter({hasText:'오프라인 준비됨'}).waitFor({timeout:60000});
  await ctx.setOffline(true);await p.reload();await p.locator('#training-movement').waitFor();await p.locator('#training-movement').selectOption(variants[2]);await p.locator('.exercise-3d summary').click();await p.frameLocator('.exercise-3d-frame').locator('canvas[data-ready=true]').waitFor();
  await p.waitForFunction(()=>[...document.querySelectorAll('.guide-pair img')].every(i=>i.complete&&i.naturalWidth>0));assert.deepEqual(errors,[]);
  console.log('PASS: golf3 source pairs + duplicate exclusion; HT3 selections/images/3D/play/rotation, mobile themes, PT links, personal20, memo and offline.');
 }finally{await ctx.close();}
};
