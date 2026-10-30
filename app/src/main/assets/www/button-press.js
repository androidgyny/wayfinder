// Small tactile feedback for raised controls, without delaying their actions.
(()=>{
 const selectors={
  sedona:'.topbar button,#sedona-transport button,.sedona-tab',
  atlantis:'.topbar button,#atlantis-actions button',
  redmond:'#redmond-actions button,#settings-button',
  paloalto:'#paloalto-actions button,#paloalto-footer button'
 };
 const presses=new WeakMap(),active=new Set(),reduced=matchMedia('(prefers-reduced-motion: reduce)');
 let nativePaused=false;
 function pauseFlourishes(){const paused=nativePaused||document.hidden||!!document.querySelector('dialog[open]');document.body.classList.toggle('flourishes-paused',paused);window.pauseSedonaMarquee?.(paused);}
 const nativePause=window.onNativePause,nativeResume=window.onNativeResume;
 window.onNativePause=()=>{nativePause?.();nativePaused=true;window.cancelButtonPresses();pauseFlourishes();};
 window.onNativeResume=()=>{nativeResume?.();nativePaused=false;pauseFlourishes();};
 document.addEventListener('visibilitychange',pauseFlourishes);
 new MutationObserver(pauseFlourishes).observe(document.body,{subtree:true,attributes:true,attributeFilter:['open']});
 window.cancelButtonPresses=()=>{
  for(const animation of active)animation.cancel();active.clear();window.cancelPaloaltoTurn?.();
  document.querySelector('#blade-glint')?.getAnimations().forEach(a=>a.cancel());
  if(['bellevue','milan'].includes(document.body.dataset.presentation))for(const node of document.querySelectorAll('#grid,#showcase-art'))node.getAnimations().forEach(a=>a.cancel());
  if(document.body.dataset.presentation==='copenhagen')for(const card of document.querySelectorAll('#grid .game'))card.getAnimations().forEach(a=>a.cancel());
 };
 reduced.addEventListener('change',()=>{if(reduced.matches)window.cancelButtonPresses()});
 window.addEventListener('blur',window.cancelButtonPresses);
 document.addEventListener('visibilitychange',()=>{if(document.hidden)window.cancelButtonPresses()});
 function buttonFor(event){
  const button=event.target.closest?.('button'),selector=selectors[document.body.dataset.presentation];
  if(!button||button.disabled||button.getAttribute('aria-disabled')==='true'||button.closest('dialog')||!selector||!button.matches(selector))return null;
  return button;
 }
 function press(button,pointer=false){
  const old=presses.get(button);old?.animation?.cancel();old?.glow?.cancel();old?.cleanup?.();
  const face=button.closest('#sedona-transport')?button.querySelector('b'):button;
  if(!face?.animate)return;
  const style=getComputedStyle(face),normal={transform:style.transform,filter:style.filter,boxShadow:style.boxShadow};
  const down={transform:reduced.matches?normal.transform:(normal.transform==='none'?'':normal.transform+' ')+'translate(1px, 1px)',filter:(normal.filter==='none'?'':normal.filter+' ')+'brightness(.88)',boxShadow:'inset 1px 2px 3px #0005'};
  const animation=face.animate([normal,{...down,offset:.25},{...down,offset:.6},normal],{duration:130,easing:'ease-out'});
  active.add(animation);animation.onfinish=animation.oncancel=()=>active.delete(animation);
  presses.set(button,{animation,pointerAt:pointer?performance.now():null});
  const layout=document.body.dataset.presentation;
  if(!reduced.matches&&(layout==='atlantis'||layout==='sedona'&&button.closest('#sedona-transport'))){
   const lamp=document.createElement('span');lamp.className='button-lamp';lamp.setAttribute('aria-hidden','true');
   Object.assign(lamp.style,{position:'absolute',inset:'2px',borderRadius:'inherit',pointerEvents:'none',background:layout==='sedona'?'radial-gradient(ellipse at center,#ffd36a66,transparent 75%)':'linear-gradient(#ffffff66,transparent 60%)'});
   const previousPosition=face.style.position,changedPosition=getComputedStyle(face).position==='static';
   if(changedPosition)face.style.position='relative';
   face.append(lamp);const glow=lamp.animate([{opacity:0},{opacity:1,offset:.25},{opacity:0}],{duration:180});
   let cleaned=false;const cleanup=()=>{if(cleaned)return;cleaned=true;lamp.remove();if(changedPosition)face.style.position=previousPosition;active.delete(glow)};
   active.add(glow);glow.onfinish=glow.oncancel=cleanup;
   Object.assign(presses.get(button),{glow,cleanup});
  }
 }
 document.addEventListener('pointerdown',event=>{if(event.button!==0||event.isPrimary===false)return;const button=buttonFor(event);if(button)press(button,true)},true);
 document.addEventListener('click',event=>{
  const button=buttonFor(event);if(!button)return;
  const state=presses.get(button);
  // A normal touch/mouse click already received its feedback on pointerdown.
  if(event.detail>0&&state?.pointerAt!=null&&performance.now()-state.pointerAt<600){state.pointerAt=null;return;}
  press(button);
 },true);
 document.addEventListener('pointercancel',event=>{const button=buttonFor(event);if(button){const state=presses.get(button);state?.animation?.cancel();state?.glow?.cancel();state?.cleanup?.();presses.delete(button)}},true);
})();
