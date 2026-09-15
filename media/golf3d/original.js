/* Original athlete playback. Editorial notes accompany, never cover, the YouTube player. */
(() => {
  'use strict';
  const VIDEO = 'bfMsJtV61hM';
  const views = [
    {start:0,end:17,label:'01 / 정면에서 보기',title:'어깨·골반·팔의 연결을 따라가세요.',points:[
      '준비 자세에서는 양발 사이에 몸이 어떻게 놓이는지, 두 팔과 클럽이 어디에서 출발하는지 먼저 봅니다. 이후 움직임을 비교할 기준 장면입니다.',
      '백스윙부터 내려오는 구간까지 어깨와 골반의 방향, 팔이 몸 앞을 지나는 순서를 함께 관찰합니다. 한 부위만 멈춰 보기보다 연결된 흐름을 반복해 보세요.',
      '공을 지난 뒤 몸통과 팔이 어떻게 이어지는지, 피니시에서 양발과 몸의 위치가 어떻게 달라졌는지 살펴봅니다. 같은 정면 각도의 내 영상과 비교해 보세요.'
    ]},
    {start:17,end:31,label:'02 / 측면에서 보기',title:'상체 기울기와 클럽의 통로를 보세요.',points:[
      '측면에서는 준비 자세의 상체 기울기와 무릎 굽힘, 몸과 손 사이 공간이 잘 보입니다. 정면에서 놓쳤던 앞뒤 위치를 확인해 보세요.',
      '클럽을 올리고 내릴 때 손과 클럽이 몸에서 얼마나 떨어져 보이는지 관찰합니다. 촬영 각도가 다르므로 정면 화면과 보이는 모양이 달라질 수 있습니다.',
      '임팩트 전후의 상체·손·헤드를 함께 본 뒤, 몸이 일어서며 마무리되는 흐름까지 이어 봅니다. 한 장면만으로 힘의 크기나 정확한 관절 각도를 단정하지 않습니다.'
    ]}
  ];
  const $ = id => document.getElementById(id);
  let player,ready=false,selected=0,requested=0,timer,loadingTimer,lastSeek=0,failed=false;
  const stamp = t => `0:${String(Math.floor(t)).padStart(2,'0')}`;
  function show(i) {
    selected=i; const view=views[i];
    $('viewLabel').textContent=view.label; $('captionTitle').textContent=view.title;
    $('points').replaceChildren(...view.points.map(text=>{const li=document.createElement('li');li.textContent=text;return li;}));
    document.querySelectorAll('[data-view]').forEach((button,j)=>button.setAttribute('aria-pressed',String(i===j)));
    $('source').href=`https://www.youtube.com/watch?v=${VIDEO}&t=${view.start}s`;
    if($('fallback-source'))$('fallback-source').href=$('source').href;
  }
  function seek(i) {
    requested=i;show(i);
    if(ready){lastSeek=performance.now();player.seekTo(views[i].start,true);}
  }
  function fail(message) {
    clearTimeout(loadingTimer);clearInterval(timer);ready=false;failed=true;
    $('play').disabled=true;$('restart').disabled=true;
    $('status').textContent=message+' 아래 YouTube 원본 링크에서 볼 수 있습니다.';
    const fallback=document.createElement('div');fallback.className='placeholder';
    const title=document.createElement('strong');title.textContent='YouTube에서 이어 보기';
    const text=document.createElement('p');text.textContent='이 브라우저에서 삽입 영상을 연결하지 못했습니다. 원본 페이지에서 실제 선수의 스윙을 볼 수 있습니다.';
    const link=document.createElement('a');link.className='fallback-link';link.textContent='실제 선수 원본 열기 ↗';
    link.href=$('source').href;link.target='_blank';link.rel='noopener noreferrer';link.id='fallback-source';
    fallback.append(title,text,link);document.querySelector('.screen').append(fallback);
    $('player').hidden=true;
    $('play').hidden=true;$('restart').hidden=true;document.querySelector('.repeat').hidden=true;

  }
  function tick() {
    if(!ready)return;
    const t=player.getCurrentTime(),duration=player.getDuration()||31,state=player.getPlayerState();
    $('time').textContent=`${stamp(t)} / ${stamp(duration)}`;
    if(performance.now()-lastSeek<800)return;
    if($('repeat').checked){
      const view=views[selected];
      if(state===1&&(t>=Math.min(view.end,duration)-.15||t<view.start-.5)){
        lastSeek=performance.now();player.seekTo(view.start,true);
      }
    }else{
      const i=t>=views[1].start?1:0;if(i!==selected)show(i);
    }
  }
  function init() {
    if(player)return;
    player=new YT.Player('player',{
      host:'https://www.youtube.com',width:'100%',height:'100%',videoId:VIDEO,
      playerVars:{playsinline:1,rel:0,origin:location.origin},
      events:{
        onReady(){
          if(failed)return;
          clearTimeout(loadingTimer);ready=true;
          player.getIframe().title='김민지5 프로 정면·측면 슬로모션 원본 영상';
          $('play').disabled=false;$('restart').disabled=false;
          $('status').textContent='정면·측면 버튼으로 이동하고, 같은 시점을 반복해 보세요.';
          if(requested)seek(requested);
          timer=setInterval(tick,150);
        },
        onStateChange(event){
          $('play').textContent=event.data===1?'일시정지':'재생';
          if(event.data===0&&$('repeat').checked&&ready){seek(selected);player.playVideo();}
          tick();
        },
        onError(){fail('이 환경에서 원본 영상을 불러오지 못했습니다.');}
      }
    });
  }
  $('load').addEventListener('click',()=>{
    $('load').disabled=true;$('load').textContent='불러오는 중…';
    $('status').textContent='YouTube 원본을 준비하고 있습니다.';
    loadingTimer=setTimeout(()=>fail('연결이 지연되고 있습니다. 새로고침하여 다시 시도해 주세요.'),20000);
    const frame=document.createElement('iframe');frame.id='player';
    frame.title='김민지5 프로 정면·측면 슬로모션 원본 영상';
    frame.allow='autoplay; encrypted-media; picture-in-picture; fullscreen';
    frame.allowFullscreen=true;frame.referrerPolicy='strict-origin-when-cross-origin';
    frame.src=`https://www.youtube.com/embed/${VIDEO}?enablejsapi=1&playsinline=1&rel=0&origin=${encodeURIComponent(location.origin)}`;
    $('player').replaceWith(frame);
    window.onYouTubeIframeAPIReady=init;
    if(window.YT?.Player)init();else{
      const script=document.createElement('script');script.src='https://www.youtube.com/iframe_api';
      script.onerror=()=>fail('YouTube에 연결할 수 없습니다.');document.head.append(script);
    }
  },{once:true});
  $('play').addEventListener('click',()=>{if(ready){if(player.getPlayerState()===1)player.pauseVideo();else player.playVideo();}});
  $('restart').addEventListener('click',()=>seek(selected));
  $('repeat').addEventListener('change',()=>{if($('repeat').checked)seek(selected);});
  document.querySelectorAll('[data-view]').forEach(button=>button.addEventListener('click',()=>seek(Number(button.dataset.view))));
  window.addEventListener('pagehide',()=>{clearInterval(timer);clearTimeout(loadingTimer);});
  window.addEventListener('pageshow',event=>{if(event.persisted&&ready){clearInterval(timer);timer=setInterval(tick,150);}});
  show(0);
})();
