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
  function tabs(part,tab){return '<nav class="coach-tabs" aria-label="'+(part==='pt'?'PT':'골프')+' 활용"><a href="'+route(part)+'" '+(tab==='now'?'aria-current="page"':'')+'>지금 할 것</a><a href="'+route(part,'questions')+'" '+(tab==='questions'?'aria-current="page"':'')+'>질문</a></nav>';}
  function recapLinks(part){
    return '<nav class="coach-recap-links" aria-label="'+(part==='pt'?'PT':'골프')+' 연습과 전체 자료">'+(part==='pt'?'<button type="button" data-coach-jump="personal">개인운동·루틴 ↓</button><a href="#pt?cat=all">전체 운동 ›</a>':'<button type="button" data-coach-jump="practice">연습 순서로 이동 ↓</button><a href="#golf/videos">레슨·영상·노트 ›</a>')+'</nav>';
  }
  function combinedGolfReview(){
    const review=window.GolfContent.driverLessonReview,source=window.GolfHub.learningSources();
    if(!review)return '';
    const lessons=review.lessonIds.map(id=>source.lessons.find(l=>l.id===id));
    // Source-based synthesis must not override a personal edit or hide a later lesson.
    const latest=source.lessons.slice().sort((a,b)=>b.date.localeCompare(a.date))[0];
    if(latest?.id!==review.lessonIds[0]||lessons.some(l=>!l||!window.GolfContent.lessons.includes(l)))return '';
    const dateLabel=l=>l.date.slice(5).replace('-','.');
    return '<section class="coach-recent-golf g-personal-priority g-combined-lesson" aria-labelledby="recent-golf-title"><div class="coach-recent-heading"><h2 id="recent-golf-title">'+esc(review.title)+'</h2></div><p class="coach-meta">정식 레슨 · '+'<time datetime="'+esc(latest.date)+'">'+esc(dateLabel(latest))+'</time>'+'</p>'+recapLinks('golf')+'<details class="g-final-coaching-details"><summary>마지막 레슨의 다섯 가지와 과거 코칭 근거</summary><div class="g-priority-columns"><div><h3>연습 '+review.steps.length+'가지</h3><ol>'+review.steps.map(step=>'<li>'+esc(step)+'</li>').join('')+'</ol></div><div><h3>확인 '+review.checks.length+'가지</h3><ul>'+review.checks.map(check=>'<li>'+esc(check)+'</li>').join('')+'</ul></div></div><p class="g-priority-note">'+esc(review.note)+'</p><nav class="coach-lesson-links" aria-label="마지막 레슨과 과거 코칭 근거">'+lessons.map(l=>'<a class="coach-source" href="#golf/lessons/'+encodeURIComponent(l.id)+'">'+esc(dateLabel(l))+' 원본 레슨 ›</a>').join('')+'</nav></details></section>';
  }
  function recentGolf(){
    const source=window.GolfHub.learningSources(),latest=source.lessons.slice().sort((a,b)=>b.date.localeCompare(a.date))[0];
    // Only source lessons use the prepared recap; personal lesson edits keep their own wording.
    const quick=latest&&window.GolfContent.lessons.includes(latest)?latest.quickReview:null;
    const reviewVideo=quick&&source.videos.find(v=>v.id===quick.videoId);
    const checks=Array.isArray(quick?.checks)&&quick.checks.length===3?quick.checks:null;
    if(latest?.id==='lesson_20261106_relax'&&quick){
      return '<section class="coach-recent-golf g-personal-priority g-latest-lesson" aria-labelledby="recent-golf-title"><div class="coach-recent-heading"><h2 id="recent-golf-title">'+esc(quick.title)+'</h2><time datetime="'+esc(latest.date)+'">'+esc(latest.date)+'</time></div>'+recapLinks('golf')+'<p class="coach-meta">정규 레슨 · '+esc(quick.club)+'</p><div class="g-priority-columns"><div><h3>연습 3단계</h3><ol>'+quick.steps.map(x=>'<li>'+esc(x)+'</li>').join('')+'</ol></div><div><h3>확인 3가지</h3><ul>'+quick.checks.map(x=>'<li>'+esc(x)+'</li>').join('')+'</ul></div></div><p class="g-priority-note">오른손 놓기는 이번 교정 드릴입니다. 기존 드라이버의 높은 위치 왼손 이완은 날짜별 기록으로 구분합니다.</p>'+window.GolfPractice.leftArmGuide(latest)+'<nav class="coach-lesson-links"><a class="coach-source" href="#golf/lessons/'+latest.id+'">11.06 정규 레슨과 전사 근거 ›</a><a class="coach-source" href="#golf/lessons/lesson_20261102_release">11.02 원본 레슨 ›</a><a class="coach-source" href="#golf/lessons/lesson_20261030_driver">10.30 원본 레슨 ›</a></nav></section>';
    }
    const recap=latest?.id===window.GolfContent.pinnedLessonId?'':quick?'<dl class="coach-lesson-recap'+(checks?' has-checks':'')+'"><div><dt>'+(checks?'우선할 감각':'할 것')+'</dt><dd>'+esc(quick.action)+'</dd></div><div><dt>'+(checks?'확인 3가지':'확인할 것')+'</dt><dd>'+(checks?'<ol>'+checks.map(check=>'<li>'+esc(check)+'</li>').join('')+'</ol>':esc(quick.check))+'</dd></div></dl>':'<p>'+esc(latest?.practiceCue||latest?.correction)+'</p>';
    const reference=reviewVideo?'<a class="coach-source" href="https://www.youtube.com/watch?v='+encodeURIComponent(window.GolfContent.sourceIdFor(reviewVideo))+'&amp;t='+Number(quick.videoStart)+'s" target="_blank" rel="noopener noreferrer">'+esc(quick.videoLabel)+'</a>':'';
    return '<section class="coach-recent-golf" aria-labelledby="recent-golf-title"><div class="coach-recent-heading"><h2 id="recent-golf-title">최근 레슨 · 빠른 복습</h2>'+(latest?'<time datetime="'+esc(latest.date)+'">'+esc(latest.date)+'</time>':'')+'</div>'+recapLinks('golf')+(latest?'<p class="coach-meta">'+(checks&&reviewVideo?'레슨 핵심 + 영상 참고':'레슨 기록')+(quick?' · '+esc(quick.club):latest.practiceClubs?.length?' · '+esc(latest.practiceClubs.join(' · ')):'')+'</p><h3>'+esc(quick?.title||latest.title)+'</h3>'+recap+'<div class="coach-lesson-links"><a class="coach-source" href="#golf/lessons/'+encodeURIComponent(latest.id)+'">레슨 상세 · 복습 자료 보기 ›</a>'+reference+'</div>':'<p>아직 등록된 레슨이 없습니다.</p><a class="coach-source" href="#golf/lessons">레슨 기록 보기 ›</a>')+'</section>';
  }
  function recentPT(){return window.HTGuide.html();}
  function sessionDetails(s){
    return '<details class="coach-fold coach-session-details"><summary>수업 정리 · 지도 내용과 확인할 점</summary>'+(s.summary?.length?'<h3>혼자 운동할 때</h3><ul>'+s.summary.map(x=>'<li>'+esc(x)+'</li>').join('')+'</ul>':'')+s.items.map(i=>'<article><h3>'+esc(i.title)+'</h3><p class="coach-meta">'+esc(i.range)+(i.exerciseId?'':' · 동작 명칭 확인 대기')+'</p><ul>'+i.points.map(x=>'<li>'+esc(x)+'</li>').join('')+'</ul><p class="coach-meta">'+esc(i.uncertainty)+'</p></article>').join('')+'<p class="coach-meta">'+esc(s.source)+'</p><p class="coach-meta">'+esc(s.evidence)+'</p></details>';
  }
  function personalPTLinks(){
    const groups=api.personalGroups(),total=groups.reduce((n,g)=>n+g.exercises.length,0);
    return '<details class="coach-personal coach-fold"><summary><h2>HT 개인운동 자료 <small>'+total+'종목</small></h2></summary><nav class="coach-personal-links" aria-label="HT 개인운동 부위">'+groups.map(g=>'<a href="#ht?cat='+encodeURIComponent('personal:'+g.key)+'&amp;start=library">'+esc(g.label)+' <small>'+g.exercises.length+'</small></a>').join('')+'</nav><div class="coach-reference-links"><a href="#ht?cat=personal&amp;start=library">지정 종목 전체</a><a href="#search?scope=ht">HT 운동·영상 검색</a><a href="#pt?cat=all">이전 PT 수업 기록</a></div></details>';
  }
  function render(v,config){
    api=config;view=v;configure(config);const part=v.part,tab=v.coachTab==='questions'?'questions':'now',s=handle.reload();
    const compactNow=tab==='now';
    const questionLink='<nav class="coach-tabs coach-header-link" aria-label="'+(part==='pt'?'PT':'골프')+' 활용"><a href="'+route(part,'questions')+'">질문</a></nav>';
    let body=compactNow?'':tabs(part,tab);
    if(tab==='now'){
      if(part==='pt')body+=recentPT();
      if(part==='golf'){
        body+=window.GolfHub.finalLessonPracticeNow()+(combinedGolfReview()||recentGolf())+window.GolfHub.questionShortcut();
      }
      if(part==='golf')body+='<nav class="coach-library" aria-label="골프 자료"><a href="#golf/lessons">레슨</a><a href="#golf/videos">영상</a><a href="#golf/notes">감각 노트</a></nav>';
      if(part==='pt')body+=personalPTLinks();
    }else if(tab==='questions'){
      body+=part==='pt'?window.TrainingQuestions.render(v.coachSource):window.TrainingQuestions.renderGolf();
    }
    api.app.innerHTML='<div class="scr coach-desk" data-part="'+part+'">'+(compactNow?'':'<a class="back" href="#home">‹ 홈</a>')+'<div class="hd'+(compactNow?' coach-compact-heading':'')+'"><h1>'+(part==='pt'?'PT':'골프')+'</h1>'+(compactNow?questionLink:'')+'</div>'+body+'</div>'+api.tabbar(part);window.AppDrafts?.bind(api.app);
  }
  function configure(config){window.GolfQuestions?.bind(config);if(bound===config.app)return;bound=config.app;
    config.app.addEventListener('click',ev=>{
      const button=ev.target.closest('[data-coach-jump]');if(!button)return;
      const target=button.dataset.coachJump==='personal'?config.app.querySelector('.coach-personal'):config.app.querySelector('.g-stage-overview');
      if(!target)return;ev.preventDefault();if(target.tagName==='DETAILS')target.open=true;target.setAttribute('tabindex','-1');target.focus({preventScroll:true});target.scrollIntoView({block:'start'});
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
