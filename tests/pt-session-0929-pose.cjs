const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),P=require('../media/3d/poses.js');
const root=path.resolve(__dirname,'..');
const read=file=>fs.readFileSync(path.join(root,file),'utf8').replace(/^\uFEFF/,'');
const seed=JSON.parse(read('data/seed.json')),ctx={window:{}};
vm.runInNewContext(read('js/exercise-media.js'),ctx);
const media=ctx.window.ExerciseMedia;
const byId=id=>{const item=seed.exercises.find(e=>e.id===id);assert(item,id+' seed record missing');return item;};
const recordText=item=>JSON.stringify(item).replace(/\s+/g,'');
const seal=byId('pt_seal_row'),dyrow=byId('pt_uprightrow'),rdl=byId('pt_dumbbell_rdl');
assert(/한\s*개당\s*7\s*kg/i.test(seal.spec),'seal row keeps the confirmed per-dumbbell 7kg load');
assert(recordText(seal).includes('경사'),'seal row identifies the inclined chest support');
assert(recordText(rdl).includes('덤벨1개'),'RDL identifies one dumbbell');
assert(recordText(rdl).includes('성배'),'RDL identifies the goblet-style grip');
assert(/턱\s*(?:아래|밑)/.test(JSON.stringify(rdl)),'RDL records the confirmed under-chin start position');
assert.equal(dyrow.category,'등','D.Y. Row is filed with back exercises');
assert(dyrow.name.includes('해머 스트렝스 아이소-레터럴 D.Y. 로우'),'photo-confirmed machine name');
assert(/중량 미확인/.test(dyrow.spec),'unreadable training load stays unconfirmed');
assert(dyrow.prep.length>=2&&dyrow.cues.length>=4,'D.Y. Row preparation and action are recorded');
assert(recordText(dyrow).includes('가슴')&&recordText(dyrow).includes('아래·뒤'),'D.Y. Row records support and pull path');
assert(recordText(dyrow).includes('언더핸드'),'D.Y. Row records the confirmed underhand grip');
const dyMedia=media.pt_uprightrow;
assert.equal(dyMedia.pending,undefined,'D.Y. Row is no longer pending');
assert.equal(dyMedia.kind,'dyrow');
assert.equal(dyMedia.images.length,2);assert.equal(dyMedia.captions.length,2);assert.equal(dyMedia.notes.length,2);
assert.deepEqual(Array.from(dyMedia.images),['docs/images/guides/pt_uprightrow-start.webp','docs/images/guides/pt_uprightrow-end.webp']);
assert.equal(dyMedia.viewer,'media/3d/viewer.html?exercise=pt_uprightrow');

const models=[
 {kind:'sealrow',id:'pt_seal_row',equipment:['inclinesealbench','dumbbells']},
 {kind:'dyrow',id:'pt_uprightrow',equipment:['dyrowmachine']},
 {kind:'dbrdl',id:'pt_dumbbell_rdl',equipment:['goblet']}
];
const near=(a,b,message,tolerance=1e-8)=>assert(Math.abs(a-b)<tolerance,message+': '+a+' != '+b);
const keys=['hip','head','chest','neck','hips','shoulders','elbows','wrists','knees','ankles'];
let samples=0;
for(const model of models){
 const {kind,id}=model,start=P.pose(kind,0,id),end=P.pose(kind,.5,id);let previous;
 assert.deepEqual(end.equipment.map(e=>e.type),model.equipment,id+' equipment');
 for(let frame=0;frame<=1000;frame++){
  const p=P.pose(kind,frame/1000,id);samples++;
  for(const key of keys)assert(p[key].flat().every(Number.isFinite),id+' finite '+key);
  for(let side=0;side<2;side++){
   for(const [a,b,length]of [['shoulders','elbows',.29],['elbows','wrists',.285],['hips','knees',.43],['knees','ankles',.425]])near(P.len(P.sub(p[a][side],p[b][side])),length,id+' limb '+a);
   if(previous)assert(P.len(P.sub(p.wrists[side],previous.wrists[side]))<.007,id+' continuous wrist path');
  }
  assert.deepEqual(p.ankles,start.ankles,id+' both feet remain planted');
  for(const ankle of p.ankles)near(ankle[1],.065,id+' foot sole height');
  if(kind==='sealrow'){
   for(const key of ['hip','head','chest','neck','hips','shoulders','knees','ankles'])assert.deepEqual(p[key],start[key],'incline-supported row body drift '+key);
   assert(p.up[1]>.2&&p.up[1]<.85,'seal row torso must stay inclined');
   assert(Math.abs(p.up[2])>.5,'seal row chest must follow the incline pad');
  }else if(kind==='dyrow'){
   for(const key of ['hip','head','chest','neck','hips','shoulders','knees','ankles'])assert.deepEqual(p[key],start[key],'D.Y. Row supported body drift '+key);
   assert.equal(p.equipment[0].pivots.length,2,'D.Y. Row has independent left/right pivots');
   for(let side=0;side<2;side++)assert(p.equipment[0].pivots[side][1]>p.shoulders[side][1]+.3,'D.Y. Row pivot stays overhead');
  }else{
   const [left,right]=p.wrists;
   assert(Math.abs(left[0]-right[0])<.13,'RDL hands stay close around one dumbbell');
   near((left[0]+right[0])/2,0,'RDL grip remains centered',1e-7);
   near(left[1],right[1],'RDL hands stay level');near(left[2],right[2],'RDL hands share one dumbbell depth');
   const spine=P.unit(P.sub(p.head,p.hip));near(P.len(P.sub(spine,p.up)),0,'RDL spine stays in one neutral line');
  }
  previous=p;
 }
 if(kind==='sealrow'){
  assert(end.wrists[0][1]>start.wrists[0][1]+.15,'seal row pulls the weight upward');
  assert(P.len(P.sub(end.wrists[0],end.hip))<P.len(P.sub(start.wrists[0],start.hip)),'seal row pulls the weight toward the body');
 }else if(kind==='dyrow'){
  assert(end.wrists[0][1]<start.wrists[0][1]-.30,'D.Y. Row pulls the handle downward');
  assert(end.wrists[0][2]<start.wrists[0][2]-.15,'D.Y. Row pulls the handle back toward the torso');
  assert(P.len(P.sub(end.wrists[0],end.chest))<P.len(P.sub(start.wrists[0],start.chest)),'D.Y. Row finishes closer to the torso');
 }else{
  const startGrip=P.mix(start.wrists[0],start.wrists[1],.5),endGrip=P.mix(end.wrists[0],end.wrists[1],.5);
  assert(startGrip[1]>start.chest[1]&&startGrip[1]<start.head[1],'RDL starts with the goblet dumbbell under the chin');
  assert(end.hip[2]<start.hip[2]-.15,'RDL hips move backward');
  assert(end.hip[1]<start.hip[1]-.12,'RDL lowers the hips farther during the hinge');
  assert(P.len(P.sub(end.hips[0],end.ankles[0]))<P.len(P.sub(start.hips[0],start.ankles[0]))-.05,'RDL gains knee flexion while keeping both feet planted');
  assert(end.head[1]<start.head[1]-.3,'RDL torso hinges');
  assert(endGrip[1]<startGrip[1]-.3,'the single dumbbell lowers from under the chin during the hinge');
 }
 for(const key of keys)for(let i=0;i<start[key].flat().length;i++)near(previous[key].flat()[i],start[key].flat()[i],id+' repeat seam',1e-7);
}
console.log(JSON.stringify({models:3,poseSamples:samples,finiteJoints:true,constantLimbLengths:true,inclineSupportedSealRow:true,isoLateralDYRow:true,singleGobletRDL:true,pendingVisuals:0,matchingEquipment:true}));
