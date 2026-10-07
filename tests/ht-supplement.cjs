const fs=require('fs'),path=require('path'),vm=require('vm'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..'),read=p=>fs.readFileSync(path.join(root,p),'utf8'),c={window:{}};
for(const file of ['js/exercise-media.js','js/golf-data.js','media/3d/poses.js','release-assets.js'])vm.runInNewContext(read(file),c);
const seed=JSON.parse(read('data/seed.json')),audit=JSON.parse(read('docs/video-review-2026-10-07-supplement.json'));
const htIds=['ht_latpulldown_reference','ht_upper_elbows','ht_chest_six'],kinds=new Set(['htshoulderpress','htvrow','htdumbbellfly','htsqueezepress','htsmithflat','htbenchpullover']);
const poses=c.window.ExercisePoses||c.ExercisePoses;
const dist=(a,b)=>Math.hypot(...a.map((x,i)=>x-b[i]));
for(const id of htIds){
 const e=seed.exercises.find(e=>e.id===id),m=c.window.ExerciseMedia[id];assert.equal(e.part,'ht');assert(e.relatedExercises.length);assert(e.reminders.join(' ').includes('기존 PT'));
 for(const v of m.variants||[m]){
  assert.equal(v.images.length,2);const bytes=v.images.map(p=>fs.readFileSync(path.join(root,p)));assert(!bytes[0].equals(bytes[1]),id+' distinct preparation/action');
  if(!kinds.has(v.kind))continue;
  let first,last;
  for(let i=0;i<=1000;i++){
   const p=poses.pose(v.kind,i/1000,id);if(i===0)first=p;if(i===500)last=p;
   for(const key of ['hip','head','neck',...[]])assert(p[key].every(Number.isFinite),v.kind+' '+key);
   for(let side=0;side<2;side++){
    for(const [a,b,len] of [['shoulders','elbows',.29],['elbows','wrists',.285],['hips','knees',.43],['knees','ankles',.425]])assert(Math.abs(dist(p[a][side],p[b][side])-len)<.0003,`${v.kind} ${a}/${b} frame ${i}`);
    assert(dist(first.ankles[side],p.ankles[side])<1e-8,v.kind+' fixed feet');
   }
   assert(dist(first.hip,p.hip)<1e-8,v.kind+' stable support');
   if(v.kind==='htsmithflat'){assert(p.equipment.some(e=>e.type==='smith'));assert.equal(p.wrists[0][2],first.wrists[0][2]);assert.equal(p.wrists[0][0],first.wrists[0][0]);}
   if(v.kind==='htbenchpullover')assert(p.equipment.some(e=>e.type==='goblet'));
  }
  assert(dist(first.wrists[0],last.wrists[0])>.15,v.kind+' moves');
 }
}
const deleted='WWtv4x3uz-M';assert(!read('js/golf-data.js').includes(deleted));assert(!read('js/golf-frames.js').includes(deleted));
assert(!fs.existsSync(path.join(root,'media/golf-frames/'+deleted+'-1.webp')));
const {evaluateRequests,readSources}=require('../scripts/deletion-requests.cjs'),sources=readSources(root);
assert.equal(evaluateRequests([{issue:1,kind:'video',id:deleted}],sources.approvals,sources.sourceIds)[0].blocked,false);
assert.equal(seed.exercises.find(e=>e.id==='ht_bulgarian_split_squat').supplementaryVideos.at(-1).youtubeId,'XZ_PZQ12_DA');
for(const g of audit.golf)assert.equal(c.window.GolfContent.videoGroupFor(c.window.GolfContent.videos.find(v=>v.id===g.id)).id,g.group);
console.log('PASS: 3 HT supplements, 11 distinct source pairs, 6006 poses with fixed supports/limbs, matching equipment, exact declared deletion and golf categories.');
