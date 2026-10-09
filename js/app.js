/* app.js — 라우팅 + 렌더 + CRUD UI (vanilla, 빌드 없음) */

/* ── 테마 관리 ── */
const Theme = (() => {
  const KEY = 'ptgolf_theme';
  const DARK_META  = '#0d0f14';
  const LIGHT_META = '#f5f7fa';

  function get() { try{return localStorage.getItem(KEY)||'dark';}catch{return 'dark';} }

  function apply(t) {
    document.documentElement.setAttribute('data-theme', t);
    // 상태바 색상
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.content = t === 'light' ? LIGHT_META : DARK_META;
    // 버튼 아이콘
    const btn = document.getElementById('theme-btn');
    if (btn) btn.textContent = t === 'light' ? '☀️' : '🌙';
  }

  function set(t) { localStorage.setItem(KEY, t); apply(t); }
  function toggle() { set(get() === 'dark' ? 'light' : 'dark'); }
  function init() { apply(get()); }

  return { get, set, toggle, init };
})();

(() => {
  const app = document.getElementById('app');
  const modal = document.getElementById('modal');
  const confirmEl = document.getElementById('confirm');
  const toastEl = document.getElementById('toast');

  // 자산 버전 — 그림(SVG) URL에 붙여 캐시 강제 갱신 (릴리스 시 index.html·sw.js와 함께 올릴 것)
  const ASSET_VER = String(window.PTGolfRelease?.version || '90');

  // 화면 상태
  let view = { name: 'home', part: null, cat: null, id: null };
  const navigation = AppNavigation.create();
  let ignoreHashChange = false;
  // 운동 1회용 체크 상태(저장 안 함): { exId: Set(cueIndex) }
  const checks = {};
  let confirmCb = null;

  const esc = s => String(s ?? '').replace(/[&<>"']/g, c =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const partLabel = p => (Store.getParts().find(x => x.id === p) || {}).label || p;
  const partIcon = p => (Store.getParts().find(x => x.id === p) || {}).icon || '';

  function toast(msg) {
    toastEl.textContent = msg;
    toastEl.classList.remove('hidden');
    clearTimeout(toast._t);
    toast._t = setTimeout(() => toastEl.classList.add('hidden'), 1600);
  }

  // ============ 렌더 ============
  function renderScreen() {
    if(view.name==='coach')return window.CoachDesk.render(view,golfConfig());
    if(view.name==='golf-hub')return renderGolf();
    if (view.name === 'home') return renderHome();
    if (view.name === 'part') return renderPart(view.part);
    if (view.name === 'detail') return renderDetail(view.id);
    if (view.name === 'favorites') return renderFavorites();
    if (view.name === 'search') return renderSearch();
    if (view.name === 'calendar') return renderCalendar();
  }

  function renderGolf() {
    try {if(!window.GolfHub||!window.GolfContent)throw new Error('골프 자료 없음');GolfHub.render(view,golfConfig());}
    catch(error){app.innerHTML='<div class="scr"><h1>골프 자료를 불러오지 못했습니다</h1><p>연결을 확인한 후 새로고침해 주세요. 저장한 기록은 보존됩니다.</p><button class="btn" data-act="reload">다시 불러오기</button></div>'+tabbar('golf');}
  }
  function render() {
    renderScreen();renderStorageStatus();navigation.sync(view);AppDrafts.bind(app);
    if(view.name==='detail'&&AppDrafts.has(location.hash)&&!document.getElementById('memo-input'))openMemoEditor();
    navigation.restoreScroll();updateHistoryButtons();window.dispatchEvent(new Event('ptgolf-screen-rendered'));
  }
  function renderStorageStatus(){
    const status=Persistence.getStatus(),errors=status.stores.filter(s=>!s.ok);
    if(status.available&&!status.restorePending&&!errors.length)return;
    const banner=document.createElement('section');banner.className='storage-warning';banner.setAttribute('role','alert');
    banner.innerHTML='<strong>개인 기록을 보호하고 있습니다</strong><p>'+(status.restorePending?'이전 복원이 중단되어 추가 저장을 멈췄습니다. 이전 기록 복구를 실행할 수 있습니다.':'일부 기록을 읽거나 저장할 수 없습니다. 기존 원본은 지우지 않았습니다.')+'</p><button class="btn" data-act="recovery-copy">원본 복구 사본 보관</button>'+(status.restorePending?'<button class="btn" data-act="recover-restore">이전 기록 복구</button>':'');
    app.querySelector('.scr')?.prepend(banner);
  }
  function renderPreserving(){navigation.saveScroll();render();}
  function saveError(error){toast(error.code==='CONFLICT'?'다른 탭에서 같은 기록이 변경됐습니다. 입력 내용을 보관하고 다시 확인해 주세요.':error.code==='CORRUPT'?'저장된 기록을 읽지 못해 원본을 보호하고 있습니다.':'저장하지 못했습니다. 입력 내용은 그대로 두었습니다.');}
  function tabbar(active) {
    const t = (key, ti, label) =>
      `<button class="tab ${active === key ? 'on' : ''}" data-nav="${key}"><span class="ti">${ti}</span>${label}</button>`;
    return `<nav class="tabbar">
      ${t('home', '🏠', '홈')}
      ${t('pt', '🏋️', 'PT')}
      ${t('ht', '🏡', 'HT')}
      ${t('golf', '⛳', '골프')}
      ${t('favorites', '⭐', '즐겨찾기')}
      ${t('calendar', '🗓️', '캘린더')}
      <div class="history-controls" aria-label="화면 이동">
        <button type="button" id="history-back" data-history="back" aria-label="이전 화면" title="이전 화면" ${navigation.index <= 0 ? 'disabled' : ''}><span aria-hidden="true">‹</span><span>뒤로</span></button>
        <button type="button" id="history-forward" data-history="forward" aria-label="다음 화면" title="다음 화면" ${navigation.index >= navigation.max ? 'disabled' : ''}><span aria-hidden="true">›</span><span>앞으로</span></button>
      </div>
    </nav>`;
  }

  function exRow(e, idx, showCat, mark) {
    const star = e.favorite ? `<span class="star">★</span>` : `<span class="chev">›</span>`;
    const metas = [
      showCat ? `<span>${partIcon(e.part)} ${esc(e.category || '')}</span>` : '',
      (e.memo && e.memo.trim()) ? `<span>✏️ 메모</span>` : ''
    ].filter(Boolean).join('');
    return `<a class="ex ${esc(e.part)}" href="#exercise/${encodeURIComponent(e.id)}" data-open="${esc(e.id)}">
      <div class="num">${idx != null ? idx + 1 : (mark || (showCat ? '🔍' : '★'))}</div>
      <div class="body">
        <div class="t">${esc(e.name)}</div>
        <div class="spec">${esc(e.spec || '')}</div>
        ${metas ? `<div class="meta">${metas}</div>` : ''}
      </div>
      ${star}
    </a>`;
  }

  function deletionRequestsHtml() {
    const requests = Store.getDeletionRequests ? Store.getDeletionRequests() : [];
    if (!requests.length) return '';
    return `<section class="deletion-queue" aria-labelledby="deletion-queue-title">
      <h2 id="deletion-queue-title">삭제 요청 <span>${requests.length}건</span></h2>
      <p>현재 기기에서는 숨겨졌습니다. 삭제만을 위한 새 버전은 만들지 않으며, 삭제 건을 대화에서 알려주시면 지정한 대상을 반영합니다.</p>
      ${requests.map(request => {
        const localOnly = request.source === 'local' || (request.kind === 'exercise' && request.contentId.startsWith('usr_'));
        return `<article class="deletion-request"><div><strong>${request.kind === 'video' ? '영상' : '동작'} · ${esc(request.title)}</strong><small>ID ${esc(request.contentId)}</small></div>
          <div class="deletion-request-actions">${localOnly ? '<span class="tag">이 기기만</span>' : `<a class="btn" href="${esc(DeletionFlow.issueUrl(request))}" target="_blank" rel="noopener noreferrer">배포 요청 보내기 ↗</a>`}
          <button type="button" class="btn ghost" data-delete-restore="${esc(request.id)}">복원</button></div></article>`;
      }).join('')}
    </section>`;
  }

  function confirmDeletion(item, onConfirm) {
    const localOnly = item.source === 'local' || (item.kind === 'exercise' && item.contentId.startsWith('usr_'));
    const next = localOnly
      ? '이 기기에서 숨깁니다. 개인 추가 동작은 배포 원본에 없으므로 중앙 요청은 만들지 않습니다.'
      : '이 기기에서 먼저 숨기고 GitHub 삭제 요청 화면을 엽니다. 삭제만을 위한 새 버전은 만들지 않으며, 삭제 건을 대화에서 알려주시면 지정한 대상을 원본에 반영합니다.';
    askConfirm(`「${item.title}」을 삭제 요청할까요? ${next}`, onConfirm, localOnly ? '이 기기에서 숨기기' : '숨기고 요청');
  }

  function openDeletionIssue(request) {
    if (request.source === 'local' || (request.kind === 'exercise' && request.contentId.startsWith('usr_'))) return false;
    const result = DeletionFlow.openIssue(request);
    toast(result.attempted ? 'GitHub 화면에서 Submit new issue를 눌러 요청을 등록해 주세요' : '홈의 삭제 요청에서 배포 요청을 열어 주세요');
    return result.attempted;
  }

  function requestExerciseDeletion(id) {
    const exercise = Store.getById(id);
    if (!exercise) return;
    const item = { kind: 'exercise', contentId: exercise.id, title: exercise.name, source: Store.isSeed(exercise.id) ? 'seed' : 'local' };
    confirmDeletion(item, () => {
      const request = Store.requestDeletion(item);
      openDeletionIssue(request);
      toast(item.source === 'local' ? '이 기기에서 숨겼습니다' : '숨김 처리 · 삭제 요청 등록을 완료해 주세요');
      if (view.name === 'detail' && view.id === id) go(exercise.part);
      else renderPreserving();
    });
  }

  const DOW = ['일', '월', '화', '수', '목', '금', '토'];
  function dateChipLabel(d) {
    const [y, m, dd] = d.split('-').map(Number);
    const w = DOW[new Date(y, m - 1, dd).getDay()];
    return `${m}/${dd} (${w})`;
  }

  /* 최근 일주일 세션 — 변동이 없으면 빈 문자열을 반환해 섹션 자체를 숨긴다 */
  function recentSectionHtml() {
    const sessions = Store.getRecentSessions(7);
    if (!sessions.length) return '';

    const dates = sessions.map(s => s.date);
    if (!dates.includes(view.recentDate)) view.recentDate = dates[0];
    const sel = sessions.find(s => s.date === view.recentDate);

    const chips = sessions.map(s => {
      const on = s.date === view.recentDate ? ' on' : '';
      const today = s.date === Store.todayStr() ? '<span class="dot-today"></span>' : '';
      return `<button class="chip${on}" data-recent="${s.date}">${today}${dateChipLabel(s.date)}
        <span class="cnt-b">${s.exercises.length}</span></button>`;
    }).join('');

    return `
      <div class="sec-t">🗓️ 최근 자료 갱신</div>
      <div class="chips recent-chips">${chips}</div>
      <div id="recent-list">${sel.exercises.map(e => exRow(e, null, true, '🗓️')).join('')}</div>`;
  }

  function renderHome() {
    const parts = Store.getParts();
    const partCards = parts.map(p => {
      const list = Store.getByPart(p.id);
      const cats = Store.getCategories(p.id);
      return `<a class="part ${p.id}" href="#${p.id}" data-part-open="${p.id}">
        <div class="ico">${p.icon}</div>
        <div><div class="nm">${esc(p.label)}</div>
        <div class="cnt">${p.id === 'golf' ? '영상 · 레슨 · 노트' : `${cats.length}개 부위 · ${list.length}동작`}</div></div>
      </a>`;
    }).join('');

    const favs = Store.getFavorites();
    const favSection = favs.length ? `
      <div class="sec-t">⭐ 즐겨찾기</div>
      ${favs.map(e => exRow(e, null)).join('')}` : '';

    app.innerHTML = `
      <div class="scr">
        <div class="hd"><h1>PT노트</h1><div class="hd-meta"><span class="app-version" aria-label="앱 버전">ver${esc(window.PTGolfRelease?.displayVersion || '1.0')}</span><div class="date">${Store.todayStr().replace(/-/g, ' · ')}</div></div></div>
        <input class="search" data-act="search-focus" aria-label="전체 검색" placeholder="🔍 운동·영상·레슨·메모 검색…" readonly>
        <div class="parts">${partCards}</div>
        ${deletionRequestsHtml()}
        ${recentSectionHtml()}
        ${favSection}
        <div class="local-note">추가·수정·메모는 이 기기에 자동 저장됩니다.</div>
      </div>
      ${tabbar('home')}`;
  }

  function ptSessionItemHtml(item) {
    return '<article class="pt-session-item"><h3>'+esc(item.title)+'</h3><p class="g-meta">수업 '+esc(item.range)+'</p><ul>'+item.points.map(x=>'<li>'+esc(x)+'</li>').join('')+'</ul><p class="g-meta">'+esc(item.uncertainty)+'</p>'+(item.exerciseId?'<a class="btn ghost" href="#exercise/'+esc(item.exerciseId)+'">동작·이미지·3D 보기 ›</a>':'<span class="tag">동작 종류 확인 대기</span>')+'</article>';
  }
  function ptSessionHtml(id) {
    if(id)return (Store.getExerciseSessions?.(id)||[]).map(s=>'<section class="pt-session-note"><h2>'+esc(s.date)+' PT 수업 보강</h2>'+ptSessionItemHtml({...s.item,exerciseId:null}).replace('<span class="tag">동작 종류 확인 대기</span>','')+'<details><summary>수업 근거</summary><p>'+esc(s.source)+'</p><p>'+esc(s.evidence)+'</p></details></section>').join('');
    return (Store.getPTSessions?.()||[]).map(s=>'<details class="pt-session-note"><summary><strong>'+esc(s.date)+' PT 수업 · '+esc(s.title)+'</strong></summary>'+'<div class="pt-session-links">'+s.items.map(item=>'<a href="#exercise/'+esc(item.exerciseId)+'"><strong>'+esc(item.title)+'</strong><small>'+esc(item.points[0])+'</small></a>').join('')+'</div>'+'<details><summary>수업 근거</summary><p>'+esc(s.source)+'</p><p>'+esc(s.evidence)+'</p></details></details>').join('');
  }
  function renderPart(part) {
    if(part==='golf'){view={...view,name:'golf-hub',golfTab:'lessons',golfId:null};return renderGolf();}
    const list = Store.getByPart(part);
    const cats = Store.getCategories(part);
    const activeCat = view.cat && cats.includes(view.cat) ? view.cat : (cats[0] || null);
    view.cat = activeCat;

    const chips = cats.map(c =>
      `<button class="chip ${c === activeCat ? 'on' : ''}" data-cat="${esc(c)}">${esc(c).split(' · ').join('<br>')}</button>`).join('');

    const inCat = list.filter(e => e.category === activeCat);
    const rows = inCat.length
      ? `<div class="pt-exercise-grid">${inCat.map((e, i) => exRow(e, i)).join('')}</div>`
      : `<div class="empty">아직 표시할 동작이 없어요.<br>숨긴 동작은 홈의 삭제 요청에서 복원할 수 있어요.</div>`;

    app.innerHTML = `
      <div class="scr" data-part="${part}">
        <button class="back" data-nav="home">‹ 홈</button>
        <div class="hd"><h1>${partIcon(part)} ${esc(partLabel(part))}</h1>
          <button class="hd-search" data-act="search-focus" aria-label="동작 검색">🔍</button></div>
        ${part==='pt'?'<nav class="coach-tabs"><a href="#pt/now">지금 할 것</a><a href="#pt/standards">내 기준</a></nav><details class="coach-fold"><summary>PT 수업 기록</summary>'+ptSessionHtml()+'</details>':''}
        ${cats.length ? `<div class="chips">${chips}</div>` : ''}
        ${rows}
      </div>
      ${tabbar(part)}`;
  }

  function renderFavorites() {
    const favs = Store.getFavorites();
    const rows = favs.length
      ? favs.map(e => exRow(e, null)).join('')
      : `<div class="empty">즐겨찾기한 동작이 없어요.<br>동작 상세에서 ☆ 를 눌러 추가하세요.</div>`;
    app.innerHTML = `
      <div class="scr">
        <div class="hd"><h1>⭐ 즐겨찾기</h1>
          <button class="hd-search" data-act="search-focus" aria-label="동작 검색">🔍</button></div>
        ${rows}
      </div>
      ${tabbar('favorites')}`;
  }

  function renderCalendar() {
    const now = new Date();
    const year  = view.calYear  ?? now.getFullYear();
    const month = view.calMonth ?? now.getMonth();
    view.calYear = year; view.calMonth = month;

    const cal   = Store.getCalendar();
    const today = Store.todayStr();
    const p2    = n => String(n).padStart(2, '0');

    const firstDow = new Date(year, month, 1).getDay();   // 0=일
    const lastDate = new Date(year, month + 1, 0).getDate();

    let cells = '';
    for (let i = 0; i < firstDow; i++) cells += '<div class="cal-cell empty"></div>';
    for (let d = 1; d <= lastDate; d++) {
      const ds    = `${year}-${p2(month + 1)}-${p2(d)}`;
      const entry = cal[ds] || {};
      const dow   = new Date(year, month, d).getDay();
      const timeLabel = entry.scheduled && entry.schedTime
        ? `<span class="cal-time">${entry.schedTime}시</span>` : '';
      const dots = (entry.scheduled ? '<span class="dot sched"></span>' : '') +
                   (entry.completed ? '<span class="dot done"></span>'  : '') +
                   (entry.rest      ? '<span class="dot rest"></span>'  : '');
      cells += `<button type="button" aria-label="${ds}${entry.scheduled ? ' 예약' : ''}${entry.completed ? ' 실시' : ''}${entry.rest ? ' 휴무' : ''}" class="cal-cell${ds === today ? ' today' : ''}${dow === 0 ? ' sun' : ''}${dow === 6 ? ' sat' : ''}" data-cal-date="${ds}">
        <span class="cal-dn">${d}</span>
        ${timeLabel}
        <span class="cal-dots">${dots}</span>
      </button>`;
    }

    app.innerHTML = `
      <div class="scr">
        <div class="hd"><h1>🗓️ 캘린더</h1></div>
        <div class="cal-nav">
          <button class="cal-nav-btn" data-cal-nav="-1" aria-label="이전 달">‹</button>
          <span class="cal-month-lbl">${year}년 ${month + 1}월</span>
          <button class="cal-nav-btn" data-cal-nav="1" aria-label="다음 달">›</button>
        </div>
        <div class="cal-dow">
          <span class="sun">일</span><span>월</span><span>화</span>
          <span>수</span><span>목</span><span>금</span><span class="sat">토</span>
        </div>
        <div class="cal-grid">${cells}</div>
        <div class="cal-legend">
          <span><span class="dot sched"></span> 예약일</span>
          <span><span class="dot done"></span> 실시일</span>
          <span><span class="dot rest"></span> 휴무일</span>
        </div>
      </div>
      ${tabbar('calendar')}`;
  }

  function searchResultsHtml(q) {
    if(!(q||'').trim())return '<div class="empty">운동·영상·레슨·내 메모를 한 번에 검색하세요.<br>여러 단어는 모두 포함된 결과를 찾습니다.</div>';
    const all=AppSearch.records(q),res=all.filter(r=>!view.scope||view.scope==='all'||r.type===view.scope);
    return '<p class="sec-t" role="status">검색 결과 '+res.length+'개 · 전체 '+all.length+'개</p>'+res.map(r=>
      '<a class="search-result" href="'+esc(r.href)+'"><span class="tag">'+esc(AppSearch.labels[r.type]||r.type)+'</span><strong>'+esc(r.title)+'</strong><p>'+esc((r.excerpt||'').slice(0,180))+'</p><small>일치: '+esc((r.matchedFields||[]).join(' · '))+'</small></a>').join('')+(res.length?'':'<p class="empty">다른 검색어나 범위를 선택해 주세요.</p>');
  }
  function renderSearch() {
    const q=view.q||'';
    app.innerHTML='<div class="scr"><button class="back" data-nav="home">‹ 홈</button><h1>전체 검색</h1>'+
      '<input class="search" type="search" data-no-draft id="search-input" aria-label="검색어" placeholder="운동·영상·레슨·메모 검색" value="'+esc(q)+'" autocomplete="off">'+
      '<div class="chips" aria-label="검색 범위">'+Object.entries({all:'전체',...AppSearch.labels}).map(([key,label])=>'<button class="chip '+((view.scope||'all')===key?'on':'')+'" data-scope="'+key+'" aria-pressed="'+((view.scope||'all')===key)+'">'+label+'</button>').join('')+
      '</div><div id="search-results">'+searchResultsHtml(q)+'</div></div>'+tabbar(null);
    const inp=document.getElementById('search-input');
    inp.oninput=()=>{view.q=inp.value;navigation.sync(view);document.getElementById('search-results').innerHTML=searchResultsHtml(view.q);};
  }

  // 원문·개인 메모와 분리한 운동별 시각 안내.
  const expanded3D = new Set();
  function focusHtml(e) {
    return e.focus ? `<div class="focus-box ${e.part === 'golf' ? 'golf' : ''}">
      <div class="focus-muscle">🎯 ${esc(e.focus.muscle)}</div>
      <div class="focus-line"><span class="fk">움직임</span>${esc(e.focus.move)}</div>
      <div class="focus-line"><span class="fk">느낌</span>${esc(e.focus.feel)}</div>
    </div>` : '';
  }
  function gripGuideHtml(e) {
    const guide = e.gripGuide;
    if (!guide?.options?.length) return '';
    const options = guide.options.map(option => `
      <article class="grip-card ${option.id === guide.sessionId ? 'is-session' : ''}" data-grip-id="${esc(option.id)}">
        <div class="grip-card-head"><h3>${esc(option.label)}</h3><span class="grip-badge">${esc(option.badge)}</span></div>
        <dl class="grip-facts">
          <div><dt>폭</dt><dd>${esc(option.width)}</dd></div>
          <div><dt>손바닥</dt><dd>${esc(option.palm)}</dd></div>
          <div><dt>근육</dt><dd>${esc(option.muscles)}</dd></div>
        </dl>
        <p>${esc(option.detail)}</p>
        <p class="grip-caution">${esc(option.caution)}</p>
      </article>`).join('');
    const orientations = (guide.orientations || []).map(item => `
      <div class="grip-orientation-item">
        <strong>${esc(item.name)}</strong><span>${esc(item.position)}</span>
        <p>${esc(item.note)}</p>
      </div>`).join('');
    return `<section class="grip-guide" aria-label="${esc(guide.title)}">
      <div class="grip-guide-head"><span aria-hidden="true">✋</span><h2>${esc(guide.title)}</h2></div>
      <p class="grip-summary">${esc(guide.summary)}</p>
      <p class="grip-common">${esc(guide.common)}</p>
      <div class="grip-grid">${options}</div>
      ${orientations ? `<div class="grip-orientations" aria-label="손바닥 방향 참고">
        <h3>손바닥 방향 참고</h3><div class="grip-orientation-list">${orientations}</div>
        <p class="grip-orientation-note">${esc(guide.orientationNote)}</p>
      </div>` : ''}
      <p class="grip-evidence">${esc(guide.evidence)}</p>
    </section>`;
  }
  function pushdownMediaHtml() {
    const base = 'samples/pushdown-3d/';
    return `<section class="pushdown-guide" aria-label="케이블 푸시다운 2컷 안내">
      <div class="guide-pair">
        <figure class="guide-shot">
          <div class="guide-shot-title"><b>준비</b> 몸과 팔꿈치 고정</div>
          <img src="${base}combined-start.png?v=${ASSET_VER}" alt="팔꿈치를 몸 옆에 고정하고 손잡이를 잡은 준비 자세" decoding="async">
          <figcaption>상체를 살짝 숙이고<br>팔꿈치를 몸 옆에.<small>가슴·골반을 고정하고 케이블 장력을 받습니다.</small></figcaption>
        </figure>
        <figure class="guide-shot">
          <div class="guide-shot-title"><b>팔 펴기</b> 삼두의 조임</div>
          <img src="${base}combined-end.png?v=${ASSET_VER}" alt="팔꿈치는 같은 자리에 두고 팔을 아래로 편 자세, 삼두근을 붉게 표시" decoding="async">
          <figcaption>몸통은 그대로,<br>팔을 아래로 펴세요.<small>돌아올 때도 천천히 장력을 버팁니다.</small></figcaption>
        </figure>
      </div>
    </section>
    <details class="exercise-3d">
      <summary>입체로 자세 보기</summary>
      <div class="exercise-3d-content"></div>
    </details>`;
  }
  const selectedTrainingMedia = new Map();
  function currentExerciseMedia(id) {
    const entry=window.ExerciseMedia?.[id];
    return entry?.variants?.find(v=>v.id===selectedTrainingMedia.get(id)) || entry?.variants?.[0] || entry;
  }
  function exerciseVisualHtml(e) {
    const entry=window.ExerciseMedia[e.id],media=currentExerciseMedia(e.id);
    if(!entry.variants)return focusHtml({...e,focus:e.focus||media.focus})+exerciseMediaHtml(e);
    const selector=entry.variants ? `<div class="training-media-selector"><label for="training-movement">영상 속 동작 선택</label><select id="training-movement" data-no-draft>${entry.variants.map(v=>`<option value="${esc(v.id)}" ${v.id===media.id?'selected':''}>${esc(v.name)}</option>`).join('')}</select></div>` : '';
    return selector+`<div class="training-media-content">${focusHtml({...e,focus:e.focus||media.focus})+exerciseMediaHtml(e)}</div>`;
  }
  function bindExerciseMedia(id) {
    bindExercise3D(id);
    const selector=app.querySelector('#training-movement');
    if(selector)selector.addEventListener('change',()=>{
      selectedTrainingMedia.set(id,selector.value);
      const e=Store.getById(id),media=currentExerciseMedia(id);
      app.querySelector('.training-media-content').innerHTML=focusHtml({...e,focus:e.focus||media.focus})+exerciseMediaHtml(e);
      bindExercise3D(id);
    });
  }
  function exerciseMediaHtml(e) {
    if (e.id === 'pt_pushdown') return pushdownMediaHtml();
    const media = currentExerciseMedia(e.id);
    if (!media) return '';
    return `<section class="exercise-guide" aria-label="${esc(media.name)} 2컷 안내">
      <div class="guide-pair">${media.images.map((src, i) => `
        <figure class="guide-shot">
          <div class="guide-shot-title"><b>${i ? '동작' : '준비'}</b>${esc(media.captions[i])}</div>
          <img src="${esc(src)}?v=${ASSET_VER}" alt="${esc(media.name)} · ${esc(media.captions[i])}" decoding="async">
          <figcaption>${esc(media.notes[i])}</figcaption>
        </figure>`).join('')}</div>
    ${media.visualNote ? `<p class="g-meta">${esc(media.visualNote)}</p>` : ''}</section><details class="exercise-3d"><summary>입체로 자세 보기</summary><div class="exercise-3d-content"></div></details>`;
  }
  function bindExercise3D(id) {
    const media=currentExerciseMedia(id),key=id+':'+(media?.id||id);
    const details = app.querySelector('.exercise-3d');
    if (!details) return;
    const load = () => {
      if (!details.open) { expanded3D.delete(key); details.querySelector('.exercise-3d-content').replaceChildren(); return; }
      expanded3D.add(key);
      if (details.querySelector('iframe')) return;
      const frame = document.createElement('iframe');
      frame.className = 'exercise-3d-frame';
      frame.title = (media.name || Store.getById(id)?.name || '운동') + ' 회전형 3D 자세 안내';
      const source = media.viewer;
      const versionedSource = source + (source.includes('?') ? '&' : '?') + 'v=' + ASSET_VER;
      frame.src = versionedSource + '&autoplay=1';
      details.querySelector('.exercise-3d-content').append(frame);
    };
    details.addEventListener('toggle', load);
    if (expanded3D.has(key)) { details.open = true; load(); }
  }
  window.addEventListener('message', ev => {
    const frame = app.querySelector('.exercise-3d-frame');
    if (!frame || ev.origin !== location.origin || ev.source !== frame.contentWindow ||
        ev.data?.type !== 'ptgolf-viewer-height' || !Number.isFinite(ev.data.height)) return;
    frame.style.height = `${Math.max(320, Math.min(1400, Math.ceil(ev.data.height)))}px`;
  });
  function openExerciseLink(){const next=AppNavigation.fromHash(location.hash);go(next.name,{...next,__historyMode:'replace'});return true;}

  function trainingVideoHtml(e) {
    const videos=[e.sourceVideo,...e.supplementaryVideos||[]].filter(v=>v && /^[A-Za-z0-9_-]{11}$/.test(v.youtubeId));
    return videos.map((video,i)=>{
      const url='https://www.youtube.com/shorts/'+video.youtubeId;
      return '<section class="training-video" aria-label="'+(i?'보강 운동 영상':'원본 운동 영상')+'"><h2>▶ '+(i?'보강 영상':'원본 영상')+'</h2><h3>'+esc(video.title)+'</h3>'+
        '<p class="training-meta">'+esc(video.channel)+' · '+esc(video.durationSeconds)+'초 · 공개 '+esc(video.publishedAt)+'</p>'+
        '<div class="training-player"><button class="btn primary" data-act="training-play" data-video="'+video.youtubeId+'">영상 재생</button></div>'+
        '<a class="btn ghost" href="'+url+'" target="_blank" rel="noopener noreferrer">YouTube에서 보기 ↗</a>'+
        (video.points?.length?'<ul>'+video.points.map(p=>'<li>'+esc(p)+'</li>').join('')+'</ul>':'')+
        '<details class="training-evidence"><summary>출처와 확인 범위</summary><p>'+esc(video.evidence)+'</p><p>확인 '+esc(video.verifiedAt)+' · 앱 등록 '+esc(video.registeredAt.slice(0,10))+'</p></details></section>';
    }).join('');
  }
  function relatedTrainingHtml(e) {
    const related=Store.getRelatedExercises(e.id);
    if(!related.length)return '';
    const label=e.part==='ht'?'PT에서 함께 보기':'HT에서 함께 보기';
    return '<section class="training-related" aria-label="'+label+'"><h2>'+label+'</h2>'+related.map(({exercise,reason})=>
      '<div>'+exRow(exercise,null,true,exercise.part==='ht'?'🏡':'🏋️')+'<p class="training-reason">'+esc(reason)+'</p></div>').join('')+'</section>';
  }
  function renderDetail(id) {
    const e = Store.getById(id);
    if (!e) { go('home'); return; }
    const isGolf = e.part === 'golf';
    const mediaEntry = !isGolf ? window.ExerciseMedia?.[e.id] : null;
    const mediaPending = !!mediaEntry?.pending;
    const hasMedia = !!mediaEntry && !mediaPending;
    const c = checks[id] || (checks[id] = new Set());

    const cues = (e.cues || []).map((cue, i) => `
      <label class="check ${c.has(i) ? 'done' : ''}"><input type="checkbox" data-no-draft data-cue="${i}" ${c.has(i) ? 'checked' : ''}><span class="ctxt">${esc(cue)}</span></label>`).join('');

    const reminders = (e.reminders || []).filter(r => r.trim()).map(r =>
      `<div class="remind"><span class="b">•</span><div>${esc(r)}</div></div>`).join('');

    const pr = Store.getPrinciple(e.part, e.category);
    const prBlock = pr ? `
      <div class="block">
        <div class="block-h ${isGolf ? 'golf' : ''}">📌 ${esc(pr.title)}</div>
        <ul class="principle">${(pr.items || []).map(i => `<li>${esc(i)}</li>`).join('')}</ul>
        ${(pr.reminders && pr.reminders.length) ? pr.reminders.map(r =>
          `<div class="remind"><span class="b">•</span><div>${esc(r)}</div></div>`).join('') : ''}
      </div>` : '';

    const memo = (e.memo && e.memo.trim());
    app.innerHTML = `
      <div class="scr" data-part="${e.part}">
        <button class="back" data-back>‹ ${esc(e.category || partLabel(e.part))}</button>
        <h1 class="d-title">${esc(e.name)}</h1>${isGolf ? '<div class="personal-note-label"><strong>개인 연습 감각 · 확인 전</strong><p>혼자 연습하며 느낀 기록입니다. 정답으로 단정하지 않고 레슨 및 원본 영상과 비교해 확인하세요.</p></div>' : ''}
        <div class="d-tags">
          <button class="tag cat link ${isGolf ? 'golf' : ''}" data-catnav="${esc(e.part)}::${esc(e.category || '')}">${partIcon(e.part)} ${esc(partLabel(e.part))} · ${esc(e.category || '')} ›</button>
          ${e.updated ? `<span class="tag">갱신 ${esc(e.updated.slice(5).replace('-', '/'))}</span>` : ''}
          <div class="d-actions">
            <button class="icon-btn fav ${e.favorite ? 'on' : ''}" data-act="fav" title="즐겨찾기">${e.favorite ? '★' : '☆'}</button>
            <button class="icon-btn edit-text" data-act="edit" title="수정" aria-label="동작 수정">✏️ 수정</button>
          </div>
        </div>

        ${isGolf ? '<div class="g-actions"><a class="g-link" href="#golf/notes">스윙 노트 목록</a><button class="g-btn" data-g="jump-related">관련 레슨·영상 바로 보기 ↓</button></div>' : ''}

        ${e.part==='pt'?'<nav class="coach-shortcuts"><a href="#pt/standards?source=pt:'+encodeURIComponent(e.id)+'">이 동작으로 내 기준 만들기</a><button class="btn ghost" data-act="memo-top">메모 바로 쓰기</button></nav>':''}
        ${e.part==='pt'?ptSessionHtml(e.id):''}
        ${trainingVideoHtml(e)}
        ${hasMedia ? '' : focusHtml(e)}

        ${(e.steps && e.steps.length) ? `<div class="steps-flow ${isGolf ? 'golf' : ''}">
          ${e.steps.map(s => `<span class="step">${esc(s)}</span>`).join('<span class="sep">›</span>')}
        </div>` : ''}

        ${e.spec ? `<div class="spec-box ${isGolf ? 'golf' : ''}">
          <div><div class="k">핵심</div><div class="v">${esc(e.spec)}</div></div>
        </div>` : ''}

        ${(e.prep && e.prep.length) ? `<div class="prep-box ${isGolf ? 'golf' : ''}">
          <div class="prep-h">🧩 ${isGolf ? '준비할 때 느낀 점' : '준비 자세'}</div>
          ${e.prep.map(x => `<div class="prep-line"><span class="pb">·</span><div>${esc(x)}</div></div>`).join('')}
        </div>` : ''}

        ${gripGuideHtml(e)}

        ${mediaPending ? `<div class="prep-box media-pending" role="note">
          <div class="prep-h">📷 시각 자료 확인 예정</div>
          <div class="prep-line"><span class="pb">·</span><div>${esc(mediaEntry.pendingMessage)}</div></div>
        </div>` : ''}

        ${!isGolf && !hasMedia && e.image ? `<div class="ex-figure">
          <img src="${esc(e.image)}?v=${ASSET_VER}" alt="${esc(e.name)} 준비 자세와 동작 안내" loading="lazy" decoding="async">
        </div>` : ''}

        ${hasMedia ? exerciseVisualHtml(e) + '<div class="offline-tools"><button class="btn" data-offline>이 운동 오프라인 준비</button><p data-offline-status role="status">이미지와 3D를 기기에 보관할 수 있습니다.</p></div>' : ''}

        ${cues ? `<div class="block">
          <div class="block-h ${isGolf ? 'golf' : ''}">✅ ${isGolf ? '스윙 중 느낀 점' : '운동 중 핵심'}
            <span class="ctr">${c.size} / ${e.cues.length}</span></div>
          ${cues}
          ${c.size ? `<button class="reset-cues" data-act="reset-cues">체크 초기화</button>` : ''}
        </div>` : ''}

        ${reminders ? `<div class="block">
          <div class="block-h warn">🔥 ${isGolf ? '다음 연습에서 확인할 점' : '잊지 말 것'}</div>${reminders}</div>` : ''}

        ${prBlock}

        <div class="block">
          <div class="block-h ${isGolf ? 'golf' : ''}" style="display:flex">📝 내 메모
            <button class="memo-edit" data-act="memo-edit">편집</button></div>
          <button type="button" class="memo-box ${memo ? '' : 'ph'}" data-act="memo-edit">${memo ? esc(e.memo) : '운동하며 느낀 점을 적어두세요…'}</button>
        </div>

        ${isGolf ? (window.GolfHub?.related(id)||'') : relatedTrainingHtml(e)}

        <div class="block del-row">
          <button class="del-btn" data-act="delete">🗑 이 동작 삭제 요청</button>
        </div>
      </div>
      ${tabbar(e.part)}`;
    if(hasMedia){bindExerciseMedia(id);AppOffline.bind(app,id);}
  }

  // ============ 네비게이션 ============
  function go(name,opts={}) {
    const mode=opts.__historyMode||'push';opts={...opts};delete opts.__historyMode;
    const previous=view;view={...view,name,...opts};
    if(name==='ht')view={name:'part',part:name,cat:previous.part===name?previous.cat:null};
    if(name==='pt')view={name:'coach',part:'pt',coachTab:'now'};
    if(name==='golf')view={name:'coach',part:'golf',coachTab:'now'};
    if(name==='home'||name==='favorites'||name==='calendar'){view.part=null;view.id=null;}
    if(name==='detail')view.part=Store.getById(view.id)?.part||view.part;
    navigation.write(view,mode);render();
  }
  function updateHistoryButtons(){
    const back=document.getElementById('history-back'),forward=document.getElementById('history-forward');
    if(back)back.disabled=navigation.index<=0;if(forward)forward.disabled=navigation.index>=navigation.max;
  }
  function restoreHistory(event){
    ignoreHashChange=true;setTimeout(()=>{ignoreHashChange=false;},0);
    view=navigation.read(event.state);if(view.name==='detail')view.part=Store.getById(view.id)?.part;render();
  }

  // ============ 이벤트 (위임) ============
  document.body.addEventListener('click', (ev) => {
    try {
    if(ev.ctrlKey||ev.metaKey||ev.shiftKey||ev.altKey)return;
    const scopeButton=ev.target.closest('[data-scope]');
    if(scopeButton){view.scope=scopeButton.dataset.scope;navigation.sync(view);render();return;}
    const link=ev.target.closest('a[href^="#"]');
    if(link&&!link.hasAttribute('data-open')&&!link.hasAttribute('data-part-open')){
      ev.preventDefault();const next=AppNavigation.fromHash(link.getAttribute('href'));go(next.name,next);return;
    }
    const t = ev.target.closest('[data-nav],[data-open],[data-part-open],[data-cat],[data-act],[data-cue],[data-back],[data-cal-nav],[data-cal-date],[data-catnav],[data-recent],[data-history],[data-delete-restore],[data-delete-send]');
    if (!t) return;
    if(t.tagName==='A')ev.preventDefault();

    if (t.dataset.deleteRestore) {
      Store.restoreDeleted(t.dataset.deleteRestore);
      toast('항목을 다시 표시합니다. GitHub 요청을 등록했다면 해당 요청도 닫아 주세요.');
      renderPreserving(); return;
    }
    if (t.dataset.deleteSend) {
      const request = Store.getDeletionRequests().find(item => item.id === t.dataset.deleteSend);
      if (request) openDeletionIssue(request);
      return;
    }

    if (t.dataset.history === 'back') { history.back(); return; }
    if (t.dataset.history === 'forward') { history.forward(); return; }
    if (t.dataset.nav) { go(t.dataset.nav); return; }
    if(t.hasAttribute('data-back')){if(navigation.index>0)history.back();else go(view.part||'home');return;}
    if (t.dataset.partOpen) { go(t.dataset.partOpen); return; }
    if (t.dataset.open) { const ex = Store.getById(t.dataset.open); go('detail', { id: t.dataset.open, part: ex ? ex.part : null }); return; }
    if (t.dataset.recent) {
      view.recentDate = t.dataset.recent;
      const box = document.getElementById('recent-list');
      const ses = Store.getRecentSessions(7).find(x => x.date === view.recentDate);
      if (box && ses) box.innerHTML = ses.exercises.map(e => exRow(e, null, true, '🗓️')).join('');
      document.querySelectorAll('.recent-chips .chip').forEach(c =>
        c.classList.toggle('on', c.dataset.recent === view.recentDate));
      return;
    }
    if(t.dataset.cat){go('part',{part:view.part,cat:t.dataset.cat});return;}
    if (t.hasAttribute('data-cue')) { toggleCue(view.id, +t.dataset.cue); return; }
    if (t.dataset.calNav) {
      const now = new Date();
      let cy = view.calYear ?? now.getFullYear();
      let cm = (view.calMonth ?? now.getMonth()) + parseInt(t.dataset.calNav);
      if (cm < 0) { cm = 11; cy--; } else if (cm > 11) { cm = 0; cy++; }
      view.calYear = cy; view.calMonth = cm;
      go('calendar',{calYear:cy,calMonth:cm,__historyMode:'replace'});return;
    }
    if (t.dataset.calDate) { openCalModal(t.dataset.calDate); return; }
    if (t.dataset.catnav) {
      const [p, cat] = t.dataset.catnav.split('::');
      go(p==='golf'?'golf-hub':'part',p==='golf'?{part:p,golfTab:'notes',cat:cat||null}:{part:p,cat:cat||null});
      return;
    }

    const act = t.dataset.act;
    if (!act) return;
    handleAct(act,t);
    }catch(error){saveError(error);}
  });

  function toggleCue(id, i) {
    const c = checks[id] || (checks[id] = new Set());
    c.has(i) ? c.delete(i) : c.add(i);
    const checkbox=app.querySelector('[data-cue="'+i+'"]');checkbox?.closest('.check')?.classList.toggle('done',c.has(i));const counter=app.querySelector('.ctr');if(counter)counter.textContent=c.size+' / '+(Store.getById(id).cues||[]).length;
  }

  // ============ 캘린더 날짜 모달 ============
  const calModalEl = document.getElementById('cal-modal');
  let calModalDate  = null;
  let calModalState = { scheduled: false, completed: false, schedTime: '', rest: false };

  function openCalModal(dateStr) {
    calModalDate = dateStr;
    const entry = Store.getCalEntry(dateStr) || {};
    calModalState = {
      scheduled: !!entry.scheduled,
      completed: !!entry.completed,
      schedTime: entry.schedTime || '',
      rest:      !!entry.rest
    };
    const [y, m, d] = dateStr.split('-');
    document.getElementById('cal-modal-date').textContent =
      `${y}년 ${parseInt(m)}월 ${parseInt(d)}일`;
    document.getElementById('cal-time-sel').value = calModalState.schedTime;
    updateCalModalBtns();
    AppDialogs.show(calModalEl);
  }

  function updateCalModalBtns() {
    document.getElementById('cal-sched-btn').classList.toggle('sched-on', calModalState.scheduled);
    document.getElementById('cal-done-btn').classList.toggle('done-on',  calModalState.completed);
    document.getElementById('cal-rest-btn').classList.toggle('rest-on',  calModalState.rest);
    document.getElementById('cal-time-row').classList.toggle('hidden', !calModalState.scheduled);
  }

  function closeCalModal() {
    AppDialogs.hide(calModalEl);
    calModalDate = null;
  }

  function saveCalModal() {
    if (calModalDate) {
      const schedTime = calModalState.scheduled
        ? document.getElementById('cal-time-sel').value
        : '';
      Store.setCalEntry(calModalDate, { ...calModalState, schedTime });
    }
    closeCalModal();
    renderPreserving();
    toast('저장됨');
  }

  calModalEl.addEventListener('click', e => { if (e.target === calModalEl) closeCalModal(); });

  function handleAct(act,btn) {
    switch (act) {
      case 'search-focus': go('search',{q:'',scope:'all'});document.getElementById('search-input')?.focus();break;
      case 'reload': location.reload();break;
      case 'recovery-copy':{const blob=new Blob([JSON.stringify(Persistence.recoveryCopy(),null,2)],{type:'application/json'}),url=URL.createObjectURL(blob),link=document.createElement('a');link.href=url;link.download='ptgolf-recovery-'+Store.todayStr()+'.json';link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);break;}
      case 'recover-restore':askConfirm('중단된 복원 이전의 기록으로 되돌릴까요?',()=>{Persistence.recoverRestore();Store.reload();renderPreserving();toast('이전 기록을 복구했습니다.');},'복구');break;
      case 'training-play': {
        const exercise=Store.getById(view.id),video=[exercise?.sourceVideo,...exercise?.supplementaryVideos||[]].find(v=>v?.youtubeId===btn?.dataset.video),host=btn?.closest('.training-player');
        if(!host || !/^[A-Za-z0-9_-]{11}$/.test(video?.youtubeId||''))break;
        const frame=document.createElement('iframe');
        frame.title=video.title;frame.src='https://www.youtube-nocookie.com/embed/'+video.youtubeId+'?autoplay=1&playsinline=1';
        frame.allow='autoplay; encrypted-media; picture-in-picture; fullscreen';frame.allowFullscreen=true;
        frame.referrerPolicy='strict-origin-when-cross-origin';host.replaceChildren(frame);break;
      }
      case 'add': openEditor(null); break;
      case 'copy-edit': copyEditorChange(); break;
      case 'edit': openEditor(Store.getById(view.id)); break;
      case 'fav':
        Store.toggleFavorite(view.id);
        toast(Store.getById(view.id).favorite ? '⭐ 즐겨찾기 추가' : '즐겨찾기 해제');
        renderPreserving(); break;
      case 'reset-cues': checks[view.id] = new Set(); renderPreserving(); break;
      case 'memo-top': openMemoEditor();document.getElementById('memo-input')?.scrollIntoView({block:'center'});break;
      case 'memo-edit': openMemoEditor(); break;
      case 'delete':
        requestExerciseDeletion(view.id); break;
      case 'theme-toggle': Theme.toggle(); toast(Theme.get() === 'light' ? '☀️ 라이트 모드' : '🌙 다크 모드'); break;
      case 'cal-modal-close': closeCalModal(); break;
      case 'cal-modal-save':  saveCalModal(); break;
      case 'cal-toggle-sched': calModalState.scheduled = !calModalState.scheduled; updateCalModalBtns(); break;
      case 'cal-toggle-done':  calModalState.completed = !calModalState.completed; updateCalModalBtns(); break;
      case 'cal-toggle-rest':  calModalState.rest      = !calModalState.rest;      updateCalModalBtns(); break;
      case 'modal-close': closeModal(); break;
      case 'modal-save': saveEditor(); break;
      case 'confirm-yes': closeConfirm(true); break;
      case 'confirm-no': closeConfirm(false); break;
    }
  }

  // ============ 메모 인라인 편집 ============
  function openMemoEditor() {
    const e = Store.getById(view.id);
    const box = app.querySelector('.memo-box');
    const wrap = box.parentElement;
    const editBtn = wrap.querySelector('.memo-edit');
    if (editBtn) editBtn.style.display = 'none';
    box.outerHTML = `<textarea class="memo-input" id="memo-input">${esc(e.memo || '')}</textarea>
      <div class="modal-foot" style="padding:10px 0 0">
        <button class="btn ghost" id="memo-cancel">취소</button>
        <button class="btn primary" id="memo-save">메모 저장</button></div>`;
    const ta = document.getElementById('memo-input');
    AppDrafts.bind(wrap,location.hash);
    ta.focus();ta.setSelectionRange(ta.value.length,ta.value.length);
    document.getElementById('memo-save').onclick=()=>{try{Store.setMemo(view.id,ta.value.trim());AppDrafts.clear(ta);toast('메모 저장됨');renderPreserving();}catch(error){saveError(error);}};
    document.getElementById('memo-cancel').onclick=()=>{try{AppDrafts.clear(ta);renderPreserving();}catch(error){saveError(error);}};
  }

  // ============ 추가/수정 모달 ============
  let editingId = null, editingExtra = null;
  function openEditor(ex) {
    editingId = ex ? ex.id : null;
    document.getElementById('modal-title').textContent = ex ? '동작 수정' : '동작 추가';
    const part = ex ? ex.part : 'pt';
    setSeg('f-part', part);
    val('f-category', ex ? ex.category : (view.cat || ''));
    val('f-name', ex ? ex.name : '');
    val('f-spec', ex ? ex.spec : '');
    val('f-prep', ex ? (ex.prep || []).join('\n') : '');
    val('f-steps', ex ? (ex.steps || []).join('\n') : '');
    const focus=ex?.focus || window.ExerciseMedia?.[ex?.id]?.focus || {};
    for(const key of ['muscle','move','feel'])val('f-focus-'+key,focus[key]||'');
    editingExtra={prep:ex?.prep||[],steps:ex?.steps||[],focus:{muscle:focus.muscle||'',move:focus.move||'',feel:focus.feel||''}};
    document.querySelector('[data-act="copy-edit"]').hidden=!ex;
    val('f-cues', ex ? (ex.cues || []).join('\n') : '');
    val('f-reminders', ex ? (ex.reminders || []).join('\n') : '');
    refreshCatList(part);
    modal.dataset.draftKey='editor:'+(editingId||'new');
    AppDrafts.bind(modal,modal.dataset.draftKey,true);
    refreshCatList(getSeg('f-part'));
    AppDialogs.show(modal);
  }
  function refreshCatList(part) {
    const dl = document.getElementById('cat-list');
    dl.innerHTML = Store.getCategories(part).map(c => `<option value="${esc(c)}">`).join('');
  }
  async function copyEditorChange() {
    if(!editingId)return;
    const fields=[['파트',getSeg('f-part')],['카테고리',val('f-category')],['이름',val('f-name')],['핵심',val('f-spec')],['준비',val('f-prep')],['동작 순서',val('f-steps')],['부위',val('f-focus-muscle')],['움직임',val('f-focus-move')],['느낌',val('f-focus-feel')],['자세 체크',val('f-cues')],['잊지 말 것',val('f-reminders')]];
    const text='PT-GOLF 수정 요청\nID: '+editingId+'\n'+fields.map(([k,v])=>k+': '+v).join('\n');
    try{await navigator.clipboard.writeText(text);toast('수정 내용을 복사했습니다. 대화에 붙여 넣어 주세요.');}
    catch{toast('복사하지 못했습니다. 수정할 항목과 내용을 대화에 알려주세요.');}
  }
  function saveEditor() {
    const part = getSeg('f-part');
    const name = val('f-name').trim();
    if (!name) { toast('동작 이름을 입력하세요'); return; }
    const data = {
      id: editingId || undefined,
      part,
      category: val('f-category').trim() || '기타',
      name,
      spec: val('f-spec').trim(),
      prep: linesOf('f-prep'),
      steps: linesOf('f-steps'),
      focus: Object.fromEntries(['muscle','move','feel'].map(k=>[k,val('f-focus-'+k).trim()])),
      cues: linesOf('f-cues'),
      reminders: linesOf('f-reminders'),
    };
    if(editingId)for(const key of ['prep','steps','focus'])if(JSON.stringify(data[key])===JSON.stringify(editingExtra[key]))delete data[key];
    if (editingId) { const cur = Store.getById(editingId); data.memo = cur.memo; data.favorite = cur.favorite; }
    const saved=Store.upsert(data);
    AppDrafts.clear(modal);
    const wasEditing=!!editingId;
    closeModal();
    toast(wasEditing ? '수정됨' : '추가됨');
    go('detail', { id: saved.id, part: null });
  }
  function closeModal(){AppDialogs.hide(modal);editingId=null;AppUpdate.apply?.();}

  // 세그먼트 컨트롤 (PT/골프)
  document.getElementById('f-part').addEventListener('change',e=>refreshCatList(e.target.value));

  // ============ 확인 다이얼로그 ============
  function askConfirm(msg,cb,label='삭제') {
    confirmEl.querySelector('[data-act="confirm-yes"]').textContent=label;
    document.getElementById('confirm-msg').textContent = msg;
    confirmCb=cb;AppDialogs.show(confirmEl);
  }
  function closeConfirm(yes) {
    AppDialogs.hide(confirmEl);
    if (yes && confirmCb) confirmCb();
    confirmCb = null;
  }

  // 모달 바깥 클릭 닫기
  modal.addEventListener('click', e => { if (e.target === modal) closeModal(); });
  confirmEl.addEventListener('click', e => { if (e.target === confirmEl) closeConfirm(false); });

  // ---- helpers ----
  function val(id, v) { const el = document.getElementById(id); if (v !== undefined) el.value = v; return el.value; }
  function linesOf(id) { return val(id).split('\n').map(s => s.trim()).filter(Boolean); }
  function setSeg(id,v){document.getElementById(id).value=v;}
  function getSeg(id){return document.getElementById(id).value||'pt';}

  function golfConfig() { return { app, go, toast, exRow, tabbar, refresh: render, confirmDeletion, openDeletionIssue, issueUrl: DeletionFlow.issueUrl }; }
  try{window.GolfHub?.configure(golfConfig());}catch(error){console.warn('골프 초기화 실패',error);}
  Store.init().then(()=>{
    Theme.init();view=navigation.read();
    if(view.name==='detail')view.part=Store.getById(view.id)?.part;
    navigation.start(view);render();
    window.addEventListener('popstate',restoreHistory);
    window.addEventListener('hashchange',()=>{if(!ignoreHashChange)openExerciseLink();});
    Persistence.subscribe(event=>{if(!event.external&&!event.restored)return;if(AppDrafts.activePending()||AppDrafts.hasUnstored()||document.querySelector('.modal:not(.hidden)')){toast('다른 탭에서 기록이 바뀌었습니다. 작성 중인 내용을 먼저 확인해 주세요.');return;}Store.reload();renderPreserving();});
    AppUpdate.init(toast);
  }).catch(error=>{
    app.innerHTML='<div class="scr"><h1>자료를 불러오지 못했습니다</h1><p>기존 기록은 보존됩니다. 연결을 확인한 뒤 다시 시도해 주세요.</p><button class="btn" data-act="reload">다시 불러오기</button></div>';
    console.error('시작 실패',error);
  });
})();
