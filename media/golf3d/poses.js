/* Golf-only, right-handed teaching model. Metres; -X target, +Y up, +Z ball.
   One shared grip, fixed bone/shaft lengths, and rotation about the tilted spine. */
(function(root){
'use strict';
const add=(a,b)=>a.map((v,i)=>v+b[i]),sub=(a,b)=>a.map((v,i)=>v-b[i]),mul=(a,s)=>a.map(v=>v*s);
const dot=(a,b)=>a.reduce((s,v,i)=>s+v*b[i],0),len=a=>Math.hypot(...a),unit=a=>mul(a,1/(len(a)||1));
const mix=(a,b,t)=>add(mul(a,1-t),mul(b,t)),clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const smooth=t=>t*t*(3-2*t);
const clubs={
 golf_driver:{name:'드라이버',length:1.08,stance:.235,ball:[-.20,.065,.98],driver:true},
 golf_iron5:{name:'5번 아이언',length:.99,stance:.205,ball:[-.065,.027,.87]},
 golf_iron7:{name:'7번 아이언',length:.96,stance:.19,ball:[-.025,.027,.82]},
 golf_ironp:{name:'P 아이언',length:.91,stance:.17,ball:[.015,.027,.75]}
};
const stages=[
 {t:0,name:'준비',cue:'골반을 접고, 두 손과 클럽을 공 앞에 둡니다.'},
 {t:.18,name:'백스윙',cue:'몸통이 돌면서 손과 클럽이 함께 올라갑니다.'},
 {t:.38,name:'탑',cue:'왼팔과 클럽 위치를 확인하세요. 여기서 다음 순서를 살펴봅니다.'},
 {t:.47,name:'체중이동',cue:'왼쪽으로 지지를 옮깁니다. 상체가 먼저 덤비지 않게 확인합니다.'},
 {t:.56,name:'손 내리기',cue:'손이 내려오는 구간을 천천히 확인하세요.'},
 {t:.67,name:'임팩트',cue:'왼발의 지지를 유지하며 몸통이 돌고, 클럽이 공을 지납니다.'},
 {t:.80,name:'팔로스루',cue:'임팩트를 지난 팔과 클럽이 타깃 쪽으로 이어집니다.'},
 {t:1,name:'피니시',cue:'왼발 위에서 균형을 잡고 마무리합니다.'}
];
function ik(a,b,l1,l2,pole){
 const d=len(sub(b,a)),axis=unit(sub(b,a));
 const along=(l1*l1-l2*l2+d*d)/(2*Math.max(d,.0001));
 const perpendicular=unit(sub(pole,mul(axis,dot(pole,axis))));
 return add(add(a,mul(axis,along)),mul(perpendicular,Math.sqrt(Math.max(0,l1*l1-along*along))));
}
function direction(a,b,t){
 a=unit(a);b=unit(b);const angle=Math.acos(clamp(dot(a,b),-1,1));
 return angle<.001?mix(a,b,t):add(mul(a,Math.sin((1-t)*angle)/Math.sin(angle)),mul(b,Math.sin(t*angle)/Math.sin(angle)));
}
function pose(id,t){
 const club=clubs[id];if(!club)throw new Error('Unknown golf club: '+id);
 t=clamp(t,0,1);
 const contact=add(club.ball,[.061,club.driver?-.009:.016,-.022]);
 const address=[-.025,0,.39];
 address[1]=contact[1]+Math.sqrt(club.length**2-(contact[0]-address[0])**2-(contact[2]-address[2])**2);
 const impact=[-.13,address[1]+.015,.39];
 impact[1]=contact[1]+Math.sqrt(club.length**2-(contact[0]-impact[0])**2-(contact[2]-impact[2])**2);
 // Pause-friendly key poses; no backwards interpolation from finish to address.
 const keys=[
  {t:0,turn:0,hip:0,shift:0,hinge:.37,rise:0,heel:0,h:address,d:sub(contact,address)},
  {t:.18,turn:.58,hip:.22,shift:.018,hinge:.37,rise:0,heel:0,h:[.36,1.02,.33],d:[.88,-.38,.28]},
  {t:.28,turn:.96,hip:.40,shift:.025,hinge:.37,rise:0,heel:0,h:[.46,1.32,.20],d:[.35,.93,-.12]},
  {t:.38,turn:1.30,hip:.58,shift:.025,hinge:.37,rise:0,heel:0,h:[.36,1.58,.01],d:[-.93,.20,-.31]},
  {t:.47,turn:1.18,hip:.36,shift:-.065,hinge:.37,rise:-.012,heel:0,h:[.38,1.49,.045],d:[-.60,.73,-.32]},
  {t:.56,turn:.65,hip:-.20,shift:-.09,hinge:.37,rise:-.014,heel:.025,h:[.31,1.09,.30],d:[.75,.65,-.12]},
  {t:.67,turn:-.30,hip:-.65,shift:-.11,hinge:.37,rise:0,heel:.08,h:impact,d:sub(contact,impact)},
  {t:.80,turn:-1.05,hip:-1.10,shift:-.12,hinge:.25,rise:.012,heel:.15,h:[-.53,1.23,.24],d:[-.89,-.17,.42]},
  {t:1,turn:-1.58,hip:-1.48,shift:-.12,hinge:.10,rise:.03,heel:.19,h:[-.33,1.65,-.075],d:[.82,-.26,-.51]}
 ];
 for(const key of keys)if(key.t!==0&&key.t!==.67)key.h[1]-=(1.08-club.length)*.32;
 let n=keys.findIndex(k=>k.t>=t);if(n<1)n=1;const a=keys[n-1],b=keys[n],u=smooth((t-a.t)/(b.t-a.t));
 const lerp=k=>a[k]+(b[k]-a[k])*u,hinge=lerp('hinge'),turn=lerp('turn'),hipTurn=lerp('hip');
 const hip=[lerp('shift'),.89+lerp('rise')-(1.08-club.length)*.32,-.10];
 const up=[0,Math.cos(hinge),Math.sin(hinge)];
 const right=[Math.cos(turn),Math.sin(turn)*Math.sin(hinge),-Math.sin(turn)*Math.cos(hinge)];
 const front=[-Math.sin(turn),Math.cos(turn)*Math.sin(hinge),-Math.cos(turn)*Math.cos(hinge)].map(v=>-v);
 const chest=add(hip,mul(up,.39)),neck=add(hip,mul(up,.51));
 const shoulders=[-1,1].map(s=>add(add(hip,mul(up,.455)),mul(right,s*.195)));
 const hips=[-1,1].map(s=>add(hip,[s*.10*Math.cos(hipTurn),0,-s*.10*Math.sin(hipTurn)]));
 const ankles=[[-club.stance,.10,0],[club.stance,.10+lerp('heel'),-.025*lerp('heel')/.19]];
 const knees=hips.map((v,i)=>ik(v,ankles[i],.43,.43,[i===0?-.10:.10,0,1]));
 const grip=mix(a.h,b.h,u),dir=direction(a.d,b.d,u),wrists=[grip,add(grip,mul(dir,.075))];
 const elbows=shoulders.map((v,i)=>ik(v,wrists[i],.31,.30,[i===0?-.65:.90,-.40,.65]));
 const head=add(neck,mul(up,.16)),tip=add(grip,mul(dir,club.length));
 let stage=0;for(let i=1;i<stages.length;i++)if(t>=stages[i].t-.00001)stage=i;
 return {id,kind:'golf',t,stage,hip,chest,neck,head,up,right,front,hips,shoulders,knees,ankles,elbows,wrists,
  grip,dir,tip,ball:club.ball,contact,club,heel:lerp('heel'),turn,hipTurn};
}
const api={pose,clubs,stages,add,sub,mul,len,unit,dot,mix};
if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.GolfPoses=api;
})(typeof window!=='undefined'?window:globalThis);
