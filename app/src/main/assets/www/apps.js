let drawerCatalog=[],drawerPreferences=[],drawerView='pinned',drawerPage=0,drawerFiltered=[],appearanceDraft=null,drawerLoading=false;
const drawerPageSize=48;
function appPreference(pkg){return drawerPreferences.find(a=>a.package===pkg)||{package:pkg}}
function drawerName(a){return appPreference(a.package).title||a.title}
function drawerImage(a){return appPreference(a.package).image||'icon/'+a.package}
function drawerIsGame(a){const kind=appPreference(a.package).classification||'auto';return kind==='game'||kind==='auto'&&(a.isGame||games.some(g=>g.package===a.package))}
function storeDrawerPreference(value){
 try{if(native?.saveApp){const r=JSON.parse(native.saveApp(JSON.stringify(value)));if(!r.ok)throw Error(r.message)}const i=drawerPreferences.findIndex(a=>a.package===value.package);if(i<0)drawerPreferences.push(value);else drawerPreferences[i]=value;return true}catch(e){$('#appearance-error').textContent=e.message;toast('Could not save app changes');return false}
}
function loadDrawerPreferences(){try{drawerPreferences=native?.appsPreferences?JSON.parse(native.appsPreferences()):drawerPreferences}catch{}}
function openApps(){drawerView='pinned';drawerPage=0;$('#drawer-search').value='';$('#drawer-letter').value='';loadDrawerPreferences();showDialog('#apps-drawer');renderDrawer();if(native?.drawerApps){drawerLoading=true;native.drawerApps()}$('#drawer-search').focus({preventScroll:true})}
function openDrawerApp(a){effect('launch');native?.launchApp?.(a.package)}
function drawerTile(a){const item=el('div','drawer-item'),b=el('button','drawer-app');b.dataset.package=a.package;b.setAttribute('aria-label','Open '+drawerName(a));const im=el('img');im.src=drawerImage(a);im.alt='';im.loading='lazy';b.append(im,el('span','',drawerName(a)));b.onclick=()=>{if(performance.now()>pinIgnoreClickUntil)openDrawerApp(a)};b.onpointerdown=e=>startPinDrag(e,a.package);b.oncontextmenu=e=>{e.preventDefault();if(!pinDrag?.active&&performance.now()>pinIgnoreClickUntil)editDrawerApp(a.package)};const edit=el('button','drawer-edit','•••');edit.setAttribute('aria-label','Edit '+drawerName(a));edit.onclick=()=>editDrawerApp(a.package);item.append(b,edit);return item}
function renderDrawer(){
 const focusedPackage=document.activeElement?.matches('.drawer-app')?document.activeElement.dataset.package:null;
 const q=normalize($('#drawer-search').value).trim(),letter=$('#drawer-letter').value;
 const available=drawerCatalog.filter(a=>!q?(drawerView==='all'||drawerView==='other'&&!drawerIsGame(a)||drawerView==='pinned'&&appPreference(a.package).pinned||drawerView==='recent'&&appPreference(a.package).lastUsed>0):normalize(drawerName(a)+' '+a.title+' '+a.package).includes(q));
 drawerFiltered=available.filter(a=>!letter||(letter==='#'?!/^[A-Z]/.test(normalize(drawerName(a)).toUpperCase()):normalize(drawerName(a)).toUpperCase().startsWith(letter)));
 drawerFiltered.sort((a,b)=>(!q&&drawerView==='pinned'?(appPreference(a.package).order||0)-(appPreference(b.package).order||0):!q&&drawerView==='recent'?(appPreference(b.package).lastUsed||0)-(appPreference(a.package).lastUsed||0):0)||drawerName(a).localeCompare(drawerName(b),undefined,{sensitivity:'base',numeric:true}));
 drawerPage=Math.max(0,Math.min(drawerPage,Math.max(0,Math.ceil(drawerFiltered.length/drawerPageSize)-1)));
 $('#drawer-tabs').replaceChildren(...[['pinned','Pinned'],['other','Other apps'],['recent','Recent'],['all','All apps']].map(([key,label])=>{const b=el('button','secondary',label);b.setAttribute('aria-pressed',String(key===drawerView));b.onclick=()=>{drawerView=key;drawerPage=0;$('#drawer-search').value='';$('#drawer-letter').value='';renderDrawer()};return b}));
 $('#drawer-grid').replaceChildren(...drawerFiltered.slice(drawerPage*drawerPageSize,(drawerPage+1)*drawerPageSize).map(drawerTile));
 $('#drawer-status').textContent=drawerFiltered.length?`${drawerFiltered.length.toLocaleString()} apps${q?' · Searching all installed apps':canDragPins()?' · Drag apps to reorder':''}`:drawerLoading?'Loading apps…':drawerView==='pinned'&&!q&&!letter?'Pin your everyday apps: open Other apps, choose •••, then Pin this app.':drawerView==='recent'&&!q&&!letter?'Apps you open through Wayfinder will appear here.':'No matching apps.';
 $('#drawer-page').textContent=drawerFiltered.length?`${drawerPage+1} / ${Math.ceil(drawerFiltered.length/drawerPageSize)}`:'';$('#drawer-prev').disabled=drawerPage===0;$('#drawer-next').disabled=(drawerPage+1)*drawerPageSize>=drawerFiltered.length;
 if(focusedPackage){const b=[...document.querySelectorAll('.drawer-app')].find(b=>b.dataset.package===focusedPackage);b?.focus({preventScroll:true})}
}
function drawerChangePage(delta){drawerPage+=delta;renderDrawer();controllerFocus($('#drawer-grid .drawer-app')||$('#drawer-search'))}
function editDrawerApp(pkg){const a=drawerCatalog.find(a=>a.package===pkg);if(!a)return;appearanceDraft={...appPreference(pkg)};$('#appearance-name').value=drawerName(a);$('#appearance-class').value=appearanceDraft.classification||'auto';$('#appearance-pinned').checked=!!appearanceDraft.pinned;const pins=drawerPreferences.filter(a=>a.pinned).sort((a,b)=>(a.order||0)-(b.order||0));$('#appearance-order').value=appearanceDraft.pinned?pins.findIndex(a=>a.package===pkg)+1:pins.length+1;$('#appearance-image').src=drawerImage(a);$('#appearance-error').textContent='';showDialog('#app-appearance')}
function renderPinnedApps(){const root=$('#seattle-apps');if(!root)return;const apps=drawerCatalog.filter(a=>appPreference(a.package).pinned).sort((a,b)=>(appPreference(a.package).order||0)-(appPreference(b.package).order||0));root.replaceChildren();if(!apps.length)return;root.append(el('p','eyebrow','PINNED APPS'));const row=el('div','pinned-apps-row');for(const a of apps){const b=el('button','pinned-app');const im=el('img');im.src=drawerImage(a);im.alt='';b.append(im,el('span','',drawerName(a)));b.onclick=()=>{if(performance.now()>pinIgnoreClickUntil)openDrawerApp(a)};b.oncontextmenu=e=>{e.preventDefault();if(!pinDrag?.active&&performance.now()>pinIgnoreClickUntil)editDrawerApp(a.package)};row.append(b)}root.append(row)}
function appsEvent(event,data){
 if(event==='drawerInstalled'){drawerLoading=false;drawerCatalog=[...new Map(data.apps.map(a=>[a.package,a])).values()];loadDrawerPreferences();if($('#apps-drawer').open)renderDrawer();renderPinnedApps();return true}
 if(event==='appLaunched'){loadDrawerPreferences();if($('#apps-drawer').open)renderDrawer();return true}
 if(event==='cover'&&appearanceDraft&&data.id==='app_'+appearanceDraft.package){appearanceDraft.image=data.image;$('#appearance-image').src=data.image;return true}
 if(event==='restored'){loadDrawerPreferences();renderPinnedApps();if($('#apps-drawer').open)renderDrawer()}
 return false;
}
function appsController(action){
 if(action==='back')return false;
 if(action==='search'){controllerFocus($('#drawer-search'));return true}
 if(action==='edit'){const pkg=document.activeElement?.closest('.drawer-item')?.querySelector('.drawer-app')?.dataset.package;if(pkg)editDrawerApp(pkg);return true}
 if(action==='pageDown'||action==='pageUp'){drawerChangePage(action==='pageDown'?1:-1);return true}
 if(action==='genreNext'||action==='genrePrev'){const list=['pinned','other','recent','all'];drawerView=list[(list.indexOf(drawerView)+(action==='genreNext'?1:3))%4];drawerPage=0;$('#drawer-search').value='';$('#drawer-letter').value='';renderDrawer();controllerFocus($('#drawer-grid .drawer-app')||$('#drawer-search'));return true}
 const active=document.activeElement;if(!active?.matches('.drawer-app')||!['left','right','up','down'].includes(action))return false;
 const cards=[...document.querySelectorAll('#drawer-grid .drawer-app')],i=cards.indexOf(active),top=cards[0].getBoundingClientRect().top,columns=cards.filter(c=>Math.abs(c.getBoundingClientRect().top-top)<2).length;
 let n=i+({left:-1,right:1,up:-columns,down:columns}[action]);if(n<0&&action==='up'){controllerFocus($('#drawer-search'));return true}if(n>=cards.length&&!$('#drawer-next').disabled){drawerChangePage(1);return true}controllerFocus(cards[Math.max(0,Math.min(cards.length-1,n))]);return true;
}
function initApps(){
 initPinDrag();
 $('#open-apps').onclick=openApps;$('#close-apps').onclick=()=>hideDialog('#apps-drawer');$('#android-settings').onclick=()=>native?.androidSettings?.();
 $('#drawer-search').oninput=()=>{drawerPage=0;$('#drawer-letter').value='';renderDrawer()};$('#drawer-letter').replaceChildren(...['','#',...'ABCDEFGHIJKLMNOPQRSTUVWXYZ'].map(l=>{const o=el('option','',l||'All');o.value=l;return o}));$('#drawer-letter').onchange=()=>{drawerPage=0;renderDrawer()};
 $('#drawer-prev').onclick=()=>drawerChangePage(-1);$('#drawer-next').onclick=()=>drawerChangePage(1);
 $('#close-appearance').onclick=()=>hideDialog('#app-appearance');$('#app-appearance').addEventListener('close',()=>appearanceDraft=null);
 $('#appearance-choose').onclick=()=>native?.chooseCover?.('app_'+appearanceDraft.package);
 $('#appearance-reset').onclick=()=>{const a=drawerCatalog.find(a=>a.package===appearanceDraft.package);delete appearanceDraft.image;delete appearanceDraft.title;$('#appearance-name').value=a.title;$('#appearance-image').src='icon/'+a.package};
 $('#appearance-info').onclick=()=>native?.appInfo?.(appearanceDraft.package);
 $('#app-appearance-form').onsubmit=e=>{e.preventDefault();const a=drawerCatalog.find(a=>a.package===appearanceDraft.package);const title=$('#appearance-name').value.trim();if(!title){$('#appearance-error').textContent='Enter a name.';return}const value={...appearanceDraft,title:title===a.title?'':title,classification:$('#appearance-class').value,pinned:$('#appearance-pinned').checked};
 const pinned=drawerPreferences.filter(x=>x.pinned&&x.package!==a.package).sort((a,b)=>(a.order||0)-(b.order||0));const position=Math.max(0,Math.min(pinned.length,Number($('#appearance-order').value)-1||0));value.order=pinned.length===0?0:position===0?(pinned[0].order||0)-1:position>=pinned.length?(pinned[pinned.length-1].order||0)+1:((pinned[position-1].order||0)+(pinned[position].order||0))/2;
 if(storeDrawerPreference(value)){hideDialog('#app-appearance');renderDrawer();renderPinnedApps();toast('App appearance saved')}};
 loadDrawerPreferences();if(native?.drawerApps)native.drawerApps();
}
