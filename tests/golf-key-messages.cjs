const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const root=path.resolve(__dirname,'..'),read=p=>fs.readFileSync(path.join(root,p),'utf8');
let writes=0,hidden=new Set();const ctx={window:{},localStorage:{getItem:()=>JSON.stringify({lessons:[],questions:[],focus:[],videoNotes:{iD8o1vJSal4:{title:'내 제목 <개인>',memo:'private',action:'나만의 방법'}}}),setItem:()=>writes++},Store:{isDeleted:(kind,id)=>hidden.has(id),getByPart:()=>[],getById:()=>null}};
vm.createContext(ctx);vm.runInContext(read('js/golf-data.js'),ctx);vm.runInContext(read('js/golf.js'),ctx);
const g=ctx.window.GolfContent,m=g.keyMessages,audit=JSON.parse(read('docs/golf-key-messages-2026-11-01.json'));
assert.deepEqual(Object.keys(m).sort(),Array.from(g.videos,v=>v.id).sort());assert.equal(new Set(Object.values(m).map(x=>x.text)).size,g.videos.length);
for(const v of g.videos){assert(m[v.id].text.length>15&&m[v.id].text.length<=70,v.id);assert(['observation','explanation'].includes(m[v.id].kind));const a=audit.videos.find(a=>a.id===v.id);assert.equal(a.source,'https://www.youtube.com/watch?v='+g.sourceIdFor(v));assert.equal(a.message,m[v.id].text);}
assert.equal(audit.videos.filter(a=>a.reviewedAt==='2026-11-01').length,22);
assert(m.jlqT_vNRcSI.text.includes('왼팔꿈치'));assert(!g.practicalFor(g.videos.find(v=>v.id==='jlqT_vNRcSI')).action.includes('오른팔'));
const app={innerHTML:'',querySelector:()=>null},api={app,tabbar:()=>''};
function render(extra={}){ctx.window.GolfHub.render({golfTab:'key-messages',...extra},api);return app.innerHTML;}
let html=render();assert.equal((html.match(/class="g-key-row"/g)||[]).length,g.videos.length);assert(html.indexOf('data-video-id="2tam4sbJQtM"')<html.indexOf('data-video-id="aaOw2sdp-io"'));
assert(html.includes('전체 영상 핵심'));assert(!html.includes('g-core-card')&&!html.includes('g-key-archive'));assert.equal((html.match(/class="g-key-subgroup"/g)||[]).length,12);
assert(html.includes('내 제목 &lt;개인&gt;'));assert(!html.includes('나만의 방법')&&!html.includes('private'));
for(const v of g.videos){assert(html.includes('href="#golf/videos/'+v.id+'"'));assert(html.includes('href="https://www.youtube.com/watch?v='+g.sourceIdFor(v)+'"'));}
for(const club of Object.keys(g.clubLabels)){html=render({golfClub:club});assert.equal((html.match(/class="g-key-row"/g)||[]).length,g.videos.filter(v=>g.clubFor(v).value===club).length);}
html=render({cat:'field'});assert.equal((html.match(/class="g-key-row"/g)||[]).length,2);
html=render({golfQuery:'왼팔꿈치가 바닥'});assert(html.includes('data-video-id="jlqT_vNRcSI"'));
html=render({golfQuery:'존재하지않는문구123'});assert(html.includes('조건에 맞는 영상이 없습니다'));
hidden.add('2tam4sbJQtM');html=render();assert(!html.includes('data-video-id="2tam4sbJQtM"'));assert.equal((html.match(/class="g-key-row"/g)||[]).length,g.videos.length-1);assert.equal(writes,0);
console.log('PASS: canonical source summaries, 22 extra reviews, conditional cues, left-arm correction, source links, club/section/search filters, pinned order, hidden videos and private record separation.');
