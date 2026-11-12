const assert=require('node:assert/strict');
module.exports=async(browser,base)=>{
 const context=await browser.newContext({viewport:{width:390,height:844},serviceWorkers:'block'}),p=await context.newPage(),errors=[];
 p.on('pageerror',e=>errors.push(e.message));
 try{
  await p.goto(base+'#golf/now');await p.locator('.g-final-lesson-practice').waitFor();
  const combined=p.locator('.g-combined-lesson');
  assert.equal(await combined.count(),1,'latest regular lesson has one top card');
  assert.equal(await combined.locator('ol li').count(),5);assert.equal(await combined.locator('ul li').count(),5);
  assert.equal(await combined.locator('details:not([open])').count(),1);
  assert.equal(await combined.locator('time').first().getAttribute('datetime'),'2026-11-11');
  assert.match(await combined.locator('h2').innerText(),/11.11 마지막 레슨/);
  assert(await combined.evaluate(el=>el===el.parentElement.querySelector(':scope>section:not(.g-left-arm-pin)')));
  assert.equal(await p.locator('.coach-recent-golf').count(),1);assert.equal(await p.locator('.g-lesson-priority,.g-lesson-video-focus').count(),0);
  for(const href of ['#golf/lessons/lesson_20261102_release','#golf/lessons/lesson_20261030_driver','#golf/lessons/lesson_20261106_relax'])assert.equal(await combined.locator('a[href="'+href+'"]').count(),1);
  assert.equal(await p.locator('.g-daily-pin,.g-basic-practice-pin,.g-stage-practice,.g-pinned-sequence').count(),0);
  for(const theme of ['light','dark'])for(const width of [320,390,768]){
   await p.setViewportSize({width,height:844});await p.evaluate(t=>document.documentElement.setAttribute('data-theme',t),theme);
   assert(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
  }
  await p.goto(base+'#golf/videos');await p.locator('.g-daily-pin').waitFor();
  const practice=await p.evaluate(()=>({steps:GolfContent.practicePin.steps,checks:GolfContent.practicePin.checks}));
  await p.locator('.g-daily-pin .g-daily-title').click();await p.locator('#g-video-memo').waitFor();assert(p.url().includes('hxXJnJRKKcE'));
  assert.deepEqual(await p.locator('.g-daily-detail ol li').allTextContents(),practice.steps);assert.deepEqual(await p.locator('.g-daily-detail ul li').allTextContents(),practice.checks);
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
  assert.deepEqual(errors,[]);console.log('PASS: focused Now without old pins, library practice guide with visible 3+3, correct video/memo, club filters, recent expiry, old backswing pin and mobile themes.');
 }finally{await context.close();}
};
