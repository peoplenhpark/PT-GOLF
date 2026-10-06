const fs=require('fs'),vm=require('vm'),assert=require('node:assert/strict'),path=require('path');
const root=path.resolve(__dirname,'..'),read=p=>fs.readFileSync(path.join(root,p),'utf8');
const ctx={window:{}};for(const f of ['js/exercise-media.js','js/golf-data.js','release-assets.js'])vm.runInNewContext(read(f),ctx);
const seed=JSON.parse(read('data/seed.json')),e=seed.exercises.find(e=>e.id==='ht_legpress_positions'),m=ctx.window.ExerciseMedia[e.id];
assert.equal(e.part,'ht');assert.equal(e.sourceVideo.youtubeId,'Qlkuoj6OMkY');assert.equal(e.relatedExercises[0].id,'pt_legpress');assert.equal(m.variants.length,5);
const P=require('../media/3d/poses.js'),dot=(a,b)=>a.reduce((s,x,i)=>s+x*b[i],0),dist=(a,b)=>P.len(P.sub(a,b));
for(const v of m.variants){
 assert.equal(v.images.length,2);const bytes=v.images.map(f=>fs.readFileSync(path.join(root,f)));assert(!bytes[0].equals(bytes[1]));
 const first=P.pose(v.kind,0,e.id);let prev;
 for(let n=0;n<=1000;n++){
  const p=P.pose(v.kind,n/1001,e.id),plate=p.equipment[0];assert.equal(plate.type,'htlegpress');assert.deepEqual(p.hip,first.hip);assert.deepEqual(p.up,first.up);
  for(let i=0;i<2;i++){
   for(const [a,b,l]of [['hips','knees',.43],['knees','ankles',.425],['shoulders','elbows',.29],['elbows','wrists',.285]])assert(Math.abs(dist(p[a][i],p[b][i])-l)<1e-8,v.id+' limb');
   const sole=P.add(P.add(p.ankles[i],P.mul(p.footDirections[i],.05)),P.mul(plate.normal,.045));
   assert(Math.abs(dot(P.sub(sole,plate.center),plate.normal)+.035)<1e-8,v.id+' foot on sled');
   assert(Math.abs(dot(p.footDirections[i],plate.normal))<1e-10);
   assert(dot(P.sub(p.ankles[i],plate.center),plate.up)<.22);assert(dot(P.sub(p.ankles[i],plate.center),plate.up)>-.22);
   if(prev)assert(dist(prev.ankles[i],p.ankles[i])<.003,v.id+' continuous sled');
  }
  for(const field of ['hips','knees','ankles','shoulders','elbows','wrists'])for(const pt of p[field])assert(pt.every(Number.isFinite));prev=p;
 }
 assert(dist(P.pose(v.kind,0).ankles[0],P.pose(v.kind,.5).ankles[0])>.22);
}
const c=ctx.window.GolfContent;assert.equal(c.videos.filter(v=>v.id==='1lD1Lhk-2Lc').length,1);
assert.equal(c.videoGroupFor(c.videos.find(v=>v.id==='Fk_3CjorpVA')).id,'short-game');
for(const id of ['1lD1Lhk-2Lc','va8Oz-nSxcI','0HjpF1MOwAw','2CplOC4flsA','g2AXYPKdCik'])assert.notEqual(c.videoGroupFor(c.videos.find(v=>v.id===id)).id,'backswing-top');
console.log('PASS: five HT leg-press placements, 5005 poses, constant limbs, supported trunk, sled/sole contact, source cuts, PT link and golf scope/deduplication.');
