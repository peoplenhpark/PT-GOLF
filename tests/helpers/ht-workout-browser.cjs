const assert=require('node:assert/strict');
module.exports=async(browser,base,screenshot)=>{
 const context=await browser.newContext({viewport:{width:390,height:844},timezoneId:'Asia/Seoul',serviceWorkers:'block'}),page=await context.newPage(),errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 const form=()=>page.locator('[data-ht-log="pt_chestpress"]');
 const field=name=>form().locator(`[name="${name}"]`);
 const select=async day=>page.locator(`.ht-routine-days [data-ht-day="${day}"]`).click();
 try{
  await page.clock.setFixedTime(new Date('2026-10-22T12:00:00+09:00'));
  await page.goto(base+'#ht');await form().waitFor();
  await field('weight').fill('30');await field('reps1').fill('12');await field('reps2').fill('10');
  await form().getByRole('button',{name:'저장',exact:true}).click();
  assert.match(await form().locator('[data-draft-status]').innerText(),/오늘 기록 저장됨/);
  await page.clock.setFixedTime(new Date('2026-10-26T12:00:00+09:00'));
  await page.reload();await form().waitFor();
  assert.match(await form().locator('.ht-log-last').innerText(),/10\/22.*30kg.*12 \/ 10회/);
  assert.equal(await field('weight').inputValue(),'30');assert.equal(await field('reps1').inputValue(),'');
  await field('weight').fill('32.5');await field('reps1').fill('12');await field('reps2').fill('11');
  await select('tue');await select('thu');
  assert.equal(await field('weight').inputValue(),'32.5');assert.equal(await field('reps2').inputValue(),'11');
  await page.reload();await form().waitFor();assert.equal(await field('reps2').inputValue(),'11','draft survives reload');
  // Simulated storage failure must leave inputs intact and must not claim success.
  await page.evaluate(()=>{window.testOriginalSet=Storage.prototype.setItem;Storage.prototype.setItem=function(k,v){if(k===Persistence.KEYS.workouts)throw Error('full');return window.testOriginalSet.call(this,k,v);};});
  await form().getByRole('button',{name:'저장',exact:true}).click();
  assert.match(await form().locator('[data-draft-status]').innerText(),/저장하지 못/);assert.equal(await field('reps2').inputValue(),'11');
  await page.evaluate(()=>{Storage.prototype.setItem=window.testOriginalSet;});
  await form().getByRole('button',{name:'저장',exact:true}).click();
  assert.match(await form().locator('[data-draft-status]').innerText(),/오늘 기록 저장됨/);
  await field('reps2').fill('10');await form().getByRole('button',{name:'저장',exact:true}).click();
  assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem(Persistence.KEYS.workouts)).entries.length),2);
  await page.reload();await form().waitFor();assert.equal(await field('reps2').inputValue(),'10');
  assert.match(await form().locator('.ht-log-last').innerText(),/10\/22/);
  await select('thu');assert.equal(await field('weight').inputValue(),'32.5');
  assert.equal(await page.locator('[data-ht-log="pt_pullup"] label').first().innerText(),'보조 kg');
  for(const theme of ['light','dark'])for(const width of [320,390,768]){
   await page.setViewportSize({width,height:844});await page.evaluate(t=>document.documentElement.setAttribute('data-theme',t),theme);
   assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
   assert(await form().locator('input,button').evaluateAll(es=>es.every(e=>e.getBoundingClientRect().height>=44&&e.getBoundingClientRect().width>=40)));
  }
  if(screenshot){await page.setViewportSize({width:390,height:844});await form().scrollIntoViewIfNeeded();await page.screenshot({path:screenshot});}
  for(const day of ['tue','fri']){
  await select(day);
  assert.deepEqual(await page.locator('#ht-routine-day li>div>a').evaluateAll(es=>es.map(e=>e.hash)),['#exercise/pt_legcurl','#exercise/pt_legextension','#exercise/pt_adduction','#exercise/pt_legpress']);
  assert.equal(await page.locator('#ht-routine-day li>strong').filter({hasText:'20kg · 20회 × 2세트'}).count(),3);
  for(const id of ['pt_legcurl','pt_legextension','pt_legpress']){
   assert.equal(await page.locator(`[data-ht-log="${id}"] [name=weight]`).inputValue(),'20');
   assert.equal(await page.locator(`[data-ht-log="${id}"] [name=reps1]`).inputValue(),'');
  }
  assert(!(await page.locator('#ht-routine-day').innerText()).includes('원레그'));
  }
  await select('wed');assert.equal(await page.locator('[data-ht-log]').count(),0);
  const backup=await page.evaluate(()=>Persistence.exportBackup());assert.equal(backup.stores.ptgolf_workouts_v1.entries.length,2);
  await page.evaluate(b=>{localStorage.removeItem(Persistence.KEYS.workouts);Persistence.restoreBackup(b);},backup);
  await select('mon');assert.equal(await field('reps2').inputValue(),'10');
  assert.deepEqual(errors,[]);
  console.log('PASS: HT previous record, actual reps blank, per-exercise drafts across days/reload, save failure/retry, same-day edit, shared weekday history, assist label, mobile sizes, rest days and backup.');
 }finally{await context.close();}
};
