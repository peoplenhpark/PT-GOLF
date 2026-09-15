/* Reciprocal navigation between a learning model and the referenced original. */
(() => {
  const content=window.GolfContent;
  const params=new URLSearchParams(location.search);
  const name=location.pathname.split('/').pop();
  const requested=params.get('source');
  const fallback=name==='consistency.html'?'IsSS-GnQQyY':name==='lesson.html'?'du58mmLNMnQ':(params.get('exercise')||'golf_driver')==='golf_driver'?'-h77kU-fpjg':'bfMsJtV61hM';
  const source=content.videos.find(v=>v.id===((name==='viewer.html'&&requested)||fallback));
  if(!source||!content.modelOptionFor(source))return;
  const model=content.modelOptionFor(source);
  const clubs={golf_driver:'드라이버',golf_iron7:'7번 아이언',golf_iron5:'5번 아이언',golf_ironp:'P 아이언'};
  const detail=name==='viewer.html'?`공통 ${clubs[params.get('exercise')||'golf_driver']||'드라이버'} 스윙 예시`:model.detail;
  const section=document.createElement('section');section.className='model-options';section.setAttribute('aria-label','보기 방법');
  const nav=document.createElement('nav');
  const current=document.createElement('span');current.className='model-option-current';current.setAttribute('aria-current','page');current.textContent='실사형 3D로 보기';
  const original=document.createElement('a');original.href=`https://www.youtube.com/watch?v=${source.id}`;original.target='_blank';original.rel='noopener noreferrer';original.textContent='원본 영상 보기 ↗';
  nav.append(current,original);
  const caption=document.createElement('p');caption.textContent=`${detail} · 원본 선수의 외형·동작 복원이 아닙니다.`;
  const back=document.createElement('a');back.className='model-source-detail';back.href=`../../index.html?v=65#golf/videos/${source.id}`;back.textContent=`관련 영상·설명: ${source.title} →`;
  section.append(nav,caption,back);document.body.prepend(section);
})();
