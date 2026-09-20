/* Shared anatomical viewer. One pose/equipment definition per exercise. */
(()=>{'use strict';
const $=id=>document.getElementById(id),vp=$('viewport');
try{
 const id=new URLSearchParams(location.search).get('exercise'),entry=window.ExerciseMedia[id];
 if(['golf_driver','golf_iron7','golf_iron5','golf_ironp'].includes(id)){location.replace('../../index.html?v=73#exercise/'+id);return;}
 if(!entry||!entry.kind||entry.kind==='pushdown')throw Error('Unknown exercise');
 document.title=entry.name+' 3D';
 const P=ExercisePoses,{add,sub,mul,unit,cross,mix}=P;
 const scene=new THREE.Scene();scene.background=new THREE.Color('#14161b');
 const camera=new THREE.PerspectiveCamera(37,1,.03,30);
 const renderer=new THREE.WebGLRenderer({antialias:true});
 renderer.setPixelRatio(Math.min(devicePixelRatio,1.8));renderer.outputColorSpace=THREE.SRGBColorSpace;
 vp.prepend(renderer.domElement);const canvas=renderer.domElement;canvas.tabIndex=0;
 canvas.setAttribute('aria-label',entry.name+' 입체 자세. 드래그로 회전, 두 손가락으로 확대.');
 canvas.dataset.exercise=id;
 const mat=(c,roughness=.55,metalness=.08)=>new THREE.MeshStandardMaterial({color:c,roughness,metalness});
 const skin=mat('#bcc4ce'),joint=mat('#aab4bf'),red=mat('#e6574e'),cloth=mat('#282c34'),steel=mat('#596473',.4,.6),rubber=mat('#303744'),accent=mat('#596d83');
 scene.add(new THREE.HemisphereLight('#f0f5ff','#3d3940',2.2));
 for(const [c,i,pos] of [['#fff2e8',3,[-3,4,4]],['#c8ddff',2.7,[3,3,-3]],['#ffffff',.7,[2,1,3]]]){
  const l=new THREE.DirectionalLight(c,i);l.position.set(...pos);scene.add(l);
 }
 const body=new THREE.Group(),equipment=new THREE.Group();scene.add(body,equipment);
 const sphere=new THREE.SphereGeometry(1,24,16),cylinder=new THREE.CylinderGeometry(1,1,1,18),box=new THREE.BoxGeometry(1,1,1);
 const Y=new THREE.Vector3(0,1,0),Z=new THREE.Vector3(0,0,1);
 const pools={};let used={};
 function mesh(group,geo,m){
  const key=(group===body?'body':'equipment')+(geo===sphere?'sphere':geo===box?'box':'cyl');
  const list=pools[key]||(pools[key]=[]),i=used[key]||0;used[key]=i+1;
  if(!list[i]){list[i]=new THREE.Mesh(geo,m);group.add(list[i]);}
  const o=list[i];o.visible=true;o.material=m;o.rotation.set(0,0,0);return o;
 }
 function ell(group,pos,scale,m=skin,axis=null){
  const o=mesh(group,sphere,m);o.position.set(...pos);o.scale.set(...scale);
  if(axis)o.quaternion.setFromUnitVectors(Y,new THREE.Vector3(...unit(axis)));return o;
 }
 function beam(group,a,b,r,m=steel){
  const d=sub(b,a),o=mesh(group,cylinder,m);o.position.set(...mix(a,b,.5));o.scale.set(r,P.len(d),r);o.quaternion.setFromUnitVectors(Y,new THREE.Vector3(...unit(d)));return o;
 }
 function block(group,at,size,m=rubber,axis=null){
  const o=mesh(group,box,m);o.position.set(...at);o.scale.set(...size);
  if(axis)o.quaternion.setFromUnitVectors(Y,new THREE.Vector3(...unit(axis)));return o;
 }
 function limb(a,b,r,m=skin){return ell(body,mix(a,b,.50),[r,P.len(sub(b,a))*.55,r*.91],m,sub(b,a));}
 function torsoEll(p,at,scale,m=skin){
  const o=ell(body,at,scale,m);
  const up=unit(p.up),right=unit(p.right),front=unit(cross(right,up));
  const matrix=new THREE.Matrix4().makeBasis(new THREE.Vector3(...right),new THREE.Vector3(...up),new THREE.Vector3(...front));
  o.quaternion.setFromRotationMatrix(matrix);return o;
 }
 const targetMat=group=>entry.target===group?red:skin;
 function human(p){
  const at=(a,x,y,z)=>add(a,add(mul(p.right,x),add(mul(p.up,y),mul(p.front,z))));
  torsoEll(p,at(p.hip,0,.10,0),[.153,.17,.104]);
  torsoEll(p,p.chest,[.207,.177,.119]);
  torsoEll(p,at(p.hip,0,.22,.013),[.14,.16,.10]);
  torsoEll(p,p.hip,[.17,.13,.125],cloth);
  limb(p.neck,p.head,.053);torsoEll(p,p.head,[.09,.112,.09]);
  torsoEll(p,at(p.head,0,-.035,.060),[.062,.056,.047]);
  torsoEll(p,at(p.head,0,0,.091),[.016,.025,.024]);
  for(let i=0;i<2;i++){
   const s=i?1:-1,a=p.shoulders[i],b=p.elbows[i],c=p.wrists[i],h=p.hips[i],k=p.knees[i],f=p.ankles[i];
   torsoEll(p,at(p.chest,s*.089,.005,.099),[.100,.072,.038],targetMat('chest'));
   torsoEll(p,at(p.chest,s*.093,-.05,-.097),[.104,.14,.038],['back','lats','posterior'].includes(entry.target)?red:skin);
   torsoEll(p,at(p.hip,s*.062,.16,-.097),[.035,.20,.025],targetMat('posterior'));
   for(let j=0;j<3;j++)torsoEll(p,at(p.hip,s*.039,.16+j*.064,.105),[.040,.029,.018],targetMat('core'));
   torsoEll(p,at(p.hip,s*.11,.19,.073),[.037,.1,.035],targetMat('core'));
   limb(a,b,.055);ell(body,a,[.076,.083,.073],targetMat('shoulders'),sub(b,a));
   const bicep=add(mix(a,b,.52),mul(p.front,.035));ell(body,bicep,[.037,.084,.032],targetMat('biceps'),sub(b,a));
   ell(body,b,[.034,.036,.034],joint);limb(b,c,.034);
   ell(body,c,[.038,.047,.025],skin,sub(c,b));
   for(let n=0;n<4;n++)ell(body,add(c,add(mul(unit(sub(c,b)),.039),mul(p.right,(n-1.5)*.014))),[.006,.028,.008],skin,sub(c,b));
   limb(h,k,.084);ell(body,mix(h,k,.16),[.10,.125,.108],cloth,sub(k,h));
   const thigh=unit(sub(k,h)),forward=unit(sub(p.front,mul(thigh,P.len(cross(thigh,p.front))<.01?1:0)));
   ell(body,add(mix(h,k,.58),mul(forward,.042)),[.060,.130,.040],targetMat('quads'),sub(k,h));
   ell(body,add(mix(h,k,.50),mul(forward,-.045)),[.063,.132,.04],['hamstrings','posterior'].includes(entry.target)?red:skin,sub(k,h));
   ell(body,add(mix(h,k,.42),mul(p.right,-s*.04)),[.046,.13,.044],targetMat('adductors'),sub(k,h));
   torsoEll(p,at(h,0,-.05,-.081),[.10,.10,.046],['glutes','posterior'].includes(entry.target)?red:cloth);
   if(entry.target==='glutes')torsoEll(p,at(h,s*.048,-.025,-.028),[.048,.09,.054],red);
   ell(body,k,[.052,.057,.049],joint);limb(k,f,.045);
   ell(body,add(mix(k,f,.42),mul(p.front,-.014)),[.049,.105,.045],skin,sub(f,k));
   // Feet follow shin on floor exercises; standing feet point forward.
   const floorType=['legcurl','bridge','deadbug','slr','quadset','legraise','hamstring','clamshell','sslr','openbook','foam','birddog','plank','benchpress','pullover'];
   const planted=['bridge','benchpress','dumbbellpress','smithincline'].includes(p.kind)||(p.kind==='slr'&&i===1);
   const direction=planted?[0,0,1]:p.kind==='latpull'?[0,-.6,.8]:floorType.includes(p.kind)?unit(add(mul(p.front,.8),mul(unit(sub(f,k)),.2))):[0,0,1];
   const foot=ell(body,add(f,mul(direction,.050)),[.053,.045,.113],cloth);
   foot.quaternion.setFromUnitVectors(Z,new THREE.Vector3(...direction));
  }
 }
 function handle(at,vertical=false){beam(equipment,add(at,vertical?[0,-.06,0]:[-.06,0,0]),add(at,vertical?[0,.06,0]:[.06,0,0]),.017,rubber);}
 function dumbbell(at){
  beam(equipment,add(at,[-.11,0,0]),add(at,[.11,0,0]),.016,steel);
  for(let s of [-1,1]){const o=mesh(equipment,cylinder,rubber);o.position.set(...add(at,[s*.095,0,0]));o.scale.set(.062,.045,.062);o.rotation.z=Math.PI/2;}
 }
 function bench(at=[0,.46,-.14],size=[.43,.14,1.40]){
  block(equipment,at,size);for(let z of [-.53,.39])beam(equipment,[0,.03,z],[0,at[1]-.04,z],.035);
  for(let z of [-.53,.39])beam(equipment,[-.30,.03,z],[.30,.03,z],.035);
 }
 function tower(z=1.02,top=2.05){
  for(let s of [-1,1])beam(equipment,[s*.24,.04,z],[s*.24,top,z],.032);
  beam(equipment,[-.27,top,z],[.27,top,z],.038);
  for(let i=0;i<9;i++)block(equipment,[0,.10+i*.045,z],[.33,.027,.20]);
 }
 function cable(a,b){beam(equipment,a,b,.006,accent);}
 function seatGear(){
  block(equipment,[0,.48,.04],[.46,.12,.46]);
  block(equipment,[0,.84,-.14],[.44,.64,.12]);
  beam(equipment,[0,.02,0],[0,.46,0],.05);
  beam(equipment,[-.36,.025,.24],[.36,.025,.24],.045);
 }
 function gear(p){
  for(const e of p.equipment){
   switch(e.type){
    case 'mat':block(equipment,[0,.007,.08],[1.30,.015,2.30],accent);break;
    case 'seat':seatGear();break;
    case 'bench':bench([0,.46,-.15]);break;
    case 'inclinebench':{
     const center=add(add(p.hip,mul(p.up,.31)),mul(p.front,-.13));
     block(equipment,center,[.43,.10,.87],rubber,p.front);
     block(equipment,[0,.49,.17],[.43,.10,.34]);
     for(const z of [-.59,.34]){
      beam(equipment,[-.30,.035,z],[.30,.035,z],.035);
      beam(equipment,[0,.035,z],[0,z<0?.68:.43,z],.035);
     }
     beam(equipment,[0,.07,.30],[0,.68,-.59],.035);
     break;
    }
    case 'smith':{
     const z=e.barZ,y=p.wrists[0][1];
     for(const side of [-1,1]){
      const x=side*.78;
      beam(equipment,[x,.04,z],[x,1.90,z],.025,steel);
      beam(equipment,[x,.04,z-.15],[x,1.90,z-.15],.035,steel);
      beam(equipment,[x,.04,-.85],[x,.04,.65],.045);
      block(equipment,[x,y,z],[.085,.15,.085],steel);
      for(let h=.80;h<1.61;h+=.16)beam(equipment,[x,h,z-.15],[x,h,z-.075],.014);
      const plate=mesh(equipment,cylinder,rubber);
      plate.position.set(side*.88,y,z);plate.scale.set(.125,.05,.125);plate.rotation.z=Math.PI/2;
     }
     beam(equipment,[-.78,1.90,z],[.78,1.90,z],.035);
     beam(equipment,[-1.0,y,z],[1.0,y,z],.016,steel);
     break;
    }
    case 'pronebench':bench([0,.49,.03]);break;
    case 'bar':beam(equipment,add(p.wrists[0],[-.15,0,0]),add(p.wrists[1],[.15,0,0]),.016);p.wrists.forEach(a=>handle(a));break;
    case 'dumbbells':p.wrists.forEach(dumbbell);break;
    case 'goblet':{
     const a=mix(p.wrists[0],p.wrists[1],.5);beam(equipment,add(a,[0,-.14,0]),add(a,[0,.08,0]),.02);
     for(let y of [-.15,.08]){const o=mesh(equipment,cylinder,rubber);o.position.set(...add(a,[0,y,0]));o.scale.set(.09,.07,.09);}break;}
    case 'pullup':for(let s of [-1,1])beam(equipment,[s*.63,.02,.20],[s*.63,2.13,.08],.04);beam(equipment,[-.67,2.13,.08],[.67,2.13,.08],.029);break;
    case 'latpull':tower(.73,2.07);cable([0,2.07,.73],mix(p.wrists[0],p.wrists[1],.5));block(equipment,[0,.66,.33],[.55,.10,.14]);break;
    case 'highcable':tower();cable([0,2.05,1.02],mix(p.wrists[0],p.wrists[1],.5));break;
    case 'facecable':tower();for(const a of p.wrists){cable([0,1.50,1.02],a);handle(a,true);}break;
    case 'hammerrow':for(let i=0;i<2;i++){
     const s=i?1:-1;beam(equipment,[s*.39,.04,.88],[s*.39,1.55,.80],.035);
     beam(equipment,[s*.39,1.48,.80],p.wrists[i],.03);handle(p.wrists[i],true);
     const o=mesh(equipment,cylinder,rubber);o.position.set(s*.46,1.29,.67);o.scale.set(.14,.055,.14);o.rotation.z=Math.PI/2;
    }break;
    case 'lowcable':tower(1.15);for(const a of p.wrists){cable([0,.84,1.15],a);handle(a,true);}break;
    case 'footplate':block(equipment,[0,.24,.64],[.55,.07,.24]);break;
    case 'chestpad':block(equipment,[0,1.0,.145],[.25,.28,.1]);beam(equipment,[0,.2,.7],[0,1.0,.2],.035);break;
    case 'pressmachine':case 'flymachine':for(let i=0;i<2;i++){beam(equipment,[i?.44:-.44,1.45,-.23],p.wrists[i],.025);handle(p.wrists[i],true);}break;
    case 'step':block(equipment,[0,.15,.28],[.68,.30,.5]);break;
    case 'heelpad':block(equipment,[0,.02,-.06],[.60,.04,.16],accent);break;
    case 'vsquat':{
     for(let s of [-1,1]){beam(equipment,[s*.42,.04,-.55],[s*.42,1.85,-.35],.035);block(equipment,add(p.shoulders[s<0?0:1],[0,.08,0]),[.15,.10,.27]);}
     block(equipment,add(p.chest,[0,0,-.15]),[.43,.5,.10]);break;}
    case 'backextension':block(equipment,[0,.82,.05],[.45,.17,.25]);beam(equipment,[0,.02,-.4],[0,.77,.03],.04);block(equipment,[0,.10,-.45],[.6,.08,.3]);break;
    case 'legextension':beam(equipment,add(p.ankles[0],[-.08,.02,.04]),add(p.ankles[0],[.38,.02,.04]),.067,rubber);beam(equipment,[.29,.54,.38],add(p.ankles[0],[.42,0,0]),.027);break;
    case 'legcurl':beam(equipment,add(p.ankles[0],[0,.055,0]),add(p.ankles[1],[0,.055,0]),.065,rubber);break;
    case 'adduction':for(let i=0;i<2;i++){block(equipment,add(p.knees[i],[i?-.06:.06,.05,-.02]),[.08,.22,.15]);beam(equipment,[0,.35,.17],p.knees[i],.025);}break;
    case 'legpress':{
     const foot=mix(p.ankles[0],p.ankles[1],.5);block(equipment,add(foot,[0,0,.06]),[.95,.60,.07],rubber,[0,.7,-.7]);
     block(equipment,[0,.49,-.28],[.52,.7,.10],rubber,[0,.77,-.64]);
     for(let s of [-1,1])beam(equipment,[s*.54,.15,.05],[s*.54,1.40,1.25],.035);break;}
    case 'towel':ell(equipment,e.at,[.12,.052,.065],accent);break;
    case 'strap':for(const a of p.wrists)cable(a,e.at);break;
    case 'foam':{const o=mesh(equipment,cylinder,accent);o.position.set(...e.at);o.scale.set(.13,.70,.13);o.rotation.x=Math.PI/2;break;}
    case 'stretchbench':bench([0,.55,.38],[.93,.14,.64]);break;
    case 'bosu':ell(equipment,[-.105,.015,.035],[.36,.22,.36],accent);block(equipment,[-.105,.012,.035],[.76,.025,.76]);break;
    case 'ball':ell(equipment,e.at,[.12,.12,.12],accent);break;
    case 'club':{
     beam(equipment,e.from,e.to,.009,steel);
     ell(equipment,e.to,e.driver?[.063,.04,.065]:[.055,.025,.025],rubber);break;}
    case 'golfball':ell(equipment,e.at,[.023,.023,.023],skin);break;
   }
  }
 }
 const floor=new THREE.Mesh(new THREE.CircleGeometry(1.8,80),mat('#1b1f26',.95));floor.rotation.x=-Math.PI/2;floor.position.y=-.016;scene.add(floor);
 const grid=new THREE.GridHelper(3.4,17,'#353b47','#272c35');grid.position.y=-.012;scene.add(grid);
 let yaw=1.05,pitch=.20,phase=0,playing=!matchMedia('(prefers-reduced-motion: reduce)').matches,speed=1,last=performance.now();
 let current=P.pose(entry.kind,0,id),distance=current.distance,defaultDistance=distance;
 let target=new THREE.Vector3(...current.target),pointers=new Map(),pinch=0;
 function updateCamera(){camera.position.set(target.x+distance*Math.cos(pitch)*Math.sin(yaw),target.y+distance*Math.sin(pitch),target.z+distance*Math.cos(pitch)*Math.cos(yaw));camera.lookAt(target);canvas.dataset.yaw=yaw.toFixed(3);canvas.dataset.distance=distance.toFixed(3);}
 function play(v){playing=v;$('play').textContent=v?'일시정지':'재생';}play(playing);
 function pose(t){
  current=P.pose(entry.kind,t,id);used={};human(current);gear(current);
  for(const [key,list]of Object.entries(pools))for(let i=used[key]||0;i<list.length;i++)list[i].visible=false;
  const labels=entry.kind==='golf'?['준비 · 백스윙','체중이동 · 지연','임팩트 · 마무리']:[entry.captions[0],entry.captions[1],'천천히 돌아오기'];
  $('stage').textContent=labels[current.stage];$('phaseTitle').textContent=labels[current.stage];
  $('phaseText').textContent=current.stage===0?entry.notes[0]:current.stage===1?entry.focus.move:entry.focus.feel;
  $('muscle').textContent=entry.focus.muscle;
  if(entry.visualNote){$('visualNote').hidden=false;$('visualNote').textContent=entry.visualNote;}
  red.emissive.setHex(0x6e1610);red.emissiveIntensity=.08+.13*current.q;
  canvas.dataset.phase=t.toFixed(4);canvas.dataset.kind=entry.kind;
 }
 // Read-only snapshot for deterministic pose and WebGL verification.
 window.exerciseViewer={snapshot:()=>JSON.parse(JSON.stringify({id,kind:entry.kind,phase,pose:current,yaw,distance,meshCount:body.children.length}))};
 function resize(){const r=vp.getBoundingClientRect();renderer.setSize(r.width,r.height);camera.aspect=r.width/r.height;camera.updateProjectionMatrix();}
 new ResizeObserver(resize).observe(vp);
 function orbit(dx,dy){yaw-=dx*.008;pitch=THREE.MathUtils.clamp(pitch+dy*.005,-.25,1.25);updateCamera();}
 canvas.addEventListener('pointerdown',e=>{canvas.setPointerCapture(e.pointerId);pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});pinch=0;});
 canvas.addEventListener('pointermove',e=>{if(!pointers.has(e.pointerId))return;const old=pointers.get(e.pointerId);pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});if(pointers.size===1)orbit(e.clientX-old.x,e.clientY-old.y);else{const [a,b]=[...pointers.values()];const d=Math.hypot(a.x-b.x,a.y-b.y);if(pinch>0&&d>0)distance=THREE.MathUtils.clamp(distance*pinch/d,1.3,7);pinch=d;updateCamera();}});
 for(const event of ['pointerup','pointercancel','lostpointercapture'])canvas.addEventListener(event,e=>{pointers.delete(e.pointerId);pinch=0;});
 canvas.addEventListener('wheel',e=>{e.preventDefault();distance=THREE.MathUtils.clamp(distance*Math.exp(e.deltaY*.001),1.3,7);updateCamera();},{passive:false});
 canvas.addEventListener('keydown',e=>{if(!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','+','=','-'].includes(e.key))return;e.preventDefault();if(e.key==='ArrowLeft')yaw+=.18;if(e.key==='ArrowRight')yaw-=.18;if(e.key==='ArrowUp')pitch=Math.min(1.25,pitch+.1);if(e.key==='ArrowDown')pitch=Math.max(-.25,pitch-.1);if(e.key==='+'||e.key==='=')distance=Math.max(1.3,distance-.2);if(e.key==='-')distance=Math.min(7,distance+.2);updateCamera();});
 document.querySelectorAll('[data-view]').forEach(b=>b.onclick=()=>{yaw={front:0,side:Math.PI/2,back:Math.PI,reset:1.05}[b.dataset.view];pitch=.20;if(b.dataset.view==='reset')distance=defaultDistance;updateCamera();});
 $('play').onclick=()=>play(!playing);$('speed').onchange=e=>speed=Number(e.target.value);
 $('progress').oninput=e=>{play(false);phase=Math.min(.99999,Number(e.target.value)/1000);pose(phase);};
 $('machine').onclick=()=>{equipment.visible=!equipment.visible;$('machine').setAttribute('aria-pressed',String(equipment.visible));};
 document.addEventListener('visibilitychange',()=>last=performance.now());
 canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();play(false);$('error').hidden=false;$('error').textContent='3D 화면 연결이 끊겼습니다. 자세 보기를 접었다 다시 열어 주세요.';});
 updateCamera();resize();pose(0);canvas.dataset.ready='true';
 function tick(now){requestAnimationFrame(tick);const dt=Math.min((now-last)/1000,.05);last=now;if(document.hidden)return;if(playing){phase=(phase+dt*speed/(entry.kind==='golf'?9:6))%1;pose(phase);$('progress').value=Math.round(phase*1000);}renderer.render(scene,camera);}
 requestAnimationFrame(tick);
}catch(e){$('error').hidden=false;$('error').textContent='3D 화면을 열지 못했습니다. Chrome에서 다시 열어 주세요.';console.error(e);}
})();
