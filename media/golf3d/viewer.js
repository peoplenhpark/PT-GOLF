/* Dedicated golf renderer: a clothed, continuous silhouette and readable club.
   No anatomical muscle overlays; geometry is allocated once, then posed. */
(function(){
'use strict';
const $=id=>document.getElementById(id),P=window.GolfPoses;
const id=new URLSearchParams(location.search).get('exercise')||'golf_driver';
const notifyHeight=()=>parent.postMessage({type:'ptgolf-viewer-height',height:Math.ceil(document.body.getBoundingClientRect().height+2)},location.origin);
new ResizeObserver(notifyHeight).observe(document.body);
function fail(message){$('error').hidden=false;$('error').textContent=message;document.querySelectorAll('button,input,select').forEach(el=>el.disabled=true);notifyHeight();}
if(!P||!P.clubs[id]||!window.THREE){fail('3D를 불러오지 못했습니다. 연결을 확인한 뒤 3D를 닫았다 다시 열어 주세요.');return;}
const T=window.THREE,vec=a=>new T.Vector3(...a),{add,sub,mul,mix}=P;
let renderer;
try{renderer=new T.WebGLRenderer({antialias:true,alpha:false});}catch(e){fail('이 브라우저에서 3D를 표시할 수 없습니다. Chrome에서 다시 열어 주세요.');return;}
renderer.setPixelRatio(Math.min(devicePixelRatio||1,2));renderer.setClearColor(0xe7eeeb);
renderer.outputColorSpace=T.SRGBColorSpace;renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.PCFSoftShadowMap;
const canvas=renderer.domElement;canvas.tabIndex=0;canvas.setAttribute('aria-label',P.clubs[id].name+' 스윙 3D. 방향키로 회전하고 아래 버튼으로 단계를 선택합니다.');$('viewport').appendChild(canvas);
const scene=new T.Scene(),camera=new T.OrthographicCamera(-1,1,1,-1,.05,30);camera.aspect=1;
scene.add(new T.HemisphereLight(0xffffff,0x69847a,2.3));
const key=new T.DirectionalLight(0xfff7e5,3.0);key.position.set(-3,6,4);key.castShadow=true;key.shadow.mapSize.set(1024,1024);key.shadow.camera.left=-2.5;key.shadow.camera.right=2.5;key.shadow.camera.top=3;key.shadow.camera.bottom=-2;key.shadow.normalBias=.025;scene.add(key);
const fill=new T.DirectionalLight(0xcfe8ff,1.2);fill.position.set(3,3,-4);scene.add(fill);
const material=(color,roughness=.8)=>new T.MeshStandardMaterial({color,roughness});
const mat={shirt:material(0x247b73),skin:material(0xd69b72),pants:material(0x334552),shoe:material(0xf5f5e9),sole:material(0x2c403b),glove:material(0xf8fffa),cap:material(0xf2eee0),dark:material(0x1b3030),shaft:material(0x47595f,.32),grip:material(0x182c29),head:material(0x213439,.3),metal:material(0x80948f,.3)};
const ballMat=material(0xffffff),body=new T.Group();scene.add(body);
const sphere=new T.SphereGeometry(1,24,18),axis=new T.Vector3(0,1,0);
const objects={};
function obj(name,geometry,material,group=body){const m=new T.Mesh(geometry,material);m.castShadow=true;m.receiveShadow=group===scene;group.add(m);objects[name]=m;return m;}
function ell(name,at,scale,material,quaternion){const m=objects[name]||obj(name,sphere,material);m.position.copy(vec(at));m.scale.set(...scale);m.quaternion.copy(quaternion||new T.Quaternion());return m;}
function beam(name,a,b,r1,r2,material){
 const m=objects[name]||obj(name,new T.CylinderGeometry(r2,r1,1,16),material);
 const d=vec(sub(b,a));m.position.copy(vec(mix(a,b,.5)));m.scale.y=d.length();m.quaternion.setFromUnitVectors(axis,d.normalize());return m;
}
const torsoGeo=new T.LatheGeometry([[.12,.025],[.14,.10],[.15,.22],[.18,.35],[.19,.40],[.165,.452],[.067,.50]].map(v=>new T.Vector2(...v)),32);
torsoGeo.scale(1,1,.68);const torso=obj('torso',torsoGeo,mat.shirt);
const headGroup=new T.Group();body.add(headGroup);
const face=obj('face',sphere,mat.skin,headGroup);face.scale.set(.096,.119,.094);
const cap=obj('cap',new T.SphereGeometry(1,24,12,0,Math.PI*2,0,Math.PI*.50),mat.cap,headGroup);cap.scale.set(.103,.075,.103);cap.position.y=.065;
const brim=obj('brim',sphere,mat.cap,headGroup);brim.scale.set(.103,.014,.093);brim.position.set(0,.065,.078);
const nose=obj('nose',sphere,mat.skin,headGroup);nose.scale.set(.023,.027,.025);nose.position.set(0,-.012,.090);
for(const s of [-1,1]){const eye=obj('eye'+s,sphere,mat.dark,headGroup);eye.scale.set(.008,.009,.006);eye.position.set(s*.035,.026,.085);}
const ground=obj('ground',new T.CircleGeometry(1.65,80),material(0xc6d8c9),scene);ground.rotation.x=-Math.PI/2;ground.position.y=.001;ground.castShadow=false;
const ring=new T.Mesh(new T.RingGeometry(1.63,1.65,80),material(0x9bb6a3));ring.rotation.x=-Math.PI/2;ring.position.y=.003;scene.add(ring);
const targetArrow=new T.ArrowHelper(new T.Vector3(1,0,0),new T.Vector3(-.55,.008,1.12),1.40,0x628a65,.14,.085);scene.add(targetArrow);
const ball=obj('ball',sphere,ballMat,scene);ball.scale.setScalar(.027);ball.position.copy(vec(P.pose(id,0).ball));ball.castShadow=true;
if(P.clubs[id].driver){const b=P.pose(id,0).ball;beam('tee',[b[0],.01,b[2]],add(b,[0,-.022,0]),.005,.005,mat.cap);}
const clubHead=obj('clubHead',P.clubs[id].driver?sphere:new T.BoxGeometry(1,1,1),P.clubs[id].driver?mat.head:mat.metal);
let phase=0,playing=false,speed=.35,yaw=.38,pitch=.13,distance=1,current,previousStage=-1;
const target=new T.Vector3(-.025,1.02,.12);
// A single full-swing frame is used for playback, scrubbing and stage selection.
const framing=[];
for(let i=0;i<=200;i++){const p=P.pose(id,i/200);framing.push(...[p.head,p.tip,...p.wrists,...p.ankles].map(vec));}

function render(){
 current=P.pose(id,phase);const p=current;
 const basis=new T.Matrix4().makeBasis(vec(p.right),vec(p.up),vec(p.front));
 torso.position.copy(vec(p.hip));torso.quaternion.setFromRotationMatrix(basis);torso.scale.set(P.len(sub(p.shoulders[0],p.shoulders[1]))/.39,P.len(sub(p.neck,p.hip))/.50,p.scale);
 const hipQ=new T.Quaternion().setFromAxisAngle(axis,p.hipTurn);
 ell('pelvis',p.hip,[.153*p.scale,.125*p.scale,.112*p.scale],mat.pants,hipQ);
 beam('neck',p.neck,p.head,.049*p.scale,.043*p.scale,mat.skin);
 headGroup.position.copy(vec(p.head));headGroup.scale.setScalar(p.scale);const headRight=vec(P.cross(p.headUp,p.headFront)).normalize(),headUp=new T.Vector3().crossVectors(vec(p.headFront),headRight).normalize();headGroup.quaternion.setFromRotationMatrix(new T.Matrix4().makeBasis(headRight,headUp,vec(p.headFront)));
 for(let i=0;i<2;i++){
  const scale=p.scale;
  ell('shoulder'+i,p.shoulders[i],[.069,.073,.069],mat.shirt);
  beam('upperArm'+i,p.shoulders[i],p.elbows[i],.060,.044,mat.skin);
  beam('sleeve'+i,p.shoulders[i],mix(p.shoulders[i],p.elbows[i],.43),.070,.059,mat.shirt);
  ell('elbow'+i,p.elbows[i],[.045,.045,.045],mat.skin);
  beam('forearm'+i,p.elbows[i],p.wrists[i],.045,.028,mat.skin);
  const palm=p.hands[i],handQ=new T.Quaternion().setFromUnitVectors(axis,vec(sub(palm,p.wrists[i])).normalize());
  ell('hand'+i,mix(p.wrists[i],palm,.55),[.032*scale,P.len(sub(palm,p.wrists[i]))*.55+.014*scale,.027*scale],i===0?mat.glove:mat.skin,handQ);
  beam('thigh'+i,p.hips[i],p.knees[i],.084,.057,mat.pants);
  ell('knee'+i,p.knees[i],[.057,.059,.057],mat.pants);
  beam('shin'+i,p.knees[i],p.ankles[i],.055,.035,mat.pants);
  const foot=p.feet[i],forward=vec(sub(foot.toe,foot.heel)).normalize(),side=new T.Vector3().crossVectors(axis,forward).normalize(),footUp=new T.Vector3().crossVectors(forward,side).normalize();
  const shoeQ=new T.Quaternion().setFromRotationMatrix(new T.Matrix4().makeBasis(side,footUp,forward));
  const center=add(mix(foot.heel,foot.toe,.50),[0,.012*scale,0]);
  ell('shoe'+i,center,[.058*scale,.040*scale,P.len(sub(foot.toe,foot.heel))*.57],mat.shoe,shoeQ);

 }
 beam('shaft',p.grip,p.tip,.008,.0055,mat.shaft);
 beam('grip',add(p.grip,mul(p.dir,-.075)),add(p.grip,mul(p.dir,.16)),.013,.012,mat.grip);
 clubHead.position.copy(vec(p.tip));clubHead.scale.set(...(p.club.driver?[.064,.037,.044]:[.073,.060,.030]));
 // The head is perpendicular to the shaft. At contact its face is toward -X.
 const clubUp=vec(p.dir).negate(),headSide=vec(p.clubSide);
 const headFront=new T.Vector3().crossVectors(headSide,clubUp).normalize();clubHead.quaternion.setFromRotationMatrix(new T.Matrix4().makeBasis(headSide,clubUp,headFront));
 camera.position.set(target.x+Math.sin(yaw)*Math.cos(pitch)*6,target.y+Math.sin(pitch)*6,target.z+Math.cos(yaw)*Math.cos(pitch)*6);camera.lookAt(target);camera.updateMatrixWorld();
 const points=framing;
 const projected=points.map(v=>v.clone().applyMatrix4(camera.matrixWorldInverse));
 const minX=Math.min(...projected.map(v=>v.x))-.15,maxX=Math.max(...projected.map(v=>v.x))+.15;
 const minY=Math.min(...projected.map(v=>v.y))-.16,maxY=Math.max(...projected.map(v=>v.y))+.23;
 const height=Math.max(2.04,maxY-minY,(maxX-minX)/camera.aspect)*distance;
 const offset=new T.Vector3().setFromMatrixColumn(camera.matrixWorld,0).multiplyScalar((minX+maxX)/2).add(new T.Vector3().setFromMatrixColumn(camera.matrixWorld,1).multiplyScalar((minY+maxY)/2));
 camera.position.add(offset);camera.lookAt(target.clone().add(offset));
 camera.left=-height*camera.aspect/2;camera.right=height*camera.aspect/2;camera.top=height/2;camera.bottom=-height/2;camera.updateProjectionMatrix();
 renderer.render(scene,camera);
 const arrowPoint=new T.Vector3(.85,.01,1.12).project(camera);
 $('targetLabel').style.left=Math.max(8,Math.min($('viewport').clientWidth-75,(arrowPoint.x*.5+.5)*$('viewport').clientWidth))+'px';
 $('targetLabel').style.bottom=Math.max(8,Math.min($('viewport').clientHeight-52,(.5+arrowPoint.y*.5)*$('viewport').clientHeight-18))+'px';
 $('targetLabel').textContent=Math.abs(Math.cos(yaw))<.25?'타깃 방향':Math.cos(yaw)>0?'타깃 →':'← 타깃';
 canvas.dataset.ready='true';canvas.dataset.exercise=id;canvas.dataset.kind='golf';canvas.dataset.phase=phase;canvas.dataset.yaw=yaw;canvas.dataset.distance=distance;canvas.dataset.playing=playing;
 if(previousStage!==p.stage){previousStage=p.stage;$('phaseTitle').textContent=(p.stage+1)+' · '+P.stages[p.stage].name;$('phaseText').textContent=P.stages[p.stage].cue;document.querySelectorAll('[data-stage]').forEach(b=>b.setAttribute('aria-pressed',Number(b.dataset.stage)===p.stage));}
 $('progress').value=Math.round(phase*1000);
}
function setPlaying(value){playing=value;$('play').textContent=playing?'일시정지':phase>=1?'다시 재생':'재생';canvas.dataset.playing=playing;}
$('clubName').textContent=P.clubs[id].name;
P.stages.forEach((s,i)=>{const b=document.createElement('button');b.dataset.stage=i;b.setAttribute('aria-pressed',i===0);const num=document.createElement('small');num.textContent=String(i+1).padStart(2,'0');b.append(num,document.createTextNode(s.name));b.onclick=()=>{phase=s.t;setPlaying(false);render();};$('steps').appendChild(b);});
$('play').onclick=()=>{if(phase>=1)phase=0;setPlaying(!playing);render();};
$('progress').oninput=e=>{phase=Number(e.target.value)/1000;setPlaying(false);render();};
$('speed').onchange=e=>speed=Number(e.target.value);
function customView(){document.querySelectorAll('[data-view]').forEach(b=>b.setAttribute('aria-pressed',false));$('viewName').textContent='자유 시점';}
document.querySelectorAll('[data-view]').forEach(b=>b.onclick=()=>{yaw={front:0,side:Math.PI/2,back:Math.PI,reset:.38}[b.dataset.view];pitch=.13;distance=1;$('viewName').textContent={front:'정면',side:'타깃선 뒤',back:'뒷면',reset:'사선'}[b.dataset.view];document.querySelectorAll('[data-view]').forEach(el=>el.setAttribute('aria-pressed',el===b));render();});
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v)),pointers=new Map();let pinchDistance=0;
canvas.onpointerdown=e=>{canvas.setPointerCapture(e.pointerId);pointers.set(e.pointerId,[e.clientX,e.clientY]);pinchDistance=0;};
canvas.onpointermove=e=>{
 if(!pointers.has(e.pointerId))return;const old=pointers.get(e.pointerId);pointers.set(e.pointerId,[e.clientX,e.clientY]);
 if(pointers.size===1){yaw-=(e.clientX-old[0])*.008;pitch=clamp(pitch+(e.clientY-old[1])*.006,-.2,.65);}
 else{const pts=[...pointers.values()],d=Math.hypot(pts[0][0]-pts[1][0],pts[0][1]-pts[1][1]);if(pinchDistance&&d>0)distance=clamp(distance*pinchDistance/d,.55,1.7);pinchDistance=d;}
 customView();render();
};
function release(e){pointers.delete(e.pointerId);pinchDistance=0;}
canvas.onpointerup=release;canvas.onpointercancel=release;canvas.onlostpointercapture=release;
canvas.addEventListener('wheel',e=>{e.preventDefault();distance=clamp(distance*Math.exp(e.deltaY*.001),.55,1.7);customView();render();},{passive:false});
canvas.onkeydown=e=>{const keys=['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','+','=','-'];if(!keys.includes(e.key))return;e.preventDefault();if(e.key==='ArrowLeft')yaw-=.12;if(e.key==='ArrowRight')yaw+=.12;if(e.key==='ArrowUp')pitch=clamp(pitch+.08,-.2,.65);if(e.key==='ArrowDown')pitch=clamp(pitch-.08,-.2,.65);if(e.key==='+'||e.key==='=')distance=clamp(distance*.9,.55,1.7);if(e.key==='-')distance=clamp(distance/ .9,.55,1.7);customView();render();};
new ResizeObserver(()=>{const el=$('viewport');camera.aspect=el.clientWidth/el.clientHeight;camera.updateProjectionMatrix();renderer.setSize(el.clientWidth,el.clientHeight,false);render();}).observe($('viewport'));
canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();setPlaying(false);fail('3D 표시가 중단되었습니다. 3D를 닫았다 다시 열어 주세요.');});
document.addEventListener('visibilitychange',()=>{if(document.hidden)setPlaying(false);});
let previous=performance.now();function tick(now){const dt=Math.min((now-previous)/1000,.05);previous=now;if(playing){phase=Math.min(1,phase+dt*speed/P.duration);if(phase>=1)setPlaying(false);render();}requestAnimationFrame(tick);}requestAnimationFrame(tick);
window.exerciseViewer={snapshot:()=>({id,kind:'golf',renderer:'golf-mocap-v2',phase,playing,pose:current,yaw,distance,meshCount:body.children.length,camera:{position:camera.position.toArray(),zoom:camera.zoom,left:camera.left,right:camera.right,top:camera.top,bottom:camera.bottom},projected:[current.head,current.tip,...current.ankles].map(p=>vec(p).project(camera).toArray())})};
render();notifyHeight();
})();
