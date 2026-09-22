/* Exercise-specific joint poses in metres. x=left/right, y=up, z=front.
   Coaching variants come from seed v33; rendering never modifies exercise records. */
(function(root){
'use strict';
const add=(a,b)=>a.map((v,i)=>v+b[i]), sub=(a,b)=>a.map((v,i)=>v-b[i]), mul=(a,k)=>a.map(v=>v*k);
const dot=(a,b)=>a.reduce((n,v,i)=>n+v*b[i],0), len=a=>Math.hypot(...a);
const unit=a=>mul(a,1/(len(a)||1)), cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
const mix=(a,b,t)=>a.map((v,i)=>v+(b[i]-v)*t), clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const smooth=t=>{t=clamp(t,0,1);return t*t*(3-2*t);};
function ik(a,b,L1,L2,guide){
 const d=sub(b,a),n=unit(d),dist=clamp(len(d),.001,L1+L2-.0001);
 const along=(L1*L1-L2*L2+dist*dist)/(2*dist);
 let side=sub(guide,mul(n,dot(guide,n)));
 if(len(side)<.001)side=cross(n,[0,0,1]);
 return add(add(a,mul(n,along)),mul(unit(side),Math.sqrt(Math.max(0,L1*L1-along*along))));
}
function base(hip=[0,.90,0],lean=0,yaw=0,roll=0){
 let up=[0,Math.cos(lean),Math.sin(lean)],front=[0,-Math.sin(lean),Math.cos(lean)],right=[1,0,0];
 const rot=a=>[Math.cos(yaw)*a[0]+Math.sin(yaw)*a[2],a[1],-Math.sin(yaw)*a[0]+Math.cos(yaw)*a[2]];
 up=rot(up);front=rot(front);right=rot(right);
 if(roll){const r=a=>[a[0]*Math.cos(roll)-a[1]*Math.sin(roll),a[0]*Math.sin(roll)+a[1]*Math.cos(roll),a[2]];up=r(up);front=r(front);right=r(right);}
 const local=(x,y,z)=>add(hip,add(mul(right,x),add(mul(up,y),mul(front,z))));
 const p={hip,up,front,right,chest:local(0,.39,0),neck:local(0,.57,0),head:local(0,.70,0),hips:[],shoulders:[],elbows:[],wrists:[],knees:[],ankles:[],equipment:[],target:[0,.95,0],distance:3.9};
 for(let s of [-1,1]){p.hips.push(local(s*.105,0,0));p.shoulders.push(local(s*.215,.47,0));p.elbows.push(local(s*.23,.18,.025));p.wrists.push(local(s*.23,-.10,.025));p.knees.push([s*.12,.48,.04]);p.ankles.push([s*.13,.065,.04]);}
 return p;
}
function arms(p,wrists,guides){p.wrists=wrists;p.elbows=p.shoulders.map((a,i)=>ik(a,wrists[i],.29,.285,guides?.[i]||[i?1:-1,-.3,0]));}
function legs(p,ankles,guides){p.ankles=ankles;p.knees=p.hips.map((a,i)=>ik(a,ankles[i],.43,.425,guides?.[i]||[0,0,1]));}
function seat(q=0){const p=base([0,.59,0]);legs(p,[[-.14,.065,.44],[.14,.065,.44]]);p.equipment.push({type:'seat'});return p;}
function supine(y=.145){
 const p=base([0,y,0],-Math.PI/2);p.target=[0,.45,-.05];p.distance=3.3;
 p.knees=[[-.105,y,.42],[.105,y,.42]];p.ankles=[[-.105,y,.84],[.105,y,.84]];
 p.elbows=[[-.23,y,-.24],[.23,y,-.24]];p.wrists=[[-.23,y,.045],[.23,y,.045]];p.equipment.push({type:'mat'});return p;
}
function side(){
 const p=base([0,.23,0],0,0,Math.PI/2);p.target=[-.15,.4,.20];p.distance=3.25;
 p.knees=[ [.39,.14,.15],[.39,.34,.15] ];p.ankles=[[.75,.10,.29],[.75,.28,.29]];
 p.elbows=[[-.50,.10,.24],[-.40,.41,.27]];p.wrists=[[-.73,.11,.10],[-.47,.40,.53]];p.equipment.push({type:'mat'});return p;
}
function pose(kind,t,id){
 t=clamp(t,0,.99999);
 // Pause at each endpoint; controlled return.
 const q=t<.12?0:t<.46?smooth((t-.12)/.34):t<.60?1:1-smooth((t-.60)/.40);
 let p=base(), stage=t<.12?0:t<.60?1:2;
 const S=[-1,1];
 if(['squat','halfsquat','frontsquat','heelsquat','goblet','widesquat','vsquat'].includes(kind)){
  const wide=kind==='widesquat',half=kind==='halfsquat',v=kind==='vsquat';
  const width=wide?.32:.17, drop=half?.18:.39;
  p=base([0,.9-drop*q,-.23*q],v?-.12+.3*q:.1+.36*q);
  legs(p,S.map(s=>[s*width,.065,0]),S.map(s=>[s*(wide?.6:.18),0,1]));
  if(['goblet','frontsquat'].includes(kind)){
   const wrists=S.map(s=>add(p.chest,[s*(kind==='goblet'?.07:.23),.07,.17]));
   arms(p,wrists,kind==='frontsquat'?[[0,.1,1],[0,.1,1]]:[[0,-1,1],[0,-1,1]]);
   p.equipment.push({type:kind==='goblet'?'goblet':'bar'});
  }else arms(p,S.map(s=>add(p.chest,[s*.20,-.06,.43])),S.map(s=>[s,-1,0]));
  if(kind==='heelsquat')p.equipment.push({type:'heelpad'});
  if(v)p.equipment.push({type:'vsquat'});
 }else if(['tbalance','sldl'].includes(kind)){
  const a=.12+q*.92;p=base([-.08,kind==='tbalance'?.915:.90-.02*q,-.04*q],a);
  const foot=[-.105,.065,0],back=add(p.hips[1],[0,-.855*Math.cos(a),-.855*Math.sin(a)]);
  legs(p,[foot,back]);
  if(kind==='tbalance')arms(p,S.map(s=>add(p.shoulders[s===-1?0:1],[s*.03,-.53*Math.cos(a),-.53*Math.sin(a)])),S.map(s=>[s,-1,0]));
  else {arms(p,p.shoulders.map(a=>add(a,[0,-.57,0])));p.equipment.push({type:'dumbbells'});}
 }else if(kind==='stepup'){
  p=base([-.06,.80+.30*q,.04+.10*q],.10*(1-q));
  legs(p,[[-.12,.365,.27],[.12,.065+.30*q,-.24+.51*q]]);
  arms(p,p.shoulders.map((a,i)=>add(a,[0,-.48,(i?1:-1)*.18*q])));
  p.equipment.push({type:'step'});
 }else if(kind==='rotationlunge'){
  p=base([-.04,.9-.32*q,-.12*q],.16+.08*q,.20*q);
  // Stable front foot; opposite foot steps back.
  legs(p,[[-.12,.065,.18],[.12,.065,-.06-.65*q]],[[0,0,1],[0,0,1]]);
  arms(p,S.map(s=>add(p.chest,[s*.14+.10*q,-.08,.47])));
  p.equipment.push({type:'dumbbells'});
 }else if(kind==='sidelunge'){
  // Wide lateral lunge: one leg receives the hip, the other stays long.
  p=base([-.17*q,.90-.25*q,-.09*q],.12+.18*q);
  // Lock the non-support leg long before loading the bent leg.
  const outsideHip=p.hips[1],longLeg=.854,drop=outsideHip[1]-.065;
  const reach=Math.sqrt(Math.max(.02,longLeg*longLeg-drop*drop-outsideHip[2]*outsideHip[2]));
  const outside=[outsideHip[0]+reach,.065,0];
  legs(p,[[-.36,.065,0],outside],[[-.70,0,.40],[.20,.85,.55]]);
  arms(p,S.map(s=>add(p.chest,[s*.18,-.12,.42])),S.map(s=>[s,-.35,.45]));
  p.target=[-.12,.52,.05];p.distance=4.0;
 }else if(kind==='hipopenclose'){
  // Supported single-leg hinge: the free leg extends back, then pelvis and chest open together.
  const lean=.14+.66*q,turn=.55*q;
  p=base([-.08,.90-.025*q,-.05*q],lean,turn);
  const support=[-.105,.065,0],trail=add(p.hips[1],mul(p.up,-.855));
  legs(p,[support,trail],[[0,.15,1],[0,-.15,1]]);
  arms(p,[[-.58,1.12,.28],add(p.shoulders[1],[.04,-.50,.14])],[[-1,.10,.25],[1,-.70,.20]]);
  p.equipment.push({type:'supportbar'});p.target=[-.02,.76,.02];p.distance=4.15;
 }else if(kind==='bosu'){
  const turn=t<.26?smooth(t/.26):t<.72?1:1-smooth((t-.72)/.28);
  const sit=t<.26?0:t<.48?smooth((t-.26)/.22):t<.64?1:1-smooth((t-.64)/.20);
  p=base([-.08,1.07-.29*sit,-.18*sit],.17+.23*sit,.38*turn);
  legs(p,[[-.105,.235,.035],[.12,.235+.13*(1-sit),-.22]],[[0,0,1],[0,0,1]]);
  const ball=add(p.chest,[.26*turn,.03+.10*Math.sin(turn*Math.PI),.42]);
  arms(p,[add(ball,[-.10,0,0]),add(ball,[.10,0,0])]);
  p.equipment.push({type:'bosu'},{type:'ball',at:ball});
  stage=t<.26?0:t<.64?1:2;
 }else if(kind==='curl'){
  p=base([0,.90,0],.07);
  arms(p,S.map(s=>[s*.235,.91+.54*q,.17]),S.map(s=>[s*.05,-1,-1]));
  p.equipment.push({type:'bar'});
 }else if(kind==='lateral'){
  p=base();p.elbows=S.map(s=>add(p.shoulders[s===-1?0:1],[s*.29*Math.sin(q*1.5),-.29*Math.cos(q*1.5),.035]));
  p.wrists=p.elbows.map((a,i)=>add(a,[S[i]*.275*Math.sin(q*1.5),-.275*Math.cos(q*1.5),.025]));
  p.equipment.push({type:'dumbbells'});p.distance=4.2;
 }else if(kind==='pullup'){
  p=base([0,1.10+.33*q,0],-.07*q);
  arms(p,[[-.27,2.13,.08],[.27,2.13,.08]],[[ -1,-1,.3],[1,-1,.3]]);
  legs(p,S.map(s=>[s*.12,.30+.33*q,-.24]));
  p.equipment.push({type:'pullup'});p.target=[0,1.2,0];p.distance=4.5;
 }else if(['latpull','row','machinerow','chestpress','pecdeck'].includes(kind)){
  p=seat();
  if(kind==='latpull'){
   p.ankles=p.ankles.map(a=>[a[0],.10,a[2]]);
   arms(p,S.map(s=>[s*.31,1.62-.43*q,.18]),S.map(s=>[s,-1,0]));
   p.equipment.push({type:'latpull'},{type:'bar'});
  }else if(['row','machinerow'].includes(kind)){
   arms(p,S.map(s=>[s*.17,1.0,.52-.40*q]),S.map(s=>[s*.3,-1,-1]));
   if(kind==='row')legs(p,S.map(s=>[s*.15,.20,.68]));
   else { legs(p,S.map(s=>[s*.15,.27,.60]));p.equipment.push({type:'chestpad'},{type:'footplate'}); }
   p.equipment.push({type:kind==='machinerow'?'hammerrow':'lowcable'});
  }else if(kind==='chestpress'){
   arms(p,S.map(s=>[s*.25,1.0,.14+.39*q]),S.map(s=>[s,-1,-1]));
   p.equipment.push({type:'pressmachine'});
  }else{
   const a=(1-q)*1.22;
   arms(p,S.map(s=>[s*(.08+.45*Math.sin(a)),1.04,.16+.39*Math.cos(a)]),S.map(s=>[s,-.5,-.2]));
   p.equipment.push({type:'flymachine'});
  }
 }else if(['armpull','facepull'].includes(kind)){
  p=base([0,.9,0],kind==='armpull'?.18:0);
  if(kind==='armpull'){
   const a=1.42*(1-q);
   arms(p,S.map(s=>add(p.shoulders[s===-1?0:1],[0,-.53*Math.cos(a),.53*Math.sin(a)])));
   p.equipment.push({type:'highcable'},{type:'bar'});
  }else{
   arms(p,S.map(s=>[s*(.07+.23*q),1.40+.11*q,.53-.40*q]),S.map(s=>[s,0,-1]));
   p.equipment.push({type:'facecable'});
  }
 }else if(kind==='backextension'){
  // Bodyweight hinge: return from a supported fold to a neutral long spine.
  p=base([0,.89,0],1.18-.78*q);
  legs(p,S.map(s=>[s*.14,.16,-.46]));
  arms(p,p.shoulders.map((a,i)=>add(a,[S[i]*.02,-.50,-.04])),S.map(s=>[s,-.1,-1]));
  p.equipment.push({type:'backextension'});p.target=[0,.9,.05];
 }else if(['legextension','adduction'].includes(kind)){
  p=seat();
  if(kind==='legextension'){
   p.knees=S.map((s,i)=>[s*.13,.56+(i===0?.02*q:0),.415]);
   p.ankles=p.knees.map((a,i)=>add(a,[0,-.425*Math.cos((i===0?q:0)*1.45),.425*Math.sin((i===0?q:0)*1.45)]));
   p.equipment.push({type:'legextension'});
  }else{
   const a=.65*(1-q)+.06;
   p.knees=S.map(s=>add(p.hips[s===-1?0:1],[s*.43*Math.sin(a),-.04,.43*Math.cos(a)]));
   p.ankles=p.knees.map(a=>add(a,[0,-.42,.01]));
   p.equipment.push({type:'adduction'});
  }
  arms(p,S.map(s=>[s*.27,.53,.06]));
 }else if(kind==='legpress'){
  p=base([0,.48,0],-.70);p.target=[0,.75,.2];
  const dist=.46+.33*q;
  legs(p,S.map(s=>[s*.31,.50+dist*.72,dist*.70]),S.map(s=>[s,0,1]));
  arms(p,S.map(s=>[s*.28,.43,0]));
  p.equipment.push({type:'legpress'});
 }else if(kind==='legcurl'){
  p=base([0,.65,0],Math.PI/2);
  p.knees=S.map(s=>[s*.105,.65,-.42]);
  p.ankles=p.knees.map(a=>add(a,[0,.425*Math.sin(q*1.85),-.425*Math.cos(q*1.85)]));
  arms(p,S.map(s=>[s*.27,.46,.61]));
  p.equipment.push({type:'pronebench'},{type:'legcurl'});p.target=[0,.6,0];p.distance=3.5;
 }else if(['dumbbellpress','smithincline'].includes(kind)){
  // Example setups, not measured personal bench angles or training loads.
  const smith=kind==='smithincline';
  p=smith?base([0,.62,0],-Math.PI/3):supine(.62);
  legs(p,S.map(s=>[s*.28,.065,.43]),S.map(s=>[s*.15,0,1]));
  if(smith){
   const shoulder=p.shoulders[1],dz=.20,drop=.065;
   const grip=.215+Math.sqrt(.29*.29-dz*dz-drop*drop);
   const barZ=shoulder[2]+dz;
   // Fixed width and depth: collars move only vertically on the rails.
   arms(p,S.map(s=>[s*grip,shoulder[1]+.22+.265*q,barZ]),S.map(s=>[s*(grip-.215),-drop,dz]));
   p.equipment=[{type:'inclinebench'},{type:'smith',barZ}];
   p.target=[0,.99,-.10];p.distance=4.7;
  }else{
   const dz=.17,drop=.02,spread=Math.sqrt(.29*.29-dz*dz-drop*drop);
   arms(p,S.map(s=>[s*(.215+spread*(1-q)+.015*q),.885+.295*q,-.30-.13*q]),S.map(s=>[s*spread,-drop,dz]));
   p.equipment=[{type:'bench'},{type:'dumbbells'}];
   p.target=[0,.80,-.1];p.distance=3.8;
  }
 }else if(['benchpress','pullover'].includes(kind)){
  p=supine(.62);p.equipment=[{type:'bench'}];p.target=[0,.78,-.1];p.distance=3.8;
  if(kind==='benchpress'){
   legs(p,S.map(s=>[s*.28,.065,.43]));
   arms(p,S.map(s=>[s*.27,.83+.42*q,-.38]),S.map(s=>[s,0,.3]));
   p.equipment.push({type:'bar'});
  }else{
   p.knees=S.map(s=>[s*.105,1.02,-.16]);p.ankles=S.map(s=>[s*.105,.83,.22]);
   const a=q*1.55;
   arms(p,S.map(s=>[s*.045,.65+.55*Math.cos(a),-.46-.55*Math.sin(a)]),S.map(s=>[s,0,.3]));
   p.equipment.push({type:'goblet'});
  }
 }else if(['bridge','deadbug','slr','quadset','legraise','hamstring'].includes(kind)){
  p=supine();
  if(kind==='bridge'){
   const lift=.27*q;p.hip=[0,.145+lift,0];
   p.hips=S.map(s=>[s*.105,p.hip[1],0]);p.up=unit(sub(p.neck,p.hip));p.chest=add(p.hip,mul(p.up,.39));
   p.front=unit(cross(p.right,p.up));
   legs(p,S.map(s=>[s*.14,.07,.65]));
  }else if(kind==='deadbug'){
   p.knees=S.map(s=>[s*.105,.575,0]);p.ankles=S.map(s=>[s*.105,.575,.425]);
   p.wrists=S.map(s=>[s*.215,.70,-.47]);p.elbows=S.map(s=>[s*.215,.43,-.47]);
   // Exactly 40% of a 90-degree opening; other leg stays in tabletop.
   const a=q*Math.PI/2*.4;
   p.elbows[0]=add(p.shoulders[0],[0,.29*Math.cos(a),-.29*Math.sin(a)]);
   p.wrists[0]=add(p.elbows[0],[0,.285*Math.cos(a),-.285*Math.sin(a)]);
   p.knees[1]=add(p.hips[1],[0,.43*Math.cos(a),.43*Math.sin(a)]);
   p.ankles[1]=add(p.knees[1],[0,-.20*q,.425*Math.sqrt(1-Math.pow(.20*q/.425,2))]);
  }else if(kind==='slr'){
   p.knees[1]=ik(p.hips[1],[.14,.07,.62],.43,.425,[0,1,0]);p.ankles[1]=[.14,.07,.62];
   const a=.12+.66*q;
   p.knees[0]=add(p.hips[0],[0,.43*Math.sin(a),.43*Math.cos(a)]);
   p.ankles[0]=add(p.knees[0],[0,.425*Math.sin(a),.425*Math.cos(a)]);
  }else if(kind==='quadset'){
   p.knees[0]=[-.105,.17-.026*q,.425];p.ankles[0]=[-.105,.095,.84];
   p.equipment.push({type:'towel',at:[-.105,.07,.425]});
  }else{
   const a=kind==='legraise'?1.25-.55*q:.90+.30*q;
   for(let i=0;i<2;i++){
    if(kind==='hamstring'&&i===1)continue;
    p.knees[i]=add(p.hips[i],[0,.43*Math.sin(a),.43*Math.cos(a)]);
    p.ankles[i]=add(p.knees[i],[0,.425*Math.sin(a),.425*Math.cos(a)]);
   }
   if(kind==='hamstring'){arms(p,[[-.13,.56,-.10],[.13,.56,-.10]]);p.equipment.push({type:'strap',at:p.ankles[0]});}
  }
 }else if(['clamshell','sslr','openbook','foam'].includes(kind)){
  p=side();
  if(kind==='clamshell'){
   p.ankles=[[.68,.13,.34],[.68,.16,.34]];
   p.knees=[ik(p.hips[0],p.ankles[0],.43,.425,[0,0,1]),ik(p.hips[1],p.ankles[1],.43,.425,[0,.2+q,1-1.1*q])];
  }else if(kind==='sslr'){
   const a=.08+.42*q;
   p.knees[1]=add(p.hips[1],[.43*Math.cos(a),.43*Math.sin(a),0]);
   p.ankles[1]=add(p.knees[1],[.425*Math.cos(a),.425*Math.sin(a),0]);
  }else if(kind==='openbook'){
   // Knees and pelvis stay stacked; upper thorax rotates with top arm.
   p.knees=[[.31,.13,.28],[.31,.32,.28]];p.ankles=[[.67,.10,.05],[.67,.28,.05]];
   const a=q*Math.PI*.83;
   p.shoulders[1]=[-.47,.38+.03*Math.sin(a),-.08*q];
   p.elbows[1]=add(p.shoulders[1],[0,.29*Math.sin(a),.29*Math.cos(a)]);
   p.wrists[1]=add(p.elbows[1],[0,.285*Math.sin(a),.285*Math.cos(a)]);
   p.elbows[0]=[-.47,.12,.29];p.wrists[0]=[-.47,.12,.575];
   p.front=[0,Math.sin(a*.5),Math.cos(a*.5)];
  }else{
   const shift=.045*Math.sin(q*Math.PI*2);
   p=side();for(const key of ['hip','chest','neck','head'])p[key]=add(p[key],[shift,.08,0]);
   for(const key of ['hips','shoulders','elbows','wrists','knees','ankles'])p[key]=p[key].map(a=>add(a,[shift,.08,0]));
   p.equipment.push({type:'foam',at:[-.33,.13,0]});
  }
 }else if(['plank','birddog'].includes(kind)){
  p=base([0,kind==='plank'?.36:.55,0],Math.PI/2);p.target=[0,.45,.1];p.distance=3.6;p.equipment.push({type:'mat'});
  if(kind==='plank'){
   p.elbows=S.map(s=>[s*.215,.065,.47]);p.wrists=S.map(s=>[s*.215,.065,.74]);
   legs(p,S.map(s=>[s*.12,.065,-.70]),[[0,-1,0],[0,-1,0]]);
  }else{
   p.knees=S.map(s=>[s*.105,.065,0]);p.ankles=S.map(s=>[s*.105,.065,-.41]);
   arms(p,S.map(s=>[s*.215,.065,.47]),S.map(s=>[s,0,-1]));
   p.elbows[0]=add(p.shoulders[0],[0,-.29*Math.cos(q*Math.PI/2),.29*Math.sin(q*Math.PI/2)]);
   p.wrists[0]=add(p.elbows[0],[0,-.285*Math.cos(q*Math.PI/2),.285*Math.sin(q*Math.PI/2)]);
   p.knees[1]=add(p.hips[1],[0,-.43*Math.cos(q*Math.PI/2),-.43*Math.sin(q*Math.PI/2)]);
   p.ankles[1]=add(p.knees[1],[0,0,-.425]);
  }
 }else if(kind==='piriformis'){
  p=base([0,.74,.0],.25+.58*q);p.target=[0,.85,.15];
  p.knees=[[-.37,.65,.325],[.105,.39,-.22]];p.ankles=[[.045,.65,.40],[.12,.065,-.48]];
  arms(p,[[-.30,.69,.30+.30*q],[.30,.69,.30+.30*q]],S.map(s=>[s,-1,0]));
  p.equipment.push({type:'stretchbench'});
 }
 p.q=q;p.stage=stage;p.kind=kind;p.id=id;
 return p;
}
const api={pose,ik,add,sub,mul,len,unit,cross,mix};
if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.ExercisePoses=api;
})(typeof window!=='undefined'?window:globalThis);
