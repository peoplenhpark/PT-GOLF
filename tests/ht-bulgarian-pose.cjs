const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),P=require('../media/3d/poses.js');
const root=path.resolve(__dirname,'..'),ctx={window:{}};vm.runInNewContext(fs.readFileSync(path.join(root,'js/exercise-media.js'),'utf8'),ctx);
const id='ht_bulgarian_split_squat',entry=ctx.window.ExerciseMedia[id];assert.equal(entry.kind,'bulgariansplit');assert.equal(entry.images.length,2);assert(entry.visualNote.includes('例')||entry.visualNote.includes('예시'));
for(const file of entry.images)assert(fs.statSync(path.join(root,file)).size>10000);
const start=P.pose(entry.kind,0,id),end=P.pose(entry.kind,.5,id),keys=['hip','head','chest','neck','hips','shoulders','elbows','wrists','knees','ankles'];
const near=(a,b,label)=>assert(Math.abs(a-b)<1e-7,label+': '+a+' != '+b);let previous;
for(let frame=0;frame<=1000;frame++){
 const p=P.pose(entry.kind,frame/1000,id);
 for(const key of keys){assert(p[key].flat().every(Number.isFinite));if(previous)assert(Math.max(...p[key].flat().map((n,i)=>Math.abs(n-previous[key].flat()[i])))<.012,'continuous '+key);}
 for(let side=0;side<2;side++)for(const [a,b,length] of [['shoulders','elbows',.29],['elbows','wrists',.285],['hips','knees',.43],['knees','ankles',.425]])near(P.len(P.sub(p[a][side],p[b][side])),length,a);
 assert.deepEqual(p.ankles,start.ankles,'both support contacts fixed');assert.deepEqual(p.equipment,start.equipment,'bench stays fixed');
 assert.equal(p.equipment[0].type,'splitbench');assert(p.knees[1][1]>.18,'rear knee clears floor');
 assert(p.hip[2]>p.equipment[0].center[2]+p.equipment[0].size[2]/2+.25,'pelvis never sits on rear bench');
 assert(p.footDirections[1][2]<0 && p.footDirections[1][1]<0,'rear instep points back and down');
 near(P.len(P.sub(P.unit(P.sub(p.head,p.hip)),p.up)),0,'neutral spine');previous=p;
}
near(start.ankles[0][1]-.045,.02,'front shoe sole stays near floor');
const bench=start.equipment[0],top=bench.center[1]+bench.size[1]/2,dir=start.footDirections[1];
const rearBottom=start.ankles[1][1]+dir[1]*.05-Math.sqrt(.045**2*(1-dir[1]**2)+.113**2*dir[1]**2);
assert(Math.abs(rearBottom-top)<.015,'rear shoe rests on the pad surface');
assert(end.hip[1]<start.hip[1]-.25);assert(end.knees[0][2]>end.hip[2]+.35,'front thigh flexes forward');assert(end.knees[1][1]<start.knees[1][1]-.25,'rear knee lowers');
for(const key of keys)start[key].flat().forEach((n,i)=>near(n,previous[key].flat()[i],'repeat seam'));
console.log('PASS: HT split squat, 1001 frames, fixed front sole/rear instep, stable bench, constant limbs, neutral spine and continuous motion.');
