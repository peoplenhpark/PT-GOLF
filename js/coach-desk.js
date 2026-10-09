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
    return [...s.criteria.map(c=>({id:c.id,type:'criterion',title:c.title+(c.club?' · '+c.club:''),href:route(c.part,'standards',c.id),excerpt:[c.cue,c.check,c.setup,c.caution].join(' · '),matchedFields:['내 기준']})),...s.records.map(r=>({id:r.id,type:'practice',title:r.date+' · '+r.snapshot.title,href:route(r.part)+'?record='+encodeURIComponent(r.id),excerpt:[r.memo,r.question,r.answer,r.snapshot.cue].filter(Boolean).join(' · '),matchedFields:['결과·질문·답변']}))].filter(r=>matches(r.title+' '+r.excerpt));
  }
  function tabs(part,tab){return '<nav class="coach-tabs" aria-label="'+(part==='pt'?'PT':'골프')+' 활용"><a href="'+route(part)+'" '+(tab==='now'?'aria-current="page"':'')+'>지금 할 것</a><a href="'+route(part,'standards')+'" '+(tab==='standards'?'aria-current="page"':'')+'>내 기준</a></nav>';}
  function sourceLink(c){const src=sources(c.part).find(s=>s.key===c.sourceKey);return src?'<a class="coach-source" href="'+esc(src.href)+'">'+esc(src.group)+' · '+esc(src.title)+' 보기 ›</a>':'<p class="coach-meta">원본이 현재 목록에서 숨겨져 있습니다. 개인 기준과 기록은 보존됩니다.</p>';}
  function media(c){
    if(c.part==='pt'){const id=c.sourceKey.slice(3),m=window.ExerciseMedia?.[id];if(!m||m.pending)return '';return '<div class="coach-mini-shots">'+(m.images||[]).slice(0,2).map((src,i)=>'<a href="#exercise/'+encodeURIComponent(id)+'"><img src="'+esc(src)+'" alt="'+esc(c.title)+' '+(i?'동작':'준비')+'" loading="lazy"><span>'+(i?'동작':'준비')+'</span></a>').join('')+'</div>';}
    const v=window.GolfHub?.learningSources().videos.find(v=>v.id===c.referenceId);if(!v)return '';
    return '<a class="coach-source" href="#golf/videos/'+encodeURIComponent(v.id)+'">대표 영상 · '+esc(v.title)+' ›</a>';
  }
  function resultForm(c){return '<details class="coach-fold" '+(window.AppDrafts?.has('coach-result-'+c.id)?'open':'')+'><summary>결과 한 줄 · 질문 남기기</summary><form data-coach-form="result" data-criterion="'+esc(c.id)+'" data-draft-key="coach-result-'+esc(c.id)+'"><label>이번 결과<select name="result" required><option value="">선택하세요</option>'+labels.map(t=>'<option>'+t+'</option>').join('')+'</select></label><label>한 줄 메모 <small>선택</small><textarea name="memo" rows="2" maxlength="1000" placeholder="느낌과 실제 결과를 구분해 적어보세요"></textarea></label><label>다음 수업에서 물어볼 것 <small>선택</small><textarea name="question" rows="2" maxlength="1000"></textarea></label><button class="btn primary" type="submit">결과 저장</button><p class="coach-meta">이 기기에 저장 · 당시의 기준도 함께 보존</p></form></details>';}
  function recordHtml(r,answerable){return '<article class="coach-record"><p class="coach-meta">'+esc(r.date)+' · '+esc(r.snapshot.title)+(r.snapshot.club?' · '+esc(r.snapshot.club):'')+'</p><strong>'+esc(r.result)+'</strong>'+(r.memo?'<p>'+esc(r.memo)+'</p>':'')+(r.question?'<p><b>질문</b> '+esc(r.question)+'</p>':'')+(r.answer?'<p><b>받은 답변</b> '+esc(r.answer)+'</p>':'')+'<details><summary>당시 기준 보기</summary><p>'+esc(r.snapshot.cue)+'</p><p>확인: '+esc(r.snapshot.check)+'</p></details>'+(answerable&&r.question?'<details class="coach-fold" '+(window.AppDrafts?.has('coach-answer-'+r.id)?'open':'')+'><summary>'+(r.answer?'답변 수정':'수업 답변 남기기')+'</summary><form data-coach-form="answer" data-record="'+esc(r.id)+'" data-draft-key="coach-answer-'+esc(r.id)+'"><label>받은 답변<textarea name="answer" required maxlength="2000">'+esc(r.answer)+'</textarea></label><label class="coach-checkbox"><input type="checkbox" name="apply">검토한 답변으로 내 기준의 ‘확인 방법’도 수정</label><p class="coach-meta">선택하면 연결된 기준의 확인 방법이 바뀝니다. 과거 기록은 그대로 유지합니다.</p><button class="btn" type="submit">답변 저장</button></form></details>':'')+'</article>';}
  function editor(part,c,src){
    if(!src)return '<p>연결할 자료를 선택해 주세요.</p>';
    const v=c||{cue:src.cue,check:src.check,setup:src.setup,caution:src.caution,club:src.clubs?.length===1?src.clubs[0]:'',referenceId:src.videoIds?.[0]||'',confirmed:false};
    const field=(name,label,value,required=false)=>'<label>'+label+'<textarea name="'+name+'" rows="2" maxlength="2000" '+(required?'required':'')+'>'+esc(value)+'</textarea></label>';
    let videos=[];if(part==='golf')videos=window.GolfHub?.learningSources().videos||[];
    return '<form class="coach-editor" data-coach-form="criterion" data-source="'+esc(src.key)+'" data-criterion="'+esc(c?.id||'')+'" data-draft-key="coach-criterion-'+esc(c?.id||src.key)+'"><p class="coach-meta">'+esc(src.origin)+' · 원문에서 가져온 문구는 직접 다듬어 저장하세요.</p>'+(part==='golf'?'<label>적용 클럽<input name="club" value="'+esc(v.club)+'" maxlength="80" required placeholder="예: 7번 아이언"></label>':'')+field('cue','이번 확인점 · 한 문장',v.cue,true)+field('check','잘됐는지 확인할 방법',v.check,true)+'<details class="coach-fold"><summary>준비·주의·대표 자료</summary>'+field('setup','준비·설정',v.setup)+field('caution','주의점·흔한 실수',v.caution)+(part==='golf'?'<label>대표 영상<select name="referenceId"><option value="">선택 안 함</option>'+videos.map(x=>'<option value="'+esc(x.id)+'" '+(x.id===v.referenceId?'selected':'')+'>'+esc(x.title)+'</option>').join('')+'</select></label>':'')+'</details><label class="coach-checkbox"><input type="checkbox" name="confirmed" '+(v.confirmed?'checked':'')+'>직접 해보고 확인한 내 기준</label><p class="coach-meta">이 표시는 개인 확인 상태이며 코치의 승인이나 숙련 판정이 아닙니다.</p><button class="btn primary" type="submit">저장하고 지금 확인하기</button></form>';
  }
  function recentGolf(){
    const latest=window.GolfHub.learningSources().lessons.slice().sort((a,b)=>b.date.localeCompare(a.date))[0];
    return window.GolfHub.pinnedSequence()+'<section class="coach-recent-golf" aria-labelledby="recent-golf-title"><div class="coach-recent-heading"><h2 id="recent-golf-title">최근 레슨 · 빠른 복습</h2>'+(latest?'<time datetime="'+esc(latest.date)+'">'+esc(latest.date)+'</time>':'')+'</div>'+(latest?'<p class="coach-meta">레슨 기록'+(latest.practiceClubs?.length?' · '+esc(latest.practiceClubs.join(' · ')):'')+'</p><h3>'+esc(latest.title)+'</h3><p>'+esc(latest.practiceCue||latest.correction)+'</p><a class="coach-source" href="#golf/lessons/'+encodeURIComponent(latest.id)+'">레슨 상세 · 복습 자료 보기 ›</a>':'<p>아직 등록된 레슨이 없습니다.</p><a class="coach-source" href="#golf/lessons">레슨 기록 보기 ›</a>')+'</section>';
  }
  function recentPT(){
    const sessions=Store.getPTSessions().slice().sort((a,b)=>b.date.localeCompare(a.date));
    const latest=sessions[0];
    const cards=s=>s.items.map(i=>{const ex=i.exerciseId&&Store.getById(i.exerciseId);return ex?'<a href="#exercise/'+encodeURIComponent(ex.id)+'"><strong>'+esc(ex.name)+'</strong><span>'+esc(i.points?.[0]||i.title)+'</span><small>수업 지도 · 동작 보기 ›</small></a>':'<div><strong>'+esc(i.title)+'</strong><span>연결 동작 확인 대기</span></div>';}).join('');
    return '<section class="coach-recent-pt" aria-labelledby="recent-pt-title"><div class="coach-recent-heading"><h2 id="recent-pt-title">최근 수업 · 빠른 복습</h2>'+(latest?'<time datetime="'+esc(latest.date)+'">'+esc(latest.date)+'</time>':'')+'</div>'+(latest?'<div class="coach-recent-grid">'+cards(latest)+'</div>':'<p>등록된 PT 수업 기록이 아직 없습니다.</p>')+(sessions.length>1?'<details class="coach-fold"><summary>이전 수업 더 보기</summary>'+sessions.slice(1).map(s=>'<h3>'+esc(s.date)+'</h3><div class="coach-recent-grid">'+cards(s)+'</div>').join('')+'</details>':'')+'<a class="coach-source" href="#pt">전체 운동 찾아보기 ›</a></section>';
  }
  function ptSchedulePlan(){return '<aside class="coach-plan"><h2>주 4회 운동 · 코치와 협의 예정</h2><p>PT 종료 전에 편성·운용할 계획입니다. 요일·운동 구성·강도는 코치와 상의한 뒤 확정합니다.</p><details><summary>다음 수업에서 정할 것</summary><p>운동할 요일과 회복 간격 · 회차별 운동과 순서 · 중량·세트·횟수 · 혼자 운동할 때의 조정 기준</p></details></aside>';}
  function library(part){return part==='pt'?'<div class="coach-library"><a href="#pt">전체 동작 · 부위별 찾기</a><a href="#ht">HT 보강 자료</a><a href="#search?scope=pt">PT 검색</a></div><details class="coach-fold"><summary>PT 수업 기록 · '+Store.getPTSessions().length+'건</summary>'+Store.getPTSessions().map(s=>'<article class="coach-record"><h3>'+esc(s.date)+' · '+esc(s.title)+'</h3>'+s.items.map(i=>i.exerciseId?'<a class="coach-source" href="#exercise/'+encodeURIComponent(i.exerciseId)+'">'+esc(i.title)+' ›</a>':'<p>'+esc(i.title)+'</p>').join('')+'</article>').join('')+'</details>':'<div class="coach-library"><a href="#golf/lessons">레슨 · 기존 질문</a><a href="#golf/notes">감각 노트 · 스윙 순서</a><a href="#golf/videos">전체 영상</a><a href="#golf/today">5구 상세 비교 · 기존 기록</a></div>';}
  function render(v,config){
    api=config;view=v;configure(config);const part=v.part,tab=v.coachTab||'now',s=handle.reload(),all=s.criteria.filter(c=>c.part===part),current=s.criteria.find(c=>c.id===s.active[part]),records=s.records.filter(r=>r.part===part),options=sources(part);
    let body=tabs(part,tab);
    if(!handle.status().ok)body+='<p class="storage-warning" role="alert">새 기준 기록을 읽지 못했습니다. 기존 원본은 보존하고 저장을 멈췄습니다.</p>';
    if(tab==='now'&&v.coachRecord){const r=records.find(r=>r.id===v.coachRecord);body+='<section class="coach-selected-record"><h2>기록과 질문</h2>'+(r?recordHtml(r,true):'<p>기록을 찾지 못했습니다.</p>')+'<a class="coach-source" href="'+route(part)+'">지금 할 것으로 돌아가기 ›</a></section>';}else if(tab==='now'){
      if(part==='pt')body+=recentPT();
      if(part==='golf')body+=recentGolf();
      if(current){body+='<section class="coach-current"><p class="coach-meta">'+esc(current.title)+(current.club&&current.club!==current.title?' · '+esc(current.club):'')+' · '+(current.confirmed?'직접 확인한 내 기준':'확인 중인 내 기준')+'</p><h2>'+esc(current.cue)+'</h2><p class="coach-check"><b>무엇으로 확인할까</b>'+esc(current.check)+'</p>'+(current.caution?'<p class="coach-caution"><b>주의</b> '+esc(current.caution)+'</p>':'')+'<div class="coach-actions"><a href="'+route(part,'standards',current.id)+'">기준 수정</a><a href="'+route(part,'standards')+'">다른 기준 선택</a><button class="btn ghost" data-coach-finish>확인 마치기</button></div><details class="coach-fold"><summary>준비·자료 바로 보기</summary><p>'+esc(current.setup)+'</p>'+sourceLink(current)+media(current)+'</details></section>'+resultForm(current);}
      else body+='<section class="coach-current"><h2>혼자 해볼 기준 하나부터</h2><p>'+(part==='pt'?'남은 PT 수업에서 확인할 동작을 골라 내 기준으로 남겨보세요.':'연습할 클럽과 확인할 핵심을 골라보세요.')+'</p><a class="btn primary" href="'+route(part,'standards')+'">첫 기준 고르기</a></section>';
      const pending=records.filter(r=>r.question&&!r.answer).slice().reverse();body+='<section class="coach-questions"><h2>다음 수업 질문 <small>'+pending.length+'개</small></h2>'+(pending.length?pending.slice(0,1).map(r=>recordHtml(r,true)).join('')+(pending.length>1?'<details class="coach-fold"><summary>나머지 질문 '+(pending.length-1)+'개</summary>'+pending.slice(1).map(r=>recordHtml(r,true)).join('')+'</details>':''):'<p class="coach-meta">막힌 점은 결과를 남길 때 질문으로 함께 적을 수 있어요.</p>')+'</section>';
      if(records.length)body+='<details class="coach-fold"><summary>지난 결과·답변 '+records.length+'건</summary>'+records.slice().reverse().map(r=>recordHtml(r,!!r.answer)).join('')+'</details>';
      if(part==='pt')body+=ptSchedulePlan();
    }else{
      body+='<p class="coach-intro">'+(part==='pt'?'혼자 운동할 때 쓸 기준을 남깁니다. 필요한 동작부터 하나씩 확인하세요.':'클럽과 적용 조건을 구분해, 실제로 확인할 기준을 남깁니다.')+'</p>';
      body+=all.length?'<section class="coach-criteria">'+all.map(c=>'<article><a href="'+route(part,'standards',c.id)+'"><strong>'+esc(c.title)+(c.club?' · '+esc(c.club):'')+'</strong><span>'+esc(c.cue)+'</span></a><button class="btn" data-coach-use="'+esc(c.id)+'">'+(s.active[part]===c.id?'현재 기준':'지금 확인하기')+'</button></article>').join('')+'</section>':'<p class="coach-meta">아직 저장한 기준이 없습니다. 기존 자료에서 시작하세요.</p>';
      const selected=all.find(c=>c.id===v.coachId),src=options.find(o=>o.key===(selected?.sourceKey||v.coachSource));
      body+='<details class="coach-fold" '+(selected||src||!all.length?'open':'')+'><summary>'+(selected?'선택한 기준 수정':'새 기준 만들기')+'</summary><label>기존 자료 선택<select data-coach-source data-no-draft><option value="">선택하세요</option>'+[...new Set(options.map(o=>o.group))].map(group=>'<optgroup label="'+esc(group)+'">'+options.filter(o=>o.group===group).map(o=>'<option value="'+esc(o.key)+'" '+(o.key===src?.key?'selected':'')+'>'+esc(o.title)+'</option>').join('')+'</optgroup>').join('')+'</select></label>'+editor(part,selected,src)+'</details>';
      if(selected){const history=s.revisions.filter(r=>r.snapshot.id===selected.id);if(history.length)body+='<details class="coach-fold"><summary>기준 수정 이력 '+history.length+'건</summary>'+history.slice().reverse().map(r=>'<article class="coach-record"><p>'+esc(r.at.slice(0,10))+'</p><p>'+esc(r.snapshot.cue)+'</p><p>확인: '+esc(r.snapshot.check)+'</p></article>').join('')+'</details>';}
      body+='<section><h2>자료 찾아보기</h2>'+library(part)+'</section>';
    }
    api.app.innerHTML='<div class="scr coach-desk" data-part="'+part+'"><a class="back" href="#home">‹ 홈</a><div class="hd"><h1>'+(part==='pt'?'PT':'골프')+'</h1></div>'+body+'</div>'+api.tabbar(part);window.AppDrafts?.bind(api.app);
  }
  function configure(config){if(bound===config.app)return;bound=config.app;
    config.app.addEventListener('change',ev=>{if(!ev.target.matches('[data-coach-source]'))return;api.go('coach',{part:view.part,coachTab:'standards',coachSource:ev.target.value,coachId:null});});
    config.app.addEventListener('click',ev=>{if(ev.target.closest('[data-coach-finish]')){try{finish(view.part);api.refresh();api.toast('내 기준과 기록은 보존하고 이번 확인을 마쳤습니다.');}catch(error){api.toast(error.message);}return;}const b=ev.target.closest('[data-coach-use]');if(!b)return;try{activate(view.part,b.dataset.coachUse);api.go('coach',{part:view.part,coachTab:'now',coachId:null,coachSource:null,coachRecord:null});}catch(error){api.toast(error.message);}});
    config.app.addEventListener('submit',ev=>{const f=ev.target.closest('[data-coach-form]');if(!f)return;ev.preventDefault();if(!f.reportValidity())return;const data=new FormData(f),get=k=>String(data.get(k)||'').trim();
      try{
        if(f.dataset.coachForm==='criterion'){
          const src=sources(view.part).find(x=>x.key===f.dataset.source);if(!src)throw Error('원본 자료를 다시 선택해 주세요.');
          const c=saveCriterion({id:f.dataset.criterion,part:view.part,sourceKey:src.key,title:src.title,cue:get('cue'),check:get('check'),setup:get('setup'),caution:get('caution'),club:get('club'),referenceId:get('referenceId'),confirmed:data.has('confirmed')});f.dataset.criterion=c.id;
        }else if(f.dataset.coachForm==='result'){f.dataset.recordId ||=uid();saveRecord({id:f.dataset.recordId,part:view.part,criterionId:f.dataset.criterion,result:get('result'),memo:get('memo'),question:get('question')});}
        else answerRecord(f.dataset.record,get('answer'),data.has('apply'));
        const cleared=window.AppDrafts?.clear(f);api.toast(cleared===false?'기록은 저장됨 · 초안 정리는 다시 시도합니다':'저장했습니다');api.go('coach',{part:view.part,coachTab:'now',coachId:null,coachSource:null,coachRecord:null});
      }catch(error){api.toast(error.code==='CONFLICT'?'다른 탭에서 같은 기록이 바뀌었습니다. 입력은 유지합니다.':error.code==='WRITE_FAILED'?'저장하지 못했습니다. 입력은 유지합니다.':error.message);}
    });
  }
  return {render,sources,read,saveCriterion,saveRecord,answerRecord,activate,finish,searchRecords};
})();
