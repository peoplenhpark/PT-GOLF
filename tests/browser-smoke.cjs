const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),http=require('node:http');
const {chromium}=require('playwright');
const root=process.env.PTGOLF_SITE_DIR?path.resolve(process.env.PTGOLF_SITE_DIR):path.resolve(__dirname,'..');
const mime={'.html':'text/html','.js':'application/javascript','.json':'application/json','.css':'text/css','.webp':'image/webp','.png':'image/png','.svg':'image/svg+xml','.webmanifest':'application/manifest+json'};
(async()=>{
 const server=http.createServer((req,res)=>{const url=new URL(req.url,'http://localhost');let file=path.resolve(root,'.'+decodeURIComponent(url.pathname));if(!file.startsWith(root+path.sep)&&file!==root){res.writeHead(403).end();return;}if(fs.existsSync(file)&&fs.statSync(file).isDirectory())file=path.join(file,'index.html');if(!fs.existsSync(file)){res.writeHead(404).end();return;}res.setHeader('Content-Type',mime[path.extname(file)]||'application/octet-stream');res.setHeader('Cache-Control','no-store');res.end(fs.readFileSync(file));});
 await new Promise(r=>server.listen(0,'127.0.0.1',r));
 const base='http://127.0.0.1:'+server.address().port+'/';
 const launch={headless:true};if(process.env.PTGOLF_BROWSER_PATH)launch.executablePath=process.env.PTGOLF_BROWSER_PATH;
 const browser=await chromium.launch(launch),context=await browser.newContext({viewport:{width:390,height:844},serviceWorkers:'allow'}),page=await context.newPage();
 await page.addInitScript(()=>{window.__openedDeletionUrls=[];window.open=url=>{window.__openedDeletionUrls.push(String(url));return {};};});
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 try{
  await page.goto(base);await page.locator('.part.pt').waitFor();
  await page.locator('[data-nav=pt]').click();assert.match(page.url(),/#pt/);
  await page.reload();await page.locator('.pt-exercise-grid').waitFor();assert.equal(await page.locator('[data-delete-ex]').count(),0,'exercise lists do not show delete actions');
  const firstId=await page.locator('.ex').first().getAttribute('data-open');
  await page.locator('.ex').first().click();await page.locator('.d-title').waitFor();assert.match(page.url(),/#exercise/);assert.equal(await page.locator('[data-act=delete]').count(),1,'exercise detail has one delete action');
  await page.locator('#history-back').click();await page.locator('.pt-exercise-grid').waitFor();await page.reload();await page.locator('.pt-exercise-grid').waitFor();
  assert.equal(await page.locator('#history-forward').isEnabled(),true);
  await page.locator('#history-forward').click();await page.locator('.d-title').waitFor();
  await page.locator('.memo-edit').click();await page.locator('#memo-input').fill('회귀 검사 개인 메모');
  await page.reload();await page.locator('#memo-input').waitFor();assert.equal(await page.locator('#memo-input').inputValue(),'회귀 검사 개인 메모');
  await page.locator('#memo-save').click();await page.locator('.memo-box').waitFor();assert.match(await page.locator('.memo-box').textContent(),/회귀 검사/);
  const saved=await page.evaluate(id=>JSON.parse(localStorage.getItem('ptgolf_overlay_v1')).overrides[id],firstId);
  assert.equal(saved.memo,'회귀 검사 개인 메모');assert.equal(saved.name,undefined);
  await page.locator('[data-act=edit]').click();await page.locator('#modal:not(.hidden)').waitFor();
  assert.equal(await page.locator('#modal').getAttribute('role'),'dialog');
  assert.equal(await page.locator('#app').evaluate(el=>el.inert),true);
  await page.locator('#f-spec').fill('수정 초안');await page.keyboard.press('Escape');await page.locator('[data-act=edit]').click();assert.equal(await page.locator('#f-spec').inputValue(),'수정 초안');await page.keyboard.press('Escape');
  assert.equal(await page.locator('.fab').count(),0,'floating add button is intentionally removed');
  await page.locator('[data-act=delete]').click();await page.locator('#confirm:not(.hidden)').waitFor();assert.equal(await page.locator('.d-title').count(),1,'exercise remains visible until confirmation');
  await page.locator('[data-act=confirm-yes]').click();await page.locator('.pt-exercise-grid').waitFor();assert.equal(await page.locator(`[data-open="${firstId}"]`).count(),0,'confirmed exercise is hidden on this device');
  const exerciseDeletion=await page.evaluate(()=>({queue:localStorage.getItem('ptgolf_deletion_requests_v1'),url:window.__openedDeletionUrls.at(-1)}));
  assert(exerciseDeletion.queue.includes(firstId));assert(!exerciseDeletion.queue.includes('회귀 검사 개인 메모'),'private exercise memo must not enter deletion queue');
  {const issue=new URL(exerciseDeletion.url);assert.equal(issue.searchParams.get('template'),'content-removal.md');assert.equal(issue.searchParams.get('labels'),'deletion-request');assert.match(issue.searchParams.get('body'),/<!-- pt-golf-deletion-request:v1 -->/);assert.match(issue.searchParams.get('body'),/<!-- \/pt-golf-deletion-request -->/);assert.match(issue.searchParams.get('body'),new RegExp('content-id: '+firstId));assert(!issue.searchParams.get('body').includes('회귀 검사 개인 메모'));}
  await page.locator('.tab[data-nav=home]').click();await page.locator('.deletion-queue').waitFor();assert.match(await page.locator('.deletion-queue').textContent(),/삭제만을 위한 새 버전은 만들지 않/);
  await page.locator(`[data-delete-restore="del_exercise_${firstId}"]`).click();assert.equal(await page.locator('.deletion-queue').count(),0);
  await page.locator('[data-nav=pt]').click();await page.locator(`[data-open="${firstId}"]`).waitFor();
  await page.goto(base+'#exercise/pt_latpulldown');await page.locator('.grip-guide').waitFor();
  assert.equal(await page.locator('.grip-card').count(),3,'lat pulldown shows three width cards');
  assert.equal(await page.locator('.grip-card.is-session').count(),1,'current PT grip is distinguished');
  assert.equal(await page.locator('.grip-orientation-item').count(),2,'neutral and underhand notes are shown');
  assert.match(await page.locator('.grip-guide').textContent(),/모든 위치에서 광배근이 주동근/);
  assert.match(await page.locator('.exercise-guide .g-meta').textContent(),/기본 오버그립 자세 예시/);
  await page.locator('.memo-edit').click();await page.locator('#memo-input').fill('회귀 검사 개인 메모 · 랫풀다운 그립 메모');
  await page.locator('#memo-save').click();await page.reload();await page.locator('.grip-guide').waitFor();
  assert.match(await page.locator('.memo-box').textContent(),/랫풀다운 그립 메모/);
  await page.goto(base);await page.locator('[data-act=search-focus]').click();await page.locator('#search-input').fill('중립그립');
  await page.locator('.search-result').first().waitFor();assert.match(await page.locator('.search-result').first().getAttribute('href'),/pt_latpulldown/);
  assert.match(await page.locator('.search-result').first().textContent(),/손 위치/);
  await page.locator('#search-input').fill('회귀 검사');
  await page.locator('.search-result').first().waitFor();await page.reload();await page.locator('#search-input').waitFor();assert.equal(await page.locator('#search-input').inputValue(),'회귀 검사');
  await page.locator('.search-result').first().click();await page.locator('.d-title').waitFor();await page.locator('#history-back').click();await page.locator('#search-input').waitFor();assert.equal(await page.locator('#search-input').inputValue(),'회귀 검사');
  await page.locator('[data-nav=golf]').click();await page.locator('.g-lesson-anchor').waitFor();assert.match(page.url(),/#golf\/lessons/);await page.locator('.g-tabs a[href="#golf/videos"]').click();await page.locator('.g-video-grid').first().waitFor();
  assert((await page.locator('.g-mini-takeaway').count())>0,'golf list shows practical takeaways');
  assert.equal(await page.locator('.g-mini-takeaway').first().evaluate(el=>!!el.textContent.trim()),true);
  assert.match(await page.locator('.g-recent-section').textContent(),/앱 등록일 기준/);
  assert.match(await page.locator('.g-mini-date').first().textContent(),/등록/);
  const registeredRecent=await page.evaluate(()=>window.GolfContent.recentVideos(Date.parse('2026-09-30T16:00:00+09:00')).map(v=>v.id));
  assert.deepEqual(registeredRecent.slice(0,2),['ldkU0D_Ylms','M-ryH3IhUXI'],'same-time registrations keep source order');
  assert(registeredRecent.includes('t_9sQjrS2o4'),'older YouTube video is recent by app registration');
  assert.equal(await page.locator('.g-mini-detail').first().getAttribute('aria-label'),null,'takeaway remains in the link accessible text after duplicate badges are removed');
  await page.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));await page.evaluate(()=>window.scrollTo(0,600));await page.reload();await page.locator('.g-video-grid').first().waitFor();await page.waitForFunction(()=>Math.abs(window.scrollY-600)<10);
  const group=page.locator('.g-video-groups a[href*="/group/"]').first();await group.click();await page.locator('.g-video-groups a[href="#golf/videos"]').click();assert.equal(new URL(page.url()).hash,'#golf/videos');
  assert.equal(await page.locator('.g-video-card .g-delete-video').count(),0,'video lists do not show delete actions');
  await page.locator('a[href="#golf/videos/cQiwXcbWZc4"]').first().click();await page.locator('[data-g-form=video]').waitFor();
  await page.goto(base+'#golf');await page.locator('.g-lesson-anchor').waitFor();
  assert.equal(await page.locator('.g-tabs a').count(),4);
  await page.locator('.g-tabs a[href="#golf/notes"]').click();
  await page.locator('.g-sensation-dates a[href="#golf/notes/0930"]').click();assert.match(await page.locator('.g-original').textContent(),/수지 낙하중요/);
  await page.locator('.g-sensation-dates a[href="#golf/notes/1001"]').click();await page.locator('[data-practice=adopt]').click();
  assert.match(await page.locator('.g-practice-hero h2').textContent(),/밟고, 버티고, 톡/);
  await page.locator('.g-practice-entry>summary').click();
  await page.locator('#g-practice-club').selectOption('7번 아이언');await page.locator('#g-practice-contact').fill('3');await page.locator('#g-practice-direction').fill('4');await page.locator('#g-practice-distance').selectOption('대체로 적정');await page.locator('#g-practice-feel').selectOption('비슷함');
  await page.reload();await page.locator('.g-practice-entry').waitFor();assert.equal(await page.locator('#g-practice-contact').inputValue(),'3','practice draft survives reload');
  const beforePractice=await page.evaluate(()=>JSON.parse(localStorage.getItem('ptgolf_learning_v1')));
  await page.evaluate(()=>{window.__oldStorageSet=Storage.prototype.setItem;Storage.prototype.setItem=function(k,v){if(k==='ptgolf_learning_v1')throw new DOMException('Test quota','QuotaExceededError');return window.__oldStorageSet.call(this,k,v);};});
  await page.getByRole('button',{name:'5구 결과 저장',exact:true}).click();assert.equal(await page.locator('#g-practice-contact').inputValue(),'3','failed save retains input');
  assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem('ptgolf_learning_v1')).practiceRecords?.length||0),0);
  await page.evaluate(()=>{Storage.prototype.setItem=window.__oldStorageSet;delete window.__oldStorageSet;});
  await page.getByRole('button',{name:'5구 결과 저장',exact:true}).click();await page.locator('.g-practice-result').waitFor();
  await page.reload();await page.locator('.g-practice-result').waitFor();assert.match(await page.locator('.g-practice-result').textContent(),/중심 타점 3\/5/);
  const afterPractice=await page.evaluate(()=>JSON.parse(localStorage.getItem('ptgolf_learning_v1')));
  assert.equal(afterPractice.practiceRecords.length,1);for(const k of ['lessons','questions','focus','videoNotes'])assert.deepEqual(afterPractice[k],beforePractice[k],k+' preserved by practice save');
  assert.equal(await page.locator('#g-practice-method').inputValue(),'cue');
  await page.goto(base+'#golf/videos');await page.locator('.g-frame').first().waitFor();
  assert(await page.locator('.g-video-card').evaluateAll(cards=>cards.every(c=>c.querySelectorAll('.g-frame img').length===2)));
  const frameUrls=await page.locator('.g-frame img').evaluateAll(images=>[...new Set(images.map(im=>im.src))]);assert.equal(frameUrls.length,138);
  for(const url of frameUrls){const r=await page.request.get(url);assert(r.ok(),url+' must ship in built site');}
  // A tagged video keeps one memo/status across group, tag and lesson views.
  const beforeBackswing=await page.evaluate(()=>JSON.parse(localStorage.getItem('ptgolf_learning_v1')));
  await page.goto(base+'#golf/group/backswing-top');await page.locator('#g-group-backswing-top').waitFor();
  assert.equal(await page.locator('.g-video-mini').count(),10);
  assert.deepEqual(await page.locator('.g-mini-detail').evaluateAll(es=>es.slice(0,4).map(e=>e.getAttribute('href').split('/').at(-1))),['aaOw2sdp-io','WWtv4x3uz-M','7sNhk9PhBxc','ojzyFHAQWnw']);
  await page.locator('.g-video-section>.g-tags a').filter({hasText:'백스윙 시 몸통 회전'}).click();
  await page.getByRole('heading',{name:'백스윙 시 몸통 회전',exact:true}).waitFor();assert.equal(await page.locator('.g-video-mini').count(),7);
  await page.goto(base+'#golf/videos/QLJDoGT7-2U');await page.locator('#g-video-status').waitFor();assert.equal(await page.locator('#g-video-status').inputValue(),'참고 중');
  await page.locator('#g-video-status').selectOption('프로에게 질문');await page.locator('#g-video-memo').fill('검증: 편안함은 좋음, 타점 4/5. 오른팔 위치 질문');await page.locator('[data-g-form=video] button').click();
  await page.reload();await page.locator('#g-video-status').waitFor();assert.equal(await page.locator('#g-video-status').inputValue(),'프로에게 질문');assert.match(await page.locator('#g-video-memo').inputValue(),/타점 4\/5/);
  await page.goto(base+'#golf/topic/'+encodeURIComponent('백스윙 시 오른팔 위치'));await page.locator('.g-video-mini').first().waitFor();assert.equal(await page.locator('.g-video-mini').count(),6);assert.match(await page.locator('.g-review-memo').textContent(),/타점 4\/5/);
  await page.goto(base+'#golf/lessons/lesson_20261005_first');await page.locator('.g-lesson-videos').waitFor();assert.equal(await page.locator('.g-lesson-videos>.g-video-grid>.g-video-mini').count(),9);assert.match(await page.locator('.g-lesson-videos').innerText(),/프로에게 질문/);
  const afterBackswing=await page.evaluate(()=>JSON.parse(localStorage.getItem('ptgolf_learning_v1')));for(const key of ['lessons','questions','focus','practiceRecords'])assert.deepEqual(afterBackswing[key],beforeBackswing[key]);for(const [id,note]of Object.entries(beforeBackswing.videoNotes))assert.deepEqual(afterBackswing.videoNotes[id],note);
  for(const width of [320,390,768])for(const hash of ['#golf/group/backswing-top','#golf/topic/'+encodeURIComponent('백스윙 시 몸통 회전'),'#golf/videos/DOf7sAtTJYw','#golf/today','#golf/notes/1004','#golf/lessons','#golf/videos']){
    await page.setViewportSize({width,height:844});await page.goto(base+hash);await page.locator('.g-tabs').waitFor();assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),width+' '+hash);
  }
  await page.setViewportSize({width:390,height:844});

  await page.goto(base+'#golf/videos/cQiwXcbWZc4');await page.locator('[data-g-form=video]').waitFor();
  await page.goto(base+'#golf/lessons');await page.locator('.g-lesson-anchor').waitFor();
  await page.locator('.g-lesson-anchor [data-practice=lesson]').click();await page.locator('.g-practice-entry').waitFor();
  assert.match(await page.locator('.g-practice-hero h2').textContent(),/오른팔 힘 빼고, 몸통으로 넓게/);
  await page.locator('.g-practice-entry>summary').click();
  assert.deepEqual(await page.locator('#g-practice-club option').allTextContents(),['선택하세요','7번 아이언']);
  assert.equal(await page.locator('#g-practice-method').inputValue(),'cue');
  await page.locator('#g-practice-contact').fill('4');await page.locator('#g-practice-direction').fill('4');await page.locator('#g-practice-distance').selectOption('미확인');await page.locator('#g-practice-feel').selectOption('평소보다 좋음');await page.locator('#g-practice-comfort').selectOption('편안함');
  await page.getByRole('button',{name:'5구 결과 저장',exact:true}).click();await page.reload();await page.locator('.g-practice-result').first().waitFor();
  const lessonRecords=await page.evaluate(()=>JSON.parse(localStorage.getItem('ptgolf_learning_v1')).practiceRecords);
  assert.equal(lessonRecords.length,2);assert.deepEqual(lessonRecords[0],afterPractice.practiceRecords[0]);assert.equal(lessonRecords[1].lessonId,'lesson_20261005_first');assert.equal(lessonRecords[1].comfort,'편안함');
  await page.goto(base+'#golf/lessons/lesson_20261005_first');await page.locator('.g-lesson-evidence').waitFor();assert.match(await page.locator('.g-hub').innerText(),/연결된 기록 1묶음 · 5구/);
  assert.match(await page.locator('.g-hub').innerText(),/추천하거나 함께 본 영상으로 확인된 것은 아닙니다/);
  await page.goto(base+'#golf/notes/1004');await page.locator('.g-lesson-bridge').waitFor();assert.match(await page.locator('.g-original').textContent(),/양 어깨는 거의 고정/);assert.match(await page.locator('.g-lesson-bridge').textContent(),/잠시 보류/);
  await page.goto(base+'#golf/lessons');await page.locator('[data-g=lesson-new]').click();await page.locator('[data-g-form=lesson]').waitFor();
  await page.locator('#g-date').fill('2026-10-12');await page.locator('#g-title').fill('검증용 두 번째 레슨');await page.locator('input[name=noteIds][value=golf_iron7]').check();await page.locator('#g-correction').fill('검증용 교정');await page.locator('#g-practiceCue').fill('검증용 다음 연습');await page.getByRole('button',{name:'레슨 저장',exact:true}).click();await page.locator('.g-title').waitFor();
  await page.goto(base+'#golf/today');await page.locator('.g-practice-hero').waitFor();assert.match(await page.locator('.g-practice-hero h2').textContent(),/검증용 다음 연습/);

  await page.goto(base+'#golf/videos/cQiwXcbWZc4');await page.locator('[data-g-form=video]').waitFor();
  const originalGolfTitle=await page.locator('.g-title').textContent();
  await page.locator('[data-g=favorite-video]').click();assert.equal(await page.locator('[data-g=favorite-video]').getAttribute('aria-pressed'),'true');
  await page.locator('[data-g=video-edit]').click();await page.locator('[data-g-form=video-edit]').waitFor();
  await page.getByLabel('영상 이름').fill('브라우저 검사 영상 이름');await page.locator('[data-g-form=video-edit] .g-primary').click();await page.locator('[data-g-form=video]').waitFor();
  assert.equal((await page.locator('.g-title').textContent()).trim(),'브라우저 검사 영상 이름');
  await page.locator('[data-g=video-edit]').click();await page.locator('[data-g=video-reset]').click();await page.locator('[data-g-form=video]').waitFor();
  assert.equal((await page.locator('.g-title').textContent()).trim(),originalGolfTitle.trim());assert.equal(await page.locator('[data-g=favorite-video]').getAttribute('aria-pressed'),'true');
  await page.goto(base+'#golf/video-favorites');await page.getByRole('heading',{name:/즐겨찾기/}).waitFor();assert.equal(await page.locator('a[href="#golf/videos/cQiwXcbWZc4"]').count(),1);
  await page.goto(base+'#golf/videos/cQiwXcbWZc4');await page.locator('[data-g-form=video]').waitFor();
  assert.equal(await page.locator('.g-practical-summary dl>div').count(),3,'video detail shows three practical summary rows');
  assert.match(await page.locator('.g-practical-summary').textContent(),/원본에서 볼 것/);
  assert.match(await page.locator('.g-practical-caution').textContent(),/제목·채널·길이/);
  await page.locator('[data-g=ask]').click();assert.match(await page.getByLabel('확인하고 싶은 내용').inputValue(),/레슨에서 먼저 확인/);
  await page.goto(base+'#golf/videos/cQiwXcbWZc4');await page.locator('[data-g-form=video]').waitFor();
  await page.locator('[data-g-form=video] textarea').fill('골프 영상 초안');
  await page.reload();await page.locator('[data-g-form=video]').waitFor();assert.equal(await page.locator('[data-g-form=video] textarea').inputValue(),'골프 영상 초안');
  await page.locator('[data-g-form=video] button').click();assert.match(await page.locator('[data-draft-status]').first().textContent(),/저장/);
  assert.equal(await page.locator('.g-delete-video[data-id="cQiwXcbWZc4"]').count(),1,'video detail has one delete action');await page.locator('.g-delete-video[data-id="cQiwXcbWZc4"]').click();await page.locator('#confirm:not(.hidden)').waitFor();assert.equal(await page.locator('[data-g-form=video]').count(),1,'video remains visible until confirmation');
  await page.locator('[data-act=confirm-yes]').click();await page.getByRole('heading',{name:'이 기기에서 삭제 요청한 영상입니다'}).waitFor();
  const videoDeletion=await page.evaluate(()=>({queue:localStorage.getItem('ptgolf_deletion_requests_v1'),url:window.__openedDeletionUrls.at(-1)}));
  assert(videoDeletion.queue.includes('cQiwXcbWZc4'));assert(!videoDeletion.queue.includes('골프 영상 초안'),'private video memo must not enter deletion queue');
  {const issue=new URL(videoDeletion.url);assert.match(issue.searchParams.get('body'),/content-kind: video/);assert.match(issue.searchParams.get('body'),/content-id: cQiwXcbWZc4/);assert(!issue.searchParams.get('body').includes('골프 영상 초안'));}
  await page.locator('[data-g=restore-video]').first().click();await page.locator('[data-g-form=video]').waitFor();assert.equal(await page.locator('[data-g-form=video] textarea').inputValue(),'골프 영상 초안','restoring a video preserves its memo');
  await page.goto(base+'#golf/notes');assert.equal(await page.locator('.g-note-summary').count(),4);await page.locator('[data-open]').first().click();await page.locator('.personal-note-label').waitFor();assert.match(await page.locator('.personal-note-label').textContent(),/개인 연습 감각/);
  for(const width of [320,390,768]){
   await page.setViewportSize({width,height:844});await page.goto(base+'#golf/videos');await page.locator('.g-video-grid').first().waitFor();
   assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true,'no golf overflow at '+width);
   const gridColumns=await page.locator('.g-video-grid').evaluateAll(items=>items.map(el=>({width:el.getBoundingClientRect().width,columns:getComputedStyle(el).gridTemplateColumns.trim().split(/\s+/).length})));
   for(const grid of gridColumns)assert.equal(grid.columns,grid.width>=500?3:2,'parallel golf cards at '+width);
   assert.equal(await page.locator('.g-mini-takeaway').evaluateAll(items=>items.every(item=>item.scrollHeight<=item.clientHeight+1)),true,'golf takeaways are not clipped at '+width);
   if(process.env.PTGOLF_SCREENSHOT_DIR){fs.mkdirSync(process.env.PTGOLF_SCREENSHOT_DIR,{recursive:true});await page.screenshot({path:path.join(process.env.PTGOLF_SCREENSHOT_DIR,'golf-'+width+'.png'),fullPage:false});}
   await page.goto(base+'#exercise/pt_latpulldown');await page.locator('.grip-guide').waitFor();assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true,'no lat grip overflow at '+width);if(process.env.PTGOLF_SCREENSHOT_DIR)await page.screenshot({path:path.join(process.env.PTGOLF_SCREENSHOT_DIR,'lat-grip-'+width+'.png'),fullPage:true});
  }
  await page.goto(base+'#exercise/'+firstId);await page.locator('[data-offline]').waitFor();
  await page.evaluate(async()=>{await navigator.serviceWorker.ready;});
  if(!await page.evaluate(()=>!!navigator.serviceWorker.controller)){await page.reload();await page.locator('[data-offline]').waitFor();}
  await page.locator('[data-offline]').click();await page.locator('[data-offline-status]').filter({hasText:'오프라인 준비됨'}).waitFor({timeout:60000});
  await context.setOffline(true);await page.reload();await page.locator('.d-title').waitFor();assert.equal(await page.locator('.guide-shot img').evaluateAll(imgs=>imgs.every(i=>i.complete&&i.naturalWidth>0)),true);
  await page.locator('.exercise-3d summary').click();await page.locator('.exercise-3d-frame').waitFor();await page.frameLocator('.exercise-3d-frame').locator('canvas').waitFor({timeout:20000});
  await context.setOffline(false);

  // HT uses the existing exercise storage and links to PT without cloning its records.
  const htId='ht_bulgarian_split_squat';
  await page.goto(base+'#home');await page.locator('.part.ht').waitFor();await page.locator('.part.ht').click();
  assert.match(page.url(),/#ht/);await page.reload();await page.locator('[data-open="'+htId+'"]').click();
  await page.locator('.training-video').first().waitFor();assert.equal(await page.locator('.training-video iframe').count(),0,'video loads only on request');
  assert.equal(await page.locator('.training-video a').first().getAttribute('href'),'https://www.youtube.com/shorts/xJXXLBGYO3c');
  await page.locator('[data-act=fav]').click();await page.locator('[data-act=memo-edit]').first().click();
  await page.locator('#memo-input').fill('HT 브라우저 개인 메모');await page.locator('#memo-save').click();
  await page.locator('[data-act=edit]').click();assert.equal(await page.locator('#f-part').inputValue(),'ht');
  await page.locator('#f-name').fill('내 불가리안 스쿼트');await page.locator('[data-act=modal-save]').click();
  await page.reload();await page.locator('.training-video').first().waitFor();assert.equal(await page.locator('.d-title').textContent(),'내 불가리안 스쿼트');
  assert.equal(await page.locator('.memo-box').textContent(),'HT 브라우저 개인 메모');assert.equal(await page.locator('.fav.on').count(),1);
  await page.locator('.training-related [data-open=pt_squat]').click();await page.locator('.training-related [data-open="'+htId+'"]').click();
  assert.match(page.url(),new RegExp('#exercise/'+htId));await page.locator('[data-nav=favorites]').click();await page.locator('[data-open="'+htId+'"]').click();
  await page.goto(base+'#search?q='+encodeURIComponent('불가리안')+'&scope=ht');await page.locator('.search-result[href="#exercise/ht_bulgarian_split_squat"]').waitFor();assert.equal(await page.locator('.search-result[href="#exercise/ht_bulgarian_split_squat"]').count(),1);
  await page.locator('.search-result[href="#exercise/ht_bulgarian_split_squat"]').click();await page.locator('[data-act=delete]').click();await page.locator('[data-act=confirm-no]').click();assert.equal(await page.locator('.training-video').count(),2);
  await page.locator('[data-act=delete]').click();await page.locator('[data-act=confirm-yes]').click();await page.locator('[data-part=ht]').waitFor();assert.equal(await page.locator('[data-open="'+htId+'"]').count(),0);
  await page.goto(base+'#exercise/pt_squat');await page.locator('.d-title').waitFor();assert.equal(await page.locator('.training-related [data-open="'+htId+'"]').count(),0);
  await page.goto(base+'#home');await page.locator('[data-delete-restore="del_exercise_'+htId+'"]').click();
  await page.goto(base+'#exercise/'+htId);await page.locator('.training-video').first().waitFor();assert.equal(await page.locator('.memo-box').textContent(),'HT 브라우저 개인 메모');

  // HT preparation/action illustrations and its dedicated rear-foot-elevated 3D.
  await page.waitForFunction(()=>[...document.querySelectorAll('.guide-shot img')].length===2&&[...document.querySelectorAll('.guide-shot img')].every(i=>i.complete&&i.naturalWidth>0));
  await page.locator('.exercise-3d summary').click();
  const htFrame=page.frameLocator('.exercise-3d-frame');await htFrame.locator('canvas[data-ready]').waitFor();
  assert.equal(await htFrame.locator('canvas').getAttribute('data-kind'),'bulgariansplit');assert.equal(await htFrame.locator('#speed').inputValue(),'.5');
  assert.equal(await htFrame.locator('#play').innerText(),'일시정지');
  await htFrame.locator('#progress').fill('500');await htFrame.locator('#progress').dispatchEvent('input');assert.equal(await htFrame.locator('#play').innerText(),'재생');
  const htModel=await htFrame.locator('canvas').evaluate(()=>window.exerciseViewer.snapshot());assert.equal(htModel.pose.equipment[0].type,'splitbench');assert(htModel.pose.hip[1]<.6);
  await htFrame.getByRole('button',{name:'옆',exact:true}).click();assert(Math.abs(Number(await htFrame.locator('canvas').getAttribute('data-yaw'))-Math.PI/2)<.002);
  await htFrame.locator('canvas').press('ArrowLeft');assert(Number(await htFrame.locator('canvas').getAttribute('data-yaw'))>Math.PI/2+.1);
  const oldDistance=Number(await htFrame.locator('canvas').getAttribute('data-distance'));await htFrame.locator('canvas').press('+');assert(Number(await htFrame.locator('canvas').getAttribute('data-distance'))<oldDistance);
  await htFrame.getByRole('button',{name:'처음 시점',exact:true}).click();
  for(const width of [320,390,768]){
    await page.setViewportSize({width,height:844});await htFrame.locator('canvas').scrollIntoViewIfNeeded();
    assert.equal(await htFrame.locator('body').evaluate(el=>el.scrollWidth<=innerWidth),true,'HT 3D controls fit at '+width);
    if(process.env.PTGOLF_SCREENSHOT_DIR)await htFrame.locator('#viewport').screenshot({path:path.join(process.env.PTGOLF_SCREENSHOT_DIR,'ht-3d-'+width+'.png')});
  }
  await page.locator('.exercise-3d summary').click();await page.locator('.exercise-3d-frame').waitFor({state:'detached'});
  await page.locator('[data-offline]').click();await page.locator('[data-offline-status]').filter({hasText:'오프라인 준비됨'}).waitFor({timeout:60000});
  // Fulfill only the third-party embed in this isolated test; the original was separately checked.
  await page.route('https://www.youtube-nocookie.com/**',r=>r.fulfill({contentType:'text/html',body:'<!doctype html><title>Video embed test</title>'}));
  await page.locator('[data-act=training-play]').first().click();assert.match(await page.locator('.training-player iframe').getAttribute('src'),/embed\/xJXXLBGYO3c\?autoplay=1/);
  await page.locator('#toast').waitFor({state:'hidden'});
  for(const width of [320,390,768]){
    await page.setViewportSize({width,height:844});
    for(const route of ['#home','#ht','#exercise/'+htId,'#exercise/pt_squat']){
      await page.goto(base+route);await page.locator('.scr').waitFor();
      assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true,'no HT overflow '+route+' at '+width);
      assert.equal(await page.locator('.tabbar .tab').evaluateAll(els=>els.every(el=>el.scrollWidth<=el.clientWidth+1)),true,'navigation labels fit at '+width);
      if(process.env.PTGOLF_SCREENSHOT_DIR && route!=='#exercise/pt_squat')await page.screenshot({path:path.join(process.env.PTGOLF_SCREENSHOT_DIR,'ht-'+route.replace(/[^a-z0-9]/gi,'_')+'-'+width+'.png'),fullPage:true});
    }
  }
  await context.setOffline(true);await page.goto(base+'#ht');await page.locator('[data-open="'+htId+'"]').click();await page.locator('.training-video').first().waitFor();
  assert.equal(await page.locator('.memo-box').textContent(),'HT 브라우저 개인 메모');
  await page.waitForFunction(()=>[...document.querySelectorAll('.guide-shot img')].every(i=>i.complete&&i.naturalWidth>0));
  await page.locator('.exercise-3d summary').click();await page.frameLocator('.exercise-3d-frame').locator('canvas[data-ready]').waitFor();
  assert.equal(await page.frameLocator('.exercise-3d-frame').locator('canvas').getAttribute('data-kind'),'bulgariansplit');await context.setOffline(false);
  // A source video can contain multiple movements. Switching must preserve memo drafts,
  // replace the old iframe and include every variant in the parent offline bundle.
  const collection='ht_upper_form',variants=[['ht_upper_lateral','htlateral'],['ht_upper_onearmrow','onearmrow'],['ht_upper_preacher','preachercurl'],['ht_upper_latpull','htlatpull'],['ht_upper_lyingextension','lyingextension'],['ht_upper_facepull','facepull']];
  for(const exerciseId of ['ht_wide_dumbbell',collection]){
    await page.goto(base+'#exercise/'+exerciseId);await page.locator('.training-video').first().waitFor();
    await page.locator('[data-offline]').click();await page.locator('[data-offline-status]').filter({hasText:'오프라인 준비됨'}).waitFor({timeout:60000});
  }
  await page.locator('[data-act=memo-edit]').first().click();await page.locator('#memo-input').fill('동작 선택 중 작성한 메모');
  for(const [variant,kind] of variants){
    await page.locator('#training-movement').selectOption(variant);
    assert.equal(await page.locator('#memo-input').inputValue(),'동작 선택 중 작성한 메모');
    assert.equal(await page.locator('.exercise-3d-frame').count(),0);
    await page.waitForFunction(()=>[...document.querySelectorAll('.guide-shot img')].length===2&&[...document.querySelectorAll('.guide-shot img')].every(i=>i.complete&&i.naturalWidth===700));
    await page.locator('.exercise-3d summary').click();
    const frame=page.frameLocator('.exercise-3d-frame');await frame.locator('canvas[data-ready]').waitFor();
    assert.equal(await frame.locator('canvas').getAttribute('data-kind'),kind);assert.equal(await frame.locator('#speed').inputValue(),'.5');
    await frame.locator('#progress').fill('500');await frame.locator('#progress').dispatchEvent('input');
    assert.equal(await frame.locator('#play').innerText(),'재생');
    await frame.locator('canvas').press('ArrowLeft');await frame.locator('canvas').press('+');
    for(const width of [320,390,768]){
      await page.setViewportSize({width,height:844});assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
      assert(await frame.locator('body').evaluate(e=>e.scrollWidth<=innerWidth));
    }
    if(process.env.PTGOLF_SCREENSHOT_DIR){
      await frame.locator('#viewport').screenshot({path:path.join(process.env.PTGOLF_SCREENSHOT_DIR,variant+'-3d.png')});
      await page.screenshot({path:path.join(process.env.PTGOLF_SCREENSHOT_DIR,variant+'-detail.png'),fullPage:true});
    }
  }
  await page.locator('#memo-save').click();
  await context.setOffline(true);await page.reload();await page.locator('#training-movement').waitFor();
  assert.equal(await page.locator('.memo-box').textContent(),'동작 선택 중 작성한 메모');
  for(const [variant,kind] of variants){
    await page.locator('#training-movement').selectOption(variant);
    await page.waitForFunction(()=>[...document.querySelectorAll('.guide-shot img')].every(i=>i.complete&&i.naturalWidth>0));
    await page.locator('.exercise-3d summary').click();const frame=page.frameLocator('.exercise-3d-frame');await frame.locator('canvas[data-ready]').waitFor();
    assert.equal(await frame.locator('canvas').getAttribute('data-kind'),kind);
  }
  await page.goto(base+'#exercise/ht_wide_dumbbell');await page.locator('.training-video').first().waitFor();
  await page.waitForFunction(()=>[...document.querySelectorAll('.guide-shot img')].every(i=>i.complete&&i.naturalWidth===700));
  await page.locator('.exercise-3d summary').click();const lowerFrame=page.frameLocator('.exercise-3d-frame');await lowerFrame.locator('canvas[data-ready]').waitFor();
  assert.equal(await lowerFrame.locator('canvas').getAttribute('data-kind'),'sumodumbbell');
  await lowerFrame.locator('#progress').fill('500');await lowerFrame.locator('#progress').dispatchEvent('input');
  if(process.env.PTGOLF_SCREENSHOT_DIR)await lowerFrame.locator('#viewport').screenshot({path:path.join(process.env.PTGOLF_SCREENSHOT_DIR,'ht_wide_dumbbell-3d.png')});
  await context.setOffline(false);
  // New supplemental video plays in its own card, and all six lower-body variants work offline.
  await page.goto(base+'#exercise/ht_bulgarian_split_squat');await page.locator('.training-video').first().waitFor();
  assert.equal(await page.locator('.training-video').count(),2);
  await page.route('https://www.youtube-nocookie.com/**',r=>r.fulfill({contentType:'text/html',body:'<!doctype html><title>isolated player</title>'}));
  await page.locator('[data-video="8dN-DGm3hhg"]').click();
  assert.match(await page.locator('.training-video').nth(1).locator('iframe').getAttribute('src'),/embed\/8dN-DGm3hhg\?autoplay=1/);
  assert.equal(await page.locator('.training-video').first().locator('iframe').count(),0);
  assert.equal(await page.locator('.memo-box').textContent(),'HT 브라우저 개인 메모');
  await page.goto(base+'#exercise/ht_lower_six');await page.locator('#training-movement').waitFor();
  await page.locator('[data-offline]').click();await page.locator('[data-offline-status]').filter({hasText:'오프라인 준비됨'}).waitFor({timeout:60000});
  await page.locator('[data-act=memo-edit]').first().click();await page.locator('#memo-input').fill('하체 선택 중 메모 보존');
  const lowerVariants=[['curl','legcurl'],['wide','htwidegoblet'],['narrow','htnarrowgoblet'],['split','htfloorsplit'],['stiff','htstiffdeadlift'],['extension','htlegextension']];
  for(const [short,kind] of lowerVariants){
   await page.locator('#training-movement').selectOption('ht_lower_'+short);
   assert.equal(await page.locator('#memo-input').inputValue(),'하체 선택 중 메모 보존');
   await page.waitForFunction(()=>[...document.querySelectorAll('.guide-shot img')].length===2&&[...document.querySelectorAll('.guide-shot img')].every(i=>i.complete&&i.naturalWidth>0));
   await page.locator('.exercise-3d summary').click();const f=page.frameLocator('.exercise-3d-frame');await f.locator('canvas[data-ready]').waitFor();
   assert.equal(await f.locator('canvas').getAttribute('data-kind'),kind);assert.equal(await f.locator('#speed').inputValue(),'.5');
   const phase=await f.locator('canvas').getAttribute('data-phase');await page.waitForTimeout(150);assert.notEqual(await f.locator('canvas').getAttribute('data-phase'),phase);
   await f.locator('#progress').fill('500');await f.locator('#progress').dispatchEvent('input');assert.equal(await f.locator('#play').innerText(),'재생');
   const yaw=await f.locator('canvas').getAttribute('data-yaw');await f.locator('canvas').press('ArrowLeft');assert.notEqual(await f.locator('canvas').getAttribute('data-yaw'),yaw);
   for(const width of [320,390,768]){await page.setViewportSize({width,height:844});assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));assert(await f.locator('body').evaluate(e=>e.scrollWidth<=innerWidth));}
   if(process.env.PTGOLF_SCREENSHOT_DIR){await f.locator('#viewport').screenshot({path:path.join(process.env.PTGOLF_SCREENSHOT_DIR,'ht_lower_'+short+'-3d.png')});await page.screenshot({path:path.join(process.env.PTGOLF_SCREENSHOT_DIR,'ht_lower_'+short+'-detail.png'),fullPage:true});}
  }
  await page.locator('#memo-save').click();await context.setOffline(true);await page.reload();await page.locator('#training-movement').waitFor();
  assert.equal(await page.locator('.memo-box').textContent(),'하체 선택 중 메모 보존');
  for(const [short,kind] of lowerVariants){await page.locator('#training-movement').selectOption('ht_lower_'+short);await page.waitForFunction(()=>[...document.querySelectorAll('.guide-shot img')].every(i=>i.complete&&i.naturalWidth>0));await page.locator('.exercise-3d summary').click();await page.frameLocator('.exercise-3d-frame').locator('canvas[data-ready]').waitFor();}
  await context.setOffline(false);
  assert.deepEqual(errors,[]);
  // PT reinforcement: five source placements, notes preserved across selection, offline media.
  await page.goto(base+'#exercise/ht_legpress_positions');await page.locator('#training-movement').waitFor();
  assert.equal(await page.locator('#training-movement option').count(),5);
  assert(await page.locator('a[href="#exercise/pt_legpress"]').count());
  await page.locator('[data-offline]').click();await page.locator('[data-offline-status]').filter({hasText:'오프라인 준비됨'}).waitFor({timeout:60000});
  await page.locator('[data-act=memo-edit]').first().click();await page.locator('#memo-input').fill('레그프레스 비교 메모 유지');
  for(const key of ['wide','narrow','standard','high','low']){
   await page.locator('#training-movement').selectOption('ht_legpress_'+key);
   assert.equal(await page.locator('#memo-input').inputValue(),'레그프레스 비교 메모 유지');
   assert.equal(await page.locator('.exercise-3d-frame').count(),0);
   await page.waitForFunction(()=>document.querySelectorAll('.guide-shot img').length===2&&[...document.querySelectorAll('.guide-shot img')].every(i=>i.complete&&i.naturalWidth>0));
   await page.locator('.exercise-3d summary').click();const f=page.frameLocator('.exercise-3d-frame');await f.locator('canvas[data-ready]').waitFor();
   assert.equal(await f.locator('canvas').getAttribute('data-kind'),'htlegpress'+key);assert.equal(await f.locator('#speed').inputValue(),'.5');
   const phase=await f.locator('canvas').getAttribute('data-phase');await page.waitForTimeout(150);assert.notEqual(await f.locator('canvas').getAttribute('data-phase'),phase);
   await f.locator('#progress').fill('500');await f.locator('#progress').dispatchEvent('input');assert.equal(await f.locator('#play').innerText(),'재생');
   const yaw=await f.locator('canvas').getAttribute('data-yaw');await f.locator('canvas').press('ArrowLeft');assert.notEqual(await f.locator('canvas').getAttribute('data-yaw'),yaw);
   for(const width of [320,390,768]){await page.setViewportSize({width,height:844});assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));assert(await f.locator('body').evaluate(e=>e.scrollWidth<=innerWidth));}
   if(process.env.PTGOLF_SCREENSHOT_DIR)await f.locator('#viewport').screenshot({path:path.join(process.env.PTGOLF_SCREENSHOT_DIR,'ht_legpress_'+key+'-3d.png')});
  }
  await page.locator('#memo-save').click();await page.goto(base+'#exercise/pt_legpress');await page.locator('a[href="#exercise/ht_legpress_positions"]').waitFor();
  await page.locator('a[href="#exercise/ht_legpress_positions"]').click();await page.locator('#training-movement').waitFor();
  await context.setOffline(true);await page.reload();await page.locator('#training-movement').waitFor();assert.equal(await page.locator('.memo-box').textContent(),'레그프레스 비교 메모 유지');
  for(const key of ['wide','narrow','standard','high','low']){
   await page.locator('#training-movement').selectOption('ht_legpress_'+key);await page.waitForFunction(()=>[...document.querySelectorAll('.guide-shot img')].every(i=>i.complete&&i.naturalWidth>0));
   await page.locator('.exercise-3d summary').click();await page.frameLocator('.exercise-3d-frame').locator('canvas[data-ready]').waitFor();
  }
  await context.setOffline(false);assert.deepEqual(errors,[]);
  // October PT session and expanded editing are verified only in this isolated context.
  await page.goto(base+'#pt');await page.locator('.pt-session-links').waitFor();assert.equal(await page.locator('.pt-session-links a').count(),4);
  await page.locator('.pt-session-links a[href="#exercise/pt_lunge"]').click();await page.locator('.d-title').waitFor();assert.match(await page.locator('.pt-session-note').innerText(),/회전 없는 일반 런지/);
  await page.waitForFunction(()=>[...document.querySelectorAll('.guide-shot img')].length===2&&[...document.querySelectorAll('.guide-shot img')].every(i=>i.complete&&i.naturalWidth===700));
  await page.locator('[data-act=fav]').click();await page.locator('[data-act=memo-edit]').first().click();await page.locator('#memo-input').fill('런지 개인 메모 보존');await page.locator('#memo-save').click();
  await page.locator('[data-act=edit]').click();await page.locator('#f-prep').fill('수정한 준비 자세');await page.locator('#f-steps').fill('준비\n내리기\n일어서기');await page.locator('#f-focus-move').fill('수정한 앞다리 움직임');await page.locator('#f-focus-feel').fill('수정한 지지 느낌');
  await page.evaluate(()=>{window.__copiedEdit='';Object.defineProperty(navigator,'clipboard',{configurable:true,value:{writeText:async text=>{window.__copiedEdit=text;}}});});
  await page.locator('[data-act=copy-edit]').click();const copied=await page.evaluate(()=>window.__copiedEdit);assert.match(copied,/ID: pt_lunge/);assert.match(copied,/수정한 준비 자세/);assert(!copied.includes('런지 개인 메모 보존'));
  await page.locator('[data-act=modal-save]').click();await page.locator('#modal.hidden').waitFor({state:'attached'});await page.reload();await page.locator('.d-title').waitFor();assert.match(await page.locator('.prep-box').innerText(),/수정한 준비 자세/);assert.match(await page.locator('.focus-box').innerText(),/수정한 앞다리 움직임/);assert.equal(await page.locator('.memo-box').innerText(),'런지 개인 메모 보존');assert.equal(await page.locator('[data-act=fav].on').count(),1);
  await page.locator('[data-offline]').click();await page.locator('[data-offline-status]').filter({hasText:'오프라인 준비됨'}).waitFor({timeout:60000});
  await page.locator('.exercise-3d summary').click();const lf=page.frameLocator('.exercise-3d-frame');await lf.locator('canvas[data-ready]').waitFor();assert.equal(await lf.locator('canvas').getAttribute('data-kind'),'ptlunge');assert.equal(await lf.locator('#speed').inputValue(),'.5');
  const lp=await lf.locator('canvas').getAttribute('data-phase');await page.waitForTimeout(150);assert.notEqual(await lf.locator('canvas').getAttribute('data-phase'),lp);await lf.locator('#progress').fill('500');await lf.locator('#progress').dispatchEvent('input');assert.equal(await lf.locator('#play').innerText(),'재생');const ly=await lf.locator('canvas').getAttribute('data-yaw');await lf.locator('canvas').press('ArrowLeft');assert.notEqual(await lf.locator('canvas').getAttribute('data-yaw'),ly);
  for(const width of [320,390,768]){await page.setViewportSize({width,height:844});assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));}
  await context.setOffline(true);await page.reload();await page.locator('.d-title').waitFor();assert.match(await page.locator('.pt-session-note').innerText(),/2026-10-07/);assert.equal(await page.locator('.memo-box').innerText(),'런지 개인 메모 보존');await page.waitForFunction(()=>[...document.querySelectorAll('.guide-shot img')].every(i=>i.complete&&i.naturalWidth>0));await page.locator('.exercise-3d summary').click();await page.frameLocator('.exercise-3d-frame').locator('canvas[data-ready]').waitFor();await context.setOffline(false);
  for(const width of [320,390,768])for(const hash of ['#pt','#exercise/pt_hip_openclose_stretch','#exercise/pt_pullup']){await page.setViewportSize({width,height:844});await page.goto(base+hash);await page.locator('.pt-session-note').first().waitFor();assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));}
  await page.goto(base+'#exercise/pt_lunge');await page.locator('[data-act=edit]').click();for(const width of [320,390,768]){await page.setViewportSize({width,height:844});assert(await page.locator('#modal .modal-card').evaluate(e=>e.scrollWidth<=e.clientWidth));}await page.keyboard.press('Escape');assert.deepEqual(errors,[]);
  // Golf data failure must leave the independent PT area available.
  const isolated=await browser.newContext({serviceWorkers:'block'}),fallback=await isolated.newPage();await fallback.route('**/js/golf-data.js*',r=>r.abort());await fallback.goto(base+'#pt');await fallback.locator('.pt-exercise-grid').waitFor();await isolated.close();
  console.log('PASS: fresh boot, PT/hash/history reload, confirmed exercise/video deletion and restore, private memo isolation, drafts, search restoration, golf group reset, mobile widths, offline image+3D, isolated golf failure, HT/PT links, HT personal records/deletion/search/offline and mobile navigation. Isolated browser data only.');
 } finally {await browser.close();await new Promise(r=>server.close(r));}
})().catch(e=>{console.error(e);process.exitCode=1;});
