const fs=require('fs'),path=require('path'),vm=require('vm'),assert=require('node:assert/strict');
const read=p=>fs.readFileSync(path.join(__dirname,'..',p),'utf8'),ctx={window:{},localStorage:{getItem:()=>null,setItem:()=>{throw Error('unexpected write');}}};
vm.createContext(ctx);vm.runInContext(read('js/golf-data.js'),ctx);
const c=ctx.window.GolfContent,ids=c.videoGroups.flatMap(g=>Array.from(g.videoIds));
assert.deepEqual(Array.from(c.videoSections,s=>s.id),['backswing','downswing','impact','follow-through']);
assert.equal(new Set(ids).size,101);assert.equal(ids.length,101);
assert.deepEqual([...ids].sort(),Array.from(c.videos,v=>v.id).sort());
assert.equal(c.videoGroups.find(g=>g.id==='review').videoIds.length,5);
for(const s of c.videoSections){
 assert.equal(s.groups.length,3);
 for(const id of s.groups){
  const g=c.videoGroups.find(g=>g.id===id);assert(g);assert.equal(g.practice.steps.length,3);assert.equal(g.practice.checks.length,3);
  for(const src of g.practice.sourceIds){const v=c.videos.find(v=>v.id===src);assert(v);assert.notEqual(c.evidenceFor(v).kind,'metadata');}
  assert.notEqual(c.evidenceFor(c.videos.find(v=>v.id===g.videoIds[0])).kind,'metadata','representative must have reviewed content');
  for(const other of g.relatedGroups)assert(c.videoGroups.some(g=>g.id===other));
 }
}
assert.equal(c.videoGroups[0].videoIds[0],'2tam4sbJQtM');
const seed=JSON.parse(read('data/seed.json')),hidden=new Set();
ctx.Store={getByPart:p=>seed.exercises.filter(e=>e.part===p),getById:id=>seed.exercises.find(e=>e.id===id),getCategories:()=>[],isDeleted:(kind,id)=>kind==='video'&&hidden.has(id)};
for(const p of ['js/golf-practice.js','js/golf-frames.js','js/golf.js'])vm.runInContext(read(p),ctx);
const hub=ctx.window.GolfHub,app={innerHTML:'',querySelector:()=>null},api={app,tabbar:()=>'',exRow:()=>''};
for(const s of c.videoSections){
 hub.render({golfTab:'videos',golfGroup:s.id},api);
 assert.equal((app.innerHTML.match(/class="g-representative-label"/g)||[]).length,3);
 for(const g of s.groups){hub.render({golfTab:'videos',golfGroup:g},api);assert(app.innerHTML.includes('확인 3가지')||app.innerHTML.includes('확인할 세 가지'));}
}
hub.render({golfTab:'videos',golfGroup:'backswing-top'},api);assert(app.innerHTML.indexOf('g-group-backswing-setup')>0);
assert.equal(app.innerHTML.match(/class="g-mini-detail" href="#golf\/videos\/([^"]+)"/)[1],'2tam4sbJQtM');
for(const [tag,count] of [['백스윙 시 몸통 회전',7],['백스윙 시 오른팔 위치',4]]){hub.render({golfTab:'topic',golfId:tag},api);assert.equal((app.innerHTML.match(/class="g-mini-detail"/g)||[]).length,count);}
hidden.add('2tam4sbJQtM');hub.render({golfTab:'videos',golfGroup:'backswing'},api);
assert(!app.innerHTML.includes('href="#golf/videos/2tam4sbJQtM"'));assert.equal(hub.pinnedPractice(),'');
assert(hub.stagePractice().includes('#golf/group/follow-through'));
console.log('PASS: 4 sections, 12 practice/check guides, 101 unique placements, reviewed representatives, legacy backswing route, hidden video filtering, no storage writes.');
