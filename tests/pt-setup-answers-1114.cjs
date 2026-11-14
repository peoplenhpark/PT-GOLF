const fs=require('fs'),assert=require('assert/strict'),vm=require('vm');
const s=JSON.parse(fs.readFileSync('data/seed.json','utf8')),by=Object.fromEntries(s.exercises.map(e=>[e.id,e])),ids=['pt_backextension','pt_lunge','pt_legpress','pt_legextension','pt_adduction'];
for(const id of ids){const e=by[id],a=e.practiceGuide.coachAnswers[0];assert.equal(a.date,'2026-11-14');assert(a.source.includes('사용자'));assert(!a.source.includes('11.14 수업'));}
assert.match(by.pt_backextension.practiceGuide.coachAnswers[0].answer,/기구 경사/);assert.match(by.pt_backextension.practiceGuide.pending.join(),/패드/);
assert.match(by.pt_lunge.spec,/8kg.*15회 × 2세트/);assert(!by.pt_lunge.practiceGuide.pending.join().includes('횟수'));
assert.match(by.pt_legpress.spec,/40kg씩.*등받이2칸.*80kg/);assert.match(by.pt_legpress.practiceGuide.coachAnswers[0].answer,/기구 자체 중량/);
for(const id of ['pt_legextension','pt_adduction']){assert.equal(by[id].practiceGuide.questionStatus,'answered');assert.deepEqual(by[id].practiceGuide.pending,[]);}
assert.match(by.pt_legextension.practiceGuide.core,/발목.*자연스럽게/);assert.match(by.pt_adduction.spec,/20kg.*max 오픈/);
const c={window:{},Store:{getAll:()=>s.exercises}};vm.createContext(c);vm.runInContext(fs.readFileSync('js/training-questions.js','utf8'),c);const rows=c.window.TrainingQuestions.collect().rows;assert(!rows.some(r=>r.exercises.some(e=>['pt_legextension','pt_adduction'].includes(e.id))));
const v={window:{}};vm.runInNewContext(fs.readFileSync('js/pt-videos.js','utf8'),v);for(const id of ids)assert(v.window.PTReferenceVideos[id].points.some(p=>p.includes('11.14 사용자 확인')));
assert(s.ptSessions.find(x=>x.id==='pt_session_20261113').items.some(x=>x.points?.some(t=>t.includes('두 장'))),'original lesson history preserved');
console.log('PASS: five user confirmations, two completed questions/three partial, scoped machine setup, shared video cues and original lesson history.');
