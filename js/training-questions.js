/* Read-only questions condensed from practiceGuide.pending; no personal record writes. */
window.TrainingQuestions = (() => {
  const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const groups=['상체 · 기구와 팔 경로','하체 · 지지와 움직임 범위','기본운동 · 받침과 자세','추가 운동 · 적용 여부'];
  const questions=[
    [0,'pt_facepull','손잡이 높이·몸통 기울기·팔꿈치 경로와 현재 중량을 함께 잡아 주실 수 있나요?'],
    [0,'pt_shoulderpress','좌석·손잡이·내리는 끝점, 설정 15의 의미와 제 운동 분량은 어떻게 맞추나요?'],
    [0,'pt_pullup','설정 55의 단위·보조량과 올라갈 때 팔꿈치 방향을 확인해 주세요.'],
    [0,'pt_seatedrow','그립별 손잡이 높이·폭과 팔꿈치 경로는 어떻게 달라지나요? 언더그립은 언제 쓰나요?',['ht_upper_elbows']],
    [0,'pt_latpulldown','제 기구에서 발 지지·몸통 기울기·당김 끝점과 그립은 어디까지인가요?',['ht_latpulldown_reference']],
    [0,'pt_low_cable_curl','어떤 손잡이를 쓰고, 팔을 어디에 둔 채 당기면 되나요?'],
    [1,'pt_backextension','패드 높이·반복 기준을 확인해 주세요. 11/2의 7~8분 동작도 백익스텐션이 맞나요?'],
    [1,'pt_adduction','시작할 때 다리를 얼마나 벌리고, 현재 중량은 얼마로 하면 되나요?'],
    [1,'pt_legextension','양발 기준으로 패드를 어디에 맞추고, 무릎을 어디까지 펴면 되나요?'],
    [1,'pt_legpress','제 발판에서 발 전체를 지지하려면 발 위치를 어떻게 잡아야 하나요?'],
    [2,'pt_tailbone_raise','무릎 90도·발끝 전면 자세에서 머리 받침 높이와 손 위치를 확인해 주세요.'],
    [2,'pt_hip_openclose_stretch','봉을 잡는 손과 지지 다리를 어떻게 배치하나요?'],
    [2,'pt_lunge_ball_rotation','공 무게·높이·회전 범위는 어느 정도이고, 뒷무릎은 바닥에 닿나요?'],
    [3,'pt_lunge','6kg 케틀벨은 몇 개를 어디에 드나요? 루틴에 넣는다면 어느 날·대체 종목·세트로 하나요?'],
    [3,'ht_bulgarian_split_squat','제게 맞는 벤치 높이·보폭·깊이와 안전한 지지물은 무엇인가요?'],
    [3,'ht_wide_dumbbell','영상 동작의 정확한 이름은 무엇이고, 아래쪽 부분 반복도 제게 적용하나요?']
  ];
  // These pending notes limit the scope of a reference; they do not ask for a new prescription.
  const scopeOnly=['ht_upper_form','ht_lower_six','ht_chest_six','ht_squat_comparison'];
  function collect(){
    const pending=Store.getAll().filter(e=>['pt','ht'].includes(e.part)&&e.practiceGuide?.pending?.length);
    const byId=new Map(pending.map(e=>[e.id,e])),used=new Set();
    const rows=questions.flatMap(([group,id,text,related=[]])=>{
      if(!byId.has(id))return [];
      const exercises=[id,...related].filter(x=>byId.has(x)).map(x=>byId.get(x));
      exercises.forEach(e=>used.add(e.id));return [{group,text,exercises}];
    });
    const scope=scopeOnly.filter(id=>byId.has(id)).map(id=>{used.add(id);return byId.get(id);});
    // New unresolved items stay visible even before an editorial short question is written.
    pending.filter(e=>!used.has(e.id)).forEach(e=>rows.push({group:4,text:e.practiceGuide.pending.join(' '),exercises:[e]}));
    return {rows,scope};
  }
  const exerciseLink=e=>'<a href="#exercise/'+encodeURIComponent(e.id)+'">'+esc(e.name)+' ›</a>';
  function entryLink(){const n=collect().rows.length;return n?'<a class="training-question-entry" href="#pt/questions">다음 PT 질문 <span>'+n+'개 모아보기 ›</span></a>':'';}
  function detailLink(id){return '<a class="training-question-detail" href="#pt/questions?source='+encodeURIComponent(id)+'">코치에게 물어볼 항목 모아보기 ›</a>';}
  function render(source){
    const {rows,scope}=collect();let number=0;
    return '<section class="training-questions" aria-labelledby="training-questions-title"><h2 id="training-questions-title">다음 PT · 코치에게 질문</h2><p class="coach-meta">확인 필요 항목을 '+rows.length+'개 질문으로 정리했습니다. 운동명을 누르면 기존 설명을 볼 수 있습니다.</p>'+[...groups,'추가 확인'].map((label,group)=>{
      const items=rows.filter(r=>r.group===group);if(!items.length)return '';
      const start=number+1;
      return '<section class="training-question-group"><h3>'+label+'</h3>'+(group===3?'<p class="coach-meta">보조 운동은 필요할 때만 확인 · 기존 루틴에 자동 추가하지 않습니다.</p>':'')+'<ol start="'+start+'">'+items.map(r=>{number++;return '<li'+(r.exercises.some(e=>e.id===source)?' class="training-question-selected" tabindex="-1"':'')+'><div class="training-question-links">'+r.exercises.map(exerciseLink).join('')+'</div><p>'+esc(r.text)+'</p></li>';}).join('')+'</ol></section>';
    }).join('')+(scope.length?'<aside class="training-question-scope'+(scope.some(e=>e.id===source)?' training-question-selected':'')+'"><h3>보조 영상 · 적용 범위 안내</h3><p class="coach-meta">아래는 새 설정 질문이 아닌 적용 범위 안내입니다. 영상 전체를 루틴에 추가하거나 서로 다른 동작의 기준을 섞지 않습니다.</p><div class="training-question-links">'+scope.map(exerciseLink).join('')+'</div></aside>':'')+'</section>';
  }
  return {collect,entryLink,detailLink,render};
})();
