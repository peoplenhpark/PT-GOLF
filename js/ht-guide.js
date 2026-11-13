/* HT is the daily entry; PT IDs remain the original record keys. */
window.HTGuide=(()=>{
 const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const sourceIds=['pt_session_20261113','pt_session_20261106'];
 const basicIds=new Set(['pt_openbook','pt_tailbone_raise','pt_hip_openclose_stretch']);
 function library(){return [...new Map(Store.getAll().filter(e=>['pt','ht'].includes(e.part)).map(e=>[e.id,e])).values()];}
 function categories(){return [...new Set(library().map(e=>e.category))];}
 function review(){
  const sessions=Store.getPTSessions(),sources=sourceIds.map(id=>sessions.find(s=>s.id===id)).filter(Boolean),seen=new Set();
  const groups=[{key:'basic',label:'기본운동',items:[]},{key:'upper',label:'상체 · 11.06 마지막 수업',items:[]},{key:'lower',label:'하체 · 11.13 마지막 수업',items:[]}];
  for(const source of sources)for(const item of source.items){if(!item.exerciseId||seen.has(item.exerciseId))continue;const exercise=Store.getById(item.exerciseId);if(!exercise)continue;seen.add(exercise.id);const key=basicIds.has(exercise.id)?'basic':source.id===sourceIds[1]?'upper':'lower';groups.find(g=>g.key===key).items.push({exercise,item,source});}
  return {sources,groups};
 }
 function html(embedded=false){
  const {sources,groups}=review();if(!sources.length)return '';
  const lower=sources.find(s=>s.id===sourceIds[0]);
  return '<section class="coach-recent-pt ht-final-review" aria-labelledby="recent-pt-title"><div class="coach-recent-heading"><h2 id="recent-pt-title">마지막 PT 통합 · HT 운동 기준</h2><time datetime="'+esc(lower?.date||sources[0].date)+'">'+esc(lower?.date||sources[0].date)+'</time></div>'+
   '<p class="coach-meta">11.06 상체와 11.13 하체 수업을 기본운동·상체·하체로 통합했습니다. 각 동작에서 자세·영상·확인 사항을 함께 봅니다.</p>'+
   (embedded?'':'<a class="btn primary coach-routine-link" href="#ht?start=today">오늘 HT 루틴 시작 › <small>기본 20분 포함 · 운동일 70분</small></a><nav class="coach-recap-links" aria-label="HT 운동 자료"><button type="button" data-coach-jump="personal">개인운동·자료 ↓</button><a href="#ht?cat=all&amp;start=library">전체 운동 자료 ›</a></nav>')+
   '<aside class="coach-session-key coach-solo-keys"><h3>혼자 운동할 때</h3><ul><li>정규 PT 수업은 11.13으로 종료했습니다. 이제 HT 루틴을 중심으로 배운 지지와 통제를 반복합니다.</li><li>상체는 가슴·몸통 지지와 팔꿈치 받침을 유지하고, 하체는 처음 잡은 골반 지지를 돌아올 때까지 풀지 않습니다.</li><li>확인된 중량·분량과 아직 미확인인 설정을 구분합니다. 영상의 예시로 개인 수업 설정을 바꾸지 않습니다.</li></ul></aside>'+
   groups.filter(g=>g.items.length).map(g=>'<section class="ht-review-group" data-review-group="'+g.key+'"><h3>'+g.label+'</h3><div class="coach-recent-grid">'+g.items.map(({exercise:e,item})=>'<a href="#exercise/'+encodeURIComponent(e.id)+'" data-review-exercise="'+esc(e.id)+'"><strong>'+esc(e.name)+'</strong><span>'+esc(e.practiceGuide?.core||item.points[0])+'</span><small>자세·영상·확인 사항 ›</small></a>').join('')+'</div></section>').join('')+
   '<div class="ht-review-sources"><h3>마지막 수업 근거</h3>'+sources.map(s=>'<div class="ht-review-source"><time datetime="'+esc(s.date)+'">'+esc(s.date)+'</time> '+esc(s.title)+window.CoachDesk.sessionDetails(s)+'</div>').join('')+'</div></section>';
 }
 function referenceHtml(){return '<section class="coach-session-key ht-always-reference" aria-labelledby="ht-always-title"><h2 id="ht-always-title">상시 참고 · 루틴 외 영상</h2><article data-ht-reference="RGdsQNrhIIY"><h3>복근 운동 자세 참고</h3><p>제로범TV _김영범 · 8분 2초</p><p>일일 루틴에 포함하지 않은 참고 영상입니다. 영상의 운동 후 실시 제안·횟수를 오늘의 HT 분량으로 적용하지 않습니다.</p><div class="pt-video-frames"><figure><img loading="lazy" src="media/pt-reference/ht-always-abs-1.jpg" alt="3분: 누운 자세에서 복근 운동 설명" width="480" height="270"><figcaption>누운 자세 설명 · 3:00</figcaption></figure><figure><img loading="lazy" src="media/pt-reference/ht-always-abs-2.jpg" alt="5분 40초: 누운 상태에서 동작 설명" width="480" height="270"><figcaption>누운 상태 동작 설명 · 5:40</figcaption></figure></div><p><a class="btn" target="_blank" rel="noopener noreferrer" href="https://www.youtube.com/watch?v=RGdsQNrhIIY&amp;t=180s">3:00 누운 자세 설명부터 보기 ↗</a></p><a target="_blank" rel="noopener noreferrer" href="https://www.youtube.com/watch?v=RGdsQNrhIIY">전체 영상 보기 ↗</a></article></section>';}
 return {library,categories,review,html,referenceHtml};
})();
