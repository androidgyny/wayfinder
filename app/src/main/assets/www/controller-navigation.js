// A common route to controls outside each layout's game/category navigation.
let controllerControlsScope=null,controllerControlsReturn=null,controllerHeaderReturn=null;
function focusControllerControl(node){
 if(!focusableControl(node))return;
 const focusStyle=getComputedStyle(node),focusPadding=Math.min(...['paddingTop','paddingRight','paddingBottom','paddingLeft'].map(k=>parseFloat(focusStyle[k])||0));
 node.style.setProperty('--controller-focus-offset',focusPadding>=4?'-2px':'2px');
 controllerFocus(node,true);
 node?.scrollIntoView({block:'nearest',inline:'nearest',behavior:'instant'});
 if(!node)return;
 // Compact hints need an outside ring, but tabs flush against a clipped strip
 // need it inside. Decide from the actual clipping boundaries, not the layout.
 const r=node.getBoundingClientRect(),s=getComputedStyle(node),edge=Math.max(0,parseFloat(s.outlineOffset)+parseFloat(s.outlineWidth));
 let clipped=r.left-edge<0||r.right+edge>innerWidth||r.top-edge<0||r.bottom+edge>innerHeight;
 for(let parent=node.parentElement;parent&&parent!==document.body&&!clipped;parent=parent.parentElement){
  const style=getComputedStyle(parent),box=parent.getBoundingClientRect();
  if(/auto|scroll|hidden|clip/.test(style.overflowX)&&(r.left-edge<box.left||r.right+edge>box.right))clipped=true;
  if(/auto|scroll|hidden|clip/.test(style.overflowY)&&(r.top-edge<box.top||r.bottom+edge>box.bottom))clipped=true;
 }
 if(clipped)node.style.setProperty('--controller-focus-offset','-2px');
}
function controllerControlList(root=topDialog()||document){
 const controls=dialogControls(root).filter(n=>{
  if(n.closest('.game'))return false;
  const sidebar=n.closest('#sidebar');
  if(sidebar&&sidebar.getBoundingClientRect().right<=0)return false;
  for(let parent=n;parent&&parent!==root;parent=parent.parentElement)if(getComputedStyle(parent).opacity==='0')return false;
  return true;
 });
 // Visiting another settings tab changes the panel. Traverse its controls first.
 if(root.id==='settings-dialog')controls.sort((a,b)=>Number(!!a.closest('#settings-navigation'))-Number(!!b.closest('#settings-navigation')));
 return controls;
}
function leaveControllerControls(restore=false){
 controllerControlsScope=null;delete document.body.dataset.controllerNavigation;
 if(restore){if(focusableControl(controllerControlsReturn))controllerFocus(controllerControlsReturn,true);else focusStartupGame();}
}
function openControllerHeader(){
 controllerHeaderReturn=document.activeElement;
 if(presentation==='tacoma')tacomaHeader(true);
 const button=[...document.querySelectorAll('.app-actions button')].find(focusableControl);
 if(!button)return false;
 native?.hideKeyboard?.();controllerFocus(button,true);return true;
}
function controllerNavigation(action,modal){
 const scope=modal||document;
 if(controllerControlsScope&&controllerControlsScope!==scope)leaveControllerControls();
 if(action==='controls'){
  if(controllerControlsScope){leaveControllerControls(true);return true;}
  controllerControlsReturn=document.activeElement;
  if(!modal&&presentation==='tacoma')tacomaHeader(true);
  controllerControlsScope=scope;document.body.dataset.controllerNavigation='controls';
  focusControllerControl(controllerControlList(scope)[0]);
  toast('Controls: D-pad moves, A selects, B returns');return true;
 }
 if(controllerControlsScope){
  if(action==='back'){leaveControllerControls(true);return true;}
  if(['up','down','left','right','pageUp','pageDown'].includes(action)){
   const controls=controllerControlList(scope),index=controls.indexOf(document.activeElement);
   if(controls.length){const delta=['up','left','pageUp'].includes(action)?-1:1;focusControllerControl(controls[(index+delta+controls.length)%controls.length]);}return true;
  }
  if(action==='activate'){
   const target=document.activeElement;leaveControllerControls();
   if(target?.tagName==='SELECT')openControllerChoice(target);else target?.click();return true;
  }
  leaveControllerControls();
 }
 if(modal)return false;
 const active=document.activeElement;
 if(active?.closest('.app-actions')){
  if(action==='left'||action==='right'){
   const controls=[...document.querySelectorAll('.app-actions button')].filter(focusableControl),i=controls.indexOf(active);
   controllerFocus(controls[Math.max(0,Math.min(controls.length-1,i+(action==='right'?1:-1)))],true);return true;
  }
  if(action==='activate'){active.click();return true;}
  if(action==='up')return true;
  if(action==='down'||action==='back'){
   const target=controllerHeaderReturn;controllerHeaderReturn=null;
   if(focusableControl(target)&&!target.closest('.app-actions')&&target!==$('#search'))controllerFocus(target,true);else focusStartupGame();return true;
  }
 }
 if(action==='up'){
  if(active===$('#search'))return openControllerHeader();
  if(active?.closest('#brussels-tabs,#rochester-tabs,#florence-tabs,#bend-tabs,#category-strip,#manhattan-tabs,#bath-tabs,#paloalto-tabs,#hongkong-tabs,#sedona-tabs,#showcase-tabs,#seattle-categories'))return openControllerHeader();
  const vertical=active?.closest('#cambridge-categories,#abbotsford-categories,#redmond-categories,#atlantis-categories,#sanfrancisco-categories,#dashboard-categories,aside');
  if(vertical&&dialogControls(vertical)[0]===active)return openControllerHeader();
 }
 return false;
}
document.addEventListener('pointerdown',()=>leaveControllerControls(),true);
