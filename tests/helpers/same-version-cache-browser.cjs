const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const vm=require('node:vm');
const repo=path.resolve(__dirname,'../..'),root=process.env.PTGOLF_SITE_DIR?path.resolve(repo,process.env.PTGOLF_SITE_DIR):repo,expectedFixed=true;
module.exports=async function(browser){let phase='old';const oldFiles=new Map();
for(const f of ['index.html','sw.js','js/app.js'])oldFiles.set(f,fs.readFileSync(path.join(root,f)));
const fixture={window:{}};vm.runInNewContext(fs.readFileSync(path.join(root,'js/pt-videos.js'),'utf8'),fixture);
const refs=JSON.parse(JSON.stringify(fixture.window.PTReferenceVideos));refs.pt_pullup.youtubeId='D_4IlBjqjpw';delete refs.pt_pullup.additionalVideos;
for(const m of refs.pt_pullup.moments)m.url='https://www.youtube.com/watch?v=D_4IlBjqjpw&t='+m.s+'s';
oldFiles.set('js/pt-videos.js',Buffer.from('window.PTReferenceVideos='+JSON.stringify(refs)+';'));
const legacy={};vm.runInNewContext(fs.readFileSync(path.join(root,'release-assets.js'),'utf8'),legacy);delete legacy.PTGolfRelease.revision;
oldFiles.set('release-assets.js',Buffer.from('globalThis.PTGolfRelease='+JSON.stringify(legacy.PTGolfRelease)+';'));
// A synthetic stale image exercises cache migration without retaining a deleted source image.
const marker=Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jKXkAAAAASUVORK5CYII=','base64');
for(const f of refs.pt_pullup.frames)oldFiles.set(f.src,marker);
const server=http.createServer((req,res)=>{const url=new URL(req.url,'http://localhost');const f=decodeURIComponent(url.pathname).replace(/^\//,'')||'index.html';const file=path.resolve(root,f);if(!file.startsWith(root+path.sep))return res.writeHead(403).end();const data=phase==='old'&&oldFiles.has(f)?oldFiles.get(f):fs.existsSync(file)?fs.readFileSync(file):null;if(!data)return res.writeHead(404).end();res.setHeader('Cache-Control','no-store');res.setHeader('Content-Type',({'.js':'application/javascript','.html':'text/html','.json':'application/json','.css':'text/css','.jpg':'image/jpeg','.svg':'image/svg+xml'})[path.extname(f)]||'application/octet-stream');res.end(data);});await new Promise(r=>server.listen(0,'127.0.0.1',r));const base='http://127.0.0.1:'+server.address().port+'/',b=browser,c=await b.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true}),p=await c.newPage();
try{
await p.goto(base+'#exercise/pt_pullup');await p.waitForFunction(()=>navigator.serviceWorker.controller);await p.reload();await p.locator('.pt-reference-video').waitFor();assert.equal(await p.evaluate(()=>PTReferenceVideos.pt_pullup.youtubeId),'D_4IlBjqjpw');
await p.locator('.memo-edit').click();await p.locator('#memo-input').fill('기존 기기 메모');await p.locator('#memo-save').click();if(!await p.evaluate(()=>Store.getById('pt_pullup').favorite))await p.locator('[data-act=fav]').click();
await p.locator('[data-offline]').click();await p.locator('[data-offline-status]').filter({hasText:'오프라인 준비됨'}).waitFor({timeout:60000});
await p.evaluate(async()=>{localStorage.setItem('cache-upgrade-personal-marker','보존');const cache=await caches.open('unrelated-app');await cache.put('/unrelated-marker',new Response('keep'));});
await p.locator('.memo-edit').click();await p.locator('#memo-input').fill('업데이트 중 작성한 메모');phase='new';await p.evaluate(async()=>{const r=await navigator.serviceWorker.getRegistration();await r.update();});await p.waitForFunction(async()=>!!(await navigator.serviceWorker.getRegistration()).waiting,{},{timeout:60000});
assert.equal(await p.locator('#memo-input').inputValue(),'업데이트 중 작성한 메모');assert.equal(await p.evaluate(()=>PTReferenceVideos.pt_pullup.youtubeId),'D_4IlBjqjpw');
const waitingResponse=await p.evaluate(async()=>await(await fetch('js/pt-videos.js')).text());const waitingLeaksNew=waitingResponse.includes('HpFzt4_EHko');
await p.locator('#memo-save').click();await p.waitForFunction(()=>window.PTReferenceVideos?.pt_pullup?.additionalVideos?.[0]?.youtubeId==='HpFzt4_EHko',{},{timeout:60000});await p.locator('.pt-reference-video').first().waitFor();
const img=Buffer.from(await p.evaluate(async()=>Array.from(new Uint8Array(await(await fetch('media/pt-reference/pt_pullup-1.jpg')).arrayBuffer()))));const hash=x=>crypto.createHash('sha256').update(x).digest('hex');const staleImage=hash(img)===hash(oldFiles.get('media/pt-reference/pt_pullup-1.jpg'));const result={waitingLeaksNew,staleImage,keys:await p.evaluate(()=>caches.keys()),revision:await p.evaluate(()=>PTGolfRelease.revision||null)};
console.log(JSON.stringify(result));if(expectedFixed)assert.equal(waitingLeaksNew,false,'waiting update must not mutate active scripts');assert.equal(staleImage,!expectedFixed,'prepared images must refresh after activation');
assert.equal(await p.evaluate(()=>Store.getById('pt_pullup').memo),'업데이트 중 작성한 메모');assert.equal(await p.evaluate(()=>Store.getById('pt_pullup').favorite),true);assert.equal(await p.evaluate(()=>localStorage.getItem('cache-upgrade-personal-marker')),'보존');assert(await p.evaluate(async()=>!!await(await caches.open('unrelated-app')).match('/unrelated-marker')));
if(expectedFixed){assert(!result.keys.includes('ptgolf-v237'));await c.setOffline(true);await p.reload();await p.locator('.pt-reference-video').first().waitFor();await p.locator('.pt-video-frames').last().scrollIntoViewIfNeeded();await p.waitForFunction(()=>[...document.querySelectorAll('.pt-video-frames img')].every(i=>i.complete&&i.naturalWidth>0));assert.equal(await p.locator('.pt-reference-video').count(),2);assert(!await p.evaluate(()=>document.documentElement.outerHTML.includes('D_4IlBjqjpw')));result.offlineNewVideosAndImages=true;}
result.memoFavoriteDraftAndUnrelatedDataPreserved=true;console.log('PASS: same-version stale-image cache migration, waiting draft protection, memo/favorite preservation, unrelated cache and new offline media.');
}finally{await c.close();await new Promise(r=>server.close(r));}};
