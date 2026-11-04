const assert=require('node:assert/strict');
module.exports=async(browser,base,screenshot)=>{
 const context=await browser.newContext({viewport:{width:390,height:844}}),p=await context.newPage(),errors=[];p.on('pageerror',e=>errors.push(e.message));
 try{
  await p.goto(base+'#golf/videos/kuKUECtB-fg');await p.locator('[data-g=archive-video]').waitFor();
  assert.equal(await p.locator('[data-g=archive-video]').getAttribute('aria-pressed'),'false');
  const total=await p.evaluate(()=>GolfContent.videos.length);
  await p.locator('#g-video-memo').fill('보존할 메모');await p.locator('[data-g-form=video] button').click();await p.locator('[data-g=favorite-video]').click();
  const original=await p.evaluate(()=>JSON.parse(localStorage.getItem('ptgolf_learning_v1')));
  await p.locator('#g-video-memo').fill('보관 직전 작성하던 초안');await p.waitForTimeout(250);await p.locator('[data-g=archive-video]').click();
  assert.equal(await p.locator('#g-video-memo').inputValue(),'보관 직전 작성하던 초안');await p.locator('[data-g-form=video] button').click();
  let stored=await p.evaluate(()=>JSON.parse(localStorage.getItem('ptgolf_learning_v1')));
  assert.equal(stored.videoNotes['TYq-Fge2LSA'].archived,true);assert.equal(stored.videoNotes['TYq-Fge2LSA'].memo,'보관 직전 작성하던 초안');assert.equal(stored.videoNotes['TYq-Fge2LSA'].favorite,true);assert(!stored.videoNotes['kuKUECtB-fg']);
  for(const key of ['lessons','questions','focus'])assert.deepEqual(stored[key],original[key]);
  await p.goto(base+'#golf/key-messages');await p.locator('.g-key-row').first().waitFor();assert.equal(await p.locator('.g-key-row').count(),total-1);assert.equal(await p.locator('[data-video-id="TYq-Fge2LSA"]').count(),0);
  await p.locator('[data-g=archive-filter]').click();assert(p.url().includes('golfArchive=include'));assert.equal(await p.locator('.g-key-row').count(),total);assert.equal(await p.locator('[data-video-id="TYq-Fge2LSA"] .g-archive-badge').innerText(),'보관');
  await p.locator('[data-g-club=both]').click();assert(p.url().includes('golfArchive=include'));await p.reload();await p.locator('[data-video-id="TYq-Fge2LSA"]').waitFor();
  await p.locator('[data-video-id="TYq-Fge2LSA"] .g-key-row-head a').click();await p.locator('#g-video-memo').waitFor();assert(p.url().includes('golfArchive=include'));await p.locator('[data-g=archive-video]').click();assert.equal(await p.locator('[data-g=archive-video]').getAttribute('aria-pressed'),'false');
  await p.goto(base+'#golf/video-favorites');await p.locator('.g-video-mini').waitFor();assert.equal(await p.locator('.g-video-mini').count(),1);
  // A second tab can save a draft without undoing a concurrently changed archive flag.
  const second=await context.newPage();await second.goto(base+'#golf/videos/TYq-Fge2LSA');await second.locator('#g-video-memo').fill('다른 탭의 메모');await second.waitForTimeout(250);
  await p.goto(base+'#golf/videos/TYq-Fge2LSA');await p.locator('[data-g=archive-video]').click();await second.waitForTimeout(100);await second.locator('[data-g-form=video] button').click();
  stored=await second.evaluate(()=>JSON.parse(localStorage.getItem('ptgolf_learning_v1')));assert.equal(stored.videoNotes['TYq-Fge2LSA'].archived,true);assert.equal(stored.videoNotes['TYq-Fge2LSA'].memo,'다른 탭의 메모');await second.close();
  for(const id of ['hxXJnJRKKcE','2tam4sbJQtM','aaOw2sdp-io','z9lAaO2IefM']){await p.goto(base+'#golf/videos/'+id);await p.locator('[data-g=archive-video]').click();}
  await p.goto(base+'#golf/now');await p.locator('.g-stage-links').waitFor();assert.equal(await p.locator('.g-daily-pin').count(),0);assert.equal(await p.locator('.g-stage-card').count(),4);assert.equal(await p.locator('#g-stage-backswing ol li').count(),3);assert.equal(await p.locator('#g-stage-backswing ul li').count(),3);assert.match(await p.locator('#g-stage-backswing .g-solo-practice, #g-stage-backswing').first().innerText(),/보관한 출처/);
  await p.goto(base+'#golf/lessons/lesson_20261005_first');await p.locator('.g-lesson-videos').waitFor();assert(await p.locator('.g-lesson-videos a[href="#golf/videos/aaOw2sdp-io"]').count());assert(await p.locator('.g-lesson-videos .g-archive-badge').count());
  await p.goto(base+'#golf/field');await p.locator('#g-field-title').waitFor();assert.equal(await p.locator('.g-mini-detail[href*="z9lAaO2IefM"]').count(),0);await p.locator('[data-g=archive-filter]').click();assert.equal(await p.locator('.g-mini-detail[href*="z9lAaO2IefM"]').count(),1);
  for(const theme of ['light','dark'])for(const width of [320,390,768])for(const route of ['#golf/key-messages?golfArchive=include','#golf/videos/TYq-Fge2LSA']){
   await p.setViewportSize({width,height:844});await p.goto(base+route);await p.locator('.g-hub').waitFor();await p.evaluate(t=>document.documentElement.setAttribute('data-theme',t),theme);assert(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),theme+' '+width+' '+route);
  }
  const backup=await p.evaluate(()=>Persistence.exportBackup());assert.equal(backup.stores.ptgolf_learning_v1.videoNotes['TYq-Fge2LSA'].archived,true);await p.evaluate(b=>Persistence.restoreBackup(b),backup);await p.reload();await p.locator('[data-g=archive-video]').waitFor();assert.equal(await p.locator('[data-g=archive-video]').getAttribute('aria-pressed'),'true');assert.equal(await p.locator('#g-video-memo').inputValue(),'다른 탭의 메모');
  await p.waitForFunction(()=>!!navigator.serviceWorker.controller);await context.setOffline(true);await p.reload();await p.locator('[data-g=archive-video]').waitFor();await p.locator('[data-g=archive-video]').click();assert.equal(await p.locator('[data-g=archive-video]').getAttribute('aria-pressed'),'false');await context.setOffline(false);
  if(screenshot){await p.setViewportSize({width:390,height:844});await p.screenshot({path:screenshot});}
  assert.deepEqual(errors,[]);console.log('PASS: archive/restore, source aliases, drafts/favorites/other records, concurrent tab merge, filters/history, pin hiding + visible 3/3, lesson links, mobile themes, backup and offline.');
 }finally{await context.close();}
};
