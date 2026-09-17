// Keep discovery samples stable while browsing; Shuffle advances through each category.
const discoveryQueues=new Map();
function categorySample(name){
 const items=games.filter(g=>g.genre===name),ids=items.map(g=>g.id).sort().join('|');
 let entry=discoveryQueues.get(name);
 if(!entry||entry.ids!==ids){
  const order=items.map(g=>g.id);
  for(let i=order.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[order[i],order[j]]=[order[j],order[i]]}
  entry={ids,order,offset:0};discoveryQueues.set(name,entry);
 }
 return Array.from({length:Math.min(6,entry.order.length)},(_,i)=>games.find(g=>g.id===entry.order[(entry.offset+i)%entry.order.length]));
}
function shuffleDiscovery(category=null){
 category=typeof category==='string'?category:null;
 for(const [name,entry] of discoveryQueues)if((category===null||name===category)&&entry.order.length>1)entry.offset=(entry.offset+(entry.order.length>6?6:1))%entry.order.length;
 const x=window.scrollX,y=window.scrollY;
 for(const section of document.querySelectorAll('[data-discovery-category]')){
  if(category!==null&&section.dataset.discoveryCategory!==category)continue;
  const row=section.querySelector('.seattle-shelf'),left=row.scrollLeft;
  row.replaceChildren(...categorySample(section.dataset.discoveryCategory).map(card));row.scrollLeft=left;
 }
 window.scrollTo({left:x,top:y,behavior:'instant'});effect('page');persist();
}
function seattleDashboard(){seattleBrowse=false;reset();persist()}
function seattleOpen(g='',favorite=false){seattleBrowse=true;favoritesOnly=favorite;setGenre(g,true);persist()}
function renderSeattle(){renderPinnedApps();
 const home=!seattleBrowse&&!genre&&!favoritesOnly&&!query;
 $('#seattle-title').textContent=home?'Welcome back.':sectionLabel();
 $('#seattle-subtitle').textContent=home?'Pick up where you left off, or find your next favorite.':`${filtered.length.toLocaleString()} games${query?' matching “'+query+'”':''}`;
 $('#seattle-home').onclick=seattleDashboard;$('#seattle-home').hidden=home;
 const chips=seattleSections().map((section,i)=>{const b=el('button','seattle-chip',section.label);b.onclick=()=>seattleChooseSection(section);const active=i===seattleSectionIndex();b.classList.toggle('active',active);b.setAttribute('aria-pressed',String(active));return b;});
 $('#seattle-categories').replaceChildren(...chips);
 const fragment=document.createDocumentFragment();let selectionPlaced=false;
 function shelf(title,items,limit,empty,more){
  const section=el('section','seattle-section'),heading=el('div','seattle-shelf-heading');heading.append(el('h2','',title));
  if(more){const button=el('button','text-button','View all →');button.onclick=more;heading.append(button)}section.append(heading);
  const row=el('div','seattle-shelf');row.setAttribute('aria-label',title);
  for(const game of items.slice(0,limit)){const b=card(game);if(game.id===presentationId&&!selectionPlaced){b.classList.add('presentation-selected');selectionPlaced=true;}row.append(b)}
  if(!items.length)row.append(el('p','seattle-empty',empty));section.append(row);fragment.append(section);return section;
 }
 if(home){
  const recent=games.filter(g=>g.lastPlayed>0).sort((a,b)=>b.lastPlayed-a.lastPlayed||a.title.localeCompare(b.title));
  const favorites=filtered.filter(g=>g.favorite===true);
  shelf('Recently played',recent,12,'Your recently played games will appear here.',()=>{sort='recent';$('#sort').value=sort;seattleOpen()});
  shelf('★ Favorites',favorites,24,'Keep your go-to games here. Select a game and press Select, or use the star in its details.',()=>seattleOpen('',true));
  const heading=el('div','seattle-discovery-heading');
  const text=el('div');text.append(el('h2','','Explore by category'),el('p','','A handful from every category. Shuffle to discover more.'));
  const shuffle=el('button','secondary','Shuffle all');shuffle.id='shuffle-discovery';shuffle.onclick=shuffleDiscovery;heading.append(text,shuffle);fragment.append(heading);
  for(const name of genres){const section=shelf(name,categorySample(name),6,'No games in this category.',()=>seattleOpen(name));section.dataset.discoveryCategory=name;
   const heading=section.querySelector('.seattle-shelf-heading'),actions=el('div','seattle-category-actions');
   const shuffle=el('button','text-button category-shuffle','Shuffle');shuffle.setAttribute('aria-label','Shuffle '+name);shuffle.onclick=()=>shuffleDiscovery(name);
   actions.append(shuffle,heading.querySelector('button'));heading.append(actions);
  }
 }else shelf(sectionLabel(),filtered,filtered.length,favoritesOnly&&!query?'No favorites yet. Use the star in game details or press Select to add one.':'No games match this search.');
 $('#grid').replaceChildren(fragment);$('#load').hidden=true;$('#empty').hidden=true;
}
function seattleMove(start,action){
 const rows=[...document.querySelectorAll('.seattle-shelf')].filter(r=>r.querySelector('.game'));
 const row=start.closest('.seattle-shelf');if(!row)return;
 const cards=[...row.querySelectorAll('.game')],index=cards.indexOf(start),ri=rows.indexOf(row);
 if(action==='up'||action==='down'){
  const next=rows[ri+(action==='down'?1:-1)];
  if(next){const targets=next.querySelectorAll('.game');controllerFocus(targets[Math.min(index,targets.length-1)])}
  else if(action==='up')controllerFocus($('#seattle-categories .active')||$('#seattle-categories button'));
  return;
 }
 const delta={left:-1,right:1,pageUp:-8,pageDown:8}[action]||0;
 const target=index+delta;
 controllerFocus(cards[Math.max(0,Math.min(cards.length-1,target))]);
}

function scrollSeattleSelection(card,previous){
 const row=card.closest('.seattle-shelf');if(!row)return;
 // Horizontal selection must not repeatedly reposition the document and header.
 const vertical=card.getBoundingClientRect();
 if(previous?.closest('.seattle-shelf')!==row||vertical.top<$('.topbar').offsetHeight||vertical.bottom>innerHeight){card.scrollIntoView({block:'nearest',inline:'nearest',behavior:'instant'});return;}
 const bounds=card.getBoundingClientRect(),viewport=row.getBoundingClientRect(),padding=parseFloat(getComputedStyle(row).scrollPaddingLeft)||8;
 const left=viewport.left+padding,right=viewport.right-padding;
 if(bounds.left<left-1)row.scrollLeft+=bounds.left-left;
 else if(bounds.right>right+1)row.scrollLeft+=bounds.right-right;
}

function revealSeattleCategory(node){
 revealCategoryItem($('#seattle-categories'),node,true);
 const rect=node.getBoundingClientRect(),top=$('.topbar').getBoundingClientRect().bottom+8,bottom=innerHeight-8;
 let delta=0;
 if(rect.top<top)delta=rect.top-top;
 else if(rect.bottom>bottom)delta=rect.bottom-bottom;
 if(delta)window.scrollTo({top:Math.max(0,scrollY+delta),behavior:'instant'});
}

function seattleCategoryController(action){
 const focused=document.activeElement,bar=$('#seattle-categories');
 if(!focused?.matches('.seattle-chip')||!bar.contains(focused))return false;
 if(['left','right','genrePrev','genreNext'].includes(action)){
  const list=seattleSections(),index=[...bar.children].indexOf(focused),delta=action==='left'||action==='genrePrev'?-1:1;
  const next=list[(index+delta+list.length)%list.length];
  effect('page');seattleChooseSection(next);
  controllerFocus($('#seattle-categories .active'),true);return true;
 }
 if(action==='down'){
  const cards=[...$('#grid').querySelectorAll('.game')];
  controllerFocus(cards.find(n=>n.dataset.id===presentationId)||cards[0],true);return true;
 }
 if(action==='up'){controllerFocus($('#search'));return true;}
 return false;
}

function seattleSections(){return [{label:'Home',home:true},...sections()]}
function seattleSectionIndex(){return !seattleBrowse&&!genre&&!favoritesOnly&&!query?0:sectionIndex()+1}
function seattleChooseSection(section){if(section.home)seattleDashboard();else seattleOpen(section.genre,section.favorite)}
function seattleStepSection(delta){const list=seattleSections();seattleChooseSection(list[(seattleSectionIndex()+delta+list.length)%list.length])}
