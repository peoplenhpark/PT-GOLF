window.AppOffline = (() => {
  async function request(type,ids) {
    if(!navigator.serviceWorker?.controller)throw new Error('앱 준비가 끝난 뒤 다시 눌러주세요.');
    return new Promise((resolve,reject)=>{
      const ch=new MessageChannel(),timer=setTimeout(()=>{ch.port1.close();reject(new Error('연결이 느립니다. 다시 시도해 주세요.'));},60000);
      ch.port1.onmessage=e=>{clearTimeout(timer);ch.port1.close();resolve(e.data)};
      navigator.serviceWorker.controller.postMessage({type,exerciseIds:ids,requestId:String(Date.now())},[ch.port2]);
    });
  }
  async function bind(root,id) {
    const button=root.querySelector('[data-offline]'),status=root.querySelector('[data-offline-status]');if(!button)return;
    try{const r=await request('PTGOLF_OFFLINE_STATUS',[id]);if(r.readyIds?.includes(id))status.textContent='오프라인 준비됨 · 이미지와 3D';}catch{}
    button.onclick=async()=>{button.disabled=true;status.textContent='이미지와 3D를 저장하고 있습니다…';try{const r=await request('PTGOLF_PREPARE_OFFLINE',[id]);status.textContent=r.ok?'오프라인 준비됨 · 이미지와 3D':'일부 자료를 저장하지 못했습니다. 연결을 확인하고 다시 눌러주세요.';}catch(e){status.textContent=e.message;}finally{button.disabled=false;}};
  }
  return {bind};
})();
