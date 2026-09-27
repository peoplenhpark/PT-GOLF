window.AppSearch = (() => {
  const terms=q=>(q||'').trim().toLocaleLowerCase().split(/\s+/).filter(Boolean);
  const labels={pt:'PT',note:'내 노트',video:'골프 영상',lesson:'레슨'};
  function records(q,scope='all') {
    if(!terms(q).length)return [];
    const exercises=Store.search(q).map(e=>{
      const fields=[['이름',e.name],['설명',[e.spec,...e.prep||[],...e.cues||[],...e.reminders||[],...e.steps||[],...Object.values(e.focus||{})].join(' ')],['메모',e.memo],['분류',e.category]];
      const match=fields.filter(([,s])=>terms(q).some(t=>String(s||'').toLowerCase().includes(t)));
      return {id:e.id,type:e.part==='pt'?'pt':'note',title:e.name,href:'#exercise/'+encodeURIComponent(e.id),excerpt:match.map(([l,s])=>l+': '+s).join(' · '),matchedFields:match.map(([l])=>l)};
    });
    let golf=[];try{golf=window.GolfHub?.searchRecords?.(q)||[];}catch{}
    const unique=[...new Map([...exercises,...golf].map(r=>[r.type+':'+r.id,r])).values()];
    return unique.filter(r=>scope==='all'||r.type===scope);
  }
  return {records,labels};
})();
