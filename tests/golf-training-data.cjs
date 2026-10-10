const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const root=path.resolve(__dirname,'..'),read=p=>fs.readFileSync(path.join(root,p),'utf8');
const ctx={window:{}};vm.createContext(ctx);vm.runInContext(read('js/golf-data.js'),ctx);vm.runInContext(read('js/exercise-media.js'),ctx);
const c=ctx.window.GolfContent,media=ctx.window.ExerciseMedia;
assert.equal(c.videos.length,88);assert.equal(new Set(c.videos.map(v=>v.id)).size,88);
assert.equal(c.videos[0].id,'9YWDNMyTQy4');
for(const duration of ['2:00','3:00','3:01','15:53'])assert.equal(c.presentationFor({duration}),'original');
for(const v of c.videos){
 assert(Number.isFinite(Date.parse(v.addedAt)),v.id+' valid addedAt');
 assert.equal(c.presentationFor(v),'original');assert(!v.lesson3d&&!v.lessonHref&&!v.sampleHref);assert(v.points.length>=3);
 const practical=c.practicalFor(v);assert(['metadata','observation','source'].includes(practical.kind));
 for(const key of ['action','feel','check','caution'])assert.equal(typeof practical[key],'string',v.id+' practical '+key);
 assert(practical.action.length>20&&practical.feel.length>20&&practical.check.length>20,v.id+' practical summary is too vague');
 assert.equal(practical.labels.length,3);
 if(practical.kind==='metadata')assert(!practical.action.includes('원본을 처음부터 보며 제목에서 말하는 동작'),v.id+' keeps generic metadata copy');
 for(const id of v.relatedVideoIds||[]){assert(c.videos.some(x=>x.id===id));assert.notEqual(id,v.id,v.id+' cannot relate to itself');}
 for(const m of v.moments)assert(m.s>=0&&m.s<c.durationSeconds(v));
}
const practicalRows=Array.from(c.videos,v=>({video:v,practical:c.practicalFor(v)}));
const metadataRows=practicalRows.filter(x=>x.practical.kind==='metadata');
const reviewedRows=practicalRows.filter(x=>x.practical.kind!=='metadata');
assert.equal(metadataRows.length,27);assert.equal(reviewedRows.length,61);
assert.equal(new Set(metadataRows.map(x=>x.practical.feel)).size,27,'metadata comparisons must be title-specific');
assert.equal(new Set(metadataRows.map(x=>x.practical.check)).size,27,'metadata questions must be title-specific');
for(const {video,practical} of metadataRows){
 assert(!/적용하세요|무너지는 하나/.test(practical.action),video.id+' must not prescribe an unreviewed cue');
 assert(!practical.feel.includes('바로 교정 동작으로 바꾸세요'),video.id+' must keep comparison observational');
}
for(const {video,practical} of reviewedRows)assert.equal(practical.check,video.question,video.id+' uses its reviewed lesson question');
assert.equal(c.durationSeconds(c.videos.find(v=>v.id==='IsSS-GnQQyY')),611);
assert.equal(c.durationSeconds(c.videos.find(v=>v.id==='du58mmLNMnQ')),566);
const grouped=c.videoGroups.flatMap(g=>g.videoIds);
assert.equal(c.videoGroups.length,8);assert.equal(new Set(grouped).size,88);assert.equal(grouped.length,88);
assert.deepEqual(Array.from(c.videoGroups,g=>g.videoIds.length),[2,4,5,10,26,39,1,1]);
for(const v of c.videos)assert(c.videoGroupFor(v));
const seed=JSON.parse(read('data/seed.json'));
const ptIds=seed.exercises.filter(e=>e.part==='pt').map(e=>e.id).sort();
const mediaIds=Object.keys(media).sort();
assert.equal(ptIds.length,51);
assert.deepEqual(mediaIds,seed.exercises.filter(e=>['pt','ht'].includes(e.part)).map(e=>e.id).sort());
for(const [id,m] of Object.entries(media)){
 if(m.pending){
  assert.equal(m.pending,true,id+' pending flag');
  assert.equal(typeof m.pendingMessage,'string',id+' pending message');assert(m.pendingMessage.trim(),id+' empty pending message');
  assert(Array.isArray(m.images));assert.equal(m.images.length,0,id+' pending images');assert.equal(m.viewer,'',id+' pending viewer');
  continue;
 }
 assert(m.viewer,id+' viewer');
 assert.equal(m.images?.length,2,id+' start/end images');
 for(const image of m.images)assert(fs.existsSync(path.join(root,image)),id+' missing '+image);
}
const sw=read('sw.js');
for(const m of sw.matchAll(/'\.\/([^']*)'/g))assert(fs.existsSync(path.join(root,m[1].split('?')[0]||'index.html')));
assert(!/media\/golf3d\/[^']*\.(js|css|bin|json|webp)/.test(sw));
// Render every video and group through the real hub with a read-only storage double.
let writes=0;
ctx.localStorage={getItem:()=>null,setItem:()=>{writes++;}};
ctx.Store={getByPart:part=>seed.exercises.filter(e=>e.part===part),getById:id=>seed.exercises.find(e=>e.id===id),getCategories:()=>['드라이버','아이언']};
vm.runInContext(read('js/golf-practice.js'),ctx);
  vm.runInContext(read('js/golf-frames.js'),ctx);
  vm.runInContext(read('js/golf.js'),ctx);
const noteSummaryMatches=ctx.window.GolfHub.searchRecords('뒤에서 못 박듯');
assert(noteSummaryMatches.some(result=>result.type==='note'&&result.id==='golf_driver'&&result.matchedFields.includes('설명')),'golf internal search includes practicalSummary feel');
const app={innerHTML:'',querySelector:()=>null},api={app,tabbar:()=>'',exRow:e=>e.name};
const check=()=>{assert(!/3D|3d|실사형|입체로/.test(app.innerHTML));assert(!/<iframe/.test(app.innerHTML));};
for(const v of c.videos){ctx.window.GolfHub.render({golfTab:'videos',golfId:v.id},api);check();assert(app.innerHTML.includes('https://www.youtube.com/watch?v='+v.id));assert(app.innerHTML.includes('내 적용 메모'));assert(app.innerHTML.includes('class="g-practical-summary"'));assert(app.innerHTML.includes('class="g-source-detail"'));}
for(const g of c.videoGroups){ctx.window.GolfHub.render({golfTab:'videos',golfGroup:g.id},api);check();assert.equal((app.innerHTML.match(/class="g-video-card(?: [^"]*)?"/g)||[]).length,g.videoIds.length);assert.equal((app.innerHTML.match(/class="g-mini-takeaway"/g)||[]).length,g.videoIds.length);}
assert(!/class="g-mini-detail"[^>]*aria-label=/.test(app.innerHTML),'visible takeaway and evidence stay in the link accessible name');
ctx.window.GolfHub.render({golfTab:'videos'},api);check();assert.equal((app.innerHTML.match(/class="g-video-card(?: [^"]*)?"/g)||[]).length,4+Math.min(3,c.recentVideos().filter(v=>!c.featuredVideoIds.includes(v.id)).length));
assert.equal((app.innerHTML.match(/class="g-mini-takeaway"/g)||[]).length,4+Math.min(3,c.recentVideos().filter(v=>!c.featuredVideoIds.includes(v.id)).length));
assert.equal(c.featuredVideoId,'9YWDNMyTQy4');
assert.deepEqual(Array.from(c.featuredVideoIds),['9YWDNMyTQy4','3kNb6TQN2T0','QsmMamIFMsE','EgdcUOkvJKk']);
const featuredHtml=app.innerHTML.match(/<section class="g-featured-video"[\s\S]*?<\/section>/)[0];
assert(featuredHtml.includes('9YWDNMyTQy4')&&featuredHtml.includes('3kNb6TQN2T0')&&featuredHtml.includes('QsmMamIFMsE'));
assert.equal((featuredHtml.match(/class="g-video-card/g)||[]).length,4);
assert(app.innerHTML.indexOf('g-video-groups')<app.innerHTML.indexOf('g-featured-video'));
assert.equal((app.innerHTML.match(/href="#golf\/videos\/9YWDNMyTQy4"/g)||[]).length,1);
ctx.window.GolfHub.render({golfTab:'videos',golfQuery:'어깨'},api);assert(!app.innerHTML.includes('g-featured-video'));assert(!app.innerHTML.includes('watch?v=9YWDNMyTQy4'));
ctx.window.GolfHub.render({golfTab:'videos',golfGroup:'arms-impact'},api);assert(app.innerHTML.includes('watch?v=9YWDNMyTQy4'));assert(!app.innerHTML.includes('g-featured-video'));
for(const tab of ['notes','lessons']){ctx.window.GolfHub.render({golfTab:tab},api);check();}
const driver=seed.exercises.find(e=>e.id==='golf_driver');driver.practicalSummary={action:'검증용 오늘 동작',feel:'검증용 개인 감각'};
ctx.window.GolfHub.render({golfTab:'notes'},api);assert(app.innerHTML.includes('검증용 오늘 동작'));assert(app.innerHTML.includes('검증용 개인 감각'));delete driver.practicalSummary;
const metadataQuestion=c.videos.find(v=>v.id==='cQiwXcbWZc4');ctx.window.GolfHub.render({golfTab:'question-edit',sourceKind:'videos',sourceId:metadataQuestion.id},api);assert(app.innerHTML.includes(c.practicalFor(metadataQuestion).check));
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
console.log('PASS: 88 originals, 8 groups, no golf 3D UI/cache, 51 PT models and HT media match seed/media, 7 old URL redirects, no storage writes.');
