const assert=require('node:assert/strict');
module.exports=async(browser,base,screenshot)=>{
 const context=await browser.newContext({viewport:{width:390,height:844}}),p=await context.newPage(),errors=[];
 p.on('pageerror',e=>errors.push(e.message));
 try{
  await p.goto(base+'#golf/group/all');await p.locator('.g-club-filters').waitFor();
  assert.equal(await p.locator('.g-video-groups>a').count(),4);
  assert.equal(await p.locator('.g-club-filters a').count(),5);
  const counts=await p.evaluate(()=>GolfContent.videos.reduce((o,v)=>{const k=GolfContent.clubFor(v).value;o[k]=(o[k]||0)+1;return o;},{}));
  for(const club of ['iron','driver','both','unknown']){
   await p.locator('[data-g-club="'+club+'"]').click();assert(p.url().endsWith('golfClub='+club));
   await p.locator('.g-club-filters [aria-current=page]').waitFor();
   assert.equal(await p.locator('.g-video-mini').count(),counts[club]);
   assert(await p.locator('.g-video-mini .g-club-badge').evaluateAll((es,k)=>es.every(e=>e.dataset.club===k),club));
   await p.reload();await p.locator('.g-club-filters').waitFor();assert.equal(await p.locator('[data-g-club="'+club+'"]').getAttribute('aria-current'),'page');
  }
  await p.locator('[data-g-club=driver]').click();
  await p.locator('.g-mini-detail[href*="JoUx0gIzdng"]').click();await p.locator('#g-video-memo').waitFor();
  assert(p.url().includes('golfClub=driver'));assert.equal(await p.locator('.g-placement .g-club-badge').first().innerText(),'드라이버');
  await p.locator('#g-video-memo').fill('클럽 필터 후에도 보존');await p.locator('[data-g-form=video] button').click();await p.locator('[data-g=favorite-video]').click();
  await p.goBack();await p.locator('.g-club-filters').waitFor();assert.equal(await p.locator('[data-g-club=driver]').getAttribute('aria-current'),'page');
  await p.locator('.g-video-groups a[href*="group/downswing"]').click();assert(p.url().includes('golfClub=driver'));
  await p.locator('.g-subsections a[href*="downswing-path"]').click();assert(p.url().includes('golfClub=driver'));assert(await p.locator('.g-practice-columns').isVisible());
  await p.locator('[data-g-club=both]').click();assert.equal(await p.locator('.g-mini-detail').count(),0);assert.match(await p.locator('.g-hub').innerText(),/조건에 맞는 영상이 없습니다/);
  await p.locator('[data-g-club=""]').click();assert(!p.url().includes('golfClub='));assert((await p.locator('.g-mini-detail').count())>0);
  await p.goto(base+'#golf/video-favorites?golfClub=iron');await p.locator('.g-club-filters').waitFor();assert.equal(await p.locator('.g-mini-detail').count(),0);
  await p.locator('[data-g-club=driver]').click();assert.equal(await p.locator('.g-mini-detail').count(),1);
  await p.locator('.g-mini-detail').click();await p.locator('#g-video-memo').waitFor();assert.equal(await p.locator('#g-video-memo').inputValue(),'클럽 필터 후에도 보존');
  await p.goto(base+'#golf/group/common');await p.locator('.g-club-filters').waitFor();assert.match(await p.locator('#g-group-common').innerText(),/여러 구간 연결/);
  assert.equal(await p.locator('.g-mini-detail').count(),13);await p.locator('[data-g-club=both]').click();assert.equal(await p.locator('.g-mini-detail').count(),2);
  for(const theme of ['light','dark'])for(const width of [320,390,768]){
   await p.setViewportSize({width,height:844});await p.evaluate(t=>document.documentElement.setAttribute('data-theme',t),theme);assert(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
  }
  await p.goto(base+'#golf/videos?golfClub=unknown');await p.locator('.g-club-filters').waitFor();assert.equal(await p.locator('.g-mini-detail').count(),counts.unknown);
  assert.equal(await p.locator('.g-solo-card .g-mini-detail[href*="2tam4sbJQtM"]').count(),0);
  await p.goto(base+'#golf/videos?golfClub=iron');await p.locator('.g-club-filters').waitFor();assert.equal(await p.locator('.g-mini-detail').count(),counts.iron);
  assert.equal(await p.locator('.g-solo-card .g-mini-detail').first().getAttribute('href'),'#golf/videos/2tam4sbJQtM?golfClub=iron');
  await p.goto(base+'#golf/group/backswing');await p.locator('.g-club-filters').waitFor();assert.equal(await p.locator('.g-solo-card .g-mini-detail').first().getAttribute('href'),'#golf/videos/2tam4sbJQtM');
  if(screenshot){await p.setViewportSize({width:390,height:844});await p.evaluate(()=>document.documentElement.setAttribute('data-theme','light'));await p.screenshot({path:screenshot});}
  await p.goto(base+'#golf/group/recent?golfClub=iron');await p.locator('.g-club-filters').waitFor();assert(await p.locator('.g-video-mini .g-club-badge').evaluateAll(es=>es.every(e=>e.dataset.club==='iron')));
  await p.waitForFunction(()=>!!navigator.serviceWorker.controller);await context.setOffline(true);await p.reload();await p.locator('.g-club-filters').waitFor();assert.equal(await p.locator('[data-g-club=iron]').getAttribute('aria-current'),'page');await context.setOffline(false);
  assert.deepEqual(errors,[]);console.log('PASS: club counts/filter scope, history/reload/offline, section/subsection links, empty/reset, favorites/memo, multi-stage distinction, pinned guide and mobile themes.');
 }finally{await context.close();}
};
