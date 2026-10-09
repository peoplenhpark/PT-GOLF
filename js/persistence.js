/* Shared local persistence. Writes commit only after validation and durable storage.
   Existing keys stay readable; conflicts never silently replace another tab's edits. */
window.Persistence = (() => {
  'use strict';
  const KEYS = Object.freeze({
    overlay: 'ptgolf_overlay_v1', calendar: 'ptgolf_calendar_v1',
    golf: 'ptgolf_learning_v1', drafts: 'ptgolf_drafts_v1', theme: 'ptgolf_theme',
    deletions: 'ptgolf_deletion_requests_v1', coaching: 'ptgolf_coaching_v1'
  });
  const V2_KEYS = Object.values(KEYS).filter(key => key !== KEYS.coaching);
  const V90_KEYS = V2_KEYS.filter(key => key !== KEYS.deletions);
  const JOURNAL = 'ptgolf_restore_journal_v1';
  const SNAPSHOT = 'ptgolf_restore_snapshot_v1';
  const listeners = new Set();
  const handles = new Set();
  const record = value => value !== null && typeof value === 'object' && !Array.isArray(value);
  const clone = value => value === undefined ? undefined : JSON.parse(JSON.stringify(value));
  function failure(code, message, key) {
    const error = new Error(message); error.code = code; if (key) error.key = key; return error;
  }
  function safe(value) {
    if (value === null || ['string', 'boolean', 'number'].includes(typeof value)) return typeof value !== 'number' || Number.isFinite(value);
    if (Array.isArray(value)) return value.every(safe);
    return record(value) && Object.keys(value).every(key => !['__proto__', 'constructor', 'prototype'].includes(key) && safe(value[key]));
  }
  function equal(a, b) {
    if (a === b) return true;
    if (Array.isArray(a) && Array.isArray(b)) return a.length === b.length && a.every((item, i) => equal(item, b[i]));
    if (record(a) && record(b)) {
      const keys = Object.keys(a); return keys.length === Object.keys(b).length && keys.every(key => Object.hasOwn(b, key) && equal(a[key], b[key]));
    }
    return false;
  }
  function rawRead(key) {
    try { return localStorage.getItem(key); }
    catch { throw failure('READ_FAILED', '이 기기의 저장 공간을 읽을 수 없습니다.', key); }
  }
  function rawWrite(key, raw) {
    try { if (raw === null) localStorage.removeItem(key); else localStorage.setItem(key, raw); }
    catch { throw failure('WRITE_FAILED', '저장하지 못했습니다. 입력 내용을 유지한 채 저장 공간을 확인해 주세요.', key); }
  }
  function emit(detail) { listeners.forEach(fn => { try { fn(detail); } catch { /* A view listener must not break a successful save. */ } }); }
  function assertReady() {
    if (rawRead(JOURNAL) !== null) throw failure('RESTORE_PENDING', '완료되지 않은 복원이 있습니다. 이전 기록 복구를 먼저 실행해 주세요.');
  }
  const keyed = value => Array.isArray(value) && value.every(item => record(item) && typeof item.id === 'string') && new Set(value.map(item => item.id)).size === value.length;
  function merge(base, local, remote, path = '') {
    if (equal(local, base)) return clone(remote);
    if (equal(remote, base) || equal(local, remote)) return clone(local);
    if (record(local) && record(remote) && (record(base) || base === undefined)) {
      const result = {}, original = base || {};
      for (const key of new Set([...Object.keys(original), ...Object.keys(local), ...Object.keys(remote)])) {
        const value = merge(Object.hasOwn(original, key) ? original[key] : undefined, Object.hasOwn(local, key) ? local[key] : undefined, Object.hasOwn(remote, key) ? remote[key] : undefined, path + '/' + key);
        if (value !== undefined) result[key] = value;
      }
      return result;
    }
    if (path === '/deleted' && [base, local, remote].every(value => Array.isArray(value) && value.every(item => typeof item === 'string'))) {
      return [...new Set([...remote, ...local, ...base])].filter(id => merge(base.includes(id), local.includes(id), remote.includes(id), path + '/' + id));
    }
    if (keyed(local) && keyed(remote) && (keyed(base) || base === undefined)) {
      const original = new Map((base || []).map(item => [item.id, item]));
      const ours = new Map(local.map(item => [item.id, item]));
      const theirs = new Map(remote.map(item => [item.id, item]));
      const result = [];
      for (const id of new Set([...remote.map(item => item.id), ...local.map(item => item.id), ...original.keys()])) {
        const value = merge(original.get(id), ours.get(id), theirs.get(id), path + '/' + id);
        if (value !== undefined) result.push(value);
      }
      return result;
    }
    const error = failure('CONFLICT', '다른 화면에서 같은 기록을 수정했습니다. 입력 내용을 보관한 뒤 최신 기록을 확인해 주세요.');
    error.path = path; throw error;
  }
  function validateValue(value, validate, key) {
    if (!safe(value) || !validate(value)) throw failure('CORRUPT', '저장된 기록의 형식을 확인하지 못했습니다. 원본을 보존하고 덮어쓰기를 중지했습니다.', key);
    return value;
  }
  function open(key, { defaults = () => ({}), validate = record } = {}) {
    if (!Object.values(KEYS).includes(key) || key === KEYS.theme) throw failure('INVALID_KEY', '지원하지 않는 저장소입니다.', key);
    const registered = validators[key];
    const valid = value => validate(value) && (!registered || registered(value));
    let state = clone(defaults()), raw = null, error = null;
    function decode(text) {
      if (text === null) return validateValue(clone(defaults()), valid, key);
      let value; try { value = JSON.parse(text); } catch { throw failure('CORRUPT', '저장된 기록을 읽지 못했습니다. 원본을 보존하고 덮어쓰기를 중지했습니다.', key); }
      return validateValue(value, valid, key);
    }
    function reload() {
      try { const nextRaw = rawRead(key); raw = nextRaw; const next = decode(nextRaw); state = next; error = null; }
      catch (err) { error = err; }
      return clone(state);
    }
    function commit(next) {
      assertReady(); if (error) throw error;
      validateValue(next, valid, key);
      const latestRaw = rawRead(key), latest = decode(latestRaw);
      const merged = merge(state, next, latest);
      validateValue(merged, valid, key);
      const encoded = JSON.stringify(merged);
      // Optimistic checks catch stale reads and the common concurrent-tab collision.
      if (rawRead(key) !== latestRaw) throw failure('CONFLICT', '다른 화면이 기록을 저장 중입니다. 잠시 후 다시 저장해 주세요.', key);
      if (encoded !== latestRaw) rawWrite(key, encoded);
      if (rawRead(key) !== encoded) throw failure('CONFLICT', '다른 화면에서 기록이 바뀌었습니다. 저장 결과를 확인해 주세요.', key);
      state = clone(merged); raw = encoded; error = null;
      emit({ key, external: false }); return clone(state);
    }
    const handle = {
      read: () => clone(state), reload, commit,
      update(fn) { const next = clone(state); const result = fn(next); return commit(result === undefined ? next : result); },
      status: () => ({ ok: !error, error: error?.code || null, message: error?.message || '', hasData: raw !== null })
    };
    reload(); handles.add({ key, handle }); return handle;
  }
  const stringFields = (value, names) => names.every(name => value[name] === undefined || typeof value[name] === 'string');
  const stringLists = (value, names) => names.every(name => value[name] === undefined || (Array.isArray(value[name]) && value[name].every(item => typeof item === 'string')));
  const requiredStringFields = (value, names) => names.every(name => typeof value[name] === 'string');
  function validGripGuide(value) {
    return value === undefined || (record(value) &&
      requiredStringFields(value, ['title', 'summary', 'common', 'sessionId', 'orientationNote', 'evidence']) &&
      Array.isArray(value.options) && value.options.length > 0 &&
      value.options.every(option => record(option) &&
        requiredStringFields(option, ['id', 'label', 'badge', 'width', 'palm', 'muscles', 'detail', 'caution'])) &&
      new Set(value.options.map(option => option.id)).size === value.options.length &&
      value.options.some(option => option.id === value.sessionId) &&
      Array.isArray(value.orientations) &&
      value.orientations.every(item => record(item) && requiredStringFields(item, ['name', 'position', 'note'])));
  }
  function validPracticalSummary(value) {
    return value === undefined || (record(value) && requiredStringFields(value, ['action', 'feel']));
  }
  function validTrainingContent(value) {
    const video=value.sourceVideo,extra=value.supplementaryVideos,links=value.relatedExercises;
    const validVideo=v=>record(v) && requiredStringFields(v,['youtubeId','title','channel','publishedAt','registeredAt','verifiedAt','evidence']) &&
      /^[A-Za-z0-9_-]{11}$/.test(v.youtubeId) && Number.isFinite(v.durationSeconds) && v.durationSeconds>0 &&
      Number.isFinite(Date.parse(v.registeredAt)) && stringLists(v,['points']);
    const videos=[...(video?[video]:[]),...(Array.isArray(extra)?extra:[])];
    return (video===undefined || validVideo(video)) &&
      (extra===undefined || (Array.isArray(extra) && extra.every(validVideo))) &&
      new Set(videos.map(v=>v.youtubeId)).size===videos.length &&
      (links===undefined || (Array.isArray(links) && links.every(link=>record(link) && requiredStringFields(link,['id','reason']))));
  }
  function validExercise(value) {
    return record(value) && stringFields(value, ['id', 'name', 'part', 'category', 'spec', 'memo', 'updated', 'image']) &&
      stringLists(value, ['cues', 'reminders', 'steps', 'prep']) && (value.favorite === undefined || typeof value.favorite === 'boolean') &&
      (value.focus === undefined || (record(value.focus) && stringFields(value.focus, ['muscle', 'move', 'feel']))) &&
      validGripGuide(value.gripGuide) && validPracticalSummary(value.practicalSummary) && validTrainingContent(value);
  }
  function validOverlay(value) {
    return record(value) && record(value.overrides) && Array.isArray(value.deleted) && value.deleted.every(id => typeof id === 'string') &&
      Object.entries(value.overrides).every(([id, item]) => validExercise(item) && (!item.id || item.id === id)) &&
      (value.schemaVersion === undefined || value.schemaVersion === 2) &&
      (value.legacyIds === undefined || (Array.isArray(value.legacyIds) && value.legacyIds.every(id => typeof id === 'string')));
  }
  const validCalendar = value => record(value) && Object.entries(value).every(([date, item]) => /^\d{4}-\d{2}-\d{2}$/.test(date) && record(item) &&
    ['scheduled', 'completed', 'rest'].every(k => item[k] === undefined || typeof item[k] === 'boolean') && (item.schedTime === undefined || item.schedTime === '' || (typeof item.schedTime === 'string' && /^(?:[01]?\d|2[0-3])$/.test(item.schedTime))));
  const validPractice = value => value === undefined || (record(value) &&
    (value.sourceKind === undefined || ['lesson','sensation'].includes(value.sourceKind)) && (value.lessonId === undefined || (typeof value.lessonId==='string' && value.lessonId.length>0)) &&
    (value.selected === undefined || ['0930','1001','1003','1004'].includes(value.selected)) &&
    (value.club === undefined || ['7번 아이언','5번 아이언','P 아이언','드라이버'].includes(value.club)));
  const validPracticeRecords = value => value === undefined || (keyed(value) && value.every(item =>
    requiredStringFields(item,['id','date','created','club','method','cueId','cueDate','cueText','distance','feel','measure']) &&
    /^\d{4}-\d{2}-\d{2}$/.test(item.date) && Number.isFinite(Date.parse(item.created)) &&
    ['7번 아이언','5번 아이언','P 아이언','드라이버'].includes(item.club) && ['baseline','cue'].includes(item.method) &&
    (item.sourceKind==='lesson' ? typeof item.lessonId==='string' && item.lessonId.length>0 && item.cueId===item.lessonId : ['0930','1001','1003','1004'].includes(item.cueId)) &&
    (item.sourceKind===undefined || ['lesson','sensation'].includes(item.sourceKind)) &&
    [item.contact,item.direction].every(n=>Number.isInteger(n)&&n>=0&&n<=5) &&
    ['대체로 짧음','대체로 적정','대체로 김','편차가 큼','미확인'].includes(item.distance) &&
    ['평소보다 좋음','비슷함','평소보다 아쉬움'].includes(item.feel) &&
    ['타감으로 판단','페이스 자국으로 확인'].includes(item.measure) &&
    (item.comfort===undefined || ['미확인','편안함','비슷함','힘이 들어감'].includes(item.comfort))));
  const validGolf = value => record(value) && validPractice(value.practice) && validPracticeRecords(value.practiceRecords) && ['lessons', 'questions', 'focus'].every(key => keyed(value[key])) &&
    value.lessons.every(item => typeof item.date === 'string' && stringLists(item, ['noteIds', 'videoIds', 'topics'])) &&
    value.questions.every(item => stringFields(item, ['text', 'kind', 'sourceId', 'lessonId'])) &&
    value.focus.every(item => stringFields(item, ['text', 'noteId', 'kind', 'sourceId']) && (item.active === undefined || typeof item.active === 'boolean')) &&
    record(value.videoNotes) && Object.values(value.videoNotes).every(item => record(item) &&
      stringFields(item, ['memo', 'status', 'title', 'action', 'feel', 'check']) &&
      (item.favorite === undefined || typeof item.favorite === 'boolean'));
  const validDrafts = value => record(value) && Object.values(value).every(item => record(item) && ['string', 'boolean'].includes(typeof item.value) && typeof item.updated === 'string' && Number.isFinite(Date.parse(item.updated)));
  const validDeletions = value => record(value) && keyed(value.requests) && new Set(value.requests.map(item => item.kind + '/' + item.contentId)).size === value.requests.length && value.requests.every(item =>
    ['exercise', 'video'].includes(item.kind) && typeof item.contentId === 'string' && !!item.contentId &&
    typeof item.title === 'string' && typeof item.requestedAt === 'string' && Number.isFinite(Date.parse(item.requestedAt)) &&
    ['pending', 'completed', 'cancelled'].includes(item.status) && (item.source === undefined || ['seed', 'local'].includes(item.source)) &&
    stringFields(item, ['deviceId', 'resolvedAt']));
  const validCriterion = item => record(item) && requiredStringFields(item,['id','part','sourceKey','title','cue','check','setup','caution','club','referenceId','created','updated']) && ['pt','golf'].includes(item.part) && !!item.id && !!item.sourceKey && !!item.cue.trim() && !!item.check.trim() && typeof item.confirmed==='boolean' && Number.isFinite(Date.parse(item.created)) && Number.isFinite(Date.parse(item.updated));
  const validCoaching = value => record(value) && value.schemaVersion===1 && keyed(value.criteria) && value.criteria.every(validCriterion) && record(value.active) && Object.entries(value.active).every(([part,id])=>['pt','golf'].includes(part) && typeof id==='string' && value.criteria.some(c=>c.id===id&&c.part===part)) && keyed(value.records) && value.records.every(r=>record(r) && requiredStringFields(r,['id','part','criterionId','created','date','result','memo','question','answer']) && ['pt','golf'].includes(r.part) && value.criteria.some(c=>c.id===r.criterionId&&c.part===r.part) && ['도움 됨','판단 어려움','다시 확인'].includes(r.result) && /^\d{4}-\d{2}-\d{2}$/.test(r.date) && Number.isFinite(Date.parse(r.created)) && validCriterion(r.snapshot) && r.snapshot.id===r.criterionId && r.snapshot.part===r.part) && keyed(value.revisions) && value.revisions.every(r=>typeof r.at==='string' && Number.isFinite(Date.parse(r.at)) && validCriterion(r.snapshot));
  const validators = { [KEYS.coaching]: validCoaching, [KEYS.overlay]: validOverlay, [KEYS.calendar]: validCalendar, [KEYS.golf]: validGolf, [KEYS.drafts]: validDrafts, [KEYS.deletions]: validDeletions };
  function validateBackup(data) {
    if (!record(data) || data.format !== 'ptgolf-backup' || ![1, 2, 3].includes(data.schemaVersion) || !record(data.stores) || !safe(data.stores)) throw failure('INVALID_BACKUP', '지원하는 PT & GOLF 백업 파일이 아닙니다.');
    const expected = data.schemaVersion === 1 ? V90_KEYS : data.schemaVersion === 2 ? V2_KEYS : Object.values(KEYS);
    if (Object.keys(data.stores).length !== expected.length || !expected.every(key => Object.hasOwn(data.stores, key))) throw failure('INVALID_BACKUP', '일부 기록이 빠진 백업입니다. 모든 저장소가 포함되어야 합니다.');
    expected.forEach(key => {
      const value = data.stores[key];
      if (value === null) return;
      if (key === KEYS.theme) { if (!['dark', 'light'].includes(value)) throw failure('INVALID_BACKUP', '테마 기록 형식이 올바르지 않습니다.'); }
      else if (!validators[key](value)) throw failure('INVALID_BACKUP', '백업의 기록 형식이 올바르지 않습니다.', key);
    });
    return clone(data);
  }
  function exportBackup() {
    assertReady(); const stores = {};
    for (const key of Object.values(KEYS)) {
      const raw = rawRead(key);
      if (key === KEYS.theme || raw === null) stores[key] = raw;
      else { try { stores[key] = JSON.parse(raw); } catch { throw failure('CORRUPT', '손상된 기록이 있어 일반 백업 대신 원본 복구 사본이 필요합니다.', key); } }
    }
    return validateBackup({ format: 'ptgolf-backup', schemaVersion: 3, createdAt: new Date().toISOString(), stores });
  }
  function recoveryCopy() {
    const rawStores = {}; Object.values(KEYS).forEach(key => { rawStores[key] = rawRead(key); });
    return { format: 'ptgolf-recovery-copy', schemaVersion: 3, createdAt: new Date().toISOString(), rawStores };
  }
  function reloadHandles(keys) { handles.forEach(item => { if (keys.includes(item.key)) item.handle.reload(); }); }
  function applyRawStores(rawStores) {
    for (const key of Object.values(KEYS)) if (Object.hasOwn(rawStores, key)) rawWrite(key, rawStores[key]);
  }
  function recoverRestore() {
    const text = rawRead(JOURNAL); if (text === null) return false;
    let journal; try { journal = JSON.parse(text); } catch { throw failure('CORRUPT', '복구 사본을 읽을 수 없습니다. 원본 파일을 먼저 보관해 주세요.'); }
    if (!record(journal.before) || !V90_KEYS.every(key => Object.hasOwn(journal.before, key)) || !Object.keys(journal.before).every(key => Object.values(KEYS).includes(key) && (journal.before[key] === null || typeof journal.before[key] === 'string'))) throw failure('CORRUPT', '복구 사본 형식이 올바르지 않습니다.');
    applyRawStores(journal.before); rawWrite(JOURNAL, null);
    reloadHandles(Object.values(KEYS)); emit({ key: null, restored: true }); return true;
  }
  function restoreBackup(data) {
    const backup = validateBackup(data); assertReady();
    const before = recoveryCopy().rawStores, after = {};
    Object.values(KEYS).forEach(key => {
      // v90 backups predate deletion requests and must not erase the current queue.
      if (!Object.hasOwn(backup.stores, key)) { after[key] = before[key]; return; }
      const value = backup.stores[key]; after[key] = value === null || key === KEYS.theme ? value : JSON.stringify(value);
    });
    // The previous raw bytes remain recoverable even if a tab closes during restore.
    const journal = JSON.stringify({ schemaVersion: 2, createdAt: new Date().toISOString(), before });
    rawWrite(SNAPSHOT, journal); rawWrite(JOURNAL, journal);
    try { applyRawStores(after); rawWrite(JOURNAL, null); }
    catch (err) {
      try { recoverRestore(); } catch { throw failure('RESTORE_PENDING', '복원이 중단되었습니다. 이전 기록 사본을 보존했습니다. 저장 공간 확보 후 이전 기록 복구를 실행해 주세요.'); }
      throw err;
    }
    reloadHandles(Object.values(KEYS)); emit({ key: null, restored: true }); return true;
  }
  function getStatus() {
    let pending = false, available = true;
    try { pending = rawRead(JOURNAL) !== null; } catch { available = false; }
    return { available, restorePending: pending, stores: [...handles].map(({ key, handle }) => ({ key, ...handle.status() })) };
  }
  if (typeof window.addEventListener === 'function') window.addEventListener('storage', event => {
    if (Object.values(KEYS).includes(event.key) || event.key === JOURNAL || event.key === null) emit({ key: event.key, external: true });
  });
  return { KEYS, open, equal, validators, validTrainingContent, exportBackup, validateBackup, restoreBackup, recoverRestore, recoveryCopy, getStatus,
    subscribe(fn) { listeners.add(fn); return () => listeners.delete(fn); } };
})();
