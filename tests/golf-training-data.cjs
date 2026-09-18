const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const root=path.resolve(__dirname,'..'),read=p=>fs.readFileSync(path.join(root,p),'utf8');
const ctx={window:{}};vm.createContext(ctx);vm.runInContext(read('js/golf-data.js'),ctx);vm.runInContext(read('js/exercise-media.js'),ctx);
const c=ctx.window.GolfContent,media=ctx.window.ExerciseMedia;
assert.equal(c.videos.length,13);assert.equal(new Set(c.videos.map(v=>v.id)).size,13);
assert.equal(c.videos[0].id,'bfMsJtV61hM');
for(const duration of ['2:00','3:00','3:01','15:53'])assert.equal(c.presentationFor({duration}),'original');
for(const v of c.videos){
 assert.equal(c.presentationFor(v),'original');assert(!v.lesson3d&&!v.lessonHref&&!v.sampleHref);assert(v.points.length>=3);
 for(const id of v.relatedVideoIds||[])assert(c.videos.some(x=>x.id===id));
 for(const m of v.moments)assert(m.s>=0&&m.s<c.durationSeconds(v));
}
assert.equal(c.durationSeconds(c.videos.find(v=>v.id==='IsSS-GnQQyY')),611);
assert.equal(c.durationSeconds(c.videos.find(v=>v.id==='du58mmLNMnQ')),566);
const grouped=c.videoGroups.flatMap(g=>g.videoIds);
assert.equal(c.videoGroups.length,4);assert.equal(new Set(grouped).size,13);assert.equal(grouped.length,13);
assert.deepEqual(Array.from(c.videoGroups,g=>g.videoIds.length),[2,2,5,4]);
for(const v of c.videos)assert(c.videoGroupFor(v));
assert.equal(Object.keys(media).length,43);assert(Object.keys(media).every(id=>id.startsWith('pt_')));
for(const m of Object.values(media))assert(m.viewer);
const sw=read('sw.js');
for(const m of sw.matchAll(/'\.\/([^']*)'/g))assert(fs.existsSync(path.join(root,m[1].split('?')[0]||'index.html')));
assert(!/media\/golf3d\/[^']*\.(js|css|bin|json|webp)/.test(sw));
// Render every video and group through the real hub with a read-only storage double.
const seed=JSON.parse(read('data/seed.json'));let writes=0;
ctx.localStorage={getItem:()=>null,setItem:()=>{writes++;}};
ctx.Store={getByPart:part=>seed.exercises.filter(e=>e.part===part),getById:id=>seed.exercises.find(e=>e.id===id),getCategories:()=>['드라이버','아이언']};
vm.runInContext(read('js/golf.js'),ctx);
const app={innerHTML:'',querySelector:()=>null},api={app,tabbar:()=>'',exRow:e=>e.name};
const check=()=>{assert(!/3D|3d|실사형|입체로/.test(app.innerHTML));assert(!/<iframe/.test(app.innerHTML));};
for(const v of c.videos){ctx.window.GolfHub.render({golfTab:'videos',golfId:v.id},api);check();assert(app.innerHTML.includes('https://www.youtube.com/watch?v='+v.id));assert(app.innerHTML.includes('내 적용 메모'));}
for(const g of c.videoGroups){ctx.window.GolfHub.render({golfTab:'videos',golfGroup:g.id},api);check();assert.equal((app.innerHTML.match(/class="g-video-card"/g)||[]).length,g.videoIds.length);}
ctx.window.GolfHub.render({golfTab:'videos'},api);check();assert.equal((app.innerHTML.match(/class="g-video-card"/g)||[]).length,13);
for(const tab of ['notes','lessons']){ctx.window.GolfHub.render({golfTab:tab},api);check();}
assert.equal(writes,0);
// Old URLs redirect to valid source/notes, including unsafe or unknown query values.
for(const [file,query,suffix] of [
 ['viewer','?exercise=golf_driver','#exercise/golf_driver'],['viewer','?source=Aj1UEMYPxBg','#golf/videos/Aj1UEMYPxBg'],
 ['viewer','?source=javascript:bad&exercise=unknown','#golf/videos'],['lesson','','#golf/videos/du58mmLNMnQ'],
 ['consistency','','#golf/videos/IsSS-GnQQyY'],['training','?lesson=shift','#golf/videos/CA-TZ7WQlHY'],['original','','#golf/videos/bfMsJtV61hM']]){
 const html=read('media/golf3d/'+file+'.html');assert(!/<canvas|three\.min|viewer\.js|lesson\.js|consistency\.js/.test(html));let url='';
 const local={window:ctx.window,URLSearchParams,location:{search:query,replace:v=>url=v},document:{getElementById:()=>({})}};
 for(const match of html.matchAll(/<script>([\s\S]*?)<\/script>/g))vm.runInNewContext(match[1],local);
 assert(url.endsWith(suffix),file+' redirect '+url);
}
console.log('PASS: 13 originals, 4 groups, no golf 3D UI/cache, 43 PT models preserved, 7 old URL redirects, no storage writes.');
