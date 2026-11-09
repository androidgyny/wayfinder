// A bounded, two-shelf collection. Artwork geometry never depends on its source size.
let bendPane='games',bendColumns=5,bendRows=2,bendShelfCount=2;
function setBendShelves(value,save=true){bendShelfCount=Number(value)===1?1:2;$('#bend-shelves').value=String(bendShelfCount);if(presentation==='bend'){sizeBend();renderBend();resetPresentationScroll();requestAnimationFrame(()=>{if(presentation==='bend')resetPresentationScroll();});}if(save)persist();}
function bendFocus(){controllerFocus(bendPane==='tabs'?$('#bend-tabs .current'):$('#grid .presentation-selected')||$('#grid .show-all-matches')||$('#bend-tabs .current'),true);}
function bendOpen(i){const list=sections(),s=list[(i+list.length)%list.length];if(!s)return;favoritesOnly=s.favorite;setGenre(s.genre,true);persist();}
function bendSelect(i,focus=true){const g=filtered[Math.max(0,Math.min(filtered.length-1,i))];presentationId=g?.id||null;controllerGameId=presentationId;renderBend();syncSearchFeedback();if(focus)bendFocus();queueCarouselSave();}
function sizeBend(){
 if(presentation!=='bend')return;
 const grid=$('#grid'),rows=grid.clientHeight<230?1:bendShelfCount;
 const height=Math.max(24,(grid.clientHeight/rows)-40),ideal=height/1.5,cols=Math.max(2,Math.min(8,Math.round(grid.clientWidth/(ideal+30))||2)),width=Math.max(16,Math.min(ideal,(grid.clientWidth/cols)-28));
 grid.style.setProperty('--bend-cover',width+'px');grid.style.setProperty('--bend-cols',cols);grid.style.setProperty('--bend-rows',rows);
 if(rows!==bendRows||cols!==bendColumns){bendRows=rows;bendColumns=cols;renderBend();}
}
function renderBend(){
 const tabs=$('#bend-tabs'),list=sections(),key=JSON.stringify(list.map(s=>[s.label,searchSummary?searchSectionCount(s.favorite?'favorites':s.genre?'genre:'+s.genre:'all',0):null]));
 if(tabs.dataset.key!==key){tabs.dataset.key=key;tabs.replaceChildren(...list.map((s,i)=>{const b=el('button','bend-tab'),label=el('span','',s.label.replace('★ ',''));b.append(label);b.title=label.textContent;if(searchSummary){const n=searchSectionCount(s.favorite?'favorites':s.genre?'genre:'+s.genre:'all',0);b.append(el('small','',String(n)));b.classList.toggle('search-no-match',!n);}b.onfocus=()=>bendPane='tabs';b.onclick=()=>{bendPane='tabs';bendOpen(i);bendFocus()};return b}));}
 [...tabs.children].forEach((b,i)=>{const on=i===sectionIndex();b.classList.toggle('current',on);b.tabIndex=on?0:-1;b.setAttribute('aria-pressed',String(on));});revealCategoryItem(tabs,tabs.querySelector('.current'),true);
 const grid=$('#grid'),index=Math.max(0,filtered.findIndex(g=>g.id===presentationId)),current=filtered[index],count=bendColumns*bendRows,start=Math.floor(index/count)*count;
 presentationId=current?.id||null;controllerGameId=presentationId;
 const items=filtered.slice(start,start+count),existing=new Map([...grid.querySelectorAll('.game')].map(b=>[b.dataset.id,b]));
 if(!grid.querySelector('.bend-shelf')){grid.replaceChildren();for(let r=0;r<bendRows;r++)grid.append(el('div','bend-shelf'));}
 while(grid.querySelectorAll('.bend-shelf').length>bendRows)grid.lastElementChild.remove();
 while(grid.querySelectorAll('.bend-shelf').length<bendRows)grid.append(el('div','bend-shelf'));
 const shelves=[...grid.querySelectorAll('.bend-shelf')],keep=new Set();
 items.forEach((g,i)=>{let b=existing.get(g.id);if(!b){b=card(g);b.classList.add('bend-case');const label=el('span','bend-label');b.append(label);b.onfocus=()=>{bendPane='games';if(presentationId!==g.id)bendSelect(filtered.findIndex(item=>item.id===g.id),false)};}syncGameCard(b,g);b.title=g.title;
 const on=g.id===presentationId;b.classList.toggle('presentation-selected',on);b.classList.remove('controller-selected');b.tabIndex=on?0:-1;b.setAttribute('aria-current',String(on));b.querySelector('img').loading='eager';b.querySelector('.bend-label').textContent=on?(g.favorite?'★ ':'')+g.title:String(start+i+1).padStart(2,'0');
 const shelf=shelves[Math.floor(i/bendColumns)];if(b.parentElement!==shelf||shelf.children[i%bendColumns]!==b)shelf.append(b);keep.add(b);});
 for(const b of existing.values())if(!keep.has(b))b.remove();
 grid.querySelector('.bend-empty')?.remove();if(!current)grid.append(el('p','bend-empty',query?'No matching titles.':favoritesOnly?'No favorites yet.':'Add a game to begin your collection.'));
 $('#bend-position').textContent=current?`${index+1} / ${filtered.length.toLocaleString()}`:'0 / 0';
 $('#bend-prev').disabled=!current||start===0;$('#bend-next').disabled=!current||start+count>=filtered.length;
 for(const b of document.querySelectorAll('[data-bend-game]'))b.disabled=!current;
 $('#load').hidden=true;$('#empty').hidden=true;sizeBend();syncSearchFeedback();resetPresentationScroll();
}
function bendBack(){if(document.activeElement===$('#search')){native?.hideKeyboard?.();$('#search').blur();}if(query){query='';$('#search').value='';update();bendFocus();persist();return true;}if(bendPane==='games'){bendPane='tabs';bendFocus();return true;}return false;}
function bendController(action){
 if(['search','menu','apps'].includes(action))return false;
 if(action==='back')return bendBack();
 const active=document.activeElement;
 if(active?.matches('input,textarea,select')){if(['down','activate'].includes(action)){active.blur();native?.hideKeyboard?.();bendPane='games';bendFocus();return true;}return false;}
 if(action==='activate'&&active?.matches('button')&&!active.closest('.bend-shelf,#bend-tabs')){active.click();return true;}
 if(action==='genrePrev'||action==='genreNext'){bendOpen(sectionIndex()+(action==='genreNext'?1:-1));bendFocus();return true;}
 if(bendPane==='tabs'){if(action==='left'||action==='right'){bendOpen(sectionIndex()+(action==='right'?1:-1));bendFocus();return true;}if(action==='down'||action==='activate'){bendPane='games';bendFocus();return true;}if(action==='up'){openControllerHeader();return true;}}
 const index=Math.max(0,filtered.findIndex(g=>g.id===presentationId));
 if(action==='up'&&index<bendColumns){bendPane='tabs';bendFocus();return true;}
 const delta={left:-1,right:1,up:-bendColumns,down:bendColumns,pageUp:-bendColumns*bendRows,pageDown:bendColumns*bendRows}[action];
 if(delta!==undefined){bendPane='games';bendSelect(index+delta);return true;}
 const game=filtered.find(g=>g.id===presentationId);
 if(['activate','edit','favorite'].includes(action)){if(game){if(action==='activate')play(game.id,$('#grid .presentation-selected'));else if(action==='edit')editGame(game);else{toggleFavorite(game.id);bendFocus();}}return true;}return false;
}
function initBend(){
 $('#bend-shelves').onchange=e=>setBendShelves(e.target.value);
 const tabs=el('nav','bend-part');tabs.id='bend-tabs';tabs.setAttribute('aria-label','Categories');
 const footer=el('nav','bend-part');footer.id='bend-footer';footer.setAttribute('aria-label','Game controls');
 for(const [key,label,action] of [['A','Open','activate'],['B','Back','back'],['X','Edit','edit'],['Y','Search','search']]){const b=el('button','bend-hint');b.append(el('b',key.toLowerCase(),key),el('span','',label));b.onclick=()=>{if(action==='search')controller(action);else{bendPane='games';bendFocus();bendController(action)}};if(['activate','edit'].includes(action))b.dataset.bendGame='true';footer.append(b);}
 const categories=el('span','bend-categories');for(const [key,action] of [['LB','genrePrev'],['RB','genreNext']]){const b=el('button','',key);b.onclick=()=>bendController(action);categories.append(b);}categories.append(el('span','','Categories'));
 const pages=el('span','bend-pages');for(const [id,label,action] of [['prev','‹','pageUp'],['next','›','pageDown']]){const b=el('button','',label);b.id='bend-'+id;b.setAttribute('aria-label',id==='prev'?'Previous shelf page':'Next shelf page');b.onclick=()=>bendController(action);pages.append(b);}
 const pos=el('span');pos.id='bend-position';footer.append(categories,pages,pos);$('#main').append(tabs,footer);
 const grid=$('#grid');let drag=null,ignoreUntil=0,lastWheel=0;
 grid.addEventListener('pointerdown',e=>{if(presentation==='bend'&&e.pointerType==='touch')drag={x:e.clientX,y:e.clientY};});
 grid.addEventListener('pointerup',e=>{if(!drag)return;const dx=e.clientX-drag.x,dy=e.clientY-drag.y;drag=null;if(presentation==='bend'&&Math.abs(dx)>45&&Math.abs(dx)>Math.abs(dy)){ignoreUntil=performance.now()+400;bendController(dx<0?'pageDown':'pageUp');}});
 grid.addEventListener('pointercancel',()=>drag=null);
 grid.addEventListener('click',e=>{if(presentation==='bend'&&performance.now()<ignoreUntil&&e.detail){e.preventDefault();e.stopImmediatePropagation();}},true);
 grid.addEventListener('wheel',e=>{if(presentation!=='bend'||e.ctrlKey||Math.abs(e.deltaY)+Math.abs(e.deltaX)<10)return;e.preventDefault();if(performance.now()-lastWheel<200)return;lastWheel=performance.now();bendController((Math.abs(e.deltaX)>Math.abs(e.deltaY)?e.deltaX:e.deltaY)>0?'pageDown':'pageUp');},{passive:false});
}
