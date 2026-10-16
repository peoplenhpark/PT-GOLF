const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),P=require('../media/3d/poses.js');
const root=path.resolve(__dirname,'..'),read=p=>fs.readFileSync(path.join(root,p),'utf8'),seed=JSON.parse(read('data/seed.json'));
const s=seed.ptSessions.find(s=>s.id==='pt_session_20261016');assert.equal(s.items.length,5);assert(s.items.every(i=>i.exerciseId));assert.equal(s.items[2].exerciseId,'pt_seatedrow');assert.match(s.items[4].points[0],/15kg·언더그립/);
for(const kind of ['ptlungerotation','ptlowcablecurl']){
 const first=P.pose(kind,0);let prev;
 for(let n=0;n<=1000;n++){
  const p=P.pose(kind,n/1001);assert.deepEqual(p.ankles,first.ankles);assert.deepEqual(p.hips,first.hips);assert.deepEqual(p.knees,first.knees);
  for(let i=0;i<2;i++)for(const [a,b,l] of [['hips','knees',.43],['knees','ankles',.425],['shoulders','elbows',.29],['elbows','wrists',.285]]){assert(Math.abs(P.len(P.sub(p[a][i],p[b][i]))-l)<1e-8,kind+' constant limb '+a);assert(p[a][i].every(Number.isFinite));}
  if(kind==='ptlungerotation'){
   assert.deepEqual(p.pelvisFrame.right,[1,0,0]);const ball=p.equipment.find(e=>e.type==='ball').at;
   for(const wrist of p.wrists)assert(Math.abs(P.len(P.sub(wrist,ball))-.12)<1e-9);
  }else{
   assert.deepEqual(p.front,first.front);const cable=p.equipment[0];assert(cable.pulley[1]<.2);assert.deepEqual(cable.pulley,first.equipment[0].pulley);
   assert.deepEqual(cable.handle,P.mix(p.wrists[0],p.wrists[1],.5));
   p.palmNormals.forEach((normal,i)=>{const arm=P.unit(P.sub(p.wrists[i],p.elbows[i]));assert(Math.abs(normal.reduce((n,v,j)=>n+v*arm[j],0))<1e-9);});
  }
  if(prev)for(let i=0;i<2;i++)assert(P.len(P.sub(p.wrists[i],prev.wrists[i]))<.025,kind+' continuous wrists');prev=p;
 }
}
assert(P.pose('ptlungerotation',.25).front[0]>0);assert(P.pose('ptlungerotation',.75).front[0]<0);assert(P.pose('ptlowcablecurl',.5).wrists[0][1]>P.pose('ptlowcablecurl',0).wrists[0][1]+.5);
const c={window:{}};vm.runInNewContext(read('js/exercise-media.js'),c);
for(const id of ['pt_lunge_ball_rotation','pt_low_cable_curl']){const m=c.window.ExerciseMedia[id];assert(m.visualNote.includes('예시'));assert.equal(m.images.length,2);const [a,b]=m.images.map(p=>fs.readFileSync(path.join(root,p)));assert(!a.equals(b));assert(m.viewer.endsWith('exercise='+id));}
console.log('PASS: confirmed PT session, two specific models, 2002 poses, stable feet/pelvis, arm/leg lengths, ball contact, low pulley and supinated palms, distinct preparation/action images.');
