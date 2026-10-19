const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const ctx={window:{},URLSearchParams};vm.createContext(ctx);
for(const file of ['js/golf-data.js','js/navigation.js'])vm.runInContext(fs.readFileSync(path.join(__dirname,'..',file),'utf8'),ctx);
const c=ctx.window.GolfContent,n=ctx.window.AppNavigation;
assert.deepEqual(Object.keys(c.clubLabels),['iron','driver','both','unknown']);
for(const [id,review] of Object.entries(c.clubReviews)){assert(c.videos.some(v=>v.id===id));assert(Object.hasOwn(c.clubLabels,review.value));assert(review.reason&&review.reviewedAt);}
assert.equal(c.clubFor({id:'JoUx0gIzdng',title:'아이언으로 개인 제목 수정'}).value,'driver');
assert.equal(c.clubFor({id:'CAZ9oUoGRIg'}).value,'iron','reviewed iron demonstration does not imply both clubs');
assert.equal(c.clubFor({id:'2tam4sbJQtM'}).value,'iron');
assert.equal(c.clubFor({id:'iX_ZnUodsRQ'}).value,'both');
assert.equal(c.clubFor({id:'bTA5HW-hU_Y'}).value,'both');
for(const id of ['te5CN12g0Mc','Fk_3CjorpVA','Aj1UEMYPxBg','v3CFS-0sO_I'])assert.equal(c.clubFor({id}).value,'unknown','wood, approach, training tool and distance claims must not force a club');
const audit=JSON.parse(fs.readFileSync(path.join(__dirname,'../docs/golf-club-review-2026-10-19.json'),'utf8'));
assert.equal(audit.entries.length,94);assert.equal(new Set(audit.entries.map(e=>e.id)).size,94);
for(const entry of audit.entries){assert.equal(c.clubFor({id:entry.id}).value,entry.value);assert.equal(c.clubFor({id:entry.id}).reason,entry.reason);assert.equal(entry.sampleFiles.length,6);if(entry.value==='both')assert(entry.sharedEvidence?.scope&&entry.sharedEvidence.times.length);}
assert.equal(c.clubFor({id:'4Eof_tmI0Ag'}).value,'unknown','club comparison is not shared application');
assert.equal(c.clubFor({id:'unreviewed',title:'아이언 드라이버 공통',summary:'공통'}).value,'unknown');
assert.equal(c.clubFor({id:'dBsZdo7VEAA'}).value,'both');
assert.equal(c.clubFor({id:'j1USTUwFnRI'}).value,'unknown','multi-stage membership does not imply both clubs');
assert.equal(c.videoGroups.find(g=>g.id==='common').title,'여러 구간 연결');
assert.equal(c.videoSections.length,4);
for(const club of Object.keys(c.clubLabels))for(const hash of ['#golf/group/downswing','#golf/group/recent','#golf/video-favorites','#golf/videos/JoUx0gIzdng']){
 const route=hash+'?golfClub='+club;assert.equal(n.hashFor(n.fromHash(route)),route);
}
assert.equal(n.fromHash('#golf/videos?golfClub=invalid').golfClub,null);
assert.equal(n.fromHash('#golf/videos').golfClub,null);
console.log('PASS: evidence-based club labels, unknown fallback, comparison/multi-stage distinction, stable IDs and filter URLs.');
