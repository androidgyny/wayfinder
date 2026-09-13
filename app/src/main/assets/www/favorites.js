function sections(){return [{label:'All games',genre:'',favorite:false},{label:'★ Favorites',genre:'',favorite:true},...genres.map(g=>({label:g,genre:g,favorite:false}))]}
function sectionIndex(){return favoritesOnly?1:genre?Math.max(0,genres.indexOf(genre)+2):0}
function sectionLabel(){return favoritesOnly?'★ Favorites':genre||'All games'}
function stepSection(delta){const list=sections(),next=list[(sectionIndex()+delta+list.length)%list.length];favoritesOnly=next.favorite;setGenre(next.genre,true)}
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
  const target=(focusId&&document.getElementById(focusId)&&!document.getElementById(focusId).disabled&&document.getElementById(focusId).getClientRects().length)?document.getElementById(focusId):next?[...document.querySelectorAll('#grid .game')].find(b=>b.dataset.id===next.id):presentation==='library'?$('#favorites-section'):presentation==='seattle'?$('#seattle-home'):$('#category-current');controllerFocus(target);
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
