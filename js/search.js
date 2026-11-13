window.AppSearch = (() => {
  const terms=q=>(q||'').trim().toLocaleLowerCase().split(/\s+/).filter(Boolean);
  const labels={pt:'PT 원본',ht:'HT 운동 자료',note:'내 노트',video:'골프 영상',lesson:'레슨',criterion:'내 기준',practice:'연습 기록'};
  const matchesScope=(r,scope)=>scope==='all'||(scope==='ht'?['pt','ht'].includes(r.type):r.type===scope);
  function records(q,scope='all') {
    if(!terms(q).length)return [];
    const exercises=(Store.getAll?.()||Store.search(q)).map(e=>{
      const reference=window.PTReferenceVideos?.[e.id],videos=[e.sourceVideo,...e.supplementaryVideos||[],reference,...reference?.additionalVideos||[]].filter(v=>v?.youtubeId);
      const guide=e.gripGuide||{},gripText=[guide.title,guide.summary,guide.common,guide.orientationNote,guide.evidence,
        ...(guide.options||[]).flatMap(item=>Object.values(item)),...(guide.orientations||[]).flatMap(item=>Object.values(item))].filter(value=>typeof value==='string').join(' ');
      const fields=[['이름',e.name],['현재 연습',[e.practiceGuide?.core,e.practiceGuide?.caution,...e.practiceGuide?.steps||[],...e.practiceGuide?.checks||[],...e.practiceGuide?.pending||[]].filter(Boolean).join(' ')],['설명',[e.spec,...e.prep||[],...e.cues||[],...e.reminders||[],...e.steps||[],...Object.values(e.focus||{}),...Object.values(e.practicalSummary||{})].join(' ')],['원본 영상',videos.flatMap(v=>[v.title,v.channel,...v.points||[],...(v.moments||[]).map(m=>m.label)]).join(' ')],['수업 기록',(Store.getExerciseSessions?.(e.id)||[]).flatMap(s=>[s.date,s.item.title,...s.item.points]).join(' ')],['손 위치',gripText],['메모',e.memo],['분류',e.category]];
      if(!terms(q).every(t=>fields.some(([,s])=>String(s||'').toLowerCase().includes(t))))return null;
      const match=fields.filter(([,s])=>terms(q).some(t=>String(s||'').toLowerCase().includes(t)));
      return {id:e.id,type:['pt','ht'].includes(e.part)?e.part:'note',title:e.name,href:'#exercise/'+encodeURIComponent(e.id),excerpt:match.map(([l,s])=>l+': '+s).join(' · '),matchedFields:match.map(([l])=>l)};
    }).filter(Boolean);
    const sessions=(Store.getPTSessions?.()||[]).flatMap(s=>s.items.filter(i=>!i.exerciseId).map((item,n)=>({id:s.id+'_'+n,type:'pt',title:item.title,href:'#pt',excerpt:[s.date,...item.points,item.uncertainty].join(' '),matchedFields:['수업 기록']}))).filter(r=>terms(q).every(t=>(r.title+' '+r.excerpt).toLowerCase().includes(t)));
    let golf=[];try{golf=window.GolfHub?.searchRecords?.(q)||[];}catch{}
    const unique=[...new Map([...exercises,...sessions,...golf,...(window.CoachDesk?.searchRecords(q)||[])].map(r=>[r.type+':'+r.id,r])).values()];
    return unique.filter(r=>matchesScope(r,scope));
  }
  return {records,labels,matchesScope};
})();
