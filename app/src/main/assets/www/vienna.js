// Vienna keeps a full native scrolling row only for the expanded category.
let viennaKey='favorites',viennaPositions={},viennaShelves=[],viennaScrollTimer=0;
function viennaCurrent(){return viennaShelves.find(s=>s.key===viennaKey)}
function renderVienna(){
 clearTimeout(viennaScrollTimer);
 viennaShelves=[{key:'favorites',label:'★ Favorites',items:filtered.filter(g=>g.favorite)},...genres.map(name=>({key:'genre:'+name,label:name,items:filtered.filter(g=>g.genre===name)})).filter(s=>s.items.length||!!query)];
 if(!viennaShelves.some(s=>s.key===viennaKey))viennaKey=viennaShelves[0].key;
 const fragment=document.createDocumentFragment();
 for(const shelf of viennaShelves){
  const active=shelf.key===viennaKey,section=el('section','vienna-section');section.dataset.shelf=shelf.key;section.classList.toggle('expanded',active);
  const heading=el('button','vienna-heading');heading.setAttribute('aria-expanded',String(active));heading.append(el('span','',shelf.label),el('small','',shelf.items.length+' games'));heading.onclick=()=>viennaOpen(shelf.key,true);section.append(heading);
  if(active){
   const row=el('div','vienna-row');bindCategoryTrack(row);row.setAttribute('aria-label',shelf.label);const remembered=viennaPositions[shelf.key];const chosen=rememberedCategoryGame(shelf.items,remembered,'vienna:'+shelf.key);
   for(const g of shelf.items){const b=card(g);b.tabIndex=g===chosen?0:-1;b.classList.toggle('presentation-selected',g===chosen);row.append(b)}
   section.append(row);
   const status=el('div','vienna-status');section.append(status);
   if(chosen){presentationId=chosen.id;viennaPositions[shelf.key]=chosen.id;status.textContent=chosen.title+' · '+(shelf.items.indexOf(chosen)+1)+' / '+shelf.items.length;}
   else{presentationId=null;row.append(el('p','vienna-empty',query?'No favorites match this search.':'Your favorites belong here. Open a game’s menu or press Select to add one.'));status.textContent='↑ ↓ Categories · ← → Games · Triggers: jump through games';}
   row.addEventListener('scroll',()=>{if(performance.now()<(row.viennaIgnoreUntil||0))return;clearTimeout(viennaScrollTimer);viennaScrollTimer=setTimeout(()=>{if(presentation!=='vienna'||!row.isConnected)return;const x=row.getBoundingClientRect().left+36;let best=null,distance=Infinity;for(const b of row.querySelectorAll('.game')){const d=Math.abs(b.getBoundingClientRect().left-x);if(d<distance){distance=d;best=b}}if(best)viennaSelect(best.dataset.id,false,false);},160)},{passive:true});
  }else{
   const preview=el('button','vienna-preview');preview.setAttribute('aria-label','Browse '+shelf.label);preview.tabIndex=-1;preview.onclick=()=>viennaOpen(shelf.key,true);
   if(!shelf.items.length)preview.append(el('span','','Add your favorite games here'));section.append(preview);
  }
  fragment.append(section);
 }
 $('#grid').replaceChildren(fragment);refreshViennaPreviews();syncSearchFeedback();$('#load').hidden=true;$('#empty').hidden=true;
 const selected=$('#grid .presentation-selected'),row=selected?.parentElement;
 if(selected&&row){row.viennaIgnoreUntil=performance.now()+250;row.scrollLeft=Math.max(0,selected.offsetLeft-36);}
 queueCoverGlow();
}
function viennaOpen(key,focus=false){
 viennaKey=key;renderVienna();const section=$('#grid .expanded');
 section?.scrollIntoView({block:'center',behavior:'instant'});
 if(focus)controllerFocus($('#grid .presentation-selected')||section?.querySelector('.vienna-heading'),true);
 persist();
}
function viennaSelect(id,focus=true,scroll=true){
 clearTimeout(viennaScrollTimer);
 const shelf=viennaCurrent(),g=shelf?.items.find(g=>g.id===id);if(!g)return;
 presentationId=id;viennaPositions[viennaKey]=id;rememberCategoryIndex(shelf.items,id,'vienna:'+viennaKey);
 const row=$('.vienna-row'),target=row.querySelector('.game[data-id="'+CSS.escape(String(id))+'"]');
 for(const b of row.querySelectorAll('.game.presentation-selected,.game[tabindex="0"]'))if(b!==target){b.classList.remove('presentation-selected');b.tabIndex=-1;}
 if(target){target.classList.add('presentation-selected');target.tabIndex=0;}
 $('.vienna-status').textContent=g.title+' · '+(shelf.items.indexOf(g)+1)+' / '+shelf.items.length;
 if(focus)controllerFocus(target);
 else if(target&&document.activeElement?.closest('.vienna-row')){target.focus({preventScroll:true});controllerGameId=id;}
 if(scroll&&target){const row=target.parentElement;row.viennaIgnoreUntil=performance.now()+250;scrollCategoryTrack(row,Math.max(0,target.offsetLeft-36),'left');}
 queueCoverGlow();queueCarouselSave();
}
function viennaClick(g,b){if(presentationId!==g.id){viennaSelect(g.id,false,false);return}play(g.id,b)}
function viennaController(action){
 const shelf=viennaCurrent();if(!shelf)return false;
 if(['up','down','genreNext','genrePrev'].includes(action)){
  const i=viennaShelves.indexOf(shelf),delta=['down','genreNext'].includes(action)?1:-1;
  const next=viennaShelves[Math.max(0,Math.min(viennaShelves.length-1,i+delta))];if(next!==shelf){effect('page');viennaOpen(next.key,true)}return true;
 }
 if(['left','right','pageUp','pageDown'].includes(action)){
  const i=Math.max(0,shelf.items.findIndex(g=>g.id===presentationId)),step=action.startsWith('page')?Math.max(12,Math.ceil(shelf.items.length/10)):1;
  const g=shelf.items[Math.max(0,Math.min(shelf.items.length-1,i+(['left','pageUp'].includes(action)?-step:step)))];if(g)viennaSelect(g.id);return true;
 }
 return false;
}

function refreshViennaPreviews(){
 if(presentation!=='vienna')return;
 const changes=[];
 for(const preview of document.querySelectorAll('.vienna-preview')){
  const shelf=viennaShelves.find(s=>s.key===preview.closest('.vienna-section').dataset.shelf);if(!shelf?.items.length)continue;
  const style=getComputedStyle(preview),gap=parseFloat(style.columnGap)||0;
  const width=preview.clientWidth-parseFloat(style.paddingLeft)-parseFloat(style.paddingRight);
  const count=Math.min(shelf.items.length,Math.max(0,Math.ceil((width+gap)/(28+gap))));
  if(preview.children.length===count)continue;
  changes.push({preview,items:shelf.items.slice(0,count)});
 }
 // Measure every shelf before inserting images, avoiding one layout pass per category.
 for(const {preview,items} of changes)preview.replaceChildren(...items.map(g=>{const im=el('img');im.src=g.image;im.alt='';im.loading='lazy';return im}));
}
window.addEventListener('resize',refreshViennaPreviews);

// Retarget one animation instead of restarting browser smooth-scroll on every repeat.
const categoryTrackMotion=new WeakMap();
function stopCategoryTrack(node){const state=categoryTrackMotion.get(node);if(state)cancelAnimationFrame(state.frame);categoryTrackMotion.delete(node)}
function bindCategoryTrack(node){for(const event of ['pointerdown','wheel'])node.addEventListener(event,()=>stopCategoryTrack(node),{passive:true})}
function scrollCategoryTrack(node,value,axis='top'){
 const property=axis==='left'?'scrollLeft':'scrollTop',max=axis==='left'?node.scrollWidth-node.clientWidth:node.scrollHeight-node.clientHeight;
 const target=Math.max(0,Math.min(max,value));
 if(matchMedia('(prefers-reduced-motion: reduce)').matches){stopCategoryTrack(node);node[property]=target;return}
 let state=categoryTrackMotion.get(node);if(state){state.target=target;return}
 state={target,frame:0,last:performance.now()};categoryTrackMotion.set(node,state);
 const tick=now=>{if(!node.isConnected||topDialog()||!['vienna','prague'].includes(presentation)){stopCategoryTrack(node);return}const dt=Math.min(40,Math.max(1,now-state.last));state.last=now;const current=node[property],delta=state.target-current;node.ignoreUntil=node.viennaIgnoreUntil=now+250;if(Math.abs(delta)<=1){node[property]=state.target;categoryTrackMotion.delete(node);return}node[property]=current+delta*(1-Math.exp(-dt/45));state.frame=requestAnimationFrame(tick)};
 state.frame=requestAnimationFrame(tick);
}
