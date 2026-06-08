/*
 * store.js — 하이브리드 데이터 레이어
 *
 *  데이터 = seed.json (저장소에 커밋된 영구 콘텐츠)  +  localStorage overlay(내 편집)
 *
 *   - seed.json   : 기본 동작/원칙. git 으로 버전관리되는 "원본".
 *   - overlay     : 사용자가 앱에서 추가/수정/삭제/메모/즐겨찾기 한 내용. 브라우저(localStorage)에 저장.
 *   - getAll()    : 둘을 병합해서 반환.
 *   - exportJSON(): 병합 결과 전체를 내려받기 → seed.json 에 붙여넣어 "영구화" 가능.
 *   - importJSON(): 백업 파일을 overlay 로 복원.
 *
 *  체크리스트의 체크 상태는 운동 1회용이라 저장하지 않는다(앱 메모리에만, 새로고침 시 리셋).
 */
const Store = (() => {
  const LS_KEY = 'ptgolf_overlay_v1';
  const SEED_URL = 'data/seed.json?v=' + Date.now();

  let seed = { parts: [], principles: [], exercises: [] };
  let overlay = loadOverlay();          // { overrides:{id:exercise}, deleted:[id] }

  function loadOverlay() {
    try {
      const raw = localStorage.getItem(LS_KEY);
      if (raw) {
        const o = JSON.parse(raw);
        return { overrides: o.overrides || {}, deleted: o.deleted || [] };
      }
    } catch (e) { console.warn('overlay 로드 실패', e); }
    return { overrides: {}, deleted: [] };
  }

  function persist() {
    localStorage.setItem(LS_KEY, JSON.stringify(overlay));
  }

  async function init() {
    try {
      const res = await fetch(SEED_URL, { cache: 'no-store' });
      seed = await res.json();
    } catch (e) {
      console.error('seed.json 로드 실패 — 로컬 파일을 직접 열면 실패할 수 있습니다. 서버로 실행하세요.', e);
      seed = { parts: [], principles: [], exercises: [] };
    }
  }

  // ---- 읽기 ----
  function getParts() { return seed.parts || []; }

  function getPrinciple(part, category) {
    return (seed.principles || []).find(p =>
      p.part === part && (p.scope === '*' || p.scope === category)
    ) || null;
  }

  /** seed + overlay 병합된 전체 동작 목록 */
  function getAll() {
    const deleted = new Set(overlay.deleted);
    const result = [];
    const seenIds = new Set();

    (seed.exercises || []).forEach(ex => {
      if (deleted.has(ex.id)) return;
      seenIds.add(ex.id);
      result.push(overlay.overrides[ex.id] ? { ...ex, ...overlay.overrides[ex.id] } : ex);
    });
    // seed 에 없는 신규(로컬 추가) 동작
    Object.values(overlay.overrides).forEach(ex => {
      if (!seenIds.has(ex.id) && !deleted.has(ex.id)) result.push(ex);
    });
    return result;
  }

  function getByPart(part) { return getAll().filter(e => e.part === part); }
  function getById(id) { return getAll().find(e => e.id === id) || null; }
  function getFavorites() { return getAll().filter(e => e.favorite); }

  /** part 내 카테고리 목록(순서 보존) */
  function getCategories(part) {
    const seen = new Set(); const cats = [];
    getByPart(part).forEach(e => { if (!seen.has(e.category)) { seen.add(e.category); cats.push(e.category); } });
    return cats;
  }

  function search(q) {
    q = (q || '').trim().toLowerCase();
    if (!q) return [];
    return getAll().filter(e =>
      [e.name, e.spec, e.category, ...(e.cues || []), e.memo || '']
        .join(' ').toLowerCase().includes(q)
    );
  }

  // ---- 쓰기 (CRUD) ----
  function newId() { return 'usr_' + Math.random().toString(36).slice(2, 9); }

  /** 추가 또는 수정. id 없으면 생성 후 반환된 객체의 id 사용. */
  function upsert(ex) {
    if (!ex.id) ex.id = newId();
    ex.updated = todayStr();
    overlay.overrides[ex.id] = { ...getById(ex.id), ...ex };
    overlay.deleted = overlay.deleted.filter(d => d !== ex.id);
    persist();
    return overlay.overrides[ex.id];
  }

  /** 삭제. seed 항목이면 deleted 마스크, 로컬 항목이면 overlay 제거. */
  function remove(id) {
    delete overlay.overrides[id];
    const isSeed = (seed.exercises || []).some(e => e.id === id);
    if (isSeed && !overlay.deleted.includes(id)) overlay.deleted.push(id);
    persist();
  }

  function patch(id, fields) {
    const cur = getById(id);
    if (!cur) return null;
    return upsert({ ...cur, ...fields });
  }

  function setMemo(id, memo)      { return patch(id, { memo }); }
  function toggleFavorite(id) {
    const cur = getById(id);
    return cur ? patch(id, { favorite: !cur.favorite }) : null;
  }

  // ---- 백업 / 복원 ----
  /** 병합된 현재 상태 전체를 seed 스키마로 내보낸다. */
  function exportData() {
    return {
      version: seed.version || 1,
      updated: todayStr(),
      parts: seed.parts,
      principles: seed.principles,
      exercises: getAll()
    };
  }

  /** 파일에서 불러온 데이터를 overlay 로 전체 반영(seed 대비 덮어쓰기). */
  function importData(data) {
    const overrides = {};
    (data.exercises || []).forEach(ex => { if (ex.id) overrides[ex.id] = ex; });
    // seed 에 있는데 import 에 없는 항목은 삭제 처리
    const importedIds = new Set((data.exercises || []).map(e => e.id));
    const deleted = (seed.exercises || []).map(e => e.id).filter(id => !importedIds.has(id));
    overlay = { overrides, deleted };
    persist();
  }

  function resetOverlay() {
    overlay = { overrides: {}, deleted: [] };
    persist();
  }

  function hasLocalChanges() {
    return Object.keys(overlay.overrides).length > 0 || overlay.deleted.length > 0;
  }

  function todayStr() {
    // Date 사용(런타임 브라우저). 빌드 환경 제약과 무관.
    const d = new Date();
    const p = n => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
  }

  return {
    init, getParts, getPrinciple, getAll, getByPart, getById, getFavorites,
    getCategories, search, upsert, remove, patch, setMemo, toggleFavorite,
    exportData, importData, resetOverlay, hasLocalChanges, todayStr
  };
})();
