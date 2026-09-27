/* Publish only runtime assets. Historical tools/docs and retired golf engines remain in Git. */
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.resolve(__dirname, '..');
const dest = path.join(root, '_site');
const context = {};
vm.runInNewContext(fs.readFileSync(path.join(root, 'release-assets.js'), 'utf8'), context);
const release = context.PTGolfRelease;
const files = new Set([...release.shell, ...Object.values(release.exercises).flat(), 'sw.js', 'release.json',
  'samples/pushdown-3d/index.html', ...fs.readdirSync(path.join(root, 'media/golf3d')).filter(f=>f.endsWith('.html')).map(f=>'media/golf3d/'+f)]);
fs.mkdirSync(dest, { recursive: true });
const realRoot = fs.realpathSync(root);
const realDest = fs.realpathSync(dest);
if (realDest !== path.join(realRoot, '_site')) throw new Error('Refusing to clean an unexpected _site destination');
// Prevent removed runtime files surviving repeated local builds without recursive deletion.
function clearFiles(directory) {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const target = path.join(directory, entry.name);
    if (entry.isSymbolicLink()) throw new Error('Refusing to follow a link in _site: ' + target);
    if (!fs.realpathSync(target).startsWith(realDest + path.sep)) throw new Error('Unexpected build output path');
    if (entry.isDirectory()) clearFiles(target); else fs.unlinkSync(target);
  }
}
clearFiles(dest);
for (const file of files) {
  const target = path.join(dest, file);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.copyFileSync(path.join(root, file), target);
}
fs.writeFileSync(path.join(dest, '.nojekyll'), '');
console.log('Built _site with ' + files.size + ' runtime files for v' + release.version);
