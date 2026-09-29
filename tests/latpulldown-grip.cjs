const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.resolve(__dirname, '..');
const seed = JSON.parse(fs.readFileSync(path.join(root, 'data/seed.json'), 'utf8').replace(/^\uFEFF/, ''));
const lat = seed.exercises.find(item => item.id === 'pt_latpulldown');
assert(lat, 'lat pulldown is missing');
assert(seed.version >= 37, 'grip guide requires seed v37 or newer');
const guide = lat.gripGuide;
assert(guide && guide.title === '손 위치별 자세·느낌');
assert.equal(guide.options.length, 3);
assert.equal(new Set(guide.options.map(item => item.id)).size, 3);
assert(guide.options.some(item => item.id === guide.sessionId && item.badge === '이번 PT'));
assert.deepEqual(guide.options.map(item => item.label), ['약간 좁은 오버그립', '중간 오버그립', '넓은 오버그립']);
assert.deepEqual(guide.orientations.map(item => item.name), ['뉴트럴그립(중립그립)', '언더그립']);
const copy = JSON.stringify(guide);
for (const claim of ['윗광배 집중', '바깥 광배 집중', '뉴트럴=하부 광배', '언더핸드=이두근 증가', '중간 폭이 가장 효율적']) {
  assert(!copy.includes(claim), 'unsupported claim: ' + claim);
}
assert.match(guide.summary, /특정 광배 부위를 분리하기보다/);
assert.match(guide.evidence, /장기간의 근성장/);
const context = { window: {} };
vm.runInNewContext(fs.readFileSync(path.join(root, 'js/exercise-media.js'), 'utf8'), context);
assert.match(context.window.ExerciseMedia.pt_latpulldown.visualNote, /기본 오버그립 자세 예시/);
for (const file of ['js/app.js', 'js/store.js', 'js/search.js', 'js/persistence.js', 'css/style.css']) {
  const source = fs.readFileSync(path.join(root, file), 'utf8');
  assert(source.includes('gripGuide') || source.includes('grip-guide'), file + ' is not connected to the grip guide');
}
console.log('PASS: lat pulldown grip guidance, evidence limits, media scope, search, persistence, and responsive UI wiring.');
