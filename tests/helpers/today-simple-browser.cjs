const assert=require('node:assert/strict');
module.exports=async(browser,base)=>{
 const c=await browser.newContext({viewport:{width:390,height:844},timezoneId:'Asia/Seoul',serviceWorkers:'block'}),p=await c.newPage(),errors=[];p.on('pageerror',e=>errors.push(e.message));
 try{
  await p.clock.setFixedTime(new Date('2026-11-20T12:00:00+09:00'));await p.goto(base+'#home');await p.locator('#ht-routine').waitFor();
  assert.equal(await p.locator('.home-destination').count(),2);assert.equal(await p.locator('#ht-routine').count(),1);assert.equal(await p.locator('.tabbar>.tab').count(),2);
  const before=await p.evaluate(()=>{Store.setMemo('pt_lunge','오늘 화면 검증 메모');return localStorage.getItem(Persistence.KEYS.overlay);});
  const home=await p.locator('#ht-routine-day').innerText();await p.goto(base+'#ht');assert.equal(await p.locator('#ht-routine-day').innerText(),home,'home and HT use the same routine');
  assert.equal(await p.locator('.ht-materials').getAttribute('open'),null);assert.equal(await p.locator('.ht-routine-summary').getAttribute('open'),null);
  await p.locator('.ht-routine-days [data-ht-day=sat]').click();assert.match(await p.locator('#ht-routine').innerText(),/휴식/);assert.equal(await p.locator('.ht-routine-basic').getAttribute('open'),null);assert.equal(await p.locator('#ht-routine-day .ht-routine-list').count(),0);
  await p.goto(base+'#home');await p.locator('.part.ht').click();await p.locator('#ht-routine-day a[href="#exercise/pt_lunge"]').click();await p.locator('.memo-box').waitFor();assert.match(await p.locator('.memo-box').innerText(),/오늘 화면 검증 메모/);
  for(const width of [320,390,430])for(const theme of ['dark','light']){
   await p.setViewportSize({width,height:844});await p.goto(base+'#home');await p.evaluate(t=>Theme.set(t),theme);assert(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
   await p.locator('.exercise-quicknav>summary').click();const panel=await p.locator('.exercise-quickpanel').boundingBox(),bar=await p.locator('.tabbar').boundingBox();assert(panel.y>=0&&panel.y+panel.height<=bar.y);await p.keyboard.press('Escape');assert.equal(await p.locator('.exercise-quicknav').getAttribute('open'),null);
  }
  await p.locator('.exercise-quicknav>summary').click();await p.locator('.exercise-quickpanel a[href="#ht?cat=all&start=library"]').click();await p.locator('#ht-library-title').waitFor();assert.equal(await p.locator('.ht-materials[open]').count(),1);assert.equal(await p.locator('.pt-exercise-grid .ex').count(),62);await p.reload();assert.equal(await p.locator('.ht-materials[open]').count(),1);
  await p.goto(base+'#golf/videos');await p.locator('.g-recent-section').waitFor();assert.equal(await p.locator('.g-recent-section').getAttribute('open'),null);await p.locator('.g-recent-section>summary').click();assert.equal(await p.locator('.g-recent-section[open]').count(),1);
  assert.equal(await p.evaluate(()=>localStorage.getItem(Persistence.KEYS.overlay)),before);assert.deepEqual(await p.evaluate(()=>{const q=TrainingQuestions.collect();return [q.rows.length,q.deferred.length];}),[0,8]);assert.deepEqual(errors,[]);
  console.log('PASS: today/HT shared routine, rest days, folded duplicate guidance/library/recent videos, direct/reloaded library links, 320/390/430px themes, menu keyboard dismissal, preserved memo and 0 active / 8 deferred.');
 }finally{await c.close();}
};
