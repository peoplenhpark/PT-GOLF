const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const root=path.resolve(__dirname,'..'),seed=JSON.parse(fs.readFileSync(path.join(root,'data/seed.json'),'utf8'));let all=structuredClone(seed.exercises);
const c={window:{},URLSearchParams,Store:{getAll:()=>all}};vm.createContext(c);vm.runInContext(fs.readFileSync(path.join(root,'js/training-questions.js'),'utf8'),c);vm.runInContext(fs.readFileSync(path.join(root,'js/navigation.js'),'utf8'),c);
const q=c.window.TrainingQuestions,plain=x=>JSON.parse(JSON.stringify(x));let result=q.collect();assert.equal(result.rows.length,10);assert.equal(result.scope.length,4);
assert.deepEqual(plain([0,1,2].map(g=>result.rows.filter(r=>r.group===g).length)),[5,3,2]);
assert.deepEqual(plain(result.rows.filter(r=>r.group===0).map(r=>r.exercises[0].id)),["pt_backextension","pt_lunge","pt_legpress","pt_legextension","pt_adduction"]);
assert(result.rows.filter(r=>r.group===2).every(r=>['ht_bulgarian_split_squat','ht_wide_dumbbell'].includes(r.exercises[0].id)));

const covered=[...result.rows.flatMap(r=>r.exercises.map(e=>e.id)),...result.scope.map(e=>e.id)];assert.equal(covered.length,new Set(covered).size);assert.deepEqual(covered.sort(),all.filter(e=>e.practiceGuide?.pending.length).map(e=>e.id).sort());
const nav=c.window.AppNavigation,route={name:'coach',part:'pt',coachTab:'questions',coachSource:'pt_pullup'};assert.deepEqual(plain(nav.fromHash(nav.hashFor(route))),route);
assert.match(q.render('pt_lunge'),/class="training-question-selected"/);assert.doesNotMatch(q.render(''),/<input|<textarea|<details/);
all=all.filter(e=>e.id!=='pt_seatedrow');result=q.collect();assert(!result.rows.some(r=>r.exercises.some(e=>e.id==='pt_seatedrow')));assert(!result.rows.some(r=>r.exercises.some(e=>e.id==='ht_upper_elbows')),'completed upper-body reference does not return to pending questions');
all.push({id:'future',name:'<script>test</script>',part:'pt',practiceGuide:{pending:['<img onerror=bad>']}});assert(q.collect().rows.some(r=>r.group===3&&r.exercises[0].id==='future'),'future unknowns are not assigned a safety priority');assert.match(q.render(''),/&lt;script&gt;/);assert.match(q.render(''),/&lt;img onerror=bad&gt;/);assert.doesNotMatch(q.render(''),/<script>/);
all=[];assert.equal(q.entryLink(),'');assert.equal(q.collect().rows.length,0);
console.log('PASS: coach questions cover unresolved sources once, preserve reference scope, route round trips, hidden references, future unknowns and escaping.');
