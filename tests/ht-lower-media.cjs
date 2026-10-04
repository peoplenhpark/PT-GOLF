const fs=require('fs'),path=require('path'),vm=require('vm'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..'),ctx={window:{}};vm.runInNewContext(fs.readFileSync(root+'/js/exercise-media.js','utf8'),ctx);
const release={};vm.runInNewContext(fs.readFileSync(root+'/release-assets.js','utf8'),release);
const {pose,len,sub}=require(root+'/media/3d/poses.js'),variants=ctx.window.ExerciseMedia.ht_lower_six.variants;
assert.equal(variants.length,6);
for(const v of variants){
 const a=pose(v.kind,0,v.id),b=pose(v.kind,.5,v.id);
 assert.notDeepEqual(v.kind==='legcurl'||v.kind==='htlegextension'?a.ankles:a.hip,v.kind==='legcurl'||v.kind==='htlegextension'?b.ankles:b.hip,v.id+' moves');
 for(const im of v.images){assert(fs.existsSync(path.join(root,im)));assert(release.PTGolfRelease.exercises.ht_lower_six.includes(im));}
 for(let i=0;i<=1000;i++){
  const p=pose(v.kind,i/1001,v.id);for(const key of ['hips','shoulders','elbows','wrists','knees','ankles'])assert(p[key].flat().every(Number.isFinite));
  if(v.kind!=='legcurl')for(let side=0;side<2;side++)for(const [x,y,L] of [['shoulders','elbows',.29],['elbows','wrists',.285],['hips','knees',.43],['knees','ankles',.425]])assert(Math.abs(len(sub(p[x][side],p[y][side]))-L)<.001,v.kind+' '+x+' '+i);
  if(['htwidegoblet','htnarrowgoblet','htfloorsplit','htstiffdeadlift'].includes(v.kind))assert.deepEqual(p.ankles,a.ankles);
  if(v.kind==='htlegextension'){assert.deepEqual(p.knees,a.knees);assert.equal(p.ankles[0][1],p.ankles[1][1]);assert.equal(p.ankles[0][2],p.ankles[1][2]);}
  if(v.kind==='htfloorsplit')assert.equal(p.equipment.length,0);
 }
}
assert(pose('htwidegoblet',0).ankles[1][0]>pose('htnarrowgoblet',0).ankles[1][0]);
console.log('PASS: six HT lower movements, 6006 frames, fixed foot supports, bilateral extension, correct equipment and offline assets.');
