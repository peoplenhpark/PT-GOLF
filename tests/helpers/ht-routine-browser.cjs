const assert=require('node:assert/strict');
module.exports=async(browser,base)=>{
 const context=await browser.newContext({viewport:{width:390,height:844},timezoneId:'Asia/Seoul',serviceWorkers:'block'});
 const page=await context.newPage(),errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 const selected=()=>page.locator('.ht-routine-days [aria-pressed="true"]').getAttribute('data-ht-day');
 try{
  const days=['mon','tue','wed','thu','fri','sat','sun'],counts=[6,4,0,6,4,0,0];
  for(let i=0;i<7;i++){
   // 00:30 Seoul is still the previous UTC day. Selection must use local time.
   await page.clock.setFixedTime(new Date(`2026-10-${19+i}T00:30:00+09:00`));
   await page.goto(base+'#ht');await page.locator('#ht-routine').waitFor();
   assert.equal(await selected(),days[i]);
   assert.equal(await page.locator('.ht-routine-days button').count(),7);
   assert.equal(await page.locator('.ht-routine-days [aria-current="date"]').getAttribute('data-ht-day'),days[i]);
   assert.equal(await page.locator('#ht-routine-day li').count(),counts[i]);
   if(!counts[i])assert.match(await page.locator('#ht-routine-day').innerText(),/휴식일.*예정된 근력운동이 없습니다/s);
   assert.equal(await page.locator('.ht-routine-basic li').count(),5);
   assert(await page.evaluate(()=>document.querySelector('.ht-routine-basic').compareDocumentPosition(document.querySelector('.ht-routine-days')) & Node.DOCUMENT_POSITION_FOLLOWING));
  }
  const stored=await page.evaluate(()=>JSON.stringify(localStorage));
  for(let i=0;i<7;i++){
   await page.locator(`.ht-routine-days [data-ht-day="${days[i]}"]`).click();
   assert.equal(await selected(),days[i]);
   assert.equal(await page.locator('#ht-routine-day li').count(),counts[i]);
  }
  assert.equal(await page.evaluate(()=>JSON.stringify(localStorage)),stored,'day selection never writes personal records');
  await page.locator('.ht-routine-days [data-ht-day="mon"]').click();
  await page.goto(base+'#ht?cat=all');await page.locator('#ht-routine').waitFor();assert.equal(await selected(),'mon');
  await page.locator('.ht-routine-basic a').first().click();await page.locator('.d-title').waitFor();
  await page.goBack();await page.locator('#ht-routine').waitFor();assert.equal(await selected(),'mon');
  await page.getByRole('button',{name:'오늘로 돌아가기'}).click();assert.equal(await selected(),'sun');
  await page.locator('.ht-routine-days [data-ht-day="thu"]').click();
  await page.reload();await page.locator('#ht-routine').waitFor();assert.equal(await selected(),'sun');
  // Returning to an open tab after midnight selects the new day.
  await page.clock.setFixedTime(new Date('2026-10-26T00:30:00+09:00'));
  await page.evaluate(()=>window.dispatchEvent(new Event('focus')));assert.equal(await selected(),'mon');
  await page.locator('.ht-routine-days [data-ht-day="fri"]').click();
  await page.evaluate(()=>window.dispatchEvent(new Event('focus')));assert.equal(await selected(),'fri');
  for(const theme of ['light','dark'])for(const width of [320,390,768]){
   await page.setViewportSize({width,height:844});await page.evaluate(t=>document.documentElement.setAttribute('data-theme',t),theme);
   assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
   assert(await page.locator('.ht-routine-days button').evaluateAll(es=>es.every(e=>e.getBoundingClientRect().height>=44&&e.scrollWidth<=e.clientWidth)));
  }
  await page.goto(base+'#pt/now');await page.locator('.coach-tabs').waitFor();assert.equal(await page.locator('#ht-routine').count(),0);
  assert.deepEqual(errors,[]);
  console.log('PASS: HT local weekday defaults, 3 rest days, manual selection, return-to-today, reload, midnight return, preserved records/order and responsive weekdays.');
 }finally{await context.close();}
};
