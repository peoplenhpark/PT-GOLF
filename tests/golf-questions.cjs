const fs=require('fs'),vm=require('vm'),assert=require('node:assert/strict'),crypto=require('crypto'),path=require('path');
const root=path.resolve(__dirname,'..'),disk=new Map();let fail=false;
function tab(){const c={console,Date,Intl,crypto,URLSearchParams,localStorage:{getItem:k=>disk.get(k)||null,setItem:(k,v)=>{if(fail)throw Error('full');disk.set(k,v)},removeItem:k=>disk.delete(k)},addEventListener:()=>{},Store:{getByPart:()=>[{id:'a',name:'PT 원본',category:'등',cues:[]}],getExerciseSessions:()=>[]}};c.window=c;vm.createContext(c);for(const f of ['persistence','golf-data','golf-questions','coach-desk','navigation'])vm.runInContext(fs.readFileSync(path.join(root,'js',f+'.js'),'utf8'),c);c.GolfHub={learningSources:()=>({videos:c.GolfContent.videos,lessons:[],notes:[]})};return c;}
const t=tab(),g=t.GolfQuestions,k=t.Persistence.KEYS.coaching;
assert.equal(disk.size,0);
const criterion=t.CoachDesk.saveCriterion({part:'pt',sourceKey:'pt:a',title:'PT 원본',cue:'개인 기준',check:'개인 확인',setup:'',caution:'',club:'',referenceId:'',confirmed:false});
g.render(t.CoachDesk.read());g.choose('start');
const input={id:'r1',topicId:'impact',club:'7번 아이언',comfort:'편했음',consistency:'들쭉날쭉했음',memo:'느낌은 편하지만 타점은 달랐음',question:'타점 확인 질문'};
g.save(input);g.save(input);
let state=JSON.parse(disk.get(k));assert.equal(state.golfQuestions.records.length,1);assert.equal(state.golfQuestions.records[0].focusId,'start');assert.equal(state.golfQuestions.records[0].topicId,'impact');assert.equal(state.active.pt,criterion.id);assert.equal(state.criteria.length,1);
g.answer('r1','받은 답변');assert.equal(t.CoachDesk.searchRecords('타점 확인 질문').length,1);
state=JSON.parse(disk.get(k));assert.equal(state.golfQuestions.records[0].snapshot.goal,'편한 스윙과 일관성 있는 스윙');assert.equal(state.criteria[0].check,'개인 확인','question answers do not auto-rewrite criteria');
assert.equal(g.focus({golfQuestions:{focus:{date:'2000-01-01',topicId:'start'}}}),null);
const before=disk.get(k);fail=true;assert.throws(()=>g.choose('transition'),e=>e.code==='WRITE_FAILED');fail=false;assert.equal(disk.get(k),before);
assert.throws(()=>g.save({...input,id:'bad',comfort:'정답'}));assert.equal(disk.get(k),before);
const backup=t.Persistence.exportBackup();t.Persistence.validateBackup(backup);const bad=JSON.parse(JSON.stringify(backup));bad.stores[k].golfQuestions.records[0].topicId='unknown';assert.throws(()=>t.Persistence.validateBackup(bad),e=>e.code==='INVALID_BACKUP');
const left=tab(),right=tab();left.GolfQuestions.answer('r1','왼쪽 탭 답변');assert.throws(()=>right.GolfQuestions.answer('r1','오른쪽 탭 답변'),e=>e.code==='CONFLICT');
const a=tab(),b=tab();a.GolfQuestions.save({...input,id:'r2',topicId:'start'});b.GolfQuestions.save({...input,id:'r3',topicId:'transition'});assert.equal(JSON.parse(disk.get(k)).golfQuestions.records.length,3);
for(const topic of g.topics){for(const id of [topic.main,topic.extra,...topic.related,...topic.compare.flatMap(c=>c.ids)])assert(t.GolfContent.videos.some(v=>v.id===id));assert.match(g.videoConnections(topic.main),new RegExp('topic='+topic.id));const view={name:'coach',part:'golf',coachTab:'now',coachTopic:topic.id};assert.equal(t.AppNavigation.fromHash(t.AppNavigation.hashFor(view)).coachTopic,topic.id);}
disk.set(k,'broken');const broken=tab();assert.throws(()=>broken.GolfQuestions.save(input),e=>e.code==='CORRUPT');assert.equal(disk.get(k),'broken');
console.log('PASS: three golf questions, comfort/consistency, cross-topic notes, source links, focus expiry, criteria preservation, snapshots, search, backup, duplicates, write failure and multi-tab conflicts.');
