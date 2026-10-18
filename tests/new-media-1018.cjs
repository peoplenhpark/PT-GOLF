const fs=require('fs'),path=require('path'),vm=require('vm'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..'),read=p=>fs.readFileSync(path.join(root,p),'utf8'),c={window:{}};
for(const f of ['js/golf-data.js','js/golf-frames.js','js/exercise-media.js','release-assets.js'])vm.runInNewContext(read(f),c);
const golf=c.window.GolfContent,frames=c.window.GolfFrames,seed=JSON.parse(read('data/seed.json')),poses=require('../media/3d/poses.js');
assert(!golf.videos.some(v=>v.id==='3xsgQurjqtI'));
assert(golf.videos.some(v=>v.id==='nkfEfaa4CFs'));
for(const [id,group] of [['4DyoF3OQKww','impact-release'],['j1USTUwFnRI','common'],['4Eof_tmI0Ag','impact-release']]){
 assert.equal(golf.videos.filter(v=>v.id===id).length,1);assert.equal(golf.videoGroupFor({id}).id,group);assert.equal(frames[id].length,2);
 assert(!fs.readFileSync(path.join(root,frames[id][0].src)).equals(fs.readFileSync(path.join(root,frames[id][1].src))));
}
assert.equal(golf.videoGroups[0].videoIds[0],'2tam4sbJQtM');
const id='ht_squat_comparison',e=seed.exercises.find(e=>e.id===id),media=c.window.ExerciseMedia[id];assert.equal(e.part,'ht');assert.equal(e.sourceVideo.youtubeId,'zJ5tzToG9PM');assert.equal(media.variants.length,3);
assert.equal(seed.exercises.filter(e=>e.sourceVideo?.youtubeId==='zJ5tzToG9PM').length,1);
const starts=[],ends=[];
for(const variant of media.variants){
 assert.equal(variant.images.length,2);assert(!fs.readFileSync(path.join(root,variant.images[0])).equals(fs.readFileSync(path.join(root,variant.images[1]))));
 for(const src of variant.images)assert(c.PTGolfRelease.exercises[id].includes(src));
 const first=poses.pose(variant.kind,0,id),last=poses.pose(variant.kind,.5,id);starts.push(first);ends.push(last);
 for(let i=0;i<=1000;i++){
  const p=poses.pose(variant.kind,i/1000,id);assert(p.equipment.some(e=>e.type==='goblet'));
  for(const key of ['hip','head','neck','wrists','knees','ankles'])assert(p[key].flat().every(Number.isFinite));
  for(let side=0;side<2;side++){
   for(const [a,b,len] of [['shoulders','elbows',.29],['elbows','wrists',.285],['hips','knees',.43],['knees','ankles',.425]])assert(Math.abs(poses.len(poses.sub(p[a][side],p[b][side]))-len)<.0003,variant.kind+' '+a+' '+i);
   assert.deepEqual(p.ankles[side],first.ankles[side]);assert(p.wrists[side][1]>.20);
  }
 }
 assert(last.hip[1]<first.hip[1]-.3);
}
assert(ends[1].hip[2]<ends[0].hip[2]-.15);assert(starts[2].ankles[1][0]>starts[0].ankles[1][0]+.1);
assert(ends[0].wrists[0][1]>ends[1].wrists[0][1]+.2);
console.log('PASS: new golf 3 / reused reedit 1, original frames, pinned video, HT three distinct squat variants, 3003 poses with constant limbs and fixed feet.');
