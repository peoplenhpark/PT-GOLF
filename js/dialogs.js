window.AppDialogs = (() => {
  const previous=new WeakMap();
  const focusable=el=>[...el.querySelectorAll('button,input,textarea,select,a[href],[tabindex="0"]')].filter(x=>!x.disabled&&!x.closest('.hidden'));
  function show(el){previous.set(el,document.activeElement);el.classList.remove('hidden');el.setAttribute('role',el.id==='confirm'?'alertdialog':'dialog');el.setAttribute('aria-modal','true');document.getElementById('app').inert=true;document.getElementById('theme-btn').inert=true;requestAnimationFrame(()=>focusable(el)[0]?.focus());}
  function hide(el){el.classList.add('hidden');const other=document.querySelector('.modal:not(.hidden)');if(!other){document.getElementById('app').inert=false;document.getElementById('theme-btn').inert=false;}previous.get(el)?.focus();}
  document.addEventListener('keydown',ev=>{
    const el=[...document.querySelectorAll('.modal:not(.hidden)')].pop();if(!el)return;
    if(ev.key==='Escape'){ev.preventDefault();el.querySelector('[data-act$="-close"],[data-act="confirm-no"]')?.click();}
    if(ev.key==='Tab'){const list=focusable(el),first=list[0],last=list[list.length-1];if(ev.shiftKey&&document.activeElement===first){ev.preventDefault();last?.focus();}else if(!ev.shiftKey&&document.activeElement===last){ev.preventDefault();first?.focus();}}
  });
  return {show,hide};
})();
