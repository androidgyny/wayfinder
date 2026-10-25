// Small tactile feedback for raised controls, without delaying their actions.
(()=>{
 const selectors={
  sedona:'.topbar button,#sedona-transport button,.sedona-tab',
  atlantis:'.topbar button,#atlantis-actions button',
  redmond:'#redmond-actions button,#settings-button',
  paloalto:'#paloalto-actions button,#paloalto-footer button'
 };
 const presses=new WeakMap(),active=new Set(),reduced=matchMedia('(prefers-reduced-motion: reduce)');
 window.cancelButtonPresses=()=>{for(const animation of active)animation.cancel();active.clear()};
 window.addEventListener('blur',window.cancelButtonPresses);
 document.addEventListener('visibilitychange',()=>{if(document.hidden)window.cancelButtonPresses()});
 function buttonFor(event){
  const button=event.target.closest?.('button'),selector=selectors[document.body.dataset.presentation];
  if(!button||button.disabled||button.getAttribute('aria-disabled')==='true'||button.closest('dialog')||!selector||!button.matches(selector))return null;
  return button;
 }
 function press(button,pointer=false){
  const old=presses.get(button);old?.animation?.cancel();
  const face=button.closest('#sedona-transport')?button.querySelector('b'):button;
  if(!face?.animate)return;
  const style=getComputedStyle(face),normal={transform:style.transform,filter:style.filter,boxShadow:style.boxShadow};
  const down={transform:reduced.matches?normal.transform:(normal.transform==='none'?'':normal.transform+' ')+'translate(1px, 1px)',filter:(normal.filter==='none'?'':normal.filter+' ')+'brightness(.88)',boxShadow:'inset 1px 2px 3px #0005'};
  const animation=face.animate([normal,{...down,offset:.25},{...down,offset:.6},normal],{duration:130,easing:'ease-out'});
  active.add(animation);animation.onfinish=animation.oncancel=()=>active.delete(animation);
  presses.set(button,{animation,pointerAt:pointer?performance.now():null});
 }
 document.addEventListener('pointerdown',event=>{if(event.button!==0||event.isPrimary===false)return;const button=buttonFor(event);if(button)press(button,true)},true);
 document.addEventListener('click',event=>{
  const button=buttonFor(event);if(!button)return;
  const state=presses.get(button);
  // A normal touch/mouse click already received its feedback on pointerdown.
  if(event.detail>0&&state?.pointerAt!=null&&performance.now()-state.pointerAt<600){state.pointerAt=null;return;}
  press(button);
 },true);
 document.addEventListener('pointercancel',event=>{const button=buttonFor(event);if(button){presses.get(button)?.animation?.cancel();presses.delete(button)}},true);
})();
