// Vienna keeps a full native scrolling row only for the expanded category.
let viennaKey='favorites',viennaPositions={},viennaShelves=[],viennaScrollTimer=0;
function viennaCurrent(){return viennaShelves.find(s=>s.key===viennaKey)}
function renderVienna(){
 clearTimeout(viennaScrollTimer);
 viennaShelves=[{key:'favorites',label:'★ Favorites',items:filtered.filter(g=>g.favorite)},...genres.map(name=>({key:'genre:'+name,label:name,items:filtered.filter(g=>g.genre===name)})).filter(s=>s.items.length)];
 if(!viennaShelves.some(s=>s.key===viennaKey))viennaKey=viennaShelves[0].key;
 const fragment=document.createDocumentFragment();
 for(const shelf of viennaShelves){
  const active=shelf.key===viennaKey,section=el('section','vienna-section');section.dataset.shelf=shelf.key;section.classList.toggle('expanded',active);
  const heading=el('button','vienna-heading');heading.setAttribute('aria-expanded',String(active));heading.append(el('span','',shelf.label),el('small','',shelf.items.length+' games'));heading.onclick=()=>viennaOpen(shelf.key,true);section.append(heading);
  if(active){
   const row=el('div','vienna-row');row.setAttribute('aria-label',shelf.label);const remembered=viennaPositions[shelf.key];const chosen=shelf.items.find(g=>g.id===remembered)||shelf.items[0];
   for(const g of shelf.items){const b=card(g);b.tabIndex=g===chosen?0:-1;b.classList.toggle('presentation-selected',g===chosen);row.append(b)}
   section.append(row);
   const status=el('div','vienna-status');section.append(status);
   if(chosen){presentationId=chosen.id;viennaPositions[shelf.key]=chosen.id;status.textContent=chosen.title+' · '+(shelf.items.indexOf(chosen)+1)+' / '+shelf.items.length;}
   else{presentationId=null;row.append(el('p','vienna-empty',query?'No favorites match this search.':'Your favorites belong here. Open a game’s menu or press the right stick to add one.'));status.textContent='↑ ↓ Categories · ← → Games · Triggers: jump through games';}
   row.addEventListener('scroll',()=>{if(performance.now()<(row.viennaIgnoreUntil||0))return;clearTimeout(viennaScrollTimer);viennaScrollTimer=setTimeout(()=>{if(presentation!=='vienna'||!row.isConnected)return;const x=row.getBoundingClientRect().left+36;let best=null,distance=Infinity;for(const b of row.querySelectorAll('.game')){const d=Math.abs(b.getBoundingClientRect().left-x);if(d<distance){distance=d;best=b}}if(best)viennaSelect(best.dataset.id,false,false);},160)},{passive:true});
  }else{
   const preview=el('button','vienna-preview');preview.setAttribute('aria-label','Browse '+shelf.label);preview.tabIndex=-1;preview.onclick=()=>viennaOpen(shelf.key,true);
   if(!shelf.items.length)preview.append(el('span','','Add your favorite games here'));section.append(preview);
  }
  fragment.append(section);
 }
 $('#grid').replaceChildren(fragment);refreshViennaPreviews();$('#load').hidden=true;$('#empty').hidden=true;
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
 presentationId=id;viennaPositions[viennaKey]=id;
 let target=null;for(const b of document.querySelectorAll('.vienna-row .game')){const chosen=b.dataset.id===id;b.classList.toggle('presentation-selected',chosen);b.tabIndex=chosen?0:-1;if(chosen)target=b;}
 $('.vienna-status').textContent=g.title+' · '+(shelf.items.indexOf(g)+1)+' / '+shelf.items.length;
 if(focus)controllerFocus(target);
 else if(target&&document.activeElement?.closest('.vienna-row')){target.focus({preventScroll:true});controllerGameId=id;}
 if(scroll&&target){const row=target.parentElement;row.viennaIgnoreUntil=performance.now()+250;row.scrollTo({left:Math.max(0,target.offsetLeft-36),behavior:'instant'});}
 queueCoverGlow();persist();
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
 for(const preview of document.querySelectorAll('.vienna-preview')){
  const shelf=viennaShelves.find(s=>s.key===preview.closest('.vienna-section').dataset.shelf);if(!shelf?.items.length)continue;
  const style=getComputedStyle(preview),gap=parseFloat(style.columnGap)||0;
  const width=preview.clientWidth-parseFloat(style.paddingLeft)-parseFloat(style.paddingRight);
  const count=Math.min(shelf.items.length,Math.max(0,Math.ceil((width+gap)/(28+gap))));
  if(preview.children.length===count)continue;
  preview.replaceChildren(...shelf.items.slice(0,count).map(g=>{const im=el('img');im.src=g.image;im.alt='';im.loading='lazy';return im}));
 }
}
window.addEventListener('resize',refreshViennaPreviews);
