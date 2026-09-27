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
  await page.locator('.tab[data-nav=home]').click();await page.locator('[data-act=search-focus]').click();await page.locator('#search-input').fill('회귀 검사');
  await page.locator('.search-result').first().waitFor();await page.reload();await page.locator('#search-input').waitFor();assert.equal(await page.locator('#search-input').inputValue(),'회귀 검사');
  await page.locator('.search-result').first().click();await page.locator('.d-title').waitFor();await page.locator('#history-back').click();await page.locator('#search-input').waitFor();assert.equal(await page.locator('#search-input').inputValue(),'회귀 검사');
  await page.locator('[data-nav=golf]').click();await page.locator('.g-video-grid').first().waitFor();
  await page.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));await page.evaluate(()=>window.scrollTo(0,600));await page.reload();await page.locator('.g-video-grid').first().waitFor();await page.waitForFunction(()=>Math.abs(window.scrollY-600)<10);
  const group=page.locator('.g-video-groups a[href*="/group/"]').first();await group.click();await page.locator('.g-video-groups a[href="#golf/videos"]').click();assert.equal(new URL(page.url()).hash,'#golf/videos');
  assert.equal(await page.locator('.g-video-card .g-delete-video').count(),0,'video lists do not show delete actions');
  await page.locator('a[href="#golf/videos/cQiwXcbWZc4"]').first().click();await page.locator('[data-g-form=video]').waitFor();await page.locator('[data-g-form=video] textarea').fill('골프 영상 초안');
  await page.reload();await page.locator('[data-g-form=video]').waitFor();assert.equal(await page.locator('[data-g-form=video] textarea').inputValue(),'골프 영상 초안');
  await page.locator('[data-g-form=video] button').click();assert.match(await page.locator('[data-draft-status]').first().textContent(),/저장/);
  assert.equal(await page.locator('.g-delete-video[data-id="cQiwXcbWZc4"]').count(),1,'video detail has one delete action');await page.locator('.g-delete-video[data-id="cQiwXcbWZc4"]').click();await page.locator('#confirm:not(.hidden)').waitFor();assert.equal(await page.locator('[data-g-form=video]').count(),1,'video remains visible until confirmation');
  await page.locator('[data-act=confirm-yes]').click();await page.getByRole('heading',{name:'이 기기에서 삭제 요청한 영상입니다'}).waitFor();
  const videoDeletion=await page.evaluate(()=>({queue:localStorage.getItem('ptgolf_deletion_requests_v1'),url:window.__openedDeletionUrls.at(-1)}));
  assert(videoDeletion.queue.includes('cQiwXcbWZc4'));assert(!videoDeletion.queue.includes('골프 영상 초안'),'private video memo must not enter deletion queue');
  {const issue=new URL(videoDeletion.url);assert.match(issue.searchParams.get('body'),/content-kind: video/);assert.match(issue.searchParams.get('body'),/content-id: cQiwXcbWZc4/);assert(!issue.searchParams.get('body').includes('골프 영상 초안'));}
  await page.locator('[data-g=restore-video]').first().click();await page.locator('[data-g-form=video]').waitFor();assert.equal(await page.locator('[data-g-form=video] textarea').inputValue(),'골프 영상 초안','restoring a video preserves its memo');
  await page.goto(base+'#golf/notes');await page.locator('[data-open]').first().click();await page.locator('.personal-note-label').waitFor();assert.match(await page.locator('.personal-note-label').textContent(),/개인 연습 감각/);
  for(const width of [320,390,768]){await page.setViewportSize({width,height:844});await page.goto(base+'#golf/videos');await page.locator('.g-video-grid').first().waitFor();assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true,'no overflow at '+width);if(process.env.PTGOLF_SCREENSHOT_DIR){fs.mkdirSync(process.env.PTGOLF_SCREENSHOT_DIR,{recursive:true});await page.screenshot({path:path.join(process.env.PTGOLF_SCREENSHOT_DIR,'golf-'+width+'.png'),fullPage:false});}}
  await page.goto(base+'#exercise/'+firstId);await page.locator('[data-offline]').waitFor();
  await page.evaluate(async()=>{await navigator.serviceWorker.ready;});
  if(!await page.evaluate(()=>!!navigator.serviceWorker.controller)){await page.reload();await page.locator('[data-offline]').waitFor();}
  await page.locator('[data-offline]').click();await page.locator('[data-offline-status]').filter({hasText:'오프라인 준비됨'}).waitFor({timeout:60000});
  await context.setOffline(true);await page.reload();await page.locator('.d-title').waitFor();assert.equal(await page.locator('.guide-shot img').evaluateAll(imgs=>imgs.every(i=>i.complete&&i.naturalWidth>0)),true);
  await page.locator('.exercise-3d summary').click();await page.locator('.exercise-3d-frame').waitFor();await page.frameLocator('.exercise-3d-frame').locator('canvas').waitFor({timeout:20000});
  await context.setOffline(false);
  assert.deepEqual(errors,[]);
  // Golf data failure must leave the independent PT area available.
  const isolated=await browser.newContext({serviceWorkers:'block'}),fallback=await isolated.newPage();await fallback.route('**/js/golf-data.js*',r=>r.abort());await fallback.goto(base+'#pt');await fallback.locator('.pt-exercise-grid').waitFor();await isolated.close();
  console.log('PASS: fresh boot, PT/hash/history reload, confirmed exercise/video deletion and restore, private memo isolation, drafts, search restoration, golf group reset, mobile widths, offline image+3D, and isolated golf failure. Isolated browser data only.');
 } finally {await browser.close();await new Promise(r=>server.close(r));}
})().catch(e=>{console.error(e);process.exitCode=1;});
