// Android resizes the WebView for the IME; visualViewport also covers browsers
// that resize only the visible area. Focus alone must not change normal layouts.
(()=>{
 const root=document.documentElement;
 let baselineHeight=innerHeight,viewportWidth=innerWidth,frame=0,compact=false,keyboardVisible=null;
 // Native IME visibility survives focus moving to a button and page reloads
 // while the keyboard is already open. Browsers use the resize fallback below.
 window.wayfinderKeyboardChanged=visible=>{keyboardVisible=!!visible;schedule();};
 try{if(window.Portal?.keyboardVisible)keyboardVisible=!!window.Portal.keyboardVisible();}catch{}
 const editable=e=>e?.matches('textarea,[contenteditable=true],input:not([type=range]):not([type=checkbox]):not([type=radio]):not([type=button]):not([type=submit])');
 function update(){
  frame=0;
  const height=Math.round(Math.min(innerHeight,window.visualViewport?.height||innerHeight));
  if(viewportWidth!==innerWidth){viewportWidth=innerWidth;baselineHeight=height;compact=false;}
  baselineHeight=Math.max(baselineHeight,height);
  if(keyboardVisible!==null)compact=keyboardVisible;
  else{
   const reduced=baselineHeight-height>Math.max(80,baselineHeight*.15);
   compact=(!!editable(document.activeElement)||compact)&&reduced;
   if(!compact&&!editable(document.activeElement))baselineHeight=height;
  }
  root.style.setProperty('--visible-height',height+'px');
  document.body.classList.toggle('input-compact',compact);
  // Scroll only an occluded field, never the carousel or the whole document.
  const field=document.activeElement,dialog=editable(field)?field.closest('dialog[open]'):null;
  if(compact&&dialog){
   const r=field.getBoundingClientRect(),d=dialog.getBoundingClientRect();
   const top=Math.max(d.top,0)+12,bottom=Math.min(d.bottom,height)-12;
   if(r.bottom>bottom)dialog.scrollTop+=r.bottom-bottom;
   else if(r.top<top)dialog.scrollTop-=top-r.top;
  }
 }
 function schedule(){if(!frame)frame=requestAnimationFrame(update);}
 addEventListener('resize',schedule);
 window.visualViewport?.addEventListener('resize',schedule);
 document.addEventListener('focusin',schedule);
 document.addEventListener('focusout',schedule);
 addEventListener('orientationchange',()=>{baselineHeight=innerHeight;schedule();});
 schedule();
})();
