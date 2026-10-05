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
  const clubs=['7번 아이언','5번 아이언','P 아이언'];
  const distances=['대체로 짧음','대체로 적정','대체로 김','편차가 큼','미확인'];
  const feels=['평소보다 좋음','비슷함','평소보다 아쉬움'];
  const measures=['타감으로 판단','페이스 자국으로 확인'];
  const today=()=>new Intl.DateTimeFormat('sv-SE',{timeZone:'Asia/Seoul',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
  const selected=s=>notes[s.practice?.selected] ? s.practice.selected : '1004';
  const opts=(list,sel='')=>list.map(x=>`<option ${x===sel?'selected':''}>${esc(x)}</option>`).join('');
  let ctx, bound;
  function timeline(s,id){
    const key=notes[id]?id:selected(s),n=notes[key];
    return `<section class="g-sensations"><h2>아이언 감각의 변화</h2><p class="g-meta">개인 연습 감각 · 최근 기록도 비교할 후보입니다.</p><nav class="g-sensation-dates" aria-label="감각 날짜">${['1004','1003','1001','0930'].map(k=>`<a href="#golf/notes/${k}" ${k===key?'aria-current="page"':''}>${notes[k].date}</a>`).join('')}</nav><h3>${esc(n.title)}</h3><p class="g-meta">2026년 ${n.date} · 아이언 공통 후보</p><div class="g-pre g-original">${esc(n.original)}</div><p class="g-meta">연습용 한 문장 · 정리 제안</p><p class="g-cue">${esc(n.cue)}</p><button type="button" class="g-btn g-primary" data-practice="adopt" data-id="${key}">이 감각으로 오늘 연습</button><details><summary>레슨에서 확인할 점</summary><p>${esc(n.question)}</p></details></section>`;
  }
  function questions(){return `<section class="g-section"><h2>감각에서 이어진 질문</h2>${[['1004','어깨가 고정되는 느낌과 실제 어깨 움직임은 어떻게 다른가요?'],['1004','왼쪽 축이 만들어졌다는 것을 무엇으로 확인하면 좋을까요?'],['1003','오른손가락 힘은 언제 필요하고, 과하게 힘을 주는 것과 어떻게 구분하나요?']].map(([id,q])=>`<div class="g-question"><p>${q}</p><a href="#golf/notes/${id}">${notes[id].date} 감각 원문 보기 ›</a></div>`).join('')}</section>`;}
  function render(s,card,videos){
    const key=selected(s),n=notes[key],day=today(),records=s.practiceRecords||[],recent=records.filter(r=>r.date===day);
    const row=r=>`<article class="g-practice-result"><h3>${esc(r.club)} · ${r.method==='baseline'?'평소 방식':esc(r.cueDate)+' 감각'}</h3><p>중심 타점 ${r.contact}/5 · 목표 출발 방향 ${r.direction}/5</p><p class="g-meta">${esc(r.measure)} · 거리 ${esc(r.distance)} · 임팩트 ${esc(r.feel)}</p><details><summary>연습 기준 보기</summary><p>${esc(r.method==='baseline'?'평소 방식으로 연습':r.cueText)}</p></details></article>`;
    return `<p class="g-meta">${day} · 나의 감각을 다음 연습으로</p><section class="g-practice-hero"><span class="g-meta">오늘 쓸 한 문장</span><h2>${esc(n.cue)}</h2><p class="g-meta">${n.date} 감각 · 비교할 후보</p><a href="#golf/notes/${key}">감각 바꾸기 ›</a><details><summary>이 감각의 원문 보기</summary><p class="g-pre">${esc(n.original)}</p></details></section><section class="g-section"><h2>5구씩 비교하기</h2><p>평소 방식과 선택한 감각을 번갈아 비교하세요.</p><details class="g-practice-entry" ${window.AppDrafts?.has?.('golf-practice-'+key)?'open':''}><summary>5구 결과 기록</summary><form class="g-editor g-practice-form" data-g-form="practice" data-draft-key="golf-practice-${key}" data-cue="${key}" data-cue-text="${esc(n.cue)}"><div class="g-practice-fields"><label>오늘의 클럽<select name="club" id="g-practice-club" required><option value="">선택하세요</option>${opts(clubs,s.practice?.club)}</select></label><label>이번 5구의 방식<select name="method" id="g-practice-method"><option value="baseline">평소 방식</option><option value="cue" ${recent.at(-1)?.method==='baseline'?'selected':''}>${n.date} 감각</option></select></label><label>중심 타점 / 5구<input name="contact" id="g-practice-contact" type="number" inputmode="numeric" min="0" max="5" step="1" required placeholder="0–5"></label><label>목표 출발 방향 / 5구<input name="direction" id="g-practice-direction" type="number" inputmode="numeric" min="0" max="5" step="1" required placeholder="0–5"></label><label>타점 확인 방법<select name="measure" id="g-practice-measure">${opts(measures)}</select></label><label>캐리 / 목표 거리<select name="distance" id="g-practice-distance" required><option value="">선택하세요</option>${opts(distances)}</select></label><label>내가 느낀 임팩트<select name="feel" id="g-practice-feel" required><option value="">선택하세요</option>${opts(feels)}</select></label></div><button class="g-btn g-primary" type="submit">5구 결과 저장</button><p class="g-meta">이 기기에 저장 · 타감과 샷 결과를 구분해 기록</p></form></details></section><section class="g-section"><h2>오늘의 비교 기록 <small>${recent.length*5}구</small></h2>${recent.length?recent.slice().reverse().map(row).join(''):'<p class="g-muted">아직 기록이 없습니다.</p>'}</section>${records.some(r=>r.date!==day)?`<details class="g-practice-history"><summary>지난 연습 기록</summary>${records.filter(r=>r.date!==day).slice().reverse().map(r=>`<p class="g-meta">${r.date}</p>${row(r)}`).join('')}</details>`:''}<section class="g-video-section g-practice-related"><header><h2>함께 확인할 영상</h2><a href="#golf/videos">전체 영상 ›</a></header><div class="g-video-grid">${['EgdcUOkvJKk','jg52OubK_L0'].map(id=>videos.find(v=>v.id===id)).filter(Boolean).map(card).join('')}</div><p class="g-meta">관련 주제의 참고 영상 · 개인 감각의 효과를 입증한 자료는 아닙니다.</p></section>`;
  }
  function configure(c){
    ctx=c;if(bound===c.app)return;bound=c.app;
    c.app.addEventListener('click',ev=>{const b=ev.target.closest('[data-practice=adopt]');if(!b||!notes[b.dataset.id])return;ev.preventDefault();if(ctx.change(s=>{s.practice={...s.practice,selected:b.dataset.id};})){ctx.toast('오늘 비교할 감각으로 선택했습니다.');ctx.go('today');}});
    c.app.addEventListener('submit',ev=>{
      const form=ev.target.closest('[data-g-form=practice]');if(!form)return;ev.preventDefault();
      const fd=new FormData(form),val=k=>String(fd.get(k)||''),key=form.dataset.cue,n=notes[key];
      const contact=Number(val('contact')),direction=Number(val('direction'));
      if(!form.reportValidity()||!n||!clubs.includes(val('club'))||!['baseline','cue'].includes(val('method'))||!distances.includes(val('distance'))||!feels.includes(val('feel'))||!measures.includes(val('measure'))||![contact,direction].every(x=>Number.isInteger(x)&&x>=0&&x<=5))return;
      const record={id:form.dataset.recordId||'practice_'+crypto.randomUUID(),date:today(),created:new Date().toISOString(),club:val('club'),method:val('method'),cueId:key,cueDate:n.date,cueText:form.dataset.cueText,contact,direction,distance:val('distance'),feel:val('feel'),measure:val('measure')};
      if(ctx.change(s=>{s.practice={...s.practice,club:record.club};s.practiceRecords||=[];const i=s.practiceRecords.findIndex(r=>r.id===record.id);if(i<0)s.practiceRecords.push(record);else s.practiceRecords[i]=record;})){
        form.dataset.recordId=record.id;if(ctx.finishSaved(form,'5구 결과를 저장했습니다.'))ctx.go('today');
      }
    });
  }
  return {render,timeline,questions,configure,notes};
})();
