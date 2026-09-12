/* Actual body and club trajectories, sampled at 120 Hz. No independent pose keys.
   +X = lead/target, +Y = up, +Z = ball. See SOURCE.md for provenance. */
(function(root){
'use strict';
const M=typeof module!=='undefined'&&module.exports?require('./motion.js'):root.GolfMotion;
const add=(a,b)=>a.map((v,i)=>v+b[i]),sub=(a,b)=>a.map((v,i)=>v-b[i]),mul=(a,s)=>a.map(v=>v*s);
const dot=(a,b)=>a.reduce((s,v,i)=>s+v*b[i],0),len=a=>Math.hypot(...a),unit=a=>mul(a,1/(len(a)||1));
const cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]],mix=(a,b,t)=>add(mul(a,1-t),mul(b,t));
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const clubs={golf_driver:{name:'드라이버',length:1.08,driver:true},golf_iron5:{name:'5번 아이언',length:.99},golf_iron7:{name:'7번 아이언',length:.96},golf_ironp:{name:'P 아이언',length:.91}};
const names=['준비','백스윙','탑','체중이동','손 내리기','임팩트','팔로스루','피니시'];
const cues=['골반을 접은 준비 자세에서 시작합니다.','몸통 회전과 함께 팔과 클럽이 올라갑니다.','백스윙에서 다운스윙으로 방향이 바뀌는 구간입니다.','하체의 지지가 옮겨지며 다운스윙으로 이어집니다.','몸 앞쪽으로 손이 내려오고 클럽이 뒤따릅니다.','왼쪽 지지 위에서 몸통이 돌며 클럽이 공을 지납니다.','팔과 클럽의 진행 방향을 따라 몸이 회전합니다.','오른발 뒤꿈치가 들리고 왼발 위에서 마무리합니다.'];
const stages=M.stages.map((t,i)=>({t,name:names[i],cue:cues[i]}));
// Cubic interpolation preserves velocity across recorded frames and stage labels.
function sample(t){
 const q=clamp(t,0,1)*(M.frames.length-1),i=Math.floor(q),u=q-i;
 const f=n=>M.frames[clamp(n,0,M.frames.length-1)],a=f(i-1),b=f(i),c=f(i+1),d=f(i+2);
 const values=b.map((v,k)=>.5*((2*v)+(-a[k]+c[k])*u+(2*a[k]-5*v+4*c[k]-d[k])*u*u+(-a[k]+3*v-3*c[k]+d[k])*u*u*u));
 return Object.fromEntries(M.names.map((n,j)=>[n,values.slice(j*3,j*3+3)]));
}
const initial=sample(0),shaftLength=len(sub(initial.shaft3,initial.shaft1))+.33;
function rawPose(t){
 const a=sample(t),dir=unit(sub(a.shaft2,a.shaft1)),grip=add(a.shaft1,mul(dir,-.33));
 const tip=add(grip,mul(dir,shaftLength));
 const up=unit(sub(mix(a.lshoulder,a.rshoulder,.5),a.hip));
 const lateral=sub(a.lshoulder,a.rshoulder),right=unit(sub(lateral,mul(up,dot(lateral,up)))),front=unit(cross(right,up));
 const sideOffset=sub(a.shaft3,a.shaft2),clubSide=unit(sub(sideOffset,mul(dir,dot(sideOffset,dir))));
 return {...a,dir,grip,tip,up,right,front,clubSide};
}
// Marker endpoints move slightly on skin. Keep limb lengths fixed while using
// the measured elbow/knee plane, wrist trajectory and foot contact positions.
function joint(a,b,l1,l2,measured){
 const axis=unit(sub(b,a)),d=len(sub(b,a)),pole=sub(measured,a);
 const bend=unit(sub(pole,mul(axis,dot(pole,axis))));
 const along=(l1*l1-l2*l2+d*d)/(2*d);
 return add(add(a,mul(axis,along)),mul(bend,Math.sqrt(Math.max(0,l1*l1-along*along))));
}
const impact=rawPose(stages[5].t);
function pose(id,t){
 const club=clubs[id];if(!club)throw new Error('Unknown golf club: '+id);
 t=clamp(t,0,1);const a=rawPose(t),scale=club.length/shaftLength;
 const pos=v=>mul(v,scale),pair=(l,r)=>[pos(a[l]),pos(a[r])];
 const shoulders=pair('lshoulder','rshoulder'),hip=pos(a.hip),shoulderCenter=mix(...shoulders,.5);
 const neck=add(shoulderCenter,mul(a.up,.026*scale)),head=pos(a.head);
 const ball=add(pos(impact.tip),[.045*scale,0,0]);if(!club.driver)ball[1]=.027*scale;
 const hips=pair('lhip','rhip'),wrists=pair('lwrist','rwrist'),ankles=pair('lankle','rankle');
 const elbows=shoulders.map((v,i)=>joint(v,wrists[i],.35*scale,.285*scale,pos(a[i===0?'lelbow':'relbow'])));
 const knees=hips.map((v,i)=>joint(v,ankles[i],.47*scale,.44*scale,pos(a[i===0?'lknee':'rknee'])));
 let stage=0;for(let i=1;i<stages.length;i++)if(t>=stages[i].t-1e-8)stage=i;
 return {id,kind:'golf',source:M.source,t,stage,scale,hip,neck,head,chest:mix(hip,neck,.78),up:a.up,right:a.right,front:a.front,
  headFront:unit(a.headFront),headUp:unit(a.headUp),shoulders,hips,elbows,wrists,knees,ankles,
  feet:[{heel:pos(a.lheel),toe:pos(a.ltoe)},{heel:pos(a.rheel),toe:pos(a.rtoe)}],
  grip:pos(a.grip),hands:[pos(a.grip),pos(add(a.grip,mul(a.dir,.095)))],dir:a.dir,tip:pos(a.tip),clubSide:a.clubSide,
  ball,contact:pos(impact.tip),club,hipTurn:Math.atan2(a.lhip[2]-a.rhip[2],a.lhip[0]-a.rhip[0])};
}
const api={pose,clubs,stages,duration:M.duration,source:M.source,add,sub,mul,len,unit,dot,cross,mix};
if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.GolfPoses=api;
})(typeof window!=='undefined'?window:globalThis);
