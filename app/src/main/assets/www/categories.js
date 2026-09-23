'use strict';
let categorySource='',categorySelection=new Set(),categoryUndo=[];
const categoryTitleSort=new Intl.Collator(undefined,{numeric:true,sensitivity:'base'});
function categoryMessage(message){for(const p of document.querySelectorAll('.category-feedback'))p.textContent=message;}
function categoryUndoControls(){for(const b of document.querySelectorAll('.category-undo')){b.disabled=!categoryUndo.length;b.textContent=categoryUndo.length?'Undo '+categoryUndo.at(-1).label:'Undo';}}
function categorySourceGames(){return games.filter(g=>g.genre===categorySource).sort((a,b)=>categoryTitleSort.compare(a.title,b.title));}
function categoryShownGames(){const q=normalize($('#category-game-search').value).trim();return categorySourceGames().filter(g=>normalize(g.title).includes(q));}
function categoryFollow(from,to){
 if(genre===from)genre=to;
 const old='genre:'+from,next='genre:'+to;
 if(viennaKey===old)viennaKey=next;if(pragueKey===old)pragueKey=next;if(ulmSection===old)ulmSection=next;if(ulmCategoryKey===old)ulmCategoryKey=next;if(cambridgeSection===old)cambridgeSection=next;
}
function categoryApply(moves,order,label,undo=false,restoreSource){
 const beforeOrder=[...categoryOrder],beforeSource=categorySource;
 try{
  if(native&&!native.changeCategories)throw Error('Install the updated Android app to manage categories.');
  if(native){const result=JSON.parse(native.changeCategories(JSON.stringify({moves,order})));if(!result.ok)throw Error(result.message||'Could not save categories.');}
  else{for(const m of moves)if(!games.some(g=>String(g.id)===m.id&&g.genre===m.from))throw Error('A game changed. Reopen Manage categories and try again.');for(const m of moves)games.find(g=>String(g.id)===m.id).genre=m.to;}
  if(!undo){categoryUndo.push({moves:moves.map(m=>({...m})),beforeOrder,afterOrder:[...order],beforeSource,label});if(categoryUndo.length>20)categoryUndo.shift();}else categoryUndo.pop();
  categoryOrder=[...order];if(native)games=JSON.parse(native.library());
  for(const m of moves)if(!games.some(g=>g.genre===m.from))categoryFollow(m.from,m.to);
  if(categorySource&&!games.some(g=>g.genre===categorySource)&&moves.length)categorySource=moves[0].to;
  if(restoreSource!==undefined)categorySource=restoreSource;
  if(!undo)categoryUndo.at(-1).afterSource=categorySource;
  categorySelection.clear();reloadLibrary();renderCategoryManager();if($('#category-members').open)renderCategoryMembers();categoryMessage(undo?'Change undone.':label+' saved.');if(!focusableControl(document.activeElement)){const dialog=topDialog();controllerFocus(dialog?.querySelector('.category-undo:not(:disabled)')||dialog?.querySelector('button'));}return true;
 }catch(e){categoryMessage(e.message);return false;}
}
function undoCategoryChange(){const change=categoryUndo.at(-1);if(!change)return;categoryApply(change.moves.map(m=>({id:m.id,from:m.to,to:m.from})),change.beforeOrder,change.label,true,categorySource===change.afterSource?change.beforeSource:undefined);}
function renderCategoryManager(){
 finishCategoryDrag(true);
 const root=$('#category-list'),focused=document.activeElement,focusName=focused?.closest('.category-manager-row')?.dataset.category,focusAction=focused?.dataset.categoryAction,scroll=$('#category-manager').scrollTop;root.replaceChildren();
 for(const [index,name] of genres.entries()){
  const row=el('div','category-manager-row');row.dataset.category=name;const grip=el('span','category-drag-handle','⠿');grip.title='Drag to reorder';grip.setAttribute('aria-hidden','true');row.append(grip);const open=el('button','secondary');open.dataset.categoryAction='open';open.append(el('span','',name),el('small','',counts[name].toLocaleString()));open.onclick=()=>openCategoryMembers(name);row.append(open);
  for(const [direction,symbol,word] of [[-1,'↑','up'],[1,'↓','down']]){const b=el('button','secondary',symbol);b.dataset.categoryAction=word;b.setAttribute('aria-label','Move '+name+' '+word);b.disabled=index+direction<0||index+direction>=genres.length;b.onclick=()=>{const order=[...genres];[order[index],order[index+direction]]=[order[index+direction],order[index]];categoryApply([],order,'category order');};row.append(b);}root.append(row);
 }
 if(!genres.length)root.append(el('p','muted','No categories yet. Add a game to start your library.'));
 const uncategorized=genres.find(n=>normalize(n).trim()==='uncategorized')||genres.find(n=>!n.trim())||'Uncategorized';$('#category-uncategorized').textContent='Uncategorized · '+games.filter(g=>g.genre===uncategorized).length;
 $('#category-alphabetical').disabled=!categoryOrder.length;categoryUndoControls();
 if(focusName&&topDialog()?.id==='category-manager'){const row=[...root.children].find(r=>r.dataset.category===focusName);const target=row?.querySelector('[data-category-action="'+focusAction+'"]');(target&&!target.disabled?target:row?.querySelector('button'))?.focus({preventScroll:true});}
 $('#category-manager').scrollTop=scroll;
 if($('#category-members').open){
  const row=[...root.children].find(r=>r.dataset.category===categorySource);
  $('#category-members')._returnFocus=row?.querySelector('[data-category-action="open"]')||$('#category-uncategorized');
 }else if(focusName&&document.body.dataset.input==='controller')document.activeElement?.scrollIntoView({block:'nearest'});
}
function openCategoryMembers(name){categorySource=name;categorySelection.clear();$('#category-game-search').value='';$('#category-new-destination').value='';categoryMessage('');renderCategoryMembers();showDialog('#category-members');$('#category-members').scrollTop=0;}
function renderCategoryMembers(){
 const list=categorySourceGames();$('#category-members-title').textContent=categorySource+' · '+list.length.toLocaleString();$('#category-name').value=categorySource;
 const previous=$('#category-destination').value;$('#category-destination').replaceChildren(...['',...genres.filter(n=>n!==categorySource)].map(n=>{const o=el('option','',n||'Choose destination…');o.value=n;return o}));$('#category-destination').value=genres.includes(previous)&&previous!==categorySource?previous:'';
 $('#category-rename').disabled=!list.length;categoryRenameNote();renderCategoryGames();categoryUndoControls();
}
function renderCategoryGames(){
 const root=$('#category-games'),scroll=root.scrollTop;root.replaceChildren();const existing=new Set(categorySourceGames().map(g=>String(g.id)));for(const id of categorySelection)if(!existing.has(id))categorySelection.delete(id);
 for(const g of categoryShownGames()){const b=el('button','category-game');b.dataset.gameId=String(g.id);b.setAttribute('aria-pressed',String(categorySelection.has(String(g.id))));b.append(el('span','',categorySelection.has(String(g.id))?'☑':'☐'),el('span','',g.title));b.onclick=()=>{const id=String(g.id);if(categorySelection.has(id))categorySelection.delete(id);else categorySelection.add(id);b.setAttribute('aria-pressed',String(categorySelection.has(id)));b.firstChild.textContent=categorySelection.has(id)?'☑':'☐';categorySelectionStatus();};root.append(b);}
 if(!root.children.length)root.append(el('p','muted',categorySourceGames().length?'No matching games.':'No games in this category.'));root.scrollTop=scroll;categorySelectionStatus();
}
function categorySelectionStatus(){const n=categorySelection.size;$('#category-selection-count').textContent=n+' selected · '+categoryShownGames().length+' shown';$('#category-move').textContent=n?'Move '+n+' '+(n===1?'game':'games'):'Move selected';$('#category-move').disabled=!n;$('#category-clear-selection').disabled=!n;$('#category-select-all').disabled=!categoryShownGames().length;}
function categoryDestination(value,rename=false){const clean=value.trim(),match=genres.find(n=>normalize(n)===normalize(clean));return rename&&match===categorySource?clean:match||clean;}
function categoryRenameNote(){const to=categoryDestination($('#category-name').value,true),merge=to!==categorySource&&genres.includes(to);$('#category-rename').textContent=merge?'Merge category':'Rename category';$('#category-rename').disabled=!to||to===categorySource||!categorySourceGames().length;$('#category-rename-note').textContent=merge?'Move all '+categorySourceGames().length+' games into “'+to+'”. Existing games there are kept.':'Changes the category for every game in this group.';}
$('#manage-categories').onclick=()=>{categoryMessage('');renderCategoryManager();showDialog('#category-manager');};
$('#category-manager-close').onclick=()=>hideDialog('#category-manager');$('#category-members-close').onclick=()=>hideDialog('#category-members');
for(const id of ['category-manager','category-members'])$('#'+id).addEventListener('cancel',e=>{e.preventDefault();hideDialog('#'+id)});
$('#category-alphabetical').onclick=()=>categoryApply([],[],'alphabetical order');
$('#category-uncategorized').onclick=()=>openCategoryMembers(genres.find(n=>normalize(n).trim()==='uncategorized')||genres.find(n=>!n.trim())||'Uncategorized');
for(const b of document.querySelectorAll('.category-undo'))b.onclick=undoCategoryChange;
$('#category-name').oninput=categoryRenameNote;
$('#category-rename-form').onsubmit=e=>{e.preventDefault();const to=categoryDestination($('#category-name').value,true);if(!to||to===categorySource)return;const moves=categorySourceGames().map(g=>({id:String(g.id),from:g.genre,to}));const order=categoryOrder.length?[...new Set(genres.map(n=>n===categorySource?to:n))]:[];categoryApply(moves,order,genres.includes(to)?'merge':'rename');};
$('#category-game-search').oninput=()=>{renderCategoryGames();$('#category-games').scrollTop=0;};
$('#category-select-all').onclick=()=>{for(const g of categoryShownGames())categorySelection.add(String(g.id));renderCategoryGames();};
$('#category-clear-selection').onclick=()=>{const focused=document.activeElement===$('#category-clear-selection');categorySelection.clear();renderCategoryGames();if(focused)controllerFocus($('#category-select-all').disabled?$('#category-game-search'):$('#category-select-all'),true);};
$('#category-new-destination').oninput=()=>{if($('#category-new-destination').value)$('#category-destination').value='';};$('#category-destination').onchange=()=>{if($('#category-destination').value)$('#category-new-destination').value='';};
$('#category-move').onclick=()=>{const to=categoryDestination($('#category-new-destination').value||$('#category-destination').value);if(!to||to===categorySource){categoryMessage('Choose a different destination, or enter a new category name.');return;}const moves=categorySourceGames().filter(g=>categorySelection.has(String(g.id))).map(g=>({id:String(g.id),from:g.genre,to}));if(moves.length)categoryApply(moves,categoryOrder,genres.includes(to)?'move':'split');};
function categoryManagerController(action){const button=document.activeElement;
 if(button===$('#category-destination')&&action==='down'){controllerFocus($('#category-new-destination'));return true;}
 if(button===$('#category-new-destination')&&action==='up'){controllerFocus($('#category-destination'));return true;}
 if(!button?.matches('.category-game'))return false;if(['up','down','pageUp','pageDown'].includes(action))document.body.dataset.input='controller';const root=$('#category-games');let target;if(action==='up')target=button.previousElementSibling;else if(action==='down')target=button.nextElementSibling;else if(action==='pageUp'||action==='pageDown'){const buttons=[...root.querySelectorAll('.category-game')],step=Math.max(1,Math.floor(root.clientHeight/button.offsetHeight));target=buttons[Math.max(0,Math.min(buttons.length-1,buttons.indexOf(button)+(action==='pageUp'?-step:step)))];}else return false;if(target?.matches('.category-game'))controllerFocus(target);else if(action==='up')controllerFocus($('#category-game-search'));return true;}
const categoryPreviousEvent=window.nativeEvent;window.nativeEvent=(event,data)=>{if(event==='restored'){loadCategoryOrder();categoryUndo=[];categorySelection.clear();}categoryPreviousEvent(event,data);if(event==='restored'&&$('#category-manager').open){renderCategoryManager();if($('#category-members').open)renderCategoryMembers();}};

// Keep the list stationary while dragging; only commit once the pointer is released.
let categoryDrag=null,categoryDragFrame=0,categoryIgnoreClickUntil=0;
function categoryDragTick(){
 const d=categoryDrag;if(!d?.active)return;
 const dialog=$('#category-manager'),bounds=dialog.getBoundingClientRect();
 const edge=54;
 const speed=d.y<bounds.top+edge?-Math.min(14,(bounds.top+edge-d.y)/3):d.y>bounds.bottom-edge?Math.min(14,(d.y-bounds.bottom+edge)/3):0;
 if(speed)dialog.scrollTop+=speed;
 d.ghost.style.top=(d.y-d.offsetY)+'px';
 const rows=[...$('#category-list').children].filter(r=>r!==d.row);
 const next=rows.find(r=>{const b=r.getBoundingClientRect();return d.y<b.top+b.height/2;});
 d.before=next?.dataset.category??null;
 for(const r of $('#category-list').children)r.classList.remove('category-drop-before','category-drop-after');
 if(next)next.classList.add('category-drop-before');else rows.at(-1)?.classList.add('category-drop-after');
 categoryDragFrame=requestAnimationFrame(categoryDragTick);
}
function finishCategoryDrag(cancel=false){
 const d=categoryDrag;if(!d)return;
 categoryDrag=null;cancelAnimationFrame(categoryDragFrame);
 d.ghost?.remove();d.row.classList.remove('category-drag-source');
 for(const r of $('#category-list').children)r.classList.remove('category-drop-before','category-drop-after');
 if(d.handle.hasPointerCapture(d.id))d.handle.releasePointerCapture(d.id);
 if(!d.active)return;
 categoryIgnoreClickUntil=performance.now()+450;
 if(cancel)return;
 const order=genres.filter(n=>n!==d.name),at=d.before===null?order.length:order.indexOf(d.before);
 if(at<0)return;
 order.splice(at,0,d.name);
 if(order.every((name,i)=>name===genres[i]))return;
 if(categoryApply([],order,'category order')){
  const row=[...$('#category-list').children].find(r=>r.dataset.category===d.name);
  row?.querySelector('[data-category-action="open"]')?.focus({preventScroll:true});
 }
}
$('#category-list').addEventListener('pointerdown',e=>{
 if(categoryDrag){finishCategoryDrag(true);return;}
 const handle=e.target.closest('.category-drag-handle');
 if(!handle||!e.isPrimary||e.button!==0||genres.length<2)return;
 const row=handle.closest('.category-manager-row'),b=row.getBoundingClientRect();
 categoryDrag={id:e.pointerId,handle,row,name:row.dataset.category,startX:e.clientX,startY:e.clientY,y:e.clientY,offsetY:e.clientY-b.top,active:false,before:null};
 handle.setPointerCapture(e.pointerId);e.preventDefault();
});
$('#category-list').addEventListener('pointermove',e=>{
 const d=categoryDrag;if(!d||e.pointerId!==d.id)return;
 d.y=e.clientY;
 if(!d.active&&Math.hypot(e.clientX-d.startX,e.clientY-d.startY)>8){
  d.active=true;const b=d.row.getBoundingClientRect();
  d.ghost=el('div','category-drag-ghost',d.name);
  Object.assign(d.ghost.style,{left:b.left+'px',width:b.width+'px',height:b.height+'px'});
  $('#category-manager').append(d.ghost);d.row.classList.add('category-drag-source');categoryDragTick();
 }
 if(d.active)e.preventDefault();
});
$('#category-list').addEventListener('pointerup',e=>{if(e.pointerId===categoryDrag?.id){if(categoryDrag.active){categoryDrag.y=e.clientY;cancelAnimationFrame(categoryDragFrame);categoryDragTick();}const b=$('#category-manager').getBoundingClientRect();finishCategoryDrag(e.clientX<b.left||e.clientX>b.right||e.clientY<b.top||e.clientY>b.bottom);}});
for(const event of ['pointercancel','lostpointercapture'])$('#category-list').addEventListener(event,e=>{if(e.pointerId===categoryDrag?.id)finishCategoryDrag(true);});
$('#category-list').addEventListener('click',e=>{if(e.detail&&performance.now()<categoryIgnoreClickUntil){e.preventDefault();e.stopImmediatePropagation();}},true);
for(const event of ['blur','resize'])window.addEventListener(event,()=>finishCategoryDrag(true));
document.addEventListener('visibilitychange',()=>{if(document.hidden)finishCategoryDrag(true);});
$('#category-manager').addEventListener('close',()=>{if(!$('#category-manager').open)finishCategoryDrag(true);});
$('#category-members').addEventListener('close',()=>{if(!$('#category-members').open&&topDialog()?.id==='category-manager')document.activeElement?.scrollIntoView({block:'nearest'});});
const categoryPreviousController=window.controller;
window.controller=action=>{const dragging=!!categoryDrag;finishCategoryDrag(true);if(dragging&&action==='back')return;return categoryPreviousController(action);};
const categoryPreviousBack=window.nativeBack;
window.nativeBack=()=>{if(categoryDrag){finishCategoryDrag(true);return true;}return categoryPreviousBack();};
