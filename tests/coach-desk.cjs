const fs=require('fs'),vm=require('vm'),assert=require('node:assert/strict'),crypto=require('crypto'),path=require('path');
const root=path.resolve(__dirname,'..'),code=p=>fs.readFileSync(path.join(root,p),'utf8'),plain=x=>JSON.parse(JSON.stringify(x));
const disk=new Map();let fail=false;
function tab(){const c={console,Date,Intl,crypto,URLSearchParams,localStorage:{getItem:k=>disk.get(k)||null,setItem:(k,v)=>{if(fail)throw Error('full');disk.set(k,v)},removeItem:k=>disk.delete(k)},Store:{getByPart:()=>[{id:'a',name:'동작 A',category:'등',spec:'원본 핵심',cues:['확인점'],reminders:[]}],getExerciseSessions:()=>[]},addEventListener:()=>{}};c.window=c;vm.createContext(c);vm.runInContext(code('js/persistence.js'),c);vm.runInContext(code('js/coach-desk.js'),c);vm.runInContext(code('js/navigation.js'),c);return c;}
const t=tab(),desk=t.CoachDesk,key=t.Persistence.KEYS.coaching;
const seed={part:'pt',sourceKey:'pt:a',title:'동작 A',cue:'오늘 확인점',check:'확인할 방법',setup:'준비',caution:'주의',club:'',referenceId:'',confirmed:false};
assert.equal(disk.size,0,'reading never initializes or overwrites personal data');
const a=desk.saveCriterion(seed);desk.saveRecord({id:'r1',part:'pt',criterionId:a.id,result:'판단 어려움',memo:'한 줄',question:'다음 질문'});
desk.saveRecord({id:'r1',part:'pt',criterionId:a.id,result:'판단 어려움',memo:'한 줄',question:'다음 질문'});assert.equal(desk.read().records.length,1,'retry is idempotent');
desk.answerRecord('r1','코치에게 받은 답변',true);assert.equal(desk.read().criteria[0].check,'코치에게 받은 답변');assert.equal(desk.read().criteria[0].confirmed,false);assert.equal(desk.read().records[0].snapshot.check,'확인할 방법','historical context is immutable');assert.equal(desk.read().revisions.length,1);
const before=disk.get(key);fail=true;assert.throws(()=>desk.saveCriterion({...a,cue:'실패한 수정'}),e=>e.code==='WRITE_FAILED');fail=false;assert.equal(disk.get(key),before);assert.equal(desk.read().criteria[0].cue,'오늘 확인점');
const backup=t.Persistence.exportBackup();assert.equal(backup.schemaVersion,3);const v2=plain(backup);v2.schemaVersion=2;delete v2.stores[key];t.Persistence.restoreBackup(v2);assert.equal(disk.get(key),before,'legacy six-store restore preserves new criteria');
const malformed=plain(backup);malformed.stores[key].records[0].snapshot.part='golf';assert.throws(()=>t.Persistence.validateBackup(malformed),e=>e.code==='INVALID_BACKUP');
const left=tab(),right=tab();left.CoachDesk.saveCriterion({...seed,cue:'별도 기준'});right.CoachDesk.saveRecord({id:'r2',part:'pt',criterionId:a.id,result:'도움 됨',memo:'다른 탭',question:''});assert.equal(JSON.parse(disk.get(key)).criteria.length,2);assert.equal(JSON.parse(disk.get(key)).records.length,2);
const u=tab(),v=tab(),criterion=u.CoachDesk.read().criteria[0];u.CoachDesk.saveCriterion({...criterion,cue:'한 탭의 수정'});assert.throws(()=>v.CoachDesk.saveCriterion({...criterion,cue:'동시 수정'}),e=>e.code==='CONFLICT');
disk.set(key,'invalid');const broken=tab();assert.throws(()=>broken.CoachDesk.saveCriterion(seed),e=>e.code==='CORRUPT');assert.equal(disk.get(key),'invalid');
for(const p of ['pt','golf']){const view={name:'coach',part:p,coachTab:'standards',coachSource:'pt:a',coachId:null};assert.equal(t.AppNavigation.fromHash(t.AppNavigation.hashFor(view)).coachSource,'pt:a');}
console.log('PASS: compact criteria, immutable result snapshots, answer revisions, duplicate-submit protection, failure/corruption safety, multi-tab merges/conflicts, legacy backup preservation and route round trips.');
