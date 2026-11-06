/* Read-only questions condensed from practiceGuide.pending; no personal record writes. */
window.TrainingQuestions = (() => {
  const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const groups=['먼저 · 지지·가동범위·중량','이어서 · 기본 자세·그립','필요할 때 · 추가 운동'];
  // Prioritize unresolved setup in the current routine, then technique details and optional additions.
  const questions=[
    [0,'pt_backextension','패드 높이·반복 기준을 확인해 주세요. 11/2의 7~8분 동작도 백익스텐션이 맞나요?'],
    [0,'pt_shoulderpress','받침 자세는 답변받았습니다. 제 정확한 하강 끝점과 현재 중량·횟수·세트를 확인해 주세요.'],
    [0,'pt_facepull','손잡이 높이·몸통 기울기·팔꿈치 경로와 현재 중량을 함께 잡아 주실 수 있나요?'],
    [0,'pt_pullup','가슴·팔꿈치 자세는 답변받았습니다. 설정 55의 단위와 실제 보조량은 얼마인가요?'],
    [0,'pt_lunge','화·금에 추가한 런지는 6kg 케틀벨을 몇 개·어디에 들고, 좌우 몇 회·몇 세트 하나요?'],
    [0,'pt_legpress','제 발판에서 발 전체를 지지하려면 발 위치를 어떻게 잡아야 하나요?'],
    [0,'pt_legextension','양발 기준으로 패드를 어디에 맞추고, 무릎을 어디까지 펴면 되나요?'],
    [0,'pt_adduction','시작할 때 다리를 얼마나 벌리고, 현재 중량은 얼마로 하면 되나요?'],
    [0,'pt_latpulldown','제 기구에서 발 지지·몸통 기울기·당김 끝점과 그립은 어디까지인가요?',['ht_latpulldown_reference']],
    [1,'pt_tailbone_raise','무릎 90도·발끝 전면 자세에서 머리 받침 높이와 손 위치를 확인해 주세요.'],
    [1,'pt_hip_openclose_stretch','봉을 잡는 손과 지지 다리를 어떻게 배치하나요?'],
    [1,'pt_lunge_ball_rotation','공 무게·높이·회전 범위는 어느 정도이고, 뒷무릎은 바닥에 닿나요?'],
    [1,'pt_seatedrow','그립별 손잡이 높이·폭과 팔꿈치 경로는 어떻게 달라지나요? 언더그립은 언제 쓰나요?',['ht_upper_elbows']],
    [1,'pt_low_cable_curl','어떤 손잡이를 쓰고, 팔을 어디에 둔 채 당기면 되나요?'],
    [2,'ht_bulgarian_split_squat','제게 맞는 벤치 높이·보폭·깊이와 안전한 지지물은 무엇인가요?'],
    [2,'ht_wide_dumbbell','영상 동작의 정확한 이름은 무엇이고, 아래쪽 부분 반복도 제게 적용하나요?']
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
    pending.filter(e=>!used.has(e.id)).forEach(e=>rows.push({group:3,text:e.practiceGuide.pending.join(' '),exercises:[e]}));
    return {rows,scope};
  }
  const exerciseLink=e=>'<a href="#exercise/'+encodeURIComponent(e.id)+'">'+esc(e.name)+' ›</a>';
  function entryLink(){const n=collect().rows.length;return n?'<a class="training-question-entry" href="#pt/questions">다음 PT 질문 <span>'+n+'개 모아보기 ›</span></a>':'';}
  function detailLink(id){return '<a class="training-question-detail" href="#pt/questions?source='+encodeURIComponent(id)+'">코치에게 물어볼 항목 모아보기 ›</a>';}
  function answersHtml(exercise){
    const answers=exercise.practiceGuide?.coachAnswers||[];
    return answers.length?'<section class="training-confirmed"><h3>'+ (exercise.practiceGuide?.questionStatus==='answered'?'질문·답변 완료':'확인된 답변')+'</h3>'+answers.map(a=>'<article><h4>'+esc(a.question)+'</h4><p>'+esc(a.answer)+'</p><p class="coach-meta">'+esc(a.date+' · '+a.source)+'</p></article>').join('')+'</section>':'';
  }
  function confirmedList(){return Store.getAll().filter(e=>e.part==='pt'&&e.practiceGuide?.coachAnswers?.length).map(e=>'<section class="training-confirmed-exercise"><div class="training-question-links">'+exerciseLink(e)+'</div>'+answersHtml(e)+'</section>').join('');}
  function golfLessonContext(){
    const lesson=window.GolfHub?.learningSources().lessons.find(l=>l.id==='lesson_20261106_relax');
    return lesson?'<section class="training-confirmed"><h3>11.06 정규 레슨 · 관련 안내</h3><p>'+esc(lesson.practiceCue||lesson.correction)+'</p><p class="coach-meta">오른손 놓기 교정 연습과 기존 드라이버 높은 위치 왼손 이완은 날짜·목적을 구분합니다. 이번 전사에는 아래 세 영상의 직접 검토 답변이 없어 적용 클럽 질문을 확인 필요로 유지합니다.</p><a class="coach-source" href="#golf/lessons/'+encodeURIComponent(lesson.id)+'">정규 레슨과 전사 근거 보기 ›</a><h4>이번 레슨에서 추가로 확인할 것</h4><ul>'+(lesson.followUpQuestions||[]).map(q=>'<li>'+esc(q)+'</li>').join('')+'</ul></section>':'';
  }
  function render(source){
    const {rows,scope}=collect();let number=0;
    return '<section class="training-questions" aria-labelledby="training-questions-title"><nav class="coach-tabs" aria-label="질문 목록"><a href="#pt/questions" aria-current="page">PT·HT 질문</a><a href="#golf/questions">골프 질문</a></nav><h2 id="training-questions-title">다음 PT·HT · 코치에게 질문</h2><p class="coach-meta">현재 루틴의 미확인 지지·범위·중량부터 확인하세요. 전체 '+rows.length+'개 · 운동명은 상세로 연결됩니다.</p>'+[...groups,'우선순위 확인 필요'].map((label,group)=>{
      const items=rows.filter(r=>r.group===group);if(!items.length)return '';
      const start=number+1;
      return '<section class="training-question-group"><h3>'+label+'</h3>'+(group===2?'<p class="coach-meta">보조 운동은 필요할 때만 확인 · 기존 루틴에 자동 추가하지 않습니다.</p>':'')+'<ol start="'+start+'">'+items.map(r=>{number++;return '<li'+(r.exercises.some(e=>e.id===source)?' class="training-question-selected" tabindex="-1"':'')+'><div class="training-question-links">'+r.exercises.map(exerciseLink).join('')+'</div><p>'+esc(r.text)+'</p></li>';}).join('')+'</ol></section>';
    }).join('')+confirmedList()+(scope.length?'<aside class="training-question-scope'+(scope.some(e=>e.id===source)?' training-question-selected':'')+'"><h3>보조 영상 · 적용 범위 안내</h3><p class="coach-meta">아래는 새 설정 질문이 아닌 적용 범위 안내입니다. 영상 전체를 루틴에 추가하거나 서로 다른 동작의 기준을 섞지 않습니다.</p><div class="training-question-links">'+scope.map(exerciseLink).join('')+'</div></aside>':'')+'</section>';
  }
  function renderGolf(){
    const questions=[
      ['lGgedAC0KCA','백스윙 탑 리듬','이 영상의 리듬 연습은 아이언과 드라이버에 모두 적용해도 될까요?'],
      ['kuRoseAIbtw','오른손목·팔꿈치 연결','이 동작은 어떤 클럽에 적용하고, 제 스윙에서는 무엇을 확인하면 될까요?'],
      ['4Eof_tmI0Ag','클럽별 감각 비교','정용훈 프로 영상의 감각 중 아이언과 드라이버에 각각 어떤 것을 적용하면 될까요?']
    ];
    return '<section class="training-questions" aria-labelledby="golf-questions-title"><h2 id="golf-questions-title">다음 골프 · 코치에게 질문</h2><p class="coach-meta">영상의 적용 클럽·범위를 확인할 질문 3개입니다. 주제를 누르면 해당 영상으로 연결됩니다.</p><nav class="coach-tabs" aria-label="질문 목록"><a href="#pt/questions">PT·HT 질문</a><a href="#golf/questions" aria-current="page">골프 질문</a></nav><section class="training-question-group"><ol>'+questions.map(([id,title,text])=>'<li><div class="training-question-links"><a href="#golf/videos/'+encodeURIComponent(id)+'">'+esc(title)+' ›</a></div><p>'+esc(text)+'</p></li>').join('')+'</ol></section>'+golfLessonContext()+'<p class="coach-meta">11.02 사용자 확인 기준: 드라이버 전환 직후, 허리보다 훨씬 높은 위치에서 왼손 힘 빼기. 영상 적용은 이 기준과 구분해 확인합니다.</p></section>';
  }
  return {collect,entryLink,detailLink,render,renderGolf,answersHtml,golfLessonContext};
})();
