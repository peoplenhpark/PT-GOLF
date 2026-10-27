const assert=require('node:assert/strict');
module.exports=async(browser,base)=>{
 const context=await browser.newContext({viewport:{width:390,height:844},serviceWorkers:'block'}),p=await context.newPage(),errors=[];
 p.on('pageerror',e=>errors.push(e.message));
 try{
  await p.goto(base+'#golf/now');await p.locator('.g-daily-pin').waitFor();
  const basic=p.locator('.g-basic-practice-pin');
  assert.equal(await basic.locator('.g-daily-title').getAttribute('href'),'#golf/videos/YUtzwggQMQc');
  assert.equal(await basic.locator('dl>div').count(),2);
  assert(await p.evaluate(()=>document.querySelector('.g-basic-practice-pin').compareDocumentPosition(document.querySelector('.g-daily-pin'))&Node.DOCUMENT_POSITION_FOLLOWING));
  assert.equal(await basic.locator('h2').evaluate(el=>getComputedStyle(el).fontSize),await p.locator('.g-daily-pin h2').evaluate(el=>getComputedStyle(el).fontSize));
  assert.equal(await p.locator('.g-daily-pin ol li:visible').count(),3);assert.equal(await p.locator('.g-daily-pin ul li:visible').count(),3);
  assert.equal(await p.locator('.g-daily-pin details').count(),0);
  assert(await p.evaluate(()=>document.querySelector('.g-daily-pin').compareDocumentPosition(document.querySelector('.g-pinned-sequence'))&Node.DOCUMENT_POSITION_FOLLOWING));
  assert(await p.locator('.coach-recent-golf').isVisible());assert(await p.locator('.g-solo-practice').isVisible());
  for(const theme of ['light','dark'])for(const width of [320,390,768]){
   await p.setViewportSize({width,height:844});await p.evaluate(t=>document.documentElement.setAttribute('data-theme',t),theme);
   assert(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
  }
  const practiceText=await p.locator('.g-daily-pin .g-practice-columns').innerText();
  await p.locator('.g-daily-pin .g-daily-title').click();await p.locator('#g-video-memo').waitFor();assert(p.url().includes('hxXJnJRKKcE'));
  assert.equal(await p.locator('.g-daily-detail .g-practice-columns').innerText(),practiceText);
  assert.equal(await p.locator('.g-daily-detail ol li:visible').count(),3);assert.equal(await p.locator('.g-daily-detail ul li:visible').count(),3);
  assert.equal(await p.locator('.g-practical-summary dl>div').count(),1);
  assert(await p.locator('.g-daily-detail a[href="#golf/now"]').isVisible());
  await p.locator('#g-video-memo').fill('상시 연습 메모');await p.getByRole('button',{name:'메모 저장',exact:true}).click();await p.reload();await p.locator('#g-video-memo').waitFor();assert.equal(await p.locator('#g-video-memo').inputValue(),'상시 연습 메모');
  for(const route of ['golf/videos','golf/group/all','golf/group/recent','golf/group/common']){
   await p.goto(base+'#'+route);await p.locator('.g-daily-pin').waitFor();assert(await p.locator('.g-daily-actions a[href="#golf/now"]').isVisible());
   assert(await p.evaluate(()=>document.querySelector('.g-daily-pin').compareDocumentPosition(document.querySelector('.g-library-heading'))&Node.DOCUMENT_POSITION_FOLLOWING));
  }
  assert.equal(await p.locator('.g-mini-detail').first().getAttribute('href'),'#golf/videos/hxXJnJRKKcE');
  await p.goto(base+'#golf/group/all?golfClub=iron');await p.locator('.g-club-filters').waitFor();assert.equal(await p.locator('.g-daily-pin').count(),0);
  await p.goto(base+'#golf/group/backswing');await p.locator('.g-solo-card').waitFor();assert.equal(await p.locator('.g-solo-card .g-mini-detail').first().getAttribute('href'),'#golf/videos/2tam4sbJQtM');
  await p.clock.setFixedTime(new Date('2030-01-01T12:00:00+09:00'));await p.goto(base+'#golf/videos');await p.locator('.g-daily-pin').waitFor();assert.match(await p.locator('.g-recent-section').innerText(),/0편/);
  assert.deepEqual(errors,[]);console.log('PASS: permanent practice pin, visible 3+3, early placement, correct video/memo, club filters, recent expiry, old backswing pin and mobile themes.');
 }finally{await context.close();}
};
