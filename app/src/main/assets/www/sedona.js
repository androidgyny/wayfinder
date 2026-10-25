// Player-style library: paged title list and a single portrait cover.
let sedonaPane='games',sedonaPageKey='',sedonaStartupFocusPending=false;
function sedonaFocus(useController=true){
 const target=sedonaPane==='tabs'?$('#sedona-tabs .current'):$('#grid .presentation-selected')||$('#grid .show-all-matches')||$('#sedona-tabs .current');
 if(useController)controllerFocus(target,true);else target?.focus({preventScroll:true});
 if(sedonaPane==='tabs'&&target)revealCategoryItem(target.parentElement,target,true);
 document.body.dataset.sedonaPane=sedonaPane;
}
function sedonaOpen(index){const s=sections()[index];if(!s)return;favoritesOnly=s.favorite;setGenre(s.genre,true);persist();}
function sedonaSelect(index,focus=true){const g=filtered[Math.max(0,Math.min(filtered.length-1,index))];presentationId=g?.id||null;controllerGameId=presentationId;renderSedona(true);if(!g)syncSearchFeedback();if(focus)sedonaFocus();queueCarouselSave();}
function sizeSedonaCover(){
 if(presentation!=='sedona')return;const panel=$('#sedona-art'),width=Math.max(0,Math.min(panel.clientWidth-24,(panel.clientHeight-38)/1.5));

 Object.assign($('#sedona-cover').style,{width:width+'px',height:width*1.5+'px'});
}
function syncSedonaCover(){if(presentation!=='sedona')return;const img=$('#sedona-cover');if(backdrop==='gradient')$('#soft-gradient').style.setProperty('--backdrop-rgb',coverColor(img)||'145,113,72');}
function renderSedona(selectionOnly=false){
 if(!selectionOnly){
 const tabs=$('#sedona-tabs'),list=sections(),signature=JSON.stringify(list.map(s=>[s.label,searchSummary?searchSectionCount(s.favorite?'favorites':s.genre?'genre:'+s.genre:'all',0):null]));
 if(tabs.dataset.signature!==signature){tabs.dataset.signature=signature;tabs.replaceChildren(...list.map((s,i)=>{
  const b=el('button','sedona-tab',s.label.replace('★ ',''));b.title=s.label;
  if(searchSummary){const n=searchSectionCount(s.favorite?'favorites':s.genre?'genre:'+s.genre:'all',0);b.append(el('small','',String(n)));b.classList.toggle('search-no-match',!n);}
  b.onclick=e=>{sedonaPane='tabs';sedonaOpen(i);sedonaFocus(e.detail===0)};b.onfocus=()=>{sedonaPane='tabs';document.body.dataset.sedonaPane=sedonaPane};return b;
 }));}
 [...tabs.children].forEach((b,i)=>{const on=i===sectionIndex();b.classList.toggle('current',on);b.setAttribute('aria-pressed',String(on));b.tabIndex=on?0:-1});revealCategoryItem(tabs,tabs.querySelector('.current'),true);
 $('#sedona-category').textContent=sectionLabel().replace('★ ','');$('#sedona-count').textContent=filtered.length.toLocaleString()+' '+(filtered.length===1?'game':'games')+(query?' found':'');
 }
 let index=Math.max(0,filtered.findIndex(g=>g.id===presentationId));const game=filtered[index];presentationId=game?.id||null;controllerGameId=presentationId;
 const page=Math.floor(index/8),items=filtered.slice(page*8,page*8+8),grid=$('#grid'),key=JSON.stringify([page,query,items.map(g=>[g.id,g.title,!!g.favorite])]);
 if(key!==sedonaPageKey||!grid.querySelector('.sedona-row')){sedonaPageKey=key;grid.replaceChildren(...items.map((g,i)=>{
  const b=el('button','game sedona-row');b.dataset.id=g.id;b.append(el('span','sedona-number',String(page*8+i+1).padStart(2,'0')),el('span','game-title',g.title));syncFavoriteCard(b,g);b.title=g.title;
  b.onclick=()=>{sedonaPane='games';sedonaSelect(page*8+i)};
  b.onfocus=()=>{sedonaPane='games';document.body.dataset.sedonaPane=sedonaPane;if(presentationId!==g.id)sedonaSelect(page*8+i,false)};
  b.ondblclick=()=>play(g.id,b);b.oncontextmenu=e=>{e.preventDefault();sedonaSelect(page*8+i,false);editGame(g)};return b;
 }));if(!game)grid.append(el('p','sedona-empty',query?'No matching titles.':!games.length?'Your library is empty. Choose Add game to begin.':favoritesOnly?'No favorites yet.':'No games in this category.'));}
 for(const row of grid.querySelectorAll('.game')){const on=row.dataset.id===presentationId;row.classList.toggle('presentation-selected',on);row.classList.remove('controller-selected');row.tabIndex=on?0:-1;row.setAttribute('aria-label','Select '+row.title+(on?' · Selected':''));}
 const img=$('#sedona-cover');img.hidden=!game;$('#sedona-print').hidden=!game;
 if(game){if(img.getAttribute('src')!==game.image)img.src=game.image;img.alt=game.title+' cover';}else{img.removeAttribute('src');img.alt='';}
 $('#sedona-title').textContent=game?String(index+1).padStart(2,'0')+'. '+game.title:'No game selected';$('#sedona-favorite').setAttribute('aria-pressed',String(!!game?.favorite));$('#sedona-type').textContent=game?(game.intentUri?'Shortcut':game.kind==='app'?'Android game':'Game'):'';
 $('#sedona-position').textContent=game?`${index+1} / ${filtered.length}`:'0 / 0';
 $('#sedona-prev').disabled=!game||index===0;$('#sedona-next').disabled=!game||index===filtered.length-1;
 for(const b of document.querySelectorAll('[data-sedona-game]'))b.disabled=!game;$('#sedona-track-prev').disabled=!game||index===0;$('#sedona-track-next').disabled=!game||index===filtered.length-1;$('#sedona-shuffle').disabled=filtered.length<2;
 const rail=$('#sedona-scroll');rail.hidden=filtered.length<=8;rail.setAttribute('aria-valuemax',String(Math.max(0,filtered.length-1)));rail.setAttribute('aria-valuenow',String(index));rail.setAttribute('aria-valuetext',game?`${index+1} of ${filtered.length}`:'Empty');rail.style.setProperty('--thumb-size',Math.max(12,Math.min(100,800/Math.max(1,filtered.length)))+'%');rail.style.setProperty('--thumb-position',((filtered.length>1?index/(filtered.length-1):0)*(100-Math.max(12,Math.min(100,800/Math.max(1,filtered.length)))))+'%');
 $('#empty').hidden=true;$('#load').hidden=true;sizeSedonaCover();syncSedonaCover();document.body.dataset.sedonaPane=sedonaPane;
}
function sedonaBack(){if(document.activeElement===$('#search'))native?.hideKeyboard?.();if(document.activeElement===$('#search')&&!query){$('#search').blur();sedonaFocus();return true;}if(query){query='';$('#search').value='';$('#search').blur();update();sedonaFocus();persist();return true;}if(sedonaPane==='games'){sedonaPane='tabs';sedonaFocus();return true;}return false;}
function sedonaController(action){
 if(['search','menu','apps'].includes(action))return false;
 if(action==='back'){sedonaBack();return true;}
 const active=document.activeElement;
 if(active?.matches('input,textarea,select')){if(['down','activate'].includes(action)){active.blur();native?.hideKeyboard?.();sedonaPane='games';sedonaFocus();return true;}return false;}
 if(action==='activate'&&active?.matches('.show-all-matches')){active.click();return true;}
 if(action==='activate'&&active?.matches('button')&&!active.closest('#grid,#sedona-tabs')){document.body.dataset.input='controller';active.click();return true;}

 if(action==='genrePrev'||action==='genreNext'){sedonaOpen((sectionIndex()+(action==='genreNext'?1:-1)+sections().length)%sections().length);sedonaFocus();return true;}
 if(sedonaPane==='tabs'){
  if(action==='left'||action==='right'){sedonaOpen((sectionIndex()+(action==='right'?1:-1)+sections().length)%sections().length);sedonaFocus();return true;}
  if(action==='down'||action==='activate'){sedonaPane='games';sedonaFocus();return true;}
  if(action==='up'){controllerFocus($('#search'));return true;}
 }
 const index=Math.max(0,filtered.findIndex(g=>g.id===presentationId));
 if(action==='up'&&index===0){sedonaPane='tabs';sedonaFocus();return true;}
 const delta={up:-1,down:1,left:-8,right:8,pageUp:-8,pageDown:8}[action];
 if(delta!==undefined){sedonaPane='games';sedonaSelect(index+delta);return true;}
 const g=filtered.find(g=>g.id===presentationId);
 if(['activate','edit','favorite'].includes(action)){if(g){if(action==='activate')play(g.id,$('#grid .presentation-selected'));else if(action==='edit')editGame(g);else{toggleFavorite(g.id);sedonaFocus();}}return true;}return false;
}
function initSedona(){
 const main=$('#main');
 const rail=el('div','sedona-part');rail.id='sedona-scroll';rail.setAttribute('role','scrollbar');rail.setAttribute('aria-label','Library position');rail.setAttribute('aria-controls','grid');rail.setAttribute('aria-orientation','vertical');rail.setAttribute('aria-valuemin','0');rail.tabIndex=0;rail.append(el('span','sedona-scroll-thumb'));
 const scrub=e=>{const r=rail.getBoundingClientRect(),h=rail.firstElementChild.getBoundingClientRect().height;sedonaPane='games';sedonaSelect(Math.round(Math.max(0,Math.min(1,(e.clientY-r.top-h/2)/Math.max(1,r.height-h)))*(filtered.length-1)),false)};
 rail.onpointerdown=e=>{if(e.button!==0)return;e.preventDefault();rail.setPointerCapture(e.pointerId);scrub(e)};rail.onpointermove=e=>{if(rail.hasPointerCapture(e.pointerId))scrub(e)};rail.onpointerup=e=>{if(rail.hasPointerCapture(e.pointerId)){rail.releasePointerCapture(e.pointerId);sedonaFocus()}};
 rail.onkeydown=e=>{const i=filtered.findIndex(g=>g.id===presentationId),next={ArrowUp:i-1,ArrowDown:i+1,PageUp:i-8,PageDown:i+8,Home:0,End:filtered.length-1}[e.key];if(next!==undefined){e.preventDefault();e.stopPropagation();sedonaSelect(next,false)}};
 main.append(rail);const tabs=el('nav','sedona-part');tabs.id='sedona-tabs';tabs.setAttribute('aria-label','Categories');
 const heading=el('header','sedona-part');heading.id='sedona-heading';const category=el('h1');category.id='sedona-category';const count=el('p');count.id='sedona-count';heading.append(category,count);
 const art=el('div','sedona-part');art.id='sedona-art';const print=el('div');print.id='sedona-print';const img=el('img');img.id='sedona-cover';print.append(img);art.append(print);img.onload=syncSedonaCover;
 const caption=el('div','sedona-part');caption.id='sedona-caption';const title=el('h2');title.id='sedona-title';const type=el('p');type.id='sedona-type';caption.append(title,type);
 const footer=el('nav','sedona-part');footer.id='sedona-footer';footer.setAttribute('aria-label','Game controls');
 for(const [key,label,action] of [['A','Open','activate'],['B','Back','back'],['X','Edit','edit'],['Y','Search','search']]){const b=el('button','sedona-hint');b.setAttribute('aria-label',label);b.append(el('b','sedona-key '+key.toLowerCase(),key),el('span','',label));b.onclick=()=>{sedonaFocus();sedonaController(action)||controller(action)};if(['activate','edit'].includes(action))b.dataset.sedonaGame='true';footer.append(b);}
 footer.append(el('small','sedona-page-help','LB/RB Categories · LT/RT Pages'));
 for(const [id,label,delta] of [['prev','Previous page',-8],['next','Next page',8]]){const b=el('button','sedona-page',delta<0?'‹':'›');b.id='sedona-'+id;b.setAttribute('aria-label',label);b.onclick=()=>{sedonaPane='games';sedonaSelect(Math.max(0,filtered.findIndex(g=>g.id===presentationId))+delta)};footer.append(b);}
 const pos=el('span');pos.id='sedona-position';footer.append(pos);const controls=el('nav','sedona-part');controls.id='sedona-transport';controls.setAttribute('aria-label','Game actions');for(const [id,icon,label,action] of [['prev','◀◀','Prev',()=>sedonaSelect(filtered.findIndex(g=>g.id===presentationId)-1)],['play','▶','Play',()=>{const g=filtered.find(g=>g.id===presentationId);if(g)play(g.id,$('#sedona-play'))}],['next','▶▶','Next',()=>sedonaSelect(filtered.findIndex(g=>g.id===presentationId)+1)],['shuffle','⤨','Shuffle',()=>{if(filtered.length>1){const i=Math.max(0,filtered.findIndex(g=>g.id===presentationId));sedonaSelect((i+1+Math.floor(Math.random()*(filtered.length-1)))%filtered.length)}}],['favorite','★','Favorite',()=>{if(presentationId)toggleFavorite(presentationId)}]]){const b=el('button');b.id='sedona-'+(id==='prev'||id==='next'?'track-':'')+id;b.dataset.sedonaGame='true';b.setAttribute('aria-label',label);b.append(el('b','',icon),el('span','',label));b.onclick=action;controls.append(b)}const label=el('div','sedona-part','GAME LIBRARY');label.id='sedona-library-label';heading.prepend(title);main.append(heading,controls,label,tabs,art,caption,footer);new ResizeObserver(sizeSedonaCover).observe(art);
}
