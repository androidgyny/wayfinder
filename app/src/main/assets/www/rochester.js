// A paged lighttable: only the visible frames are mounted, with fixed 2:3 artwork.
let rochesterPane='games',rochesterColumns=4,rochesterRows=1;
function rochesterFocus(){controllerFocus(rochesterPane==='tabs'?$('#rochester-tabs .current'):$('#grid .presentation-selected')||$('#grid .show-all-matches')||$('#rochester-tabs .current'),true);}
function rochesterOpen(i){const list=sections(),s=list[(i+list.length)%list.length];if(!s)return;favoritesOnly=s.favorite;setGenre(s.genre,true);persist();}
function rochesterSelect(i,focus=true){const g=filtered[Math.max(0,Math.min(filtered.length-1,i))];presentationId=g?.id||null;controllerGameId=presentationId;renderRochester();syncSearchFeedback();if(focus)rochesterFocus();queueCarouselSave();}
function sizeRochester(){
 if(presentation!=='rochester')return;
 const grid=$('#grid'),cols=Math.max(1,Math.min(6,Math.floor(grid.clientWidth/250)||1));
 const width=Math.max(18,Math.min((grid.clientHeight-140)/1.5,(grid.clientWidth-64)/cols-42));
 sizeRochesterTabs();syncRochesterMarquee();grid.style.setProperty('--lighttable-art',width+'px');grid.style.setProperty('--lighttable-cols',cols);
 if(cols!==rochesterColumns){rochesterColumns=cols;renderRochester();}
}
function renderRochester(){
 const tabs=$('#rochester-tabs'),list=sections(),key=JSON.stringify(list.map(s=>[s.label,searchSummary?searchSectionCount(s.favorite?'favorites':s.genre?'genre:'+s.genre:'all',0):null]));
 if(tabs.dataset.key!==key){tabs.dataset.key=key;tabs.replaceChildren(...list.map((s,i)=>{const b=el('button','rochester-tab'),label=el('span','rochester-tab-clip'),text=el('span','rochester-tab-text',s.label.replace('★ ',''));label.append(text);b.append(label);b.title=text.textContent;if(searchSummary){const n=searchSectionCount(s.favorite?'favorites':s.genre?'genre:'+s.genre:'all',0);b.append(el('small','',String(n)));b.classList.toggle('search-no-match',!n);}b.onfocus=()=>rochesterPane='tabs';b.onclick=()=>{rochesterPane='tabs';rochesterOpen(i);rochesterFocus()};return b}));}
 [...tabs.querySelectorAll('.rochester-tab')].forEach((b,i)=>{const on=i===sectionIndex();b.classList.toggle('current',on);b.tabIndex=on?0:-1;b.setAttribute('aria-pressed',String(on));});sizeRochesterTabs();
 const grid=$('#grid'),index=Math.max(0,filtered.findIndex(g=>g.id===presentationId)),current=filtered[index],count=rochesterColumns*rochesterRows,start=Math.floor(index/count)*count;
 presentationId=current?.id||null;controllerGameId=presentationId;
 const items=filtered.slice(start,start+count),existing=new Map([...grid.querySelectorAll('.game')].map(b=>[b.dataset.id,b]));
 if(!grid.querySelector('.rochester-shelf')){grid.replaceChildren();for(let r=0;r<rochesterRows;r++)grid.append(el('div','rochester-shelf'));}
 while(grid.querySelectorAll('.rochester-shelf').length>rochesterRows)grid.lastElementChild.remove();
 while(grid.querySelectorAll('.rochester-shelf').length<rochesterRows)grid.append(el('div','rochester-shelf'));
 const shelves=[...grid.querySelectorAll('.rochester-shelf')],keep=new Set();
 items.forEach((g,i)=>{let b=existing.get(g.id);if(!b){b=card(g);b.classList.add('rochester-case');const label=el('span','rochester-label');label.append(el('span','lighttable-title'));b.append(label);b.onfocus=()=>{rochesterPane='games';if(presentationId!==g.id)rochesterSelect(filtered.findIndex(item=>item.id===g.id),false)};}syncGameCard(b,g);b.title=g.title;
 const on=g.id===presentationId;b.classList.toggle('presentation-selected',on);b.classList.remove('controller-selected');b.tabIndex=on?0:-1;b.setAttribute('aria-current',String(on));b.querySelector('img').loading='eager';b.dataset.lighttableFavorite=String(!!g.favorite);b.querySelector('.lighttable-title').textContent=g.title;
 const shelf=shelves[Math.floor(i/rochesterColumns)];if(b.parentElement!==shelf||shelf.children[i%rochesterColumns]!==b)shelf.insertBefore(b,shelf.children[i%rochesterColumns]||null);keep.add(b);});
 for(const b of existing.values())if(!keep.has(b))b.remove();
 grid.querySelector('.rochester-empty')?.remove();if(!current)grid.append(el('p','rochester-empty',query?'No matching titles.':favoritesOnly?'No favorites yet.':'Add a game to begin your collection.'));
 $('#rochester-position').textContent=current?`${index+1} / ${filtered.length.toLocaleString()}`:'0 / 0';
 $('#rochester-prev').disabled=!current||start===0;$('#rochester-next').disabled=!current||start+count>=filtered.length;
 for(const b of document.querySelectorAll('[data-rochester-game]'))b.disabled=!current;
 $('#rochester-heading').textContent=sectionLabel().replace('★ ','');$('#rochester-count').textContent=filtered.length.toLocaleString()+' games';$('#load').hidden=true;$('#empty').hidden=true;sizeRochester();syncSearchFeedback();resetPresentationScroll();
}
function rochesterBack(){if(document.activeElement===$('#search')){native?.hideKeyboard?.();$('#search').blur();}if(query){query='';$('#search').value='';update();rochesterFocus();persist();return true;}if(rochesterPane==='games'){rochesterPane='tabs';rochesterFocus();return true;}return false;}
function rochesterController(action){
 if(['search','menu','apps'].includes(action))return false;
 if(action==='back')return rochesterBack();
 const active=document.activeElement;
 if(active?.matches('input,textarea,select')){if(['down','activate'].includes(action)){active.blur();native?.hideKeyboard?.();rochesterPane='games';rochesterFocus();return true;}return false;}
 if(action==='activate'&&active?.matches('button')&&!active.closest('.rochester-shelf,#rochester-tabs')){active.click();return true;}
 if(action==='genrePrev'||action==='genreNext'){rochesterOpen(sectionIndex()+(action==='genreNext'?1:-1));rochesterFocus();return true;}
 if(rochesterPane==='tabs'){if(action==='left'||action==='right'){rochesterOpen(sectionIndex()+(action==='right'?1:-1));rochesterFocus();return true;}if(action==='down'||action==='activate'){rochesterPane='games';rochesterFocus();return true;}if(action==='up'){openControllerHeader();return true;}}
 const index=Math.max(0,filtered.findIndex(g=>g.id===presentationId));
 if(action==='up'){rochesterPane='tabs';rochesterFocus();return true;}
 const delta={left:-1,right:1,pageUp:-rochesterColumns*rochesterRows,pageDown:rochesterColumns*rochesterRows}[action];
 if(delta!==undefined){rochesterPane='games';rochesterSelect(index+delta);return true;}
 if(action==='down')return true;
 const game=filtered.find(g=>g.id===presentationId);
 if(['activate','edit','favorite'].includes(action)){if(game){if(action==='activate')play(game.id,$('#grid .presentation-selected'));else if(action==='edit')editGame(game);else{toggleFavorite(game.id);rochesterFocus();}}return true;}return false;
}
function initRochester(){
 const heading=el('header','rochester-part');heading.id='rochester-intro';const title=el('h1');title.id='rochester-heading';const count=el('span');count.id='rochester-count';heading.append(title,count);$('#main').append(heading);
 const tabs=el('nav','rochester-part');tabs.id='rochester-tabs';tabs.setAttribute('aria-label','Categories');
 const footer=el('nav','rochester-part');footer.id='rochester-footer';footer.setAttribute('aria-label','Game controls');
 for(const [key,label,action] of [['A','Open','activate'],['B','Back','back'],['X','Edit','edit'],['Y','Search','search']]){const b=el('button','rochester-hint');b.append(el('b',key.toLowerCase(),key),el('span','',label));b.onclick=()=>{if(action==='search')controller(action);else{rochesterPane='games';rochesterFocus();rochesterController(action)}};if(['activate','edit'].includes(action))b.dataset.rochesterGame='true';footer.append(b);}
 const categories=el('span','rochester-categories');for(const [key,action] of [['LB','genrePrev'],['RB','genreNext']]){const b=el('button','',key);b.onclick=()=>rochesterController(action);categories.append(b);}categories.insertBefore(el('span','','Categories'),categories.lastElementChild);
 const pages=el('span','rochester-pages');for(const [id,label,action] of [['prev','‹','pageUp'],['next','›','pageDown']]){const b=el('button','',label);b.id='rochester-'+id;b.setAttribute('aria-label',id==='prev'?'Previous lighttable page':'Next lighttable page');b.onclick=()=>rochesterController(action);pages.append(b);}
 const pos=el('span');pos.id='rochester-position';footer.append(categories,pages,pos);$('#main').append(tabs,footer);
 new ResizeObserver(()=>{sizeRochesterTabs();syncRochesterMarquee()}).observe(tabs);document.fonts.ready.then(syncRochesterMarquee);const grid=$('#grid');let drag=null,ignoreUntil=0,lastWheel=0;
 grid.addEventListener('pointerdown',e=>{if(presentation==='rochester'&&e.pointerType==='touch')drag={x:e.clientX,y:e.clientY};});
 grid.addEventListener('pointerup',e=>{if(!drag)return;const dx=e.clientX-drag.x,dy=e.clientY-drag.y;drag=null;if(presentation==='rochester'&&Math.abs(dx)>45&&Math.abs(dx)>Math.abs(dy)){ignoreUntil=performance.now()+400;rochesterController(dx<0?'pageDown':'pageUp');}});
 grid.addEventListener('pointercancel',()=>drag=null);
 grid.addEventListener('click',e=>{if(presentation==='rochester'&&performance.now()<ignoreUntil&&e.detail){e.preventDefault();e.stopImmediatePropagation();}},true);
 grid.addEventListener('wheel',e=>{if(presentation!=='rochester'||e.ctrlKey||Math.abs(e.deltaY)+Math.abs(e.deltaX)<10)return;e.preventDefault();if(performance.now()-lastWheel<200)return;lastWheel=performance.now();rochesterController((Math.abs(e.deltaX)>Math.abs(e.deltaY)?e.deltaX:e.deltaY)>0?'pageDown':'pageUp');},{passive:false});
}

function syncRochesterMarquee(){
 for(const b of document.querySelectorAll('#rochester-tabs .rochester-tab')){
 const clip=b.querySelector('.rochester-tab-clip'),text=b.querySelector('.rochester-tab-text');if(!clip||!text)continue;
 const distance=Math.max(0,text.scrollWidth-clip.clientWidth);b.classList.toggle('marquee',presentation==='rochester'&&b.classList.contains('current')&&distance>1);
 b.style.setProperty('--tab-travel',-distance+'px');b.style.setProperty('--tab-duration',Math.max(6,distance/24+3)+'s');
 }
}

function sizeRochesterTabs(){
 if(presentation!=='rochester')return;
 const tabs=$('#rochester-tabs');if(!tabs)return;
 const items=[...tabs.querySelectorAll('.rochester-tab')],count=Math.max(1,Math.min(5,Math.floor((tabs.clientWidth-70)/175))),index=Math.max(0,sectionIndex());
 const start=Math.floor(index/count)*count;
 items.forEach((b,i)=>b.hidden=i<start||i>=start+count);
 for(const [direction,label] of [[-1,'Previous categories'],[1,'Next categories']]){
 let b=tabs.querySelector('[data-tab-page="'+direction+'"]');
 if(!b){b=el('button','rochester-tab-page',direction<0?'‹':'›');b.dataset.tabPage=direction;b.setAttribute('aria-label',label);if(direction<0)tabs.prepend(b);else tabs.append(b);}
 b.disabled=direction<0?start===0:start+count>=items.length;
 b.onclick=()=>{rochesterPane='tabs';rochesterOpen(direction<0?Math.max(0,start-count):start+count);rochesterFocus()};
 }
 tabs.scrollLeft=0;
}
