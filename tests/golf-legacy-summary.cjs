'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.resolve(__dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8').replace(/^\uFEFF/, '');
const seed = JSON.parse(read('data/seed.json'));
const persistenceCode = read('js/persistence.js');
const storeCode = read('js/store.js') + '\nglobalThis.Store = Store;';
const overlayKey = 'ptgolf_overlay_v1';
const plain = value => JSON.parse(JSON.stringify(value));

function storageWith(overlay) {
  const map = new Map([[overlayKey, JSON.stringify(overlay)]]);
  return { map, api: {
    getItem: key => map.get(key) ?? null,
    setItem: (key, value) => map.set(key, String(value)),
    removeItem: key => map.delete(key)
  }};
}

async function load(overlay, source = seed) {
  const storage = storageWith(overlay);
  const context = {
    console, Date, Math, JSON, Set, Map, Error,
    localStorage: storage.api,
    fetch: async () => ({ ok: true, json: async () => plain(source) }),
    addEventListener: () => {}
  };
  context.window = context;
  vm.createContext(context);
  vm.runInContext(persistenceCode, context);
  vm.runInContext(storeCode, context);
  await context.Store.init();
  return { store: context.Store, storage };
}

(async () => {
  const official = seed.exercises.find(item => item.id === 'golf_driver');
  assert(official?.practicalSummary, 'seed practical summary is missing');
  const legacy = {
    overrides: {
      golf_driver: {
        id: 'golf_driver', name: '드라이버', part: 'golf', category: '드라이버',
        spec: '사용자가 보존한 옛 요약', memo: '개인 메모 유지', favorite: false,
        cues: ['예전 전체 객체'], reminders: [], steps: [],
        focus: { muscle: '옛 근육', move: '옛 동작', feel: '옛 느낌' }
      }
    },
    deleted: []
  };
  const { store, storage } = await load(legacy);
  let driver = store.getById('golf_driver');
  assert.equal(driver.spec, '사용자가 보존한 옛 요약');
  assert.equal(driver.memo, '개인 메모 유지');
  assert.equal(driver.favorite, false);
  assert.deepEqual(plain(driver.practicalSummary), official.practicalSummary);
  assert(store.search(official.practicalSummary.action).some(item => item.id === 'golf_driver'));

  store.setMemo('golf_driver', '수정한 개인 메모');
  driver = store.getById('golf_driver');
  assert.equal(driver.spec, '사용자가 보존한 옛 요약');
  assert.equal(driver.memo, '수정한 개인 메모');
  assert.equal(driver.favorite, false);
  assert.deepEqual(plain(driver.practicalSummary), official.practicalSummary);
  const saved = JSON.parse(storage.map.get(overlayKey));
  assert(saved.legacyIds.includes('golf_driver'));

  const invalidSeed = plain(seed);
  invalidSeed.exercises.find(item => item.id === 'golf_driver').practicalSummary.action = 7;
  await assert.rejects(() => load({ overrides: {}, deleted: [] }, invalidSeed), /형식이 올바르지/);
  const invalidOverlay = plain(legacy);
  invalidOverlay.overrides.golf_driver.practicalSummary = { action: 7, feel: '문자열' };
  const corrupt = await load(invalidOverlay);
  assert.equal(corrupt.store.getStatus().overlay.ok, false);
  assert.throws(() => corrupt.store.setMemo('golf_driver', '쓰면 안 됨'), error => error.code === 'CORRUPT');
  console.log('PASS: legacy golf override preserves personal fields while seed practical summaries advance and remain searchable.');
})().catch(error => { console.error(error); process.exitCode = 1; });
