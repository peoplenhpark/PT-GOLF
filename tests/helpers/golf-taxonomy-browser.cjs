const assert=require('node:assert/strict');
module.exports=async(browser,base,screenshot)=>{
 const context=await browser.newContext({viewport:{width:390,height:844}}),p=await context.newPage(),errors=[];p.on('pageerror',e=>errors.push(e.message));
 try{
  await p.addInitScript(()=>{if(!localStorage.getItem('ptgolf_learning_v1'))localStorage.setItem('ptgolf_learning_v1',JSON.stringify({lessons:[],questions:[],focus:[],videoNotes:{dBsZdo7VEAA:{memo:'공통 이동 전 개인 메모',favorite:true,title:'내 공통 영상'},U4nn7s20ACc:{memo:'삭제 후에도 보존할 메모',favorite:true}}}));});
  await p.goto(base+'#golf/now');await p.locator('.g-stage-practice').waitFor();
  assert.equal(await p.locator('.g-common-practice').count(),1);
  assert(await p.locator('#gq-title').evaluate(e=>e.getBoundingClientRect().top+scrollY-(document.querySelector('.g-daily-pin')?.getBoundingClientRect().height||0)<1200),'apart from the explicitly requested top pin, today selection stays before long practice material');
  assert.equal(await p.locator('.g-solo-practice .g-practice-focus:visible, .g-stage-practice .g-practice-focus:visible').count(),3);
  assert.equal(await p.locator('.g-recent-practice .g-practice-focus:visible').count(),3);
  assert.deepEqual(await p.locator('.g-recent-practice a').evaluateAll(links=>links.map(a=>a.getAttribute('href'))),['#golf/videos/j1USTUwFnRI','#golf/videos/4DyoF3OQKww','#golf/videos/4Eof_tmI0Ag']);
  assert.equal(await p.locator('details.g-practice-guide').count(),0);
  assert.equal(await p.locator('.g-stage-practice .g-practice-columns ol li:visible').count(),9);
  assert.equal(await p.locator('.g-stage-practice .g-practice-columns ul li:visible').count(),9);
  assert.equal(await p.locator('.g-stage-links a').count(),4);
  assert.equal(await p.locator('.g-solo-practice .g-solo-steps li').count(),3);
  assert.equal(await p.locator('.g-solo-practice ul li').count(),3);
  assert(await p.evaluate(()=>{const selectors=['.g-pinned-sequence','.coach-recent-golf','.gq-hub','.g-solo-practice','.gq-records','.g-stage-practice'];return selectors.slice(1).every((s,i)=>document.querySelector(selectors[i]).compareDocumentPosition(document.querySelector(s))&Node.DOCUMENT_POSITION_FOLLOWING);}));
  assert.equal(await p.evaluate(()=>GolfQuestions.focus(CoachDesk.read())),null);
  await p.locator('[data-gq-focus="transition"]').click();
  const sections=await p.evaluate(()=>GolfContent.videoSections.map(s=>({id:s.id,groups:s.groups})));
  for(const section of sections){
   await p.goto(base+'#golf/group/'+section.id);await p.locator('.g-subsections').waitFor();
   assert.equal(await p.locator('.g-subsections a').count(),4);
   assert.equal(await p.locator('.g-video-section').count(),3);
   assert.equal(await p.locator('.g-common-practice').count(),0);
   assert.equal(await p.locator('.g-practice-focus:visible').count(),3);
   assert.equal(await p.locator('details.g-practice-guide').count(),0);
   assert.equal(await p.locator('.g-practice-columns ol li:visible, .g-solo-steps li:visible').count(),9);
   assert.equal(await p.locator('.g-practice-columns ul li:visible, .g-solo-practice ul li:visible').count(),9);
   assert.equal(await p.locator('.g-shared-references a[href="#golf/videos/dBsZdo7VEAA"]').count(),['impact','follow-through'].includes(section.id)?1:0);
   assert.equal(await p.locator('.g-representative .g-video-mini:visible').count(),3);
   assert.equal(await p.locator('.g-supplement[open]').count(),0);
   assert.equal(await p.locator('.g-supplement .g-mini-detail:visible').count(),0);
   await p.locator('.g-supplement>summary').first().click();assert((await p.locator('.g-supplement .g-mini-detail:visible').count())>0);
   if(section.id==='backswing')assert.equal(await p.locator('.g-mini-detail').first().getAttribute('href'),'#golf/videos/2tam4sbJQtM');
   for(const id of section.groups){
    await p.goto(base+'#golf/group/'+id);await p.locator('#g-group-'+id).waitFor();
    const guide=p.locator('section.g-practice-guide, .g-solo-practice').first();await guide.waitFor();
    assert.equal(await p.locator('.g-practice-focus:visible').count(),1);
    assert.equal(await p.locator('.g-practice-focus dt').allTextContents().then(x=>x.join('·')),'오늘 할 것·확인할 것');
    assert.equal(await guide.locator('ol li').count(),3);assert.equal(await guide.locator('ul li').count(),3);
    for(const theme of ['light','dark'])for(const width of [320,390,768]){
     await p.evaluate(t=>document.documentElement.setAttribute('data-theme',t),theme);await p.setViewportSize({width,height:844});
     assert(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),id+' '+width+' '+theme);
     assert(await guide.evaluate(el=>el.scrollWidth<=el.clientWidth),id+' guide overflow');
    }
   }
  }
  await p.goto(base+'#golf/group/review');await p.locator('#g-group-review').waitFor();assert.equal(await p.locator('.g-mini-detail').count(),0);assert.equal(await p.locator('.g-practice-guide').count(),0);
  assert.equal(await p.locator('.g-video-shortcuts a[href="#golf/group/review"]').count(),0);
  await p.goto(base+'#golf/group/common');await p.locator('#g-group-common').waitFor();assert.equal(await p.locator('.g-video-groups>a').count(),4);assert.equal(await p.locator('.g-mini-detail').count(),7);assert.match(await p.locator('.g-mini-detail[href="#golf/videos/dBsZdo7VEAA"] .g-mini-title').innerText(),/내 공통 영상/);
  for(const theme of ['light','dark'])for(const width of [320,390,768]){await p.evaluate(t=>document.documentElement.setAttribute('data-theme',t),theme);await p.setViewportSize({width,height:844});assert(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'common '+theme+' '+width);}
  await p.goto(base+'#golf/group/all');await p.locator('#g-group-common').waitFor();assert.equal(await p.locator('.g-mini-detail[href="#golf/videos/dBsZdo7VEAA"]').count(),1);
  await p.goto(base+'#golf/group/impact');await p.locator('.g-shared-references a[href="#golf/videos/dBsZdo7VEAA"]').click();await p.locator('#g-video-memo').waitFor();assert.equal(await p.locator('#g-video-memo').inputValue(),'공통 이동 전 개인 메모');assert.equal(await p.locator('[data-g=favorite-video]').getAttribute('aria-pressed'),'true');await p.reload();await p.locator('#g-video-memo').waitFor();assert.equal(await p.locator('#g-video-memo').inputValue(),'공통 이동 전 개인 메모');
  for(const id of ['U4nn7s20ACc','cQiwXcbWZc4']){await p.goto(base+'#golf/videos/'+id);await p.locator('.g-hub').waitFor();assert.equal(await p.locator('#g-video-memo').count(),0);assert.equal(await p.locator('a[href*="watch?v='+id+'"]').count(),0);}
  assert.equal(await p.evaluate(()=>JSON.parse(localStorage.getItem('ptgolf_learning_v1')).videoNotes.U4nn7s20ACc.memo),'삭제 후에도 보존할 메모');
  await p.goto(base+'#golf/video-favorites');await p.locator('#g-favorites-title').waitFor();assert.equal(await p.locator('a[href="#golf/videos/U4nn7s20ACc"]').count(),0);
  await p.goto(base+'#golf/videos/2tam4sbJQtM');await p.locator('#g-video-memo').waitFor();await p.locator('#g-video-memo').fill('네 구간 재편 후에도 보존할 메모');await p.locator('[data-g-form=video] button').click();
  await p.locator('[data-g=favorite-video]').click();await p.goto(base+'#golf/now');await p.locator('.g-stage-links').waitFor();assert.equal(await p.evaluate(()=>GolfQuestions.focus(CoachDesk.read())),'transition');
  await p.locator('.g-solo-practice>.g-link').click();await p.locator('#g-video-memo').waitFor();assert.equal(await p.locator('#g-video-memo').inputValue(),'네 구간 재편 후에도 보존할 메모');assert.equal(await p.locator('[data-g=favorite-video]').getAttribute('aria-pressed'),'true');
  await p.reload();await p.locator('#g-video-memo').waitFor();assert.equal(await p.locator('#g-video-memo').inputValue(),'네 구간 재편 후에도 보존할 메모');
  await p.goto(base+'#golf/group/backswing-top');await p.locator('#g-group-backswing-setup').waitFor();assert.equal(await p.locator('.g-mini-detail').first().getAttribute('href'),'#golf/videos/2tam4sbJQtM');
  if(screenshot){await p.setViewportSize({width:390,height:844});await p.evaluate(()=>document.documentElement.setAttribute('data-theme','light'));await p.screenshot({path:screenshot});}
  assert.deepEqual(errors,[]);console.log('PASS: four sections, 12 visible 3/3 guides, common single card/links, requested deletions, pin, folding, 320/390/768 light/dark, legacy route, memo/favorite/focus preserved.');
 }finally{await context.close();}
};
