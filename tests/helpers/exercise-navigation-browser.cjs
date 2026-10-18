const assert=require('node:assert/strict');
module.exports=async(browser,base)=>{
 const context=await browser.newContext({viewport:{width:390,height:844},serviceWorkers:'block'}),p=await context.newPage(),errors=[];
 p.on('pageerror',e=>errors.push(e.message));
 try{
  for(const route of ['home','pt/now','pt/standards','pt','ht','exercise/pt_chestpress','golf/now','golf/videos','golf/group/backswing-top','favorites','calendar','search']){
   await p.goto(base+'#'+route);await p.locator('.exercise-quicknav summary').waitFor();
   assert(await p.locator('.exercise-search').isVisible(),route+' has global search');
   assert.equal(await p.locator('.tabbar .tab').count(),6);
  }
  await p.goto(base+'#pt/now');await p.locator('.coach-recent-pt').waitFor();
  await p.locator('.exercise-quicknav summary').click();
  assert.equal(await p.locator('.exercise-quickpanel section').first().locator('h3').innerText(),'내 개인운동');
  await p.locator('.exercise-quickpanel a[href="#pt?cat=personal"]').click();
  await p.locator('.personal-exercises').waitFor();
  const chosen=['pt_tailbone_raise','pt_lunge_ball_rotation','pt_hip_openclose_stretch','pt_openbook','pt_wide_sidelunge_stretch','pt_chestpress','pt_pecdeck','pt_seatedrow','pt_latpulldown','pt_pullup','pt_pushdown','pt_low_cable_curl','pt_legcurl','pt_adduction','pt_legextension','pt_legpress'];
  assert.deepEqual(await p.locator('.personal-exercises .ex').evaluateAll(es=>es.map(e=>e.dataset.open)),chosen);
  assert.deepEqual(await p.locator('.personal-exercise-group').evaluateAll(es=>es.map(e=>e.querySelectorAll('.ex').length)),[5,2,3,2,4]);
  assert.match(await p.locator('.personal-plan-note').innerText(),/코치와 협의 예정/);
  await p.locator('[data-cat="personal:chest"]').click();assert.equal(await p.locator('.personal-exercises .ex').count(),2);
  await p.locator('.personal-exercises [data-open="pt_chestpress"]').click();await p.locator('.d-title').waitFor();
  await p.locator('#history-back').click();await p.locator('.personal-exercises').waitFor();
  assert.equal(await p.locator('.personal-exercises .ex').count(),2);await p.reload();await p.locator('.personal-exercises').waitFor();
  assert.equal(await p.locator('.personal-exercises .ex').count(),2);
  await p.locator('.personal-all-link').click();await p.locator('.pt-exercise-grid').waitFor();
  assert.equal(await p.locator('.pt-exercise-grid .ex').count(),52);
  for(const theme of ['light','dark'])for(const width of [320,390,768]){
   await p.setViewportSize({width,height:844});await p.evaluate(t=>document.documentElement.setAttribute('data-theme',t),theme);
   await p.locator('.exercise-quicknav summary').click();
   assert(await p.locator('.exercise-quickpanel').isVisible());
   assert(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
   const panel=await p.locator('.exercise-quickpanel').boundingBox(),bar=await p.locator('.tabbar').boundingBox();
   assert(panel.y>=0&&panel.y+panel.height<=bar.y,'panel clears viewport and navigation');
   assert(await p.locator('.exercise-quicklinks a').evaluateAll(es=>es.every(e=>e.clientHeight>=42&&e.scrollWidth<=e.clientWidth)));
   await p.keyboard.press('Escape');assert.equal(await p.locator('.exercise-quicknav').getAttribute('open'),null);
   assert(await p.locator('.exercise-quicknav summary').evaluate(e=>e===document.activeElement));
  }
  await p.setViewportSize({width:390,height:844});
  for(const part of ['pt','ht']){
   await p.locator('.exercise-quicknav summary').click();
   await p.locator('.exercise-quickpanel a[href="#'+part+'?cat=all"]').click();await p.locator('.pt-exercise-grid').waitFor();
   const expected=await p.evaluate(part=>Store.getByPart(part).length,part);
   assert.equal(await p.locator('.pt-exercise-grid .ex').count(),expected);
   assert.equal(await p.locator('.chips .on').getAttribute('data-cat'),'all');
   const cats=await p.evaluate(part=>Store.getCategories(part),part);
   for(const cat of cats){
    await p.locator('.exercise-quicknav summary').click();
    await p.locator('.exercise-quickpanel a[href="#'+part+'?cat='+encodeURIComponent(cat)+'"]').click();
    assert.equal(await p.locator('.pt-exercise-grid .ex').count(),await p.evaluate(({part,cat})=>Store.getByPart(part).filter(e=>e.category===cat).length,{part,cat}));
   }
  }
  await p.locator('.exercise-quicknav summary').click();await p.locator('.hd h1').click();
  assert.equal(await p.locator('.exercise-quicknav').getAttribute('open'),null);
  await p.goto(base+'#exercise/pt_chestpress');await p.locator('.memo-edit').click();await p.locator('#memo-input').fill('운동 검색 이동 중 보존할 초안');
  await p.locator('.exercise-search').click();await p.locator('#search-input').waitFor();
  assert(await p.locator('#search-input').evaluate(e=>e===document.activeElement));
  await p.locator('#search-input').fill('체스트 프레스');await p.locator('.search-result').first().waitFor();
  await p.locator('.search-result[href="#exercise/pt_chestpress"]').click();await p.locator('.d-title').waitFor();
  assert.equal(await p.locator('#memo-input').inputValue(),'운동 검색 이동 중 보존할 초안');
  await p.locator('#history-back').click();await p.locator('#search-input').waitFor();assert.equal(await p.locator('#search-input').inputValue(),'체스트 프레스');
  await p.locator('#history-back').click();await p.locator('#memo-input').waitFor();assert.equal(await p.locator('#memo-input').inputValue(),'운동 검색 이동 중 보존할 초안');
  await p.evaluate(()=>{Store.upsert({id:'pt_chestpress',name:'내 체스트 프레스',memo:'보존할 개인 메모',favorite:true});Store.requestDeletion('pt_pecdeck');});
  const overlay=await p.evaluate(()=>localStorage.getItem('ptgolf_overlay_v1'));
  await p.goto(base+'#pt?cat=personal');await p.locator('.personal-exercises').waitFor();
  assert.equal(await p.locator('.personal-exercises .ex').count(),15,'hidden selection is not resurrected');
  assert.match(await p.locator('.personal-exercises [data-open=pt_chestpress]').innerText(),/내 체스트 프레스/);
  assert.equal(await p.locator('.personal-exercises [data-open=pt_chestpress] .star').count(),1);
  for(const theme of ['light','dark'])for(const width of [320,390,768]){
   await p.setViewportSize({width,height:844});await p.evaluate(t=>document.documentElement.setAttribute('data-theme',t),theme);
   assert(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
   assert.equal(await p.locator('.personal-exercise-group').count(),5);
  }
  assert.equal(await p.evaluate(()=>localStorage.getItem('ptgolf_overlay_v1')),overlay,'selection navigation never rewrites personal edits');
  await p.evaluate(()=>Store.restoreDeleted('pt_pecdeck'));await p.reload();await p.locator('.personal-exercises').waitFor();
  assert.equal(await p.locator('.personal-exercises .ex').count(),16);
  assert.deepEqual(errors,[]);
  console.log('PASS: global exercise access, all/category counts, search and history, draft preservation, keyboard/outside dismissal and responsive themes.');
 }finally{await context.close();}
};
