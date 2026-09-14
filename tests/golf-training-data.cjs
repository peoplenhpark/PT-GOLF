const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const root=path.resolve(__dirname,'..'),ctx={window:{}};vm.createContext(ctx);vm.runInContext(fs.readFileSync(path.join(root,'js/golf-data.js'),'utf8'),ctx);const c=ctx.window.GolfContent;
assert.equal(c.originalMaxSeconds,180);assert.equal(c.videos.length,10);
for(const duration of ['2:00','2:46','2:59','3:00'])assert.equal(c.presentationFor({duration,lesson3d:true}),'original');
assert.equal(c.presentationFor({duration:'3:01',lesson3d:true}),'3d');assert.equal(c.presentationFor({duration:'15:53',lesson3d:true,presentation:'original'}),'original');
for(const id of ['UA-HYcmiKTA','CA-TZ7WQlHY']){const v=c.videos.find(v=>v.id===id);assert.equal(c.presentationFor(v),'original');assert(!v.trainingLesson);assert(!v.lesson3d);assert(v.points.length>=3);for(const linked of v.relatedVideoIds)assert(c.videos.some(x=>x.id===linked));}
assert.equal(c.presentationFor(c.videos.find(v=>v.id==='du58mmLNMnQ')),'3d');
for(const file of ['training.js','training.css','training-data.js'])assert(!fs.existsSync(path.join(root,'media/golf3d',file)));
const sw=fs.readFileSync(path.join(root,'sw.js'),'utf8');for(const match of sw.matchAll(/'\.\/([^']*)'/g))assert(fs.existsSync(path.join(root,match[1].split('?')[0]||'index.html')));
assert(!fs.readFileSync(path.join(root,'media/golf3d/lesson.html'),'utf8').includes('lesson=aiming'));
console.log(JSON.stringify({originalLimitSeconds:180,inclusiveBoundary:true,aiming3dRemoved:true,shiftOriginal:true,impact3dPreserved:true,sourceAndNotesPreserved:true,cacheAssetsValid:true}));

const long=c.videos.find(v=>v.id==='IsSS-GnQQyY'),short=c.videos.find(v=>v.id==='ULOLFCC-ly8');
assert.equal(c.durationSeconds(long),611);assert.equal(c.presentationFor(long),'3d');
assert.equal(c.durationSeconds(short),92);assert.equal(c.presentationFor(short),'original');assert(!short.lesson3d);
assert(fs.existsSync(path.join(root,long.lessonHref.split('?')[0])));
for(const v of c.videos){for(const id of v.relatedVideoIds||[])assert(c.videos.some(x=>x.id===id));for(const m of v.moments)assert(m.s>=0&&m.s<c.durationSeconds(v));}
assert(short.relatedVideoIds.includes(long.id));assert(long.relatedVideoIds.includes(short.id));
console.log('New sources: 611s → dedicated 3D, 92s → original; reciprocal links and source moments valid.');
