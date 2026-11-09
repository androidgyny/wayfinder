// A newspaper index with eight rows per page and one portrait illustration.
let manhattanPane='games',manhattanPageKey='';
let manhattanDateTimer=0;
function manhattanText(node,text){
 if(node.dataset.label===text)return;
 node.dataset.label=text;node.title=text;
 // Keep a short final word or sequel number with the preceding word.
 node.textContent=node.matches('#manhattan-category')?text.replace(/\s+(\S{1,3})$/u,'\u00a0$1'):text;
}
function manhattanElsewhere(items,selectedId){
 const rank=g=>g.lastPlayed>0?0:g.favorite?1:2;
 const variety=g=>{let hash=2166136261;for(const c of String(g.id))hash=Math.imul(hash^c.charCodeAt(0),16777619);return hash>>>0;};
 return items.filter(g=>g.id!==selectedId).sort((a,b)=>rank(a)-rank(b)||(rank(a)===0?(b.lastPlayed-a.lastPlayed):variety(a)-variety(b))||compareTitles(a.title,b.title)).slice(0,30);
}
function fitManhattanElsewhere(){
 if(presentation!=='manhattan')return;
 const panel=$('#manhattan-details'),list=$('#manhattan-recent');
 if(!panel.clientHeight||list.hidden)return;
 const rows=[...list.children];if(!rows.length)return;
 rows.forEach(row=>row.hidden=false);
 const height=rows[0].getBoundingClientRect().height;
 const available=panel.getBoundingClientRect().bottom-list.getBoundingClientRect().top+panel.scrollTop-22;
 const count=Math.max(3,Math.floor(available/Math.max(1,height)));
 rows.forEach((row,i)=>row.hidden=i>=count);
}
function syncManhattanDate(){
 clearTimeout(manhattanDateTimer);
 if(presentation!=='manhattan')return;
 const now=new Date();
 $('.topbar').dataset.edition=now.toLocaleDateString('en-US',{weekday:'long'})+' Edition';
 $('#manhattan-date').textContent=now.toLocaleDateString(undefined,{year:'numeric',month:'long',day:'numeric'});
 if(!document.hidden){const midnight=new Date(now);midnight.setHours(24,0,0,50);manhattanDateTimer=setTimeout(syncManhattanDate,midnight-now);}
}
function manhattanFocus(){
 const target=manhattanPane==='tabs'?$('#manhattan-tabs .current'):$('#grid .presentation-selected')||$('#grid .show-all-matches')||$('#manhattan-tabs .current');
 controllerFocus(target,true);
 if(manhattanPane==='tabs'&&target)revealCategoryItem(target.parentElement,target,true);
 if(manhattanPane==='games')revealManhattanRow();
}
function revealManhattanRow(){
 if(presentation!=='manhattan')return;
 const grid=$('#grid'),row=grid.querySelector('.presentation-selected');if(!row)return;
 const box=grid.getBoundingClientRect(),item=row.getBoundingClientRect();
 if(item.top<box.top)grid.scrollTop+=item.top-box.top;
 else if(item.bottom>box.bottom)grid.scrollTop+=item.bottom-box.bottom;
}
function manhattanOpen(index){const s=sections()[index];if(!s)return;favoritesOnly=s.favorite;setGenre(s.genre,true);persist();}
function manhattanSelect(index,focus=true){
 const game=filtered[Math.max(0,Math.min(filtered.length-1,index))];presentationId=game?.id||null;controllerGameId=presentationId;
 renderManhattan();syncSearchFeedback();if(focus)manhattanFocus();queueCarouselSave();
}
function sizeManhattanCover(){
 if(presentation!=='manhattan')return;
 const panel=$('#manhattan-art'),width=Math.max(0,Math.min(panel.clientWidth-28,(panel.clientHeight-8)/1.5));
 Object.assign($('#manhattan-cover').style,{width:width+'px',height:width*1.5+'px'});
}
function renderManhattan(){
 const tabs=$('#manhattan-tabs'),list=sections(),signature=JSON.stringify(list.map(s=>[s.label,searchSummary?searchSectionCount(s.favorite?'favorites':s.genre?'genre:'+s.genre:'all',0):null]));
 if(tabs.dataset.signature!==signature){
  tabs.dataset.signature=signature;tabs.replaceChildren(...list.map((s,i)=>{
   const b=el('button','manhattan-tab');manhattanText(b,s.label.replace('★ ',''));
   if(searchSummary){const n=searchSectionCount(s.favorite?'favorites':s.genre?'genre:'+s.genre:'all',0);b.append(el('small','',String(n)));b.classList.toggle('search-no-match',!n);}
   b.onclick=()=>{manhattanPane='tabs';manhattanOpen(i);manhattanFocus()};b.onfocus=()=>{manhattanPane='tabs'};return b;
  }));
 }
 [...tabs.children].forEach((b,i)=>{const on=i===sectionIndex();b.classList.toggle('current',on);b.setAttribute('aria-pressed',String(on));b.tabIndex=on?0:-1});revealCategoryItem(tabs,tabs.querySelector('.current'),true);
 syncManhattanDate();
 $('#manhattan-total').textContent=games.length.toLocaleString()+' games in your collection';
 manhattanText($('#manhattan-category'),sectionLabel().replace('★ ',''));$('#manhattan-count').textContent=filtered.length.toLocaleString()+' '+(filtered.length===1?'game':'games')+(query?' found':'');
 const index=Math.max(0,filtered.findIndex(g=>g.id===presentationId)),game=filtered[index];presentationId=game?.id||null;controllerGameId=presentationId;
 const page=Math.floor(index/8),items=filtered.slice(page*8,page*8+8),grid=$('#grid'),key=JSON.stringify([page,query,items.map(g=>[g.id,g.title,!!g.favorite])]);
 if(key!==manhattanPageKey||!grid.querySelector('.manhattan-row')){
  manhattanPageKey=key;grid.replaceChildren(...items.map((g,i)=>{
   const b=el('button','game manhattan-row');b.dataset.id=g.id;b.title=g.title;b.append(el('span','game-title',g.title));syncFavoriteCard(b,g);
   b.onclick=()=>{manhattanPane='games';manhattanSelect(page*8+i)};
   b.onfocus=()=>{manhattanPane='games';if(presentationId!==g.id)manhattanSelect(page*8+i,false)};
   b.ondblclick=()=>play(g.id,b);b.oncontextmenu=e=>{e.preventDefault();manhattanSelect(page*8+i,false);editGame(g)};return b;
  }));
  if(!game)grid.append(el('p','manhattan-empty',query?'No matching titles.':!games.length?'Add a game to begin your collection.':favoritesOnly?'No favorites yet.':'No games in this category.'));
 }
 for(const row of grid.querySelectorAll('.game')){const on=row.dataset.id===presentationId;row.classList.toggle('presentation-selected',on);row.classList.remove('controller-selected');row.tabIndex=on?0:-1;row.setAttribute('aria-current',String(on));}
 const image=$('#manhattan-cover');image.hidden=!game;
 if(game){if(image.getAttribute('src')!==game.image)image.src=game.image;image.alt=game.title+' cover';}else{image.removeAttribute('src');image.alt='';}
 const metadata=$('#manhattan-type'),shortcut=game&&(game.kind==='shortcut'||!!game.intentUri);
 const destination=game?(shortcut?(game.intentUri||game.component||game.package||game.action):(game.package||game.component)):'';
 metadata.replaceChildren();metadata.title=destination||'';
 if(game){metadata.append(el('span','',shortcut?'Shortcut':'Android game'));if(destination)metadata.append(el('small','manhattan-target',destination));}
 setFavoriteButton($('#manhattan-favorite'),game);
 $('#manhattan-position').textContent=game?`${index+1} / ${filtered.length}`:'0 / 0';
 for(const b of document.querySelectorAll('[data-manhattan-game]'))b.disabled=!game;
 const recent=manhattanElsewhere(filtered,game?.id),recentKey=JSON.stringify(recent.map(g=>[g.id,g.title]));
 const recentList=$('#manhattan-recent');
 recentList.hidden=!recent.length;$('#manhattan-elsewhere-heading').hidden=!recent.length;
 if(recentList.dataset.key!==recentKey){recentList.dataset.key=recentKey;recentList.replaceChildren(...recent.map(g=>{const b=el('button','',g.title);b.title=g.title;b.onclick=()=>play(g.id,b);return b}));}
 $('#empty').hidden=true;$('#load').hidden=true;sizeManhattanCover();fitManhattanElsewhere();
}
function manhattanBack(){
 if(document.activeElement===$('#search')){native?.hideKeyboard?.();$('#search').blur();if(!query){manhattanFocus();return true;}}
 if(query){query='';$('#search').value='';update();manhattanFocus();persist();return true;}
 if(manhattanPane==='games'){manhattanPane='tabs';manhattanFocus();return true;}return false;
}
function manhattanController(action){
 if(['search','menu','apps'].includes(action))return false;
 if(action==='back')return manhattanBack();
 const active=document.activeElement;
 if(active?.matches('input,textarea,select')){if(['down','activate'].includes(action)){active.blur();native?.hideKeyboard?.();manhattanPane='games';manhattanFocus();return true;}return false;}
 if(action==='activate'&&active?.matches('.show-all-matches')){active.click();return true;}
 if(action==='activate'&&active?.matches('button')&&!active.closest('#grid,#manhattan-tabs')){active.click();return true;}
 if(action==='genrePrev'||action==='genreNext'){manhattanOpen((sectionIndex()+(action==='genreNext'?1:-1)+sections().length)%sections().length);manhattanFocus();return true;}
 if(manhattanPane==='tabs'){
  if(action==='left'||action==='right'){manhattanOpen((sectionIndex()+(action==='right'?1:-1)+sections().length)%sections().length);manhattanFocus();return true;}
  if(action==='down'||action==='activate'){manhattanPane='games';manhattanFocus();return true;}
  if(action==='up'){controllerFocus($('#search'));return true;}
 }
 const index=Math.max(0,filtered.findIndex(g=>g.id===presentationId));
 if(action==='up'&&index===0){manhattanPane='tabs';manhattanFocus();return true;}
 const delta={up:-1,down:1,left:-8,right:8,pageUp:-8,pageDown:8}[action];
 if(delta!==undefined){manhattanPane='games';manhattanSelect(index+delta);return true;}
 const game=filtered.find(g=>g.id===presentationId);
 if(['activate','edit','favorite'].includes(action)){if(game){if(action==='activate')play(game.id,$('#grid .presentation-selected'));else if(action==='edit')editGame(game);else{toggleFavorite(game.id);manhattanFocus();}}return true;}return false;
}
function initManhattan(){
 const main=$('#main'),part=(tag,id)=>{const n=el(tag,'manhattan-part');n.id='manhattan-'+id;return n};
 const issue=part('div','issue'),date=el('span'),total=el('span');date.id='manhattan-date';total.id='manhattan-total';issue.append(date,total);
 const tabs=part('nav','tabs');tabs.setAttribute('aria-label','Categories');
 const heading=part('header','heading'),category=el('h1'),count=el('p');category.id='manhattan-category';count.id='manhattan-count';heading.append(category,count);
 const art=part('div','art'),image=el('img');image.id='manhattan-cover';art.append(image);
 const details=part('section','details'),type=el('p');type.id='manhattan-type';details.append(type);
 const actions=el('div','manhattan-actions');
 for(const [id,label,action] of [['play','▶ Play','activate'],['edit','Edit','edit'],['favorite','☆','favorite']]){const b=el('button','',label);b.id='manhattan-'+id;b.dataset.manhattanGame='true';b.onclick=()=>{manhattanPane='games';manhattanFocus();manhattanController(action)};actions.append(b);}
 const recent=el('div'),elsewhere=el('h3','','Elsewhere in this section');recent.id='manhattan-recent';elsewhere.id='manhattan-elsewhere-heading';details.append(actions,elsewhere,recent);
 const footer=part('nav','footer');footer.setAttribute('aria-label','Game controls');
 for(const [key,label,action] of [['A','Open','activate'],['B','Back','back'],['X','Edit','edit'],['Y','Search','search']]){const b=el('button','manhattan-hint');b.append(el('b','manhattan-key '+key.toLowerCase(),key),el('span','',label));b.onclick=()=>{if(action==='search'){controller(action);return;}manhattanFocus();manhattanController(action)};if(['activate','edit'].includes(action))b.dataset.manhattanGame='true';footer.append(b);}
 const sections=el('span','manhattan-section-help');
 for(const [label,action] of [['LB','genrePrev'],['RB','genreNext']]){const b=el('button','',label);b.onclick=()=>manhattanController(action);sections.append(b);}sections.append(el('span','','Sections'));
 const position=el('span');position.id='manhattan-position';footer.append(sections,position);main.append(issue,tabs,heading,art,details,footer);
 new ResizeObserver(()=>{sizeManhattanCover();fitManhattanElsewhere()}).observe(art);
 new ResizeObserver(fitManhattanElsewhere).observe(details);
 new ResizeObserver(revealManhattanRow).observe($('#grid'));
 document.fonts.addEventListener('loadingdone',fitManhattanElsewhere);
 document.addEventListener('visibilitychange',syncManhattanDate);
}
