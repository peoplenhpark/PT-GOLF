const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.resolve(__dirname,'..'),read=p=>fs.readFileSync(path.join(root,p),'utf8'),seed=JSON.parse(read('data/seed.json'));
(async()=>{for(const [id,part,name] of [['pt_rehab_quadset','pt','쿼드 셋'],['ht_legpress_positions','ht','레그프레스 발 위치']]){
 const overlay={schemaVersion:2,overrides:{[id]:{id,part,name:name+' 개인 이름',memo:'보존할 메모',favorite:true},usr_personal:{id:'usr_personal',part:'pt',name:'별도 개인 운동',favorite:true}},deleted:[],legacyIds:[id]};
 const request={id:'del_exercise_'+id,kind:'exercise',contentId:id,title:name,source:'seed',requestedAt:'2026-10-20T01:00:00.000Z',status:'pending'};
 const disk=new Map([['ptgolf_overlay_v1',JSON.stringify(overlay)],['ptgolf_deletion_requests_v1',JSON.stringify({requests:[request]})]]),before=disk.get('ptgolf_overlay_v1');
 const c={console,Date,Math,JSON,Set,Map,Error,URLSearchParams,localStorage:{getItem:k=>disk.get(k)??null,setItem:(k,v)=>disk.set(k,String(v)),removeItem:k=>disk.delete(k)},addEventListener(){},fetch:async()=>({ok:true,json:async()=>JSON.parse(JSON.stringify(seed))})};c.window=c;vm.createContext(c);
 vm.runInContext(read('js/persistence.js'),c);vm.runInContext(read('js/store.js')+'\nglobalThis.store=Store;',c);vm.runInContext(read('js/search.js'),c);
 await c.store.init();assert.equal(c.store.getById(id),null);assert(!c.store.getAll().some(x=>x.id===id));assert(!c.store.getFavorites().some(x=>x.id===id));assert.equal(c.AppSearch.records(name,part).length,0);
 assert.equal(c.store.getDeletionRequests().length,0,'completed removal no longer appears on home');assert.equal(c.store.getAllDeletionRequests()[0].status,'completed');
 c.store.restoreDeleted(request.id);assert.equal(c.store.getById(id),null,'cancelling old request cannot resurrect retired source');
 assert(c.store.getById('usr_personal'));assert(c.store.getById('pt_legpress'));assert(!c.store.getRelatedExercises('pt_legpress').some(x=>x.exercise.id===id));
 assert.equal(disk.get('ptgolf_overlay_v1'),before,'retirement must not erase personal notes');assert(seed.removedExerciseIds.includes(id));assert(!seed.exercises.some(e=>e.id===id));assert(!read('js/exercise-media.js').includes('"'+id+'"'));
}console.log('PASS: retired exercises cannot resurrect through overlays/search/favorites/restore; completed home requests, private notes and PT leg press preserved.');})().catch(e=>{console.error(e);process.exit(1)});
