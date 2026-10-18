const assert=require('node:assert/strict');
module.exports=async(browser,base)=>{
 const context=await browser.newContext({viewport:{width:390,height:844}}),p=await context.newPage();
 try{
  await p.addInitScript(()=>{if(!localStorage.getItem('ptgolf_learning_v1'))localStorage.setItem('ptgolf_learning_v1',JSON.stringify({lessons:[],questions:[],focus:[],videoNotes:{'2tam4sbJQtM':{action:'내가 수정한 백스윙 동작',feel:'개인 확인점 보존',check:'프로에게 질문할 내용',memo:'개인 메모 보존',favorite:true}}}));});
  await p.goto(base+'#golf/videos/2tam4sbJQtM');await p.locator('#g-video-memo').waitFor();
  assert.match(await p.locator('.g-practical-summary').innerText(),/내가 수정한 백스윙 동작/);assert.match(await p.locator('.g-practical-summary').innerText(),/개인 확인점 보존/);assert.match(await p.locator('.g-practical-summary').innerText(),/프로에게 질문할 내용/);
  assert.equal(await p.locator('#g-video-memo').inputValue(),'개인 메모 보존');assert.equal(await p.locator('[data-g=favorite-video]').getAttribute('aria-pressed'),'true');
  assert.equal(await p.locator('.g-solo-steps li:visible').count(),3);assert.equal(await p.locator('.g-solo-practice ul li:visible').count(),3);
  await p.goto(base+'#golf/notes');await p.locator('.g-note-summary').first().waitFor();
  assert.equal(await p.locator('.g-note-summary').count(),4);
  assert(await p.locator('.g-note-row').evaluateAll(rows=>rows.every(row=>{const action=row.querySelector('.g-note-summary span')?.textContent;return !action||row.querySelector('.ex .spec')?.textContent!==action;})));
  await p.locator('[data-open]').first().click();await p.locator('.personal-note-label').waitFor();assert.match(await p.locator('.personal-note-label').innerText(),/개인 연습 감각/);
  for(const route of ['now','notes','lessons','today','videos/2tam4sbJQtM']){
   await p.goto(base+'#golf/'+route);await p.locator('.coach-desk,.g-hub').first().waitFor();
   for(const theme of ['light','dark'])for(const width of [320,390,768]){await p.evaluate(t=>document.documentElement.setAttribute('data-theme',t),theme);await p.setViewportSize({width,height:844});assert(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),route+' '+theme+' '+width);}
  }
  console.log('PASS: compact golf copy preserves custom action/feel/check/memo/favorite, expanded 3/3, note detail and mobile themes.');
 }finally{await context.close();}
};
