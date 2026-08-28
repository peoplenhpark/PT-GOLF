/* app.js — 라우팅 + 렌더 + CRUD UI (vanilla, 빌드 없음) */

/* ── 테마 관리 ── */
const Theme = (() => {
  const KEY = 'ptgolf_theme';
  const DARK_META  = '#0d0f14';
  const LIGHT_META = '#f5f7fa';

  function get() { return localStorage.getItem(KEY) || 'dark'; }

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
  const ASSET_VER = '43';

  // 화면 상태
  let view = { name: 'home', part: null, cat: null, id: null };
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
  function render() {
    if (view.name === 'home') return renderHome();
    if (view.name === 'part') return renderPart(view.part);
    if (view.name === 'detail') return renderDetail(view.id);
    if (view.name === 'favorites') return renderFavorites();
    if (view.name === 'search') return renderSearch();
    if (view.name === 'calendar') return renderCalendar();
  }

  function tabbar(active) {
    const t = (key, ti, label) =>
      `<button class="tab ${active === key ? 'on' : ''}" data-nav="${key}"><span class="ti">${ti}</span>${label}</button>`;
    return `<nav class="tabbar">
      ${t('home', '🏠', '홈')}
      ${t('pt', '🏋️', 'PT')}
      ${t('golf', '⛳', '골프')}
      ${t('favorites', '⭐', '즐겨찾기')}
      ${t('calendar', '🗓️', '캘린더')}
    </nav>
    <button class="fab" data-act="add" aria-label="동작 추가">+</button>`;
  }

  function exRow(e, idx, showCat, mark) {
    const star = e.favorite ? `<span class="star">★</span>` : `<span class="chev">›</span>`;
    const metas = [
      showCat ? `<span>${partIcon(e.part)} ${esc(e.category || '')}</span>` : '',
      (e.memo && e.memo.trim()) ? `<span>✏️ 메모</span>` : ''
    ].filter(Boolean).join('');
    return `<div class="ex ${e.part}" data-open="${e.id}">
      <div class="num">${idx != null ? idx + 1 : (mark || (showCat ? '🔍' : '★'))}</div>
      <div class="body">
        <div class="t">${esc(e.name)}</div>
        <div class="spec">${esc(e.spec || '')}</div>
        ${metas ? `<div class="meta">${metas}</div>` : ''}
      </div>
      ${star}
    </div>`;
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
      <div class="sec-t">🗓️ 최근 일주일 세션</div>
      <div class="chips recent-chips">${chips}</div>
      <div id="recent-list">${sel.exercises.map(e => exRow(e, null, true, '🗓️')).join('')}</div>`;
  }

  function renderHome() {
    const parts = Store.getParts();
    const partCards = parts.map(p => {
      const list = Store.getByPart(p.id);
      const cats = Store.getCategories(p.id);
      return `<div class="part ${p.id}" data-part-open="${p.id}">
        <div class="ico">${p.icon}</div>
        <div><div class="nm">${esc(p.label)}</div>
        <div class="cnt">${cats.length}개 부위 · ${list.length}동작</div></div>
      </div>`;
    }).join('');

    const favs = Store.getFavorites();
    const favSection = favs.length ? `
      <div class="sec-t">⭐ 즐겨찾기</div>
      ${favs.map(e => exRow(e, null)).join('')}` : '';

    app.innerHTML = `
      <div class="scr">
        <div class="hd"><h1>PT노트</h1><div class="date">${Store.todayStr().replace(/-/g, ' · ')}</div></div>
        <input class="search" data-act="search-focus" placeholder="🔍 동작 검색…" readonly>
        <div class="parts">${partCards}</div>
        ${recentSectionHtml()}
        ${favSection}
        <div class="local-note">추가·수정·메모는 이 기기에 자동 저장됩니다.</div>
      </div>
      ${tabbar('home')}`;
  }

  function renderPart(part) {
    const list = Store.getByPart(part);
    const cats = Store.getCategories(part);
    const activeCat = view.cat && cats.includes(view.cat) ? view.cat : (cats[0] || null);
    view.cat = activeCat;

    const chips = cats.map(c =>
      `<button class="chip ${c === activeCat ? 'on' : ''}" data-cat="${esc(c)}">${esc(c).split(' · ').join('<br>')}</button>`).join('');

    const inCat = list.filter(e => e.category === activeCat);
    const rows = inCat.length
      ? inCat.map((e, i) => exRow(e, i)).join('')
      : `<div class="empty">아직 동작이 없어요.<br>우측 하단 ➕ 로 추가하세요.</div>`;

    app.innerHTML = `
      <div class="scr" data-part="${part}">
        <button class="back" data-nav="home">‹ 홈</button>
        <div class="hd"><h1>${partIcon(part)} ${esc(partLabel(part))}</h1>
          <button class="hd-search" data-act="search-focus" aria-label="동작 검색">🔍</button></div>
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
      cells += `<div class="cal-cell${ds === today ? ' today' : ''}${dow === 0 ? ' sun' : ''}${dow === 6 ? ' sat' : ''}" data-cal-date="${ds}">
        <span class="cal-dn">${d}</span>
        ${timeLabel}
        <div class="cal-dots">${dots}</div>
      </div>`;
    }

    app.innerHTML = `
      <div class="scr">
        <div class="hd"><h1>🗓️ 캘린더</h1></div>
        <div class="cal-nav">
          <button class="cal-nav-btn" data-cal-nav="-1">‹</button>
          <span class="cal-month-lbl">${year}년 ${month + 1}월</span>
          <button class="cal-nav-btn" data-cal-nav="1">›</button>
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

  /** 검색 결과 영역 HTML — 입력이 없으면 안내, 있으면 결과 수 + 목록(카테고리 표시) */
  function searchResultsHtml(q) {
    if (!(q || '').trim()) {
      return `<div class="empty">동작 이름·체크리스트·잊지 말 것·메모까지 한 번에 검색해요.<br>
        예: <b>엉덩이</b> · <b>견갑</b> · <b>호흡</b> · <b>힙힌지</b><br>
        <span class="hint2">여러 단어를 띄어 쓰면 모두 포함된 동작만 나와요</span></div>`;
    }
    const res = Store.search(q);
    if (!res.length) return `<div class="empty">「${esc(q)}」 검색 결과가 없어요.<br>다른 단어로 찾아보세요.</div>`;
    return `<div class="sec-t">검색 결과 ${res.length}개</div>` +
      res.map(e => exRow(e, null, true)).join('');
  }

  function renderSearch() {
    const q = view.q || '';
    app.innerHTML = `
      <div class="scr">
        <button class="back" data-nav="home">‹ 홈</button>
        <input class="search" id="search-input" placeholder="🔍 동작 검색…" value="${esc(q)}"
               autocomplete="off" autocapitalize="off" spellcheck="false">
        <div id="search-results">${searchResultsHtml(q)}</div>
      </div>
      ${tabbar(null)}`;
    const inp = document.getElementById('search-input');
    inp.focus();
    inp.setSelectionRange(inp.value.length, inp.value.length);
    inp.oninput = () => {
      view.q = inp.value;
      document.getElementById('search-results').innerHTML = searchResultsHtml(inp.value);
    };
  }

  function renderDetail(id) {
    const e = Store.getById(id);
    if (!e) { go('home'); return; }
    const isGolf = e.part === 'golf';
    const c = checks[id] || (checks[id] = new Set());

    const cues = (e.cues || []).map((cue, i) => `
      <div class="check ${c.has(i) ? 'done' : ''}" data-cue="${i}">
        <div class="box"></div><div class="ctxt">${esc(cue)}</div>
      </div>`).join('');

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
        <div class="d-title">${esc(e.name)}</div>
        <div class="d-tags">
          <span class="tag cat link ${isGolf ? 'golf' : ''}" data-catnav="${esc(e.part)}::${esc(e.category || '')}" role="link" tabindex="0">${partIcon(e.part)} ${esc(partLabel(e.part))} · ${esc(e.category || '')} ›</span>
          ${e.updated ? `<span class="tag">갱신 ${esc(e.updated.slice(5).replace('-', '/'))}</span>` : ''}
          <div class="d-actions">
            <button class="icon-btn fav ${e.favorite ? 'on' : ''}" data-act="fav" title="즐겨찾기">${e.favorite ? '★' : '☆'}</button>
            <button class="icon-btn" data-act="edit" title="수정">✏️</button>
          </div>
        </div>

        ${e.focus ? `<div class="focus-box ${isGolf ? 'golf' : ''}">
          <div class="focus-muscle">🎯 ${esc(e.focus.muscle)}</div>
          <div class="focus-line"><span class="fk">움직임</span>${esc(e.focus.move)}</div>
          <div class="focus-line"><span class="fk">느낌</span>${esc(e.focus.feel)}</div>
        </div>` : ''}

        ${(e.steps && e.steps.length) ? `<div class="steps-flow ${isGolf ? 'golf' : ''}">
          ${e.steps.map(s => `<span class="step">${esc(s)}</span>`).join('<span class="sep">›</span>')}
        </div>` : ''}

        ${e.spec ? `<div class="spec-box ${isGolf ? 'golf' : ''}">
          <div><div class="k">핵심</div><div class="v">${esc(e.spec)}</div></div>
        </div>` : ''}

        ${e.image ? `<div class="ex-figure">
          <img src="${esc(e.image)}?v=${ASSET_VER}" alt="${esc(e.name)} 참고 그림" loading="lazy">
        </div>` : ''}

        ${cues ? `<div class="block">
          <div class="block-h ${isGolf ? 'golf' : ''}">✅ 자세 체크리스트
            <span class="ctr">${c.size} / ${e.cues.length}</span></div>
          ${cues}
          ${c.size ? `<button class="reset-cues" data-act="reset-cues">체크 초기화</button>` : ''}
        </div>` : ''}

        ${reminders ? `<div class="block">
          <div class="block-h warn">🔥 잊지 말 것</div>${reminders}</div>` : ''}

        ${prBlock}

        <div class="block">
          <div class="block-h ${isGolf ? 'golf' : ''}" style="display:flex">📝 내 메모
            <button class="memo-edit" data-act="memo-edit">편집</button></div>
          <div class="memo-box ${memo ? '' : 'ph'}" data-act="memo-edit">${memo ? esc(e.memo) : '운동하며 느낀 점을 적어두세요…'}</div>
        </div>

        <div class="block del-row">
          <button class="del-btn" data-act="delete">🗑 이 동작 삭제</button>
        </div>
      </div>
      ${tabbar(e.part)}`;
  }

  // ============ 네비게이션 ============
  function go(name, opts = {}) {
    view = { ...view, name, ...opts };
    if (name === 'home' || name === 'favorites') { view.part = null; view.id = null; }
    if (name === 'pt' || name === 'golf') { view = { name: 'part', part: name, cat: view.part === name ? view.cat : null, calYear: view.calYear, calMonth: view.calMonth }; }
    if (name === 'calendar') { view.part = null; view.id = null; }
    window.scrollTo(0, 0);
    render();
  }

  // ============ 이벤트 (위임) ============
  document.body.addEventListener('click', (ev) => {
    const t = ev.target.closest('[data-nav],[data-open],[data-part-open],[data-cat],[data-act],[data-cue],[data-back],[data-cal-nav],[data-cal-date],[data-catnav],[data-recent]');
    if (!t) return;

    if (t.dataset.nav) { go(t.dataset.nav); return; }
    if (t.hasAttribute('data-back')) { go(view.part || 'home'); return; }
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
    if (t.dataset.cat) { view.cat = t.dataset.cat; render(); return; }
    if (t.hasAttribute('data-cue')) { toggleCue(view.id, +t.dataset.cue); return; }
    if (t.dataset.calNav) {
      const now = new Date();
      let cy = view.calYear ?? now.getFullYear();
      let cm = (view.calMonth ?? now.getMonth()) + parseInt(t.dataset.calNav);
      if (cm < 0) { cm = 11; cy--; } else if (cm > 11) { cm = 0; cy++; }
      view.calYear = cy; view.calMonth = cm;
      renderCalendar(); return;
    }
    if (t.dataset.calDate) { openCalModal(t.dataset.calDate); return; }
    if (t.dataset.catnav) {
      const [p, cat] = t.dataset.catnav.split('::');
      view = { name: 'part', part: p, cat: cat || null };
      window.scrollTo(0, 0);
      render();
      return;
    }

    const act = t.dataset.act;
    if (!act) return;
    handleAct(act);
  });

  function toggleCue(id, i) {
    const c = checks[id] || (checks[id] = new Set());
    c.has(i) ? c.delete(i) : c.add(i);
    renderDetail(id);
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
    calModalEl.classList.remove('hidden');
  }

  function updateCalModalBtns() {
    document.getElementById('cal-sched-btn').classList.toggle('sched-on', calModalState.scheduled);
    document.getElementById('cal-done-btn').classList.toggle('done-on',  calModalState.completed);
    document.getElementById('cal-rest-btn').classList.toggle('rest-on',  calModalState.rest);
    document.getElementById('cal-time-row').classList.toggle('hidden', !calModalState.scheduled);
  }

  function closeCalModal() {
    calModalEl.classList.add('hidden');
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
    renderCalendar();
    toast('저장됨');
  }

  calModalEl.addEventListener('click', e => { if (e.target === calModalEl) closeCalModal(); });

  function handleAct(act) {
    switch (act) {
      case 'search-focus': go('search', { q: '' }); break;
      case 'add': openEditor(null); break;
      case 'edit': openEditor(Store.getById(view.id)); break;
      case 'fav':
        Store.toggleFavorite(view.id);
        toast(Store.getById(view.id).favorite ? '⭐ 즐겨찾기 추가' : '즐겨찾기 해제');
        renderDetail(view.id); break;
      case 'reset-cues': checks[view.id] = new Set(); renderDetail(view.id); break;
      case 'memo-edit': openMemoEditor(); break;
      case 'delete':
        askConfirm(`「${Store.getById(view.id).name}」 동작을 삭제할까요?`, () => {
          const part = Store.getById(view.id).part;
          Store.remove(view.id); toast('삭제됨'); go(part);
        }); break;
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
    ta.focus(); ta.setSelectionRange(ta.value.length, ta.value.length);
    document.getElementById('memo-save').onclick = () => { Store.setMemo(view.id, ta.value.trim()); toast('메모 저장됨'); renderDetail(view.id); };
    document.getElementById('memo-cancel').onclick = () => renderDetail(view.id);
  }

  // ============ 추가/수정 모달 ============
  let editingId = null;
  function openEditor(ex) {
    editingId = ex ? ex.id : null;
    document.getElementById('modal-title').textContent = ex ? '동작 수정' : '동작 추가';
    const part = ex ? ex.part : (view.part || 'pt');
    setSeg('f-part', part);
    val('f-category', ex ? ex.category : (view.cat || ''));
    val('f-name', ex ? ex.name : '');
    val('f-spec', ex ? ex.spec : '');
    val('f-cues', ex ? (ex.cues || []).join('\n') : '');
    val('f-reminders', ex ? (ex.reminders || []).join('\n') : '');
    refreshCatList(part);
    modal.classList.remove('hidden');
  }
  function refreshCatList(part) {
    const dl = document.getElementById('cat-list');
    dl.innerHTML = Store.getCategories(part).map(c => `<option value="${esc(c)}">`).join('');
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
      cues: linesOf('f-cues'),
      reminders: linesOf('f-reminders'),
    };
    if (editingId) { const cur = Store.getById(editingId); data.memo = cur.memo; data.favorite = cur.favorite; }
    const saved = Store.upsert(data);
    closeModal();
    toast(editingId ? '수정됨' : '추가됨');
    go('detail', { id: saved.id, part: null });
  }
  function closeModal() { modal.classList.add('hidden'); editingId = null; }

  // 세그먼트 컨트롤 (PT/골프)
  document.getElementById('f-part').addEventListener('click', (e) => {
    const b = e.target.closest('button'); if (!b) return;
    setSeg('f-part', b.dataset.val); refreshCatList(b.dataset.val);
  });

  // ============ 확인 다이얼로그 ============
  function askConfirm(msg, cb) {
    document.getElementById('confirm-msg').textContent = msg;
    confirmCb = cb; confirmEl.classList.remove('hidden');
  }
  function closeConfirm(yes) {
    confirmEl.classList.add('hidden');
    if (yes && confirmCb) confirmCb();
    confirmCb = null;
  }

  // 모달 바깥 클릭 닫기
  modal.addEventListener('click', e => { if (e.target === modal) closeModal(); });
  confirmEl.addEventListener('click', e => { if (e.target === confirmEl) closeConfirm(false); });

  // ---- helpers ----
  function val(id, v) { const el = document.getElementById(id); if (v !== undefined) el.value = v; return el.value; }
  function linesOf(id) { return val(id).split('\n').map(s => s.trim()).filter(Boolean); }
  function setSeg(id, v) { [...document.getElementById(id).children].forEach(b => b.classList.toggle('on', b.dataset.val === v)); }
  function getSeg(id) { const on = document.getElementById(id).querySelector('.on'); return on ? on.dataset.val : 'pt'; }

  // ============ 부트 ============
  Store.init().then(() => {
    Theme.init();   // 버튼 아이콘 동기화 (인라인 스크립트가 html 속성은 설정했지만 버튼 아이콘은 여기서)
    render();
    if ('serviceWorker' in navigator && location.protocol.startsWith('http')) {
      // 이전에 이미 SW가 있던 경우에만, 새 SW가 제어권을 잡으면 1회 자동 새로고침 → 최신본 즉시 반영
      const hadController = !!navigator.serviceWorker.controller;
      let reloaded = false;
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        if (reloaded || !hadController) return;
        reloaded = true; location.reload();
      });
      // updateViaCache:'none' — 브라우저 HTTP 캐시를 무시하고 sw.js를 항상 새로 받아 갱신 감지
      navigator.serviceWorker.register('sw.js', { updateViaCache: 'none' })
        .then(reg => { reg.update(); })
        .catch(() => {});
    }
  });
})();
