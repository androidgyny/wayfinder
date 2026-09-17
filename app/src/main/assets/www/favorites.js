function sections(){return [{label:'All games',genre:'',favorite:false},{label:'★ Favorites',genre:'',favorite:true},...genres.map(g=>({label:g,genre:g,favorite:false}))]}
function sectionIndex(){return favoritesOnly?1:genre?Math.max(0,genres.indexOf(genre)+2):0}
function sectionLabel(){return favoritesOnly?'★ Favorites':genre||'All games'}
function stepSection(delta){if(presentation==='seattle'){seattleStepSection(delta);return;}const list=sections(),next=list[(sectionIndex()+delta+list.length)%list.length];favoritesOnly=next.favorite;setGenre(next.genre,true)}
function setFavoriteButton(button,g){button.disabled=!g;const on=g?.favorite===true;button.textContent=on?'★':'☆';button.setAttribute('aria-pressed',String(on));button.setAttribute('aria-label',on?'Remove from favorites':'Add to favorites');button.title=on?'Remove from favorites · Select':'Add to favorites · Select'}
function syncFavoriteCard(b,g){let badge=b.querySelector('.favorite-badge');if(g.favorite===true){if(!badge){badge=el('span','favorite-badge','★');badge.setAttribute('aria-hidden','true');b.append(badge)}}else badge?.remove();b.setAttribute('aria-label','Play '+g.title+(g.favorite?' · Favorite':''))}
function syncFavoritesUI(){const b=$('#favorites-section');b.classList.toggle('active',favoritesOnly);b.setAttribute('aria-pressed',String(favoritesOnly));$('#favorites-count').textContent=games.filter(g=>g.favorite===true).length;$('#presentation-sort').value=presentation==='oxford'?'az':sort;$('#empty h2').textContent=favoritesOnly&&!query?'No favorites yet':'No games found';$('#empty p').textContent=favoritesOnly&&!query?'Open a game’s details and press the star, or select a game and press Select.':'Try another title or browse all genres.'}
function toggleFavorite(id){
 const g=games.find(g=>g.id===id);if(!g)return;
 const value=g.favorite!==true;
 try{if(native){const response=JSON.parse(native.favorite?native.favorite(id,value):native.save(JSON.stringify({...g,favorite:value})));if(!response.ok){toast(response.message||'Could not save favorite');return}}}catch{toast('Could not save favorite');return}
 const detailOpen=$('#detail').open,detailId=detailOpen?filtered[selected]?.id:null,oldIndex=filtered.findIndex(g=>g.id===id),focusId=document.activeElement?.id;
 g.favorite=value;update();
 if(detailOpen){selected=filtered.findIndex(g=>g.id===detailId);if(selected>=0){showGame();$('#favorite-detail').focus({preventScroll:true})}else{closeGame();selected=-1}}
 if(!$('#detail').open){const next=filtered.find(g=>g.id===id)||filtered[Math.min(Math.max(0,oldIndex),filtered.length-1)];if(presentation!=='library'&&next){presentationId=next.id;renderPresentation()}
  const target=(focusId&&document.getElementById(focusId)&&!document.getElementById(focusId).disabled&&document.getElementById(focusId).getClientRects().length)?document.getElementById(focusId):next?[...document.querySelectorAll('#grid .game')].find(b=>b.dataset.id===next.id):presentation==='library'?$('#favorites-section'):presentation==='seattle'?$('#seattle-home'):$('#category-current');controllerFocus(focusableControl(target)?target:libraryFocusTarget());
 }
 persist();toast(value?'Added to Favorites':'Removed from Favorites');
}
function initFavorites(){
 $('#clear-recent').onclick=()=>clearRecent(filtered[selected]?.id);
 $('#favorites-section').onclick=()=>{favoritesOnly=true;setGenre('',true)};
 $('#presentation-favorite').onclick=()=>toggleFavorite(presentationId);
 $('#favorite-detail').onclick=()=>toggleFavorite(filtered[selected]?.id);
 $('#presentation-sort').onchange=e=>{sort=e.target.value;$('#sort').value=sort;visible=72;update();persist()};
}

function clearRecent(id){
 const g=games.find(g=>g.id===id);if(!g)return;
 try{if(native){const response=JSON.parse(native.clearRecent?native.clearRecent(id):native.save(JSON.stringify({...g,lastPlayed:0})));if(!response.ok){toast(response.message||'Could not clear play history');return}}}catch{toast('Could not clear play history');return}
 g.lastPlayed=0;update();
 selected=filtered.findIndex(item=>item.id===id);
 lastTrigger=[...document.querySelectorAll('#grid .game')].find(b=>b.dataset.id===id)||null;
 if($('#detail').open){if(selected>=0)showGame();else closeGame();$('#close').focus({preventScroll:true})}
 persist();toast('Removed from Recently Played');
}

// Reveal only inside the category scroller: never move the game area or steal focus.
function revealCategoryItem(container,item,horizontal=false){
 if(!container||!item||!container.getClientRects().length||!item.getClientRects().length)return;
 const bounds=container.getBoundingClientRect(),rect=item.getBoundingClientRect(),pad=8;
 const start=horizontal?bounds.left+container.clientLeft:bounds.top+container.clientTop;
 const size=horizontal?container.clientWidth:container.clientHeight;
 const before=horizontal?rect.left:rect.top,after=horizontal?rect.right:rect.bottom;
 let delta=0;
 if(after-before>size-pad*2)delta=before-start-pad;
 else if(before<start+pad)delta=before-start-pad;
 else if(after>start+size-pad)delta=after-(start+size-pad);
 if(delta)container.scrollTo({left:container.scrollLeft+(horizontal?delta:0),top:container.scrollTop+(horizontal?0:delta),behavior:'instant'});
}
function revealActiveCategory(){
 if(presentation==='library')revealCategoryItem($('aside'),$('aside .genre.active'));
 else if(presentation==='seattle')revealCategoryItem($('#seattle-categories'),$('#seattle-categories .active'),true);
}

// Each layout owns its reading position; search results never replace the unfiltered one.
let categoryPlaces={},renderedCategoryKey=null;
function categoryPlaceKey(){
 if(!['library','seattle','kyoto','cupertino','tokyo','oxford','berlin','venice','copenhagen'].includes(presentation))return null;
 return JSON.stringify([presentation,presentation==='copenhagen'?'table':presentation==='seattle'&&!seattleBrowse&&!genre&&!favoritesOnly&&!query?'dashboard':favoritesOnly?'favorites':genre||'all',query]);
}
function rememberCategoryPlace(){
 if(!renderedCategoryKey)return;
 const mode=JSON.parse(renderedCategoryKey)[0];
 if(mode!==presentation)return;
 const card=document.activeElement?.closest('#grid .game')||$('#grid .controller-selected')||$('#grid .presentation-selected');
 const id=['library','seattle'].includes(mode)?card?.dataset.id||(mode==='library'?controllerGameId:presentationId):presentationId;
 const index=filtered.findIndex(g=>g.id===id);if(index<0)return;
 delete categoryPlaces[renderedCategoryKey];
 categoryPlaces[renderedCategoryKey]={id,index,visible,top:scrollY,gridTop:$('#grid').scrollTop,rows:[...document.querySelectorAll('.seattle-shelf')].filter(row=>row.scrollLeft>0).map(row=>({name:row.getAttribute('aria-label'),left:row.scrollLeft})),row:card?.closest('.seattle-shelf')?.getAttribute('aria-label')};
}
function prepareCategoryPlace(){
 const key=categoryPlaceKey(),changed=key!==renderedCategoryKey;
 renderedCategoryKey=key;if(!key)return null;
 const place=categoryPlaces[key];
 if(!changed&&(!place||filtered.some(g=>g.id===place.id)))return null;
 const id=filtered.find(g=>g.id===(place?.id||(!place&&restoring?presentationId:null)))?.id||filtered[Math.min(place?.index||0,Math.max(0,filtered.length-1))]?.id||null;
 presentationId=id;controllerGameId=id;
 visible=Math.max(72,place?.visible||0,filtered.findIndex(g=>g.id===id)+1);
 return {place,id};
}
function restoreCategoryPlace(state){
 if(!state)return;
 const {place,id}=state,grid=$('#grid');
 if(presentation==='berlin'&&place){grid.scrollTop=place.gridTop;renderBerlin();}
 else if(presentation==='oxford'&&place){grid.scrollTop=place.gridTop;revealCategoryItem(grid,grid.querySelector('.presentation-selected'));}
 for(const row of document.querySelectorAll('.seattle-shelf')){const saved=place?.rows?.find(s=>s.name===row.getAttribute('aria-label'));if(saved)row.scrollLeft=saved.left;}
 const matches=[...grid.querySelectorAll('.game')].filter(n=>n.dataset.id===id);
 const card=matches.find(n=>n.closest('.seattle-shelf')?.getAttribute('aria-label')===place?.row)||matches[0];
 if(presentation==='library'||presentation==='seattle'){
  grid.querySelectorAll('.presentation-selected,.controller-selected').forEach(n=>n.classList.remove('presentation-selected','controller-selected'));
  card?.classList.add('presentation-selected');
 }
 window.scrollTo({top:place?.top||0,behavior:'instant'});
 // Restore selection visually for touch too, without pulling focus out of search/settings.
 if(card&&!topDialog()&&!editingField())controllerFocus(card,true);
}

function rememberedCategoryGame(items,id,key){
 const record=categoryPlaces['selection:'+key];
 return items.find(g=>g.id===id)||items[Math.min(record?.index||0,Math.max(0,items.length-1))];
}
function rememberCategoryIndex(items,id,key){
 const index=items.findIndex(g=>g.id===id);if(index>=0)categoryPlaces['selection:'+key]={index};
}

// A temporary search must not replace a shelf/list's normal reading position.
let ownSearchMode=null,ownSearchQuery='';
function preserveListSearchPosition(){
 if(!['ulm','cambridge','vienna','prague'].includes(presentation)){ownSearchMode=null;return;}
 if(ownSearchMode!==presentation){ownSearchMode=presentation;ownSearchQuery=query;return;}
 const key='search-return:'+presentation;
 if(!ownSearchQuery&&query){
  categoryPlaces[key]={id:presentationId,viennaKey,pragueKey,ulm:{...ulmPositions},cambridge:{...cambridgePositions},vienna:{...viennaPositions},prague:{...praguePositions}};
 }else if(ownSearchQuery&&!query&&categoryPlaces[key]){
  const saved=categoryPlaces[key];presentationId=saved.id;
  if(presentation==='ulm')ulmPositions={...saved.ulm};
  if(presentation==='cambridge')cambridgePositions={...saved.cambridge};
  if(presentation==='vienna'){viennaPositions={...saved.vienna};viennaKey=saved.viennaKey;}
  if(presentation==='prague'){praguePositions={...saved.prague};pragueKey=saved.pragueKey;}
 }
 ownSearchQuery=query;
}

// Bound transient search history without discarding normal category positions.
function trimCategoryHistory(){
 const keys=Object.keys(categoryPlaces),searches=keys.filter(key=>{try{const value=JSON.parse(key);return Array.isArray(value)&&!!value[2]}catch{return false}});
 for(const key of searches.slice(0,-24))if(key!==renderedCategoryKey)delete categoryPlaces[key];
 const remaining=Object.keys(categoryPlaces);
 for(const key of remaining.slice(0,-512))if(key!==renderedCategoryKey)delete categoryPlaces[key];
}
