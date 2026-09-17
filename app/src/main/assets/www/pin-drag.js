let pinDrag=null,pinIgnoreClickUntil=0,pinDragFrame=0;
function canDragPins(){return drawerView==='pinned'&&!$('#drawer-search').value.trim()&&!$('#drawer-letter').value}
function startPinDrag(e,pkg){
 if(!canDragPins()||e.button>0||e.isPrimary===false||pinDrag)return;
 pinDrag={pkg,id:e.pointerId,x:e.clientX,y:e.clientY,startX:e.clientX,startY:e.clientY,active:false,ghost:null,hover:null,hoverAt:0};

}
function pinTarget(){return document.elementFromPoint(pinDrag.x,pinDrag.y)?.closest('.drawer-app')}
function pinDragTick(){
 if(!pinDrag?.active)return;
 const d=pinDrag,dialog=$('#apps-drawer'),r=dialog.getBoundingClientRect();
 if(d.y<r.top+50)dialog.scrollTop-=10;else if(d.y>r.bottom-55)dialog.scrollTop+=10;
 const under=document.elementFromPoint(d.x,d.y),page=under?.closest('#drawer-prev,#drawer-next');
 if(page&&!page.disabled){if(d.hover!==page.id){d.hover=page.id;d.hoverAt=performance.now()}else if(performance.now()-d.hoverAt>700){drawerPage+=page.id==='drawer-next'?1:-1;renderDrawer();d.hoverAt=performance.now()}}else d.hover=null;
 d.ghost.style.left=(d.x-50)+'px';d.ghost.style.top=(d.y-45)+'px';
 document.querySelectorAll('.pin-drop-target').forEach(b=>b.classList.remove('pin-drop-target'));
 const target=pinTarget();if(target&&target.dataset.package!==d.pkg)target.classList.add('pin-drop-target');
 pinDragFrame=requestAnimationFrame(pinDragTick);
}
function finishPinDrag(cancel=false){
 const d=pinDrag;if(!d)return;const target=d.active?pinTarget():null;pinDrag=null;cancelAnimationFrame(pinDragFrame);d.ghost?.remove();
 document.body.classList.remove('pin-dragging');document.querySelectorAll('.pin-drop-target').forEach(b=>b.classList.remove('pin-drop-target'));
 if(!d.active)return;pinIgnoreClickUntil=performance.now()+500;
 if(cancel||!target||target.dataset.package===d.pkg)return;
 const pins=drawerPreferences.filter(a=>a.pinned).sort((a,b)=>(a.order||0)-(b.order||0)||(drawerCatalog.find(x=>x.package===a.package)?drawerName(drawerCatalog.find(x=>x.package===a.package)):a.package).localeCompare(drawerCatalog.find(x=>x.package===b.package)?drawerName(drawerCatalog.find(x=>x.package===b.package)):b.package));
 const ids=pins.map(a=>a.package),from=ids.indexOf(d.pkg),to=ids.indexOf(target.dataset.package);if(from<0||to<0)return;
 ids.splice(from,1);ids.splice(to,0,d.pkg);
 try{if(native?.reorderApps){const result=JSON.parse(native.reorderApps(JSON.stringify(ids)));if(!result.ok)throw Error(result.message)}else if(native)throw Error('Reordering is unavailable');
  ids.forEach((pkg,i)=>appPreference(pkg).order=i);renderDrawer();renderPinnedApps();const moved=[...document.querySelectorAll('.drawer-app')].find(b=>b.dataset.package===d.pkg);moved?.focus({preventScroll:true});effect('select');
 }catch(e){toast(e.message||'Could not save pinned order');loadDrawerPreferences();renderDrawer()}
}
function initPinDrag(){
 const grid=$('#drawer-grid');
 grid.addEventListener('pointermove',e=>{const d=pinDrag;if(!d||e.pointerId!==d.id)return;d.x=e.clientX;d.y=e.clientY;
  if(!d.active&&Math.hypot(d.x-d.startX,d.y-d.startY)>10){d.active=true;grid.setPointerCapture(e.pointerId);const source=[...grid.querySelectorAll('.drawer-app')].find(b=>b.dataset.package===d.pkg);if(!source){finishPinDrag(true);return;}d.ghost=source.cloneNode(true);d.ghost.removeAttribute('data-package');d.ghost.className='pin-drag-ghost';d.ghost.setAttribute('aria-hidden','true');$('#apps-drawer').append(d.ghost);document.body.classList.add('pin-dragging');pinIgnoreClickUntil=performance.now()+500;pinDragTick()}
  if(d.active)e.preventDefault();
 });
 grid.addEventListener('pointerup',e=>{if(pinDrag?.id===e.pointerId)finishPinDrag()});grid.addEventListener('pointercancel',e=>{if(pinDrag?.id===e.pointerId)finishPinDrag(true)});
 grid.addEventListener('lostpointercapture',e=>{if(e.target===grid&&pinDrag?.id===e.pointerId)finishPinDrag(true)});
 window.addEventListener('blur',()=>finishPinDrag(true));window.addEventListener('resize',()=>finishPinDrag(true));
 document.addEventListener('visibilitychange',()=>{if(document.hidden)finishPinDrag(true)});
 $('#apps-drawer').addEventListener('close',()=>finishPinDrag(true));
 grid.addEventListener('click',e=>{if(e.detail!==0&&performance.now()<pinIgnoreClickUntil){e.preventDefault();e.stopImmediatePropagation()}},true);
 const observer=new MutationObserver(()=>{grid.classList.toggle('pins-draggable',canDragPins())});observer.observe($('#drawer-tabs'),{childList:true});
}
