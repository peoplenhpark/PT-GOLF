const assert=require('node:assert/strict');
module.exports=async(browser,base)=>{
 const c=await browser.newContext({viewport:{width:390,height:844}}),p=await c.newPage(),errors=[];p.on('pageerror',e=>errors.push(e.message));
 try{
  await p.goto(base+'#golf/now');await p.locator('.g-final-lesson-practice').waitFor();
  const original=await p.evaluate(()=>({lesson:document.querySelector('.coach-recent-golf').textContent,practice:document.querySelector('.g-final-lesson-practice').textContent}));
  const saved=await p.evaluate(()=>{
   Persistence.open(Persistence.KEYS.golf,{defaults:()=>({lessons:[],questions:[],focus:[],videoNotes:{}})}).update(s=>{s.lessons||=[];s.questions||=[];s.focus||=[];s.videoNotes||={};s.practice={sourceKind:'sensation',selected:'1001',club:'7번 아이언'};s.questions.push({id:'old-question',kind:'lessons',sourceId:'lesson_20261005_first',text:'보존할 원본 질문',created:'2026-10-05T01:00:00Z'});s.practiceRecords=[{id:'old-five',date:'2026-10-05',created:'2026-10-05T01:00:00Z',club:'7번 아이언',method:'cue',cueId:'1001',cueDate:'10/1',cueText:'밟고, 버티고, 톡',contact:3,direction:4,distance:'대체로 적정',feel:'비슷함',measure:'타감으로 판단'}];s.videoNotes['2tam4sbJQtM']={memo:'보존할 영상 메모',favorite:true};});
   Persistence.open(Persistence.KEYS.drafts).update(s=>{s['gq-result-start||memo']={value:'기존 입력 초안',updated:new Date().toISOString()};});
   return Object.fromEntries([Persistence.KEYS.coaching,Persistence.KEYS.golf,Persistence.KEYS.drafts].map(k=>[k,localStorage.getItem(k)]));
  });
  await p.reload();await p.locator('.g-final-lesson-practice').waitFor();
  const expectedGolf=JSON.parse(saved.ptgolf_learning_v1);delete expectedGolf.practiceRecords;assert.deepEqual(await p.evaluate(()=>JSON.parse(localStorage.getItem(Persistence.KEYS.golf))),expectedGolf);saved.ptgolf_learning_v1=JSON.stringify(expectedGolf);
  assert.deepEqual(await p.evaluate(()=>({lesson:document.querySelector('.coach-recent-golf').textContent,practice:document.querySelector('.g-final-lesson-practice').textContent})),original);
  assert.equal(await p.locator('.gq-goal,.gq-reference').count(),0);
  assert.equal(await p.locator('[data-gq-focus],[data-gq-clear],[data-gq-form=result],[data-coach-form=result],.coach-current,.g-recent-practice,.gq-records').count(),0);
  assert.equal(await p.locator('.g-final-practice-steps li').count(),5);
  assert.equal(await p.locator('.g-daily-pin,.g-stage-practice').count(),0);
  for(const stage of ['backswing','downswing','impact','follow-through']){await p.locator('[data-golf-stage="'+stage+'"]').click();assert(await p.locator('#g-stage-'+stage).evaluate(e=>e===document.activeElement));}
  for(const route of ['standards','today','now?topic=start','videos/2tam4sbJQtM']){await p.goto(base+'#golf/'+route);await p.locator('.coach-desk,.g-hub').first().waitFor();assert.equal(await p.locator('[data-coach-form=criterion],[data-g-form=practice],[data-gq-form=result]').count(),0);}
  await p.goto(base+'#golf/standards');await p.locator('.g-final-lesson-practice').waitFor();assert.equal(await p.locator('.golf-archive').count(),0);
  await p.goto(base+'#golf/today');await p.locator('.g-final-lesson-practice').waitFor();assert.match(p.url(),/#golf\/now/);
  assert.deepEqual(await p.evaluate(keys=>Object.fromEntries(keys.map(k=>[k,localStorage.getItem(k)])),Object.keys(saved)),saved,'viewing new UI must not rewrite saved criteria, results, focus, drafts or video notes');
  const backup=await p.evaluate(()=>Persistence.exportBackup());assert.equal(backup.stores.ptgolf_learning_v1.practiceRecords,undefined);await p.evaluate(b=>Persistence.restoreBackup(b),backup);
  assert.deepEqual(await p.evaluate(keys=>Object.fromEntries(keys.map(k=>[k,localStorage.getItem(k)])),Object.keys(saved)),saved);
  const oldBackup=JSON.parse(JSON.stringify(backup));oldBackup.stores.ptgolf_learning_v1.practiceRecords=[{id:'restored-five',date:'2026-10-05',created:'2026-10-05T01:00:00Z',club:'7번 아이언',method:'cue',cueId:'1001',cueDate:'10/1',cueText:'이전 감각',contact:3,direction:4,distance:'대체로 적정',feel:'비슷함',measure:'타감으로 판단'}];
  await p.evaluate(b=>Persistence.restoreBackup(b),oldBackup);await p.reload();await p.locator('.coach-tabs').waitFor();assert.equal(await p.evaluate(()=>JSON.parse(localStorage.getItem(Persistence.KEYS.golf)).practiceRecords),undefined);
  assert.deepEqual(await p.evaluate(keys=>Object.fromEntries(keys.map(k=>[k,localStorage.getItem(k)])),Object.keys(saved)),saved,'old backup restoration removes only retired five-shot records');
  // Optional one-field question needs no club, result, or daily focus selection.
  await p.goto(base+'#golf/now');await p.locator('.g-question-shortcut>a').click();const form=p.locator('[data-g-form=question]');await form.waitFor();assert.equal(await form.locator('textarea,input,select').count(),1);await form.locator('textarea').fill('작은 피니시에서 힘 빼는 방법은?');await p.reload();await form.waitFor();assert.equal(await form.locator('textarea').inputValue(),'작은 피니시에서 힘 빼는 방법은?');
  await p.evaluate(()=>{window.__set=Storage.prototype.setItem;Storage.prototype.setItem=function(k,v){if(k==='ptgolf_learning_v1')throw Error('full');return window.__set.call(this,k,v);};});await form.locator('button').click();assert.equal(await form.locator('textarea').inputValue(),'작은 피니시에서 힘 빼는 방법은?');assert.equal(await p.evaluate(()=>JSON.parse(localStorage.getItem('ptgolf_learning_v1')).questions.length),1);await p.evaluate(()=>{Storage.prototype.setItem=window.__set;});
  await form.locator('button').click();await p.locator('.g-lesson-anchor').waitFor();assert.equal(await p.evaluate(()=>JSON.parse(localStorage.getItem('ptgolf_learning_v1')).questions.length),2);
  await p.goto(base+'#golf/now');await p.locator('.g-question-shortcut summary').click();assert.match(await p.locator('.g-question-shortcut').innerText(),/작은 피니시/);
  assert.equal(await p.evaluate(()=>localStorage.getItem(Persistence.KEYS.coaching)),saved.ptgolf_coaching_v1);
  // Past answers remain editable and searchable even though daily entry is gone.
  for(const route of ['now','standards','today'])for(const theme of ['light','dark'])for(const width of [320,390,768]){await p.goto(base+'#golf/'+route);await p.locator('.coach-tabs').waitFor();await p.setViewportSize({width,height:844});await p.evaluate(t=>document.documentElement.setAttribute('data-theme',t),theme);assert(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));}
  await p.goto(base+'#golf/now');await p.waitForFunction(()=>!!navigator.serviceWorker.controller);await c.setOffline(true);await p.reload();await p.locator('.g-final-lesson-practice').waitFor();assert.equal(await p.locator('[data-gq-focus]').count(),0);await c.setOffline(false);
  const failed=await browser.newContext({serviceWorkers:'block'}),fp=await failed.newPage();
  try{
   const oldRaw=JSON.stringify(oldBackup.stores.ptgolf_learning_v1);
   await fp.addInitScript(raw=>{if(!localStorage.getItem('ptgolf_learning_v1'))localStorage.setItem('ptgolf_learning_v1',raw);window.__realSet=Storage.prototype.setItem;if(!sessionStorage.getItem('retry-cleanup'))Storage.prototype.setItem=function(k,v){if(k==='ptgolf_learning_v1')throw Error('quota');return window.__realSet.call(this,k,v);};},oldRaw);
   await fp.goto(base+'#golf/now');await fp.locator('.g-final-lesson-practice').waitFor();assert.equal(await fp.evaluate(()=>localStorage.getItem('ptgolf_learning_v1')),oldRaw,'failed cleanup preserves all original bytes');
   await fp.evaluate(()=>{Storage.prototype.setItem=window.__realSet;sessionStorage.setItem('retry-cleanup','1');});await fp.reload();await fp.locator('.g-final-lesson-practice').waitFor();assert.deepEqual(await fp.evaluate(()=>JSON.parse(localStorage.getItem('ptgolf_learning_v1'))),expectedGolf);
   await fp.evaluate(()=>localStorage.setItem('ptgolf_learning_v1','invalid JSON'));await fp.reload();await fp.locator('.g-final-lesson-practice').waitFor();assert.equal(await fp.evaluate(()=>localStorage.getItem('ptgolf_learning_v1')),'invalid JSON','corrupt storage is never overwritten by cleanup');
  }finally{await failed.close();}
  assert.deepEqual(errors,[]);console.log('PASS: focused golf now, five practice steps, latest lesson priority, readonly archives/search, retired five-shot records with other storage/backup preserved, optional question draft/failure retry, past answers, mobile themes and offline.');
 }finally{await c.close();}
};
