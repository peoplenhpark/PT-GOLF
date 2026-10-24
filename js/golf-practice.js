/* Personal sensations are candidates, never verified coaching prescriptions. */
window.GolfPractice = (() => {
  const notes = {
  "1001": {
    "date": "10/1",
    "title": "밟고, 버티고, 톡",
    "cue": "밟고, 버티고, 톡",
    "original": "밟고,  버티고 오른쪽 어깨 안쓰고 톡 .\n\n왼쪽 어깨 회전+오른쪽 어깨 고정+양 옆구리 조이는 시점, 타이밍 이 중요.",
    "question": "오른쪽 어깨를 안 쓰는 느낌이 실제로 어떤 움직임에서 나오는지, 타이밍을 원본 기록과 비교합니다."
  },
  "1003": {
    "date": "10/3",
    "title": "조용한 회전과 낙차 탐색",
    "cue": "충분히, 조용히 회전",
    "original": "충분히, 조용히 회전 광배근 움직임,\n언제, 뭘 보고 채, 힘 구분\n나는 어떤때 어떻게 달라지고\n교정방법은?\n\n오른쪽,  왼쪽 어깨 활용법\n\n조용하고 움직임 거의 없는 스윙\n낙차 이용, 오른쪽 손가락 힘주기?",
    "question": "광배근·어깨·손가락에 대한 질문은 아직 실행 지침으로 확정하지 않습니다. 어떤 상황에서 달라지는지 확인합니다."
  },
  "1004": {
    "date": "10/4",
    "title": "왼쪽 지지 이후의 임팩트 감각",
    "cue": "무거운 것을 원위치시키는 느낌",
    "original": "왼쪽 축이 만들어지고 나서 양 어깨는 거의 고정. 무거운 것을 원위치 시키는 느낌.  임팩트시 통제하는 느낌  갖기.",
    "question": "‘무거운 것’과 ‘원위치’는 구체적으로 무엇을 뜻했나요? 어깨 고정의 느낌과 실제 움직임은 어떻게 다른가요?"
  },
  "0930": {
    "date": "9/30",
    "title": "체중이동부터 임팩트까지의 순서",
    "cue": "손이 내려오기까지 기다렸다가 몸통 회전",
    "original": "체중이동하면서 손은 내려러고, 내려오기까지 기다렸다가 몸통 회전하는데 임팩트에 집중\n\n체중이동 중요.\n수지 낙하중요.\n좌우 어깨 턴 높이 유지.\n왼쪽어깨는 골반을 넘지 않도록.\n임팩트는 몸으로,  임팩트시 좌 우 팔은 저항.\n임팩트후 팔  곧게 펴기.\n임팩트에 집중.",
    "question": "체중이동·기다림·회전은 어떤 순서로 느껴졌나요? 원문의 표현을 보존하고 한 번에 모두 의식하지 않도록 비교합니다."
  }
};
  const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const clubs=['7번 아이언','5번 아이언','P 아이언','드라이버'];
  const selected=s=>notes[s.practice?.selected] ? s.practice.selected : '1004';
  let ctx;
  function timeline(s,id){
    const key=notes[id]?id:selected(s),n=notes[key];
    return lessonBridge(s,'notes',key)+`<section class="g-sensations"><h2>아이언 감각의 변화</h2><p class="g-meta">개인 연습 감각 · 원문 보존, 현재 레슨과 비교</p><nav class="g-sensation-dates" aria-label="감각 날짜">${['1004','1003','1001','0930'].map(k=>`<a href="#golf/notes/${k}" ${k===key?'aria-current="page"':''}>${notes[k].date}</a>`).join('')}</nav><h3>${esc(n.title)}</h3><p class="g-meta">2026년 ${n.date} · 아이언 공통 후보</p><div class="g-pre g-original">${esc(n.original)}</div><p class="g-meta">연습용 한 문장 · 정리 제안</p><p class="g-cue">${esc(n.cue)}</p><details><summary>레슨에서 확인할 점</summary><p>${esc(n.question)}</p></details></section>`;
  }
  function questions(){return `<section class="g-section"><h2>감각에서 이어진 질문</h2>${[['1004','어깨가 고정되는 느낌과 실제 어깨 움직임은 어떻게 다른가요?'],['1004','왼쪽 축이 만들어졌다는 것을 무엇으로 확인하면 좋을까요?'],['1003','오른손가락 힘은 언제 필요하고, 과하게 힘을 주는 것과 어떻게 구분하나요?']].map(([id,q])=>`<div class="g-question"><p>${q}</p><a href="#golf/notes/${id}">${notes[id].date} 감각 원문 보기 ›</a></div>`).join('')}</section>`;}
  function configure(c){ctx=c;}
  const lessonList=()=>ctx?.lessons?.()||[...window.GolfContent.lessons].sort((a,b)=>b.date.localeCompare(a.date));
  const lessonLink=l=>`<a href="#golf/lessons/${encodeURIComponent(l.id)}">${esc(l.date)} 레슨 보기 ›</a>`;
  function practiceSource(s){
    const l=lessonList()[0];
    if(l)return {id:l.id,kind:'lesson',date:l.date,cue:l.practiceCue||l.correction,original:l.correction,clubs:l.practiceClubs?.length?l.practiceClubs:clubs,lesson:l};
    const key=selected(s);return {...notes[key],id:key,kind:'sensation',clubs};
  }
  function lessonHero(l){
    if(!l)return '';
    return `<section class="g-lesson-anchor"><p class="g-meta">이번 레슨부터 복습 · ${esc(l.date)}</p><h2>${esc(l.title)}</h2>${(l.practicePoints||[]).length?`<ol>${l.practicePoints.map(t=>`<li>${esc(t)}</li>`).join('')}</ol>`:`<p class="g-cue">${esc(l.practiceCue||l.correction)}</p>`}<p class="g-meta">${esc((l.practiceClubs||[]).join(' · '))}</p><div class="g-actions"><a class="g-link" href="#golf/now">지금 할 것에서 복습 ›</a>${lessonLink(l)}</div>${l.videoCollection?.groupId?`<p><a href="#golf/group/${esc(l.videoCollection.groupId)}">첫 레슨 복습 영상 ${l.videoCollection.videoIds.length}편 ›</a></p>`:''}</section>`;
  }
  function lessonHome(s,list){
    return lessonHero(list[0]);
  }
  function lessonEvidence(l,s){
    return `${l.scope?`<p class="g-trust-note">${esc(l.scope)}</p>`:''}${l.sourceNote?`<details class="g-lesson-evidence"><summary>레슨 기록의 근거와 확인 범위</summary><p class="g-meta">${esc(l.sourceNote)}</p>${(l.evidence||[]).map(item=>`<p><b>${esc(item.time)}</b><br>${esc(item.text)}</p>`).join('')}</details>`:''}${l.sensationReviews?`<section class="g-section"><h2>이전 감각과 연결</h2>${Object.entries(l.sensationReviews).sort().map(([id,text])=>`<article class="g-question"><a href="#golf/notes/${id}">${notes[id]?.date||id} 감각 원문 ›</a><p>${esc(text)}</p></article>`).join('')}</section>`:''}`;
  }
  function lessonBridge(s,tab,id){
    const n=practiceSource(s),l=n.lesson||lessonList()[0];if(!l)return '';
    if(tab==='notes')return `<aside class="g-lesson-bridge"><b>레슨을 기준으로 감각 다시 보기</b><p>${esc(l.sensationReviews?.[id]||'예전 원문은 보존하고, 현재 레슨과 비교해 확인합니다.')}</p>${lessonLink(l)}</aside>`;
    if(tab==='videos')return `<aside class="g-lesson-bridge" aria-labelledby="g-current-lesson"><h2 id="g-current-lesson">현재 레슨과 연결</h2><p>${esc(l.practiceCue||l.correction)}</p><a class="g-link" href="#golf/lessons/${encodeURIComponent(l.id)}">레슨과 복습 영상 ${(l.videoIds||[]).filter(id=>!ctx?.isVideoDeleted?.(id)).length}편 보기 ›</a></aside>`;
    return '';
  }
  function lessonQuestions(list){
    const l=list[0];if(!l)return '';
    return `<section class="g-section"><h2>다음 레슨에 확인할 것</h2>${(l.followUpQuestions||[]).map(q=>`<div class="g-question"><p>${esc(q)}</p></div>`).join('')}<button type="button" class="g-btn" data-g="ask" data-kind="lessons" data-id="${esc(l.id)}">이 레슨에서 질문 남기기</button></section>`;
  }

  return {timeline,questions,configure,notes,lessonHome,lessonEvidence,lessonBridge,lessonQuestions,practiceSource};
})();
