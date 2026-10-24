// A recent-games rail and a separately navigable, windowed cover grid.
const dashboard={pane:'games',recentId:null,items:null,recents:[],columns:1,pitch:1,frame:0};
function dashboardTarget(){return dashboard.pane==='categories'?$('#dashboard-categories .current'):dashboard.pane==='recents'?[...$('#dashboard-recents').children].find(b=>b.dataset.id===dashboard.recentId):$('#grid .presentation-selected')||$('#grid .show-all-matches');}
function dashboardFocus(){let target=dashboardTarget();if(!target){dashboard.pane='categories';target=dashboardTarget()}controllerFocus(target,true);if(target)revealCategoryItem(target.parentElement,target,dashboard.pane==='categories');document.body.dataset.dashboardPane=dashboard.pane;const label=$('#dashboard-hints button span');if(label)label.textContent=dashboard.pane==='categories'?'Open':'Play';}
function dashboardOpen(index,pane='categories'){const s=sections()[index];if(!s)return;dashboard.pane=pane;favoritesOnly=s.favorite;setGenre(s.genre,true);dashboardFocus();persist();}
function dashboardSelect(index,focus=true){const g=filtered[Math.max(0,Math.min(filtered.length-1,index))];if(!g){dashboardFocus();return}presentationId=g.id;controllerGameId=g.id;dashboard.pane='games';const grid=$('#grid'),top=Math.floor(index/dashboard.columns)*dashboard.pitch+12;if(top<grid.scrollTop+12)grid.scrollTop=Math.max(0,top-12);else if(top+dashboard.pitch>grid.scrollTop+grid.clientHeight)grid.scrollTop=top+dashboard.pitch-grid.clientHeight;paintDashboard();if(focus)dashboardFocus();queueCarouselSave();}
function paintDashboard(){
 if(presentation!=='dashboard'||!filtered.length)return;
 const grid=$('#grid'),gap=16,rows=Math.ceil(filtered.length/dashboard.columns),first=Math.max(0,Math.floor(grid.scrollTop/dashboard.pitch)-2),last=Math.min(rows,Math.ceil((grid.scrollTop+grid.clientHeight)/dashboard.pitch)+2);
 const existing=new Map([...grid.querySelectorAll('.game')].map(b=>[b.dataset.id,b])),keep=new Set(),ordered=[];
 let top=grid.querySelector('.dashboard-top'),bottom=grid.querySelector('.dashboard-bottom');
 if(!top){top=el('div','dashboard-spacer dashboard-top');top.setAttribute('aria-hidden','true');grid.prepend(top)}if(!bottom){bottom=el('div','dashboard-spacer dashboard-bottom');bottom.setAttribute('aria-hidden','true');grid.append(bottom)}
 top.hidden=first===0;top.style.height=Math.max(0,first*dashboard.pitch-gap)+'px';bottom.hidden=last===rows;bottom.style.height=Math.max(0,(rows-last)*dashboard.pitch-gap)+'px';
 for(let i=first*dashboard.columns;i<Math.min(filtered.length,last*dashboard.columns);i++){const g=filtered[i],b=existing.get(g.id)||card(g);if(!existing.has(g.id)){b.addEventListener('focus',()=>{dashboard.pane='games';presentationId=g.id;controllerGameId=g.id;document.body.dataset.dashboardPane='games';for(const other of grid.querySelectorAll('.presentation-selected'))if(other!==b){other.classList.remove('presentation-selected');other.tabIndex=-1}b.classList.add('presentation-selected');b.tabIndex=0;});grid.insertBefore(b,bottom)}syncFavoriteCard(b,g);b.classList.toggle('presentation-selected',g.id===presentationId);b.tabIndex=g.id===presentationId?0:-1;keep.add(b);ordered.push(b);}
 for(const b of existing.values())if(!keep.has(b))b.remove();let cursor=top.nextElementSibling;for(const b of ordered){if(cursor!==b)grid.insertBefore(b,cursor);cursor=b.nextElementSibling}queueCoverGlow();
}
function renderDashboard(){
 const cats=$('#dashboard-categories'),list=sections(),signature=JSON.stringify(list.map(s=>[s.label,searchSummary?searchSectionCount(s.favorite?'favorites':s.genre?'genre:'+s.genre:'all',0):null]));
 if(cats.dataset.signature!==signature){cats.dataset.signature=signature;cats.replaceChildren(...list.map((s,i)=>{const b=el('button','dashboard-category',s.label);if(searchSummary){const count=searchSectionCount(s.favorite?'favorites':s.genre?'genre:'+s.genre:'all',0);b.append(el('small','',String(count)));b.classList.toggle('search-no-match',!count)}b.onclick=()=>dashboardOpen(i);b.onfocus=()=>{dashboard.pane='categories';document.body.dataset.dashboardPane='categories'};return b}))}
 [...cats.children].forEach((b,i)=>{b.classList.toggle('current',i===sectionIndex());b.setAttribute('aria-pressed',String(i===sectionIndex()));b.tabIndex=i===sectionIndex()?0:-1});revealCategoryItem(cats,cats.querySelector('.current'),true);
 dashboard.recents=games.filter(g=>g.lastPlayed>0).sort((a,b)=>b.lastPlayed-a.lastPlayed||a.title.localeCompare(b.title)).slice(0,20);
 const rail=$('#dashboard-recents'),recentSignature=JSON.stringify(dashboard.recents.map(g=>[g.id,g.title,g.genre,g.image,g.favorite]));
 if(rail.dataset.signature!==recentSignature){rail.dataset.signature=recentSignature;rail.replaceChildren(...dashboard.recents.map(g=>{const b=el('button','dashboard-recent');b.dataset.id=g.id;b.setAttribute('aria-label','Play '+g.title);const img=el('img');img.src=g.image;img.alt='';img.loading='lazy';const label=el('span');label.append(el('strong','',g.title),el('small','',g.genre));b.append(img,label);b.onfocus=()=>{dashboard.pane='recents';dashboard.recentId=g.id;document.body.dataset.dashboardPane='recents'};b.onclick=()=>{dashboard.recentId=g.id;play(g.id,b)};b.oncontextmenu=e=>{e.preventDefault();editGame(g)};return b}));if(!dashboard.recents.length)rail.append(el('p','dashboard-recent-empty','Games you play will appear here.'))}
 if(!dashboard.recents.some(g=>g.id===dashboard.recentId))dashboard.recentId=dashboard.recents[0]?.id||null;
 const grid=$('#grid');if(grid.clientWidth<=24||grid.clientHeight<=0)return;const width=grid.clientWidth-24,desired={compact:112,comfortable:140,large:180}[size]||140,columns=Math.max(1,Math.floor((width+16)/(desired+16))),cover=(width-(columns-1)*16)/columns,pitch=cover*1.5+58+16;
 const changed=dashboard.items!==filtered||!grid.querySelector('.dashboard-top');dashboard.columns=columns;dashboard.pitch=pitch;grid.style.setProperty('--dashboard-columns',columns);grid.style.setProperty('--dashboard-cover',cover*1.5+'px');
 if(changed){dashboard.items=filtered;grid.replaceChildren();grid.scrollTop=0}
 if(!filtered.some(g=>g.id===presentationId))presentationId=filtered[0]?.id||null;
 if(filtered.length){paintDashboard();if(changed){const index=filtered.findIndex(g=>g.id===presentationId);grid.scrollTop=Math.floor(index/columns)*pitch;paintDashboard()}}
 else if(!query)grid.replaceChildren(el('p','dashboard-empty',!games.length?'Your library is empty. Choose Add game to begin.':favoritesOnly?'No favorites yet. Open a game’s menu to add one.':'No games in this category.'));
 $('#empty').hidden=true;$('#load').hidden=true;syncSearchFeedback();document.body.dataset.dashboardPane=dashboard.pane;
}
function dashboardBack(){if(query){query='';$('#search').value='';$('#search').blur();update();dashboardFocus();persist();return true}if(dashboard.pane!=='categories'){dashboard.pane='categories';dashboardFocus();return true}return false}
function dashboardController(action){
 if(['search','menu','apps'].includes(action))return false;
 const active=document.activeElement;if(active?.matches('input,textarea,select')){if(action==='down'||action==='activate'){active.blur();dashboard.pane='games';dashboardFocus();return true}return false}
 if(action==='activate'&&active?.matches('button')&&!active.closest('#grid,#dashboard-categories,#dashboard-recents')){active.click();return true}
 if(action==='back'){dashboardBack();return true}
 if(action==='genrePrev'||action==='genreNext'){const n=sections().length;dashboardOpen((sectionIndex()+(action==='genreNext'?1:-1)+n)%n,dashboard.pane);return true}
 if(dashboard.pane==='categories'){
  if(action==='left'||action==='right'){const n=sections().length;dashboardOpen((sectionIndex()+(action==='right'?1:-1)+n)%n);return true}
  if(action==='down'||action==='activate'){dashboard.pane='games';dashboardFocus();return true}
  if(action==='up'){controllerFocus($('#search'));return true}
 }
 if(dashboard.pane==='recents'){
  if(action==='right'){dashboard.pane='games';dashboardSelect(Math.max(0,filtered.findIndex(g=>g.id===presentationId)));return true}
  if(['up','down','pageUp','pageDown'].includes(action)){const i=dashboard.recents.findIndex(g=>g.id===dashboard.recentId);if(action==='up'&&i<=0){dashboard.pane='categories'}else{const step=action.startsWith('page')?5:1;dashboard.recentId=dashboard.recents[Math.max(0,Math.min(dashboard.recents.length-1,i+(action==='up'||action==='pageUp'?-step:step)))]?.id}dashboardFocus();return true}
  if(action==='left')return true;
 }
 if(dashboard.pane==='games'&&['left','right','up','down','pageUp','pageDown'].includes(action)){
  let i=Math.max(0,filtered.findIndex(g=>g.id===presentationId));const grid=$('#grid'),row=Math.floor(i/dashboard.columns),first=Math.floor(grid.scrollTop/dashboard.pitch),last=Math.ceil((grid.scrollTop+grid.clientHeight)/dashboard.pitch)-1;if(row<first||row>last)i=Math.min(filtered.length-1,first*dashboard.columns);
  if(action==='left'&&i%dashboard.columns===0){dashboard.pane=dashboard.recents.length?'recents':'categories';dashboardFocus();return true}
  if(action==='up'&&i<dashboard.columns||!filtered.length){dashboard.pane='categories';dashboardFocus();return true}
  const page=dashboard.columns*Math.max(1,Math.floor(grid.clientHeight/dashboard.pitch));dashboardSelect(i+({left:-1,right:1,up:-dashboard.columns,down:dashboard.columns,pageUp:-page,pageDown:page}[action]||0));return true;
 }
 if(['activate','edit','favorite'].includes(action)){
  if(action==='activate'&&active?.matches('.show-all-matches')){active.click();return true}
  const g=dashboard.pane==='recents'?games.find(g=>g.id===dashboard.recentId):filtered.find(g=>g.id===presentationId);if(g){if(action==='activate')play(g.id,dashboardTarget());else if(action==='edit')editGame(g);else{const pane=dashboard.pane;toggleFavorite(g.id);dashboard.pane=pane;dashboardFocus()}}return true;
 }
 return false;
}
function initDashboard(){
 const rail=el('section','dashboard-part');rail.id='dashboard-sidebar';rail.append(el('h2','','Recently played'));const recent=el('nav');recent.id='dashboard-recents';recent.setAttribute('aria-label','Recently played');rail.append(recent);$('.shell').prepend(rail);
 const cats=el('nav','dashboard-part');cats.id='dashboard-categories';cats.setAttribute('aria-label','Game categories');$('#main').prepend(cats);
 const hints=el('div','dashboard-part');hints.id='dashboard-hints';for(const [key,label,action] of [['A','Play','activate'],['B','Back','back'],['X','Edit','edit'],['Y','Search','search'],['LB/RB','Categories',''],['LT/RT','Pages','']]){const item=el(action?'button':'span','dashboard-hint');item.append(el('b','dashboard-key key-'+key.toLowerCase().replace('/','-'),key),el('span','',label));if(action)item.onclick=()=>{dashboardFocus();dashboardController(action)||controller(action)};hints.append(item)}$('#main').append(hints);
 const grid=$('#grid');grid.addEventListener('scroll',()=>{if(presentation==='dashboard'&&!dashboard.frame)dashboard.frame=requestAnimationFrame(()=>{dashboard.frame=0;paintDashboard();queueCarouselSave()})},{passive:true});new ResizeObserver(()=>{if(presentation==='dashboard')renderDashboard()}).observe(grid);
}
