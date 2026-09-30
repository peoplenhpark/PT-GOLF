const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');

const app = read('js/app.js');
const sharedHtml = read('media/3d/viewer.html');
const sharedJs = read('media/3d/viewer.js');
const pushdownHtml = read('samples/pushdown-3d/viewer.html');
const pushdownJs = read('samples/pushdown-3d/pushdown.js');

assert.match(app, /frame\.src\s*=\s*versionedSource\s*\+\s*['"]&autoplay=1['"]/, 'opening the 3D details requests autoplay');
for (const [name, html] of [['shared', sharedHtml], ['pushdown', pushdownHtml]]) {
  assert.match(html, /<option value="\.5" selected>느리게<\/option>/, `${name} viewer selects slow speed by default`);
  assert(html.indexOf('value=".5" selected') < html.indexOf('value="1"'), `${name} viewer presents slow speed first`);
}
for (const [name, source] of [['shared', sharedJs], ['pushdown', pushdownJs]]) {
  assert.match(source, /get\(['"]autoplay['"]\)===['"]1['"]/, `${name} viewer consumes the autoplay request`);
  assert.match(source, /playing=autoplay,speed=\.5/, `${name} viewer starts at slow speed when opened`);
  assert.match(source, /dataset\.playing=String\(v\)/, `${name} viewer exposes playback state for verification`);
  assert.match(source, /dataset\.speed=String\(speed\)/, `${name} viewer exposes speed for verification`);
}

console.log(JSON.stringify({viewers:2,autoplayOnOpen:true,defaultSpeed:.5,slowLabel:'느리게'}));
