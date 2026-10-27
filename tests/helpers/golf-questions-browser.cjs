const assert=require('node:assert/strict');
module.exports=async(browser,base)=>{
 const c=await browser.newContext({viewport:{width:390,height:844}}),p=await c.newPage(),errors=[];p.on('pageerror',e=>errors.push(e.message));
 try{
  await p.goto(base+'#golf/now');await p.locator('.gq-reference').waitFor();
  const original=await p.evaluate(()=>({lesson:document.querySelector('.coach-recent-golf').textContent,pin:document.querySelector('.g-daily-pin').textContent,stages:document.querySelector('.g-stage-practice').textContent}));
  const saved=await p.evaluate(()=>{
   const cr=CoachDesk.saveCriterion({part:'golf',sourceKey:'note:golf_iron7',title:'내 옛 아이언 기준',club:'7번 아이언',cue:'보존할 기준',check:'타점 비교',setup:'준비 기록',caution:'주의 기록',referenceId:'2tam4sbJQtM',confirmed:true});
   CoachDesk.saveRecord({id:'old-coach',part:'golf',criterionId:cr.id,result:'판단 어려움',memo:'보존할 과거 결과',question:'과거 기준 질문'});
   GolfQuestions.choose('start');GolfQuestions.save({id:'old-gq',topicId:'impact',club:'P 아이언',comfort:'편했음',consistency:'들쭉날쭉했음',memo:'보존할 질문별 결과',question:'과거 임팩트 질문'});
   Persistence.open(Persistence.KEYS.golf,{defaults:()=>({lessons:[],questions:[],focus:[],videoNotes:{}})}).update(s=>{s.lessons||=[];s.questions||=[];s.focus||=[];s.videoNotes||={};s.practice={sourceKind:'sensation',selected:'1001',club:'7번 아이언'};s.questions.push({id:'old-question',kind:'lessons',sourceId:'lesson_20261005_first',text:'보존할 원본 질문',created:'2026-10-05T01:00:00Z'});s.practiceRecords=[{id:'old-five',date:'2026-10-05',created:'2026-10-05T01:00:00Z',club:'7번 아이언',method:'cue',cueId:'1001',cueDate:'10/1',cueText:'밟고, 버티고, 톡',contact:3,direction:4,distance:'대체로 적정',feel:'비슷함',measure:'타감으로 판단'}];s.videoNotes['2tam4sbJQtM']={memo:'보존할 영상 메모',favorite:true};});
   Persistence.open(Persistence.KEYS.drafts).update(s=>{s['gq-result-start||memo']={value:'기존 입력 초안',updated:new Date().toISOString()};});
   return Object.fromEntries([Persistence.KEYS.coaching,Persistence.KEYS.golf,Persistence.KEYS.drafts].map(k=>[k,localStorage.getItem(k)]));
  });
  await p.reload();await p.locator('.gq-reference').waitFor();
  const expectedGolf=JSON.parse(saved.ptgolf_learning_v1);delete expectedGolf.practiceRecords;assert.deepEqual(await p.evaluate(()=>JSON.parse(localStorage.getItem(Persistence.KEYS.golf))),expectedGolf);saved.ptgolf_learning_v1=JSON.stringify(expectedGolf);
  assert.deepEqual(await p.evaluate(()=>({lesson:document.querySelector('.coach-recent-golf').textContent,pin:document.querySelector('.g-daily-pin').textContent,stages:document.querySelector('.g-stage-practice').textContent})),original);
  assert.equal(await p.locator('.gq-goal').count(),0);assert.equal(await p.locator('.gq-reference li').count(),3);
  assert.equal(await p.locator('[data-gq-focus],[data-gq-clear],[data-gq-form=result],[data-coach-form=result],.coach-current,.g-recent-practice,.gq-records').count(),0);
  assert.equal(await p.locator('.g-daily-pin ol li:visible').count(),3);assert.equal(await p.locator('.g-daily-pin ul li:visible').count(),3);
  assert.equal(await p.locator('.g-stage-practice ol li:visible').count(),12);assert.equal(await p.locator('.g-stage-practice ul li:visible').count(),12);
  for(const stage of ['backswing','downswing','impact','follow-through']){await p.locator('[aria-controls="g-stage-'+stage+'"]').click();assert(await p.locator('#g-stage-'+stage).evaluate(e=>e===document.activeElement));assert.equal(await p.locator('#g-stage-'+stage+' .g-stage-videos').getAttribute('href'),'#golf/group/'+stage);}
  for(const route of ['standards','today','now?topic=start','videos/2tam4sbJQtM']){await p.goto(base+'#golf/'+route);await p.locator('.coach-desk,.g-hub').first().waitFor();assert.equal(await p.locator('[data-coach-form=criterion],[data-g-form=practice],[data-gq-form=result]').count(),0);}
  await p.goto(base+'#golf/standards');await p.locator('.golf-archive .coach-fold>summary').first().click();assert.match(await p.locator('.golf-archive').innerText(),/보존할 기준/);assert.equal(await p.locator('.golf-archive [data-coach-use]').count(),0);
  await p.locator('a[href="#golf/now?record=old-coach"]').click();await p.locator('.coach-selected-record').waitFor();assert.match(await p.locator('.coach-selected-record').innerText(),/보존할 과거 결과/);
  await p.goto(base+'#golf/today');await p.locator('.gq-reference').waitFor();assert.match(p.url(),/#golf\/now/);
  await p.goto(base+'#search?q='+encodeURIComponent('보존할 질문별 결과'));await p.locator('.search-result').filter({hasText:'보존할 질문별 결과'}).click();await p.locator('.coach-selected-record').waitFor();assert.match(await p.locator('.coach-selected-record').innerText(),/과거 임팩트 질문/);
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
  await p.goto(base+'#golf/now?record=old-gq');await p.locator('.coach-selected-record summary').filter({hasText:'수업 답변 남기기'}).click();const answer=p.locator('[data-gq-form=answer]');await answer.locator('textarea').fill('받은 답변 보존');await answer.locator('button').click();await p.goto(base+'#golf/now?record=old-gq');await p.locator('.coach-selected-record').waitFor();assert.match(await p.locator('.coach-selected-record').innerText(),/받은 답변 보존/);
  for(const route of ['now','standards','today'])for(const theme of ['light','dark'])for(const width of [320,390,768]){await p.goto(base+'#golf/'+route);await p.locator('.coach-tabs').waitFor();await p.setViewportSize({width,height:844});await p.evaluate(t=>document.documentElement.setAttribute('data-theme',t),theme);assert(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));}
  await p.goto(base+'#golf/now');await p.waitForFunction(()=>!!navigator.serviceWorker.controller);await c.setOffline(true);await p.reload();await p.locator('.gq-reference').waitFor();assert.equal(await p.locator('[data-gq-focus]').count(),0);await c.setOffline(false);
  const failed=await browser.newContext({serviceWorkers:'block'}),fp=await failed.newPage();
  try{
   const oldRaw=JSON.stringify(oldBackup.stores.ptgolf_learning_v1);
   await fp.addInitScript(raw=>{if(!localStorage.getItem('ptgolf_learning_v1'))localStorage.setItem('ptgolf_learning_v1',raw);window.__realSet=Storage.prototype.setItem;if(!sessionStorage.getItem('retry-cleanup'))Storage.prototype.setItem=function(k,v){if(k==='ptgolf_learning_v1')throw Error('quota');return window.__realSet.call(this,k,v);};},oldRaw);
   await fp.goto(base+'#golf/now');await fp.locator('.gq-reference').waitFor();assert.equal(await fp.evaluate(()=>localStorage.getItem('ptgolf_learning_v1')),oldRaw,'failed cleanup preserves all original bytes');
   await fp.evaluate(()=>{Storage.prototype.setItem=window.__realSet;sessionStorage.setItem('retry-cleanup','1');});await fp.reload();await fp.locator('.gq-reference').waitFor();assert.deepEqual(await fp.evaluate(()=>JSON.parse(localStorage.getItem('ptgolf_learning_v1'))),expectedGolf);
   await fp.evaluate(()=>localStorage.setItem('ptgolf_learning_v1','invalid JSON'));await fp.reload();await fp.locator('.gq-reference').waitFor();assert.equal(await fp.evaluate(()=>localStorage.getItem('ptgolf_learning_v1')),'invalid JSON','corrupt storage is never overwritten by cleanup');
  }finally{await failed.close();}
  assert.deepEqual(errors,[]);console.log('PASS: golf reference-only now, static 3 questions, expanded pin/stage 3+3, latest lesson priority, readonly archives/search, retired five-shot records with other storage/backup preserved, optional question draft/failure retry, past answers, mobile themes and offline.');
 }finally{await c.close();}
};
