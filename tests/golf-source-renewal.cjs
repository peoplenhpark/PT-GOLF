const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const root=path.resolve(__dirname,'..'),read=p=>fs.readFileSync(path.join(root,p),'utf8');
const saved={lessons:[],questions:[{id:'q',kind:'videos',sourceId:'TYq-Fge2LSA',text:'남길 질문'}],focus:[],videoNotes:{'TYq-Fge2LSA':{memo:'기존 메모',favorite:true,title:'개인 제목'},'18oA0JBM-fk':{memo:'두 번째 메모'}}};
let writes=0;const hidden=new Set(),ctx={window:{},localStorage:{getItem:()=>JSON.stringify(saved),setItem:()=>writes++},Store:{isDeleted:(kind,id)=>hidden.has(id),getByPart:()=>[],getById:()=>null}};
vm.createContext(ctx);for(const p of ['js/golf-data.js','js/golf-frames.js','js/golf-practice.js','js/golf.js'])vm.runInContext(read(p),ctx);
const c=ctx.window.GolfContent,a=JSON.parse(read('docs/video-review-2026-11-04-batch.json')),app={innerHTML:'',querySelector:()=>null},api={app,tabbar:()=>''};
assert.equal(c.videos.length,198);assert.equal(new Set(c.videos.map(c.sourceIdFor)).size,198);
for(const id of a.submittedIds){const matches=c.videos.filter(v=>v.id===id||c.sourceIdFor(v)===id||(v.alternateSources||[]).some(s=>s.id===id));assert.equal(matches.length,1,id+' resolves once');}
for(const [source,id] of Object.entries(a.replacementSources)){
 const v=c.videos.find(v=>v.id===id),prior=a.previousRecords.find(v=>v.id===id);
 assert.equal(v.sourceVideoId,source);assert.equal(v.submissionCount,2);assert.equal(v.originalAddedAt,prior.addedAt);
 for(const route of [id,source]){
  ctx.window.GolfHub.render({golfTab:'videos',golfId:route},api);
  assert(app.innerHTML.includes('watch?v='+source));assert(!app.innerHTML.includes('watch?v='+id));
  assert(app.innerHTML.includes('data-g-form="video" data-id="'+id+'"'));assert(app.innerHTML.includes(saved.videoNotes[id].memo));
  for(const frame of ctx.window.GolfFrames[id])assert(app.innerHTML.includes(frame.src));
 }
 hidden.add(id);ctx.window.GolfHub.render({golfTab:'videos',golfId:source},api);assert(!app.innerHTML.includes('g-practical-summary'));hidden.delete(id);
}
ctx.window.GolfHub.render({golfTab:'videos',golfId:'jZHoqqHoL-0'},api);assert(app.innerHTML.includes('data-g-form="video" data-id="W__zH8-7nxc"'));
for(const id of a.sameIdRenewals){const v=c.videos.find(v=>v.id===id),prior=a.previousRecords.find(v=>v.id===id);assert.equal(v.submissionCount,2);assert.equal(v.originalAddedAt,prior.addedAt);assert.deepEqual(JSON.parse(JSON.stringify(v.points)),prior.points);}
assert.equal(c.clubReviews.tHJTXiEVpzM.value,'unknown');assert.equal(c.clubReviews.ktADlkpNn_E.value,'unknown');assert.equal(writes,0);
console.log('PASS: 25 submissions resolve once; replacement playback, old/new routes, personal memo/favorite keys, hidden state, duplicate counts and uncertain club scope.');
