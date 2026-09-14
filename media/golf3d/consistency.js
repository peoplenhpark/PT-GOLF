/* IsSS-GnQQyY: same captured golfer in every view, with source-specific teaching highlights. */
(function(){
'use strict';
const $=id=>document.getElementById(id),T=window.THREE,P=window.GolfPoses,V=window.exerciseViewer;
if(!T||!V)return;
const chapters=[
 {start:0,end:8,title:'골퍼의 전체 흐름부터 보기',short:'전체 준비',view:'body',source:69,from:0,to:.44,text:'실제 골퍼 형태의 모델에서 준비부터 백스윙까지 살펴봅니다. 파랑은 왼 어깨, 주황은 오른 어깨입니다. 레슨 연습은 작은 스윙부터 시작하세요.',points:['몸·팔·클럽이 연결된 골퍼의 움직임을 먼저 보세요.','파란 왼 어깨와 주황 오른 어깨가 함께 돌아갑니다.','이 모델은 공통 실측 스윙입니다. 작은 연습부터 방향을 확인하세요.']},
 {start:8,end:17,title:'어깨는 기울어진 축을 따라',short:'어깨 축',view:'shoulder',source:149,from:0,to:.44,text:'숙인 척추를 중심으로 어깨가 비스듬히 회전합니다. 백스윙 때 왼 어깨가 아래·안쪽으로 돌아가는 느낌이며, 몸통을 옆으로 꺾는 동작이 아닙니다.',points:['골퍼의 몸통에 표시한 노란 선이 회전축의 방향입니다.','파란 왼 어깨가 숙인 몸통을 따라 돌아가는 모습을 보세요.','숙임을 유지하며 회전합니다. 좌우로 몸을 접지 않습니다.']},
 {start:17,end:26,title:'오른 어깨가 아래·안쪽으로',short:'다운스윙',view:'shoulder',source:282,from:.44,to:.725,text:'전환 후에는 오른 어깨가 아래·안쪽으로 돌아옵니다. 어깨를 공 쪽으로 덮치거나 상체를 일찍 세우지 않고, 팔과 골반도 함께 연결합니다.',points:['주황 오른 어깨가 아래·안쪽으로 움직이는 모습을 보세요.','오른 어깨를 앞으로 내던지거나 몸통을 옆으로 꺾지 않습니다.','골반만 억지로 돌려 팔을 뒤에 남기지 않도록 연결합니다.']},
 {start:26,end:36,title:'임팩트 부근에서 방향 유지',short:'페이스',view:'impact',source:14,from:.708,to:.742,text:'골퍼의 손과 클럽을 함께 보세요. 노란 헤드가 공 주변을 통과하며, 몸과 팔의 회전이 계속 이어집니다. 목표 쪽으로 통과하는 느낌은 임팩트 전후의 짧은 구간입니다.',points:['노란 헤드와 양손이 공 앞을 지나는 시점을 보세요.','목표 방향으로 미는 느낌은 짧은 임팩트 구간의 설명입니다.','다운스윙 내내 페이스를 고정하거나 클럽을 직선으로 밀지 않습니다.']},
 {start:36,end:45,title:'공 앞을 얕고 길게 통과',short:'얕은 통과',view:'impact',source:333,from:.715,to:.742,text:'힌지를 너무 일찍 던지지 않으며 회전으로 통과합니다. 노란 궤적은 이 골퍼 모델의 헤드 이동 경로입니다. 한 점을 깊이 찍지 않습니다.',points:['노란 궤적과 공을 비교하며 헤드가 지나가는 흐름을 보세요.','헤드를 수직으로 떨어뜨리기보다 얕고 길게 쓸어가는 느낌입니다.','손목을 굳혀 잠그거나 땅을 세게 내려찍는 연습이 아닙니다.']},
 {start:45,end:53,title:'어깨·골반·팔을 함께 연결',short:'전신 연결',view:'body',source:185,from:.44,to:1,text:'전신 예시는 같은 원리를 실제 스윙 흐름과 비교하는 장면입니다. 오른 어깨와 팔꿈치가 내려오는 공간을 유지하며 골반·팔의 회전을 연결합니다.',points:['실측 전신 예시에서 숙임과 회전의 흐름을 살펴보세요.','팔꿈치를 옆구리에 억지로 붙여 잠그지 않습니다.','어깨를 먼저 돌리라는 절대 순서가 아니라 협응을 익힙니다.']},
 {start:53,end:60,title:'방향과 리듬을 하나로',short:'전체 복습',view:'body',source:561,from:0,to:1,text:'축을 따라 어깨 회전 → 짧은 임팩트 구간 → 얕은 통과를 연결합니다. 힘·타이밍 원본 영상에서 불필요한 긴장을 줄이는 감각까지 이어서 확인하세요.',points:['작게 연습한 방향 제어를 연속 동작으로 연결합니다.','몸의 구조를 유지하면서 손·어깨의 과한 긴장은 줄입니다.','스윙 노트에 출발 방향과 접촉을 기록해 개인 레슨에서 확인하세요.']}
];

let time=0,playing=false,index=-1,view='body',previous=performance.now();
const clamp=x=>Math.max(0,Math.min(1,x));
function setView(v){
 view=v;V.setLessonFocus(v);
 for(const name of ['body','shoulder','impact'])$(name+'View').setAttribute('aria-pressed',name===v);
 $('golferCue').textContent=v==='shoulder'?'파랑 왼 어깨 · 주황 오른 어깨 · 노란 몸통 축':v==='impact'?'노란 클럽헤드와 궤적 · 손과 몸의 회전을 함께 보기':'같은 골퍼의 준비 → 백스윙 → 임팩트 → 피니시';
 document.querySelector('.legend').hidden=v==='impact';$('targetLabel').hidden=true;
 $('viewName').textContent=v==='shoulder'?'상체 확대':v==='impact'?'임팩트 확대':'전신 동작';
 document.body.dataset.lessonView=v;
}
for(const name of ['body','shoulder','impact'])$(name+'View').onclick=()=>setView(name);
function setPlaying(v){playing=v;$('lessonPlay').textContent=v?'일시정지':time>=60?'처음부터 다시 보기':time>0?'이어서 재생':'60초 레슨 재생';}
function update(){const n=chapters.findIndex(c=>time<c.end),next=n<0?6:n,c=chapters[next];if(index!==next){index=next;setView(c.view);$('chapterNumber').textContent=String(next+1).padStart(2,'0')+' / 07';$('lessonTitle').textContent=$('visualTitle').textContent=c.title;$('lessonText').textContent=c.text;$('visualPoints').replaceChildren(...c.points.map(t=>{const li=document.createElement('li');li.textContent=t;return li;}));$('sourceMoment').href='https://www.youtube.com/watch?v=IsSS-GnQQyY&t='+c.source+'s';document.querySelectorAll('[data-chapter]').forEach(b=>b.setAttribute('aria-pressed',+b.dataset.chapter===next));}
 const u=clamp((time-c.start)/(c.end-c.start));V.setPhase(c.from+(c.to-c.from)*u);$('lessonTime').textContent=Math.floor(time/60)+':'+String(Math.floor(time%60)).padStart(2,'0')+' / 1:00';$('lessonProgress').value=time;document.body.dataset.lessonTime=time;document.body.dataset.lessonPlaying=playing;}
function scrollLesson(){$('viewport').scrollIntoView({block:'start',behavior:'smooth'});}
chapters.forEach((c,i)=>{const b=document.createElement('button');b.dataset.chapter=i;const small=document.createElement('small');small.textContent='0:'+String(c.start).padStart(2,'0');b.append(small,document.createTextNode(c.short));b.onclick=()=>{time=c.start;setPlaying(false);index=-1;update();scrollLesson();};$('lessonChapters').appendChild(b);});
$('lessonPlay').onclick=()=>{if(time>=60){time=0;index=-1;}setPlaying(!playing);previous=performance.now();update();if(playing)scrollLesson();};$('lessonProgress').oninput=e=>{time=+e.target.value;setPlaying(false);update();};
document.addEventListener('visibilitychange',()=>{if(document.hidden){setPlaying(false);update();}});
function tick(now){const dt=Math.min((now-previous)/1000,.1);previous=now;if(playing){time=Math.min(60,time+dt);if(time>=60)setPlaying(false);update();}requestAnimationFrame(tick);}
update();requestAnimationFrame(tick);
})();
