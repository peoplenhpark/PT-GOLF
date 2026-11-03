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
  const official=seed.exercises.find(e=>e.id==='pt_legextension');
  const legacy={overrides:{pt_legextension:{...plain(official),spec:'개인 중량 기록',memo:'개인 메모',favorite:false,cues:['개인 교정 원문'],focus:{muscle:'개인 부위',move:'개인 움직임',feel:'개인 느낌'},practiceGuide:{...plain(official.practiceGuide),core:'이전 편집 요약'}}},deleted:[]};
  const {store,storage}=await load(legacy);const original=storage.map.get(overlayKey);
  let ex=store.getById(official.id);assert.equal(ex.spec,'개인 중량 기록');assert.equal(ex.memo,'개인 메모');assert.equal(ex.favorite,false);assert.deepEqual(plain(ex.cues),['개인 교정 원문']);assert.equal(ex.focus.feel,'개인 느낌');assert.deepEqual(plain(ex.practiceGuide),official.practiceGuide);assert.equal(storage.map.get(overlayKey),original,'viewing makes no storage writes');
  assert(store.search(official.practiceGuide.pending[0]).some(e=>e.id===official.id),'pending settings searchable');
  ex.practiceGuide.checks[0]='외부 변형';assert.equal(store.getById(official.id).practiceGuide.checks[0],official.practiceGuide.checks[0],'editorial data not mutated by returned object');
  store.setMemo(official.id,'수정된 메모');assert.deepEqual(plain(store.getById(official.id).cues),['개인 교정 원문']);assert.equal(store.getById(official.id).memo,'수정된 메모');
  const exported=store.exportData();store.importData(exported);assert.equal(store.getById(official.id).spec,'개인 중량 기록');
  for(const bad of [null,{...plain(official.practiceGuide),steps:['하나']},{...plain(official.practiceGuide),checks:['하나','둘']},{...plain(official.practiceGuide),pending:[3]}]){const invalid=plain(seed);invalid.exercises.find(e=>e.id===official.id).practiceGuide=bad;await assert.rejects(()=>load({overrides:{},deleted:[]},invalid),/형식이 올바르지/);}
  const broken=plain(legacy);broken.overrides.pt_legextension.practiceGuide={steps:'wrong'};const corrupt=await load(broken);assert.equal(corrupt.store.getStatus().overlay.ok,false);assert.throws(()=>corrupt.store.setMemo(official.id,'overwrite'),e=>e.code==='CORRUPT');
  const hidden=await load({overrides:{},deleted:[official.id]});assert.equal(hidden.store.getById(official.id),null);
  console.log('PASS: training guide schema, search, no-write reads, legacy notes/edits preservation, backup, corruption protection and hidden-exercise behavior.');
})().catch(error=>{console.error(error);process.exitCode=1;});
