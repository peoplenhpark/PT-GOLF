const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const P=require('../media/3d/poses.js'),ctx={window:{}};
vm.runInNewContext(fs.readFileSync('js/exercise-media.js','utf8'),ctx);
const m=ctx.window.ExerciseMedia.pt_tailbone_raise;
const near=(a,b,message)=>assert(Math.abs(a-b)<1e-8,message);
const dot=(a,b)=>a.reduce((sum,v,i)=>sum+v*b[i],0);
let prev;
for(let n=0;n<=1000;n++){
 const p=P.pose(m.kind,n/1001,'pt_tailbone_raise');
 for(let i=0;i<2;i++){
  const thigh=P.sub(p.knees[i],p.hips[i]),shin=P.sub(p.ankles[i],p.knees[i]);
  near(P.len(thigh),.43,'fixed thigh length');near(P.len(shin),.425,'fixed shin length');
  near(dot(P.unit(thigh),P.unit(shin)),0,'90-degree knee maintained throughout motion');
  near(dot(P.unit(shin),p.footDirections[i]),1,'toes extend forward along shin, not toward body');
  assert(p.footDirections[i][2]>.98,'toes point away from head');
  if(prev)assert(P.len(P.sub(p.ankles[i],prev.ankles[i]))<.002,'no discontinuous leg movement');
 }
 assert.deepEqual(p.knees[0].slice(1),p.knees[1].slice(1),'symmetric knees');
 prev=p;
}
const start=P.pose(m.kind,0,'pt_tailbone_raise'),end=P.pose(m.kind,.5,'pt_tailbone_raise');
assert(end.hip[1]>start.hip[1]);assert.deepEqual(end.head,start.head,'head remains supported');
assert.equal(m.images.length,2);assert(!fs.readFileSync(m.images[0]).equals(fs.readFileSync(m.images[1])));
const release={};vm.runInNewContext(fs.readFileSync('release-assets.js','utf8'),release);
for(const image of m.images)assert(release.PTGolfRelease.exercises.pt_tailbone_raise.includes(image));
console.log('PASS: leg raise 1001 frames, fixed limbs, bilateral 90-degree knees, forward toes, smooth movement, supported head and two offline images.');
