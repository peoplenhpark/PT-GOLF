const assert=require('node:assert/strict');
module.exports=function validatePTVideos(seed,refs){
 const active=seed.exercises.filter(e=>e.part==='pt'&&!(seed.removedExerciseIds||[]).includes(e.id));
 assert.deepEqual(Object.keys(refs).sort(),active.map(e=>e.id).sort(),'all active PT exercises need a matched video or explicit pending reason');
 for(const e of active){
  const v=refs[e.id];
  if(v.pending){assert.equal(v.pending,true);assert(v.reason?.trim()&&v.checkedAt,'pending reason/date required');continue;}
  assert(/^[A-Za-z0-9_-]{11}$/.test(v.youtubeId),e.id+' source ID');
  assert(Number.isInteger(v.durationSeconds)&&v.durationSeconds>0&&v.durationSeconds<=180,e.id+' video must be <=180s');
  for(const k of ['title','channel','publishedAt','verifiedAt','registeredAt','evidence','commentSummary'])assert(v[k]?.trim(),e.id+' '+k+' required');
  assert(v.points?.length&&v.points.every(p=>p.trim()),e.id+' coaching match/scope required');
  assert(Number.isSafeInteger(v.viewCount)&&v.viewCount>=0,e.id+' view snapshot required');
  assert(v.commentCount===null||(Number.isInteger(v.commentCount)&&v.commentCount>=0));
  assert(Number.isInteger(v.commentsReviewed)&&v.commentsReviewed>=0&&v.commentsReviewed<=8);
  assert(v.moments?.length,e.id+' core moment required');
  for(const m of v.moments){
   assert(Number.isInteger(m.s)&&m.s>=0&&m.s<v.durationSeconds,e.id+' valid core time');assert(m.label?.trim());
   const url=new URL(m.url);assert.equal(url.origin,'https://www.youtube.com');assert.equal(url.pathname,'/watch');
   assert.equal(url.searchParams.get('v'),v.youtubeId,e.id+' stale replacement link');assert.equal(url.searchParams.get('t'),m.s+'s',e.id+' displayed/link time mismatch');
  }
  assert.equal(v.frames?.length,2,e.id+' two source frames');
  for(const f of v.frames){assert(f.src.startsWith('media/pt-reference/'+e.id+'-'));assert(f.alt?.trim());assert(Number.isInteger(f.seconds)&&f.seconds>=0&&f.seconds<v.durationSeconds);}
 }
 return active.length;
};
