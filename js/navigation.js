/* URL and session history are independent of screen rendering. */
window.AppNavigation = (() => {
  const encode = encodeURIComponent;
  function hashFor(v) {
    let path = '#home';
    const p = new URLSearchParams();
    if (v.name === 'part') { path = '#' + v.part; if(v.cat) p.set('cat',v.cat); }
    if (v.name === 'detail') path = '#exercise/' + encode(v.id);
    if (v.name === 'favorites') path = '#favorites';
    if (v.name === 'calendar') { path='#calendar'; if(Number.isInteger(v.calYear)) p.set('year',v.calYear); if(Number.isInteger(v.calMonth)) p.set('month',v.calMonth); }
    if (v.name === 'search') { path='#search'; if(v.q) p.set('q',v.q); if(v.scope) p.set('scope',v.scope); }
    if (v.name === 'golf-hub') {
      path = v.golfGroup && v.golfTab==='videos' && !v.golfId ? '#golf/group/'+encode(v.golfGroup) :
        '#golf/'+(v.golfTab || 'today')+(v.golfId?'/'+encode(v.golfId):'');
      for (const key of ['golfQuery','golfTopic','cat','sourceKind','sourceId']) if(v[key]) p.set(key,v[key]);
    }
    return path + (p.size ? '?' + p : '');
  }
  function fromHash(hash) {
    const [raw,query] = (hash || '#home').split('?');
    const p = new URLSearchParams(query || '');
    let parts; try { parts=raw.slice(1).split('/').map(decodeURIComponent); } catch { return {name:'home'}; }
    const [a,b,c] = parts;
    if(a==='exercise' && b) return {name:'detail',id:b};
    if(a==='pt'||a==='ht') return {name:'part',part:a,cat:p.get('cat')};
    if(a==='favorites') return {name:'favorites'};
    if(a==='calendar') return {name:'calendar',calYear:p.has('year')?Number(p.get('year')):undefined,calMonth:p.has('month')?Number(p.get('month')):undefined};
    if(a==='search') return {name:'search',q:p.get('q')||'',scope:p.get('scope')||'all'};
    if(a==='golf') {
      const v={name:'golf-hub',part:'golf',golfTab:b||'today',golfId:c||null,golfGroup:null,golfQuery:'',golfTopic:null,cat:null,sourceKind:null,sourceId:null};
      if(b==='group') Object.assign(v,{golfTab:'videos',golfId:null,golfGroup:c});
      for(const k of ['golfQuery','golfTopic','cat','sourceKind','sourceId']) if(p.has(k))v[k]=p.get(k);
      return v;
    }
    return {name:'home'};
  }
  function create() {
    const key='ptgolf_navigation_v1';
    let session; try { session=JSON.parse(sessionStorage.getItem(key)||'null'); } catch {}
    let token=history.state?.ptgolfSession || String(Date.now())+'-'+Math.random();
    let index=Number.isInteger(history.state?.ptgolfIndex)?history.state.ptgolfIndex:0;
    let max=session?.token===token?Math.max(index,session.max||0):index;
    let positions=session?.token===token?(session.positions||{}):{},restoring=false;
    function saveSession(){try{sessionStorage.setItem(key,JSON.stringify({token,max,positions}));}catch{}}
    function saveScroll() {
      const s=history.state;
      if(s?.ptgolfSession!==token)return;
      if(restoring)return;
      positions[index]={scrollY:window.scrollY||0,scrollTop:document.querySelector('.scr')?.scrollTop||0};saveSession();
      history.replaceState({...s,...positions[index]},'',location.href);
    }
    function write(v,mode='push') {
      saveScroll();
      if(mode==='push'){index++;max=index;positions[index]={scrollY:0,scrollTop:0};Object.keys(positions).filter(k=>Number(k)>index).forEach(k=>delete positions[k]);}
      const previous=mode==='replace'?history.state:{};
      history[mode==='push'?'pushState':'replaceState']({...previous,ptgolfView:{...v},ptgolfIndex:index,ptgolfSession:token,ptgolfHash:hashFor(v),...(mode==='push'?{scrollY:0,scrollTop:0}:{})},'',location.pathname+location.search+hashFor(v));
      saveSession();
    }
    function read(state=history.state) {
      if(state?.ptgolfSession)token=state.ptgolfSession;
      index=Number.isInteger(state?.ptgolfIndex)?state.ptgolfIndex:index;
      max=Math.max(max,index);saveSession();
      return state?.ptgolfView && (!state.ptgolfHash || state.ptgolfHash===location.hash)?{...state.ptgolfView}:fromHash(location.hash);
    }
    function restoreScroll(){const s=positions[index]||history.state;restoring=true;requestAnimationFrame(()=>{window.scrollTo(0,s?.scrollY||0);const el=document.querySelector('.scr');if(el)el.scrollTop=s?.scrollTop||0;requestAnimationFrame(()=>{restoring=false;});});}
    window.addEventListener('pagehide',saveScroll);
    window.addEventListener('beforeunload',saveScroll);
    document.addEventListener('scroll',()=>{if(!restoring)saveScroll();},{capture:true,passive:true});
    if('scrollRestoration' in history)history.scrollRestoration='manual';
    function sync(v){history.replaceState({...history.state,ptgolfView:{...v},ptgolfHash:hashFor(v)},'',location.pathname+location.search+hashFor(v));}
    function start(v){history.replaceState({...history.state,ptgolfView:{...v},ptgolfIndex:index,ptgolfSession:token,ptgolfHash:hashFor(v),...(positions[index]||{})},'',location.pathname+location.search+hashFor(v));saveSession();}
    return {write,read,sync,start,saveScroll,restoreScroll,get index(){return index},get max(){return max}};
  }
  return {hashFor,fromHash,create};
})();
