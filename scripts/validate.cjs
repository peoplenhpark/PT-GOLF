/* Small default gate: current product tests only; historical golf renderers are excluded. */
const fs = require('node:fs');
const path = require('node:path');
const cp = require('node:child_process');
const root = path.resolve(__dirname, '..');
function run(...args) {
  const result = cp.spawnSync(process.execPath, args, { cwd: root, stdio: 'inherit' });
  if (result.status !== 0) process.exit(result.status || 1);
}
run('scripts/release.cjs', '--check');
const scripts = [...fs.readdirSync(path.join(root, 'js')).filter(f=>f.endsWith('.js')).map(f=>'js/'+f),
  'sw.js', 'release-assets.js', 'media/3d/poses.js', 'media/3d/viewer.js'];
for (const script of scripts) run('--check', script);
const tests = fs.readdirSync(path.join(root, 'tests')).filter(file=>file.endsWith('.cjs') &&
  !['golf-3d.cjs','golf-hub.cjs','golf-lesson.cjs','golf-original.cjs','golf-player.cjs','visual-media.cjs','browser-smoke.cjs'].includes(file));
for (const test of tests) run('tests/' + test);
console.log('PASS: release consistency, ' + scripts.length + ' syntax checks, ' + tests.length + ' current Node test files.');
