const assert=require('node:assert/strict');
const vm=require('node:vm'),fs=require('node:fs');
const elements=new Map(),buttons=[];let now=1000,interval,timeout,events,state=-1,time=0,seeks=[];
function element(id='') {return {id,disabled:false,hidden:false,checked:false,dataset:{},children:[],handlers:{},textContent:'',href:'',setAttribute(k,v){this[k]=v;},addEventListener(k,fn){this.handlers[k]=fn;},replaceChildren(...xs){this.children=xs;},append(...xs){this.children.push(...xs);for(const x of xs)if(x.id)elements.set(x.id,x);},replaceWith(x){elements.set(this.id,x);},click(){this.handlers.click?.();}};}
for(const id of ['load','play','restart','repeat','time','status','source','player','points','viewLabel','captionTitle'])elements.set(id,element(id));
for(let i=0;i<2;i++){const b=element();b.dataset.view=String(i);buttons.push(b);}
const screen=element(),repeat=element();
const doc={getElementById:id=>elements.get(id),createElement:()=>element(),querySelectorAll:()=>buttons,querySelector:s=>s==='.screen'?screen:repeat,head:element()};
const player={getCurrentTime:()=>time,getDuration:()=>30.8,getPlayerState:()=>state,getIframe:()=>elements.get('player'),seekTo:t=>{time=t;seeks.push(t);},playVideo:()=>{state=1;events.onStateChange({data:1});},pauseVideo:()=>{state=2;events.onStateChange({data:2});}};
const context={document:doc,location:{origin:'http://127.0.0.1:8792'},performance:{now:()=>now},setInterval:fn=>{interval=fn;return 1;},clearInterval:()=>{interval=null;},setTimeout:fn=>{timeout=fn;return 2;},clearTimeout:()=>{timeout=null;},YT:{Player:function(id,config){events=config.events;return player;}},addEventListener(){}};
context.window=context;
vm.runInNewContext(fs.readFileSync('media/golf3d/original.js','utf8'),context);
const el=id=>elements.get(id);
assert.equal(el('points').children.length,3);
buttons[1].click();assert.match(el('source').href,/t=17s$/);
el('load').click();events.onReady();assert.equal(time,17);assert.equal(el('play').disabled,false);
now+=1000;time=5;interval();assert.equal(buttons[0]['aria-pressed'],'true');
time=20;interval();assert.equal(buttons[1]['aria-pressed'],'true');
el('repeat').checked=true;el('repeat').handlers.change();assert.equal(time,17);
now+=1000;state=1;time=30.7;interval();assert.equal(time,17);
now+=1000;time=30.8;state=0;events.onStateChange({data:0});assert.equal(state,1);assert.equal(time,17);
el('play').click();assert.equal(state,2);assert.equal(el('play').textContent,'재생');
el('repeat').checked=false;buttons[0].click();now+=1000;time=30.8;state=0;events.onStateChange({data:0});assert.equal(state,0);
events.onError({data:153});assert.equal(el('player').hidden,true);assert.equal(el('play').disabled,true);assert.ok(el('fallback-source'));
buttons[1].click();assert.match(el('fallback-source').href,/t=17s$/);assert.equal(el('points').children.length,3);
console.log('PASS: pre-load selection, 17s synchronization, repeat/end/pause, error fallback and source links (mocked YouTube API).');
