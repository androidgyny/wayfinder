// Bounded, action-driven accents; no animation runs while browsing is idle.
(()=>{
 const reduced=matchMedia('(prefers-reduced-motion: reduce)'),active=new Set();
 let timer=0,lastKey='',lastLayout='',launchTimer=0;
 function allowed(){return !reduced.matches&&!document.hidden&&!document.body.classList.contains('flourishes-paused')&&!document.querySelector('dialog[open]');}
 function animate(node,frames,options={},cleanup=()=>{}){if(!node)return;const a=node.animate(frames,{duration:150,easing:'ease-out',...options});a.id='recent-layout-polish';active.add(a);a.onfinish=a.oncancel=()=>{active.delete(a);cleanup()};return a;}
 function wash(node,kind,frames,duration=180){if(!node)return;const layer=document.createElement('span');layer.className='recent-polish-layer '+kind;layer.setAttribute('aria-hidden','true');node.append(layer);animate(layer,frames,{duration},()=>layer.remove());}
 function cancel(){clearTimeout(launchTimer);launchTimer=0;clearTimeout(timer);timer=0;for(const a of [...active])a.cancel();document.querySelectorAll('.comic-nudge').forEach(n=>n.classList.remove('comic-nudge'));}
 window.queueRecentPolish=()=>{
  const layout=document.body.dataset.presentation,key=layout==='manhattan'?sectionLabel():presentationId;
  if(lastLayout===layout&&lastKey===key)return;
  lastLayout=layout;lastKey=key;cancel();if(!allowed()||!key)return;
  timer=setTimeout(()=>{
   if(!allowed()||document.body.dataset.presentation!==layout)return;
   const card=document.querySelector('#grid .presentation-selected'),cover=card?.querySelector('.cover');
   if(layout==='manhattan')wash(document.querySelector('#manhattan-category'),'ink-rule',[{transform:'scaleX(0)'},{transform:'scaleX(1)'}],150);
   if(layout==='brussels'&&card){card.classList.add('comic-nudge');timer=setTimeout(()=>card.classList.remove('comic-nudge'),150);}
  },130);
 };
 window.runRecentLaunch=(done)=>{
  const layout=document.body.dataset.presentation;if(layout!=='brussels'||!allowed())return false;
  if(launchTimer)return true;
  cancel();const target=document.querySelector('#brussels-cover')?.parentElement;
  if(!target)return false;
  const normal=getComputedStyle(target).transform,base=normal==='none'?'':normal+' ';
  animate(target,[{transform:normal},{transform:base+'scale(.975)',offset:.45},{transform:normal}],{duration:110});
  launchTimer=setTimeout(()=>{launchTimer=0;if(!document.hidden&&document.body.dataset.presentation===layout&&!document.querySelector('dialog[open]'))done()},110);return true;
 };
 const oldCancel=window.cancelButtonPresses;window.cancelButtonPresses=()=>{oldCancel?.();cancel()};
 reduced.addEventListener('change',cancel);
 new MutationObserver(()=>{cancel();lastLayout='';lastKey=''}).observe(document.body,{attributes:true,attributeFilter:['data-presentation']});
 new MutationObserver(()=>{if(document.querySelector('dialog[open]'))cancel()}).observe(document.body,{subtree:true,attributes:true,attributeFilter:['open']});
 document.addEventListener('visibilitychange',()=>{if(document.hidden)cancel()});
})();
