const assert=require('node:assert/strict');
module.exports=async(browser,base)=>{
 const context=await browser.newContext({viewport:{width:390,height:844}}),p=await context.newPage(),errors=[];p.on('pageerror',e=>errors.push(e.message));
 try{
  await p.goto(base+'#pt/now');await p.locator('.coach-tabs').waitFor();assert.equal(await p.locator('.coach-tabs a').count(),2);
  await p.getByRole('link',{name:'첫 기준 고르기'}).click();await p.locator('[data-coach-source]').selectOption('pt:pt_hip_openclose_stretch');
  const form=p.locator('[data-coach-form=criterion]');await form.locator('[name=cue]').fill('발 지지와 몸 전체 회전');await form.locator('[name=check]').fill('골반과 가슴이 함께 움직이는지 확인');
  await p.reload();await form.waitFor();assert.equal(await form.locator('[name=cue]').inputValue(),'발 지지와 몸 전체 회전','criterion draft survives reload');
  await form.getByRole('button',{name:'저장하고 지금 확인하기'}).click();await p.locator('.coach-current h2').waitFor();assert.equal(await p.locator('.coach-current h2').innerText(),'발 지지와 몸 전체 회전');
  await p.getByText('결과 한 줄 · 질문 남기기',{exact:true}).click();const result=p.locator('[data-coach-form=result]');await result.locator('[name=result]').selectOption('판단 어려움');await result.locator('[name=memo]').fill('왼쪽에서 더 어려웠음');await result.locator('[name=question]').fill('왼발 지지를 어떻게 확인할까요?');
  await p.reload();await result.waitFor();assert.equal(await result.locator('[name=memo]').inputValue(),'왼쪽에서 더 어려웠음');
  // Failure must preserve visible input and avoid a false success.
  await p.evaluate(()=>{window.__originalSetItem=Storage.prototype.setItem;Storage.prototype.setItem=function(k,v){if(k==='ptgolf_coaching_v1')throw Error('quota');return window.__originalSetItem.call(this,k,v);};});
  await result.getByRole('button',{name:'결과 저장'}).click();assert.equal(await result.locator('[name=memo]').inputValue(),'왼쪽에서 더 어려웠음');assert.equal(await p.evaluate(()=>CoachDesk.read().records.length),0);
  await p.evaluate(()=>{Storage.prototype.setItem=window.__originalSetItem;});await result.getByRole('button',{name:'결과 저장'}).click();await p.locator('.coach-questions .coach-record').waitFor();
  await p.getByText('수업 답변 남기기',{exact:true}).click();const answer=p.locator('[data-coach-form=answer]');await answer.locator('[name=answer]').fill('엄지발가락 접촉이 유지되는지 확인');await answer.locator('[name=apply]').check();await answer.getByRole('button',{name:'답변 저장'}).click();assert.match(await p.locator('.coach-check').innerText(),/엄지발가락/);
  const data=await p.evaluate(()=>CoachDesk.read());assert.equal(data.records.length,1);assert.equal(data.records[0].snapshot.check,'골반과 가슴이 함께 움직이는지 확인');assert.equal(data.records[0].answer,'엄지발가락 접촉이 유지되는지 확인');assert.equal(data.revisions.length,1);
  await p.goto(base+'#search?q='+encodeURIComponent('왼쪽에서 더 어려웠음'));await p.locator('.search-result').filter({hasText:'연습 기록'}).click();await p.locator('.coach-selected-record').waitFor();assert.match(await p.locator('.coach-selected-record').innerText(),/왼쪽에서 더 어려웠음/);
  await p.goto(base+'#pt/now');await p.getByRole('button',{name:'확인 마치기',exact:true}).click();assert.equal(await p.evaluate(()=>CoachDesk.read().active.pt),undefined);assert.equal(await p.evaluate(()=>CoachDesk.read().records.length),1);
  await p.goto(base+'#pt/standards');await p.locator('[data-coach-use]').click();await p.locator('.coach-current').waitFor();
  await p.goto(base+'#golf/standards?source=note:golf_iron7');await form.waitFor();await form.locator('[name=cue]').fill('순간 멈춤 후 자연스러운 템포');await form.locator('[name=check]').fill('타점을 기록해 비교');await form.getByRole('button',{name:'저장하고 지금 확인하기'}).click();await p.locator('.coach-current').waitFor();assert.match(await p.locator('.coach-current').innerText(),/7번 아이언/);
  const stored=await p.evaluate(()=>CoachDesk.read());assert.equal(stored.criteria.length,2);assert.notEqual(stored.active.pt,stored.active.golf);
  for(const part of ['pt','golf'])for(const tab of ['now','standards'])for(const theme of ['light','dark'])for(const width of [320,390,768]){await p.goto(base+'#'+part+'/'+tab);await p.locator('.coach-tabs').waitFor();await p.setViewportSize({width,height:844});await p.evaluate(t=>document.documentElement.setAttribute('data-theme',t),theme);assert(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));}
  await p.setViewportSize({width:390,height:844});await p.goto(base+'#pt/now');await p.evaluate(()=>document.documentElement.setAttribute('data-theme','dark'));if(process.env.PTGOLF_SCREENSHOT_DIR)await p.screenshot({path:process.env.PTGOLF_SCREENSHOT_DIR+'/compact-pt.png',fullPage:true});
  await p.goto(base+'#golf/now');if(process.env.PTGOLF_SCREENSHOT_DIR)await p.screenshot({path:process.env.PTGOLF_SCREENSHOT_DIR+'/compact-golf.png',fullPage:true});
  await p.waitForFunction(()=>!!navigator.serviceWorker.controller);await context.setOffline(true);await p.reload();await p.locator('.coach-current').waitFor();assert.match(await p.locator('.coach-current').innerText(),/자연스러운 템포/);await context.setOffline(false);
  await p.goto(base+'#pt');await p.locator('.pt-exercise-grid').waitFor();assert.equal(await p.locator('.coach-fold[open]').count(),0);assert.match(await p.locator('.pt-exercise-grid').innerText(),/풀업/);
  await p.goto(base+'#exercise/pt_pullup');await p.locator('[data-act=memo-top]').click();await p.locator('#memo-input').fill('기존 자유 메모 유지');await p.locator('#memo-save').click();await p.reload();assert.equal(await p.locator('.memo-box').innerText(),'기존 자유 메모 유지');
  assert.deepEqual(errors,[]);console.log('PASS: compact PT/golf navigation, criterion/result drafts, failure retry, question resolution, historical snapshot, separate club criteria, mobile themes, offline and legacy memo.');
 }finally{await context.close();}
};
