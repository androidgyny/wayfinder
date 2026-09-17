// Vertical category columns, with native scrolling in the active column.
let pragueKey='favorites',praguePositions={},pragueColumns=[],pragueScrollTimer=0;
function pragueCurrent(){return pragueColumns.find(s=>s.key===pragueKey)}
function renderPrague(){
 clearTimeout(pragueScrollTimer);
 pragueColumns=[{key:'favorites',label:'★ Favorites',items:filtered.filter(g=>g.favorite)},...genres.map(name=>({key:'genre:'+name,label:name,items:filtered.filter(g=>g.genre===name)})).filter(s=>s.items.length)];
 if(!pragueCurrent())pragueKey=pragueColumns[0].key;
 const grid=$('#grid'),oldLeft=grid.scrollLeft,fragment=document.createDocumentFragment();
 for(const column of pragueColumns){
  const active=column.key===pragueKey,section=el('section','prague-column');section.dataset.category=column.key;section.classList.toggle('expanded',active);
  const heading=el('button','prague-heading');heading.append(el('span','',column.label),el('small','',column.items.length+' games'));heading.setAttribute('aria-expanded',String(active));heading.onclick=()=>pragueOpen(column.key,true);section.append(heading);
  const list=el('div','prague-list');list.setAttribute('aria-label',column.label);const chosen=rememberedCategoryGame(column.items,praguePositions[column.key],'prague:'+column.key);
  for(const g of column.items){const row=card(g);row.tabIndex=active&&g===chosen?0:-1;row.classList.toggle('presentation-selected',active&&g===chosen);list.append(row)}
  if(!chosen)list.append(el('p','prague-empty',query?'No games match this search.':'Press Select on a game to add it to Favorites.'));
  if(active)presentationId=chosen?.id||null;if(chosen)praguePositions[column.key]=chosen.id;
  const status=el('div','prague-status');pragueStatus(status,chosen,column);section.append(list,status);
  list.addEventListener('wheel',()=>{document.body.dataset.input='pointer'},{passive:true});
  list.addEventListener('scroll',()=>{if(document.body.dataset.input==='controller'||performance.now()<(list.ignoreUntil||0))return;clearTimeout(pragueScrollTimer);pragueScrollTimer=setTimeout(()=>{
   if(presentation!=='prague'||!list.isConnected||document.body.dataset.input==='controller')return;
   const y=list.scrollTop+10;let best=null,distance=Infinity;
   for(const row of list.children){if(!row.matches('.game'))continue;const d=Math.abs(row.offsetTop-y);if(d<distance){distance=d;best=row}}
   if(best){pragueActivate(column.key);pragueSelect(best.dataset.id,false,false)}
  },150)},{passive:true});
  fragment.append(section);
 }
 grid.replaceChildren(fragment);grid.scrollLeft=oldLeft;
 const active=grid.querySelector('.expanded');if(active&&(active.offsetLeft<grid.scrollLeft||active.offsetLeft+active.offsetWidth>grid.scrollLeft+grid.clientWidth))grid.scrollLeft=Math.max(0,active.offsetLeft-(grid.clientWidth-active.offsetWidth)/2);
 $('#load').hidden=true;$('#empty').hidden=true;
 for(const section of grid.querySelectorAll('.prague-column')){const id=praguePositions[section.dataset.category],target=[...section.querySelectorAll('.game')].find(b=>b.dataset.id===id);if(target)pragueReveal(target);}
 queueCoverGlow();
}
function pragueReveal(target){const list=target.parentElement;list.ignoreUntil=performance.now()+250;const top=target.offsetTop-10,bottom=target.offsetTop+target.offsetHeight+10;if(top<list.scrollTop)list.scrollTop=Math.max(0,top);else if(bottom>list.scrollTop+list.clientHeight)list.scrollTop=bottom-list.clientHeight;}
function pragueOpen(key,focus=false){
 clearTimeout(pragueScrollTimer);pragueActivate(key);const remembered=praguePositions[key],column=pragueCurrent();if(column?.items.length)pragueSelect(rememberedCategoryGame(column.items,remembered,'prague:'+key)?.id,false,true);const section=$('#grid .prague-column.expanded'),grid=$('#grid');
 if(section)grid.scrollLeft=Math.max(0,section.offsetLeft-(grid.clientWidth-section.offsetWidth)/2);
 if(focus)controllerFocus(section?.querySelector('.presentation-selected')||section?.querySelector('.prague-heading'),true);persist();
}
function pragueSelect(id,focus=true,scroll=true){
 const column=pragueCurrent(),g=column?.items.find(g=>g.id===id);if(!g)return;clearTimeout(pragueScrollTimer);presentationId=id;praguePositions[pragueKey]=id;rememberCategoryIndex(column.items,id,'prague:'+pragueKey);
 let target;for(const b of document.querySelectorAll('.prague-column.expanded .prague-list .game')){const chosen=b.dataset.id===id;b.classList.toggle('presentation-selected',chosen);if(!chosen)b.classList.remove('controller-selected');b.tabIndex=chosen?0:-1;if(chosen)target=b;}
 pragueStatus($('.prague-column.expanded .prague-status'),g,column);
 if(focus)controllerFocus(target);else if(document.activeElement?.closest('.prague-list')){target.focus({preventScroll:true});controllerGameId=id;}
 if(scroll)pragueReveal(target);queueCoverGlow();persist();
}
function pragueClick(g,b){const key=b.closest('.prague-column').dataset.category;if(key!==pragueKey){praguePositions[key]=g.id;pragueOpen(key,true);return;}if(presentationId!==g.id){pragueSelect(g.id,false,false);return}play(g.id,b)}
function pragueController(action){
 const column=pragueCurrent();if(!column)return false;
 if(['left','right','genrePrev','genreNext'].includes(action)){const i=pragueColumns.indexOf(column),delta=['right','genreNext'].includes(action)?1:-1,next=pragueColumns[Math.max(0,Math.min(pragueColumns.length-1,i+delta))];if(next!==column){effect('page');pragueOpen(next.key,true)}return true;}
 if(['up','down','pageUp','pageDown'].includes(action)){const i=Math.max(0,column.items.findIndex(g=>g.id===presentationId)),step=action.startsWith('page')?Math.max(12,Math.ceil(column.items.length/10)):1,g=column.items[Math.max(0,Math.min(column.items.length-1,i+(['up','pageUp'].includes(action)?-step:step)))];if(g)pragueSelect(g.id);return true;}
 return false;
}

function pragueStatus(node,g,column){node.replaceChildren();if(g)node.append(el('span','prague-status-title',g.title),el('small','prague-status-count',(column.items.indexOf(g)+1)+' / '+column.items.length));}

// Change selection without replacing scroll containers, preserving touch momentum.
function pragueActivate(key){
 if(pragueKey===key)return;pragueKey=key;presentationId=null;
 for(const section of document.querySelectorAll('.prague-column')){const active=section.dataset.category===key;section.classList.toggle('expanded',active);section.querySelector('.prague-heading').setAttribute('aria-expanded',String(active));if(!active)for(const row of section.querySelectorAll('.game')){row.classList.remove('presentation-selected','controller-selected','glow-selected');row.tabIndex=-1;}}
}
