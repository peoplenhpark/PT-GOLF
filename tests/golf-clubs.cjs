const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const ctx={window:{},URLSearchParams};vm.createContext(ctx);
for(const file of ['js/golf-data.js','js/navigation.js'])vm.runInContext(fs.readFileSync(path.join(__dirname,'..',file),'utf8'),ctx);
const c=ctx.window.GolfContent,n=ctx.window.AppNavigation;
assert.deepEqual(Object.keys(c.clubLabels),['iron','driver','both','unknown']);
for(const [id,review] of Object.entries(c.clubReviews)){assert(c.videos.some(v=>v.id===id));assert(Object.hasOwn(c.clubLabels,review.value));assert(review.reason&&review.reviewedAt);}
assert.equal(c.clubFor({id:'JoUx0gIzdng',title:'아이언으로 개인 제목 수정'}).value,'driver');
assert.equal(c.clubFor({id:'CAZ9oUoGRIg'}).value,'unknown');
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
