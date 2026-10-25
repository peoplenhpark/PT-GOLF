/* Compact PT/golf practice. Personal criteria and observations never mutate source coaching. */
window.CoachDesk = (() => {
  const key='ptgolf_coaching_v1',empty=()=>({schemaVersion:1,criteria:[],active:{},records:[],revisions:[]});
  const handle=Persistence.open(key,{defaults:empty});
  const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const uid=()=>crypto.randomUUID(),stamp=()=>new Date().toISOString();
  const date=()=>new Intl.DateTimeFormat('sv-SE',{timeZone:'Asia/Seoul',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
  const read=()=>handle.read();
  const route=(part,tab='now',id='',source='')=>'#'+part+'/'+tab+(id?'?criterion='+encodeURIComponent(id):source?'?source='+encodeURIComponent(source):'');
  const labels=['도움 됨','판단 어려움','다시 확인'];
  let api,view,bound;
  function sources(part){
    if(part==='pt')return Store.getByPart('pt').map(e=>{
      const latest=Store.getExerciseSessions(e.id).slice().sort((a,b)=>b.date.localeCompare(a.date))[0];
      return {key:'pt:'+e.id,id:e.id,title:e.name,group:e.category,cue:e.spec||e.cues?.[0]||'',check:latest?.item.points?.[0]||e.cues?.[0]||'',setup:e.prep?.[0]||e.spec||'',caution:e.reminders?.[0]||'',origin:latest?latest.date+' PT 수업 연결 · 요약은 직접 확인':'기존 운동 설명 · 내 기준으로 확인 전',href:'#exercise/'+encodeURIComponent(e.id),media:e};
    });
    let g;try{g=window.GolfHub?.learningSources();}catch{}if(!g)return [];
    return [...g.lessons.map(l=>({key:'lesson:'+l.id,id:l.id,title:l.title,group:'레슨',cue:l.practiceCue||l.correction,check:l.practicePoints?.[0]||'',setup:l.scope||'',caution:'적용 클럽과 개인 감각을 구분해 확인',origin:l.date+' 레슨 기록 · 내 기준 요약',clubs:l.practiceClubs||[],href:'#golf/lessons/'+encodeURIComponent(l.id),videoIds:l.videoIds||[]})),
      ...g.notes.map(n=>({key:'note:'+n.id,id:n.id,title:n.name,group:'개인 감각',cue:n.practicalSummary?.action||n.spec||'',check:'',setup:'',caution:'개인 감각은 레슨 및 실제 결과와 비교해 확인',origin:'개인 감각 · 코칭으로 확정하지 않음',clubs:[({golf_iron7:'7번 아이언',golf_iron5:'5번 아이언',golf_ironp:'P 아이언',golf_driver:'드라이버'})[n.id]].filter(Boolean),href:'#exercise/'+encodeURIComponent(n.id)})),
      ...g.videos.map(v=>({key:'video:'+v.id,id:v.id,title:v.title,group:'보조 영상',cue:'',check:'',setup:'',caution:'영상 설명의 적용 조건을 레슨과 비교',origin:'보조 영상 · 개인 처방으로 확정하지 않음',href:'#golf/videos/'+encodeURIComponent(v.id),videoIds:[v.id]}))];
  }
  function saveCriterion(input){
    if(!sources(input.part).some(s=>s.key===input.sourceKey))throw Error('원본 자료를 다시 선택해 주세요.');
    const result=handle.update(s=>{
      const old=s.criteria.find(c=>c.id===input.id);
      if(old&&(old.part!==input.part||old.sourceKey!==input.sourceKey))throw Error('기준의 원본을 바꿀 수 없습니다. 새 기준으로 만들어 주세요.');
      const next={...input,id:old?.id||uid(),created:old?.created||stamp(),updated:stamp()};
      if(old){s.revisions.push({id:uid(),at:stamp(),snapshot:{...old}});s.criteria[s.criteria.indexOf(old)]=next;}else s.criteria.push(next);
      s.active[input.part]=next.id;
    });return result.criteria.find(c=>c.id===result.active[input.part]);
  }
  function saveRecord(input){
    return handle.update(s=>{const criterion=s.criteria.find(c=>c.id===input.criterionId&&c.part===input.part);if(!criterion)throw Error('기준을 먼저 저장해 주세요.');
      if(s.records.some(r=>r.id===input.id))return;
      s.records.push({...input,id:input.id||uid(),created:stamp(),date:date(),answer:'',snapshot:{...criterion}});
    });
  }
  function answerRecord(id,answer,apply){
    if(!answer.trim())throw Error('답변을 입력해 주세요.');
    return handle.update(s=>{const r=s.records.find(r=>r.id===id);if(!r)throw Error('질문을 찾지 못했습니다.');
      r.answer=answer;r.answeredAt=stamp();
      if(apply){const c=s.criteria.find(c=>c.id===r.criterionId);if(!c)throw Error('연결된 기준을 찾지 못했습니다.');
        s.revisions.push({id:uid(),at:stamp(),snapshot:{...c}});c.check=answer;c.updated=stamp();c.confirmed=false;
      }
    });
  }
  const activate=(part,id)=>handle.update(s=>{if(!s.criteria.some(c=>c.id===id&&c.part===part))throw Error('기준을 찾지 못했습니다.');s.active[part]=id;});
  const finish=part=>handle.update(s=>{delete s.active[part];});
  function searchRecords(query){const terms=String(query||'').trim().toLocaleLowerCase().split(/\s+/).filter(Boolean);if(!terms.length)return [];const s=handle.reload(),matches=text=>terms.every(t=>text.toLocaleLowerCase().includes(t));
    return [...(window.GolfQuestions?.search(query)||[]),...s.criteria.map(c=>({id:c.id,type:'criterion',title:c.title+(c.club?' · '+c.club:''),href:route(c.part,'standards',c.id),excerpt:[c.cue,c.check,c.setup,c.caution].join(' · '),matchedFields:['내 기준']})),...s.records.map(r=>({id:r.id,type:'practice',title:r.date+' · '+r.snapshot.title,href:route(r.part)+'?record='+encodeURIComponent(r.id),excerpt:[r.memo,r.question,r.answer,r.snapshot.cue].filter(Boolean).join(' · '),matchedFields:['결과·질문·답변']}))].filter(r=>matches(r.title+' '+r.excerpt));
  }
  function tabs(part,tab){return '<nav class="coach-tabs" aria-label="'+(part==='pt'?'PT':'골프')+' 활용"><a href="'+route(part)+'" '+(tab==='now'?'aria-current="page"':'')+'>지금 할 것</a><a href="'+route(part,'standards')+'" '+(tab==='standards'?'aria-current="page"':'')+'>'+'보관 기록'+'</a></nav>';}
  function sourceLink(c){const src=sources(c.part).find(s=>s.key===c.sourceKey);return src?'<a class="coach-source" href="'+esc(src.href)+'">'+esc(src.group)+' · '+esc(src.title)+' 보기 ›</a>':'<p class="coach-meta">원본이 현재 목록에서 숨겨져 있습니다. 개인 기준과 기록은 보존됩니다.</p>';}
  function media(c){
    if(c.part==='pt'){const id=c.sourceKey.slice(3),m=window.ExerciseMedia?.[id];if(!m||m.pending)return '';return '<div class="coach-mini-shots">'+(m.images||[]).slice(0,2).map((src,i)=>'<a href="#exercise/'+encodeURIComponent(id)+'"><img src="'+esc(src)+'" alt="'+esc(c.title)+' '+(i?'동작':'준비')+'" loading="lazy"><span>'+(i?'동작':'준비')+'</span></a>').join('')+'</div>';}
    const v=window.GolfHub?.learningSources().videos.find(v=>v.id===c.referenceId);if(!v)return '';
    return '<a class="coach-source" href="#golf/videos/'+encodeURIComponent(v.id)+'">대표 영상 · '+esc(v.title)+' ›</a>';
  }
  function recordHtml(r,answerable){if(r.topicId)return window.GolfQuestions.recordHtml(r,answerable);return '<article class="coach-record"><p class="coach-meta">'+esc(r.date)+' · '+esc(r.snapshot.title)+(r.snapshot.club?' · '+esc(r.snapshot.club):'')+'</p><strong>'+esc(r.result)+'</strong>'+(r.memo?'<p>'+esc(r.memo)+'</p>':'')+(r.question?'<p><b>질문</b> '+esc(r.question)+'</p>':'')+(r.answer?'<p><b>받은 답변</b> '+esc(r.answer)+'</p>':'')+'<details><summary>당시 기준 보기</summary><p>'+esc(r.snapshot.cue)+'</p><p>확인: '+esc(r.snapshot.check)+'</p></details>'+(answerable&&r.question?'<details class="coach-fold" '+(window.AppDrafts?.has('coach-answer-'+r.id)?'open':'')+'><summary>'+(r.answer?'답변 수정':'수업 답변 남기기')+'</summary><form data-coach-form="answer" data-record="'+esc(r.id)+'" data-draft-key="coach-answer-'+esc(r.id)+'"><label>받은 답변<textarea name="answer" required maxlength="2000">'+esc(r.answer)+'</textarea></label>'+(r.part==='pt'?'':'<label class="coach-checkbox"><input type="checkbox" name="apply">검토한 답변으로 내 기준의 ‘확인 방법’도 수정</label><p class="coach-meta">선택하면 연결된 기준의 확인 방법이 바뀝니다. 과거 기록은 그대로 유지합니다.</p>')+'<button class="btn" type="submit">답변 저장</button></form></details>':'')+'</article>';}
  function recapLinks(part){
    return '<nav class="coach-recap-links" aria-label="'+(part==='pt'?'PT':'골프')+' 연습과 전체 자료">'+(part==='pt'?'<button type="button" data-coach-jump="personal">개인운동·루틴 ↓</button><a href="#pt?cat=all">전체 운동 ›</a>':'<button type="button" data-coach-jump="practice">연습 처음으로 ↑</button><a href="#golf/videos">레슨·영상·노트 ›</a>')+'</nav>';
  }
  function recentGolf(){
    const source=window.GolfHub.learningSources(),latest=source.lessons.slice().sort((a,b)=>b.date.localeCompare(a.date))[0];
    // Only source lessons use the prepared recap; personal lesson edits keep their own wording.
    const quick=latest&&window.GolfContent.lessons.includes(latest)?latest.quickReview:null;
    const reviewVideo=quick&&source.videos.find(v=>v.id===quick.videoId);
    const recap=quick?'<dl class="coach-lesson-recap"><div><dt>할 것</dt><dd>'+esc(quick.action)+'</dd></div><div><dt>확인할 것</dt><dd>'+esc(quick.check)+'</dd></div></dl>':'<p>'+esc(latest?.practiceCue||latest?.correction)+'</p>';
    const reference=reviewVideo?'<a class="coach-source" href="https://www.youtube.com/watch?v='+encodeURIComponent(reviewVideo.id)+'&amp;t='+Number(quick.videoStart)+'s" target="_blank" rel="noopener noreferrer">'+esc(quick.videoLabel)+'</a>':'';
    return window.GolfHub.pinnedSequence()+'<section class="coach-recent-golf" aria-labelledby="recent-golf-title"><div class="coach-recent-heading"><h2 id="recent-golf-title">최근 레슨 · 빠른 복습</h2>'+(latest?'<time datetime="'+esc(latest.date)+'">'+esc(latest.date)+'</time>':'')+'</div>'+recapLinks('golf')+(latest?'<p class="coach-meta">레슨 기록'+(quick?' · '+esc(quick.club):latest.practiceClubs?.length?' · '+esc(latest.practiceClubs.join(' · ')):'')+'</p><h3>'+esc(quick?.title||latest.title)+'</h3>'+recap+'<div class="coach-lesson-links"><a class="coach-source" href="#golf/lessons/'+encodeURIComponent(latest.id)+'">레슨 상세 · 복습 자료 보기 ›</a>'+reference+'</div>':'<p>아직 등록된 레슨이 없습니다.</p><a class="coach-source" href="#golf/lessons">레슨 기록 보기 ›</a>')+'</section>';
  }
  function recentPT(){
    const sessions=Store.getPTSessions().slice().sort((a,b)=>b.date.localeCompare(a.date));
    const latest=sessions[0];
    // Display summaries belong to this reviewed session; later sessions use their own source text.
    const recaps={pt_session_20261016:{
      solo:['잘 되고 재미있는 운동부터. 배운 동작을 매번 모두 할 필요는 없습니다.','완벽한 한 번보다 기본 틀을 유지하며 반복합니다.'],
      items:{
        pt_lunge_ball_rotation:'런지 지지를 유지하며 몸통 회전. 수업에서는 좌우 각 15회.',
        pt_hip_openclose_stretch:'먼저 닫고, 발바닥을 밀며 열기. 목만 돌리지 않고 몸통·골반 함께.',
        pt_seatedrow:'어깨가 들리지 않는 범위로 내보내고 당기기. 어깨가 올라가면 범위 줄이기.',
        pt_chestpress:'팔로 버티며 가슴이 유지되는 깊이까지만. 어깨가 말리거나 가슴이 무너지기 전에 밀기.',
        pt_low_cable_curl:'손목이 꺾이거나 어깨가 말리지 않게. 아래쪽 고정쇠·언더그립(수업 15kg).'
      }
    }};
    const cards=s=>s.items.map(i=>{const ex=i.exerciseId&&Store.getById(i.exerciseId),cue=recaps[s.id]?.items[i.exerciseId]||i.points?.[0]||i.title;return ex?'<a href="#exercise/'+encodeURIComponent(ex.id)+'"><strong>'+esc(ex.name)+'</strong><span>'+esc(cue)+'</span><small>동작·지도 보기 ›</small></a>':'<div><strong>'+esc(i.title)+'</strong><span>'+esc(i.points?.[0]||'')+'</span><small>명칭 확인 대기 · 아래 수업 정리 참고</small></div>';}).join('');
    const solo=latest&&(recaps[latest.id]?.solo||latest.summary?.slice(0,1));
    return '<section class="coach-recent-pt" aria-labelledby="recent-pt-title"><div class="coach-recent-heading"><h2 id="recent-pt-title">최근 수업 · 빠른 복습</h2>'+(latest?'<time datetime="'+esc(latest.date)+'">'+esc(latest.date)+'</time>':'')+'</div>'+recapLinks('pt')+(latest?(solo?.length?'<aside class="coach-session-key coach-solo-keys"><h3>혼자 운동할 때</h3><ul>'+solo.map(t=>'<li>'+esc(t)+'</li>').join('')+'</ul></aside>':'')+'<div class="coach-recent-grid">'+cards(latest)+'</div>'+sessionDetails(latest):'<p>등록된 PT 수업 기록이 아직 없습니다.</p>')+'</section>';
  }
  function sessionDetails(s){
    return '<details class="coach-fold coach-session-details"><summary>수업 정리 · 지도 내용과 확인할 점</summary>'+(s.summary?.length?'<h3>혼자 운동할 때</h3><ul>'+s.summary.map(x=>'<li>'+esc(x)+'</li>').join('')+'</ul>':'')+s.items.map(i=>'<article><h3>'+esc(i.title)+'</h3><p class="coach-meta">'+esc(i.range)+(i.exerciseId?'':' · 동작 명칭 확인 대기')+'</p><ul>'+i.points.map(x=>'<li>'+esc(x)+'</li>').join('')+'</ul><p class="coach-meta">'+esc(i.uncertainty)+'</p></article>').join('')+'<p class="coach-meta">'+esc(s.source)+'</p><p class="coach-meta">'+esc(s.evidence)+'</p></details>';
  }
  function personalPTLinks(){
    const groups=api.personalGroups(),total=groups.reduce((n,g)=>n+g.exercises.length,0);
    return '<section class="coach-personal"><h2>내 개인운동 <small>'+total+'종목</small></h2><nav class="coach-personal-links" aria-label="개인운동 부위">'+groups.map(g=>'<a href="#pt?cat='+encodeURIComponent('personal:'+g.key)+'">'+esc(g.label)+' <small>'+g.exercises.length+'</small></a>').join('')+'</nav><div class="coach-reference-links"><a href="#pt?cat=personal">지정 종목 전체</a><a href="#search?scope=pt">운동 검색</a></div></section><a class="coach-routine-link" href="#ht">주 4회 HT 루틴 <span>월·화·목·금 · 기본 20분 + 근력 40분 ›</span></a>';
  }
  function ptSessionArchive(){return '<section class="coach-session-archive"><h3>PT 수업 기록</h3>'+Store.getPTSessions().slice().sort((a,b)=>b.date.localeCompare(a.date)).map(s=>'<details class="coach-fold"><summary>'+esc(s.date+' · '+s.title)+'</summary>'+s.items.map(i=>i.exerciseId&&Store.getById(i.exerciseId)?'<a class="coach-source" href="#exercise/'+encodeURIComponent(i.exerciseId)+'">'+esc(i.title)+' ›</a>':'<p>'+esc(i.title)+'</p>').join('')+sessionDetails(s)+'</details>').join('')+'</section>';}
  function archive(part,criteria,records,s,selected){
    return '<section class="'+part+'-archive"><h2>보관 기록</h2><p class="coach-meta">이전에 남긴 기준·결과·답변을 확인합니다.</p>'+
      (criteria.length?'<h3>내 기준</h3>'+criteria.map(c=>'<details class="coach-fold" '+(c.id===selected?'open':'')+'><summary>'+esc(c.title)+(c.club?' · '+esc(c.club):'')+'</summary><p>'+esc(c.cue)+'</p><p>확인: '+esc(c.check)+'</p>'+(c.setup?'<p>'+esc(c.setup)+'</p>':'')+(c.caution?'<p>'+esc(c.caution)+'</p>':'')+sourceLink(c)+media(c)+(s.revisions.some(r=>r.snapshot.id===c.id)?'<details><summary>이전 기준</summary>'+s.revisions.filter(r=>r.snapshot.id===c.id).slice().reverse().map(r=>'<p>'+esc(r.at.slice(0,10))+' · '+esc(r.snapshot.cue)+'</p><p>'+esc(r.snapshot.check)+'</p>').join('')+'</details>':'')+'</details>').join(''):'')+
      '<h3>결과·질문·답변</h3>'+(records.length?records.slice().reverse().map(r=>'<a class="coach-source" href="#'+part+'/now?record='+encodeURIComponent(r.id)+'">'+esc(r.date+' · '+r.snapshot.title)+' ›</a>').join(''):'<p class="coach-meta">보관된 결과 기록이 없습니다.</p>')+(part==='pt'?ptSessionArchive():'<a class="coach-source" href="#golf/lessons">레슨 기록·질문 보기 ›</a>')+'</section>';
  }
  function render(v,config){
    api=config;view=v;configure(config);const part=v.part,tab=v.coachTab||'now',s=handle.reload(),all=s.criteria.filter(c=>c.part===part),records=[...s.records.filter(r=>r.part===part),...(part==='golf'?window.GolfQuestions.records(s):[])].sort((a,b)=>a.created.localeCompare(b.created));
    const compactNow=tab==='now'&&!v.coachRecord;
    const archiveLink='<nav class="coach-tabs coach-header-link" aria-label="'+(part==='pt'?'PT':'골프')+' 활용"><a href="'+route(part,'standards')+'">보관 기록</a></nav>';
    let body=compactNow?'':tabs(part,tab);
    if(!handle.status().ok)body+='<p class="storage-warning" role="alert">보관 기록을 읽지 못했습니다. 기존 원본은 보존하고 저장을 멈췄습니다.</p>';
    if(tab==='now'&&v.coachRecord){const r=records.find(r=>r.id===v.coachRecord);body+='<section class="coach-selected-record"><h2>기록과 질문</h2>'+(r?recordHtml(r,true):'<p>기록을 찾지 못했습니다.</p>')+'<a class="coach-source" href="'+route(part,'standards')+'">보관 기록으로 돌아가기 ›</a></section>';}else if(tab==='now'){
      if(part==='pt')body+=recentPT();
      if(part==='golf')body+=window.GolfHub.dailyPracticePin()+recentGolf()+window.GolfQuestions.selector(s);
      if(part==='golf')body+=window.GolfHub.commonPractice()+window.GolfHub.stagePractice()+window.GolfHub.questionShortcut()+(v.coachTopic?window.GolfQuestions.topicDetails(s,v.coachTopic):'');
      if(part==='golf')body+='<nav class="coach-library" aria-label="골프 자료"><a href="#golf/lessons">레슨</a><a href="#golf/videos">영상</a><a href="#golf/notes">감각 노트</a><a href="#golf/standards">보관 기록</a></nav>';
      if(part==='pt')body+=personalPTLinks();
    }else{
      body+=archive(part,all,records,s,v.coachId);
    }
    api.app.innerHTML='<div class="scr coach-desk" data-part="'+part+'">'+(compactNow?'':'<a class="back" href="#home">‹ 홈</a>')+'<div class="hd'+(compactNow?' coach-compact-heading':'')+'"><h1>'+(part==='pt'?'PT':'골프')+'</h1>'+(compactNow?archiveLink:'')+'</div>'+body+'</div>'+api.tabbar(part);window.AppDrafts?.bind(api.app);
  }
  function configure(config){window.GolfQuestions?.bind(config);if(bound===config.app)return;bound=config.app;
    config.app.addEventListener('click',ev=>{
      const button=ev.target.closest('[data-coach-jump]');if(!button)return;
      const target=button.dataset.coachJump==='personal'?config.app.querySelector('.coach-personal'):config.app.querySelector('.g-daily-pin,.g-pinned-sequence,.g-common-practice');
      if(!target)return;ev.preventDefault();target.setAttribute('tabindex','-1');target.focus({preventScroll:true});target.scrollIntoView({block:'start'});
    });
    config.app.addEventListener('change',ev=>{if(!ev.target.matches('[data-coach-source]'))return;api.go('coach',{part:view.part,coachTab:'standards',coachSource:ev.target.value,coachId:null});});
    config.app.addEventListener('click',ev=>{if(ev.target.closest('[data-coach-finish]')){try{finish(view.part);api.refresh();api.toast('내 기준과 기록은 보존하고 이번 확인을 마쳤습니다.');}catch(error){api.toast(error.message);}return;}const b=ev.target.closest('[data-coach-use]');if(!b)return;try{activate(view.part,b.dataset.coachUse);api.go('coach',{part:view.part,coachTab:'now',coachId:null,coachSource:null,coachRecord:null});}catch(error){api.toast(error.message);}});
    config.app.addEventListener('submit',ev=>{const f=ev.target.closest('[data-coach-form]');if(!f)return;ev.preventDefault();if(!f.reportValidity())return;const data=new FormData(f),get=k=>String(data.get(k)||'').trim();
      try{
        if(f.dataset.coachForm==='criterion'){
          const src=sources(view.part).find(x=>x.key===f.dataset.source);if(!src)throw Error('원본 자료를 다시 선택해 주세요.');
          const c=saveCriterion({id:f.dataset.criterion,part:view.part,sourceKey:src.key,title:src.title,cue:get('cue'),check:get('check'),setup:get('setup'),caution:get('caution'),club:get('club'),referenceId:get('referenceId'),confirmed:data.has('confirmed')});f.dataset.criterion=c.id;
        }else if(f.dataset.coachForm==='result'){f.dataset.recordId ||=uid();saveRecord({id:f.dataset.recordId,part:view.part,criterionId:f.dataset.criterion,result:get('result'),memo:get('memo'),question:get('question')});}
        else answerRecord(f.dataset.record,get('answer'),data.has('apply'));
        const cleared=window.AppDrafts?.clear(f);api.toast(cleared===false?'기록은 저장됨 · 초안 정리는 다시 시도합니다':'저장했습니다');api.go('coach',{part:view.part,coachTab:'now',coachId:null,coachSource:null,coachRecord:f.dataset.coachForm==='answer'?f.dataset.record:null});
      }catch(error){api.toast(error.code==='CONFLICT'?'다른 탭에서 같은 기록이 바뀌었습니다. 입력은 유지합니다.':error.code==='WRITE_FAILED'?'저장하지 못했습니다. 입력은 유지합니다.':error.message);}
    });
  }
  return {render,sources,read,saveCriterion,saveRecord,answerRecord,activate,finish,searchRecords,sessionDetails};
})();
