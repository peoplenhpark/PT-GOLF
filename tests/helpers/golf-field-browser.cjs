const assert=require('node:assert/strict');
module.exports=async(browser,base)=>{
 const context=await browser.newContext({viewport:{width:390,height:844}}),p=await context.newPage(),errors=[];p.on('pageerror',e=>errors.push(e.message));
 try{
  await p.goto(base+'#golf/now');await p.locator('.golf-stage-nav a[href="#golf/field"]').click();await p.locator('.g-field-page').waitFor();
  assert.equal(await p.locator('.golf-stage-nav a[aria-current=page]').innerText(),'실전');assert.equal(await p.locator('.g-field-page .g-video-card').count(),1);
  const before=await p.evaluate(()=>localStorage.getItem('ptgolf_learning_v1'));
  for(const route of ['#golf/field','#golf/group/field','#golf/videos/z9lAaO2IefM']){
   await p.goto(base+route);await p.locator('.g-solo-practice').waitFor();assert.equal(await p.locator('.g-solo-steps li:visible').count(),3);assert.equal(await p.locator('.g-solo-practice ul li:visible').count(),3);assert.match(await p.locator('.g-solo-practice').innerText(),/멈추려고 힘주지 않기/);
   await p.waitForFunction(()=>[...document.querySelectorAll('.g-frame img')].length===2&&[...document.querySelectorAll('.g-frame img')].every(i=>i.complete&&i.naturalWidth>0));
   for(const theme of ['light','dark'])for(const width of [320,390,768]){await p.evaluate(t=>document.documentElement.setAttribute('data-theme',t),theme);await p.setViewportSize({width,height:844});assert(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),route+' '+theme+' '+width);assert(await p.locator('.golf-stage-nav a').evaluateAll(es=>es.length===5&&es.every(e=>e.scrollWidth<=e.clientWidth)&&new Set(es.map(e=>Math.round(e.getBoundingClientRect().top))).size===1),'five readable tabs in one row');}
  }
  assert.equal(await p.locator('.back[href="#golf/field"]').count(),1);assert.equal(await p.evaluate(()=>localStorage.getItem('ptgolf_learning_v1')),before);
  await p.goto(base+'#golf/group/all');await p.locator('#g-group-field').waitFor();assert.equal(await p.locator('.g-mini-detail[href="#golf/videos/z9lAaO2IefM"]').count(),1);
  await p.goto(base+'#golf/group/all?golfClub=driver');await p.locator('.g-club-filters').waitFor();assert.equal(await p.locator('.g-mini-detail[href="#golf/videos/z9lAaO2IefM"]').count(),0);
  await p.evaluate(()=>Store.requestDeletion({kind:'video',contentId:'z9lAaO2IefM',title:'test field deletion'}));await p.goto(base+'#golf/field');await p.locator('.g-field-page').waitFor();assert.equal(await p.locator('.g-video-card').count(),0);assert.match(await p.locator('.g-field-page').innerText(),/현재 표시할 실전 영상이 없습니다/);
  assert.deepEqual(errors,[]);console.log('PASS: 실전 navigation/detail/alias, expanded 3+3, original images, iron filter, unique placement, deletion filtering, storage preservation and mobile themes.');
 }finally{await context.close();}
};
