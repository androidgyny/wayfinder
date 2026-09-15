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
function seattleDashboard(){seattleBrowse=false;reset();window.scrollTo(0,0);persist()}
function seattleOpen(g='',favorite=false){seattleBrowse=true;favoritesOnly=favorite;setGenre(g,true);persist()}
function renderSeattle(){renderPinnedApps();
 const home=!seattleBrowse&&!genre&&!favoritesOnly&&!query;
 $('#seattle-title').textContent=home?'Welcome back.':sectionLabel();
 $('#seattle-subtitle').textContent=home?'Pick up where you left off, or find your next favorite.':`${filtered.length.toLocaleString()} games${query?' matching “'+query+'”':''}`;
 $('#seattle-home').onclick=seattleDashboard;$('#seattle-home').hidden=home;
 const chips=[el('button','seattle-chip','All games'),el('button','seattle-chip','★ Favorites')];
 chips[0].onclick=()=>seattleOpen();chips[1].onclick=()=>seattleOpen('',true);
 for(const name of genres){const b=el('button','seattle-chip',name);b.onclick=()=>seattleOpen(name);chips.push(b)}
 chips.forEach((b,i)=>{const active=!home&&(i===0?!genre&&!favoritesOnly:i===1?favoritesOnly:genre===genres[i-2]);b.classList.toggle('active',active);b.setAttribute('aria-pressed',String(active))});
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
 }else shelf(sectionLabel(),filtered,visible,favoritesOnly&&!query?'No favorites yet. Use the star in game details or press Select to add one.':'No games match this search.');
 $('#grid').replaceChildren(fragment);$('#load').hidden=true;$('#empty').hidden=true;
 if(!home&&visible<filtered.length){const more=el('button','load-button seattle-more','Show more games');more.onclick=()=>{const at=visible;visible+=72;renderSeattle();controllerFocus($('#grid .seattle-shelf').children[at]);persist()};$('#grid').append(more)}
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
 if(target>=cards.length&&(seattleBrowse||genre||favoritesOnly||query)&&visible<filtered.length){visible=Math.min(filtered.length,Math.max(visible+72,target+1));renderSeattle();const all=$('#grid .seattle-shelf').querySelectorAll('.game');controllerFocus(all[Math.min(target,all.length-1)]);return}
 controllerFocus(cards[Math.max(0,Math.min(cards.length-1,target))]);
}

function scrollSeattleSelection(card,previous){
 const row=card.closest('.seattle-shelf');if(!row)return;
 // Horizontal selection must not repeatedly reposition the document and header.
 if(previous?.closest('.seattle-shelf')!==row){card.scrollIntoView({block:'nearest',inline:'nearest',behavior:'instant'});return;}
 const bounds=card.getBoundingClientRect(),viewport=row.getBoundingClientRect(),padding=parseFloat(getComputedStyle(row).scrollPaddingLeft)||8;
 const left=viewport.left+padding,right=viewport.right-padding;
 if(bounds.left<left-1)row.scrollLeft+=bounds.left-left;
 else if(bounds.right>right+1)row.scrollLeft+=bounds.right-right;
}
