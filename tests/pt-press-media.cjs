const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.resolve(__dirname,'..'),P=require('../media/3d/poses.js'),ctx={window:{}};
vm.runInNewContext(fs.readFileSync(path.join(root,'js/exercise-media.js'),'utf8'),ctx);
const seed=JSON.parse(fs.readFileSync(path.join(root,'data/seed.json'),'utf8'));
const near=(a,b,msg)=>assert(Math.abs(a-b)<1e-8,msg);
let samples=0;
for(const [id,kind]of [['pt_dumbbell_press','dumbbellpress'],['pt_incline_smith_press','smithincline']]){
 const m=ctx.window.ExerciseMedia[id],ex=seed.exercises.find(e=>e.id===id);
 assert.equal(m.kind,kind);assert.equal(m.images.length,2);assert.equal(m.captions.length,2);assert.equal(m.notes.length,2);
 assert.deepEqual(JSON.parse(JSON.stringify(m.focus)),ex.focus);assert(m.visualNote);
 for(const f of m.images){const bytes=fs.readFileSync(path.join(root,f));assert.equal(bytes.toString('ascii',0,4),'RIFF');assert.equal(bytes.toString('ascii',8,12),'WEBP');}
 const bottom=P.pose(kind,0,id),top=P.pose(kind,.5,id);let previous;
 // In the lowered position each forearm supports its weight vertically.
 for(let j=0;j<2;j++){near(bottom.wrists[j][0],bottom.elbows[j][0],'wrist/elbow horizontal stack');near(bottom.wrists[j][2],bottom.elbows[j][2],'wrist/elbow depth stack');assert(top.wrists[j][1]>bottom.wrists[j][1]+.25);}
 for(let i=0;i<=1000;i++){
  const p=P.pose(kind,i/1000,id);samples++;
  for(const key of ['hip','head','chest','neck','hips','shoulders','elbows','wrists','knees','ankles'])assert(p[key].flat().every(Number.isFinite),kind+' '+key);
  for(const key of ['hip','head','chest','neck','hips','shoulders','knees','ankles'])assert.deepEqual(p[key],bottom[key],kind+' body/feet drift: '+key);
  for(let j=0;j<2;j++){
   for(const [a,b,length]of [['shoulders','elbows',.29],['elbows','wrists',.285],['hips','knees',.43],['knees','ankles',.425]])near(P.len(P.sub(p[a][j],p[b][j])),length,kind+' limb length '+a);
   if(previous)assert(P.len(P.sub(p.wrists[j],previous.wrists[j]))<.005,kind+' discontinuous motion');
   near(p.ankles[j][1],.065,'planted feet');
   if(kind==='smithincline'){near(p.wrists[j][0],bottom.wrists[j][0],'fixed Smith grip width');near(p.wrists[j][2],bottom.wrists[j][2],'fixed Smith rail depth');}
  }
  near(p.wrists[0][1],p.wrists[1][1],'level weights');near(p.wrists[0][0],-p.wrists[1][0],'symmetry');
  if(kind==='dumbbellpress'){assert(p.wrists[1][0]-p.wrists[0][0]>.24,'dumbbells collide');assert.deepEqual(p.equipment.map(e=>e.type),['bench','dumbbells']);}
  else{assert.deepEqual(p.equipment.map(e=>e.type),['inclinebench','smith']);near(p.equipment[1].barZ,p.wrists[0][2],'bar attached to collars');near(p.up[1],.5,'inclined back support');}
  previous=p;
 }
 if(kind==='dumbbellpress')assert(top.wrists[1][0]<bottom.wrists[1][0]-.15,'dumbbells converge during press');
 else assert.equal(bottom.wrists[1][0],top.wrists[1][0]);
 for(const key of ['elbows','wrists'])for(let j=0;j<2;j++)assert(P.len(P.sub(previous[key][j],bottom[key][j]))<1e-7,'smooth repeat seam');
}
console.log(JSON.stringify({pressModels:2,poseSamples:samples,images:4,fixedBodyAndFeet:true,constantLimbLengths:true,smithVerticalRail:true,dumbbellsSeparate:true,coachingUnchanged:true}));
