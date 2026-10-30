// A notebook index: eight text rows and a single portrait cover, regardless of library size.
let bathPane='games',bathPageKey='',bathStartupFocusPending=false;
// A repeatable angle per game keeps the tape from jumping on redraw or restart.
function bathTapeAngle(id){
 let hash=2166136261;for(const c of String(id||''))hash=Math.imul(hash^c.charCodeAt(0),16777619);
 return ((hash>>>0)%241/10-12).toFixed(1)+'deg';
}
function bathFocus(){
 const target=bathPane==='tabs'?$('#bath-tabs .current'):$('#grid .presentation-selected')||$('#grid .show-all-matches')||$('#bath-tabs .current');
 controllerFocus(target,true);if(bathPane==='tabs'&&target)revealCategoryItem(target.parentElement,target,true);
 document.body.dataset.bathPane=bathPane;
}
function bathOpen(index){const s=sections()[index];if(!s)return;favoritesOnly=s.favorite;setGenre(s.genre,true);persist();}
function bathSelect(index,focus=true){const g=filtered[Math.max(0,Math.min(filtered.length-1,index))];presentationId=g?.id||null;controllerGameId=presentationId;renderBath();syncSearchFeedback();if(focus)bathFocus();queueCarouselSave();}
function sizeBathCover(){
 if(presentation!=='bath')return;const panel=$('#bath-art'),width=Math.max(0,Math.min(panel.clientWidth-32,(panel.clientHeight-42)/1.5));
 const grid=$('#grid'),main=$('#main');main.style.setProperty('--bath-rule-step',Math.max(1,(grid.clientHeight-12)/8)+'px');main.style.setProperty('--bath-rule-start',(grid.offsetTop)+'px');
 Object.assign($('#bath-cover').style,{width:width+'px',height:width*1.5+'px'});
}
function syncBathCover(){if(presentation!=='bath')return;const img=$('#bath-cover');if(backdrop==='gradient')$('#soft-gradient').style.setProperty('--backdrop-rgb',coverColor(img)||'145,113,72');}
function renderBath(){
 const tabs=$('#bath-tabs'),list=sections(),signature=JSON.stringify(list.map(s=>[s.label,searchSummary?searchSectionCount(s.favorite?'favorites':s.genre?'genre:'+s.genre:'all',0):null]));
 if(tabs.dataset.signature!==signature){tabs.dataset.signature=signature;tabs.replaceChildren(...list.map((s,i)=>{
  const b=el('button','bath-tab',s.label.replace('★ ',''));b.title=s.label;
  if(searchSummary){const n=searchSectionCount(s.favorite?'favorites':s.genre?'genre:'+s.genre:'all',0);b.append(el('small','',String(n)));b.classList.toggle('search-no-match',!n);}
  b.onclick=()=>{bathPane='tabs';bathOpen(i);bathFocus()};b.onfocus=()=>{bathPane='tabs';document.body.dataset.bathPane=bathPane};return b;
 }));}
 [...tabs.children].forEach((b,i)=>{const on=i===sectionIndex();b.classList.toggle('current',on);b.setAttribute('aria-pressed',String(on));b.tabIndex=on?0:-1});revealCategoryItem(tabs,tabs.querySelector('.current'),true);
 $('#bath-category').textContent=sectionLabel().replace('★ ','');$('#bath-count').textContent=filtered.length.toLocaleString()+' '+(filtered.length===1?'game':'games')+(query?' found':'');
 let index=Math.max(0,filtered.findIndex(g=>g.id===presentationId));const game=filtered[index];presentationId=game?.id||null;controllerGameId=presentationId;
 const page=Math.floor(index/8),items=filtered.slice(page*8,page*8+8),grid=$('#grid'),key=JSON.stringify([page,query,items.map(g=>[g.id,g.title,!!g.favorite])]);
 if(key!==bathPageKey||!grid.querySelector('.bath-row')){bathPageKey=key;grid.replaceChildren(...items.map((g,i)=>{
  const b=el('button','game bath-row');b.dataset.id=g.id;b.append(el('span','game-title',g.title));syncFavoriteCard(b,g);if(!g.favorite){const star=el('span','bath-unstar','☆');star.setAttribute('aria-hidden','true');b.append(star)}b.title=g.title;
  b.onclick=()=>{bathPane='games';bathSelect(page*8+i)};
  b.onfocus=()=>{bathPane='games';document.body.dataset.bathPane=bathPane;if(presentationId!==g.id)bathSelect(page*8+i,false)};
  b.ondblclick=()=>play(g.id,b);b.oncontextmenu=e=>{e.preventDefault();bathSelect(page*8+i,false);editGame(g)};return b;
 }));if(!game)grid.append(el('p','bath-empty',query?'No matching titles.':!games.length?'Your notebook is empty. Choose Add game to begin.':favoritesOnly?'No favorites yet.':'No games in this category.'));}
 for(const row of grid.querySelectorAll('.game')){const on=row.dataset.id===presentationId;row.classList.toggle('presentation-selected',on);row.classList.remove('controller-selected');row.tabIndex=on?0:-1;row.setAttribute('aria-label','Select '+row.title+(on?' · Selected':''));}
 const img=$('#bath-cover');img.hidden=!game;$('#bath-print').hidden=!game;
 $('#bath-print').style.setProperty('--bath-tape-angle',bathTapeAngle(game?.id));
 if(game){if(img.getAttribute('src')!==game.image)img.src=game.image;img.alt=game.title+' cover';}else{img.removeAttribute('src');img.alt='';}
 $('#bath-title').textContent=game?.title||'';$('#bath-type').textContent=game?(game.intentUri?'Shortcut':game.kind==='app'?'Android game':'Game'):'';
 $('#bath-position').textContent=game?`${index+1} / ${filtered.length}`:'0 / 0';
 $('#bath-prev').disabled=!game||index===0;$('#bath-next').disabled=!game||index===filtered.length-1;
 for(const b of document.querySelectorAll('[data-bath-game]'))b.disabled=!game;
 $('#empty').hidden=true;$('#load').hidden=true;sizeBathCover();syncBathCover();document.body.dataset.bathPane=bathPane;
}
function bathBack(){if(document.activeElement===$('#search'))native?.hideKeyboard?.();if(document.activeElement===$('#search')&&!query){$('#search').blur();bathFocus();return true;}if(query){query='';$('#search').value='';$('#search').blur();update();bathFocus();persist();return true;}if(bathPane==='games'){bathPane='tabs';bathFocus();return true;}return false;}
function bathController(action){
 if(['search','menu','apps'].includes(action))return false;
 if(action==='back'){bathBack();return true;}
 const active=document.activeElement;
 if(active?.matches('input,textarea,select')){if(['down','activate'].includes(action)){active.blur();native?.hideKeyboard?.();bathPane='games';bathFocus();return true;}return false;}
 if(action==='activate'&&active?.matches('.show-all-matches')){active.click();return true;}
 if(action==='activate'&&active?.matches('button')&&!active.closest('#grid,#bath-tabs')){active.click();return true;}

 if(action==='genrePrev'||action==='genreNext'){bathOpen((sectionIndex()+(action==='genreNext'?1:-1)+sections().length)%sections().length);bathFocus();return true;}
 if(bathPane==='tabs'){
  if(action==='left'||action==='right'){bathOpen((sectionIndex()+(action==='right'?1:-1)+sections().length)%sections().length);bathFocus();return true;}
  if(action==='down'||action==='activate'){bathPane='games';bathFocus();return true;}
  if(action==='up'){controllerFocus($('#search'));return true;}
 }
 const index=Math.max(0,filtered.findIndex(g=>g.id===presentationId));
 if(action==='up'&&index===0){bathPane='tabs';bathFocus();return true;}
 const delta={up:-1,down:1,left:-8,right:8,pageUp:-8,pageDown:8}[action];
 if(delta!==undefined){bathPane='games';bathSelect(index+delta);return true;}
 const g=filtered.find(g=>g.id===presentationId);
 if(['activate','edit','favorite'].includes(action)){if(g){if(action==='activate')play(g.id,$('#grid .presentation-selected'));else if(action==='edit')editGame(g);else{toggleFavorite(g.id);bathFocus();}}return true;}return false;
}
function initBath(){
 const main=$('#main'),tabs=el('nav','bath-part');tabs.id='bath-tabs';tabs.setAttribute('aria-label','Categories');
 const heading=el('header','bath-part');heading.id='bath-heading';const category=el('h1');category.id='bath-category';const count=el('p');count.id='bath-count';heading.append(category,count);
 const art=el('div','bath-part');art.id='bath-art';const print=el('div');print.id='bath-print';const img=el('img');img.id='bath-cover';print.append(img);art.append(print);img.onload=syncBathCover;
 const caption=el('div','bath-part');caption.id='bath-caption';const title=el('h2');title.id='bath-title';const type=el('p');type.id='bath-type';caption.append(title,type);
 const footer=el('nav','bath-part');footer.id='bath-footer';footer.setAttribute('aria-label','Game controls');
 for(const [key,label,action] of [['A','Open','activate'],['B','Back','back'],['X','Edit','edit'],['Y','Search','search']]){const b=el('button','bath-hint');b.setAttribute('aria-label',label);b.append(el('b','bath-key '+key.toLowerCase(),key),el('span','',label));b.onclick=()=>{bathFocus();bathController(action)||controller(action)};if(['activate','edit'].includes(action))b.dataset.bathGame='true';footer.append(b);}
 footer.append(el('small','bath-page-help','LB/RB Categories · LT/RT Pages'));
 for(const [id,label,delta] of [['prev','Previous page',-8],['next','Next page',8]]){const b=el('button','bath-page',delta<0?'‹':'›');b.id='bath-'+id;b.setAttribute('aria-label',label);b.onclick=()=>{bathPane='games';bathSelect(Math.max(0,filtered.findIndex(g=>g.id===presentationId))+delta)};footer.append(b);}
 const pos=el('span');pos.id='bath-position';footer.append(pos);$('.brand').after(tabs);main.append(heading,art,caption,footer);new ResizeObserver(sizeBathCover).observe(art);
}
