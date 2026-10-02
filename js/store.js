/* Seed content is read-only. New local changes store only the fields the user edits.
   Ambiguous legacy full-object overlays remain intact and are flagged for review. */
const Store = (() => {
  const persistence = window.Persistence;
  if (!persistence) throw new Error('Persistence module is required');
  const LS_KEY = persistence.KEYS.overlay, CAL_KEY = persistence.KEYS.calendar, DELETE_KEY = persistence.KEYS.deletions;
  const SEED_URL = 'data/seed.json';
  const emptyOverlay = () => ({ schemaVersion: 2, overrides: {}, deleted: [], legacyIds: [] });
  const overlayHandle = persistence.open(LS_KEY, { defaults: emptyOverlay, validate: persistence.validators[LS_KEY] });
  const calendarHandle = persistence.open(CAL_KEY, { defaults: () => ({}), validate: persistence.validators[CAL_KEY] });
  const deletionHandle = persistence.open(DELETE_KEY, { defaults: () => ({ requests: [] }), validate: persistence.validators[DELETE_KEY] });
  let seed = { parts: [], principles: [], exercises: [] };
  const equal = persistence.equal;
  const record = value => !!value && typeof value === 'object' && !Array.isArray(value);
  const stringFields = (value, fields) => fields.every(field => typeof value[field] === 'string');
  function validGripGuide(guide) {
    if (guide === undefined) return true;
    return record(guide) &&
      stringFields(guide, ['title', 'summary', 'common', 'sessionId', 'orientationNote', 'evidence']) &&
      Array.isArray(guide.options) && guide.options.length > 0 &&
      guide.options.every(option => record(option) &&
        stringFields(option, ['id', 'label', 'badge', 'width', 'palm', 'muscles', 'detail', 'caution'])) &&
      new Set(guide.options.map(option => option.id)).size === guide.options.length &&
      guide.options.some(option => option.id === guide.sessionId) &&
      Array.isArray(guide.orientations) &&
      guide.orientations.every(item => record(item) && stringFields(item, ['name', 'position', 'note']));
  }
  function validPracticalSummary(summary) {
    return summary === undefined || (record(summary) && stringFields(summary, ['action', 'feel']));
  }
  function gripGuideText(ex) {
    const guide = ex.gripGuide;
    if (!guide) return [];
    return [guide.title, guide.summary, guide.common, guide.orientationNote, guide.evidence,
      ...(guide.options || []).flatMap(option => Object.values(option)),
      ...(guide.orientations || []).flatMap(item => Object.values(item))]
      .filter(value => typeof value === 'string');
  }

  function validateSeed(data) {
    if (!data || !Array.isArray(data.parts) || !Array.isArray(data.principles) || !Array.isArray(data.exercises)) return false;
    const ids = new Set();
    return data.exercises.every(ex => {
      if (!ex || typeof ex.id !== 'string' || !ex.id || ['__proto__', 'constructor', 'prototype'].includes(ex.id) || ids.has(ex.id) || typeof ex.name !== 'string' || typeof ex.part !== 'string') return false;
      ids.add(ex.id);
      return ['cues', 'reminders', 'steps', 'prep'].every(key => ex[key] === undefined || (Array.isArray(ex[key]) && ex[key].every(value => typeof value === 'string'))) &&
        validGripGuide(ex.gripGuide) && validPracticalSummary(ex.practicalSummary) && persistence.validTrainingContent(ex);
    });
  }
  async function init() {
    const response = await fetch(SEED_URL, { cache: 'no-cache' });
    if (response.ok === false) throw new Error('기본 운동 자료를 불러오지 못했습니다. 연결을 확인하고 다시 시도해 주세요.');
    const next = await response.json();
    if (!validateSeed(next)) throw new Error('기본 운동 자료의 형식이 올바르지 않습니다. 다시 불러오기를 시도해 주세요.');
    seed = next;
    completeRemovedDeletionRequests('exercise', seed.exercises.map(item => item.id));
  }
  function overlay() { return overlayHandle.read(); }
  function prepare(next) {
    if (next.schemaVersion !== 2) {
      // No comparison against today's seed can prove which old fields the user edited.
      next.legacyIds = Object.keys(next.overrides);
      next.schemaVersion = 2;
    }
    next.legacyIds ||= [];
    return next;
  }
  function getParts() { return seed.parts || []; }
  function getPrinciple(part, category) {
    const list = (seed.principles || []).filter(item => item.part === part);
    return list.find(item => item.scope === category) || list.find(item => item.scope === '*') || null;
  }
  function getAll() {
    const local = overlay(), deleted = new Set([...local.deleted, ...getAllDeletionRequests().filter(item => item.kind === 'exercise' && item.status !== 'cancelled').map(item => item.contentId)]), seen = new Set();
    const result = [];
    for (const ex of seed.exercises) {
      seen.add(ex.id);
      if (deleted.has(ex.id)) continue;
      const saved = local.overrides[ex.id];
      const merged = saved ? { ...ex, ...saved } : { ...ex };
      // Editorial summaries advance with the seed even when an old full-object override preserves personal fields.
      if (ex.practicalSummary) merged.practicalSummary = { ...ex.practicalSummary };
      if (saved && ex.image?.startsWith('docs/images/guides/') && (!saved.image || /^docs\/images\/[^/]+\.svg$/.test(saved.image))) merged.image = ex.image;
      result.push(merged);
    }
    for (const [id, ex] of Object.entries(local.overrides)) {
      if (!seen.has(id) && !deleted.has(id)) result.push({ ...ex, id });
    }
    return result;
  }
  function getByPart(part) { return getAll().filter(ex => ex.part === part); }
  function getById(id) { return getAll().find(ex => ex.id === id) || null; }
  function getRelatedExercises(id) {
    const all=getAll(),current=all.find(ex=>ex.id===id);
    if(!current || !['pt','ht'].includes(current.part))return [];
    const links=new Map();
    for(const link of current.relatedExercises||[])links.set(link.id,link.reason);
    for(const ex of all)for(const link of ex.relatedExercises||[])if(link.id===id && !links.has(ex.id))links.set(ex.id,link.reason);
    return [...links].flatMap(([otherId,reason])=>{
      const exercise=all.find(ex=>ex.id===otherId);
      return exercise && exercise.id!==id && ['pt','ht'].includes(exercise.part) && exercise.part!==current.part ? [{exercise,reason}] : [];
    });
  }
  function getFavorites() { return getAll().filter(ex => ex.favorite); }
  function getCategories(part) { return [...new Set(getByPart(part).map(ex => ex.category))]; }
  function search(query) {
    const terms = (query || '').trim().toLowerCase().split(/\s+/).filter(Boolean);
    if (!terms.length) return [];
    return getAll().filter(ex => {
      const focus = ex.focus || {};
      const text = [ex.name, ex.spec, ex.category, focus.muscle || '', focus.move || '', focus.feel || '',
        ...(ex.prep || []), ...(ex.cues || []), ...(ex.reminders || []), ...(ex.steps || []),
        ...gripGuideText(ex), ...Object.values(ex.practicalSummary || {}), ex.sourceVideo?.title || '', ex.sourceVideo?.channel || '', ex.memo || ''].join(' ').toLowerCase();
      return terms.every(term => text.includes(term));
    });
  }
  function newId() { return 'usr_' + (globalThis.crypto?.randomUUID?.() || Math.random().toString(36).slice(2)); }
  function upsert(ex) {
    const id = ex.id || newId();
    if (typeof id !== 'string' || ['__proto__', 'constructor', 'prototype'].includes(id)) throw new Error('운동 식별자를 확인해 주세요.');
    const original = seed.exercises.find(item => item.id === id);
    if (!original && !overlay().overrides[id]) ex = { ...ex, part: ex.part || 'pt' };
    overlayHandle.update(next => {
      prepare(next);
      const saved = { ...(next.overrides[id] || {}), id };
      const preserveLegacy = next.legacyIds.includes(id);
      for (const [field, value] of Object.entries(ex)) {
        if (field === 'id' || field === 'updated' || value === undefined) continue;
        if (original && !preserveLegacy && equal(value, original[field])) delete saved[field];
        else saved[field] = value;
      }
      saved.updated = todayStr();
      next.overrides[id] = saved;
      next.deleted = next.deleted.filter(item => item !== id);
    });
    return getById(id);
  }
  function isSeed(id) { return seed.exercises.some(item => item.id === id); }
  function getAllDeletionRequests() {
    return deletionHandle.read().requests.slice().sort((a, b) => b.requestedAt.localeCompare(a.requestedAt));
  }
  function getDeletionRequests(kind) {
    const options = kind && typeof kind === 'object' ? kind : {};
    const category = typeof kind === 'string' ? kind : options.kind;
    return getAllDeletionRequests().filter(item => (!category || item.kind === category) && (options.includeResolved || item.status === 'pending'));
  }
  function isDeleted(kind, id) {
    return (kind === 'exercise' && overlay().deleted.includes(id)) || getAllDeletionRequests().some(item => item.kind === kind && item.contentId === id && item.status !== 'cancelled');
  }
  function requestDeletion(item) {
    const data = typeof item === 'string' ? { kind: 'exercise', contentId: item } : { ...item };
    const kind = data.kind || 'exercise', contentId = data.contentId || data.id;
    if (!['exercise', 'video'].includes(kind) || typeof contentId !== 'string' || !contentId || ['__proto__', 'constructor', 'prototype'].includes(contentId)) throw new Error('삭제할 항목을 확인해 주세요.');
    const original = kind === 'exercise' ? seed.exercises.find(ex => ex.id === contentId) : null;
    const saved = kind === 'exercise' ? overlay().overrides[contentId] : null;
    if (kind === 'exercise' && !original && !saved) throw new Error('삭제할 운동을 찾을 수 없습니다.');
    // One stable record per content item prevents duplicate requests across tabs.
    const requestId = 'del_' + kind + '_' + contentId;
    const committed = deletionHandle.update(next => {
      let request = next.requests.find(entry => entry.kind === kind && entry.contentId === contentId);
      if (request?.status === 'pending') return;
      const fields = { id: request?.id || requestId, kind, contentId,
        title: String(data.title || saved?.name || original?.name || contentId),
        source: kind === 'video' || original ? 'seed' : 'local', requestedAt: new Date().toISOString(), status: 'pending' };
      if (request) { Object.assign(request, fields); delete request.resolvedAt; }
      else next.requests.push(fields);
    });
    const request = committed.requests.find(entry => entry.kind === kind && entry.contentId === contentId);
    if (!request || request.status !== 'pending') {
      const error = new Error('다른 화면에서 삭제 요청 상태가 변경됐습니다. 최신 상태를 확인해 주세요.'); error.code = 'CONFLICT'; throw error;
    }
    return request;
  }
  function markDeletionRequest(requestId, status) {
    if (!['pending', 'completed', 'cancelled'].includes(status)) throw new Error('삭제 요청 상태를 확인해 주세요.');
    if (!getAllDeletionRequests().some(item => item.id === requestId)) return null;
    const committed = deletionHandle.update(next => {
      const request = next.requests.find(item => item.id === requestId);
      request.status = status;
      if (status === 'pending') delete request.resolvedAt;
      else request.resolvedAt = new Date().toISOString();
    });
    return committed.requests.find(item => item.id === requestId) || null;
  }
  function completeRemovedDeletionRequests(kind, currentIds) {
    if (!['exercise', 'video'].includes(kind) || !Array.isArray(currentIds)) throw new Error('삭제 완료 확인 대상을 확인해 주세요.');
    const present = new Set(currentIds), missing = new Set(getDeletionRequests(kind)
      .filter(item => item.source === 'seed' && !present.has(item.contentId)).map(item => item.id));
    if (!missing.size) return 0;
    deletionHandle.update(next => {
      next.requests.forEach(item => {
        if (!missing.has(item.id) || item.status !== 'pending') return;
        item.status = 'completed'; item.resolvedAt = new Date().toISOString();
      });
    });
    return missing.size;
  }
  function restoreDeleted(id, kind = 'exercise') {
    const request = getAllDeletionRequests().find(item => item.id === id || (item.kind === kind && item.contentId === id));
    const contentId = request?.contentId || id, category = request?.kind || kind;
    const legacyMask = category === 'exercise' && overlay().deleted.includes(contentId);
    if (legacyMask && request) {
      // Rare legacy masks and new requests are restored as one rollback-protected bundle.
      const backup = persistence.exportBackup();
      backup.stores[LS_KEY].deleted = backup.stores[LS_KEY].deleted.filter(value => value !== contentId);
      const target = backup.stores[DELETE_KEY]?.requests.find(value => value.id === request.id);
      if (target) { target.status = 'cancelled'; target.resolvedAt = new Date().toISOString(); }
      persistence.restoreBackup(backup);
    } else if (legacyMask) {
      overlayHandle.update(next => { next.deleted = next.deleted.filter(value => value !== contentId); });
    } else if (request) markDeletionRequest(request.id, 'cancelled');
    else return false;
    return true;
  }
  function clearDeletionRequest(requestId) { return restoreDeleted(requestId); }
  // Deletion hides content locally and records a reversible request; content bytes stay intact.
  function remove(id) { return requestDeletion(id); }
  function patch(id, fields) { return getById(id) ? upsert({ ...fields, id }) : null; }
  function setMemo(id, memo) { return patch(id, { memo }); }
  function toggleFavorite(id) {
    const current = getById(id);
    return current ? patch(id, { favorite: !current.favorite }) : null;
  }
  function exportData() {
    // Legacy consumers retain their seed-shaped fields; the versioned bundle is complete.
    return { ...persistence.exportBackup(), version: seed.version || 1, updated: todayStr(),
      parts: seed.parts, principles: seed.principles, exercises: getAll() };
  }
  function importData(data) {
    if (data?.format === 'ptgolf-backup') return persistence.restoreBackup(data);
    if (!validateSeed(data)) throw new Error('운동 백업 파일의 형식이 올바르지 않습니다.');
    const overrides = {};
    data.exercises.forEach(ex => { overrides[ex.id] = ex; });
    const imported = new Set(data.exercises.map(ex => ex.id));
    const next = { schemaVersion: 2, overrides, deleted: seed.exercises.filter(ex => !imported.has(ex.id)).map(ex => ex.id), legacyIds: [...imported] };
    // A legacy import updates only the overlay, preserving every other store in the full snapshot.
    const backup = persistence.exportBackup(); backup.stores[LS_KEY] = next;
    return persistence.restoreBackup(backup);
  }
  function resetOverlay() { overlayHandle.commit(emptyOverlay()); }
  function hasLocalChanges() { const local = overlay(); return Object.keys(local.overrides).length > 0 || local.deleted.length > 0 || getAllDeletionRequests().length > 0; }
  function getCalendar() { return calendarHandle.read(); }
  function setCalEntry(dateStr, data) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) throw new Error('날짜 형식을 확인해 주세요.');
    calendarHandle.update(next => {
      if (data && (data.scheduled || data.completed || data.rest)) {
        next[dateStr] = { scheduled: !!data.scheduled, completed: !!data.completed, rest: !!data.rest, schedTime: data.schedTime || '' };
      } else delete next[dateStr];
    });
  }
  function getCalEntry(dateStr) { return getCalendar()[dateStr] || null; }
  function getRecentSessions(days = 7) {
    const today = todayStr(), from = new Date(today + 'T00:00:00');
    from.setDate(from.getDate() - (days - 1));
    const pad = number => String(number).padStart(2, '0');
    const fromStr = `${from.getFullYear()}-${pad(from.getMonth() + 1)}-${pad(from.getDate())}`, byDate = {};
    getAll().forEach(ex => { if (ex.updated && ex.updated >= fromStr && ex.updated <= today) (byDate[ex.updated] ||= []).push(ex); });
    return Object.keys(byDate).sort().reverse().map(date => ({ date, exercises: byDate[date] }));
  }
  function todayStr() {
    const date = new Date(), pad = number => String(number).padStart(2, '0');
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
  }
  function reload() { overlayHandle.reload(); calendarHandle.reload(); deletionHandle.reload(); }
  function getStatus() {
    const local = overlay();
    return { overlay: overlayHandle.status(), calendar: calendarHandle.status(), deletions: deletionHandle.status(),
      legacyIds: local.schemaVersion === 2 ? (local.legacyIds || []).slice() : Object.keys(local.overrides) };
  }
  return { init, getParts, getPrinciple, getAll, getByPart, getById, getFavorites, getRelatedExercises, getCategories, search,
    upsert, remove, patch, setMemo, toggleFavorite, exportData, importData, resetOverlay, hasLocalChanges,
    todayStr, getRecentSessions, getCalendar, setCalEntry, getCalEntry, reload, getStatus, isSeed,
    requestDeletion, restoreDeleted, getDeletionRequests, getAllDeletionRequests, isDeleted, markDeletionRequest, clearDeletionRequest,
    completeRemovedDeletionRequests };
})();
