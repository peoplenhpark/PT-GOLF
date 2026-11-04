const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.resolve(__dirname,'..'),read=p=>fs.readFileSync(path.join(root,p),'utf8');
function setup(fail=false){
 const saved={lessons:[],questions:[],focus:[],videoNotes:{'2tam4sbJQtM':{archived:true,memo:'핀 메모',favorite:true},'TYq-Fge2LSA':{archived:true,memo:'교체 전 메모',favorite:true,status:'레슨에서 확인',action:'내가 정한 연습 동작'},z9lAaO2IefM:{archived:true,memo:'실전 메모'}}};
 const disk=new Map([['ptgolf_learning_v1',JSON.stringify(saved)]]),handlers={},routes=[],messages=[];let writes=0;
 const app={innerHTML:'',querySelector:()=>null,addEventListener:(type,fn)=>handlers[type]=fn};
 const ctx={window:{},URLSearchParams,localStorage:{getItem:k=>disk.get(k)||null,setItem:(k,v)=>{if(fail)throw Error('quota');writes++;disk.set(k,v)},removeItem:k=>disk.delete(k)},Store:{isDeleted:()=>false,getByPart:()=>[],getById:()=>null,getCategories:()=>[]},crypto:{randomUUID:()=> 'test'}};
 vm.createContext(ctx);for(const file of ['js/golf-data.js','js/golf-frames.js','js/golf-practice.js','js/navigation.js','js/golf.js'])vm.runInContext(read(file),ctx);
 const api={app,tabbar:()=>'',go:(...a)=>routes.push(a),toast:m=>messages.push(m),refresh:()=>{}};ctx.window.GolfHub.configure(api);
 const render=view=>{ctx.window.GolfHub.render(view,api);return app.innerHTML};
 const click=(action,id)=>handlers.click({target:{closest:()=>({dataset:{g:action,id}})},preventDefault(){},stopPropagation(){}});
 return {saved,disk,ctx,render,click,routes,messages,writes:()=>writes};
}
const t=setup(),hub=t.ctx.window.GolfHub,c=t.ctx.window.GolfContent;
let html=t.render({golfTab:'key-messages'});assert.equal((html.match(/class="g-key-row"/g)||[]).length,c.videos.length-3);assert(!html.includes('data-video-id="TYq-Fge2LSA"'));
html=t.render({golfTab:'key-messages',golfArchive:'only',golfClub:'both'});assert(html.includes('data-video-id="TYq-Fge2LSA"'));assert(html.includes('g-archive-badge'));assert(html.includes('golfArchive=only'));assert(html.includes('aria-current="page">보관영상</a>'));
t.click('archive-filter');assert.equal(t.routes.at(-1)[1].golfArchive,null);assert.equal(t.routes.at(-1)[1].golfClub,null);

html=t.render({golfTab:'key-messages',golfArchive:'only'});assert.equal((html.match(/class="g-key-row"/g)||[]).length,3);assert.equal((html.match(/data-g="restore-archived-video"/g)||[]).length,3);assert(!html.includes('class="g-frame"'));assert(!html.includes('data-video-id="nlmg8nsjfbk"'));
t.click('restore-archived-video','TYq-Fge2LSA');t.click('restore-archived-video','TYq-Fge2LSA');assert.equal(JSON.parse(t.disk.get('ptgolf_learning_v1')).videoNotes['TYq-Fge2LSA'].archived,false);
html=t.render({golfTab:'key-messages',golfArchive:'only'});assert.equal((html.match(/class="g-key-row"/g)||[]).length,2);assert(!html.includes('data-video-id="TYq-Fge2LSA"'));
t.click('archive-video','TYq-Fge2LSA');
html=t.render({golfTab:'videos',golfId:'kuKUECtB-fg'});assert(html.includes('교체 전 메모'));assert(html.includes('다시 연습 · 복원'));assert(html.includes('data-g-form="video" data-id="TYq-Fge2LSA"'));
assert(!hub.learningSources().videos.some(v=>v.id==='TYq-Fge2LSA'));assert.equal(hub.pinnedPractice(),'');assert(hub.stagePractice().includes('연습 3단계'));assert(hub.stagePractice().includes('보관한 출처'));
html=t.render({golfTab:'field'});assert(!html.includes('#golf/videos/z9lAaO2IefM'));assert(html.includes('data-g="archive-filter"'));html=t.render({golfTab:'field',golfArchive:'only'});assert(html.includes('#golf/videos/z9lAaO2IefM'));
html=t.render({golfTab:'videos',golfId:'TYq-Fge2LSA'});t.click('archive-video','TYq-Fge2LSA');let stored=JSON.parse(t.disk.get('ptgolf_learning_v1'));assert.deepEqual(stored.videoNotes['TYq-Fge2LSA'],{...t.saved.videoNotes['TYq-Fge2LSA'],archived:false});assert.deepEqual(stored.lessons,t.saved.lessons);assert(hub.learningSources().videos.some(v=>v.id==='TYq-Fge2LSA'));
t.click('archive-video','TYq-Fge2LSA');stored=JSON.parse(t.disk.get('ptgolf_learning_v1'));assert.deepEqual(stored,t.saved);
// Explicit lesson references keep archived video cards; no automatic deletion or lesson edits.
c.lessons.push({id:'archive-test',title:'보존 레슨',date:'2026-11-04',noteIds:[],topics:[],videoIds:['TYq-Fge2LSA']});html=t.render({golfTab:'lessons',golfId:'archive-test'});assert(html.includes('교체 전 메모')||html.includes('#golf/videos/TYq-Fge2LSA'));assert(html.includes('g-archive-badge'));
const n=t.ctx.window.AppNavigation;const view=n.fromHash('#golf/key-messages?golfArchive=only&golfClub=iron&golfQuery=%ED%9E%98');assert.equal(n.fromHash(n.hashFor(view)).golfArchive,'only');assert.equal(n.fromHash('#golf/key-messages?golfArchive=arbitrary').golfArchive,undefined);
assert.equal(n.fromHash('#golf/key-messages?golfArchive=include').golfArchive,'only');
const f=setup(true);f.render({golfTab:'videos',golfId:'TYq-Fge2LSA'});f.click('archive-video','TYq-Fge2LSA');assert.deepEqual(JSON.parse(f.disk.get('ptgolf_learning_v1')),f.saved);assert(!f.ctx.window.GolfHub.learningSources().videos.some(v=>v.id==='TYq-Fge2LSA'));assert(f.messages.some(m=>m.includes('저장하지 못')));
vm.runInContext(read('js/persistence.js'),t.ctx);const valid=t.ctx.window.Persistence.validators.ptgolf_learning_v1;assert(valid(t.saved));assert(!valid({...t.saved,videoNotes:{x:{archived:'yes'}}}));assert(valid({...t.saved,videoNotes:{x:{memo:'기존 데이터'}}}));
console.log('PASS: archive/restore with stable keys, separate archive-only/club/field filters and idempotent inline restore, pin suppression and visible 3+3, lesson references, no record loss, URL round trip, failed-write safety and legacy validation.');
