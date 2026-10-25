// A paged card catalogue. Only the current cover and eight title rows are rendered.
let paloaltoPane='index',paloaltoPageKey='';
function sizePaloaltoCover(){if(presentation!=='paloalto')return;const panel=$('#paloalto-art'),width=Math.max(0,Math.min(panel.clientWidth-4,(panel.clientHeight-4)/1.5));Object.assign($('#paloalto-cover').style,{width:width+'px',height:width*1.5+'px'});}
function paloaltoFocus(){
 const target=paloaltoPane==='tabs'?$('#paloalto-tabs .current'):$('#grid .presentation-selected')||$('#grid .show-all-matches')||$('#paloalto-tabs .current');
 controllerFocus(target,true);
 if(paloaltoPane==='tabs')target?.scrollIntoView({block:'nearest',inline:'nearest'});
}
function paloaltoOpen(index){const s=sections()[index];if(!s)return;favoritesOnly=s.favorite;setGenre(s.genre,true);persist();}
function paloaltoSelect(index,focus=false){
 const g=filtered[Math.max(0,Math.min(filtered.length-1,index))];presentationId=g?.id||null;controllerGameId=presentationId;
 renderPaloalto();if(focus)paloaltoFocus();queueCarouselSave();
}
function paloaltoMove(delta,focus=true){paloaltoSelect(Math.max(0,filtered.findIndex(g=>g.id===presentationId))+delta,focus)}
function syncPaloaltoCover(){
 if(presentation!=='paloalto')return;
 const img=$('#paloalto-cover'),rgb=img.complete&&img.naturalWidth?coverColor(img):null;
 img.style.setProperty('--cover-glow-rgb',rgb||'128,128,128');
 if(backdrop==='gradient')$('#soft-gradient').style.setProperty('--backdrop-rgb',rgb||'128,128,128');
}
function renderPaloalto(){
 const tabs=$('#paloalto-tabs'),list=sections();
 const signature=JSON.stringify(list.map(s=>[s.label,searchSummary?searchSectionCount(s.favorite?'favorites':s.genre?'genre:'+s.genre:'all',0):null]));
 if(tabs.dataset.signature!==signature){tabs.dataset.signature=signature;tabs.replaceChildren(...list.map((s,i)=>{
  const b=el('button','paloalto-tab',s.label.replace('★ ',''));b.title=s.label;
  if(searchSummary){const n=searchSectionCount(s.favorite?'favorites':s.genre?'genre:'+s.genre:'all',0);b.append(el('small','',String(n)));b.classList.toggle('search-no-match',!n);}
  b.onclick=()=>{paloaltoPane='tabs';paloaltoOpen(i);paloaltoFocus()};return b;
 }));}
 [...tabs.children].forEach((b,i)=>{b.classList.toggle('current',i===sectionIndex());b.setAttribute('aria-pressed',String(i===sectionIndex()));b.tabIndex=i===sectionIndex()?0:-1;});
 const active=tabs.querySelector('.current');if(active){const a=active.getBoundingClientRect(),t=tabs.getBoundingClientRect();if(a.left<t.left)tabs.scrollLeft-=t.left-a.left;else if(a.right>t.right)tabs.scrollLeft+=a.right-t.right;}
 $('#paloalto-stack-name').textContent=sectionLabel().replace('★ ','');
 let index=filtered.findIndex(g=>g.id===presentationId);if(index<0)index=0;
 const g=filtered[index];presentationId=g?.id||null;controllerGameId=presentationId;
 const page=Math.floor(index/8),items=filtered.slice(page*8,page*8+8),grid=$('#grid');
 const key=JSON.stringify(items.map(g=>[g.id,g.title,!!g.favorite]));
 if(paloaltoPageKey!==key||!grid.querySelector('.paloalto-row')){
  paloaltoPageKey=key;grid.replaceChildren(...items.map((game,i)=>{
   const b=el('button','game paloalto-row');b.dataset.id=game.id;b.append(el('span','game-title',game.title));syncFavoriteCard(b,game);
   b.setAttribute('aria-label','Select '+game.title);b.onclick=()=>{paloaltoPane='index';paloaltoSelect(page*8+i,true)};
   b.onfocus=()=>{paloaltoPane='index';if(presentationId!==game.id)paloaltoSelect(page*8+i)};
   b.ondblclick=()=>play(game.id,b);b.oncontextmenu=e=>{e.preventDefault();paloaltoSelect(page*8+i);openGame(game.id,b)};return b;
  }));
  if(!g)grid.append(el('p','paloalto-empty',query?'No matching titles.':!games.length?'Your library is empty. Choose Add game to begin.':favoritesOnly?'No favorites yet.':'No games in this category.'));
 }
 for(const row of grid.querySelectorAll('.game')){const on=row.dataset.id===presentationId;row.classList.toggle('presentation-selected',on);row.classList.remove('controller-selected');row.tabIndex=on?0:-1;}
 const cover=$('#paloalto-cover');cover.hidden=!g;if(g){if(cover.getAttribute('src')!==g.image)cover.src=g.image;cover.alt=g.title+' cover';}else{cover.removeAttribute('src');cover.alt='';}
 $('#paloalto-title').textContent=g?.title||'Empty stack';$('#paloalto-genre').textContent=g?.genre||'';
 $('#paloalto-count').textContent=filtered.length.toLocaleString()+' cards';$('#paloalto-position').textContent=g?`${index+1} / ${filtered.length}`:'0 / 0';
 $('#paloalto-prev').disabled=!g||index===0;$('#paloalto-next').disabled=!g||index===filtered.length-1;
 for(const button of document.querySelectorAll('[data-paloalto-game]'))button.disabled=!g;
 setFavoriteButton($('#paloalto-favorite'),g);$('#empty').hidden=true;$('#load').hidden=true;sizePaloaltoCover();syncPaloaltoCover();
}
function paloaltoBack(){
 if(query){query='';$('#search').value='';$('#search').blur();update();paloaltoFocus();persist();return true;}
 if(paloaltoPane==='index'){paloaltoPane='tabs';paloaltoFocus();return true;}
 return false;
}
function paloaltoController(action){
 if(['search','menu','apps'].includes(action))return false;
 if(document.activeElement?.matches('input,textarea,select')){
  if(['down','activate','back'].includes(action)){document.activeElement.blur();paloaltoPane='index';paloaltoFocus();return true;}return false;
 }
 document.body.dataset.input='controller';
 const active=document.activeElement;
 if(action==='activate'&&active?.matches('button')&&!active.closest('#grid,#paloalto-tabs')){active.click();return true;}
 if(action==='back'){paloaltoBack();return true;}
 if(action==='genrePrev'||action==='genreNext'){paloaltoOpen((sectionIndex()+(action==='genreNext'?1:-1)+sections().length)%sections().length);paloaltoFocus();return true;}
 if(paloaltoPane==='tabs'){
  if(action==='left'||action==='right'){paloaltoOpen((sectionIndex()+(action==='right'?1:-1)+sections().length)%sections().length);paloaltoFocus();return true;}
  if(action==='activate'||action==='down'){paloaltoPane='index';paloaltoFocus();return true;}
  if(action==='up')return true;
 }
 const index=Math.max(0,filtered.findIndex(g=>g.id===presentationId));
 if(action==='up'&&index===0){paloaltoPane='tabs';paloaltoFocus();return true;}
 const delta={up:-1,down:1,left:-4,right:4,pageUp:-8,pageDown:8}[action];
 if(delta!==undefined){paloaltoPane='index';if(filtered.length)paloaltoMove(delta);else paloaltoFocus();return true;}
 const g=filtered.find(g=>g.id===presentationId);
 if(['activate','edit','favorite'].includes(action)){if(g){if(action==='activate')play(g.id,$('#grid .presentation-selected'));else if(action==='edit')openGame(g.id,$('#grid .presentation-selected'));else toggleFavorite(g.id);}return true;}
 return false;
}
function initPaloalto(){
 const main=$('#main');
 const bar=el('div','paloalto-part');bar.id='paloalto-bar';const title=el('span');title.id='paloalto-stack-name';bar.append(title);
 const tabs=el('nav','paloalto-part');tabs.id='paloalto-tabs';tabs.setAttribute('aria-label','Categories');
 const art=el('div','paloalto-part');art.id='paloalto-art';const img=el('img');img.id='paloalto-cover';art.append(img);img.addEventListener('load',syncPaloaltoCover);
 const heading=el('div','paloalto-part');heading.id='paloalto-heading';const name=el('h1');name.id='paloalto-title';const genre=el('p');genre.id='paloalto-genre';heading.append(name,genre);
 const label=el('div','paloalto-part','In this stack');label.id='paloalto-index-label';
 const actions=el('div','paloalto-part');actions.id='paloalto-actions';
 for(const [id,text,fn] of [['play','Play',()=>{if(presentationId)play(presentationId,$('#grid .presentation-selected'))}],['details','Details',()=>{if(presentationId)openGame(presentationId,$('#grid .presentation-selected'))}],['favorite','☆',()=>toggleFavorite(presentationId)]]){const b=el('button','secondary',text);b.id='paloalto-'+id;b.dataset.paloaltoGame='true';b.onclick=fn;actions.append(b);}
 const footer=el('div','paloalto-part');footer.id='paloalto-footer';const count=el('span');count.id='paloalto-count';const position=el('span');position.id='paloalto-position';footer.append(count,position);
 for(const [id,text,delta] of [['prev','◀',-1],['next','▶',1]]){const b=el('button','secondary',text);b.id='paloalto-'+id;b.setAttribute('aria-label',delta<0?'Previous card':'Next card');b.onclick=()=>{paloaltoPane='index';paloaltoMove(delta)};footer.append(b);}
 const hints=el('nav','paloalto-part');hints.id='paloalto-hints';hints.setAttribute('aria-label','Game controls');
 for(const [key,text,action] of [['A','Play','activate'],['B','Index','back'],['X','Details','edit'],['Y','Find','search']]){const b=el('button');const badge=el('span','paloalto-key '+key.toLowerCase(),key);b.append(badge,el('span','',text));b.onclick=()=>controller(action);if(action==='activate'||action==='edit')b.dataset.paloaltoGame='true';hints.append(b);}
 hints.append(el('small','','LB/RB Categories · LT/RT Page'));
 main.append(bar,tabs,art,heading,label,actions,footer,hints);
 new ResizeObserver(sizePaloaltoCover).observe(art);
}
