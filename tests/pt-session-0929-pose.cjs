const assert=require('node:assert/strict'),P=require('../media/3d/poses.js');
const kinds=['sealrow','uprightrow','dbrdl'];
const expected={sealrow:['sealbench','dumbbells'],uprightrow:['ezbar'],dbrdl:['dumbbells']};
const near=(a,b,message,tolerance=1e-8)=>assert(Math.abs(a-b)<tolerance,message+': '+a+' != '+b);
const keys=['hip','head','chest','neck','hips','shoulders','elbows','wrists','knees','ankles'];
let samples=0;
for(const kind of kinds){
 const start=P.pose(kind,0,'pt_'+kind),end=P.pose(kind,.5,'pt_'+kind);let previous;
 assert.deepEqual(end.equipment.map(e=>e.type),expected[kind]);
 for(let frame=0;frame<=1000;frame++){
  const p=P.pose(kind,frame/1000,'pt_'+kind);samples++;
  for(const key of keys)assert(p[key].flat().every(Number.isFinite),kind+' finite '+key);
  for(let side=0;side<2;side++){
   for(const [a,b,length]of [['shoulders','elbows',.29],['elbows','wrists',.285],['hips','knees',.43],['knees','ankles',.425]])near(P.len(P.sub(p[a][side],p[b][side])),length,kind+' limb '+a);
   if(previous)assert(P.len(P.sub(p.wrists[side],previous.wrists[side]))<.007,kind+' continuous wrist path');
  }
  if(kind==='sealrow'){
   for(const key of ['hip','head','chest','neck','hips','shoulders','knees','ankles'])assert.deepEqual(p[key],start[key],'supported row body drift '+key);
   const bench=p.equipment[0];
   assert(p.wrists[0][1]<bench.center[1]-bench.size[1]/2-.02,'bar must remain below bench pad');
   near(p.up[1],0,'seal row torso stays horizontal');
  }else{
   assert.deepEqual(p.ankles,start.ankles,kind+' both feet remain planted');
   for(const ankle of p.ankles)near(ankle[1],.065,'foot sole height');
  }
  if(kind==='uprightrow'){
   assert.deepEqual(p.shoulders,start.shoulders,'upright row must not shrug');
   assert.deepEqual(p.head,start.head,'upright row head stays still');
   for(let i=0;i<2;i++){assert(p.elbows[i][1]<p.shoulders[i][1]-.03,'elbows stay below shoulders');near(p.wrists[i][0],start.wrists[i][0],'fixed EZ grip width');}
   near(p.wrists[0][1],p.wrists[1][1],'EZ bar remains level');
   assert(p.wrists[0][1]<p.chest[1],'bar remains below upper chest');
  }
  if(kind==='dbrdl'){
   const spine=P.unit(P.sub(p.head,p.hip));near(P.len(P.sub(spine,p.up)),0,'RDL spine stays in one neutral line');
   for(let i=0;i<2;i++){assert(p.wrists[i][1]<p.elbows[i][1],'RDL arms remain long below shoulders');assert(Math.abs(p.wrists[i][2]-p.shoulders[i][2])<.05,'RDL dumbbells follow the shoulders');}
  }
  previous=p;
 }
 if(kind==='sealrow'){assert(end.wrists[0][1]>start.wrists[0][1]+.30,'seal row pulls weight upward');assert(end.elbows[0][2]<start.elbows[0][2]-.15,'seal row elbows move toward hips');}
 if(kind==='uprightrow'){assert(end.wrists[0][1]>start.wrists[0][1]+.4,'upright bar rises');assert(Math.abs(end.elbows[0][0])>Math.abs(end.wrists[0][0])+.20,'upright elbows open outward');}
 if(kind==='dbrdl'){assert(end.hip[2]<start.hip[2]-.20,'RDL hips move backward');assert(end.head[1]<start.head[1]-.3,'RDL torso hinges');assert(end.wrists[0][1]<start.wrists[0][1]-.25,'RDL dumbbells descend');assert(Math.abs(end.wrists[0][1]-end.knees[0][1])<.06,'RDL end near knee level');}
 for(const key of keys)for(let i=0;i<start[key].flat().length;i++)near(previous[key].flat()[i],start[key].flat()[i],kind+' repeat seam',1e-7);
}
console.log(JSON.stringify({models:3,poseSamples:samples,finiteJoints:true,constantLimbLengths:true,supportedSealRow:true,neutralUprightRow:true,twoFootRDL:true,matchingEquipment:true}));
