/* Persist editable form drafts, never search queries or read-only fields. */
window.AppDrafts = (() => {
  const store=Persistence.open('ptgolf_drafts_v1',{defaults:()=>({}),validate:x=>!!x && typeof x==='object' && !Array.isArray(x)});
  const metas=new WeakMap(), bound=new WeakSet(), listeners=new Set(), unsaved=new Map(),suppressed=new Map();
  const fields=root=>[...(root.matches?.('input,textarea,select')?[root]:root.querySelectorAll('input,textarea,select'))].filter(el=>!el.readOnly&&!el.disabled&&!el.matches('[data-no-draft],[type=search],[type=submit],[type=button],[type=hidden]')&&!el.closest('[data-g-form=search]')&&(el.id||el.name));
  const value=el=>['checkbox','radio'].includes(el.type)?el.checked:el.value;
  function assign(el,v){if(['checkbox','radio'].includes(el.type))el.checked=!!v;else el.value=v;}
  function notify(){listeners.forEach(fn=>fn());window.dispatchEvent(new Event('ptgolf-drafts-change'));}
  function label(meta,message) {
    const root=meta.root;
    let el=root.querySelector?.('[data-draft-status]');
    if(!el && root.append && !root.matches('input,textarea,select')){el=document.createElement('p');el.dataset.draftStatus='';el.className='draft-status';el.setAttribute('role','status');root.append(el);}
    if(el)el.textContent=message;
  }
  function save(el) {
    const meta=metas.get(el);if(!meta)return;
    const v=value(el);
    try {
      store.update(next=>{if(v===meta.base)delete next[meta.key];else next[meta.key]={value:v,updated:new Date().toISOString()};});
      unsaved.delete(meta.key);label(meta,v===meta.base?'변경 없음':'초안 보관됨 · 저장 버튼을 눌러 기록에 반영하세요');
    } catch {unsaved.set(meta.key,v);label(meta,'초안을 보관하지 못했습니다. 입력 내용을 유지하고 있습니다.');}
    notify();
  }
  function bind(root,scope,reset=false) {
    fields(root).forEach(el=>{
      const form=el.closest('form'), container=form||root;
      const name=el.id||el.name+(['checkbox','radio'].includes(el.type)?':'+el.value:'');
      const key=(scope||root.dataset?.draftKey||location.hash||'#home')+'|'+(form?.dataset.gForm||'')+'|'+name;
      if(bound.has(el)&&metas.get(el)?.key===key&&!reset)return;
      const already=bound.has(el),meta={root:container,key,base:value(el)};metas.set(el,meta);bound.add(el);
      let saved;try{saved=store.read()[key];}catch{}
      if(unsaved.has(key)){assign(el,unsaved.get(key));label(meta,'아직 저장하지 못한 입력을 복원했습니다.');}
      else if(saved&&saved.value!==meta.base&&JSON.stringify(saved)!==suppressed.get(key)){assign(el,saved.value);label(meta,'이전에 작성한 초안을 복원했습니다.');}
      if(!already){el.addEventListener('input',()=>save(el));el.addEventListener('change',()=>save(el));}
    });
  }
  function clear(root) {
    const entries=fields(root).map(el=>[el,metas.get(el)]).filter(([,m])=>m);
    let ok=true;try{store.update(next=>entries.forEach(([,m])=>delete next[m.key]));}catch{ok=false;const saved=store.read();entries.forEach(([,m])=>suppressed.set(m.key,JSON.stringify(saved[m.key])));}
    entries.forEach(([el,m])=>{m.base=value(el);unsaved.delete(m.key);label(m,ok?'저장됨':'기록은 저장됐습니다. 초안 정리는 다음 저장 때 다시 시도합니다.');});notify();return ok;
  }
  function hasPending(){try{return Object.keys(store.read()).length>0||unsaved.size>0;}catch{return true;}}
  function activePending(){return [...document.querySelectorAll('input,textarea,select')].some(el=>{const m=metas.get(el);return m && el.isConnected && !el.closest('.hidden') && value(el)!==m.base;});}
  function has(scope){try{return Object.keys(store.read()).some(k=>k.startsWith(scope+'|'));}catch{return false;}}
  window.addEventListener('beforeunload',ev=>{if(unsaved.size){ev.preventDefault();ev.returnValue='';}});
  return {bind,clear,has,hasPending,activePending,hasUnstored:()=>unsaved.size>0,subscribe(fn){listeners.add(fn);return()=>listeners.delete(fn);}};
})();
