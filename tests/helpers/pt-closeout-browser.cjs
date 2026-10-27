const assert=require('node:assert/strict');
module.exports=async(browser,base)=>{
 const c=await browser.newContext({viewport:{width:390,height:844},timezoneId:'Asia/Seoul'}),p=await c.newPage(),errors=[];p.on('pageerror',e=>errors.push(e.message));
 try{
  await p.goto(base+'#ht');await p.locator('#ht-routine').waitFor();await p.locator('[data-ht-day=thu]').click();
  assert.deepEqual(await p.locator('#ht-routine-day li>div>a').evaluateAll(es=>es.map(e=>e.hash)),['#exercise/pt_dbpullover','#exercise/pt_pullup','#exercise/pt_shoulderpress','#exercise/pt_seatedrow','#exercise/pt_facepull','#exercise/pt_low_cable_curl']);
  await p.locator('#ht-routine-day a[href="#exercise/pt_shoulderpress"]').click();await p.locator('.d-title').waitFor();
  await p.waitForFunction(()=>document.querySelectorAll('.guide-pair img').length===2&&[...document.querySelectorAll('.guide-pair img')].every(i=>i.complete&&i.naturalWidth>0));
  assert.match(await p.locator('.pt-session-note').innerText(),/양 손바닥/);
  await p.locator('.exercise-3d summary').click();const f=p.frameLocator('.exercise-3d-frame');await f.locator('canvas[data-ready=true]').waitFor();assert.equal(await f.locator('canvas').getAttribute('data-kind'),'ptshoulderpress');
  assert.equal(await f.locator('canvas').getAttribute('data-playing'),'true');await f.locator('#play').click();await f.locator('#progress').fill('500');
  const before=await f.locator('canvas').getAttribute('data-yaw');await f.locator('canvas').focus();await f.locator('canvas').press('ArrowRight');assert.notEqual(await f.locator('canvas').getAttribute('data-yaw'),before);
  await f.locator('#play').click();assert.equal(await f.locator('canvas').getAttribute('data-playing'),'true');await f.locator('#play').click();
  await p.locator('.memo-edit').click();await p.locator('#memo-input').fill('양손 압박감 확인 · 보존');await p.locator('#memo-save').click();await p.reload();await p.locator('.memo-box').waitFor();assert.match(await p.locator('.memo-box').innerText(),/양손 압박감 확인 · 보존/);
  for(const route of ['#pt/now','#ht','#exercise/pt_shoulderpress']){
   await p.goto(base+route);await p.locator('#app').waitFor();
   for(const theme of ['light','dark'])for(const width of [320,390,768]){await p.setViewportSize({width,height:844});await p.evaluate(t=>document.documentElement.setAttribute('data-theme',t),theme);assert(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'no overflow '+route);}
  }
  await p.waitForFunction(()=>navigator.serviceWorker.controller);await p.locator('[data-offline]').click();await p.locator('[data-offline-status]').filter({hasText:'오프라인 준비됨'}).waitFor({timeout:60000});
  await c.setOffline(true);await p.reload();await p.locator('.d-title').waitFor();await p.waitForFunction(()=>[...document.querySelectorAll('.guide-pair img')].every(i=>i.complete&&i.naturalWidth>0));
  await p.locator('.exercise-3d summary').click();await p.frameLocator('.exercise-3d-frame').locator('canvas[data-ready=true]').waitFor();assert.deepEqual(errors,[]);
  console.log('PASS: October27 PT routine links, dedicated machine 2 frames/3D/play/rotation/slider, mobile themes, memo and offline.');
 }finally{await c.close();}
};
