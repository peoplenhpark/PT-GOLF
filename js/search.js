window.AppSearch = (() => {
  const terms=q=>(q||'').trim().toLocaleLowerCase().split(/\s+/).filter(Boolean);
  const labels={pt:'PT',ht:'HT',note:'내 노트',video:'골프 영상',lesson:'레슨'};
  function records(q,scope='all') {
    if(!terms(q).length)return [];
    const exercises=Store.search(q).map(e=>{
      const guide=e.gripGuide||{},gripText=[guide.title,guide.summary,guide.common,guide.orientationNote,guide.evidence,
        ...(guide.options||[]).flatMap(item=>Object.values(item)),...(guide.orientations||[]).flatMap(item=>Object.values(item))].filter(value=>typeof value==='string').join(' ');
      const fields=[['이름',e.name],['설명',[e.spec,...e.prep||[],...e.cues||[],...e.reminders||[],...e.steps||[],...Object.values(e.focus||{}),...Object.values(e.practicalSummary||{})].join(' ')],['원본 영상',[e.sourceVideo?.title,e.sourceVideo?.channel].filter(Boolean).join(' ')],['손 위치',gripText],['메모',e.memo],['분류',e.category]];
      const match=fields.filter(([,s])=>terms(q).some(t=>String(s||'').toLowerCase().includes(t)));
      return {id:e.id,type:['pt','ht'].includes(e.part)?e.part:'note',title:e.name,href:'#exercise/'+encodeURIComponent(e.id),excerpt:match.map(([l,s])=>l+': '+s).join(' · '),matchedFields:match.map(([l])=>l)};
    });
    let golf=[];try{golf=window.GolfHub?.searchRecords?.(q)||[];}catch{}
    const unique=[...new Map([...exercises,...golf].map(r=>[r.type+':'+r.id,r])).values()];
    return unique.filter(r=>scope==='all'||r.type===scope);
  }
  return {records,labels};
})();
