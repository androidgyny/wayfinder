// A finite, category-balanced display table. Kept picks survive a new deal.
let copenhagenIds=[],copenhagenKept=[],copenhagenFilter=null;
function copenhagenPick(excluded,chosen){
 const pool=filtered.filter(g=>!excluded.has(g.id));if(!pool.length)return null;
 const counts=new Map();for(const id of chosen){const g=filtered.find(g=>g.id===id);if(g)counts.set(g.genre,(counts.get(g.genre)||0)+1)}
 const buckets=new Map();for(const g of pool){if(!buckets.has(g.genre))buckets.set(g.genre,[]);buckets.get(g.genre).push(g)}
 const min=Math.min(...[...buckets.keys()].map(k=>counts.get(k)||0)),categories=[...buckets.keys()].filter(k=>(counts.get(k)||0)===min),bucket=buckets.get(categories[Math.floor(Math.random()*categories.length)]);
 return bucket[Math.floor(Math.random()*bucket.length)].id;
}
function copenhagenFill(){
 const valid=new Set(filtered.map(g=>g.id));copenhagenIds=[...new Set(copenhagenIds)].filter(id=>valid.has(id)).slice(0,12);
 while(copenhagenIds.length<Math.min(12,filtered.length)){const id=copenhagenPick(new Set(copenhagenIds),copenhagenIds);if(!id)break;copenhagenIds.push(id)}
}
function renderCopenhagen(){
 finishCopenhagenDrag(true);
 const signature=JSON.stringify([query,genre,favoritesOnly]);if(copenhagenFilter!==signature){copenhagenIds=copenhagenIds.filter(id=>copenhagenKept.includes(id));copenhagenFilter=signature;}
 copenhagenKept=copenhagenKept.filter(id=>games.some(g=>g.id===id));copenhagenFill();
 if(!copenhagenIds.includes(presentationId))presentationId=copenhagenIds[0]||null;
 const grid=$('#grid'),existing=new Map([...grid.querySelectorAll('.game')].map(b=>[b.dataset.id,b]));
 let slot=0;for(const id of copenhagenIds){const g=filtered.find(g=>g.id===id),b=existing.get(id)||card(g);syncGameCard(b,g);b.classList.toggle('presentation-selected',id===presentationId);if(id!==presentationId)b.classList.remove('controller-selected');b.tabIndex=id===presentationId?0:-1;
  let kept=b.querySelector('.copenhagen-kept');if(copenhagenKept.includes(id)){if(!kept){kept=el('span','copenhagen-kept','Kept');b.append(kept)}}else kept?.remove();if(grid.children[slot]!==b)grid.insertBefore(b,grid.children[slot]||null);slot++;existing.delete(id);
 }
 for(const b of existing.values())b.remove();
 $('#empty').hidden=!!copenhagenIds.length;$('#load').hidden=true;
 const g=filtered.find(g=>g.id===presentationId);$('#copenhagen-title').textContent=g?.title||'No matching games';$('#copenhagen-category').textContent=g?.genre||'Try another search';
 $('#copenhagen-count').textContent=copenhagenIds.length+' picks from your collection';
 const kept=copenhagenKept.includes(presentationId);$('#copenhagen-keep').textContent=kept?'LB · Release pick':'LB · Keep here';$('#copenhagen-keep').setAttribute('aria-pressed',String(kept));$('#copenhagen-keep').disabled=!g;
 $('#copenhagen-replace').disabled=!g||kept||filtered.length<=copenhagenIds.length;
 $('#copenhagen-shuffle').disabled=!copenhagenIds.length||copenhagenIds.every(id=>copenhagenKept.includes(id));queueCoverGlow();
}
function copenhagenAnimate(ids){if(matchMedia('(prefers-reduced-motion: reduce)').matches)return;for(const b of $('#grid').querySelectorAll('.game'))if(ids.includes(b.dataset.id))b.animate([{opacity:.25,transform:'translateY(5px)'},{opacity:1,transform:'translateY(0)'}],{duration:150,easing:'ease-out'});}
function copenhagenShuffle(){
 if($('#copenhagen-shuffle').disabled)return;const old=copenhagenIds.slice(),next=old.map(id=>copenhagenKept.includes(id)?id:null),chosen=next.filter(Boolean);const excluded=new Set(old);
 for(let i=0;i<next.length;i++)if(!next[i]){let id=copenhagenPick(excluded,chosen);if(!id)id=copenhagenPick(new Set(chosen),chosen);next[i]=id;chosen.push(id);excluded.add(id)}
 copenhagenIds=next.filter(Boolean);const index=Math.max(0,old.indexOf(presentationId));presentationId=copenhagenIds[index]||null;renderCopenhagen();controllerFocus($('#grid .presentation-selected'),true);copenhagenAnimate(copenhagenIds.filter(id=>!copenhagenKept.includes(id)));effect('page');persist();
}
function copenhagenReplace(){
 if($('#copenhagen-replace').disabled)return;const index=copenhagenIds.indexOf(presentationId),id=copenhagenPick(new Set(copenhagenIds),copenhagenIds.filter(x=>x!==presentationId));if(!id)return;
 copenhagenIds[index]=id;presentationId=id;renderCopenhagen();controllerFocus($('#grid .presentation-selected'),true);copenhagenAnimate([id]);effect('page');persist();
}
function copenhagenKeep(){if(!presentationId)return;if(copenhagenKept.includes(presentationId))copenhagenKept=copenhagenKept.filter(id=>id!==presentationId);else copenhagenKept.push(presentationId);renderCopenhagen();effect('select');persist();}
function copenhagenController(action){
 if(action==='pageDown'){copenhagenShuffle();return true}if(action==='pageUp'||action==='genreNext'){copenhagenReplace();return true}if(action==='genrePrev'){copenhagenKeep();return true}
 const delta={left:-1,right:1,up:-6,down:6}[action];if(delta===undefined)return false;
 const i=Math.max(0,copenhagenIds.indexOf(presentationId)),j=Math.max(0,Math.min(copenhagenIds.length-1,i+delta));if(copenhagenIds[j]){presentationId=copenhagenIds[j];renderCopenhagen();controllerFocus($('#grid .presentation-selected'));persist()}return true;
}
function initCopenhagen(){
 const header=el('div','copenhagen-heading');header.id='copenhagen-heading';const label=el('div');label.append(el('h2','','A little of everything'));const count=el('small');count.id='copenhagen-count';label.append(count);header.append(label);
 const shuffle=el('button','secondary','RT · Shuffle table');shuffle.id='copenhagen-shuffle';shuffle.onclick=copenhagenShuffle;header.append(shuffle);$('#main').prepend(header);
 const footer=el('div','copenhagen-footer');footer.id='copenhagen-footer';const title=el('div');const name=el('div');name.id='copenhagen-title';const category=el('small');category.id='copenhagen-category';title.append(name,category);footer.append(title);
 const keep=el('button','secondary');keep.id='copenhagen-keep';keep.onclick=copenhagenKeep;const replace=el('button','secondary','LT · Replace pick');replace.id='copenhagen-replace';replace.onclick=copenhagenReplace;footer.append(keep,replace);$('#grid').after(footer);initCopenhagenDrag();
}

// Drag a cover to another table slot. Only the two dropped slots change order.
let copenhagenDrag=null,copenhagenDragFrame=0,copenhagenIgnoreClickUntil=0;
function finishCopenhagenDrag(cancel=false){
 const d=copenhagenDrag;if(!d)return;copenhagenDrag=null;cancelAnimationFrame(copenhagenDragFrame);copenhagenDragFrame=0;
 const grid=$('#grid'),before=new Map([...grid.querySelectorAll('.game')].map(b=>[b.dataset.id,b.getBoundingClientRect()]));
 d.card.classList.remove('copenhagen-dragging');d.card.style.removeProperty('--drag-x');d.card.style.removeProperty('--drag-y');grid.classList.remove('copenhagen-drag-active');
 grid.querySelectorAll('.copenhagen-drop-target').forEach(b=>b.classList.remove('copenhagen-drop-target'));
 if(grid.hasPointerCapture(d.pointer))grid.releasePointerCapture(d.pointer);
 if(!d.active)return;copenhagenIgnoreClickUntil=performance.now()+450;
 if(cancel||!d.target)return;
 const from=copenhagenIds.indexOf(d.id),to=copenhagenIds.indexOf(d.target);if(from<0||to<0)return;
 [copenhagenIds[from],copenhagenIds[to]]=[copenhagenIds[to],copenhagenIds[from]];
 presentationId=d.id;renderCopenhagen();controllerGameId=d.id;d.card.focus({preventScroll:true});
 if(!matchMedia('(prefers-reduced-motion: reduce)').matches)for(const b of grid.querySelectorAll('.game')){
  const old=before.get(b.dataset.id),now=b.getBoundingClientRect();if(!old)continue;
  const x=old.left-now.left,y=old.top-now.top;if(Math.abs(x)+Math.abs(y)<1)continue;
  const base=b.classList.contains('presentation-selected')?'translateY(-3px)':'translateY(0)';
  b.animate([{transform:`translate(${x}px,${y}px) ${base}`},{transform:base}],{duration:180,easing:'cubic-bezier(.2,.8,.2,1)'});
 }
 if(from!==to)effect('select');persist();
}
function initCopenhagenDrag(){
 const grid=$('#grid');
 grid.addEventListener('dragstart',e=>{if(presentation==='copenhagen')e.preventDefault()});
 grid.addEventListener('pointerdown',e=>{
  if(presentation!=='copenhagen'||e.button>0||e.isPrimary===false||e.target.closest('.card-edit'))return;
  const card=e.target.closest('.game');if(!card||card.parentElement!==grid)return;
  finishCopenhagenDrag(true);for(const b of grid.querySelectorAll('.game'))for(const animation of b.getAnimations())animation.cancel();
  copenhagenDrag={id:card.dataset.id,card,pointer:e.pointerId,startX:e.clientX,startY:e.clientY,x:e.clientX,y:e.clientY,active:false,target:null};
 });
 function paint(){
  copenhagenDragFrame=0;const d=copenhagenDrag;if(!d?.active)return;
  const dx=Math.max(d.bounds.left-d.origin.left,Math.min(d.bounds.right-d.origin.right,d.x-d.startX)),dy=Math.max(d.bounds.top-d.origin.top,Math.min(d.bounds.bottom-d.origin.bottom,d.y-d.startY));
  d.card.style.setProperty('--drag-x',dx+'px');d.card.style.setProperty('--drag-y',dy+'px');
  const inside=d.x>=d.bounds.left&&d.x<=d.bounds.right&&d.y>=d.bounds.top&&d.y<=d.bounds.bottom;
  let target=null,distance=Infinity;if(inside)for(const slot of d.slots){const n=Math.hypot(d.x-slot.x,d.y-slot.y);if(n<distance){distance=n;target=slot.id}}
  d.target=target;for(const b of grid.querySelectorAll('.game'))b.classList.toggle('copenhagen-drop-target',b.dataset.id===target&&target!==d.id);
 }
 grid.addEventListener('pointermove',e=>{
  const d=copenhagenDrag;if(!d||d.pointer!==e.pointerId)return;d.x=e.clientX;d.y=e.clientY;
  if(!d.active){if(Math.hypot(d.x-d.startX,d.y-d.startY)<8)return;
   copenhagenDrag=null;presentationId=d.id;renderCopenhagen();updateCoverGlow();copenhagenDrag=d;d.active=true;
   d.bounds=grid.getBoundingClientRect();d.origin=d.card.getBoundingClientRect();d.slots=[...grid.querySelectorAll('.game')].map(b=>{const r=b.getBoundingClientRect();return {id:b.dataset.id,x:r.left+r.width/2,y:r.top+r.height/2}});
   grid.setPointerCapture(e.pointerId);grid.classList.add('copenhagen-drag-active');d.card.classList.add('copenhagen-dragging');
  }
  if(!copenhagenDragFrame)copenhagenDragFrame=requestAnimationFrame(paint);e.preventDefault();
 });
 grid.addEventListener('pointerup',e=>{const d=copenhagenDrag;if(!d||d.pointer!==e.pointerId)return;d.x=e.clientX;d.y=e.clientY;if(d.active){cancelAnimationFrame(copenhagenDragFrame);paint()}finishCopenhagenDrag();});
 grid.addEventListener('pointercancel',e=>{if(copenhagenDrag?.pointer===e.pointerId)finishCopenhagenDrag(true)});
 grid.addEventListener('lostpointercapture',e=>{if(e.target===grid)finishCopenhagenDrag(true)});
 grid.addEventListener('click',e=>{if(presentation==='copenhagen'&&e.detail!==0&&(copenhagenDrag?.active||performance.now()<copenhagenIgnoreClickUntil)){e.preventDefault();e.stopImmediatePropagation()}},true);
 grid.addEventListener('contextmenu',e=>{if(presentation==='copenhagen'&&copenhagenDrag?.active){e.preventDefault();e.stopImmediatePropagation()}},true);
 document.addEventListener('keydown',e=>{if(e.key==='Escape'&&copenhagenDrag?.active){e.preventDefault();finishCopenhagenDrag(true)}});
 window.addEventListener('resize',()=>finishCopenhagenDrag(true));window.addEventListener('blur',()=>finishCopenhagenDrag(true));
 document.addEventListener('visibilitychange',()=>{if(document.hidden)finishCopenhagenDrag(true)});
}
