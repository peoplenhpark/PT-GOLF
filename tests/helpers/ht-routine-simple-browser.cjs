const assert=require('node:assert/strict');
module.exports=async(browser,base)=>{
 const c=await browser.newContext({viewport:{width:390,height:844},timezoneId:'Asia/Seoul',serviceWorkers:'block'}),p=await c.newPage(),errors=[];
 p.on('pageerror',e=>errors.push(e.message));
 try{
  await p.clock.setFixedTime(new Date('2026-10-26T12:00:00+09:00'));
  await p.goto(base+'#ht');await p.locator('#ht-routine').waitFor();
  const saved=await p.evaluate(()=>{
   HTWorkout.save({exerciseId:'pt_chestpress',date:'2026-10-26',weight:30,reps:[12,10]},null);
   Store.setMemo('pt_chestpress','보존할 운동 메모');
   const draft=Persistence.open(Persistence.KEYS.drafts);
   draft.update(s=>{s['ht-log-2026-10-26-pt_chestpress||weight']={value:'32.5',updated:new Date().toISOString()};});
   return {record:localStorage.getItem(Persistence.KEYS.workouts),draft:localStorage.getItem(Persistence.KEYS.drafts),overlay:localStorage.getItem(Persistence.KEYS.overlay)};
  });
  await p.reload();await p.locator('#ht-routine').waitFor();
  for(const [day,count] of [['mon',5],['tue',4],['wed',0],['thu',5],['fri',4],['sat',0],['sun',0]]){
   await p.locator(`.ht-routine-days [data-ht-day="${day}"]`).click();
   assert.equal(await p.locator('#ht-routine-day .ht-routine-list>li').count(),count);
   assert.equal(await p.locator('#ht-routine input,#ht-routine form,#ht-routine [data-ht-progress],#ht-routine [data-ht-completion]').count(),0);
   assert(!(await p.locator('#ht-routine').innerText()).includes('지난 기록'));
   if(['tue','fri'].includes(day)){
    assert.deepEqual(await p.locator('#ht-routine-day li>div>a').evaluateAll(es=>es.map(e=>e.hash)),['#exercise/pt_legcurl','#exercise/pt_legextension','#exercise/pt_adduction','#exercise/pt_legpress']);
    assert.equal(await p.locator('#ht-routine-day li>strong').filter({hasText:'20kg · 20회 × 2세트'}).count(),3);
    assert.match(await p.locator('#ht-routine-day').innerText(),/양발 기본/);
   }
  }
  await p.locator('.ht-routine-days [data-ht-day=tue]').click();
  for(const theme of ['light','dark'])for(const width of [320,390,768]){
   await p.setViewportSize({width,height:844});await p.evaluate(t=>document.documentElement.setAttribute('data-theme',t),theme);
   assert(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
  }
  assert.deepEqual(await p.evaluate(()=>({record:localStorage.getItem(Persistence.KEYS.workouts),draft:localStorage.getItem(Persistence.KEYS.drafts),overlay:localStorage.getItem(Persistence.KEYS.overlay)})),saved);
  assert.match(await p.locator('.ht-routine-basic h3').innerText(),/0–20분/);
  const backup=await p.evaluate(()=>Persistence.exportBackup());assert.equal(backup.stores.ptgolf_workouts_v1.entries.length,1);
  await p.evaluate(b=>Persistence.restoreBackup(b),backup);
  assert.equal(await p.evaluate(()=>localStorage.getItem(Persistence.KEYS.workouts)),saved.record);
  await p.locator('#ht-routine-day a[href="#exercise/pt_legpress"]').click();await p.locator('.d-title').waitFor();
  await p.goBack();await p.locator('#ht-routine').waitFor();assert.equal(await p.locator('[data-ht-log],[data-ht-completion]').count(),0);
  assert.deepEqual(errors,[]);
  console.log('PASS: compact HT routine without daily input/history/completion; 5/4 split, Tuesday/Friday targets, basic 20 minutes, exercise links, mobile themes, existing workout records/drafts/memos and backup preserved.');
 }finally{await c.close();}
};
