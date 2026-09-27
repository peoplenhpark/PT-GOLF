'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.resolve(__dirname, '..');
const persistenceCode = fs.readFileSync(path.join(root, 'js/persistence.js'), 'utf8');
const storeCode = fs.readFileSync(path.join(root, 'js/store.js'), 'utf8') + '\nglobalThis.Store = Store;';
const K = { overlay: 'ptgolf_overlay_v1', calendar: 'ptgolf_calendar_v1', golf: 'ptgolf_learning_v1', drafts: 'ptgolf_drafts_v1', theme: 'ptgolf_theme' };
const JOURNAL = 'ptgolf_restore_journal_v1';
const SNAPSHOT = 'ptgolf_restore_snapshot_v1';
const plain = value => JSON.parse(JSON.stringify(value));
const emptyGolf = () => ({ lessons: [], questions: [], focus: [], videoNotes: {} });
function disk(initial = {}) {
  const map = new Map(Object.entries(initial)); let fail = () => false; let writes = 0;
  return { map, fail: fn => { fail = fn; }, writes: () => writes,
    localStorage: { getItem: key => map.get(key) ?? null,
      setItem(key, value) { writes++; if (fail(key, value)) throw new Error('QuotaExceededError'); map.set(key, String(value)); },
      removeItem(key) { writes++; if (fail(key, null)) throw new Error('QuotaExceededError'); map.delete(key); } } };
}
async function tab(storage = disk()) {
  let seed = { version: 1, parts: [{ id: 'pt', label: 'PT' }], principles: [], exercises: [
    { id: 'a', name: 'Original A', part: 'pt', cues: ['old cue'], favorite: false, memo: '' },
    { id: 'b', name: 'Original B', part: 'pt', cues: ['old cue'], favorite: false, memo: '' }] };
  const events = {};
  const context = { console, Date, Math, JSON, Set, Map, Error, localStorage: storage.localStorage,
    fetch: async () => ({ ok: true, json: async () => plain(seed) }),
    addEventListener: (type, callback) => { events[type] = callback; } };
  context.window = context; vm.createContext(context);
  vm.runInContext(persistenceCode, context); vm.runInContext(storeCode, context); await context.Store.init();
  return { p: context.Persistence, s: context.Store, storage, events,
    updateSeed: fn => { fn(seed); }, seed: () => plain(seed), context };
}
function code(expected) { return error => error.code === expected; }
function ownData(storage) { return Object.fromEntries(Object.values(K).map(key => [key, storage.map.get(key) ?? null])); }
let checks = 0;
async function test(name, fn) { await fn(); checks++; }
(async () => {
  await test('reading and rendering never write storage', async () => {
    const t = await tab(); t.s.getAll(); t.s.getCalendar(); t.s.getStatus(); assert.equal(t.storage.writes(), 0);
  });
  await test('new memo/favorite only persist user fields and follow new seed', async () => {
    const t = await tab(); t.s.setMemo('a', 'my note'); t.s.toggleFavorite('a');
    const saved = JSON.parse(t.storage.map.get(K.overlay));
    assert.equal(saved.schemaVersion, 2); assert.equal(saved.overrides.a.name, undefined); assert.equal(saved.overrides.a.cues, undefined);
    t.updateSeed(seed => { seed.exercises[0].name = 'New A'; seed.exercises[0].cues = ['new cue']; }); await t.s.init();
    assert.equal(t.s.getById('a').name, 'New A'); assert.deepEqual(plain(t.s.getById('a').cues), ['new cue']);
    assert.equal(t.s.getById('a').memo, 'my note'); assert.equal(t.s.getById('a').favorite, true);
  });
  await test('explicit edited field preserved while untouched seed fields advance', async () => {
    const t = await tab(); t.s.upsert({ id: 'a', name: 'Personal name', part: 'pt', cues: ['old cue'] });
    t.updateSeed(seed => { seed.exercises[0].name = 'New official name'; seed.exercises[0].cues = ['new official cue']; }); await t.s.init();
    assert.equal(t.s.getById('a').name, 'Personal name'); assert.deepEqual(plain(t.s.getById('a').cues), ['new official cue']);
  });
  await test('ambiguous legacy full objects are preserved and flagged', async () => {
    const legacy = { overrides: { a: { id: 'a', name: 'Old saved name', part: 'pt', cues: ['personal or old'], customField: 'keep' } }, deleted: [] };
    const d = disk({ [K.overlay]: JSON.stringify(legacy) }), t = await tab(d); assert.equal(d.writes(), 0);
    t.s.setMemo('a', 'new memo'); const saved = JSON.parse(d.map.get(K.overlay));
    assert.equal(saved.overrides.a.name, 'Old saved name'); assert.deepEqual(saved.overrides.a.cues, ['personal or old']);
    assert.equal(saved.overrides.a.customField, 'keep'); assert.deepEqual(plain(t.s.getStatus().legacyIds), ['a']);
    t.s.upsert({ id: 'a', name: 'Original A', part: 'pt' });
    const afterEditor = JSON.parse(d.map.get(K.overlay));
    assert.equal(afterEditor.overrides.a.name, 'Original A'); assert.equal(afterEditor.overrides.a.part, 'pt');
    assert.deepEqual(afterEditor.overrides.a.cues, ['personal or old']);
  });
  await test('quota errors leave memory and disk unchanged', async () => {
    const t = await tab(); t.s.setMemo('a', 'kept'); const before = ownData(t.storage);
    t.storage.fail(() => true);
    assert.throws(() => t.s.setMemo('a', 'unsaved'), code('WRITE_FAILED')); assert.equal(t.s.getById('a').memo, 'kept');
    assert.throws(() => t.s.setCalEntry('2026-09-27', { completed: true }), code('WRITE_FAILED'));
    assert.deepEqual(plain(t.s.getCalendar()), {}); assert.deepEqual(ownData(t.storage), before);
  });
  await test('corruption is not overwritten; recovery copy keeps exact raw bytes', async () => {
    const t = await tab(disk({ [K.overlay]: '{invalid old content', [K.calendar]: '{also invalid' }));
    assert.equal(t.s.getStatus().overlay.ok, false);
    assert.throws(() => t.s.setMemo('a', 'new'), code('CORRUPT'));
    assert.throws(() => t.s.setCalEntry('2026-09-27', { rest: true }), code('CORRUPT'));
    assert.equal(t.p.recoveryCopy().rawStores[K.overlay], '{invalid old content'); assert.equal(t.storage.writes(), 0);
  });
  await test('invalid nested fields and unsupported schemas are blocked', async () => {
    const t = await tab(disk({ [K.overlay]: JSON.stringify({ overrides: { a: { id: 'a', cues: 'not an array' } }, deleted: [] }) }));
    assert.throws(() => t.s.setMemo('a', 'new'), code('CORRUPT')); assert.equal(t.storage.writes(), 0);
    const u = await tab(disk({ [K.overlay]: JSON.stringify({ schemaVersion: 99, overrides: {}, deleted: [] }) }));
    assert.throws(() => u.s.setMemo('a', 'new'), code('CORRUPT'));
  });
  await test('independent tab edits merge and same-field edits conflict', async () => {
    const d = disk(), a = await tab(d), b = await tab(d);
    a.s.setMemo('a', 'memo A'); b.s.setMemo('b', 'memo B');
    assert.equal(b.s.getById('a').memo, 'memo A'); assert.equal(b.s.getById('b').memo, 'memo B');
    const c = await tab(d), e = await tab(d); c.s.setMemo('a', 'first');
    assert.throws(() => e.s.setMemo('a', 'second'), code('CONFLICT')); assert.equal(JSON.parse(d.map.get(K.overlay)).overrides.a.memo, 'first');
    assert.equal(e.s.getById('a').memo, 'memo A');
  });
  await test('separate calendar days merge, same date edits are protected', async () => {
    const d = disk(), a = await tab(d), b = await tab(d);
    a.s.setCalEntry('2026-09-27', { completed: true }); b.s.setCalEntry('2026-09-28', { rest: true });
    assert.equal(b.s.getCalendar()['2026-09-27'].completed, true); assert.equal(b.s.getCalendar()['2026-09-28'].rest, true);
  });
  await test('golf keyed lists and separate video notes merge', async () => {
    const d = disk(), a = await tab(d), b = await tab(d);
    const open = t => t.p.open(K.golf, { defaults: emptyGolf, validate: t.p.validators[K.golf] });
    const x = open(a), y = open(b);
    x.update(s => { s.questions.push({ id: 'q1', text: 'first' }); s.videoNotes.a = { memo: 'A' }; });
    y.update(s => { s.questions.push({ id: 'q2', text: 'second' }); s.videoNotes.b = { memo: 'B' }; });
    assert.equal(y.read().questions.length, 2); assert.equal(y.read().videoNotes.a.memo, 'A');
    const z = open(a); y.update(s => { s.videoNotes.a.memo = 'changed'; });
    assert.throws(() => z.update(s => { s.videoNotes.a.memo = 'conflicting'; }), code('CONFLICT'));
  });
  await test('external notifications do not silently replace an editing base', async () => {
    const t = await tab(), seen = []; t.p.subscribe(event => seen.push(event));
    t.storage.map.set(K.overlay, JSON.stringify({ overrides: { a: { id: 'a', memo: 'other tab' } }, deleted: [] }));
    t.events.storage({ key: K.overlay }); assert.equal(seen[0].external, true); assert.equal(t.s.getById('a').memo, '');
    t.s.reload(); assert.equal(t.s.getById('a').memo, 'other tab');
  });
  await test('complete backup covers every data store and validates before writes', async () => {
    const t = await tab(); t.s.setMemo('a', 'memo'); t.s.setCalEntry('2026-09-27', { rest: true });
    t.storage.map.set(K.golf, JSON.stringify({ ...emptyGolf(), videoNotes: { v: { memo: 'golf' } } }));
    t.storage.map.set(K.drafts, JSON.stringify({ screen: { value: 'unfinished', updated: '2026-09-27T00:00:00.000Z' } })); t.storage.map.set(K.theme, 'light');
    const backup = t.s.exportData(); assert.equal(backup.format, 'ptgolf-backup'); assert.equal(Object.keys(backup.stores).length, 5);
    assert.equal(backup.stores[K.golf].videoNotes.v.memo, 'golf'); assert.equal(backup.stores[K.drafts].screen.value, 'unfinished');
    const invalid = plain(backup); delete invalid.stores[K.golf]; const before = ownData(t.storage), count = t.storage.writes();
    assert.throws(() => t.s.importData(invalid), code('INVALID_BACKUP')); assert.deepEqual(ownData(t.storage), before); assert.equal(t.storage.writes(), count);
    const duplicate = plain(backup); duplicate.stores[K.golf].questions = [{ id: 'dup' }, { id: 'dup' }];
    assert.throws(() => t.p.restoreBackup(duplicate), code('INVALID_BACKUP'));
    const proto = JSON.parse(JSON.stringify(backup).replace('"screen":', '"__proto__":'));
    assert.throws(() => t.p.restoreBackup(proto), code('INVALID_BACKUP'));
  });
  await test('full restore succeeds and refreshes all open handles', async () => {
    const from = await tab(); from.s.setMemo('a', 'restored'); from.s.setCalEntry('2026-09-27', { completed: true });
    from.storage.map.set(K.golf, JSON.stringify({ ...emptyGolf(), videoNotes: { x: { memo: 'lesson note' } } }));
    from.storage.map.set(K.drafts, JSON.stringify({ editor: { value: 'draft', updated: '2026-09-27T00:00:00.000Z' } })); from.storage.map.set(K.theme, 'light');
    const to = await tab(); to.s.setMemo('a', 'previous'); to.s.importData(from.s.exportData());
    assert.equal(to.s.getById('a').memo, 'restored'); assert.equal(to.s.getCalEntry('2026-09-27').completed, true);
    assert.equal(JSON.parse(to.storage.map.get(K.golf)).videoNotes.x.memo, 'lesson note'); assert.equal(to.storage.map.get(K.theme), 'light');
    assert.equal(to.storage.map.has(JOURNAL), false); assert(to.storage.map.has(SNAPSHOT));
    assert.equal(JSON.parse(JSON.parse(to.storage.map.get(SNAPSHOT)).before[K.overlay]).overrides.a.memo, 'previous');
  });
  await test('restore failure rolls every data store back to exact prior bytes', async () => {
    const t = await tab(); t.s.setMemo('a', 'original'); const before = ownData(t.storage), backup = t.s.exportData();
    backup.stores[K.overlay].overrides.a.memo = 'replacement'; backup.stores[K.calendar] = { '2026-09-27': { rest: true } };
    let failed = false; t.storage.fail(key => { if (key === K.calendar && !failed) { failed = true; return true; } return false; });
    assert.throws(() => t.p.restoreBackup(backup), code('WRITE_FAILED')); assert.deepEqual(ownData(t.storage), before);
    assert.equal(t.s.getById('a').memo, 'original'); assert.equal(t.storage.map.has(JOURNAL), false);
  });
  await test('interrupted rollback retains journal and blocks writes until recovery', async () => {
    const t = await tab(); t.s.setMemo('a', 'original'); const before = ownData(t.storage), backup = t.s.exportData();
    backup.stores[K.overlay].overrides.a.memo = 'replacement'; t.storage.fail(key => key === K.calendar);
    assert.throws(() => t.p.restoreBackup(backup), code('RESTORE_PENDING')); assert(t.storage.map.has(JOURNAL));
    assert.throws(() => t.s.setMemo('b', 'blocked'), code('RESTORE_PENDING'));
    t.storage.fail(() => false); assert.equal(t.p.recoverRestore(), true); assert.deepEqual(ownData(t.storage), before);
    assert.equal(t.s.getById('a').memo, 'original'); assert.equal(t.p.getStatus().restorePending, false);
  });
  await test('seed failure never silently replaces known content with an empty list', async () => {
    const t = await tab(); t.context.fetch = async () => ({ ok: false }); await assert.rejects(t.s.init());
    assert.equal(t.s.getAll().length, 2); t.context.fetch = async () => ({ ok: true, json: async () => ({ exercises: [] }) });
    await assert.rejects(t.s.init()); assert.equal(t.s.getAll().length, 2);
  });
  console.log(`PASS: ${checks} storage reliability scenarios; fake localStorage only, no user data accessed.`);
})().catch(error => { console.error(error); process.exitCode = 1; });
