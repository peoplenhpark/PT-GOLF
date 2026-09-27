/* Apply the newest shell after a safe point; persisted drafts survive reload. */
window.AppUpdate = (() => {
  let registration,waiting,changed=false,reloading=false;
  function safe(){return !window.AppDrafts?.hasUnstored()&&!window.AppDrafts?.activePending()&&!document.querySelector('.modal:not(.hidden)');}
  function apply() {
    if(!safe())return;
    if(changed&&!reloading){reloading=true;location.reload();return;}
    if(waiting){waiting.postMessage({type:'PTGOLF_SKIP_WAITING'});waiting=null;}
  }
  function init(toast) {
    if(!('serviceWorker' in navigator)||!location.protocol.startsWith('http'))return;
    const controlled=!!navigator.serviceWorker.controller;
    navigator.serviceWorker.addEventListener('controllerchange',()=>{if(!controlled)return;changed=true;if(!safe())toast('최신 버전이 준비됐습니다. 작성 내용을 저장한 뒤 적용합니다.');apply();});
    navigator.serviceWorker.register('sw.js',{updateViaCache:'none'}).then(reg=>{
      registration=reg;
      const ready=()=>{waiting=reg.waiting;if(waiting){if(!safe())toast('업데이트 준비됨 · 작성 내용을 먼저 저장하세요');apply();}};
      ready();reg.addEventListener('updatefound',()=>{const worker=reg.installing;worker?.addEventListener('statechange',()=>{if(worker.state==='installed')ready();});});
      reg.update().catch(()=>{});
    }).catch(()=>toast('오프라인 준비를 완료하지 못했습니다. 온라인 기능은 계속 사용할 수 있습니다.'));
    window.AppDrafts?.subscribe(()=>setTimeout(apply,0));
    window.addEventListener('ptgolf-screen-rendered',apply);
    window.addEventListener('focus',()=>registration?.update().catch(()=>{}));
    document.addEventListener('visibilitychange',()=>{if(!document.hidden){registration?.update().catch(()=>{});apply();}});
  }
  return {init,apply};
})();
