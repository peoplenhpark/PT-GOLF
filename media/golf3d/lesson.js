/* Teaching reconstruction from du58mmLNMnQ. Wrist angles are illustrative,
   not measurements of the speaker. Whole-body motion remains CMU 64_01. */
(function(){
'use strict';
const $=id=>document.getElementById(id),T=window.THREE,P=window.GolfPoses,V=window.exerciseViewer;
if(!T||!V)return;
const chapters=[
 {start:0,end:9,title:'작은 백스윙에서 시작',short:'준비',view:'body',source:275,from:0,to:P.stages[2].t,text:'손목이 일찍 풀려 맞는 동작을 줄이는 연습입니다. 처음에는 백스윙을 작게 연습하고, 몸통과 팔이 함께 움직이는 흐름을 살펴보세요.'},
 {start:9,end:18,title:'오른손목의 힌지 유지',short:'오른손목',view:'wrist',source:245,from:P.stages[2].t,to:P.stages[3].t,text:'내려올 때 오른손목의 뒤로 꺾인 상태, 힌지가 너무 일찍 풀리지 않게 합니다. 헤드를 먼저 떨어뜨리지 않고 손과 클럽이 함께 내려오는 느낌입니다.'},
 {start:18,end:28,title:'왼손목은 점진적으로',short:'왼손목',view:'wrist',source:179,from:P.stages[3].t,to:P.stages[4].t,text:'백스윙 톱에서 내려오면서 왼손목을 조금씩 말아줍니다. 임팩트 직전에 갑자기 뒤집는 동작이 아닙니다. 흰색 손과 팔의 연결이 서서히 펴지는 모습을 보세요.'},
 {start:28,end:38,title:'회전과 함께 만드는 임팩트',short:'임팩트',view:'body',source:129,from:P.stages[4].t,to:P.stages[5].t,text:'손만 앞으로 끌지 않고 골반과 몸통도 함께 회전합니다. 양손이 왼쪽 허벅지 앞에 위치하며 클럽헤드보다 목표 쪽에 앞서는 임팩트를 이해합니다.'},
 {start:38,end:46,title:'과장된 느낌 ≠ 실제 각도',short:'손목 확인',view:'wrist',source:494,from:P.stages[5].t,to:P.stages[5].t,text:'왼손등이 불룩해지는 보잉은 반대로 꺾이는 습관을 고치려는 느낌입니다. 영상에서도 실제로는 평평해도 된다고 설명합니다. 모형은 손목을 과도하게 꺾지 않습니다.'},
 {start:46,end:53,title:'어깨 회전으로 연결',short:'마무리',view:'body',source:409,from:P.stages[5].t,to:P.stages[6].t,text:'상체가 일찍 들리지 않도록 오른쪽 어깨가 턱 아래로 들어오며 회전합니다. 손목만 조작하지 않고 몸 전체의 움직임 속에서 임팩트를 통과합니다.'},
 {start:53,end:60,title:'이제 한 동작으로 보기',short:'전체 연결',view:'body',source:477,from:0,to:1,text:'오른손목은 일찍 풀지 않기, 왼손목은 점진적으로, 몸은 함께 회전하기. 전체 스윙 예시에서 이 세 가지가 연결되는 순서를 다시 확인하세요.'}
];
const visualPoints=[["작은 백스윙으로 손목이 풀리는 시점을 느껴보세요.", "몸통이 도는 흐름에 팔과 클럽을 함께 연결하세요.", "헤드를 먼저 던지지 않고 내려올 준비를 합니다."], ["오른손목이 뒤로 꺾인 상태가 힌지입니다.", "내려오기 시작할 때 이 꺾임을 너무 일찍 풀지 마세요.", "헤드부터 떨어뜨리지 말고 손과 클럽을 함께 내립니다."], ["흰색 왼손과 팔이 이어지는 부분을 살펴보세요.", "톱에서 내려오는 동안 손목을 조금씩 말아줍니다.", "임팩트 직전에 손목을 갑자기 뒤집지 않습니다."], ["골반과 몸통의 회전을 손의 움직임과 연결하세요.", "임팩트 때 양손은 왼쪽 허벅지 앞에 위치합니다.", "손이 헤드보다 목표 쪽에 앞서되, 손만 끌지 마세요."], ["왼손등의 보잉은 반대로 꺾이는 습관을 고치는 느낌입니다.", "실제 왼손목은 평평해도 됩니다. 과하게 꺾지 마세요.", "오른손목의 힌지와 왼손목의 연결을 함께 확인하세요."], ["임팩트 전에 상체가 일찍 들리지 않도록 합니다.", "오른쪽 어깨가 턱 아래로 들어오며 회전하세요.", "손목만 조작하지 않고 몸과 팔이 함께 통과합니다."], ["오른손목의 힌지가 너무 일찍 풀리지 않게 합니다.", "왼손목은 내려오면서 점진적으로 말아줍니다.", "몸의 회전과 연결해 임팩트부터 마무리까지 이어갑니다."]];
let time=0,playing=false,index=-1,manualView=null,view='body',previous=performance.now(),wristYaw=-.48,wristPitch=.12;
const smooth=x=>x*x*(3-2*x),clamp=x=>Math.max(0,Math.min(1,x));
const scene=new T.Scene();scene.background=new T.Color(0xe7eeeb);
scene.add(new T.HemisphereLight(0xffffff,0x657f73,2.6));const light=new T.DirectionalLight(0xffffff,3);light.position.set(-2,4,3);scene.add(light);
let renderer;try{renderer=new T.WebGLRenderer({antialias:true});}catch(e){$('wristView').disabled=true;return;}
renderer.setPixelRatio(Math.min(devicePixelRatio||1,2));const canvas=renderer.domElement;canvas.tabIndex=0;canvas.setAttribute('aria-label','왼손과 오른손의 손목 원리 3D. 드래그 또는 방향키로 회전');$('wristViewport').appendChild(canvas);
const camera=new T.PerspectiveCamera(38,1,.01,10),group=new T.Group();scene.add(group);
const mat=color=>new T.MeshStandardMaterial({color,roughness:.65});
const white=mat(0xf6fff7),skin=mat(0xdd9a70),shaftMat=mat(0x405860),gripMat=mat(0x233832),leadAccent=mat(0x3b9988),trailAccent=mat(0xc77b32);
const axis=new T.Vector3(0,1,0),sphere=new T.SphereGeometry(1,20,14);
function mesh(geo,material,parent=group){const m=new T.Mesh(geo,material);parent.add(m);return m;}
function segment(m,a,b,r){m.position.copy(a).add(b).multiplyScalar(.5);m.scale.set(r,a.distanceTo(b),r);m.quaternion.setFromUnitVectors(axis,b.clone().sub(a).normalize());}
function ball(at,scale,material){const m=mesh(sphere,material);m.position.copy(at);m.scale.set(...scale);return m;}
const shaft=mesh(new T.CylinderGeometry(.006,.006,1,18),shaftMat);shaft.position.y=-.26;
const grip=mesh(new T.CylinderGeometry(.015,.017,.30,20),gripMat);grip.position.y=.10;
const hands=[];
for(let i=0;i<2;i++){
 const y=i===0?.15:.025,sign=i===0?-1:1,material=i===0?white:skin;
 const palm=ball(new T.Vector3(sign*.016,y,.035),[.037,.053,.021],material);
 // Four curved fingers wrap the same grip; thumbs lie along its front.
 for(let f=0;f<4;f++){
  const pts=[];for(let k=0;k<=18;k++){const a=.18+k/18*Math.PI*1.66;pts.push(new T.Vector3(Math.cos(a)*.029,y+.027-f*.019,Math.sin(a)*.029));}
  mesh(new T.TubeGeometry(new T.CatmullRomCurve3(pts),24,.008,8,false),material);
 }
 const thumb=ball(new T.Vector3(sign*.012,y+.027,-.024),[.012,.038,.010],material);thumb.rotation.z=sign*.25;
 const wrist=new T.Vector3(sign*.032,y+.071,.041);
 ball(wrist,[.022,.025,.020],material);
 const forearm=mesh(new T.CylinderGeometry(1,1,1,20),i===0?white:skin);
 const cuff=mesh(new T.CylinderGeometry(1,1,1,20),i===0?leadAccent:trailAccent);
 const guide=mesh(new T.CylinderGeometry(1,1,1,12),i===0?leadAccent:trailAccent);
 hands.push({wrist,forearm,cuff,guide,sign});
}
group.rotation.z=-.42;
function drawWrist(){
 const progress=clamp((time-18)/10);
 // Keep the right wrist extended; lead extension resolves gradually to flat.
 const lead=.42*(1-smooth(progress)),trail=.48;
 hands.forEach((h,i)=>{
  const angle=i===0?lead:trail;
  const direction=new T.Vector3(h.sign*.36,Math.cos(angle),Math.sin(angle)).normalize();
  const elbow=h.wrist.clone().addScaledVector(direction,.26);
  segment(h.forearm,h.wrist,elbow,.023);
  segment(h.cuff,h.wrist.clone().addScaledVector(direction,.012),h.wrist.clone().addScaledVector(direction,.030),.024);
  const a=h.wrist.clone().add(new T.Vector3(h.sign*.026,0,.026));
  segment(h.guide,a,a.clone().addScaledVector(direction,.115),.0028);
 });
 camera.position.set(Math.sin(wristYaw)*1.15,.17+Math.sin(wristPitch)*1.15,Math.cos(wristYaw)*1.15);camera.lookAt(0,.12,0);renderer.render(scene,camera);canvas.dataset.ready='true';canvas.dataset.time=time;
}
function setView(v){view=v;$('viewport').hidden=v!=='body';$('wristViewport').hidden=v!=='wrist';document.querySelector('.views').style.visibility=v==='body'?'visible':'hidden';$('bodyView').setAttribute('aria-pressed',v==='body');$('wristView').setAttribute('aria-pressed',v==='wrist');if(v==='wrist')resize();}
$('bodyView').onclick=()=>{manualView='body';setView('body');};$('wristView').onclick=()=>{manualView='wrist';setView('wrist');};
function resize(){const box=$('wristViewport');if(!box.clientWidth)return;camera.aspect=box.clientWidth/box.clientHeight;camera.updateProjectionMatrix();renderer.setSize(box.clientWidth,box.clientHeight,false);drawWrist();}
new ResizeObserver(resize).observe($('wristViewport'));
let pointer=null;canvas.onpointerdown=e=>{canvas.setPointerCapture(e.pointerId);pointer=[e.clientX,e.clientY];};canvas.onpointermove=e=>{if(!pointer)return;wristYaw+=(e.clientX-pointer[0])*.008;wristPitch=Math.max(-.45,Math.min(.7,wristPitch+(e.clientY-pointer[1])*.005));pointer=[e.clientX,e.clientY];drawWrist();};canvas.onpointerup=canvas.onpointercancel=canvas.onlostpointercapture=()=>pointer=null;
canvas.onkeydown=e=>{if(!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(e.key))return;e.preventDefault();if(e.key==='ArrowLeft')wristYaw-=.12;if(e.key==='ArrowRight')wristYaw+=.12;if(e.key==='ArrowUp')wristPitch=Math.min(.7,wristPitch+.1);if(e.key==='ArrowDown')wristPitch=Math.max(-.45,wristPitch-.1);drawWrist();};
function scrollLesson(){document.getElementById(view==='body'?'viewport':'wristViewport').scrollIntoView({block:'start',behavior:'smooth'});}
function setPlaying(value){playing=value;$('lessonPlay').textContent=playing?'일시정지':time>=60?'처음부터 다시 보기':time>0?'이어서 재생':'60초 레슨 재생';}
function update(){
 const next=chapters.findIndex(c=>time<c.end),n=next<0?6:next,c=chapters[n];
 if(n!==index){index=n;manualView=null;setView(c.view);$('chapterNumber').textContent=String(n+1).padStart(2,'0')+' / 07';$('lessonTitle').textContent=c.title;$('visualTitle').textContent=c.title;$('visualPoints').replaceChildren(...visualPoints[n].map(text=>{const li=document.createElement('li');li.textContent=text;return li;}));$('lessonText').textContent=c.text;$('sourceMoment').href='https://www.youtube.com/watch?v=du58mmLNMnQ&t='+c.source+'s';document.querySelectorAll('[data-chapter]').forEach(b=>b.setAttribute('aria-pressed',+b.dataset.chapter===n));}
 const u=clamp((time-c.start)/(c.end-c.start));
 V.setPhase(c.from+(c.to-c.from)*u);
 $('lessonTime').textContent=Math.floor(time/60)+':'+String(Math.floor(time%60)).padStart(2,'0')+' / 1:00';$('lessonProgress').value=time;
 drawWrist();document.body.dataset.lessonTime=time;document.body.dataset.lessonPlaying=playing;
}
chapters.forEach((c,i)=>{const b=document.createElement('button');b.dataset.chapter=i;const small=document.createElement('small');small.textContent='0:'+String(c.start).padStart(2,'0');b.append(small,document.createTextNode(c.short));b.onclick=()=>{time=c.start;setPlaying(false);index=-1;update();scrollLesson();};$('lessonChapters').appendChild(b);});
$('lessonPlay').onclick=()=>{if(time>=60){time=0;index=-1;}setPlaying(!playing);previous=performance.now();update();if(playing)scrollLesson();};
$('lessonProgress').oninput=e=>{time=+e.target.value;setPlaying(false);update();};
document.addEventListener('visibilitychange',()=>{if(document.hidden){setPlaying(false);update();}});
function tick(now){const dt=Math.min((now-previous)/1000,.1);previous=now;if(playing){time=Math.min(60,time+dt);if(time>=60)setPlaying(false);update();}requestAnimationFrame(tick);}requestAnimationFrame(tick);
window.golfLesson={snapshot:()=>({time,playing,index,view,chapters:chapters.length,source:'du58mmLNMnQ',wristModel:'educational',wristYaw})};
update();
})();
