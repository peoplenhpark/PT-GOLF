const assert=require('node:assert/strict');
module.exports=async(browser,base)=>{
 const context=await browser.newContext({viewport:{width:390,height:844}}),p=await context.newPage(),errors=[];p.on('pageerror',e=>errors.push(e.message));
 try{
  for(const part of ['pt','golf']){
   await p.goto(base+'#'+part+'/now');await p.locator('.coach-recent-'+part).waitFor();
   const before=await p.locator('.coach-desk').innerText();
   await p.goto(base+'#home');await p.locator('.part.'+part).focus();await p.keyboard.press('Enter');
   await p.waitForFunction(part=>document.activeElement?.classList.contains('coach-recent-'+part),part);
   assert.equal(await p.locator('.coach-desk').innerText(),before,'home jump preserves all existing practice content');
   assert(!p.url().includes('start=recent'),'one-time entry intent is consumed');
   const box=await p.locator('.coach-recent-'+part).boundingBox();assert(box.y>=0&&box.y<150,'recent recap is at viewport top');
   await p.goBack();await p.locator('.home-destinations').waitFor();await p.goForward();await p.locator('.coach-recent-'+part).waitFor();
   await p.goto(base+'#'+part+'/now?start=recent');await p.waitForFunction(part=>document.activeElement?.classList.contains('coach-recent-'+part),part);
   const exits=p.locator('.coach-recap-links');assert.equal(await exits.locator('a,button').count(),2);
   await exits.locator('button').click();await p.waitForFunction(part=>document.activeElement?.classList.contains(part==='pt'?'coach-personal':'g-basic-practice-pin'),part);
   assert.equal(await p.locator('.coach-desk').innerText(),before,'recap exits scroll without replacing practice content');
   if(part==='pt')assert(await p.locator('.coach-routine-link').isVisible());
   await exits.locator('a').click();
   if(part==='pt'){await p.locator('.pt-exercise-grid').waitFor();assert.equal(await p.locator('.pt-exercise-grid .ex').count(),53);}
   else{await p.locator('.g-tabs').waitFor();assert.equal(await p.locator('.g-tabs a').count(),3);assert.match(await p.locator('.g-tabs').innerText(),/레슨/);}

  }
  await p.goto(base+'#pt/now');await p.locator('.coach-tabs').waitFor();assert.equal(await p.locator('.coach-tabs a').count(),1);assert.equal(await p.locator('.coach-header-link a').getAttribute('href'),'#pt/standards');assert.equal(await p.locator('.coach-questions').count(),0,'empty question section is omitted');
  const recent=p.locator('.coach-recent-pt');assert.equal(await recent.locator('time').innerText(),'2026-10-27');
  const recentCards=recent.locator('.coach-recent-grid').first();
  assert.equal(await recentCards.locator('a').count(),3);
  assert.match(await recentCards.locator('[href="#exercise/pt_chestpress"]').innerText(),/가슴이 유지되고 어깨가 말리지 않는 깊이/);
  assert.match(await recentCards.locator('[href="#exercise/pt_shoulderpress"]').innerText(),/양 손바닥/);
  assert.equal(await recent.locator('.coach-solo-keys li:visible').count(),2);
  assert.equal(await p.locator('.coach-plan').count(),0);assert.match(await p.locator('.coach-routine-link').innerText(),/기본 20분/);assert.equal(await p.locator('.coach-personal-links a').count(),6);assert.match(await p.locator('.coach-personal h2').innerText(),/20종목/);
  assert.equal(await recent.locator('.coach-recent-grid').first().locator(':scope > div').count(),0,'confirmed movements link to their own exercises');
  await recent.locator('.coach-session-details').first().locator('summary').click();
  assert.match(await recent.locator('.coach-session-details').first().innerText(),/26:08–36:43/);
  assert.match(await recent.locator('.coach-session-details').first().innerText(),/허리 통증은 참고 반복할 신호가 아니다/);
  assert.equal(await p.locator('a[href="#exercise/null"]').count(),0);
  await p.goto(base+'#pt');await p.getByText('PT 수업 기록',{exact:true}).click();await p.locator('.pt-session-note').first().locator(':scope > summary').click();
  assert.equal(await p.locator('.pt-session-links').first().locator('a').count(),3);
  assert.equal(await p.locator('a[href="#exercise/null"]').count(),0);
  await p.locator('.pt-session-note').first().locator('.coach-session-details > summary').click();
  assert.match(await p.locator('.pt-session-note').first().innerText(),/가슴이 유지되고 어깨가 말리지 않는 깊이/);
  await p.goto(base+'#pt/now');await p.locator('.coach-tabs').waitFor();
  const seeded=await p.evaluate(()=>{
   const c=CoachDesk.saveCriterion({part:'pt',sourceKey:'pt:pt_hip_openclose_stretch',title:'고관절 오픈·클로즈',cue:'발 지지와 몸 전체 회전',check:'골반과 가슴이 함께 움직이는지 확인',setup:'준비 원문',caution:'주의 원문',club:'',referenceId:'',confirmed:false});
   CoachDesk.saveRecord({id:'legacy-pt-result',part:'pt',criterionId:c.id,result:'판단 어려움',memo:'왼쪽에서 더 어려웠음',question:'왼발 지지를 어떻게 확인할까요?'});
   CoachDesk.saveCriterion({...c,cue:'수정한 개인 감각'});
   return JSON.stringify(CoachDesk.read());
  });
  await p.reload();await p.locator('.coach-personal').waitFor();
  assert.equal(await p.locator('.coach-current,[data-coach-form],.coach-questions,[data-coach-finish]').count(),0,'no daily management even with legacy active criterion');
  await p.getByRole('link',{name:'보관 기록',exact:true}).click();await p.locator('.pt-archive').waitFor();
  assert.equal(await p.locator('[data-coach-source],[data-coach-use],[data-coach-form=criterion]').count(),0);
  assert.equal(await p.locator('.coach-session-archive > details').count(),await p.evaluate(()=>Store.getPTSessions().length));
  await p.locator('.pt-archive > details > summary').first().click();
  assert.match(await p.locator('.pt-archive').innerText(),/수정한 개인 감각/);
  await p.getByText('이전 기준',{exact:true}).click();assert.match(await p.locator('.pt-archive').innerText(),/발 지지와 몸 전체 회전/);
  assert.equal(await p.evaluate(()=>JSON.stringify(CoachDesk.read())),seeded,'browsing archive never migrates or rewrites old data');
  await p.locator('a[href="#pt/now?record=legacy-pt-result"]').click();await p.locator('.coach-selected-record').waitFor();
  assert.match(await p.locator('.coach-selected-record').innerText(),/왼쪽에서 더 어려웠음/);
  await p.getByText('수업 답변 남기기',{exact:true}).click();const answer=p.locator('[data-coach-form=answer]');
  assert.equal(await answer.locator('[name=apply]').count(),0);
  await answer.locator('[name=answer]').fill('엄지발가락 접촉이 유지되는지 확인');
  await p.reload();await answer.waitFor();assert.equal(await answer.locator('[name=answer]').inputValue(),'엄지발가락 접촉이 유지되는지 확인');
  await p.evaluate(()=>{window.__originalSetItem=Storage.prototype.setItem;Storage.prototype.setItem=function(k,v){if(k==='ptgolf_coaching_v1')throw Error('quota');return window.__originalSetItem.call(this,k,v);};});
  await answer.getByRole('button',{name:'답변 저장'}).click();assert.equal(await answer.locator('[name=answer]').inputValue(),'엄지발가락 접촉이 유지되는지 확인');assert.equal(await p.evaluate(()=>CoachDesk.read().records[0].answer),'');
  await p.evaluate(()=>{Storage.prototype.setItem=window.__originalSetItem;});await answer.getByRole('button',{name:'답변 저장'}).click();await p.locator('.coach-selected-record').waitFor();
  const data=await p.evaluate(()=>CoachDesk.read());assert.equal(data.records.length,1);assert.equal(data.records[0].snapshot.check,'골반과 가슴이 함께 움직이는지 확인');assert.equal(data.records[0].answer,'엄지발가락 접촉이 유지되는지 확인');assert.equal(data.revisions.length,1);assert.equal(data.criteria[0].check,'골반과 가슴이 함께 움직이는지 확인');
  await p.goto(base+'#search?q='+encodeURIComponent('왼쪽에서 더 어려웠음'));await p.locator('.search-result').filter({hasText:'연습 기록'}).click();await p.locator('.coach-selected-record').waitFor();assert.match(await p.locator('.coach-selected-record').innerText(),/왼쪽에서 더 어려웠음/);
  await p.evaluate(()=>CoachDesk.saveCriterion({part:'golf',sourceKey:'note:golf_iron7',title:'7번 아이언',club:'7번 아이언',cue:'순간 멈춤 후 자연스러운 템포',check:'타점을 기록해 비교',setup:'',caution:'',referenceId:'',confirmed:false}));
  await p.goto(base+'#golf/standards');await p.locator('.golf-archive').waitFor();await p.locator('.golf-archive .coach-fold>summary').first().click();assert.match(await p.locator('.golf-archive').innerText(),/자연스러운 템포/);
  const stored=await p.evaluate(()=>CoachDesk.read());assert.equal(stored.criteria.length,2);assert.notEqual(stored.active.pt,stored.active.golf);
  for(const part of ['pt','golf'])for(const tab of ['now','standards'])for(const theme of ['light','dark'])for(const width of [320,390,768]){await p.goto(base+'#'+part+'/'+tab);await p.locator('.coach-tabs').waitFor();await p.setViewportSize({width,height:844});await p.evaluate(t=>document.documentElement.setAttribute('data-theme',t),theme);assert(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));}
  await p.setViewportSize({width:390,height:844});await p.goto(base+'#pt/now');await p.evaluate(()=>document.documentElement.setAttribute('data-theme','dark'));if(process.env.PTGOLF_SCREENSHOT_DIR)await p.screenshot({path:process.env.PTGOLF_SCREENSHOT_DIR+'/compact-pt.png',fullPage:true});
  await p.goto(base+'#golf/now');if(process.env.PTGOLF_SCREENSHOT_DIR)await p.screenshot({path:process.env.PTGOLF_SCREENSHOT_DIR+'/compact-golf.png',fullPage:true});
  await p.waitForFunction(()=>!!navigator.serviceWorker.controller);await context.setOffline(true);await p.reload();await p.locator('.gq-reference').waitFor();assert.equal(await p.locator('.coach-current').count(),0);assert.equal(await p.evaluate(()=>CoachDesk.read().criteria.find(c=>c.part==='golf').cue),'순간 멈춤 후 자연스러운 템포');await context.setOffline(false);
  await p.goto(base+'#pt');await p.locator('.pt-exercise-grid').waitFor();assert.equal(await p.locator('.coach-fold[open]').count(),0);assert.match(await p.locator('.pt-exercise-grid').innerText(),/풀업/);
  await p.goto(base+'#exercise/pt_pullup');await p.locator('[data-act=memo-top]').click();await p.locator('#memo-input').fill('기존 자유 메모 유지');await p.locator('#memo-save').click();await p.reload();assert.equal(await p.locator('.memo-box').innerText(),'기존 자유 메모 유지');
  assert.deepEqual(errors,[]);console.log('PASS: reference-first PT/golf, personal 20, archive preservation, answer draft/failure retry, historical snapshot, mobile themes, offline and exercise memo.');
 }finally{await context.close();}
};
