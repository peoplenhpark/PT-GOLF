const fs=require('fs'),path=require('path'),vm=require('vm'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..');
const {pose,len,sub}=require(root+'/media/3d/poses.js');
const ctx={window:{}};vm.runInNewContext(fs.readFileSync(root+'/js/exercise-media.js','utf8'),ctx);
const m=ctx.window.ExerciseMedia,entries=[m.ht_wide_dumbbell,...m.ht_upper_form.variants];
const release={};vm.runInNewContext(fs.readFileSync(root+'/release-assets.js','utf8'),release);
for(const entry of entries){
 const initial=pose(entry.kind,0,entry.id),active=pose(entry.kind,.5,entry.id);
 assert.notDeepEqual(initial.wrists,active.wrists,entry.id+' animates');
 for(const img of entry.images){assert(fs.existsSync(path.join(root,img)));assert(release.PTGolfRelease.exercises[entry.id==='ht_wide_dumbbell'?entry.id:'ht_upper_form'].includes(img));}
 for(let n=0;n<=1000;n++){
  const p=pose(entry.kind,n/1001,entry.id);
  for(const k of ['hips','shoulders','elbows','wrists','knees','ankles'])assert(p[k].flat().every(Number.isFinite));
  if(['sumodumbbell','onearmrow','preachercurl','lyingextension'].includes(entry.kind)){
   for(let side=0;side<2;side++)for(const [a,b,L] of [['shoulders','elbows',.29],['elbows','wrists',.285],['hips','knees',.43],['knees','ankles',.425]])assert(Math.abs(len(sub(p[a][side],p[b][side]))-L)<.001,entry.kind+' '+a+' '+side+' at '+n);
  }
  if(['preachercurl','lyingextension'].includes(entry.kind)){assert.deepEqual(p.elbows,initial.elbows);assert.deepEqual(p.ankles,initial.ankles);}
  if(entry.kind==='onearmrow'){assert.deepEqual(p.wrists[0],initial.wrists[0]);assert.deepEqual(p.knees[0],initial.knees[0]);assert.deepEqual(p.ankles,initial.ankles);}
  if(entry.kind==='sumodumbbell')assert.deepEqual(p.ankles,initial.ankles);
 }
}
console.log('PASS: 7 HT movements, 7007 finite frames, new-model limb lengths, stationary supports, moving wrists, all variant images in offline bundles.');
