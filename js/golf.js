/* 골프: 기존 노트 + 날짜별 개인 레슨 + 영상. 운동 overlay와 분리해 보존. */
window.GolfHub = (() => {
  const KEY = 'ptgolf_learning_v1';
  const content = window.GolfContent;
  let api, current, state, loadError = false;
  const empty = () => ({lessons: [], questions: [], focus: [], videoNotes: {}});
  try {
    const raw = localStorage.getItem(KEY);
    state = raw ? JSON.parse(raw) : empty();
    if (!state || !['lessons','questions','focus'].every(k => Array.isArray(state[k])) ||
        !state.videoNotes || typeof state.videoNotes !== 'object') throw new Error('invalid golf data');
  } catch { state = empty(); loadError = true; }
  const e = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const uid = () => 'g_' + crypto.randomUUID();
  const videos = () => content.videos;
  const lessons = () => [...new Map([...content.lessons, ...state.lessons].map(l => [l.id,l])).values()].sort((a,b) => b.date.localeCompare(a.date));
  const notes = () => Store.getByPart('golf');
  const topics = id => content.noteTopics[id] || [];
  const video = id => videos().find(v => v.id === id);
  const lesson = id => lessons().find(l => l.id === id);
  const source = (kind,id) => kind === 'videos' ? video(id) : kind === 'lessons' ? lesson(id) : Store.getById(id);
  const sourceTitle = (kind,id) => { const x = source(kind,id); return x?.title || x?.name || '원본 항목'; };
  const relatedVideos = id => videos().filter(v => v.topics.some(t => topics(id).includes(t)));
  const relatedLessons = id => lessons().filter(l => (l.noteIds || []).includes(id));
  const stamp = () => new Date().toISOString();
  function change(fn) {
    if (loadError) { api.toast('저장된 골프 기록을 읽지 못했습니다. 기존 기록을 보호하기 위해 저장을 멈췄습니다.'); return false; }
    try {
      const next = JSON.parse(JSON.stringify(state)); fn(next);
      localStorage.setItem(KEY, JSON.stringify(next)); state = next; return true;
    } catch { api.toast('저장하지 못했습니다. 입력 내용을 복사해 보관해 주세요.'); return false; }
  }
  function go(tab='notes',id=null,extra={}) { api.go('golf-hub',{part:'golf',golfTab:tab,golfId:id,...extra}); }
  function href(kind,id) { return kind === 'notes' ? '#exercise/' + encodeURIComponent(id) : '#golf/' + kind + '/' + encodeURIComponent(id); }
  const link = (kind,id,label) => `<a class="g-link" href="${href(kind,id)}">${e(label || sourceTitle(kind,id))} ›</a>`;
  const button = (action,label,attrs='') => `<button type="button" class="g-btn" data-g="${action}" ${attrs}>${e(label)}</button>`;
  const chips = ts => `<div class="g-tags">${ts.map(t=>`<a href="#golf/topic/${encodeURIComponent(t)}" class="g-topic">${e(t)}</a>`).join('')}</div>`;
  const block = (title,body) => `<section class="g-section"><h2>${e(title)}</h2>${body}</section>`;
  const paras = text => `<p class="g-pre">${e(text)}</p>`;
  const activeFocus = id => state.focus.filter(f => f.active && (!id || f.noteId === id) && Store.getById(f.noteId));
  const focusRow = f => `<div class="g-focus-item"><p>${e(f.text)}</p><div class="g-meta">${link('notes',f.noteId)} · 출처 ${link(f.kind,f.sourceId)}</div>${button('unpin','집중 항목 해제',`data-id="${e(f.id)}"`)}</div>`;
  function viewOptions(v,compact=false) {
    const model=content.modelOptionFor(v);
    return `<div class="g-view-options ${compact?'g-view-compact':''}" role="group" aria-label="${e(v.title)} 보기 방법">
      ${model?`<a class="g-view-option" href="${e(model.href)}"><strong>실사형 3D로 보기</strong><span>${e(model.detail)}</span></a>`:'<div class="g-view-option g-view-unavailable"><strong>3D 제공 안 함</strong><span>에이밍은 원본으로 확인</span></div>'}
      <a class="g-view-option" href="https://www.youtube.com/watch?v=${e(v.id)}" target="_blank" rel="noopener noreferrer"><strong>원본 영상 보기 ↗</strong><span>실제 선수·코치의 영상 · YouTube</span></a>
    </div>${!compact&&model?'<p class="g-meta g-view-note">3D는 학습용 모델이며 원본 선수의 외형·동작을 그대로 복원한 것은 아닙니다.</p>':''}`;
  }
  function card(v) {
    const n = state.videoNotes[v.id] || {};
    return `<article class="g-video-card"><div class="g-meta">${e(v.channel)} · ${e(v.duration)}${content.presentationFor(v)==='original'?' · 원본 + 편집 설명':' · 3D 레슨'}${n.status ? ' · '+ e(n.status) : ''}</div><a class="g-card-title" href="${href('videos',v.id)}">${e(v.title)} <span>›</span></a><p>${e(v.summary)}</p>${chips(v.topics)}${viewOptions(v,true)}</article>`;
  }
  function lessonRow(l) { return `<article class="g-lesson-row"><div class="g-meta">${e(l.date)}${l.coach?' · '+e(l.coach):''}</div><a class="g-card-title" href="${href('lessons',l.id)}">${e(l.title)} ›</a><p>${e(l.correction || l.problem || '')}</p>${chips(l.topics || [])}</article>`; }
  function questionRows(list) {
    return list.map(q => `<div class="g-question"><p>${e(q.text)}</p><div class="g-meta">${link(q.kind,q.sourceId,'질문 출처 보기')}${q.lessonId?' · '+link('lessons',q.lessonId,'답변 레슨'):''}</div>${q.lessonId?'':button('question-edit','질문 수정',`data-id="${e(q.id)}"`)}</div>`).join('');
  }
  function tabs(selected) {
    return `<nav class="g-tabs" aria-label="골프 구분">${[['notes','스윙 노트'],['lessons','레슨'],['videos','유튜브']].map(([id,label]) => `<a href="#golf/${id}" ${selected===id?'aria-current="page"':''}>${label}</a>`).join('')}</nav>`;
  }
  function layout(body, selected='notes') {
    api.app.innerHTML = `<div class="scr g-hub" data-part="golf"><button class="back" data-nav="home">‹ 홈</button><div class="hd"><h1>골프</h1></div>${tabs(selected)}${loadError?'<p role="alert">이 기기의 골프 기록을 불러오지 못했습니다. 새로고침해 다시 확인해 주세요.</p>':''}${body}<p class="g-footnote">메모·레슨·집중 항목은 이 기기에 저장됩니다.</p></div>${api.tabbar('golf')}`;
    const fab = api.app.querySelector('.fab'); if(fab) fab.hidden = true;
  }
  function matches(x,view) {
    const q=(view.golfQuery||'').trim().toLowerCase().split(/\s+/).filter(Boolean);
    return (!view.golfTopic || (x.topics||[]).includes(view.golfTopic)) && q.every(w => JSON.stringify(x).toLowerCase().includes(w));
  }
  function filters(view) {
    return `<form class="g-search" data-g-form="search"><label for="g-search">골프 전체 검색</label><div class="g-actions"><input id="g-search" name="q" value="${e(view.golfQuery||'')}" placeholder="클럽·주제·메모"><button class="g-btn">검색</button></div></form>${view.golfTopic?`<div class="g-actions"><span>${e(view.golfTopic)}</span>${button('clear-filter','주제 해제')}</div>`:''}`;
  }
  function render(view,config) {
    api=config; current=view;
    const tab=view.golfTab||'notes', id=view.golfId;
    if (tab==='videos' && id) return videoDetail(id);
    if (tab==='lessons' && id) return lessonDetail(id);
    if (tab==='lesson-edit') return lessonEditor(id);
    if (tab==='question-edit') return questionEditor(view);
    if (tab==='adopt') return adoptionEditor(view);
    if (tab==='topic') return topicPage(id);
    if (tab==='search') return searchPage(view);
    let body=filters(view);
    if (tab==='notes') {
      const fs=activeFocus();
      body+=block('지금 집중할 것',fs.length?fs.map(focusRow).join(''):'<p class="g-muted">노트·레슨·영상에서 지금 연습할 핵심을 골라 최대 3개까지 모아보세요.</p>');
      body+=`<div class="chips" aria-label="클럽 분류">${['',...Store.getCategories('golf')].map(c=>`<button class="chip ${(!view.cat&&!c)||view.cat===c?'on':''}" data-g="category" data-id="${e(c)}" aria-pressed="${(!view.cat&&!c)||view.cat===c?'true':'false'}">${e(c||'전체')}</button>`).join('')}</div>`;
      const list=notes().filter(n => (!view.cat || n.category===view.cat) && matches({...n,topics:topics(n.id)},view));
      body+=block('클럽별 스윙 노트',list.length?list.map(n=>`<div class="g-note-row">${api.exRow(n,null,true)}<div class="g-meta">${relatedLessons(n.id).length}개 레슨 · ${relatedVideos(n.id).length}개 참고 영상</div></div>`).join(''):'<p class="g-muted">조건에 맞는 노트가 없습니다.</p>');
      body+='<div class="g-actions"><button type="button" class="g-btn" data-act="add">스윙 노트 추가</button></div>';
      body+=block('주제로 이어보기',chips(content.topics));
      if(lessons().length) body+=block('최근 레슨',lessonRow(lessons()[0]));
    } else if(tab==='videos') {
      const list=videos().filter(v=>matches({...v,...state.videoNotes[v.id]},view));
      body+=`<p class="g-intro">선택한 영상 ${videos().length}편 · 보고, 비교하고, 내 연습으로 연결하세요.</p>${list.length?list.map(card).join(''):'<p class="g-muted">조건에 맞는 영상이 없습니다.</p>'}`;
    } else {
      body+=`<div class="g-actions">${button('lesson-new','레슨 기록하기')}</div>`;
      const qs=state.questions.filter(q=>!q.lessonId);
      body+=block('다음 레슨에 물어볼 것',qs.length?questionRows(qs):'<p class="g-muted">노트나 영상의 ‘레슨에서 질문’으로 질문을 모아두세요.</p>');
      const ls=lessons().filter(l=>matches(l,view));
      body+=block('레슨 기록',ls.length?ls.map(lessonRow).join(''):`<div class="g-empty"><h3>${lessons().length?'조건에 맞는 레슨이 없어요':'첫 레슨을 기다리고 있어요'}</h3><p>레슨 후 날짜·교정·숙제를 남기면 관련 스윙 노트와 영상에 함께 연결됩니다.</p></div>`);
    }
    layout(body,tab);
  }
  function noteLinks(ids) { return `<div class="g-links">${ids.map(id=>Store.getById(id)?link('notes',id):'').join('')}</div>`; }
  function related(id) {
    const n=Store.getById(id); if(n?.part!=='golf') return '';
    const fs=activeFocus(id), history=state.focus.filter(f=>f.noteId===id&&!f.active);
    return `<div class="g-related" id="g-related">${block('내 연습에 반영한 핵심',fs.length?fs.map(focusRow).join(''):'<p class="g-muted">현재 기준 노트입니다. 새 레슨에서 확인한 교정은 출처와 함께 여기에 모읍니다.</p>')}
      <div class="g-actions">${button('adopt','집중 항목 정하기',`data-kind="notes" data-id="${e(id)}"`)}${button('ask','레슨에서 질문',`data-kind="notes" data-id="${e(id)}"`)}</div>
      ${chips(topics(id))}${block('연결된 레슨',relatedLessons(id).map(lessonRow).join('')||'<p class="g-muted">아직 연결된 레슨이 없습니다.</p>')}${block('같은 주제의 유튜브',relatedVideos(id).map(card).join('')||'<p class="g-muted">아직 연결된 영상이 없습니다.</p>')}
      ${history.length?`<details class="g-history"><summary>이전에 집중했던 내용 (${history.length})</summary>${history.map(f=>`<p>${e(f.text)}</p><div class="g-meta">${e(f.created.slice(0,10))} · ${link(f.kind,f.sourceId)}</div>`).join('')}</details>`:''}</div>`;
  }
  function videoDetail(id) {
    const v=video(id); if(!v) return layout('<p>찾을 수 없는 영상입니다.</p>','videos');
    const n=state.videoNotes[id]||{};
    const relatedIds=notes().filter(x=>v.topics.some(t=>topics(x.id).includes(t))).map(x=>x.id);
    const keepOriginal=content.presentationFor(v)==='original';
    layout(`<a class="back" href="#golf/videos">‹ 유튜브 목록</a><div class="g-meta">${e(v.channel)} · ${e(v.duration)}</div><h2 class="g-title">${e(v.title)}</h2>${chips(v.topics)}
      ${keepOriginal?'<p class="g-meta">'+(content.durationSeconds(v)<=content.originalMaxSeconds?'3분 이하 영상 · 원본과 편집 설명을 함께 봅니다.':'원본과 편집 설명으로 확인하는 영상입니다.')+'</p>':''}
      ${viewOptions(v)}
      <div class="g-player" id="g-player">${button('play','앱 안에서 재생',`data-id="${e(id)}"`)}<span>재생할 때 YouTube에 연결됩니다.</span></div>
      <a class="g-link" href="https://www.youtube.com/watch?v=${id}" target="_blank" rel="noopener noreferrer">영상이 보이지 않으면 YouTube에서 열기 ↗</a>
      <div class="g-moments">${v.moments.map(m=>`<a href="https://www.youtube.com/watch?v=${id}&t=${m.s}s" target="_blank" rel="noopener noreferrer">${e(m.label)} ↗</a>`).join('')}</div>
      ${block('영상 핵심',paras(v.summary)+`<ul>${v.points.map(p=>`<li>${e(p)}</li>`).join('')}</ul><p class="g-meta">${e(v.evidence)}</p>`)}
      ${block('내 스윙과 연결',paras(v.connection)+noteLinks(relatedIds))}
      ${v.relatedVideoIds?block('다음 동작으로 연결',v.relatedVideoIds.map(video).filter(Boolean).map(card).join('')):''}
      <div class="g-actions">${button('adopt','내 연습에 반영',`data-kind="videos" data-id="${id}"`)}${button('ask','레슨에서 질문',`data-kind="videos" data-id="${id}"`)}</div>
      ${block('내 적용 메모',`<form data-g-form="video" data-id="${id}"><label for="g-video-status">적용 상태</label><select id="g-video-status" name="status">${['참고','연습 중','레슨에서 확인'].map(s=>`<option ${n.status===s?'selected':''}>${s}</option>`).join('')}</select><label for="g-video-memo">느낀 점·결과</label><textarea id="g-video-memo" name="memo" rows="4">${e(n.memo||'')}</textarea><button class="g-btn g-primary">메모 저장</button></form>`)}
      ${block('연결된 레슨',lessons().filter(l=>(l.videoIds||[]).includes(id)).map(lessonRow).join('')||'<p class="g-muted">이 영상을 참고한 레슨을 기록하면 여기에 연결됩니다.</p>')}
      ${state.questions.some(q=>q.sourceId===id)?block('이 영상에서 남긴 질문',questionRows(state.questions.filter(q=>q.sourceId===id))):''}
      <details class="g-history"><summary>원본 제목</summary><p>${e(v.originalTitle)}</p></details>`,'videos');
  }
  function lessonDetail(id) {
    const l=lesson(id); if(!l) return layout('<p>찾을 수 없는 레슨입니다.</p>','lessons');
    layout(`<a class="back" href="#golf/lessons">‹ 레슨 목록</a><div class="g-meta">${e(l.date)}${l.coach?' · '+e(l.coach):''}</div><h2 class="g-title">${e(l.title)}</h2>${chips(l.topics||[])}
      ${[['발견한 문제',l.problem],['코치의 교정·느껴야 할 감각',l.correction],['연습 방법·숙제',l.homework],['기존 설명과 달라진 점',l.difference],['내 연습 결과',l.result]].filter(([,s])=>s).map(([t,s])=>block(t,paras(s))).join('')}
      <div class="g-actions">${button('lesson-edit','레슨 수정',`data-id="${e(id)}"`)}${button('adopt','내 연습에 반영',`data-kind="lessons" data-id="${e(id)}"`)}</div>
      ${block('연결된 스윙 노트',noteLinks(l.noteIds||[]))}${block('함께 본 유튜브',(l.videoIds||[]).map(video).filter(Boolean).map(card).join('')||'<p class="g-muted">연결한 영상이 없습니다.</p>')}
      ${state.questions.some(q=>q.lessonId===id)?block('이 레슨에서 확인한 질문',questionRows(state.questions.filter(q=>q.lessonId===id))):''}`,'lessons');
  }
  function field(name,label,value='',type='textarea',required=false) {
    const props=`id="g-${name}" name="${name}" ${required?'required':''}`;
    return `<label for="g-${name}">${label}</label>${type==='textarea'?`<textarea ${props} rows="3">${e(value)}</textarea>`:`<input ${props} type="${type}" value="${e(value)}">`}`;
  }
  function choices(name,items,selected=[]) {
    return `<div class="g-choices">${items.map(x=>`<label><input type="checkbox" name="${name}" value="${e(x.id)}" ${selected.includes(x.id)?'checked':''}> <span>${e(x.title||x.name)}</span></label>`).join('')}</div>`;
  }
  function lessonEditor(id) {
    const l=lesson(id)||{}, pending=state.questions.filter(q=>!q.lessonId||q.lessonId===id);
    layout(`<a class="back" href="${id?href('lessons',id):'#golf/lessons'}">‹ 취소</a><h2>${id?'레슨 수정':'레슨 기록'}</h2><form class="g-editor" data-g-form="lesson" data-id="${e(id||'')}">
      ${field('date','레슨 날짜',l.date||Store.todayStr(),'date',true)}${field('title','레슨 제목',l.title||'','text',true)}${field('coach','코치',l.coach||'','text')}
      <fieldset><legend>관련 스윙 노트</legend>${choices('noteIds',notes(),l.noteIds||[])}</fieldset>
      <fieldset><legend>교정 주제</legend>${choices('topics',content.topics.map(t=>({id:t,title:t})),l.topics||[])}</fieldset>
      ${field('problem','발견한 문제',l.problem)}${field('correction','코치의 교정·감각',l.correction,'textarea',true)}${field('homework','연습 방법·숙제',l.homework)}${field('difference','기존 설명과 달라진 점',l.difference)}${field('result','내 연습 결과',l.result)}
      <fieldset><legend>함께 확인한 영상</legend>${choices('videoIds',videos(),l.videoIds||[])}</fieldset>
      ${pending.length?`<fieldset><legend>이번에 답변받은 질문</legend>${choices('questionIds',pending.map(q=>({id:q.id,title:q.text})),pending.filter(q=>q.lessonId===id&&id).map(q=>q.id))}<p class="g-meta">답변은 위의 교정·감각에 기록하세요. 질문의 출처도 자동 연결됩니다.</p></fieldset>`:''}
      <p class="g-meta">레슨을 저장한 뒤 ‘내 연습에 반영’에서 집중 항목을 정할 수 있어요.</p><button class="g-btn g-primary">레슨 저장</button></form>`,'lessons');
  }
  function questionEditor(view) {
    const q=state.questions.find(q=>q.id===view.golfId);
    const kind=q?.kind||view.sourceKind||'notes', id=q?.sourceId||view.sourceId;
    if(!source(kind,id)) return go('lessons');
    layout(`<a class="back" href="${href(kind,id)}">‹ ${e(sourceTitle(kind,id))}</a><h2>다음 레슨에 질문</h2><form class="g-editor" data-g-form="question" data-id="${e(q?.id||'')}" data-kind="${e(kind)}" data-source="${e(id)}">${field('text','확인하고 싶은 내용',q?.text||video(id)?.question||'','textarea',true)}<button class="g-btn g-primary">질문 저장</button></form>`,'lessons');
  }
  function adoptionEditor(view) {
    const kind=view.sourceKind,id=view.sourceId,s=source(kind,id);
    if(!s) return go();
    const defaultText=kind==='videos'?s.points[0]:kind==='lessons'?s.correction:s.spec;
    layout(`<a class="back" href="${href(kind,id)}">‹ ${e(sourceTitle(kind,id))}</a><h2>지금 집중할 것</h2><p class="g-intro">직접 적용할 한 가지를 적고 연결할 클럽을 고르세요.</p><form class="g-editor" data-g-form="adopt" data-kind="${e(kind)}" data-source="${e(id)}"><label for="g-noteId">연결할 스윙 노트</label><select name="noteId" id="g-noteId" required>${notes().map(n=>`<option value="${e(n.id)}" ${n.id===(kind==='lessons'?s.noteIds?.[0]:id)?'selected':''}>${e(n.name)}</option>`).join('')}</select>${field('text','내 연습 핵심',defaultText,'textarea',true)}<p class="g-meta">출처와 반영 이력을 남깁니다. 현재 집중 항목은 최대 3개입니다.</p><button class="g-btn g-primary">집중 항목으로 저장</button></form>`,'notes');
  }
  function topicPage(t) {
    if(!content.topics.includes(t)) return go();
    layout(`<a class="back" href="#golf/notes">‹ 스윙 노트</a><h2>${e(t)}</h2>${block('스윙 노트',noteLinks(notes().filter(n=>topics(n.id).includes(t)).map(n=>n.id)))}${block('개인 레슨',lessons().filter(l=>(l.topics||[]).includes(t)).map(lessonRow).join('')||'<p class="g-muted">이 주제의 개인 레슨은 아직 없습니다.</p>')}${block('참고 영상',videos().filter(v=>v.topics.includes(t)).map(card).join(''))}`);
  }
  function searchPage(view) {
    const v={...view,golfTopic:null};
    const ns=notes().filter(n=>matches({...n,topics:topics(n.id)},v));
    const ls=lessons().filter(l=>matches(l,v)), vs=videos().filter(x=>matches({...x,...state.videoNotes[x.id]},v));
    layout(filters(v)+block('스윙 노트',noteLinks(ns.map(n=>n.id))||'<p>검색 결과가 없습니다.</p>')+block('레슨',ls.map(lessonRow).join('')||'<p>검색 결과가 없습니다.</p>')+block('유튜브',vs.map(card).join('')||'<p>검색 결과가 없습니다.</p>'));
  }
  function configure(config) {
    api=config;
    api.app.addEventListener('click', ev=>{
      const b=ev.target.closest('[data-g]'); if(!b) return;
      ev.preventDefault(); ev.stopPropagation(); const id=b.dataset.id,kind=b.dataset.kind;
      if(b.dataset.g==='jump-related') { document.getElementById('g-related')?.scrollIntoView({block:'start'}); return; }
      if(b.dataset.g==='category') return go('notes',null,{cat:id||null});
      if(b.dataset.g==='lesson-new') return go('lesson-edit');
      if(b.dataset.g==='lesson-edit') return go('lesson-edit',id);
      if(b.dataset.g==='question-edit') return go('question-edit',id);
      if(b.dataset.g==='ask') {
        const old=state.questions.find(q=>q.kind===kind&&q.sourceId===id&&!q.lessonId);
        return go('question-edit',old?.id||null,{sourceKind:kind,sourceId:id});
      }
      if(b.dataset.g==='adopt') return go('adopt',null,{sourceKind:kind,sourceId:id});
      if(b.dataset.g==='clear-filter') return go(current.golfTab,null,{golfTopic:null});
      if(b.dataset.g==='unpin') { if(change(s=>{const f=s.focus.find(x=>x.id===id);if(f){f.active=false;f.ended=stamp();}})){api.toast('집중 항목을 해제하고 이력에 남겼습니다.');api.refresh();} return; }
      if(b.dataset.g==='play' && video(id)) {
        const f=document.createElement('iframe'); f.src=`https://www.youtube-nocookie.com/embed/${id}?autoplay=1&playsinline=1&rel=0`;
        f.title=video(id).title; f.allow='autoplay; encrypted-media; picture-in-picture'; f.allowFullscreen=true;
        f.referrerPolicy='strict-origin-when-cross-origin'; document.getElementById('g-player').replaceChildren(f);
      }
    });
    api.app.addEventListener('submit',ev=>{
      const form=ev.target.closest('[data-g-form]'); if(!form) return;
      ev.preventDefault(); const fd=new FormData(form), text=n=>String(fd.get(n)||'').trim(), all=n=>fd.getAll(n).map(String);
      if(form.dataset.gForm==='search') return go('search',null,{golfQuery:text('q'),golfTopic:null});
      if(form.dataset.gForm==='video') {
        if(change(s=>{s.videoNotes[form.dataset.id]={memo:text('memo'),status:text('status')};})) api.toast('메모 저장됨'); return;
      }
      if(form.dataset.gForm==='question') {
        if(!text('text')) return;
        const id=form.dataset.id||uid();
        if(change(s=>{const old=s.questions.find(q=>q.id===id);const q={id,kind:form.dataset.kind,sourceId:form.dataset.source,text:text('text'),created:old?.created||stamp()};if(old)Object.assign(old,q);else s.questions.push(q);})){api.toast('레슨 질문에 저장했습니다.');go('lessons');} return;
      }
      if(form.dataset.gForm==='adopt') {
        if(!text('text')||!Store.getById(text('noteId'))) return;
        if(activeFocus().length>=3){api.toast('집중 항목 3개 중 하나를 해제한 뒤 추가하세요.');return;}
        const item={id:uid(),text:text('text'),noteId:text('noteId'),kind:form.dataset.kind,sourceId:form.dataset.source,active:true,created:stamp()};
        if(state.focus.some(f=>f.active&&f.noteId===item.noteId&&f.text===item.text)){api.toast('이미 같은 집중 항목이 있습니다.');return;}
        if(change(s=>s.focus.push(item))){api.toast('내 연습에 반영했습니다.');go('notes');} return;
      }
      if(form.dataset.gForm==='lesson') {
        if(!text('title')||!text('correction')||!/^\d{4}-\d{2}-\d{2}$/.test(text('date')))return;
        const selected=state.questions.filter(q=>all('questionIds').includes(q.id));
        const ls={id:form.dataset.id||uid(),date:text('date'),title:text('title'),coach:text('coach'),problem:text('problem'),correction:text('correction'),homework:text('homework'),difference:text('difference'),result:text('result'),
          noteIds:[...new Set([...all('noteIds'),...selected.filter(q=>q.kind==='notes').map(q=>q.sourceId)])],
          videoIds:[...new Set([...all('videoIds'),...selected.filter(q=>q.kind==='videos').map(q=>q.sourceId)])],topics:all('topics'),updated:stamp()};
        if(!ls.noteIds.length){api.toast('관련 스윙 노트를 하나 이상 선택하세요.');return;}
        ls.topics=[...new Set([...ls.topics,...ls.videoIds.flatMap(id=>video(id)?.topics||[])])];
        if(change(s=>{const i=s.lessons.findIndex(l=>l.id===ls.id);if(i<0)s.lessons.push(ls);else s.lessons[i]=ls;s.questions.forEach(q=>{if(all('questionIds').includes(q.id))q.lessonId=ls.id;else if(q.lessonId===ls.id)delete q.lessonId;});})){api.toast('레슨을 저장했습니다.');go('lessons',ls.id);}return;
      }
    });
  }
  function openLink(hash) {
    const m=/^#golf\/(notes|lessons|videos|topic)(?:\/([^/]+))?$/.exec(hash);if(!m)return false;
    let id;try{id=m[2]?decodeURIComponent(m[2]):null;}catch{return false;}
    go(m[1],id,{golfQuery:'',golfTopic:null,cat:null});return true;
  }
  return {configure,render,related,openLink};
})();
