// A paged gallery: only the visible frames are mounted, with fixed 2:3 artwork.
let florencePane='games',florenceColumns=4,florenceRows=1;
function florenceFocus(){controllerFocus(florencePane==='tabs'?$('#florence-tabs .current'):$('#grid .presentation-selected')||$('#grid .show-all-matches')||$('#florence-tabs .current'),true);}
function florenceOpen(i){const list=sections(),s=list[(i+list.length)%list.length];if(!s)return;favoritesOnly=s.favorite;setGenre(s.genre,true);persist();}
function florenceSelect(i,focus=true){const g=filtered[Math.max(0,Math.min(filtered.length-1,i))];presentationId=g?.id||null;controllerGameId=presentationId;renderFlorence();syncSearchFeedback();if(focus)florenceFocus();queueCarouselSave();}
function sizeFlorence(){
 if(presentation!=='florence')return;
 const grid=$('#grid'),cols=Math.max(1,Math.min(6,Math.floor(grid.clientWidth/230)||1));
 const width=Math.max(18,Math.min((grid.clientHeight-110)/1.57,(grid.clientWidth-48)/cols-60));
 grid.style.setProperty('--gallery-art',width+'px');grid.style.setProperty('--gallery-cols',cols);
 if(cols!==florenceColumns){florenceColumns=cols;renderFlorence();}
}
function renderFlorence(){
 const tabs=$('#florence-tabs'),list=sections(),key=JSON.stringify(list.map(s=>[s.label,searchSummary?searchSectionCount(s.favorite?'favorites':s.genre?'genre:'+s.genre:'all',0):null]));
 if(tabs.dataset.key!==key){tabs.dataset.key=key;tabs.replaceChildren(...list.map((s,i)=>{const b=el('button','florence-tab'),label=el('span','',s.label.replace('★ ',''));b.append(label);b.title=label.textContent;if(searchSummary){const n=searchSectionCount(s.favorite?'favorites':s.genre?'genre:'+s.genre:'all',0);b.append(el('small','',String(n)));b.classList.toggle('search-no-match',!n);}b.onfocus=()=>florencePane='tabs';b.onclick=()=>{florencePane='tabs';florenceOpen(i);florenceFocus()};return b}));}
 [...tabs.children].forEach((b,i)=>{const on=i===sectionIndex();b.classList.toggle('current',on);b.tabIndex=on?0:-1;b.setAttribute('aria-pressed',String(on));});revealCategoryItem(tabs,tabs.querySelector('.current'),true);
 const grid=$('#grid'),index=Math.max(0,filtered.findIndex(g=>g.id===presentationId)),current=filtered[index],count=florenceColumns*florenceRows,start=Math.floor(index/count)*count;
 presentationId=current?.id||null;controllerGameId=presentationId;
 const items=filtered.slice(start,start+count),existing=new Map([...grid.querySelectorAll('.game')].map(b=>[b.dataset.id,b]));
 if(!grid.querySelector('.florence-shelf')){grid.replaceChildren();for(let r=0;r<florenceRows;r++)grid.append(el('div','florence-shelf'));}
 while(grid.querySelectorAll('.florence-shelf').length>florenceRows)grid.lastElementChild.remove();
 while(grid.querySelectorAll('.florence-shelf').length<florenceRows)grid.append(el('div','florence-shelf'));
 const shelves=[...grid.querySelectorAll('.florence-shelf')],keep=new Set();
 items.forEach((g,i)=>{let b=existing.get(g.id);if(!b){b=card(g);b.classList.add('florence-case');const label=el('span','florence-label');label.append(el('span','gallery-title'));b.append(label);b.onfocus=()=>{florencePane='games';if(presentationId!==g.id)florenceSelect(filtered.findIndex(item=>item.id===g.id),false)};}syncGameCard(b,g);b.title=g.title;
 const on=g.id===presentationId;b.classList.toggle('presentation-selected',on);b.classList.remove('controller-selected');b.tabIndex=on?0:-1;b.setAttribute('aria-current',String(on));b.querySelector('img').loading='eager';b.querySelector('.gallery-title').textContent=(g.favorite?'★ ':'')+g.title;
 const shelf=shelves[Math.floor(i/florenceColumns)];if(b.parentElement!==shelf||shelf.children[i%florenceColumns]!==b)shelf.insertBefore(b,shelf.children[i%florenceColumns]||null);keep.add(b);});
 for(const b of existing.values())if(!keep.has(b))b.remove();
 grid.querySelector('.florence-empty')?.remove();if(!current)grid.append(el('p','florence-empty',query?'No matching titles.':favoritesOnly?'No favorites yet.':'Add a game to begin your collection.'));
 $('#florence-position').textContent=current?`${index+1} / ${filtered.length.toLocaleString()}`:'0 / 0';
 $('#florence-prev').disabled=!current||start===0;$('#florence-next').disabled=!current||start+count>=filtered.length;
 for(const b of document.querySelectorAll('[data-florence-game]'))b.disabled=!current;
 $('#florence-heading').textContent=sectionLabel().replace('★ ','');$('#florence-count').textContent=filtered.length.toLocaleString()+' games';$('#load').hidden=true;$('#empty').hidden=true;sizeFlorence();syncSearchFeedback();resetPresentationScroll();
}
function florenceBack(){if(document.activeElement===$('#search')){native?.hideKeyboard?.();$('#search').blur();}if(query){query='';$('#search').value='';update();florenceFocus();persist();return true;}if(florencePane==='games'){florencePane='tabs';florenceFocus();return true;}return false;}
function florenceController(action){
 if(['search','menu','apps'].includes(action))return false;
 if(action==='back')return florenceBack();
 const active=document.activeElement;
 if(active?.matches('input,textarea,select')){if(['down','activate'].includes(action)){active.blur();native?.hideKeyboard?.();florencePane='games';florenceFocus();return true;}return false;}
 if(action==='activate'&&active?.matches('button')&&!active.closest('.florence-shelf,#florence-tabs')){active.click();return true;}
 if(action==='genrePrev'||action==='genreNext'){florenceOpen(sectionIndex()+(action==='genreNext'?1:-1));florenceFocus();return true;}
 if(florencePane==='tabs'){if(action==='left'||action==='right'){florenceOpen(sectionIndex()+(action==='right'?1:-1));florenceFocus();return true;}if(action==='down'||action==='activate'){florencePane='games';florenceFocus();return true;}if(action==='up'){openControllerHeader();return true;}}
 const index=Math.max(0,filtered.findIndex(g=>g.id===presentationId));
 if(action==='up'){florencePane='tabs';florenceFocus();return true;}
 const delta={left:-1,right:1,pageUp:-florenceColumns*florenceRows,pageDown:florenceColumns*florenceRows}[action];
 if(delta!==undefined){florencePane='games';florenceSelect(index+delta);return true;}
 if(action==='down')return true;
 const game=filtered.find(g=>g.id===presentationId);
 if(['activate','edit','favorite'].includes(action)){if(game){if(action==='activate')play(game.id,$('#grid .presentation-selected'));else if(action==='edit')editGame(game);else{toggleFavorite(game.id);florenceFocus();}}return true;}return false;
}
function initFlorence(){
 const heading=el('header','florence-part');heading.id='florence-intro';const title=el('h1');title.id='florence-heading';const count=el('span');count.id='florence-count';heading.append(title,count);$('#main').append(heading);
 const tabs=el('nav','florence-part');tabs.id='florence-tabs';tabs.setAttribute('aria-label','Categories');
 const footer=el('nav','florence-part');footer.id='florence-footer';footer.setAttribute('aria-label','Game controls');
 for(const [key,label,action] of [['A','Open','activate'],['B','Back','back'],['X','Edit','edit'],['Y','Search','search']]){const b=el('button','florence-hint');b.append(el('b',key.toLowerCase(),key),el('span','',label));b.onclick=()=>{if(action==='search')controller(action);else{florencePane='games';florenceFocus();florenceController(action)}};if(['activate','edit'].includes(action))b.dataset.florenceGame='true';footer.append(b);}
 const categories=el('span','florence-categories');for(const [key,action] of [['LB','genrePrev'],['RB','genreNext']]){const b=el('button','',key);b.onclick=()=>florenceController(action);categories.append(b);}categories.append(el('span','','Categories'));
 const pages=el('span','florence-pages');for(const [id,label,action] of [['prev','‹','pageUp'],['next','›','pageDown']]){const b=el('button','',label);b.id='florence-'+id;b.setAttribute('aria-label',id==='prev'?'Previous gallery page':'Next gallery page');b.onclick=()=>florenceController(action);pages.append(b);}
 const pos=el('span');pos.id='florence-position';footer.append(categories,pages,pos);$('#main').append(tabs,footer);
 const grid=$('#grid');let drag=null,ignoreUntil=0,lastWheel=0;
 grid.addEventListener('pointerdown',e=>{if(presentation==='florence'&&e.pointerType==='touch')drag={x:e.clientX,y:e.clientY};});
 grid.addEventListener('pointerup',e=>{if(!drag)return;const dx=e.clientX-drag.x,dy=e.clientY-drag.y;drag=null;if(presentation==='florence'&&Math.abs(dx)>45&&Math.abs(dx)>Math.abs(dy)){ignoreUntil=performance.now()+400;florenceController(dx<0?'pageDown':'pageUp');}});
 grid.addEventListener('pointercancel',()=>drag=null);
 grid.addEventListener('click',e=>{if(presentation==='florence'&&performance.now()<ignoreUntil&&e.detail){e.preventDefault();e.stopImmediatePropagation();}},true);
 grid.addEventListener('wheel',e=>{if(presentation!=='florence'||e.ctrlKey||Math.abs(e.deltaY)+Math.abs(e.deltaX)<10)return;e.preventDefault();if(performance.now()-lastWheel<200)return;lastWheel=performance.now();florenceController((Math.abs(e.deltaX)>Math.abs(e.deltaY)?e.deltaX:e.deltaY)>0?'pageDown':'pageUp');},{passive:false});
}
