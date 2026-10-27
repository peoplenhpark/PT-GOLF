const assert=require('node:assert/strict'),fs=require('fs'),vm=require('vm'),P=require('../media/3d/poses.js');
const seed=JSON.parse(fs.readFileSync('data/seed.json','utf8')),c={window:{}};vm.runInNewContext(fs.readFileSync('js/exercise-media.js','utf8'),c);
const id='pt_shoulderpress',m=c.window.ExerciseMedia[id],first=P.pose(m.kind,0,id);let prev;
for(let n=0;n<1001;n++){
 const p=P.pose(m.kind,n/1001,id);assert.deepEqual(p.hips,first.hips);assert.deepEqual(p.ankles,first.ankles);assert.deepEqual(p.knees,first.knees);assert.deepEqual(p.up,first.up);
 for(let i=0;i<2;i++){
  for(const [a,b,l]of [['shoulders','elbows',.29],['elbows','wrists',.285]])assert(Math.abs(P.len(P.sub(p[a][i],p[b][i]))-l)<1e-8,'fixed arm length');
  const pivot=p.equipment.find(e=>e.type==='shoulderpressmachine').pivots[i];assert(Math.abs(P.len(P.sub(p.wrists[i],pivot))-.55)<1e-9,'rigid machine lever');
  if(prev)assert(P.len(P.sub(p.wrists[i],prev.wrists[i]))<.01,'continuous handle motion');
 }
 assert(Math.abs(p.wrists[0][0]+p.wrists[1][0])<1e-9);assert.deepEqual(p.wrists[0].slice(1),p.wrists[1].slice(1));prev=p;
}
assert(P.pose(m.kind,.5,id).wrists[0][1]>first.wrists[0][1]+.25);
assert.equal(m.images.length,2);assert(!fs.readFileSync(m.images[0]).equals(fs.readFileSync(m.images[1])));assert(m.visualNote.includes('예시'));
const lesson=seed.ptSessions.find(s=>s.id==='pt_session_20261027');assert.deepEqual(lesson.items.map(i=>i.exerciseId),['pt_backextension','pt_chestpress',id]);assert(lesson.items.every(i=>i.points.some(p=>p.includes('중단'))));assert(seed.ptSessions.some(s=>s.id==='pt_session_20261016'));
const release={};vm.runInNewContext(fs.readFileSync('release-assets.js','utf8'),release);for(const image of m.images)assert(release.PTGolfRelease.exercises[id].includes(image));
console.log('PASS: PT closeout lesson, 1001 shoulder-machine frames, fixed supports/limbs, rigid bilateral levers, continuous motion, distinct image pair and offline manifest.');
