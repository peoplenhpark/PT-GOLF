const assert=require('node:assert/strict');
module.exports=async(browser,base)=>{
 const ctx=await browser.newContext({viewport:{width:390,height:844}}),p=await ctx.newPage(),errors=[];p.on('pageerror',e=>errors.push(e.message));
 try{
  await p.goto(base+'#exercise/pt_lowpulley_row');await p.locator('.pt-reference-video').waitFor();
  const refs=await p.evaluate(()=>window.PTReferenceVideos);
  for(const [id,v] of Object.entries(refs)){
   await p.goto(base+'#exercise/'+id);await p.locator('.d-title').waitFor();
   if(v.pending){assert.equal(await p.locator('.pt-reference-pending').count(),1);assert.equal(await p.locator('.pt-video-moment').count(),0);continue;}
   const videos=[v,...v.additionalVideos||[]];assert.equal(await p.locator('.pt-reference-video').count(),videos.length);
   for(const video of videos){
   const section=p.locator('[data-reference-video="'+video.youtubeId+'"]');
   assert.equal(await section.locator('.pt-video-frames img').count(),2);
   const links=section.locator('.pt-video-moment');assert.equal(await links.count(),video.moments.length);
   for(const [i,m] of video.moments.entries()){assert.equal(await links.nth(i).getAttribute('href'),m.url);assert.equal(await links.nth(i).getAttribute('data-start'),String(m.s));}
   }
  }
  for(const width of [320,390,768])for(const theme of ['light','dark']){
   await p.setViewportSize({width,height:844});await p.goto(base+'#exercise/pt_lowpulley_row');await p.locator('.pt-reference-video').waitFor();await p.evaluate(t=>document.documentElement.setAttribute('data-theme',t),theme);
   await p.locator('.pt-video-frames').scrollIntoViewIfNeeded();await p.waitForFunction(()=>[...document.querySelectorAll('.pt-video-frames img')].every(i=>i.complete&&i.naturalWidth>0));
   assert(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'PT reference fits viewport');
  }
  await p.locator('.pt-reference-video [data-act=training-play]').click();assert.match(await p.locator('.pt-reference-video iframe').getAttribute('src'),/embed\/guLhRDd8VTA\?autoplay=1&playsinline=1/);
  await p.goto(base+'#exercise/ht_squat_comparison');await p.locator('.training-video').first().waitFor();assert.equal(await p.locator('.pt-reference-video').count(),0);
  await p.locator('.memo-edit').click();await p.locator('#memo-input').fill('PT 참고 영상 개인 메모 보존');await p.locator('#memo-save').click();await p.reload();await p.locator('.memo-box').waitFor();assert.match(await p.locator('.memo-box').innerText(),/개인 메모 보존/);
  assert.deepEqual(errors,[]);console.log('PASS: PT51 references/3 pending, moment links, source pairs, mobile themes, playback and HT/personal memo preservation.');
 }finally{await ctx.close();}
};
