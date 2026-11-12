const assert=require('node:assert/strict');
module.exports=async(browser,base)=>{
 const context=await browser.newContext({viewport:{width:390,height:844}}),page=await context.newPage(),errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 try{
  await page.goto(base+'#pt/questions');await page.locator('#training-questions-title').waitFor();
  assert.match(await page.locator('.training-questions').innerText(),/질문·답변 완료/);
  const answers=await page.evaluate(()=>Store.getById('pt_pullup').practiceGuide.coachAnswers);
  for(const a of answers)assert((await page.locator('.training-questions').innerText()).includes(a.answer));
  await page.goto(base+'#exercise/pt_pullup');await page.locator('.exercise-practice-guide').waitFor();
  const guide=await page.locator('.exercise-practice-guide').innerText();
  for(const a of answers)assert(guide.includes(a.answer),'question and exercise share the same dated answer');
  assert.match(guide,/가슴을 들고/);assert.match(guide,/질문·답변 완료/);
  assert.equal(await page.locator('.exercise-practice-guide > details.training-prior').count(),1,'earlier lesson guide remains accessible');
  await page.goto(base+'#golf/now');await page.locator('.coach-recent-golf').waitFor();
  assert.equal(await page.locator('.coach-recent-golf time').first().getAttribute('datetime'),'2026-11-11');
  for(const hash of ['#golf/questions','#golf/videos/lGgedAC0KCA','#golf/videos/kuRoseAIbtw','#golf/videos/4Eof_tmI0Ag']){
   await page.goto(base+hash);await page.locator('.training-confirmed').waitFor();
   const text=await page.locator('.training-confirmed').innerText();assert.match(text,/직접 검토 답변/);assert.match(text,/왼손 이완/);
   assert.equal(await page.locator('.training-confirmed a[href="#golf/lessons/lesson_20261106_relax"]').count(),1);
  }
  await page.goto(base+'#golf/lessons/lesson_20261106_relax');await page.locator('.g-title').waitFor();assert.match(await page.locator('.g-hub').innerText(),/08:48/);
  for(const hash of ['#pt/questions','#exercise/pt_shoulderpress','#ht','#golf/questions','#golf/now'])for(const theme of ['light','dark'])for(const width of [320,390,768]){
   await page.setViewportSize({width,height:844});await page.goto(base+hash);await page.locator('.scr').waitFor();await page.evaluate(t=>document.documentElement.setAttribute('data-theme',t),theme);
   assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'new lesson guidance fits '+hash+' '+width);
  }
  assert.deepEqual(errors,[]);
  console.log('PASS: regular PT/golf lesson recaps, shared dated answers, remaining questions, prior guide, video context without false resolution and responsive themes.');
 }finally{await context.close();}
};