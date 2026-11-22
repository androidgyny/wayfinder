let dashboardOptions={density:'balanced',colors:'fixed'};
// A recent-games rail and a separately navigable, windowed cover grid.
const dashboard={pane:'games',railMode:'recent',recentId:null,items:null,recents:[],columns:1,pitch:1,frame:0};
function dashboardTarget(){return dashboard.pane==='navigation'?document.getElementById(dashboard.navId||'dashboard-library'):dashboard.pane==='categories'?$('#dashboard-categories .current'):dashboard.pane==='recents'?[...$('#dashboard-recents').children].find(b=>b.dataset.id===dashboard.recentId):$('#grid .presentation-selected')||$('#grid .show-all-matches');}
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
 for(let i=first*dashboard.columns;i<Math.min(filtered.length,last*dashboard.columns);i++){const g=filtered[i],b=existing.get(g.id)||card(g);if(!existing.has(g.id)){b.addEventListener('focus',()=>{dashboard.pane='games';presentationId=g.id;controllerGameId=g.id;document.body.dataset.dashboardPane='games';for(const other of grid.querySelectorAll('.presentation-selected'))if(other!==b){other.classList.remove('presentation-selected');other.tabIndex=-1}b.classList.add('presentation-selected');b.tabIndex=0;});grid.insertBefore(b,bottom)}syncFavoriteCard(b,g);b.classList.toggle('dashboard-favorite',!!g.favorite);b.style.visibility=(Math.floor(i/dashboard.columns)*dashboard.pitch+12+dashboard.pitch-gap<=grid.scrollTop+42)?'hidden':'';b.classList.toggle('presentation-selected',g.id===presentationId);b.tabIndex=g.id===presentationId?0:-1;keep.add(b);ordered.push(b);}
 for(const b of existing.values())if(!keep.has(b))b.remove();let cursor=top.nextElementSibling;for(const b of ordered){if(cursor!==b)grid.insertBefore(b,cursor);cursor=b.nextElementSibling}queueCoverGlow();
}
function dashboardPlayed(g){if(!g.lastPlayed)return 'Not played yet';const days=Math.floor((Date.now()-g.lastPlayed)/86400000);return days<1?'Played today':days===1?'Played yesterday':days<7?'Played '+days+' days ago':days<14?'Played last week':'Played '+Math.floor(days/7)+' weeks ago'}
function renderDashboard(){
 $('#dashboard-sort').value=sort;$('#dashboard-title').textContent=sections()[sectionIndex()]?.label||'All games';$('#dashboard-shelf-title').textContent=genre?'In this category':favoritesOnly?'Your favorites':'All games';
 $('#dashboard-library').setAttribute('aria-pressed',String(!favoritesOnly));$('#dashboard-favorites').setAttribute('aria-pressed',String(favoritesOnly));

 const cats=$('#dashboard-categories'),list=sections(),signature=JSON.stringify(list.map(s=>[s.label,searchSummary?searchSectionCount(s.favorite?'favorites':s.genre?'genre:'+s.genre:'all',0):null]));
 if(cats.dataset.signature!==signature){cats.dataset.signature=signature;cats.replaceChildren(...list.map((s,i)=>{const b=el('button','dashboard-category',s.label);if(searchSummary){const count=searchSectionCount(s.favorite?'favorites':s.genre?'genre:'+s.genre:'all',0);b.append(el('small','',String(count)));b.classList.toggle('search-no-match',!count)}b.style.setProperty('--category-tone',['0,111,137','0,119,83','159,51,88','169,62,52','45,91,155','89,68,139'][i%6]);b.onclick=()=>dashboardOpen(i);b.onfocus=()=>{dashboard.pane='categories';document.body.dataset.dashboardPane='categories'};return b}))}
 [...cats.children].forEach((b,i)=>{b.classList.toggle('current',i===sectionIndex());b.setAttribute('aria-pressed',String(i===sectionIndex()));b.tabIndex=i===sectionIndex()?0:-1});revealCategoryItem(cats,cats.querySelector('.current'),true);
 dashboard.recents=games.filter(g=>dashboard.railMode==='favorites'?g.favorite:g.lastPlayed>0).sort((a,b)=>dashboard.railMode==='favorites'?compareTitles(a.title,b.title):b.lastPlayed-a.lastPlayed||compareTitles(a.title,b.title)).slice(0,20);
 const rail=$('#dashboard-recents'),recentSignature=JSON.stringify(dashboard.recents.map(g=>[g.id,g.title,g.genre,g.image,g.favorite,dashboardPlayed(g)]));
 if(rail.dataset.signature!==recentSignature){rail.dataset.signature=recentSignature;rail.replaceChildren(...dashboard.recents.map(g=>{const b=el('button','dashboard-recent');b.dataset.id=g.id;b.setAttribute('aria-label','Play '+g.title);const img=el('img');img.src=g.image;img.alt='';img.loading='lazy';const label=el('span');label.append(el('strong','',g.title),el('small','',dashboardPlayed(g)));b.append(img,label);b.onfocus=()=>{dashboard.pane='recents';dashboard.recentId=g.id;document.body.dataset.dashboardPane='recents'};b.onclick=()=>{dashboard.recentId=g.id;play(g.id,b)};b.oncontextmenu=e=>{e.preventDefault();editGame(g)};return b}));if(!dashboard.recents.length)rail.append(el('p','dashboard-recent-empty',dashboard.railMode==='favorites'?'Your favorite games will appear here.':'Games you play will appear here.'))}
 if(!dashboard.recents.some(g=>g.id===dashboard.recentId))dashboard.recentId=dashboard.recents[0]?.id||null;
 const grid=$('#grid');if(grid.clientWidth<=24||grid.clientHeight<=0)return;const width=grid.clientWidth-24,desired={spacious:170,balanced:130,dense:100}[dashboardOptions.density],columns=Math.max(1,Math.floor((width+16)/(desired+16)),Math.ceil((width+16)/(Math.max(40,(grid.clientHeight-54)/1.5)+16))),cover=(width-(columns-1)*16)/columns,pitch=cover*1.5+30+16;
 const geometryChanged=dashboard.columns!==columns||Math.abs(dashboard.pitch-pitch)>.5;const changed=dashboard.items!==filtered||!grid.querySelector('.dashboard-top');dashboard.columns=columns;dashboard.pitch=pitch;grid.style.setProperty('--dashboard-columns',columns);grid.style.setProperty('--dashboard-cover',cover*1.5+'px');
 if(changed){dashboard.items=filtered;grid.replaceChildren();grid.scrollTop=0}
 if(!filtered.some(g=>g.id===presentationId))presentationId=filtered[0]?.id||null;
 if(filtered.length){paintDashboard();if(changed){const index=filtered.findIndex(g=>g.id===presentationId);grid.scrollTop=Math.floor(index/columns)*pitch;paintDashboard()}}
 else if(!query)grid.replaceChildren(el('p','dashboard-empty',!games.length?'Your library is empty. Choose Add game to begin.':favoritesOnly?'No favorites yet. Open a game’s menu to add one.':'No games in this category.'));
 if(geometryChanged&&filtered.length){const pane=dashboard.pane;dashboardSelect(Math.max(0,filtered.findIndex(g=>g.id===presentationId)),false);dashboard.pane=pane;}
 $('#empty').hidden=true;$('#load').hidden=true;syncSearchFeedback();document.body.dataset.dashboardPane=dashboard.pane;
}
function dashboardBack(){if(query){query='';$('#search').value='';$('#search').blur();update();dashboardFocus();persist();return true}if(dashboard.pane!=='categories'){dashboard.pane='categories';dashboardFocus();return true}return false}
function dashboardController(action){
 if(['search','menu','apps'].includes(action))return false;
 const active=document.activeElement;
 if(active?.id==='dashboard-sort'&&action==='activate'){openControllerChoice(active);return true;}
 const nav=[$('#dashboard-toggle'),...$('#dashboard-navigation').children,...(dashboardOptions.collapsed?[]:[$('#dashboard-rail-mode')])];
 if(nav.includes(active)){
  if(action==='up'||action==='down'){const i=nav.indexOf(active),next=nav[i+(action==='down'?1:-1)];controllerFocus(next||(action==='down'?(!dashboardOptions.collapsed&&$('#dashboard-recents button'))||$('#dashboard-categories .current'):$('#search')));return true}
  if(action==='right'){dashboard.pane='categories';dashboardFocus();return true}
  if(action==='left')return true;
  if(action==='activate'){if(active.tagName==='SELECT')openControllerChoice(active);else active.click();return true}
 }
 if(active?.matches('input,textarea,select')){if(action==='down'||action==='activate'){active.blur();dashboard.pane='games';dashboardFocus();return true}return false}
 if(action==='activate'&&active?.matches('button')&&!active.closest('#grid,#dashboard-categories,#dashboard-recents')){active.click();return true}
 if(action==='back'){dashboardBack();return true}
 if(action==='genrePrev'||action==='genreNext'){const n=sections().length;dashboardOpen((sectionIndex()+(action==='genreNext'?1:-1)+n)%n,dashboard.pane);return true}
 if(dashboard.pane==='categories'){
  if(action==='left'&&sectionIndex()===0){controllerFocus($('#dashboard-library'));return true}
  if(action==='left'||action==='right'){const n=sections().length;dashboardOpen((sectionIndex()+(action==='right'?1:-1)+n)%n);return true}
  if(action==='down'||action==='activate'){dashboard.pane='games';dashboardFocus();return true}
  if(action==='up'){controllerFocus($('#search'));return true}
 }
 if(dashboard.pane==='recents'){
  if(action==='right'){dashboard.pane='games';dashboardSelect(Math.max(0,filtered.findIndex(g=>g.id===presentationId)));return true}
  if(['up','down','pageUp','pageDown'].includes(action)){const i=dashboard.recents.findIndex(g=>g.id===dashboard.recentId);if(action==='up'&&i<=0){controllerFocus($('#dashboard-rail-mode'));return true}else{const step=action.startsWith('page')?5:1;dashboard.recentId=dashboard.recents[Math.max(0,Math.min(dashboard.recents.length-1,i+(action==='up'||action==='pageUp'?-step:step)))]?.id}dashboardFocus();return true}
  if(action==='left')return true;
 }
 if(dashboard.pane==='games'&&['left','right','up','down','pageUp','pageDown'].includes(action)){
  let i=Math.max(0,filtered.findIndex(g=>g.id===presentationId));const grid=$('#grid'),row=Math.floor(i/dashboard.columns),first=Math.floor(grid.scrollTop/dashboard.pitch),last=Math.ceil((grid.scrollTop+grid.clientHeight)/dashboard.pitch)-1;if(row<first||row>last)i=Math.min(filtered.length-1,first*dashboard.columns);
  if(action==='left'&&i%dashboard.columns===0){if(dashboard.recents.length&&!dashboardOptions.collapsed){dashboard.pane='recents';dashboardFocus()}else controllerFocus($('#dashboard-library'));return true}
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
 const toggle=el('button','dashboard-part');toggle.id='dashboard-toggle';toggle.setAttribute('aria-controls','dashboard-sidebar');toggle.innerHTML='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="3" y="4" width="18" height="16" rx="2"/><path d="M9 4v16m7-12-3 4 3 4"/></svg>';toggle.onclick=()=>{const pane=dashboard.pane,id=presentationId;setDashboardOptions({...dashboardOptions,collapsed:!dashboardOptions.collapsed});presentationId=id;dashboard.pane=pane==='recents'?'navigation':pane;dashboard.navId='dashboard-toggle';controllerFocus(toggle,true);document.body.dataset.dashboardPane='navigation';persist()};toggle.onfocus=()=>{dashboard.pane='navigation';dashboard.navId=toggle.id;document.body.dataset.dashboardPane='navigation'};$('.topbar').prepend(toggle);

 const rail=el('section','dashboard-part');rail.id='dashboard-sidebar';const nav=el('nav');nav.id='dashboard-navigation';nav.setAttribute('aria-label','Library navigation');for(const [id,label,icon] of [['library','My library','M3 10 12 3l9 7v11h-6v-7H9v7H3Z'],['favorites','Favorites','m12 3 2.8 5.7 6.2.9-4.5 4.4 1.1 6.2L12 17.3l-5.6 2.9 1.1-6.2L3 9.6l6.2-.9Z'],['apps','Apps','M3 3h7v7H3ZM14 3h7v7h-7ZM3 14h7v7H3ZM14 14h7v7h-7Z']]){const b=el('button');b.id='dashboard-'+id;b.setAttribute('aria-label',label);b.title=label;b.onfocus=()=>{dashboard.pane='navigation';dashboard.navId=b.id;document.body.dataset.dashboardPane='navigation'};const symbol=el('span','dashboard-nav-icon');symbol.setAttribute('aria-hidden','true');symbol.innerHTML='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"><path d="'+icon+'"/></svg>';b.append(symbol,el('span','',label));b.onclick=()=>{if(id==='apps')openApps();else dashboardOpen(id==='favorites'?1:0,'games')};nav.append(b)}rail.append(nav);const mode=el('select');mode.id='dashboard-rail-mode';mode.setAttribute('aria-label','Sidebar games');for(const [value,label] of [['recent','Recently played'],['favorites','Favorites']]){const o=el('option','',label);o.value=value;mode.append(o)}try{dashboard.railMode=localStorage.getItem('dashboard-rail-mode')==='favorites'?'favorites':'recent'}catch{}mode.value=dashboard.railMode;mode.onfocus=()=>{dashboard.pane='navigation';dashboard.navId=mode.id;document.body.dataset.dashboardPane='navigation'};mode.onchange=()=>{dashboard.railMode=mode.value;try{localStorage.setItem('dashboard-rail-mode',mode.value)}catch{}$('#dashboard-recents').dataset.signature='';renderDashboard()};rail.append(mode);
 const title=el('span','dashboard-part','My library');title.id='dashboard-title';$('.topbar .search').before(title);
 const sortControl=$('#sort').cloneNode(true);sortControl.id='dashboard-sort';sortControl.className='dashboard-part';sortControl.setAttribute('aria-label','Sort games');sortControl.onchange=()=>{$('#sort').value=sortControl.value;$('#sort').dispatchEvent(new Event('change'))};$('.topbar .search').after(sortControl);
const recent=el('nav');recent.id='dashboard-recents';recent.setAttribute('aria-label','Recently played');rail.append(recent);$('.shell').prepend(rail);
 const shelf=el('div','dashboard-part');shelf.id='dashboard-shelf-title';$('#main').append(shelf);initDashboardOptions();
 const cats=el('nav','dashboard-part');cats.id='dashboard-categories';cats.setAttribute('aria-label','Game categories');$('#main').prepend(cats);
 const hints=el('div','dashboard-part');hints.id='dashboard-hints';for(const [key,label,action] of [['A','Play','activate'],['B','Back','back'],['X','Edit','edit'],['Y','Search','search'],['LB/RB','Categories',''],['LT/RT','Pages','']]){const item=el(action?'button':'span','dashboard-hint');for(const part of key.split('/'))item.append(el('b','dashboard-key key-'+part.toLowerCase(),part));item.append(el('span','',label));if(action)item.onclick=()=>{dashboardFocus();dashboardController(action)||controller(action)};hints.append(item)}$('#main').append(hints);
 const grid=$('#grid');grid.addEventListener('scroll',()=>{if(presentation==='dashboard'&&!dashboard.frame)dashboard.frame=requestAnimationFrame(()=>{dashboard.frame=0;paintDashboard();queueCarouselSave()})},{passive:true});new ResizeObserver(()=>{if(presentation==='dashboard')renderDashboard()}).observe(grid);
}

function setDashboardOptions(v={},save=true){
 dashboardOptions={density:['spacious','balanced','dense'].includes(v?.density)?v.density:'balanced',colors:v?.colors==='cover'?'cover':'fixed',collapsed:v?.collapsed===true};
 syncDashboardSidebar();
 for(const key of ['density','colors']){const input=$('#dashboard-'+key);if(input)input.value=dashboardOptions[key]}
 if(presentation==='dashboard'&&!restoring){const pane=dashboard.pane;renderDashboard();dashboardSelect(Math.max(0,filtered.findIndex(g=>g.id===presentationId)),false);dashboard.pane=pane;document.body.dataset.dashboardPane=pane}
 syncDashboardBackdrop();if(save)persist();
}
function syncDashboardBackdrop(){
 if(presentation!=='dashboard')return;
 const img=$('#grid .presentation-selected .cover img');
 const color=dashboardOptions.colors==='cover'&&img?coverColor(img):null;
 document.body.style.setProperty('--dashboard-warm',color||'105,24,48');
 document.body.style.setProperty('--dashboard-cool',color||'30,47,65');
 if(img&&!img.complete&&!img.dataset.dashboardLoad){img.dataset.dashboardLoad='1';img.addEventListener('load',()=>{if(presentation==='dashboard'&&img.closest('.presentation-selected'))queueCoverGlow()},{once:true})}
}
function initDashboardOptions(){
 const group=el('div');group.id='dashboard-options';group.hidden=true;
 for(const [key,label,choices] of [['density','Game density',[['spacious','Spacious'],['balanced','Balanced'],['dense','Dense']]],['colors','Gradient colors',[['fixed','Classic charcoal'],['cover','Selected cover']]]]){
  const row=el('div','settings-row'),text=el('label','',label),input=el('select');input.id='dashboard-'+key;text.htmlFor=input.id;
  for(const [value,label] of choices){const option=el('option','',label);option.value=value;input.append(option)}input.value=dashboardOptions[key];input.onchange=()=>setDashboardOptions({...dashboardOptions,[key]:input.value});row.append(text,input);group.append(row);
 }
 $('#presentation').closest('.settings-row').after(group);
}

function syncDashboardSidebar(){
 document.body.dataset.dashboardCollapsed=String(dashboardOptions.collapsed===true);
 const toggle=$('#dashboard-toggle');if(toggle){toggle.setAttribute('aria-expanded',String(!dashboardOptions.collapsed));toggle.setAttribute('aria-label',dashboardOptions.collapsed?'Expand sidebar':'Collapse sidebar');toggle.title=dashboardOptions.collapsed?'Expand sidebar':'Collapse sidebar'}
}
