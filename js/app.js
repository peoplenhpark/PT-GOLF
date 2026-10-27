/* app.js — 라우팅 + 렌더 + CRUD UI (vanilla, 빌드 없음) */

/* ── 테마 관리 ── */
const Theme = (() => {
  const KEY = 'ptgolf_theme';
  const DARK_META  = '#0d0f14';
  const LIGHT_META = '#f5f7fa';

  function get() { try{return localStorage.getItem(KEY)||'dark';}catch{return 'dark';} }

  function apply(t) {
    document.documentElement.setAttribute('data-theme', t);
    // 상태바 색상
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.content = t === 'light' ? LIGHT_META : DARK_META;
    // 버튼 아이콘
    const btn = document.getElementById('theme-btn');
    if (btn) btn.textContent = t === 'light' ? '☀️' : '🌙';
  }

  function set(t) { localStorage.setItem(KEY, t); apply(t); }
  function toggle() { set(get() === 'dark' ? 'light' : 'dark'); }
  function init() { apply(get()); }

  return { get, set, toggle, init };
})();

(() => {
  const app = document.getElementById('app');
  const modal = document.getElementById('modal');
  const confirmEl = document.getElementById('confirm');
  const toastEl = document.getElementById('toast');

  // 자산 버전 — 그림(SVG) URL에 붙여 캐시 강제 갱신 (릴리스 시 index.html·sw.js와 함께 올릴 것)
  const ASSET_VER = String(window.PTGolfRelease?.version || '90');

  // 화면 상태
  let view = { name: 'home', part: null, cat: null, id: null };
  const navigation = AppNavigation.create();
  let ignoreHashChange = false;
  // 운동 1회용 체크 상태(저장 안 함): { exId: Set(cueIndex) }
  const checks = {};
  let confirmCb = null;

  const esc = s => String(s ?? '').replace(/[&<>"']/g, c =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const partLabel = p => (Store.getParts().find(x => x.id === p) || {}).label || p;
  const partIcon = p => (Store.getParts().find(x => x.id === p) || {}).icon || '';
  // User-selected exercises (2026-10-16); selection only, not a prescribed routine.
  const personalPT = [
    {key:'basic',label:'기본운동',ids:['pt_tailbone_raise','pt_lunge_ball_rotation','pt_hip_openclose_stretch','pt_openbook','pt_wide_sidelunge_stretch']},
    {key:'chest',label:'가슴',ids:['pt_chestpress','pt_pecdeck']},
    {key:'back',label:'등',ids:['pt_seatedrow','pt_latpulldown','pt_pullup']},
    {key:'arms',label:'팔',ids:['pt_pushdown','pt_low_cable_curl']},
    {key:'legs',label:'다리',ids:['pt_legcurl','pt_adduction','pt_legextension','pt_legpress']}
  ];
  function personalGroups() {
    const byId = new Map(Store.getByPart('pt').map(e => [e.id,e]));
    return personalPT.map(g => ({...g,exercises:g.ids.map(id=>byId.get(id)).filter(Boolean)}));
  }
  const personalCat = cat => cat === 'personal' || personalPT.some(g => cat === 'personal:'+g.key);

  function toast(msg) {
    toastEl.textContent = msg;
    toastEl.classList.remove('hidden');
    clearTimeout(toast._t);
    toast._t = setTimeout(() => toastEl.classList.add('hidden'), 1600);
  }

  // ============ 렌더 ============
  function renderScreen() {
    if(view.name==='coach')return window.CoachDesk.render(view,golfConfig());
    if(view.name==='golf-hub')return renderGolf();
    if (view.name === 'home') return renderHome();
    if (view.name === 'part') return renderPart(view.part);
    if (view.name === 'detail') return renderDetail(view.id);
    if (view.name === 'favorites') return renderFavorites();
    if (view.name === 'search') return renderSearch();
    if (view.name === 'calendar') return renderCalendar();
  }

  function renderGolf() {
    try {if(!window.GolfHub||!window.GolfContent)throw new Error('골프 자료 없음');GolfHub.render(view,golfConfig());}
    catch(error){app.innerHTML='<div class="scr"><h1>골프 자료를 불러오지 못했습니다</h1><p>연결을 확인한 후 새로고침해 주세요. 저장한 기록은 보존됩니다.</p><button class="btn" data-act="reload">다시 불러오기</button></div>'+tabbar('golf');}
  }
  function render() {
    const jumpToday=view.name==='part'&&view.part==='ht'&&view.htStart==='today';
    if(jumpToday){htRoutineDay=htRoutineToday();delete view.htStart;}
    const jumpRecent=view.name==='coach'&&view.coachTab==='now'&&['pt','golf'].includes(view.part)&&view.coachStart==='recent';
    if(jumpRecent)delete view.coachStart;
    const jumpStage=view.name==='coach'&&view.part==='golf'&&view.coachTab==='now'&&['backswing','downswing','impact','follow-through'].includes(view.coachStage)?view.coachStage:null;
    if(jumpStage)delete view.coachStage;
    const jumpSelector=jumpStage?'#g-stage-'+jumpStage:jumpToday?'#ht-routine-start':jumpRecent?'.coach-recent-'+view.part:null,jumpView=view;
    renderScreen();renderStorageStatus();navigation.sync(view);AppDrafts.bind(app);
    if(view.name==='detail'&&AppDrafts.has(location.hash)&&!document.getElementById('memo-input'))openMemoEditor();
    navigation.restoreScroll();updateHistoryButtons();window.dispatchEvent(new Event('ptgolf-screen-rendered'));
    if(jumpSelector)requestAnimationFrame(()=>requestAnimationFrame(()=>{
      if(view!==jumpView)return;
      const target=app.querySelector(jumpSelector);target?.setAttribute('tabindex','-1');target?.focus({preventScroll:true});target?.scrollIntoView({block:'start'});navigation.saveScroll();
    }));
  }
  function renderStorageStatus(){
    const status=Persistence.getStatus(),errors=status.stores.filter(s=>!s.ok);
    if(status.available&&!status.restorePending&&!errors.length)return;
    const banner=document.createElement('section');banner.className='storage-warning';banner.setAttribute('role','alert');
    banner.innerHTML='<strong>개인 기록을 보호하고 있습니다</strong><p>'+(status.restorePending?'이전 복원이 중단되어 추가 저장을 멈췄습니다. 이전 기록 복구를 실행할 수 있습니다.':'일부 기록을 읽거나 저장할 수 없습니다. 기존 원본은 지우지 않았습니다.')+'</p><button class="btn" data-act="recovery-copy">원본 복구 사본 보관</button>'+(status.restorePending?'<button class="btn" data-act="recover-restore">이전 기록 복구</button>':'');
    app.querySelector('.scr')?.prepend(banner);
  }
  function renderPreserving(){navigation.saveScroll();render();}
  function saveError(error){toast(error.code==='CONFLICT'?'다른 탭에서 같은 기록이 변경됐습니다. 입력 내용을 보관하고 다시 확인해 주세요.':error.code==='CORRUPT'?'저장된 기록을 읽지 못해 원본을 보호하고 있습니다.':'저장하지 못했습니다. 입력 내용은 그대로 두었습니다.');}
  function tabbar(active) {
    const personal = personalGroups();
    const personalLink = (cat,label,count) => `<a href="#pt?cat=${encodeURIComponent(cat)}"${view.name === 'part' && view.part === 'pt' && view.cat === cat ? ' aria-current="page"' : ''}>${esc(label)} <small>${count}</small></a>`;
    const personalMenu = `<section class="exercise-personal-menu"><h3>내 개인운동</h3><div class="exercise-quicklinks">${personalLink('personal','지정 종목 전체',personal.reduce((n,g)=>n+g.exercises.length,0))}${personal.map(g=>personalLink('personal:'+g.key,g.label,g.exercises.length)).join('')}</div></section>`;
    const exerciseGroups = ['pt', 'ht'].map(part => {
      const list = Store.getByPart(part);
      const link = (cat, label, count) => `<a href="#${part}?cat=${encodeURIComponent(cat)}"${view.name === 'part' && view.part === part && view.cat === cat ? ' aria-current="page"' : ''}>${esc(label)} <small>${count}</small></a>`;
      return `<section><h3>${part.toUpperCase()} 전체 운동</h3><div class="exercise-quicklinks">${link('all', '전체', list.length)}${Store.getCategories(part).map(cat => link(cat, cat, list.filter(e => e.category === cat).length)).join('')}</div></section>`;
    }).join('');
    const t = (key, ti, label) =>
      `<button class="tab ${active === key ? 'on' : ''}" data-nav="${key}"><span class="ti">${ti}</span>${label}</button>`;
    const stageNav=`<div class="golf-stage-nav" role="group" aria-label="스윙 네 구간 연습 바로가기">${[['backswing','백스윙'],['downswing','다운스윙'],['impact','임팩트'],['follow-through','팔로우']].map(([id,label])=>`<a href="#golf/now?stage=${id}" data-golf-stage="${id}">${label}</a>`).join('')}</div>`;
    return `<nav class="tabbar ${active==='golf'?'tabbar-golf':''}">
      ${t('home', '🏠', '홈')}
      ${t('pt', '🏋️', 'PT')}
      ${t('ht', '🏡', 'HT')}
      ${t('golf', '⛳', '골프')}
      ${t('favorites', '⭐', '즐겨찾기')}
      ${t('calendar', '🗓️', '캘린더')}
      ${active==='golf'?stageNav:`<details class="exercise-quicknav">
        <summary>부위별 운동 <span aria-hidden="true">⌃</span></summary>
        <div class="exercise-quickpanel" aria-label="전체 부위별 운동">${personalMenu}${exerciseGroups}</div>
      </details>
      <button class="exercise-search" type="button" data-act="exercise-search">전체 검색 <span aria-hidden="true">⌕</span></button>`}
      <div class="history-controls" aria-label="화면 이동">
        <button type="button" id="history-back" data-history="back" aria-label="이전 화면" title="이전 화면" ${navigation.index <= 0 ? 'disabled' : ''}><span aria-hidden="true">‹</span><span>뒤로</span></button>
        <button type="button" id="history-forward" data-history="forward" aria-label="다음 화면" title="다음 화면" ${navigation.index >= navigation.max ? 'disabled' : ''}><span aria-hidden="true">›</span><span>앞으로</span></button>
      </div>
    </nav>`;
  }

  function exRow(e, idx, showCat, mark) {
    const star = e.favorite ? `<span class="star">★</span>` : `<span class="chev">›</span>`;
    const metas = [
      showCat ? `<span>${partIcon(e.part)} ${esc(e.category || '')}</span>` : '',
      (e.memo && e.memo.trim()) ? `<span>✏️ 메모</span>` : ''
    ].filter(Boolean).join('');
    return `<a class="ex ${esc(e.part)}" href="#exercise/${encodeURIComponent(e.id)}" data-open="${esc(e.id)}">
      <div class="num">${idx != null ? idx + 1 : (mark || (showCat ? '🔍' : '★'))}</div>
      <div class="body">
        <div class="t">${esc(e.name)}</div>
        <div class="spec">${esc(e.spec || '')}</div>
        ${metas ? `<div class="meta">${metas}</div>` : ''}
      </div>
      ${star}
    </a>`;
  }

  function deletionRequestsHtml() {
    const requests = Store.getDeletionRequests ? Store.getDeletionRequests() : [];
    if (!requests.length) return '';
    return `<section class="deletion-queue" aria-labelledby="deletion-queue-title">
      <h2 id="deletion-queue-title">삭제 요청 <span>${requests.length}건</span></h2>
      <p>현재 기기에서는 숨겨졌습니다. 삭제만을 위한 새 버전은 만들지 않으며, 삭제 건을 대화에서 알려주시면 지정한 대상을 반영합니다.</p>
      ${requests.map(request => {
        const localOnly = request.source === 'local' || (request.kind === 'exercise' && request.contentId.startsWith('usr_'));
        return `<article class="deletion-request"><div><strong>${request.kind === 'video' ? '영상' : '동작'} · ${esc(request.title)}</strong><small>ID ${esc(request.contentId)}</small></div>
          <div class="deletion-request-actions">${localOnly ? '<span class="tag">이 기기만</span>' : `<a class="btn" href="${esc(DeletionFlow.issueUrl(request))}" target="_blank" rel="noopener noreferrer">배포 요청 보내기 ↗</a>`}
          <button type="button" class="btn ghost" data-delete-restore="${esc(request.id)}">복원</button></div></article>`;
      }).join('')}
    </section>`;
  }

  function confirmDeletion(item, onConfirm) {
    const localOnly = item.source === 'local' || (item.kind === 'exercise' && item.contentId.startsWith('usr_'));
    const next = localOnly
      ? '이 기기에서 숨깁니다. 개인 추가 동작은 배포 원본에 없으므로 중앙 요청은 만들지 않습니다.'
      : '이 기기에서 먼저 숨기고 GitHub 삭제 요청 화면을 엽니다. 삭제만을 위한 새 버전은 만들지 않으며, 삭제 건을 대화에서 알려주시면 지정한 대상을 원본에 반영합니다.';
    askConfirm(`「${item.title}」을 삭제 요청할까요? ${next}`, onConfirm, localOnly ? '이 기기에서 숨기기' : '숨기고 요청');
  }

  function openDeletionIssue(request) {
    if (request.source === 'local' || (request.kind === 'exercise' && request.contentId.startsWith('usr_'))) return false;
    const result = DeletionFlow.openIssue(request);
    toast(result.attempted ? 'GitHub 화면에서 Submit new issue를 눌러 요청을 등록해 주세요' : '홈의 삭제 요청에서 배포 요청을 열어 주세요');
    return result.attempted;
  }

  function requestExerciseDeletion(id) {
    const exercise = Store.getById(id);
    if (!exercise) return;
    const item = { kind: 'exercise', contentId: exercise.id, title: exercise.name, source: Store.isSeed(exercise.id) ? 'seed' : 'local' };
    confirmDeletion(item, () => {
      const request = Store.requestDeletion(item);
      openDeletionIssue(request);
      toast(item.source === 'local' ? '이 기기에서 숨겼습니다' : '숨김 처리 · 삭제 요청 등록을 완료해 주세요');
      if (view.name === 'detail' && view.id === id) go(exercise.part);
      else renderPreserving();
    });
  }

  const DOW = ['일', '월', '화', '수', '목', '금', '토'];
  function dateChipLabel(d) {
    const [y, m, dd] = d.split('-').map(Number);
    const w = DOW[new Date(y, m - 1, dd).getDay()];
    return `${m}/${dd} (${w})`;
  }

  /* 최근 일주일 세션 — 변동이 없으면 빈 문자열을 반환해 섹션 자체를 숨긴다 */
  function recentSectionHtml() {
    const sessions = Store.getRecentSessions(7);
    if (!sessions.length) return '';

    const dates = sessions.map(s => s.date);
    if (!dates.includes(view.recentDate)) view.recentDate = dates[0];
    const sel = sessions.find(s => s.date === view.recentDate);

    const chips = sessions.map(s => {
      const on = s.date === view.recentDate ? ' on' : '';
      const today = s.date === Store.todayStr() ? '<span class="dot-today"></span>' : '';
      return `<button class="chip${on}" data-recent="${s.date}">${today}${dateChipLabel(s.date)}
        <span class="cnt-b">${s.exercises.length}</span></button>`;
    }).join('');

    return `
      <div class="sec-t">🗓️ 최근 자료 갱신</div>
      <div class="chips recent-chips">${chips}</div>
      <div id="recent-list">${sel.exercises.map(e => exRow(e, null, true, '🗓️')).join('')}</div>`;
  }

  function renderHome() {
    const latestPT=Store.getPTSessions().slice().sort((a,b)=>b.date.localeCompare(a.date))[0];
    let latestGolf;
    try{latestGolf=window.GolfHub?.learningSources().lessons.slice().sort((a,b)=>b.date.localeCompare(a.date))[0];}catch{}
    const personalCount=personalGroups().reduce((n,g)=>n+g.exercises.length,0);
    const ptRecap=latestPT?'최근 수업 '+latestPT.date+' · '+latestPT.items.length+'종목':'배운 동작과 자세 핵심';
    const golfTitle=latestGolf&&(window.GolfContent?.lessons.includes(latestGolf)?latestGolf.quickReview?.title:null)||latestGolf?.title;
    app.innerHTML = `
      <div class="scr home-simple">
        <div class="hd"><h1>PT노트</h1><div class="hd-meta"><span class="app-version" aria-label="앱 버전">ver${esc(window.PTGolfRelease?.displayVersion || '1.0')}</span><div class="date">${Store.todayStr().replace(/-/g, ' · ')}</div></div></div>
        <nav class="parts home-destinations" aria-label="지금 필요한 운동과 연습">
          <section class="home-destination pt" aria-label="PT 복습">
            <a class="part pt" href="#pt/now?start=recent"><span class="home-part-label">PT</span><div class="home-action"><h2>최근 운동 복습</h2><span aria-hidden="true">›</span></div><p>${esc(ptRecap)}</p></a>
            <div class="home-links"><a href="#pt?cat=personal">개인운동 ${personalCount}종목</a><a href="#pt?cat=all">전체 운동</a></div>
          </section>
          <section class="home-destination ht" aria-label="HT 개인운동">
            <a class="part ht" href="#ht?start=today"><span class="home-part-label home-ht-label"><span>HT</span><span data-home-ht-today>${esc(homeHtTodayLabel())}</span></span><div class="home-action"><h2>개인운동 루틴</h2><span aria-hidden="true">›</span></div><p>월·화·목·금 · 기본 20분 + 근력 40분</p></a>
          </section>
          <section class="home-destination golf" aria-label="골프 연습">
            <a class="part golf" href="#golf/now?start=recent"><span class="home-part-label">골프</span><div class="home-action"><h2>최근 레슨 복습</h2><span aria-hidden="true">›</span></div><p>편한 스윙과 일관성</p></a>
            <div class="home-links home-lesson">${latestGolf?`<a href="#golf/lessons/${encodeURIComponent(latestGolf.id)}"><small>최근 레슨 · ${esc(latestGolf.date)}</small><span>${esc(golfTitle)} ›</span></a>`:'<a href="#golf/lessons">레슨 모아보기</a>'}</div>
          </section>
        </nav>
        ${deletionRequestsHtml()}
      </div>
      ${tabbar('home')}`;
  }

  function ptSessionItemHtml(item) {
    return '<article class="pt-session-item"><h3>'+esc(item.title)+'</h3><p class="g-meta">수업 '+esc(item.range)+'</p><ul>'+item.points.map(x=>'<li>'+esc(x)+'</li>').join('')+'</ul><p class="g-meta">'+esc(item.uncertainty)+'</p>'+(item.exerciseId?'<a class="btn ghost" href="#exercise/'+esc(item.exerciseId)+'">동작·이미지·3D 보기 ›</a>':'<span class="tag">동작 종류 확인 대기</span>')+'</article>';
  }
  function ptSessionHtml(id) {
    if(id)return (Store.getExerciseSessions?.(id)||[]).map(s=>'<section class="pt-session-note"><h2>'+esc(s.date)+' PT 수업 보강</h2>'+ptSessionItemHtml({...s.item,exerciseId:null}).replace('<span class="tag">동작 종류 확인 대기</span>','')+'<details><summary>수업 근거</summary><p>'+esc(s.source)+'</p><p>'+esc(s.evidence)+'</p></details></section>').join('');
    return (Store.getPTSessions?.()||[]).map(s=>'<details class="pt-session-note"><summary><strong>'+esc(s.date)+' PT 수업 · '+esc(s.title)+'</strong></summary>'+'<div class="pt-session-links">'+s.items.map(item=>item.exerciseId?'<a href="#exercise/'+esc(item.exerciseId)+'"><strong>'+esc(item.title)+'</strong><small>'+esc(item.points[0])+'</small></a>':'<div><strong>'+esc(item.title)+'</strong><small>명칭 확인 대기 · 수업 정리에서 내용 보기</small></div>').join('')+'</div>'+window.CoachDesk.sessionDetails(s)+'</details>').join('');
  }
  // Reviewed transition plan (2026-10-20). Links keep the existing PT IDs and records.
  let htRoutineDay = null, htRoutineDate = '';
  function htRoutineToday() {
    const now=new Date();
    const date=[now.getFullYear(),now.getMonth(),now.getDate()].join('-');
    const id=['sun','mon','tue','wed','thu','fri','sat'][now.getDay()];
    if(date!==htRoutineDate){htRoutineDate=date;htRoutineDay=id;}
    return id;
  }
  function homeHtTodayLabel() {
    const day=htRoutineDays.find(d=>d.id===htRoutineToday());
    return '오늘 '+day.label.replace(' · ','요일 · ');
  }
  // Refresh on return after midnight; same-day manual selections stay selected.
  function refreshHtRoutineDate() {
    const previous=htRoutineDate;
    htRoutineToday();
    const section=app.querySelector('#ht-routine');
    if(section&&previous!==htRoutineDate){section.outerHTML=htRoutineHtml();AppDrafts.bind(app);}
    const homeToday=app.querySelector('[data-home-ht-today]');
    if(homeToday){homeToday.textContent=homeHtTodayLabel();app.querySelector('.home-simple .date').textContent=Store.todayStr().replace(/-/g,' · ');}
  }
  window.addEventListener('focus',refreshHtRoutineDate);
  document.addEventListener('visibilitychange',()=>{if(!document.hidden)refreshHtRoutineDate();});
  const htRoutineDays = [
    {id:'mon',label:'월 · 상체',title:'상체 A · 랫풀다운',ids:['pt_dbpullover','pt_chestpress','pt_seatedrow','pt_latpulldown','pt_pecdeck','pt_pushdown']},
    {id:'tue',label:'화 · 하체',title:'하체 A · 양발 기본',ids:['pt_legcurl','pt_legextension','pt_adduction','pt_legpress']},
    {id:'wed',label:'수 · 휴식',title:'수요일 · 휴식일',rest:true,ids:[]},
    {id:'thu',label:'목 · 상체',title:'상체 B · 보조 풀업',ids:['pt_dbpullover','pt_pullup','pt_chestpress','pt_seatedrow','pt_pecdeck','pt_low_cable_curl']},
    {id:'fri',label:'금 · 하체',title:'하체 B · 같은 자세로 반복',ids:['pt_legcurl','pt_legextension','pt_adduction','pt_legpress']},
    {id:'sat',label:'토 · 휴식',title:'토요일 · 휴식일',rest:true,ids:[]},
    {id:'sun',label:'일 · 휴식',title:'일요일 · 휴식일',rest:true,ids:[]}
  ];
  const htRoutineBasic = [
    ['pt_openbook','오픈북','3–6분','좌우 각 3–5회','팔만 벌리지 않고 가슴 회전'],
    ['pt_tailbone_raise','레그레이즈','6–10분','8–12회 × 1–2세트','꼬리뼈·골반 통제 유지'],
    ['pt_hip_openclose_stretch','고관절 오픈·클로즈','10–13분','좌우 각 8–10회','배운 지지 자세 유지'],
    ['pt_wide_sidelunge_stretch','와이드 사이드 런지','13–16분','좌우 각 6–8회','발바닥 지지 · 편한 범위'],
    ['pt_lunge_ball_rotation','런지 자세 공 들고 몸통 회전','16–20분','좌우 각 8–10회','하체 지지 · 팔로만 휘두르지 않기']
  ];
  const htRoutineStrength = {
    pt_dbpullover:['덤벨 풀오버','12–15회','골반을 고정하고 손바닥으로 무게를 받치며 천천히 넘기기'],
    pt_chestpress:['체스트 프레스','10–15회','가슴이 유지되고 어깨가 말리지 않는 깊이까지만'],
    pt_seatedrow:['시티드로우','10–15회','뻗고 당길 때 어깨가 들리지 않는 범위'],
    pt_latpulldown:['랫풀다운','10–15회','가슴부터 세팅 · 몸을 뒤로 젖혀 당기지 않기'],
    pt_pullup:['보조 풀업','6–10회','자세를 지킬 수 있는 보조량 · 어깨 들림 전 종료'],
    pt_pecdeck:['펙덱 플라이','12–15회','가슴·어깨 위치 유지 · 과하게 벌리지 않기'],
    pt_pushdown:['케이블 푸시다운','10–15회','팔꿈치 위치 유지 · 몸무게로 누르지 않기'],
    pt_low_cable_curl:['로우 케이블 컬','10–15회','낮은 풀리·언더그립 · 몸통 반동 없이'],
    pt_legpress:['레그 프레스','15–20회','배운 와이드 스탠스 · 골반이 말리기 전까지'],
    pt_legcurl:['라잉 레그 컬','10–15회','골반을 패드에 유지 · 허리 꺾지 않기'],
    pt_legextension:['레그 익스텐션','10–15회','양발 함께 · 골반을 고정하고 반동 없이'],
    pt_adduction:['이너타이','12–15회','반동 없이 모으고 천천히 벌리기']
  };
  function htRoutineLink(id,label) {
    return Store.getById(id) ? '<a href="#exercise/'+encodeURIComponent(id)+'">'+esc(label)+' ›</a>' : '<span>'+esc(label)+' · 현재 목록에서 제외됨</span>';
  }
  function htRoutineHtml() {
    const today=htRoutineToday();
    const todayLabel=htRoutineDays.find(d=>d.id===today).label;
    const day=htRoutineDays.find(d=>d.id===htRoutineDay)||htRoutineDays[0];
    const lower=day.ids.length===4;
    const times=lower?['25–33분','33–41분','41–46분','46–56분']:['20–25분','25–33분','33–41분','41–49분','49–54분','54–60분'];
    return `<section class="ht-routine" id="ht-routine" aria-labelledby="ht-routine-title">
      <div class="ht-routine-heading"><h2 id="ht-routine-title">주 4일 · 60분 개인운동</h2><a href="#ht?cat=${encodeURIComponent(view.cat||'all')}" data-ht-library>HT 운동 목록 ↓</a></div>
      <p class="ht-routine-note">기본 20분 + 근력 40분 · 지정 16종목 + 풀오버 · 코치 확정 전 검토안</p>
      <p class="ht-routine-today">오늘 ${todayLabel}${day.id!==today?' <button type="button" data-ht-day="'+today+'">오늘로 돌아가기</button>':''}</p>
      <div class="ht-routine-basic" id="ht-routine-basic" tabindex="-1"><h3>운동일 기본운동 <small>0–20분</small></h3>
      <p class="ht-routine-note">${day.rest?'선택한 요일은 휴식일입니다. 아래 기본운동은 필요할 때만 가볍게 참고하세요.':'0–3분 가볍게 걷기 → 아래 순서. 본운동 전 준비용 분량입니다.'}</p>
      <ol class="ht-routine-list">${htRoutineBasic.map(([id,name,time,dose,cue])=>`<li><div><span class="ht-routine-time">${time}</span>${htRoutineLink(id,name)}</div><strong>${dose}${id==='pt_tailbone_raise'?'':' × 1세트'}</strong><p>${cue}</p></li>`).join('')}</ol></div>
      <div class="ht-routine-start" id="ht-routine-start" tabindex="-1"><button type="button" data-ht-basic>기본운동 20분 보기 ↑</button></div>
      <div class="ht-routine-days" role="group" aria-label="운동 요일">${htRoutineDays.map(d=>`<button type="button" data-ht-day="${d.id}" aria-pressed="${d.id===day.id}" aria-controls="ht-routine-day" aria-label="${d.label.replace(' · ','요일 · ')}${d.id===today?' · 오늘':''}" ${d.id===today?'aria-current="date"':''}><span class="ht-routine-weekday">${d.label.split(' · ')[0]}</span><span class="ht-routine-kind">${d.label.split(' · ')[1]}</span></button>`).join('')}</div>
      <div id="ht-routine-day" aria-live="polite">${day.rest?`<h3>${day.title}</h3><p class="ht-routine-note">예정된 근력운동이 없습니다. 휴식하거나 가볍게 걸으세요. 다른 요일을 선택하면 해당 운동을 볼 수 있습니다.</p>`:`<h3>${day.title} <small>20–60분</small></h3>
      <p class="ht-routine-note">${day.ids.length}종목${lower?' · 양발 기본':''} · 각 2세트 · 좋은 자세로 2–3회 더 할 여유</p>
      ${lower?'<p class="ht-routine-note">20–25분: 레그 컬 준비세트 1–2회</p>':''}
      <ol class="ht-routine-list">${day.ids.map((id,i)=>{const item=htRoutineStrength[id],target=lower&&['pt_legcurl','pt_legextension','pt_legpress'].includes(id)?20:null;return `<li><div><span class="ht-routine-time">${times[i]}</span>${htRoutineLink(id,item[0])}</div><strong>${target!==null?target+'kg · 20회':item[1]} × 2세트</strong><p>${item[2]}</p></li>`;}).join('')}</ol>
      <p class="ht-routine-note">준비세트·휴식·이동을 포함한 시간입니다. 일찍 끝나면 종료해도 됩니다.</p>`}</div>
      <div class="ht-routine-rules"><h3>운영 기준</h3><ul>
      <li><b>휴식:</b> 체스트·레그 프레스, 로우, 랫풀다운, 풀업은 90–120초. 나머지는 60–90초.</li>
      <li><b>준비:</b> 첫 기구는 가볍게 1–2세트, 다른 패턴도 필요하면 1세트. 본세트에는 포함하지 않습니다.</li>
      <li><b>증량:</b> 같은 운동 2회 연속 모든 세트를 반복 범위 상단까지 같은 자세·여유로 완료하면 최소 단위로 올립니다. 풀업은 보조량을 줄입니다.</li>
      <li><b>회복:</b> 수·토·일 휴식 또는 가벼운 걷기. PT 수업이 있는 주에는 해당 부위 개인운동을 대체·감량합니다.</li></ul></div>
      <div class="ht-routine-checks"><h3>혼자 할 때 확인 3가지</h3><ol><li>기구와 중량을 혼자 설정했는가?</li><li>어깨 들림·가슴 무너짐·골반 들림 전에 멈췄는가?</li><li>어려웠던 동작과 다음에 물어볼 점이 분명한가?</li></ol><p class="ht-routine-note">관절 통증이 생기면 해당 운동을 멈춥니다. 각 운동을 누르면 기존 자세 설명·메모로 연결됩니다.</p></div>
      <details class="ht-routine-reference"><summary>분량 조절·참고 자료</summary>
      <p>기본운동은 기존 수업 기록을 바꾸지 않고 주 4회 준비용으로 낮춘 분량입니다. 미리 지치면 반복을 줄이세요. 기구 대기로 늦어지면 마지막 보조운동의 2번째 세트를 줄이고 휴식을 억지로 줄이지 않습니다.</p>
      <p>각 운동 2세트를 유지하며 2–3주간 시간·자세·회복을 확인합니다. 확보한 시간은 준비세트·휴식·자세 확인에 사용합니다. 코치에게 시작 중량·풀업 보조량과 어깨·종아리·고관절 펴기 운동의 추가 필요성을 확인하세요.</p>
      <p><a href="https://acsm.org/resistance-training-guidelines-update-2026/" target="_blank" rel="noopener noreferrer">ACSM 2026 지침</a> · 꾸준한 주 2회 부위 훈련, 매번 실패까지 할 필요 없음. 정확한 시간·세트는 사용자의 조건에 맞춘 제안입니다.</p>
      <p><a href="https://www.youtube.com/watch?v=_Toaey7nA3A" target="_blank" rel="noopener noreferrer">Jeff Nippard · 상체 구성</a> · <a href="https://jeffnippard.com/products/upper-lower-size-and-strength-program" target="_blank" rel="noopener noreferrer">공식 설명</a>의 상·하체 분할 참고. 중·상급자 훈련량은 그대로 적용하지 않습니다.</p>
      <p><a href="https://www.youtube.com/watch?v=_95-vz83X4M" target="_blank" rel="noopener noreferrer">E3 Rehab · 레그 익스텐션</a> · <a href="https://e3rehab.com/how-to-perform-leg-extensions/" target="_blank" rel="noopener noreferrer">제작자 설명문</a>의 기구 설정·반동 없는 동작 참고. 기존 PT 자세·범위를 우선합니다.</p>
      <p>2026-10-20 검토 · 공식 문서·영상 공개 정보 확인. 전체 음성 검토는 아닙니다.</p></details>
    </section>`;
  }

  function renderPart(part) {
    if(part==='golf'){view={...view,name:'golf-hub',golfTab:'lessons',golfId:null};return renderGolf();}
    const list = Store.getByPart(part);
    const cats = Store.getCategories(part);
    const activeCat = view.cat === 'all' || cats.includes(view.cat) || (part === 'pt' && personalCat(view.cat)) ? view.cat : (cats[0] || null);
    view.cat = activeCat;
    const personal = personalGroups(), isPersonal = part === 'pt' && personalCat(activeCat);
    const personalCount = personal.reduce((n,g)=>n+g.exercises.length,0);
    const personalChip = part === 'pt' ? `<button class="chip ${isPersonal ? 'on' : ''}" data-cat="personal">내 개인운동 ${personalCount}</button>` : '';

    const chips = personalChip + `<button class="chip ${activeCat === 'all' ? 'on' : ''}" data-cat="all">전체 ${list.length}</button>` + cats.map(c =>
      `<button class="chip ${c === activeCat ? 'on' : ''}" data-cat="${esc(c)}">${esc(c).split(' · ').join('<br>')}</button>`).join('');

    const inCat = activeCat === 'all' ? list : list.filter(e => e.category === activeCat);
    const rows = isPersonal
      ? `<section class="personal-exercises"><h2>내 개인운동</h2><p class="personal-plan-note">지정한 종목 모음 · <a href="#ht">주 4회 HT 루틴 보기 ›</a></p><div class="chips"><button class="chip ${activeCat === 'personal' ? 'on' : ''}" data-cat="personal">전체 ${personalCount}</button>${personal.map(g=>`<button class="chip ${activeCat === 'personal:'+g.key ? 'on' : ''}" data-cat="personal:${g.key}">${g.label} ${g.exercises.length}</button>`).join('')}</div>${personal.filter(g=>activeCat==='personal'||activeCat==='personal:'+g.key).map(g=>`<section class="personal-exercise-group"><h3>${g.label} <small>${g.exercises.length}</small></h3>${g.exercises.length ? `<div class="pt-exercise-grid">${g.exercises.map((e,i)=>exRow(e,i)).join('')}</div>` : '<p class="personal-plan-note">현재 표시할 지정 종목이 없습니다. 전체 운동에서 다른 종목을 찾아보세요.</p>'}</section>`).join('')}</section>`
      : inCat.length
      ? `<div class="pt-exercise-grid">${inCat.map((e, i) => exRow(e, i, activeCat === 'all')).join('')}</div>`
      : `<div class="empty">아직 표시할 동작이 없어요.<br>숨긴 동작은 홈의 삭제 요청에서 복원할 수 있어요.</div>`;

    app.innerHTML = `
      <div class="scr" data-part="${part}">
        <div class="hd"><h1>${partIcon(part)} ${esc(partLabel(part))}</h1>
          <button class="hd-search" data-act="search-focus" aria-label="동작 검색">🔍</button></div>
        ${part==='pt'?'<nav class="coach-tabs"><a href="#pt/now">지금 할 것</a><a href="#pt/standards">보관 기록</a></nav><details class="coach-fold"><summary>PT 수업 기록</summary>'+ptSessionHtml()+'</details>':''}
        ${part==='ht'?htRoutineHtml()+'<h2 class="ht-library-title" id="ht-library-title" tabindex="-1">HT 운동 모아보기</h2>':''}
        ${isPersonal ? `<a class="personal-all-link" href="#pt?cat=all">PT 전체 운동 ${list.length}개 보기 ›</a>` : cats.length ? `<div class="chips">${chips}</div>` : ''}
        ${rows}
      </div>
      ${tabbar(part)}`;
  }

  function renderFavorites() {
    const favs = Store.getFavorites();
    const rows = favs.length
      ? favs.map(e => exRow(e, null)).join('')
      : `<div class="empty">즐겨찾기한 동작이 없어요.<br>동작 상세에서 ☆ 를 눌러 추가하세요.</div>`;
    app.innerHTML = `
      <div class="scr">
        <div class="hd"><h1>⭐ 즐겨찾기</h1>
          <button class="hd-search" data-act="search-focus" aria-label="동작 검색">🔍</button></div>
        ${rows}
      </div>
      ${tabbar('favorites')}`;
  }

  function renderCalendar() {
    const now = new Date();
    const year  = view.calYear  ?? now.getFullYear();
    const month = view.calMonth ?? now.getMonth();
    view.calYear = year; view.calMonth = month;

    const cal   = Store.getCalendar();
    const today = Store.todayStr();
    const p2    = n => String(n).padStart(2, '0');

    const firstDow = new Date(year, month, 1).getDay();   // 0=일
    const lastDate = new Date(year, month + 1, 0).getDate();

    let cells = '';
    for (let i = 0; i < firstDow; i++) cells += '<div class="cal-cell empty"></div>';
    for (let d = 1; d <= lastDate; d++) {
      const ds    = `${year}-${p2(month + 1)}-${p2(d)}`;
      const entry = cal[ds] || {};
      const dow   = new Date(year, month, d).getDay();
      const timeLabel = entry.scheduled && entry.schedTime
        ? `<span class="cal-time">${entry.schedTime}시</span>` : '';
      const dots = (entry.scheduled ? '<span class="dot sched"></span>' : '') +
                   (entry.completed ? '<span class="dot done"></span>'  : '') +
                   (entry.rest      ? '<span class="dot rest"></span>'  : '');
      cells += `<button type="button" aria-label="${ds}${entry.scheduled ? ' 예약' : ''}${entry.completed ? ' 실시' : ''}${entry.rest ? ' 휴무' : ''}" class="cal-cell${ds === today ? ' today' : ''}${dow === 0 ? ' sun' : ''}${dow === 6 ? ' sat' : ''}" data-cal-date="${ds}">
        <span class="cal-dn">${d}</span>
        ${timeLabel}
        <span class="cal-dots">${dots}</span>
      </button>`;
    }

    app.innerHTML = `
      <div class="scr">
        <div class="hd"><h1>🗓️ 캘린더</h1></div>
        <div class="cal-nav">
          <button class="cal-nav-btn" data-cal-nav="-1" aria-label="이전 달">‹</button>
          <span class="cal-month-lbl">${year}년 ${month + 1}월</span>
          <button class="cal-nav-btn" data-cal-nav="1" aria-label="다음 달">›</button>
        </div>
        <div class="cal-dow">
          <span class="sun">일</span><span>월</span><span>화</span>
          <span>수</span><span>목</span><span>금</span><span class="sat">토</span>
        </div>
        <div class="cal-grid">${cells}</div>
        <div class="cal-legend">
          <span><span class="dot sched"></span> 예약일</span>
          <span><span class="dot done"></span> 실시일</span>
          <span><span class="dot rest"></span> 휴무일</span>
        </div>
      </div>
      ${tabbar('calendar')}`;
  }

  function searchResultsHtml(q) {
    if(!(q||'').trim())return '<div class="empty">운동·영상·레슨·내 메모를 한 번에 검색하세요.<br>여러 단어는 모두 포함된 결과를 찾습니다.</div>';
    const all=AppSearch.records(q),res=all.filter(r=>!view.scope||view.scope==='all'||r.type===view.scope);
    return '<p class="sec-t" role="status">검색 결과 '+res.length+'개 · 전체 '+all.length+'개</p>'+res.map(r=>
      '<a class="search-result" href="'+esc(r.href)+'"><span class="tag">'+esc(AppSearch.labels[r.type]||r.type)+'</span><strong>'+esc(r.title)+'</strong><p>'+esc((r.excerpt||'').slice(0,180))+'</p><small>일치: '+esc((r.matchedFields||[]).join(' · '))+'</small></a>').join('')+(res.length?'':'<p class="empty">다른 검색어나 범위를 선택해 주세요.</p>');
  }
  function renderSearch() {
    const q=view.q||'';
    app.innerHTML='<div class="scr"><button class="back" data-nav="home">‹ 홈</button><h1>전체 검색</h1>'+
      '<input class="search" type="search" data-no-draft id="search-input" aria-label="검색어" placeholder="운동·영상·레슨·메모 검색" value="'+esc(q)+'" autocomplete="off">'+
      '<div class="chips" aria-label="검색 범위">'+Object.entries({all:'전체',...AppSearch.labels}).map(([key,label])=>'<button class="chip '+((view.scope||'all')===key?'on':'')+'" data-scope="'+key+'" aria-pressed="'+((view.scope||'all')===key)+'">'+label+'</button>').join('')+
      '</div><div id="search-results">'+searchResultsHtml(q)+'</div></div>'+tabbar(null);
    const inp=document.getElementById('search-input');
    inp.oninput=()=>{view.q=inp.value;navigation.sync(view);document.getElementById('search-results').innerHTML=searchResultsHtml(view.q);};
  }

  // 원문·개인 메모와 분리한 운동별 시각 안내.
  const expanded3D = new Set();
  function focusHtml(e) {
    return e.focus ? `<div class="focus-box ${e.part === 'golf' ? 'golf' : ''}">
      <div class="focus-muscle">🎯 ${esc(e.focus.muscle)}</div>
      <div class="focus-line"><span class="fk">움직임</span>${esc(e.focus.move)}</div>
      <div class="focus-line"><span class="fk">느낌</span>${esc(e.focus.feel)}</div>
    </div>` : '';
  }
  function gripGuideHtml(e) {
    const guide = e.gripGuide;
    if (!guide?.options?.length) return '';
    const options = guide.options.map(option => `
      <article class="grip-card ${option.id === guide.sessionId ? 'is-session' : ''}" data-grip-id="${esc(option.id)}">
        <div class="grip-card-head"><h3>${esc(option.label)}</h3><span class="grip-badge">${esc(option.badge)}</span></div>
        <dl class="grip-facts">
          <div><dt>폭</dt><dd>${esc(option.width)}</dd></div>
          <div><dt>손바닥</dt><dd>${esc(option.palm)}</dd></div>
          <div><dt>근육</dt><dd>${esc(option.muscles)}</dd></div>
        </dl>
        <p>${esc(option.detail)}</p>
        <p class="grip-caution">${esc(option.caution)}</p>
      </article>`).join('');
    const orientations = (guide.orientations || []).map(item => `
      <div class="grip-orientation-item">
        <strong>${esc(item.name)}</strong><span>${esc(item.position)}</span>
        <p>${esc(item.note)}</p>
      </div>`).join('');
    return `<section class="grip-guide" aria-label="${esc(guide.title)}">
      <div class="grip-guide-head"><span aria-hidden="true">✋</span><h2>${esc(guide.title)}</h2></div>
      <p class="grip-summary">${esc(guide.summary)}</p>
      <p class="grip-common">${esc(guide.common)}</p>
      <div class="grip-grid">${options}</div>
      ${orientations ? `<div class="grip-orientations" aria-label="손바닥 방향 참고">
        <h3>손바닥 방향 참고</h3><div class="grip-orientation-list">${orientations}</div>
        <p class="grip-orientation-note">${esc(guide.orientationNote)}</p>
      </div>` : ''}
      <p class="grip-evidence">${esc(guide.evidence)}</p>
    </section>`;
  }
  function pushdownMediaHtml() {
    const base = 'samples/pushdown-3d/';
    return `<section class="pushdown-guide" aria-label="케이블 푸시다운 2컷 안내">
      <div class="guide-pair">
        <figure class="guide-shot">
          <div class="guide-shot-title"><b>준비</b> 몸과 팔꿈치 고정</div>
          <img src="${base}combined-start.png?v=${ASSET_VER}" alt="팔꿈치를 몸 옆에 고정하고 손잡이를 잡은 준비 자세" decoding="async">
          <figcaption>상체를 살짝 숙이고<br>팔꿈치를 몸 옆에.<small>가슴·골반을 고정하고 케이블 장력을 받습니다.</small></figcaption>
        </figure>
        <figure class="guide-shot">
          <div class="guide-shot-title"><b>팔 펴기</b> 삼두의 조임</div>
          <img src="${base}combined-end.png?v=${ASSET_VER}" alt="팔꿈치는 같은 자리에 두고 팔을 아래로 편 자세, 삼두근을 붉게 표시" decoding="async">
          <figcaption>몸통은 그대로,<br>팔을 아래로 펴세요.<small>돌아올 때도 천천히 장력을 버팁니다.</small></figcaption>
        </figure>
      </div>
    </section>
    <details class="exercise-3d">
      <summary>입체로 자세 보기</summary>
      <div class="exercise-3d-content"></div>
    </details>`;
  }
  const selectedTrainingMedia = new Map();
  function currentExerciseMedia(id) {
    const entry=window.ExerciseMedia?.[id];
    return entry?.variants?.find(v=>v.id===selectedTrainingMedia.get(id)) || entry?.variants?.[0] || entry;
  }
  function exerciseVisualHtml(e) {
    const entry=window.ExerciseMedia[e.id],media=currentExerciseMedia(e.id);
    if(!entry.variants)return focusHtml({...e,focus:e.focus||media.focus})+exerciseMediaHtml(e);
    const selector=entry.variants ? `<div class="training-media-selector"><label for="training-movement">영상 속 동작 선택</label><select id="training-movement" data-no-draft>${entry.variants.map(v=>`<option value="${esc(v.id)}" ${v.id===media.id?'selected':''}>${esc(v.name)}</option>`).join('')}</select></div>` : '';
    return selector+`<div class="training-media-content">${focusHtml({...e,focus:e.focus||media.focus})+exerciseMediaHtml(e)}</div>`;
  }
  function bindExerciseMedia(id) {
    bindExercise3D(id);
    const selector=app.querySelector('#training-movement');
    if(selector)selector.addEventListener('change',()=>{
      selectedTrainingMedia.set(id,selector.value);
      const e=Store.getById(id),media=currentExerciseMedia(id);
      app.querySelector('.training-media-content').innerHTML=focusHtml({...e,focus:e.focus||media.focus})+exerciseMediaHtml(e);
      bindExercise3D(id);
    });
  }
  function exerciseMediaHtml(e) {
    if (e.id === 'pt_pushdown') return pushdownMediaHtml();
    const media = currentExerciseMedia(e.id);
    if (!media) return '';
    return `<section class="exercise-guide" aria-label="${esc(media.name)} 2컷 안내">
      <div class="guide-pair">${media.images.map((src, i) => `
        <figure class="guide-shot">
          <div class="guide-shot-title"><b>${i ? '동작' : '준비'}</b>${esc(media.captions[i])}</div>
          <img src="${esc(src)}?v=${ASSET_VER}" alt="${esc(media.name)} · ${esc(media.captions[i])}" decoding="async">
          <figcaption>${esc(media.notes[i])}</figcaption>
        </figure>`).join('')}</div>
    ${media.visualNote ? `<p class="g-meta">${esc(media.visualNote)}</p>` : ''}</section><details class="exercise-3d"><summary>입체로 자세 보기</summary><div class="exercise-3d-content"></div></details>`;
  }
  function bindExercise3D(id) {
    const media=currentExerciseMedia(id),key=id+':'+(media?.id||id);
    const details = app.querySelector('.exercise-3d');
    if (!details) return;
    const load = () => {
      if (!details.open) { expanded3D.delete(key); details.querySelector('.exercise-3d-content').replaceChildren(); return; }
      expanded3D.add(key);
      if (details.querySelector('iframe')) return;
      const frame = document.createElement('iframe');
      frame.className = 'exercise-3d-frame';
      frame.title = (media.name || Store.getById(id)?.name || '운동') + ' 회전형 3D 자세 안내';
      const source = media.viewer;
      const versionedSource = source + (source.includes('?') ? '&' : '?') + 'v=' + ASSET_VER;
      frame.src = versionedSource + '&autoplay=1';
      details.querySelector('.exercise-3d-content').append(frame);
    };
    details.addEventListener('toggle', load);
    if (expanded3D.has(key)) { details.open = true; load(); }
  }
  window.addEventListener('message', ev => {
    const frame = app.querySelector('.exercise-3d-frame');
    if (!frame || ev.origin !== location.origin || ev.source !== frame.contentWindow ||
        ev.data?.type !== 'ptgolf-viewer-height' || !Number.isFinite(ev.data.height)) return;
    frame.style.height = `${Math.max(320, Math.min(1400, Math.ceil(ev.data.height)))}px`;
  });
  function openExerciseLink(){const next=AppNavigation.fromHash(location.hash);go(next.name,{...next,__historyMode:'replace'});return true;}

  function trainingVideoHtml(e) {
    const videos=[e.sourceVideo,...e.supplementaryVideos||[]].filter(v=>v && /^[A-Za-z0-9_-]{11}$/.test(v.youtubeId));
    return videos.map((video,i)=>{
      const url='https://www.youtube.com/shorts/'+video.youtubeId;
      return '<section class="training-video" aria-label="'+(i?'보강 운동 영상':'원본 운동 영상')+'"><h2>▶ '+(i?'보강 영상':'원본 영상')+'</h2><h3>'+esc(video.title)+'</h3>'+
        '<p class="training-meta">'+esc(video.channel)+' · '+esc(video.durationSeconds)+'초 · 공개 '+esc(video.publishedAt)+'</p>'+
        '<div class="training-player"><button class="btn primary" data-act="training-play" data-video="'+video.youtubeId+'">영상 재생</button></div>'+
        '<a class="btn ghost" href="'+url+'" target="_blank" rel="noopener noreferrer">YouTube에서 보기 ↗</a>'+
        (video.points?.length?'<ul>'+video.points.map(p=>'<li>'+esc(p)+'</li>').join('')+'</ul>':'')+
        '<details class="training-evidence"><summary>출처와 확인 범위</summary><p>'+esc(video.evidence)+'</p><p>확인 '+esc(video.verifiedAt)+' · 앱 등록 '+esc(video.registeredAt.slice(0,10))+'</p></details></section>';
    }).join('');
  }
  function relatedTrainingHtml(e) {
    const related=Store.getRelatedExercises(e.id);
    if(!related.length)return '';
    const label=e.part==='ht'?'PT에서 함께 보기':'HT에서 함께 보기';
    return '<section class="training-related" aria-label="'+label+'"><h2>'+label+'</h2>'+related.map(({exercise,reason})=>
      '<div>'+exRow(exercise,null,true,exercise.part==='ht'?'🏡':'🏋️')+'<p class="training-reason">'+esc(reason)+'</p></div>').join('')+'</section>';
  }
  function renderDetail(id) {
    const e = Store.getById(id);
    if (!e) { go('home'); return; }
    const isGolf = e.part === 'golf';
    const mediaEntry = !isGolf ? window.ExerciseMedia?.[e.id] : null;
    const mediaPending = !!mediaEntry?.pending;
    const hasMedia = !!mediaEntry && !mediaPending;
    const c = checks[id] || (checks[id] = new Set());

    const cues = (e.cues || []).map((cue, i) => `
      <label class="check ${c.has(i) ? 'done' : ''}"><input type="checkbox" data-no-draft data-cue="${i}" ${c.has(i) ? 'checked' : ''}><span class="ctxt">${esc(cue)}</span></label>`).join('');

    const reminders = (e.reminders || []).filter(r => r.trim()).map(r =>
      `<div class="remind"><span class="b">•</span><div>${esc(r)}</div></div>`).join('');

    const pr = Store.getPrinciple(e.part, e.category);
    const prBlock = pr ? `
      <div class="block">
        <div class="block-h ${isGolf ? 'golf' : ''}">📌 ${esc(pr.title)}</div>
        <ul class="principle">${(pr.items || []).map(i => `<li>${esc(i)}</li>`).join('')}</ul>
        ${(pr.reminders && pr.reminders.length) ? pr.reminders.map(r =>
          `<div class="remind"><span class="b">•</span><div>${esc(r)}</div></div>`).join('') : ''}
      </div>` : '';

    const memo = (e.memo && e.memo.trim());
    app.innerHTML = `
      <div class="scr" data-part="${e.part}">
        <button class="back" data-back>‹ ${esc(e.category || partLabel(e.part))}</button>
        <h1 class="d-title">${esc(e.name)}</h1>${isGolf ? '<div class="personal-note-label"><strong>개인 연습 감각 · 확인 전</strong><p>혼자 연습하며 느낀 기록입니다. 정답으로 단정하지 않고 레슨 및 원본 영상과 비교해 확인하세요.</p></div>' : ''}
        <div class="d-tags">
          <button class="tag cat link ${isGolf ? 'golf' : ''}" data-catnav="${esc(e.part)}::${esc(e.category || '')}">${partIcon(e.part)} ${esc(partLabel(e.part))} · ${esc(e.category || '')} ›</button>
          ${e.updated ? `<span class="tag">갱신 ${esc(e.updated.slice(5).replace('-', '/'))}</span>` : ''}
          <div class="d-actions">
            <button class="icon-btn fav ${e.favorite ? 'on' : ''}" data-act="fav" title="즐겨찾기">${e.favorite ? '★' : '☆'}</button>
            <button class="icon-btn edit-text" data-act="edit" title="수정" aria-label="동작 수정">✏️ 수정</button>
          </div>
        </div>

        ${isGolf ? '<div class="g-actions"><a class="g-link" href="#golf/notes">스윙 노트 목록</a><button class="g-btn" data-g="jump-related">관련 레슨·영상 바로 보기 ↓</button></div>' : ''}

        ${e.part==='pt'?'<nav class="coach-shortcuts"><button class="btn ghost" data-act="memo-top">메모·질문 남기기</button></nav>':''}
        ${e.part==='pt'?ptSessionHtml(e.id):''}
        ${trainingVideoHtml(e)}
        ${hasMedia ? '' : focusHtml(e)}

        ${(e.steps && e.steps.length) ? `<div class="steps-flow ${isGolf ? 'golf' : ''}">
          ${e.steps.map(s => `<span class="step">${esc(s)}</span>`).join('<span class="sep">›</span>')}
        </div>` : ''}

        ${e.spec ? `<div class="spec-box ${isGolf ? 'golf' : ''}">
          <div><div class="k">핵심</div><div class="v">${esc(e.spec)}</div></div>
        </div>` : ''}

        ${(e.prep && e.prep.length) ? `<div class="prep-box ${isGolf ? 'golf' : ''}">
          <div class="prep-h">🧩 ${isGolf ? '준비할 때 느낀 점' : '준비 자세'}</div>
          ${e.prep.map(x => `<div class="prep-line"><span class="pb">·</span><div>${esc(x)}</div></div>`).join('')}
        </div>` : ''}

        ${gripGuideHtml(e)}

        ${mediaPending ? `<div class="prep-box media-pending" role="note">
          <div class="prep-h">📷 시각 자료 확인 예정</div>
          <div class="prep-line"><span class="pb">·</span><div>${esc(mediaEntry.pendingMessage)}</div></div>
        </div>` : ''}

        ${!isGolf && !hasMedia && e.image ? `<div class="ex-figure">
          <img src="${esc(e.image)}?v=${ASSET_VER}" alt="${esc(e.name)} 준비 자세와 동작 안내" loading="lazy" decoding="async">
        </div>` : ''}

        ${hasMedia ? exerciseVisualHtml(e) + '<div class="offline-tools"><button class="btn" data-offline>이 운동 오프라인 준비</button><p data-offline-status role="status">이미지와 3D를 기기에 보관할 수 있습니다.</p></div>' : ''}

        ${cues ? `<div class="block">
          <div class="block-h ${isGolf ? 'golf' : ''}">✅ ${isGolf ? '스윙 중 느낀 점' : '운동 중 핵심'}
            <span class="ctr">${c.size} / ${e.cues.length}</span></div>
          ${cues}
          ${c.size ? `<button class="reset-cues" data-act="reset-cues">체크 초기화</button>` : ''}
        </div>` : ''}

        ${reminders ? `<div class="block">
          <div class="block-h warn">🔥 ${isGolf ? '다음 연습에서 확인할 점' : '잊지 말 것'}</div>${reminders}</div>` : ''}

        ${prBlock}

        <div class="block">
          <div class="block-h ${isGolf ? 'golf' : ''}" style="display:flex">📝 내 메모
            <button class="memo-edit" data-act="memo-edit">편집</button></div>
          <button type="button" class="memo-box ${memo ? '' : 'ph'}" data-act="memo-edit">${memo ? esc(e.memo) : '운동하며 느낀 점을 적어두세요…'}</button>
        </div>

        ${isGolf ? (window.GolfHub?.related(id)||'') : relatedTrainingHtml(e)}

        <div class="block del-row">
          <button class="del-btn" data-act="delete">🗑 이 동작 삭제 요청</button>
        </div>
      </div>
      ${tabbar(e.part)}`;
    if(hasMedia){bindExerciseMedia(id);AppOffline.bind(app,id);}
  }

  // ============ 네비게이션 ============
  function go(name,opts={}) {
    const mode=opts.__historyMode||'push';opts={...opts};delete opts.__historyMode;
    const previous=view;view={...view,name,...opts};
    if(name==='ht')view={name:'part',part:name,cat:previous.part===name?previous.cat:null};
    if(name==='pt')view={name:'coach',part:'pt',coachTab:'now'};
    if(name==='golf')view={name:'coach',part:'golf',coachTab:'now'};
    if(name==='home'||name==='favorites'||name==='calendar'){view.part=null;view.id=null;}
    if(name==='detail')view.part=Store.getById(view.id)?.part||view.part;
    navigation.write(view,mode);render();
  }
  function updateHistoryButtons(){
    const back=document.getElementById('history-back'),forward=document.getElementById('history-forward');
    if(back)back.disabled=navigation.index<=0;if(forward)forward.disabled=navigation.index>=navigation.max;
  }
  function restoreHistory(event){
    ignoreHashChange=true;setTimeout(()=>{ignoreHashChange=false;},0);
    view=navigation.read(event.state);if(view.name==='detail')view.part=Store.getById(view.id)?.part;render();
  }

  // ============ 이벤트 (위임) ============
  document.addEventListener('keydown', ev => {
    const menu = app.querySelector('.exercise-quicknav[open]');
    if (ev.key === 'Escape' && menu) {
      menu.open = false;
      menu.querySelector('summary').focus();
      ev.preventDefault();
    }
  });
  document.body.addEventListener('click', (ev) => {
    try {
    const menu = app.querySelector('.exercise-quicknav[open]');
    if (menu && !menu.contains(ev.target)) menu.open = false;
    if(ev.ctrlKey||ev.metaKey||ev.shiftKey||ev.altKey)return;
    const stageLink=ev.target.closest('[data-golf-stage]');
    if(stageLink){const target=app.querySelector('#g-stage-'+stageLink.dataset.golfStage);if(target){ev.preventDefault();target.focus({preventScroll:true});target.scrollIntoView({block:'start',behavior:'instant'});navigation.saveScroll();return;}}
    if(ev.target.closest('[data-ht-basic]')){ev.preventDefault();const basic=app.querySelector('#ht-routine-basic');basic?.focus({preventScroll:true});basic?.scrollIntoView({block:'start'});return;}
    const routineButton=ev.target.closest('[data-ht-day]');
    if(routineButton&&htRoutineDays.some(d=>d.id===routineButton.dataset.htDay)){
      htRoutineToday();
      htRoutineDay=routineButton.dataset.htDay;
      app.querySelector('#ht-routine').outerHTML=htRoutineHtml();
      AppDrafts.bind(app);
      app.querySelector('.ht-routine-days [data-ht-day="'+htRoutineDay+'"]').focus({preventScroll:true});return;
    }
    if(ev.target.closest('[data-ht-library]')){ev.preventDefault();const title=app.querySelector('#ht-library-title');title?.focus({preventScroll:true});title?.scrollIntoView({block:'start'});return;}
    const scopeButton=ev.target.closest('[data-scope]');
    if(scopeButton){view.scope=scopeButton.dataset.scope;navigation.sync(view);render();return;}
    const link=ev.target.closest('a[href^="#"]');
    if(link&&!link.hasAttribute('data-open')&&!link.hasAttribute('data-part-open')){
      ev.preventDefault();const next=AppNavigation.fromHash(link.getAttribute('href'));go(next.name,next);return;
    }
    const t = ev.target.closest('[data-nav],[data-open],[data-part-open],[data-cat],[data-act],[data-cue],[data-back],[data-cal-nav],[data-cal-date],[data-catnav],[data-recent],[data-history],[data-delete-restore],[data-delete-send]');
    if (!t) return;
    if(t.tagName==='A')ev.preventDefault();

    if (t.dataset.deleteRestore) {
      Store.restoreDeleted(t.dataset.deleteRestore);
      toast('항목을 다시 표시합니다. GitHub 요청을 등록했다면 해당 요청도 닫아 주세요.');
      renderPreserving(); return;
    }
    if (t.dataset.deleteSend) {
      const request = Store.getDeletionRequests().find(item => item.id === t.dataset.deleteSend);
      if (request) openDeletionIssue(request);
      return;
    }

    if (t.dataset.history === 'back') { history.back(); return; }
    if (t.dataset.history === 'forward') { history.forward(); return; }
    if (t.dataset.nav) { go(t.dataset.nav); return; }
    if(t.hasAttribute('data-back')){if(navigation.index>0)history.back();else go(view.part||'home');return;}
    if (t.dataset.partOpen) { go(t.dataset.partOpen); return; }
    if (t.dataset.open) { const ex = Store.getById(t.dataset.open); go('detail', { id: t.dataset.open, part: ex ? ex.part : null }); return; }
    if (t.dataset.recent) {
      view.recentDate = t.dataset.recent;
      const box = document.getElementById('recent-list');
      const ses = Store.getRecentSessions(7).find(x => x.date === view.recentDate);
      if (box && ses) box.innerHTML = ses.exercises.map(e => exRow(e, null, true, '🗓️')).join('');
      document.querySelectorAll('.recent-chips .chip').forEach(c =>
        c.classList.toggle('on', c.dataset.recent === view.recentDate));
      return;
    }
    if(t.dataset.cat){go('part',{part:view.part,cat:t.dataset.cat});return;}
    if (t.hasAttribute('data-cue')) { toggleCue(view.id, +t.dataset.cue); return; }
    if (t.dataset.calNav) {
      const now = new Date();
      let cy = view.calYear ?? now.getFullYear();
      let cm = (view.calMonth ?? now.getMonth()) + parseInt(t.dataset.calNav);
      if (cm < 0) { cm = 11; cy--; } else if (cm > 11) { cm = 0; cy++; }
      view.calYear = cy; view.calMonth = cm;
      go('calendar',{calYear:cy,calMonth:cm,__historyMode:'replace'});return;
    }
    if (t.dataset.calDate) { openCalModal(t.dataset.calDate); return; }
    if (t.dataset.catnav) {
      const [p, cat] = t.dataset.catnav.split('::');
      go(p==='golf'?'golf-hub':'part',p==='golf'?{part:p,golfTab:'notes',cat:cat||null}:{part:p,cat:cat||null});
      return;
    }

    const act = t.dataset.act;
    if (!act) return;
    handleAct(act,t);
    }catch(error){saveError(error);}
  });

  function toggleCue(id, i) {
    const c = checks[id] || (checks[id] = new Set());
    c.has(i) ? c.delete(i) : c.add(i);
    const checkbox=app.querySelector('[data-cue="'+i+'"]');checkbox?.closest('.check')?.classList.toggle('done',c.has(i));const counter=app.querySelector('.ctr');if(counter)counter.textContent=c.size+' / '+(Store.getById(id).cues||[]).length;
  }

  // ============ 캘린더 날짜 모달 ============
  const calModalEl = document.getElementById('cal-modal');
  let calModalDate  = null;
  let calModalState = { scheduled: false, completed: false, schedTime: '', rest: false };

  function openCalModal(dateStr) {
    calModalDate = dateStr;
    const entry = Store.getCalEntry(dateStr) || {};
    calModalState = {
      scheduled: !!entry.scheduled,
      completed: !!entry.completed,
      schedTime: entry.schedTime || '',
      rest:      !!entry.rest
    };
    const [y, m, d] = dateStr.split('-');
    document.getElementById('cal-modal-date').textContent =
      `${y}년 ${parseInt(m)}월 ${parseInt(d)}일`;
    document.getElementById('cal-time-sel').value = calModalState.schedTime;
    updateCalModalBtns();
    AppDialogs.show(calModalEl);
  }

  function updateCalModalBtns() {
    document.getElementById('cal-sched-btn').classList.toggle('sched-on', calModalState.scheduled);
    document.getElementById('cal-done-btn').classList.toggle('done-on',  calModalState.completed);
    document.getElementById('cal-rest-btn').classList.toggle('rest-on',  calModalState.rest);
    document.getElementById('cal-time-row').classList.toggle('hidden', !calModalState.scheduled);
  }

  function closeCalModal() {
    AppDialogs.hide(calModalEl);
    calModalDate = null;
  }

  function saveCalModal() {
    if (calModalDate) {
      const schedTime = calModalState.scheduled
        ? document.getElementById('cal-time-sel').value
        : '';
      Store.setCalEntry(calModalDate, { ...calModalState, schedTime });
    }
    closeCalModal();
    renderPreserving();
    toast('저장됨');
  }

  calModalEl.addEventListener('click', e => { if (e.target === calModalEl) closeCalModal(); });

  function handleAct(act,btn) {
    switch (act) {
      case 'exercise-search':
      case 'search-focus': go('search',{q:'',scope:'all'});document.getElementById('search-input')?.focus();break;
      case 'reload': location.reload();break;
      case 'recovery-copy':{const blob=new Blob([JSON.stringify(Persistence.recoveryCopy(),null,2)],{type:'application/json'}),url=URL.createObjectURL(blob),link=document.createElement('a');link.href=url;link.download='ptgolf-recovery-'+Store.todayStr()+'.json';link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);break;}
      case 'recover-restore':askConfirm('중단된 복원 이전의 기록으로 되돌릴까요?',()=>{Persistence.recoverRestore();Store.reload();renderPreserving();toast('이전 기록을 복구했습니다.');},'복구');break;
      case 'training-play': {
        const exercise=Store.getById(view.id),video=[exercise?.sourceVideo,...exercise?.supplementaryVideos||[]].find(v=>v?.youtubeId===btn?.dataset.video),host=btn?.closest('.training-player');
        if(!host || !/^[A-Za-z0-9_-]{11}$/.test(video?.youtubeId||''))break;
        const frame=document.createElement('iframe');
        frame.title=video.title;frame.src='https://www.youtube-nocookie.com/embed/'+video.youtubeId+'?autoplay=1&playsinline=1';
        frame.allow='autoplay; encrypted-media; picture-in-picture; fullscreen';frame.allowFullscreen=true;
        frame.referrerPolicy='strict-origin-when-cross-origin';host.replaceChildren(frame);break;
      }
      case 'add': openEditor(null); break;
      case 'copy-edit': copyEditorChange(); break;
      case 'edit': openEditor(Store.getById(view.id)); break;
      case 'fav':
        Store.toggleFavorite(view.id);
        toast(Store.getById(view.id).favorite ? '⭐ 즐겨찾기 추가' : '즐겨찾기 해제');
        renderPreserving(); break;
      case 'reset-cues': checks[view.id] = new Set(); renderPreserving(); break;
      case 'memo-top': openMemoEditor();document.getElementById('memo-input')?.scrollIntoView({block:'center'});break;
      case 'memo-edit': openMemoEditor(); break;
      case 'delete':
        requestExerciseDeletion(view.id); break;
      case 'theme-toggle': Theme.toggle(); toast(Theme.get() === 'light' ? '☀️ 라이트 모드' : '🌙 다크 모드'); break;
      case 'cal-modal-close': closeCalModal(); break;
      case 'cal-modal-save':  saveCalModal(); break;
      case 'cal-toggle-sched': calModalState.scheduled = !calModalState.scheduled; updateCalModalBtns(); break;
      case 'cal-toggle-done':  calModalState.completed = !calModalState.completed; updateCalModalBtns(); break;
      case 'cal-toggle-rest':  calModalState.rest      = !calModalState.rest;      updateCalModalBtns(); break;
      case 'modal-close': closeModal(); break;
      case 'modal-save': saveEditor(); break;
      case 'confirm-yes': closeConfirm(true); break;
      case 'confirm-no': closeConfirm(false); break;
    }
  }

  // ============ 메모 인라인 편집 ============
  function openMemoEditor() {
    const e = Store.getById(view.id);
    const box = app.querySelector('.memo-box');
    const wrap = box.parentElement;
    const editBtn = wrap.querySelector('.memo-edit');
    if (editBtn) editBtn.style.display = 'none';
    box.outerHTML = `<textarea class="memo-input" id="memo-input">${esc(e.memo || '')}</textarea>
      <div class="modal-foot" style="padding:10px 0 0">
        <button class="btn ghost" id="memo-cancel">취소</button>
        <button class="btn primary" id="memo-save">메모 저장</button></div>`;
    const ta = document.getElementById('memo-input');
    AppDrafts.bind(wrap,location.hash);
    ta.focus();ta.setSelectionRange(ta.value.length,ta.value.length);
    document.getElementById('memo-save').onclick=()=>{try{Store.setMemo(view.id,ta.value.trim());AppDrafts.clear(ta);toast('메모 저장됨');renderPreserving();}catch(error){saveError(error);}};
    document.getElementById('memo-cancel').onclick=()=>{try{AppDrafts.clear(ta);renderPreserving();}catch(error){saveError(error);}};
  }

  // ============ 추가/수정 모달 ============
  let editingId = null, editingExtra = null;
  function openEditor(ex) {
    editingId = ex ? ex.id : null;
    document.getElementById('modal-title').textContent = ex ? '동작 수정' : '동작 추가';
    const part = ex ? ex.part : 'pt';
    setSeg('f-part', part);
    val('f-category', ex ? ex.category : (view.cat === 'all' || personalCat(view.cat) ? '' : (view.cat || '')));
    val('f-name', ex ? ex.name : '');
    val('f-spec', ex ? ex.spec : '');
    val('f-prep', ex ? (ex.prep || []).join('\n') : '');
    val('f-steps', ex ? (ex.steps || []).join('\n') : '');
    const focus=ex?.focus || window.ExerciseMedia?.[ex?.id]?.focus || {};
    for(const key of ['muscle','move','feel'])val('f-focus-'+key,focus[key]||'');
    editingExtra={prep:ex?.prep||[],steps:ex?.steps||[],focus:{muscle:focus.muscle||'',move:focus.move||'',feel:focus.feel||''}};
    document.querySelector('[data-act="copy-edit"]').hidden=!ex;
    val('f-cues', ex ? (ex.cues || []).join('\n') : '');
    val('f-reminders', ex ? (ex.reminders || []).join('\n') : '');
    refreshCatList(part);
    modal.dataset.draftKey='editor:'+(editingId||'new');
    AppDrafts.bind(modal,modal.dataset.draftKey,true);
    refreshCatList(getSeg('f-part'));
    AppDialogs.show(modal);
  }
  function refreshCatList(part) {
    const dl = document.getElementById('cat-list');
    dl.innerHTML = Store.getCategories(part).map(c => `<option value="${esc(c)}">`).join('');
  }
  async function copyEditorChange() {
    if(!editingId)return;
    const fields=[['파트',getSeg('f-part')],['카테고리',val('f-category')],['이름',val('f-name')],['핵심',val('f-spec')],['준비',val('f-prep')],['동작 순서',val('f-steps')],['부위',val('f-focus-muscle')],['움직임',val('f-focus-move')],['느낌',val('f-focus-feel')],['자세 체크',val('f-cues')],['잊지 말 것',val('f-reminders')]];
    const text='PT-GOLF 수정 요청\nID: '+editingId+'\n'+fields.map(([k,v])=>k+': '+v).join('\n');
    try{await navigator.clipboard.writeText(text);toast('수정 내용을 복사했습니다. 대화에 붙여 넣어 주세요.');}
    catch{toast('복사하지 못했습니다. 수정할 항목과 내용을 대화에 알려주세요.');}
  }
  function saveEditor() {
    const part = getSeg('f-part');
    const name = val('f-name').trim();
    if (!name) { toast('동작 이름을 입력하세요'); return; }
    const data = {
      id: editingId || undefined,
      part,
      category: val('f-category').trim() || '기타',
      name,
      spec: val('f-spec').trim(),
      prep: linesOf('f-prep'),
      steps: linesOf('f-steps'),
      focus: Object.fromEntries(['muscle','move','feel'].map(k=>[k,val('f-focus-'+k).trim()])),
      cues: linesOf('f-cues'),
      reminders: linesOf('f-reminders'),
    };
    if(editingId)for(const key of ['prep','steps','focus'])if(JSON.stringify(data[key])===JSON.stringify(editingExtra[key]))delete data[key];
    if (editingId) { const cur = Store.getById(editingId); data.memo = cur.memo; data.favorite = cur.favorite; }
    const saved=Store.upsert(data);
    AppDrafts.clear(modal);
    const wasEditing=!!editingId;
    closeModal();
    toast(wasEditing ? '수정됨' : '추가됨');
    go('detail', { id: saved.id, part: null });
  }
  function closeModal(){AppDialogs.hide(modal);editingId=null;AppUpdate.apply?.();}

  // 세그먼트 컨트롤 (PT/골프)
  document.getElementById('f-part').addEventListener('change',e=>refreshCatList(e.target.value));

  // ============ 확인 다이얼로그 ============
  function askConfirm(msg,cb,label='삭제') {
    confirmEl.querySelector('[data-act="confirm-yes"]').textContent=label;
    document.getElementById('confirm-msg').textContent = msg;
    confirmCb=cb;AppDialogs.show(confirmEl);
  }
  function closeConfirm(yes) {
    AppDialogs.hide(confirmEl);
    if (yes && confirmCb) confirmCb();
    confirmCb = null;
  }

  // 모달 바깥 클릭 닫기
  modal.addEventListener('click', e => { if (e.target === modal) closeModal(); });
  confirmEl.addEventListener('click', e => { if (e.target === confirmEl) closeConfirm(false); });

  // ---- helpers ----
  function val(id, v) { const el = document.getElementById(id); if (v !== undefined) el.value = v; return el.value; }
  function linesOf(id) { return val(id).split('\n').map(s => s.trim()).filter(Boolean); }
  function setSeg(id,v){document.getElementById(id).value=v;}
  function getSeg(id){return document.getElementById(id).value||'pt';}

  function golfConfig() { return { app, go, toast, exRow, tabbar, personalGroups, refresh: render, confirmDeletion, openDeletionIssue, issueUrl: DeletionFlow.issueUrl }; }
  try{window.GolfHub?.configure(golfConfig());}catch(error){console.warn('골프 초기화 실패',error);}
  Store.init().then(()=>{
    Theme.init();view=navigation.read();
    if(view.name==='detail')view.part=Store.getById(view.id)?.part;
    navigation.start(view);render();
    window.addEventListener('popstate',restoreHistory);
    window.addEventListener('hashchange',()=>{if(!ignoreHashChange)openExerciseLink();});
    Persistence.subscribe(event=>{if(!event.external&&!event.restored)return;if(AppDrafts.activePending()||AppDrafts.hasUnstored()||document.querySelector('.modal:not(.hidden)')){toast('다른 탭에서 기록이 바뀌었습니다. 작성 중인 내용을 먼저 확인해 주세요.');return;}Store.reload();renderPreserving();});
    AppUpdate.init(toast);
  }).catch(error=>{
    app.innerHTML='<div class="scr"><h1>자료를 불러오지 못했습니다</h1><p>기존 기록은 보존됩니다. 연결을 확인한 뒤 다시 시도해 주세요.</p><button class="btn" data-act="reload">다시 불러오기</button></div>';
    console.error('시작 실패',error);
  });
})();
