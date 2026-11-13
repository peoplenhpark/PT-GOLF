const assert=require('node:assert/strict');
module.exports=async(browser,base)=>{
 const context=await browser.newContext({viewport:{width:390,height:844}}),p=await context.newPage(),errors=[];p.on('pageerror',e=>errors.push(e.message));
 try{
  for(const part of ['pt','golf']){
   await p.goto(base+'#'+part+'/now');await p.locator('.coach-recent-'+part).waitFor();
   const content=part==='pt'?'.ht-final-review':'.coach-desk',before=await p.locator(content).innerText();
   await p.goto(base+'#home');await p.locator('.part.'+part).focus();await p.keyboard.press('Enter');
   await p.waitForFunction(part=>document.activeElement?.classList.contains('coach-recent-'+part),part);
   assert.equal(await p.locator(content).innerText(),before,'home jump preserves all existing practice content');
   assert(!p.url().includes('start=recent'),'one-time entry intent is consumed');
   const box=await p.locator('.coach-recent-'+part).boundingBox();assert(box.y>=0&&box.y<(part==='pt'?150:844),'recap anchor is visible after the home jump');
   await p.goBack();await p.locator('.home-destinations').waitFor();await p.goForward();await p.locator('.coach-recent-'+part).waitFor();
   await p.goto(base+'#'+part+'/now?start=recent');await p.waitForFunction(part=>document.activeElement?.classList.contains('coach-recent-'+part),part);
   const exits=p.locator('.coach-recap-links');assert.equal(await exits.locator('a,button').count(),2);
   await exits.locator('button').click();await p.waitForFunction(part=>document.activeElement?.classList.contains(part==='pt'?'coach-personal':'g-stage-overview'),part);
   assert.equal(await p.locator(content).innerText(),before,'recap exits scroll without replacing practice content');
   if(part==='pt')assert(await p.locator('.coach-routine-link').isVisible());
   await exits.locator('a').click();
   if(part==='pt'){await p.locator('.pt-exercise-grid').waitFor();assert.equal(await p.locator('.pt-exercise-grid .ex').count(),62);}
   else{await p.locator('.g-tabs').waitFor();assert.equal(await p.locator('.g-tabs a').count(),3);assert.match(await p.locator('.g-tabs').innerText(),/레슨/);}

  }
  await p.goto(base+'#pt/now');await p.locator('.coach-tabs').waitFor();assert.equal(await p.locator('.coach-tabs a').count(),1);assert.equal(await p.locator('.coach-header-link a[href="#pt/standards"]').count(),0);assert.equal(await p.locator('.coach-questions').count(),0,'empty question section is omitted');
  const latestPT=await p.evaluate(()=>Store.getPTSessions().slice().sort((a,b)=>b.date.localeCompare(a.date))[0]);
  const recent=p.locator('.coach-recent-pt');assert.equal(await recent.locator('time').first().innerText(),latestPT.date);
  const recentCards=recent.locator('.coach-recent-grid');
  const review=await p.evaluate(()=>HTGuide.review()),reviewed=review.groups.flatMap(g=>g.items);
  const linked=latestPT.items.filter(i=>i.exerciseId);
  assert.equal(await recentCards.locator('a').count(),reviewed.length);
  for(const row of reviewed)assert((await recentCards.locator('[href="#exercise/'+row.exercise.id+'"]').innerText()).includes(row.exercise.practiceGuide?.core||row.item.points[0]));
  assert.match(await recent.locator('.coach-solo-keys').innerText(),/HT 루틴을 중심/);
  assert.equal(await p.locator('.coach-plan').count(),0);assert.match(await p.locator('.coach-routine-link').innerText(),/기본 20분/);assert.equal(await p.locator('.coach-personal-links a').count(),6);assert.match(await p.locator('.coach-personal h2').innerText(),/22종목/);
  assert.equal(await recent.locator('.coach-recent-grid').locator(':scope > div').count(),0);
  await recent.locator('.coach-session-details').first().locator('summary').click();
  const detailText=await recent.locator('.coach-session-details').first().innerText();
  assert(detailText.includes(latestPT.evidence));for(const item of latestPT.items)assert(detailText.includes(item.range));
  assert.equal(await p.locator('a[href="#exercise/null"]').count(),0);
  await p.goto(base+'#pt');await p.getByText('PT 수업 기록',{exact:true}).click();await p.locator('.pt-session-note').first().locator(':scope > summary').click();
  assert.equal(await p.locator('.pt-session-links').first().locator('a').count(),linked.length);
  assert.equal(await p.locator('a[href="#exercise/null"]').count(),0);
  await p.locator('.pt-session-note').first().locator('.coach-session-details > summary').click();
  assert((await p.locator('.pt-session-note').first().innerText()).includes(latestPT.items[0].points[0]));
  await p.goto(base+'#pt/now');await p.locator('.coach-tabs').waitFor();
  await p.evaluate(()=>localStorage.setItem(Persistence.KEYS.coaching, JSON.stringify({schemaVersion:1,criteria:[],active:{},records:[],revisions:[]})));
  await p.reload();await p.locator('.coach-personal').waitFor();
  assert.equal(await p.evaluate(()=>localStorage.getItem(Persistence.KEYS.coaching)),null);
  await p.goto(base+'#pt/standards');await p.locator('.coach-personal').waitFor();
  assert.equal(await p.locator('.pt-archive').count(),0);
  for(const part of ['pt','golf'])for(const tab of ['now','standards'])for(const theme of ['light','dark'])for(const width of [320,390,768]){await p.goto(base+'#'+part+'/'+tab);await p.locator('.coach-tabs').waitFor();await p.setViewportSize({width,height:844});await p.evaluate(t=>document.documentElement.setAttribute('data-theme',t),theme);assert(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));}
  await p.setViewportSize({width:390,height:844});await p.goto(base+'#pt/now');await p.evaluate(()=>document.documentElement.setAttribute('data-theme','dark'));if(process.env.PTGOLF_SCREENSHOT_DIR)await p.screenshot({path:process.env.PTGOLF_SCREENSHOT_DIR+'/compact-pt.png',fullPage:true});
  await p.goto(base+'#golf/now');if(process.env.PTGOLF_SCREENSHOT_DIR)await p.screenshot({path:process.env.PTGOLF_SCREENSHOT_DIR+'/compact-golf.png',fullPage:true});
  await p.waitForFunction(()=>!!navigator.serviceWorker.controller);await context.setOffline(true);await p.reload();await p.locator('.g-final-lesson-practice').waitFor();assert.equal(await p.locator('.coach-current').count(),0);assert.equal(await p.evaluate(()=>localStorage.getItem(Persistence.KEYS.coaching)),null);await context.setOffline(false);
  await p.goto(base+'#pt');await p.locator('.pt-exercise-grid').waitFor();assert.equal(await p.locator('.coach-fold[open]').count(),0);assert.match(await p.locator('.pt-exercise-grid').innerText(),/풀업/);
  await p.goto(base+'#exercise/pt_pullup');await p.locator('[data-act=memo-top]').click();await p.locator('#memo-input').fill('기존 자유 메모 유지');await p.locator('#memo-save').click();await p.reload();assert.equal(await p.locator('.memo-box').innerText(),'기존 자유 메모 유지');
  assert.deepEqual(errors,[]);console.log('PASS: reference-first PT/golf, personal 22, retired archive and storage cleanup, mobile themes, offline and exercise memo.');
 }finally{await context.close();}
};
