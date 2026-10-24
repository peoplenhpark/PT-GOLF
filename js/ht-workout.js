/* Daily HT strength records. Separate from exercise coaching and personal memos. */
window.HTWorkout = (() => {
  'use strict';
  const key=Persistence.KEYS.workouts;
  const handle=Persistence.open(key,{defaults:()=>({entries:[]})});
  const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const today=()=>{const d=new Date();return [d.getFullYear(),String(d.getMonth()+1).padStart(2,'0'),String(d.getDate()).padStart(2,'0')].join('-');};
  const fail=(code,message)=>Object.assign(new Error(message),{code});
  function read(){const data=handle.reload();const status=handle.status();if(!status.ok)throw fail(status.error,status.message);return data;}
  function records(exerciseId,date=today()){
    const entries=read().entries.filter(e=>e.exerciseId===exerciseId);
    return {current:entries.find(e=>e.date===date)||null,previous:entries.filter(e=>e.date<date).sort((a,b)=>b.date.localeCompare(a.date))[0]||null};
  }
  function save(input,expected=null){
    const {exerciseId,date,weight,reps}=input;
    const id=date+'_'+exerciseId;
    const entry={id,exerciseId,date,weight,reps,updated:new Date().toISOString()};
    if(!Persistence.validators[key]({entries:[entry]}))throw fail('INVALID','중량과 실제 반복 횟수를 확인해 주세요.');
    const current=read().entries.find(e=>e.id===id)||null;
    if(!Persistence.equal(current,expected))throw fail('CONFLICT','다른 화면에서 오늘 기록이 바뀌었습니다. 입력은 보관됩니다. 새로고침 후 최신 기록을 확인해 주세요.');
    if(current&&current.weight===weight&&Persistence.equal(current.reps,reps))return current;
    return handle.update(data=>{
      const index=data.entries.findIndex(e=>e.id===id);
      if(index<0)data.entries.push(entry);else data.entries[index]=entry;
    }).entries.find(e=>e.id===id);
  }
  function completion(ids,date=today()){
    try{const done=new Set(read().entries.filter(e=>e.date===date).map(e=>e.exerciseId));return {known:true,ids:[...new Set(ids)].filter(id=>done.has(id))};}
    catch{return {known:false,ids:[]};}
  }
  function refreshCompletion(){
    if(typeof document==='undefined')return;
    const badges=[...document.querySelectorAll('[data-ht-completion]')];
    const progress=document.querySelector('[data-ht-progress]');
    if(!progress)return;
    const result=completion(badges.map(el=>el.dataset.htCompletion));
    const done=new Set(result.ids);
    for(const badge of badges){
      const completed=result.known&&done.has(badge.dataset.htCompletion);
      badge.textContent=!result.known?'확인 필요':completed?'✓ 완료':'미기록';
      badge.classList.toggle('is-complete',completed);
      badge.closest('li')?.classList.toggle('ht-is-complete',completed);
    }
    progress.textContent=result.known?`오늘 완료 ${done.size}/${badges.length}`:'완료 상태 확인 필요';
  }
  function html(exerciseId,name,targetWeight=null){
    const date=today();let current=null,previous=null,error='';
    try{({current,previous}=records(exerciseId,date));}catch(e){error=e.message;}
    const weight=current?.weight??targetWeight??previous?.weight??'';
    const prefix=exerciseId==='pt_pullup'?'보조 ':'';
    const last=previous?`지난 ${previous.date.slice(5).replace('-','/')} · ${prefix}${previous.weight}kg · ${previous.reps[0]} / ${previous.reps[1]??'—'}회`:'지난 기록 없음';
    const input=(field,label,value,min,step,required)=>`<label>${label}<input name="${field}" aria-label="${esc(name+' '+label)}" type="number" inputmode="${step==='1'?'numeric':'decimal'}" min="${min}" max="${field==='weight'?1000:200}" step="${step}" value="${esc(value)}" ${required?'required':''} placeholder="—"></label>`;
    return `<form class="ht-workout-log" data-ht-log="${esc(exerciseId)}" data-date="${date}" data-expected="${esc(JSON.stringify(current))}" data-draft-key="ht-log-${date}-${esc(exerciseId)}" aria-label="${esc(name)} 오늘 기록">
      <p class="ht-log-last">${esc(error||last)}</p>
      <div class="ht-log-fields">${input('weight',prefix+'kg',weight,0,'0.1',true)}${input('reps1','1세트',current?.reps[0]??'',1,'1',true)}${input('reps2','2세트',current?.reps[1]??'',1,'1',false)}<button type="submit" ${error?'disabled':''}>저장</button></div>
      <p class="ht-log-status" data-draft-status role="status">${current?'오늘 기록 저장됨 · 수정 가능':''}</p>
    </form>`;
  }
  if(typeof document!=='undefined')document.addEventListener('submit',event=>{
    const form=event.target.closest('[data-ht-log]');if(!form)return;
    event.preventDefault();
    const status=form.querySelector('[data-draft-status]');
    try{
      if(!form.reportValidity())return;
      const field=name=>form.elements.namedItem(name).value;
      const entry=save({exerciseId:form.dataset.htLog,date:form.dataset.date,weight:Number(field('weight')),reps:[Number(field('reps1')),field('reps2')===''?null:Number(field('reps2'))]},JSON.parse(form.dataset.expected));
      form.dataset.expected=JSON.stringify(entry);
      refreshCompletion();
      const cleared=AppDrafts.clear(form);
      if(cleared)status.textContent='오늘 기록 저장됨 · 수정 가능';
    }catch(error){status.textContent=error.message;}
  });
  if(typeof document!=='undefined'){
    Persistence.subscribe(event=>{if((event.external||event.restored)&&(event.key===key||event.key===null))refreshCompletion();});
    window.addEventListener('focus',refreshCompletion);
    document.addEventListener('visibilitychange',()=>{if(!document.hidden)refreshCompletion();});
  }
  return {today,records,save,html,completion,refreshCompletion};
})();
