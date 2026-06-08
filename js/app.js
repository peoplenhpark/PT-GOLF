/* app.js — 라우팅 + 렌더 + CRUD UI (vanilla, 빌드 없음) */
(() => {
  const app = document.getElementById('app');
  const modal = document.getElementById('modal');
  const confirmEl = document.getElementById('confirm');
  const toastEl = document.getElementById('toast');

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
  }

  function tabbar(active) {
    const t = (key, ti, label) =>
      `<button class="tab ${active === key ? 'on' : ''}" data-nav="${key}"><span class="ti">${ti}</span>${label}</button>`;
    return `<nav class="tabbar">
      ${t('home', '🏠', '홈')}
      ${t('pt', '🏋️', 'PT')}
      ${t('golf', '⛳', '골프')}
      ${t('favorites', '⭐', '즐겨찾기')}
    </nav>
    <button class="fab" data-act="add" aria-label="동작 추가">+</button>`;
  }

  function exRow(e, idx) {
    const star = e.favorite ? `<span class="star">★</span>` : `<span class="chev">›</span>`;
    const memoMeta = (e.memo && e.memo.trim()) ? `<span>✏️ 메모</span>` : '';
    return `<div class="ex ${e.part}" data-open="${e.id}">
      <div class="num">${idx != null ? idx + 1 : '★'}</div>
      <div class="body">
        <div class="t">${esc(e.name)}</div>
        <div class="spec">${esc(e.spec || '')}</div>
        ${memoMeta ? `<div class="meta">${memoMeta}</div>` : ''}
      </div>
      ${star}
    </div>`;
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
        <div class="hd"><h1>헬스 노트</h1><div class="date">${Store.todayStr().replace(/-/g, ' · ')}</div></div>
        <input class="search" data-act="search-focus" placeholder="🔍 동작 검색…" readonly>
        <div class="parts">${partCards}</div>
        ${favSection}
        <div class="settings">
          <button data-act="export">⬇︎ 내보내기(백업)</button>
          <button data-act="import">⬆︎ 가져오기(복원)</button>
        </div>
        <div class="local-note">
          ${Store.hasLocalChanges()
            ? '이 기기에 내 편집 내용이 저장돼 있어요. 영구 보존하려면 내보내기 후 seed.json 에 반영하세요.'
            : '추가·수정·메모는 이 기기에 자동 저장됩니다.'}
        </div>
        <input type="file" id="import-file" accept="application/json" class="hidden">
      </div>
      ${tabbar('home')}`;
  }

  function renderPart(part) {
    const list = Store.getByPart(part);
    const cats = Store.getCategories(part);
    const activeCat = view.cat && cats.includes(view.cat) ? view.cat : (cats[0] || null);
    view.cat = activeCat;

    const chips = cats.map(c =>
      `<button class="chip ${c === activeCat ? 'on' : ''}" data-cat="${esc(c)}">${esc(c)}</button>`).join('');

    const inCat = list.filter(e => e.category === activeCat);
    const rows = inCat.length
      ? inCat.map((e, i) => exRow(e, i)).join('')
      : `<div class="empty">아직 동작이 없어요.<br>우측 하단 ➕ 로 추가하세요.</div>`;

    app.innerHTML = `
      <div class="scr" data-part="${part}">
        <button class="back" data-nav="home">‹ 홈</button>
        <div class="hd"><h1>${partIcon(part)} ${esc(partLabel(part))}</h1></div>
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
        <div class="hd"><h1>⭐ 즐겨찾기</h1></div>
        ${rows}
      </div>
      ${tabbar('favorites')}`;
  }

  function renderSearch() {
    const q = view.q || '';
    const res = Store.search(q);
    const rows = q
      ? (res.length ? res.map(e => exRow(e, null)).join('') : `<div class="empty">「${esc(q)}」 검색 결과가 없어요.</div>`)
      : `<div class="empty">동작 이름·큐·메모를 검색하세요.</div>`;
    app.innerHTML = `
      <div class="scr">
        <button class="back" data-nav="home">‹ 홈</button>
        <input class="search" id="search-input" placeholder="🔍 동작 검색…" value="${esc(q)}">
        ${rows}
      </div>
      ${tabbar(null)}`;
    const inp = document.getElementById('search-input');
    inp.focus();
    inp.oninput = () => { view.q = inp.value; const sc = app.querySelector('.scr').scrollTop;
      const res2 = Store.search(inp.value);
      const html = inp.value
        ? (res2.length ? res2.map(e => exRow(e, null)).join('') : `<div class="empty">「${esc(inp.value)}」 검색 결과가 없어요.</div>`)
        : `<div class="empty">동작 이름·큐·메모를 검색하세요.</div>`;
      // 입력 박스 다음 노드들만 교체
      [...app.querySelectorAll('.scr > .ex, .scr > .empty')].forEach(n => n.remove());
      inp.insertAdjacentHTML('afterend', html);
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
          <span class="tag cat ${isGolf ? 'golf' : ''}">${partIcon(e.part)} ${esc(partLabel(e.part))} · ${esc(e.category || '')}</span>
          ${e.updated ? `<span class="tag">갱신 ${esc(e.updated.slice(5).replace('-', '/'))}</span>` : ''}
          <div class="d-actions">
            <button class="icon-btn fav ${e.favorite ? 'on' : ''}" data-act="fav" title="즐겨찾기">${e.favorite ? '★' : '☆'}</button>
            <button class="icon-btn" data-act="edit" title="수정">✏️</button>
          </div>
        </div>

        ${e.spec ? `<div class="spec-box ${isGolf ? 'golf' : ''}">
          <div><div class="k">핵심</div><div class="v">${esc(e.spec)}</div></div>
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
    if (name === 'pt' || name === 'golf') { view = { name: 'part', part: name, cat: view.part === name ? view.cat : null }; }
    window.scrollTo(0, 0);
    render();
  }

  // ============ 이벤트 (위임) ============
  document.body.addEventListener('click', (ev) => {
    const t = ev.target.closest('[data-nav],[data-open],[data-part-open],[data-cat],[data-act],[data-cue],[data-back]');
    if (!t) return;

    if (t.dataset.nav) { go(t.dataset.nav); return; }
    if (t.hasAttribute('data-back')) { history.length > 1 ? go(view.part ? view.part : 'home') : go('home'); return; }
    if (t.dataset.partOpen) { go(t.dataset.partOpen); return; }
    if (t.dataset.open) { go('detail', { id: t.dataset.open, part: null }); return; }
    if (t.dataset.cat) { view.cat = t.dataset.cat; render(); return; }
    if (t.hasAttribute('data-cue')) { toggleCue(view.id, +t.dataset.cue); return; }

    const act = t.dataset.act;
    if (!act) return;
    handleAct(act);
  });

  function toggleCue(id, i) {
    const c = checks[id] || (checks[id] = new Set());
    c.has(i) ? c.delete(i) : c.add(i);
    renderDetail(id);
  }

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
      case 'export': doExport(); break;
      case 'import': document.getElementById('import-file').click(); break;
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

  // ============ export / import ============
  function doExport() {
    const data = Store.exportData();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `health-note-${Store.todayStr()}.json`;
    a.click(); URL.revokeObjectURL(url);
    toast('백업 파일을 내려받았어요');
  }
  document.body.addEventListener('change', (ev) => {
    if (ev.target.id !== 'import-file') return;
    const file = ev.target.files[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const data = JSON.parse(reader.result);
        askConfirm('가져온 파일로 현재 데이터를 덮어쓸까요? (이 기기 한정)', () => {
          Store.importData(data); toast('복원 완료'); go('home');
        });
      } catch (e) { toast('JSON 파일을 읽을 수 없어요'); }
      ev.target.value = '';
    };
    reader.readAsText(file);
  });

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
    render();
    if ('serviceWorker' in navigator && location.protocol.startsWith('http')) {
      navigator.serviceWorker.register('sw.js').catch(() => {});
    }
  });
})();
