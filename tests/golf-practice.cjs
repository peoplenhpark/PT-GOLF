const fs=require('fs'),path=require('path'),vm=require('vm'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..'),read=p=>fs.readFileSync(path.join(root,p),'utf8');
const c={window:{},localStorage:{getItem:()=>null,setItem:()=>{},removeItem:()=>{}}};vm.createContext(c);
for(const file of ['js/persistence.js','js/golf-data.js','js/golf-frames.js','js/golf-practice.js'])vm.runInContext(read(file),c);
const {GolfContent,GolfFrames,GolfPractice,Persistence}=c.window;
assert.deepEqual(Object.keys(GolfFrames).sort(),Array.from(GolfContent.videos,v=>v.id).sort());
const sources=JSON.parse(read('docs/golf-frames-2026-10-05.json'));
for(const v of sources){
 assert.equal(v.frames.length,2);assert(v.frames[0].time<v.frames[1].time);
 const bytes=v.frames.map(f=>{assert(f.time>=0&&f.time<v.duration);assert(f.width>0&&f.height>0);return fs.readFileSync(path.join(root,f.src));});
 assert(!bytes[0].equals(bytes[1]),v.id+' duplicate frame');
}
assert.deepEqual(Object.keys(GolfPractice.notes).sort(),['0930','1001','1003','1004']);
assert(GolfPractice.notes['0930'].original.includes('수지 낙하중요.'));
assert(GolfPractice.notes['1004'].original.includes('양 어깨는 거의 고정'));
const valid=Persistence.validators.ptgolf_learning_v1;
const old={lessons:[],questions:[],focus:[],videoNotes:{sample:{memo:'보존',favorite:true}}};assert(valid(old));
const record={id:'practice_1',date:'2026-10-05',created:'2026-10-05T01:00:00Z',club:'7번 아이언',method:'cue',cueId:'1004',cueDate:'10/4',cueText:GolfPractice.notes['1004'].cue,contact:3,direction:4,distance:'대체로 적정',feel:'비슷함',measure:'타감으로 판단'};
const next={...old,practice:{selected:'1004',club:'7번 아이언'},practiceRecords:[record]};assert(valid(next));
for(const bad of [{contact:6},{direction:1.5},{club:'arbitrary'},{method:'invalid'},{cueId:'unknown'}])assert(!valid({...next,practiceRecords:[{...record,...bad}]}));
assert(!valid({...next,practiceRecords:[record,record]}));
assert.deepEqual(next.videoNotes,old.videoNotes);
console.log('PASS: 84 source videos / 168 distinct frames, exact personal notes, backward-compatible practice validation.');

const first=GolfContent.lessons.find(l=>l.id==='lesson_20261005_first');assert(first);assert.deepEqual(Array.from(first.practiceClubs),['7번 아이언']);assert.equal(first.practicePoints.length,2);assert.equal(first.evidence.length,5);assert.equal(GolfPractice.practiceSource({practice:{selected:'1004'}}).id,first.id);assert.equal(GolfPractice.practiceSource({practice:{selected:'1004',sourceKind:'sensation'}}).kind,'sensation');assert(valid({...old,practice:{sourceKind:'lesson',lessonId:first.id},practiceRecords:[{...record,cueId:first.id,sourceKind:'lesson',lessonId:first.id,comfort:'편안함'}]}));assert(!valid({...old,practiceRecords:[{...record,cueId:first.id,sourceKind:'lesson',lessonId:'wrong'}]}));console.log('PASS: lesson priority, explicit sensation comparison, lesson scope, source linkage and legacy records.');

const added=['0mNd_dCea4Q','X0IcCD0NT9I','QLJDoGT7-2U','DOf7sAtTJYw','iqK8wC0JFTg'];
const prioritized=['aaOw2sdp-io','7sNhk9PhBxc','ojzyFHAQWnw',...added];
assert.deepEqual(Array.from(GolfContent.videoGroups.find(g=>g.id==='backswing-top').videoIds),[...prioritized,'IMjI_VqsQsg']);
assert.deepEqual(Array.from(first.videoCollection.videoIds),prioritized);
for(const id of added){const v=GolfContent.videos.find(v=>v.id===id);assert(first.videoIds.includes(id));assert(v.tags.every(t=>GolfContent.videoTags.includes(t)));assert(v.lessonConnection);assert.equal(GolfContent.evidenceFor(v).kind,'observation');assert.equal(GolfFrames[id].length,2);}
assert.equal(GolfContent.videos.filter(v=>v.tags?.includes('백스윙 시 오른팔 위치')).length,5);
assert.equal(GolfContent.videos.filter(v=>v.tags?.includes('백스윙 시 몸통 회전')).length,6);
assert.deepEqual(Array.from(GolfContent.videoTags),['백스윙 시 오른팔 위치','백스윙 시 몸통 회전']);
for(const id of ['wBlnDaqkGi0','jlqT_vNRcSI','FnbyQ-UYjMI']){assert(!prioritized.includes(id));assert(GolfContent.videos.some(v=>v.id===id));}
for(const id of prioritized.slice(0,3))assert.equal(GolfContent.videos.find(v=>v.id===id).scopeReview.priority,'existing');
assert.deepEqual(Array.from(GolfContent.videos.find(v=>v.id==='DOf7sAtTJYw').tags),['백스윙 시 몸통 회전']);
console.log('PASS: backswing group, cross-cutting tags, first-lesson collection and source frames.');
