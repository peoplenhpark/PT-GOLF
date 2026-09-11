(()=>{'use strict';
const $=id=>document.getElementById(id), vp=$('viewport');
try{
const scene=new THREE.Scene();scene.background=new THREE.Color('#14161b');
const camera=new THREE.PerspectiveCamera(37,1,.03,30);
const renderer=new THREE.WebGLRenderer({antialias:true});renderer.setPixelRatio(Math.min(devicePixelRatio,2));renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;
vp.prepend(renderer.domElement);const canvas=renderer.domElement;canvas.tabIndex=0;canvas.setAttribute('aria-label','3D 운동 모델. 드래그 또는 방향키로 회전, 휠 또는 더하기 빼기로 확대.');
const mat=(c,roughness=.52,metalness=.08)=>new THREE.MeshStandardMaterial({color:c,roughness,metalness});
const skin=mat('#bdc2c9'),bone=mat('#abb3be'),red=mat('#e45449',.48),cloth=mat('#262a31',.95),steel=mat('#555c69',.38,.6),rubber=mat('#242830',.8),wire=mat('#aaaeb9',.35,.65);
scene.add(new THREE.HemisphereLight('#eef3ff','#444045',2));
function light(c,int,x,y,z){let l=new THREE.DirectionalLight(c,int);l.position.set(x,y,z);scene.add(l);return l;}
const key=light('#fff2e7',3,-2,4,3);key.castShadow=true;key.shadow.mapSize.set(1024,1024);key.shadow.camera.left=-3;key.shadow.camera.right=3;key.shadow.camera.top=3;key.shadow.camera.bottom=-3;
light('#c6ddff',2.4,2,2,-3);light('#ffffff',.8,3,1,2);
const sphere=new THREE.SphereGeometry(1,32,24),Y=new THREE.Vector3(0,1,0);
function ell(parent,m,pos,scale){let o=new THREE.Mesh(sphere,m);o.position.set(...pos);o.scale.set(...scale);o.castShadow=true;o.receiveShadow=true;parent.add(o);return o;}
function beam(parent,a,b,r1,r2,m){a=new THREE.Vector3(...a);b=new THREE.Vector3(...b);let delta=b.clone().sub(a);let o=new THREE.Mesh(new THREE.CylinderGeometry(r2,r1,delta.length(),20),m);o.position.copy(a.clone().add(b).multiplyScalar(.5));o.quaternion.setFromUnitVectors(Y,delta.normalize());o.castShadow=true;parent.add(o);return o;}
function muscle(parent,a,b,r1,r2,m){a=new THREE.Vector3(...a);b=new THREE.Vector3(...b);let d=b.clone().sub(a),len=d.length();let pts=[];for(let i=0;i<=16;i++){let t=i/16;let r=(r1*(1-t)+r2*t)*(0.78+0.22*Math.sin(Math.PI*t));pts.push(new THREE.Vector2(r,t*len));}let o=new THREE.Mesh(new THREE.LatheGeometry(pts,28),m);o.position.copy(a);o.quaternion.setFromUnitVectors(Y,d.normalize());o.castShadow=true;parent.add(o);return o;}
const model=new THREE.Group();scene.add(model);
const rings=[[.87,.13,.10,-.035],[.98,.165,.105,-.015],[1.06,.142,.1,.01],[1.18,.163,.11,.04],[1.32,.214,.13,.065],[1.43,.215,.117,.08],[1.48,.15,.085,.08]];
const verts=[],indices=[],N=48;rings.forEach(([y,w,d,z])=>{for(let i=0;i<=N;i++){let a=i/N*Math.PI*2;verts.push(w*Math.cos(a),y,z+d*Math.sin(a));}});
for(let r=0;r<rings.length-1;r++)for(let i=0;i<N;i++){let a=r*(N+1)+i,b=a+N+1;indices.push(a,b,a+1,b,b+1,a+1);}
let geom=new THREE.BufferGeometry();geom.setAttribute('position',new THREE.Float32BufferAttribute(verts,3));geom.setIndex(indices);geom.computeVertexNormals();const torso=new THREE.Mesh(geom,skin);torso.castShadow=true;model.add(torso);
ell(model,cloth,[0,.915,-.02],[.177,.14,.12]);
muscle(model,[0,1.45,.08],[0,1.59,.10],.072,.06,skin);
ell(model,skin,[0,1.685,.115],[.092,.119,.09]);ell(model,skin,[0,1.644,.166],[.064,.055,.039]);ell(model,skin,[0,1.679,.205],[.018,.024,.024]);
for(let s of [-1,1]){
ell(model,skin,[s*.088,1.36,.169],[.104,.079,.039]);ell(model,skin,[s*.094,1.35,-.055],[.102,.113,.035]);
ell(model,skin,[s*.105,1.453,.058],[.092,.045,.074]);
for(let y of [1.10,1.17,1.24])ell(model,skin,[s*.038,y,.139],[.04,.034,.019]);
ell(model,skin,[s*.115,1.17,.103],[.033,.1,.03]);
let hip=[s*.106,.895,-.035],knee=[s*.133,.505,.04],ankle=[s*.135,.125,-.015];
muscle(model,hip,knee,.108,.063,skin);ell(model,cloth,[s*.106,.849,-.028],[.113,.14,.119]);
ell(model,skin,[s*.122,.646,.078],[.067,.128,.042]);ell(model,bone,knee,[.06,.067,.055]);
muscle(model,knee,ankle,.059,.029,skin);ell(model,skin,[s*.137,.342,-.029],[.049,.105,.049]);ell(model,cloth,[s*.135,.058,.055],[.062,.051,.134]);
let shoulder=[s*.224,1.425,.075],elbow=[s*.237,1.13,.093];
muscle(model,shoulder,elbow,.066,.035,skin);ell(model,skin,shoulder,[.079,.086,.076]);
ell(model,skin,[s*.24,1.293,.116],[.05,.085,.038]);
ell(model,red,[s*.243,1.289,.04],[.051,.109,.038]);ell(model,red,[s*.267,1.306,.058],[.031,.092,.029]);
ell(model,bone,elbow,[.037,.036,.036]);
}
const arms=[];for(let s of [-1,1]){
let g=new THREE.Group();g.position.set(s*.237,1.13,.093);model.add(g);
muscle(g,[0,0,0],[0,0,.271],.039,.024,skin);ell(g,skin,[0,0,.09],[.043,.038,.08]);
ell(g,skin,[0,0,.303],[.043,.027,.047]);
for(let f=0;f<4;f++){const points=[];for(let j=0;j<=12;j++){let a=j/12*Math.PI*1.6;points.push(new THREE.Vector3((f-1.5)*.017,.015*Math.sin(a),.326+.015*Math.cos(a)));}
g.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points),16,.007,7,false),skin));}
ell(g,skin,[-s*.035,-.004,.311],[.015,.015,.029]);arms.push(g);
}
const bar=new THREE.Group();scene.add(bar);beam(bar,[-.31,0,0],[.31,0,0],.012,.012,steel);for(let s of [-1,1])beam(bar,[s*.185,0,0],[s*.288,0,0],.018,.018,rubber);
const machine=new THREE.Group();scene.add(machine);
for(let s of [-1,1]){beam(machine,[s*.24,.04,1.03],[s*.24,2.19,1.03],.035,.035,steel);beam(machine,[s*.24,.04,.60],[s*.24,.04,1.29],.045,.045,rubber);}
beam(machine,[-.27,2.18,1.03],[.27,2.18,1.03],.043,.043,steel);beam(machine,[0,2.18,1.03],[0,2.18,.76],.035,.035,steel);
const pulley=new THREE.Mesh(new THREE.CylinderGeometry(.065,.065,.035,32),steel);pulley.rotation.z=Math.PI/2;pulley.position.set(0,2.13,.76);machine.add(pulley);
for(let i=0;i<12;i++){let b=new THREE.Mesh(new THREE.BoxGeometry(.31,.035,.19),rubber);b.position.set(0,.13+i*.042,1.04);machine.add(b);}
const cableGeo=new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(),new THREE.Vector3()]);const cable=new THREE.Line(cableGeo,new THREE.LineBasicMaterial({color:'#c8ccd3'}));scene.add(cable);
const floor=new THREE.Mesh(new THREE.CircleGeometry(1.35,80),mat('#20232b',.9));floor.rotation.x=-Math.PI/2;floor.position.set(0,.002,.25);floor.receiveShadow=true;scene.add(floor);
const grid=new THREE.GridHelper(2.4,12,'#343944','#2a2e38');grid.position.set(0,.004,.25);scene.add(grid);
let yaw=1.12,pitch=.10,distance=3.55,phase=0,playing=!matchMedia('(prefers-reduced-motion: reduce)').matches,speed=1,last=performance.now();
const target=new THREE.Vector3(0,1.06,.10),pointers=new Map();let pinch=0,previous;
function updateCamera(){camera.position.set(target.x+distance*Math.cos(pitch)*Math.sin(yaw),target.y+distance*Math.sin(pitch),target.z+distance*Math.cos(pitch)*Math.cos(yaw));camera.lookAt(target);canvas.dataset.yaw=yaw.toFixed(3);canvas.dataset.distance=distance.toFixed(3);}
function play(v){playing=v;$('play').textContent=v?'일시정지':'재생';}play(playing);
function pose(t){let q,stage,title,text;if(t<.12){q=0;stage='01 준비';title='준비 · 기구 가까이 서기';text='손잡이를 잡고 팔꿈치를 몸 옆에 고정하세요.';}
else if(t<.46){let u=(t-.12)/.34;q=u*u*(3-2*u);stage='02 팔 펴기';title='팔꿈치를 펴서 아래로';text='배에 힘을 주고, 가슴과 몸통은 그대로 유지하세요.';}
else if(t<.60){q=1;stage='02 삼두의 조임';title='팔 뒤쪽의 조임을 느끼기';text='어깨로 누르지 않고 삼두에 힘이 들어오는지 확인하세요.';}
else{let u=(t-.60)/.40;q=1-u*u*(3-2*u);stage='03 돌아오기';title='천천히 돌아오기';text='팔을 굽힐 때도 팔꿈치는 몸 옆 같은 자리에 둡니다.';}
let angle=q*1.44;arms.forEach(a=>a.rotation.x=angle);bar.position.set(0,1.13-.326*Math.sin(angle),.093+.326*Math.cos(angle));
const a=cableGeo.attributes.position;a.setXYZ(0,0,2.13,.76);a.setXYZ(1,bar.position.x,bar.position.y+.017,bar.position.z);a.needsUpdate=true;cableGeo.computeBoundingSphere();
$('stage').textContent=stage;$('phaseTitle').textContent=title;$('phaseText').textContent=text;red.emissive.setHex(0x7f1812);red.emissiveIntensity=.04+.2*q;canvas.dataset.phase=t.toFixed(4);
}
function resize(){const r=vp.getBoundingClientRect();renderer.setSize(r.width,r.height);camera.aspect=r.width/r.height;camera.updateProjectionMatrix();}new ResizeObserver(resize).observe(vp);
function orbit(dx,dy){yaw-=dx*.008;pitch=THREE.MathUtils.clamp(pitch+dy*.005,-.3,.85);updateCamera();}
canvas.addEventListener('pointerdown',e=>{canvas.setPointerCapture(e.pointerId);pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});pinch=0;previous={x:e.clientX,y:e.clientY};});
canvas.addEventListener('pointermove',e=>{if(!pointers.has(e.pointerId))return;const old=pointers.get(e.pointerId);pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});if(pointers.size===1)orbit(e.clientX-old.x,e.clientY-old.y);else{const [a,b]=[...pointers.values()];let d=Math.hypot(a.x-b.x,a.y-b.y);if(pinch>0&&d>0)distance=THREE.MathUtils.clamp(distance*pinch/d,1.5,6);pinch=d;updateCamera();}});
for(let evt of ['pointerup','pointercancel','lostpointercapture'])canvas.addEventListener(evt,e=>{pointers.delete(e.pointerId);pinch=0;});
canvas.addEventListener('wheel',e=>{e.preventDefault();distance=THREE.MathUtils.clamp(distance*Math.exp(e.deltaY*.001),1.5,6);updateCamera();},{passive:false});
canvas.addEventListener('keydown',e=>{if(!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','+','=','-'].includes(e.key))return;e.preventDefault();if(e.key==='ArrowLeft')yaw+=.18;if(e.key==='ArrowRight')yaw-=.18;if(e.key==='ArrowUp')pitch=Math.min(.85,pitch+.1);if(e.key==='ArrowDown')pitch=Math.max(-.3,pitch-.1);if(e.key==='+'||e.key==='=')distance=Math.max(1.5,distance-.2);if(e.key==='-')distance=Math.min(6,distance+.2);updateCamera();});
document.querySelectorAll('[data-view]').forEach(b=>b.onclick=()=>{yaw={front:0,side:Math.PI/2,back:Math.PI,reset:1.12}[b.dataset.view];pitch=.1;if(b.dataset.view==='reset')distance=3.55;updateCamera();});
$('play').onclick=()=>play(!playing);$('speed').onchange=e=>speed=Number(e.target.value);$('progress').oninput=e=>{play(false);phase=Number(e.target.value)/1000;if(phase===1)phase=.9999;pose(phase);};
$('machine').onclick=()=>{machine.visible=!machine.visible;cable.visible=machine.visible;$('machine').setAttribute('aria-pressed',machine.visible?'true':'false');};
document.addEventListener('visibilitychange',()=>last=performance.now());canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();play(false);$('error').hidden=false;$('error').textContent='3D 화면 연결이 끊겼습니다. 페이지를 새로고침해 주세요.';});
updateCamera();resize();pose(phase);
function tick(now){requestAnimationFrame(tick);let dt=Math.min((now-last)/1000,.05);last=now;if(document.hidden)return;if(playing){phase=(phase+dt*speed/4.8)%1;pose(phase);$('progress').value=Math.round(phase*1000);}scene.updateMatrixWorld();let p=new THREE.Vector3(.237,1.13,.093).project(camera);$('elbow').style.left=(p.x*.5+.5)*vp.clientWidth+'px';$('elbow').style.top=(-p.y*.5+.5)*vp.clientHeight+'px';$('elbow').hidden=p.z>1||Math.abs(p.x)>.9||Math.abs(p.y)>.9;renderer.render(scene,camera);}requestAnimationFrame(tick);
}catch(e){$('error').hidden=false;$('error').textContent='3D 화면을 열지 못했습니다. WebGL을 지원하는 Chrome에서 다시 열어 주세요.';console.error(e);}
})();
