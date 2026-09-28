let appIconPack="",lastIconPack="",availableIconPacks=[];
let drawerCatalog=[],drawerPreferences=[],drawerView='home',drawerPage=0,drawerFiltered=[],appearanceDraft=null,drawerLoading=false;
const drawerPageSize=48;
function appPreference(pkg){return drawerPreferences.find(a=>a.package===pkg)||{package:pkg}}
function drawerName(a){return appPreference(a.package).title||a.title}
function drawerImage(a){return appImagePreference(appPreference(a.package),a.package)}
function appImagePreference(p,pkg){return p.image||(p.packIcon?.pack&&p.packIcon?.name?'app-icon/'+pkg+'?pack='+encodeURIComponent(p.packIcon.pack)+'&drawable='+encodeURIComponent(p.packIcon.name):(appIconPack?'app-icon/'+pkg+'?pack='+encodeURIComponent(appIconPack):'icon/'+pkg))}
function drawerIsGame(a){return !!drawerGameEntry(a.package)}
function storeDrawerPreference(value){
 try{if(native?.saveApp){const r=JSON.parse(native.saveApp(JSON.stringify(value)));if(!r.ok)throw Error(r.message)}const i=drawerPreferences.findIndex(a=>a.package===value.package);if(i<0)drawerPreferences.push(value);else drawerPreferences[i]=value;return true}catch(e){$('#appearance-error').textContent=e.message;toast('Could not save app changes');return false}
}
function loadDrawerPreferences(){try{drawerPreferences=native?.appsPreferences?JSON.parse(native.appsPreferences()):drawerPreferences}catch{}}
function openApps(){drawerView='home';drawerSection='';drawerPage=0;$('#drawer-search').value='';$('#drawer-letter').value='';loadDrawerPreferences();showDialog('#apps-drawer');renderDrawer();if(native?.drawerApps){drawerLoading=true;native.drawerApps()}($('#app-sections button')||$('#drawer-search')).focus({preventScroll:true})}
function openDrawerApp(a){effect('launch');native?.launchApp?.(a.package)}
function drawerTile(a){const item=el('div','drawer-item'),b=el('button','drawer-app');b.dataset.package=a.package;b.setAttribute('aria-label','Open '+drawerName(a));const im=el('img');im.src=drawerImage(a);im.alt='';im.loading='lazy';b.append(im,el('span','',drawerName(a)));b.onclick=e=>{if(e.detail!==0&&b._held){b._held=false;return;}if(e.detail===0||performance.now()>pinIgnoreClickUntil)openDrawerApp(a)};b.onpointerdown=e=>{b._held=false;startPinDrag(e,a.package);startAppHold(e,b,a.package)};b.oncontextmenu=e=>{e.preventDefault();if(!pinDrag?.active&&performance.now()>pinIgnoreClickUntil){cancelAppHold();editDrawerApp(a.package)}};const edit=el('button','drawer-edit','•••');edit.setAttribute('aria-label','Edit '+drawerName(a));edit.onclick=()=>editDrawerApp(a.package);item.append(b,edit);return item}
function renderDrawer(){
 const home=drawerView==='home'&&!$('#drawer-search').value.trim()&&!$('#drawer-letter').value;renderAppSections(home);
 const focusedItem=document.activeElement?.closest('#drawer-grid .drawer-item'),focusedPackage=focusedItem?.querySelector('.drawer-app')?.dataset.package,focusedEdit=document.activeElement?.matches('.drawer-edit'),focusedIndex=focusedItem?[...$('#drawer-grid').children].indexOf(focusedItem):0,focusedTab=document.activeElement?.closest('#drawer-tabs button')?.dataset.drawerView;
 $('#drawer-search').placeholder=drawerView==='other'?'Search non-game apps…':'Search every installed app…';$('#drawer-search').setAttribute('aria-label',drawerView==='other'?'Search non-game apps':'Search installed apps');
 const q=normalize($('#drawer-search').value).trim(),letter=$('#drawer-letter').value;
 const available=drawerCatalog.filter(a=>!q?(drawerView==='home'&&drawerSection&&appSection(a)===drawerSection&&!appPreference(a.package).hideFromSections||drawerView==='all'||drawerView==='other'&&!drawerIsGame(a)||drawerView==='pinned'&&appPreference(a.package).pinned||drawerView==='recent'&&appPreference(a.package).lastUsed>0):(drawerView!=='other'||!drawerIsGame(a))&&normalize(drawerName(a)+' '+a.title+' '+a.package).includes(q));
 drawerFiltered=available.filter(a=>!letter||(letter==='#'?!/^[A-Z]/.test(normalize(drawerName(a)).toUpperCase()):normalize(drawerName(a)).toUpperCase().startsWith(letter)));
 drawerFiltered.sort((a,b)=>(!q&&drawerView==='pinned'?(appPreference(a.package).order||0)-(appPreference(b.package).order||0):!q&&drawerView==='recent'?(appPreference(b.package).lastUsed||0)-(appPreference(a.package).lastUsed||0):0)||drawerName(a).localeCompare(drawerName(b),undefined,{sensitivity:'base',numeric:true}));
 drawerPage=Math.max(0,Math.min(drawerPage,Math.max(0,Math.ceil(drawerFiltered.length/drawerPageSize)-1)));
 $('#drawer-tabs').replaceChildren(...[['home','Categories'],['pinned','Pinned'],['recent','Recent'],['other','Non-game apps'],['all','All apps']].map(([key,label])=>{const b=el('button','secondary',label);b.dataset.drawerView=key;b.setAttribute('aria-pressed',String(key===drawerView));b.onclick=()=>{drawerView=key;drawerPage=0;$('#drawer-search').value='';$('#drawer-letter').value='';renderDrawer()};return b}));
 $('#drawer-grid').replaceChildren(...(home?drawerFiltered:drawerFiltered.slice(drawerPage*drawerPageSize,(drawerPage+1)*drawerPageSize)).map(drawerTile));
 $('#drawer-status').textContent=drawerFiltered.length?`${drawerFiltered.length.toLocaleString()} apps${q?(drawerView==='other'?' · Searching non-game apps':' · Searching all installed apps'):canDragPins()?' · Drag apps to reorder':''}`:drawerLoading?'Loading apps…':drawerView==='pinned'&&!q&&!letter?'Pin your everyday apps: open Non-game apps, choose •••, then Pin this app.':drawerView==='recent'&&!q&&!letter?'Apps you open through Wayfinder will appear here.':'No matching apps.';
 if(home)$('#drawer-status').textContent=drawerSection?(appSections.find(s=>s.id===drawerSection).name+' · '+drawerFiltered.length+' apps'+(!drawerFiltered.length?' · Assign apps here using All apps → •••.':'')):'Your everyday apps, grouped. Choose a section to open it.';
 $('#drawer-grid').hidden=home&&!drawerSection;$('#apps-drawer .drawer-pages').hidden=home||drawerFiltered.length<=drawerPageSize;$('#drawer-letter').parentElement.hidden=home;
 $('#drawer-page').textContent=drawerFiltered.length?`${drawerPage+1} / ${Math.ceil(drawerFiltered.length/drawerPageSize)}`:'';$('#drawer-prev').disabled=drawerPage===0;$('#drawer-next').disabled=(drawerPage+1)*drawerPageSize>=drawerFiltered.length;
 if(focusedPackage){const cards=[...$('#drawer-grid').querySelectorAll('.drawer-app')],b=cards.find(b=>b.dataset.package===focusedPackage)||cards[Math.min(focusedIndex,cards.length-1)];(focusedEdit?b?.parentElement.querySelector('.drawer-edit'):b)?.focus({preventScroll:true});if(!b)$('#drawer-search').focus({preventScroll:true});}
 if(focusedTab)[...$('#drawer-tabs').children].find(b=>b.dataset.drawerView===focusedTab)?.focus({preventScroll:true});
}
function drawerChangePage(delta){drawerPage+=delta;renderDrawer();controllerFocus($('#drawer-grid .drawer-app')||$('#drawer-search'))}
function closeAppAppearance(){
 const editor=$('#app-appearance');if(!editor.open)return;
 const children=[...document.querySelectorAll('dialog[open]')].filter(d=>d._openedOrder>editor._openedOrder).sort((a,b)=>b._openedOrder-a._openedOrder);
 for(const child of children)hideDialog('#'+child.id);
 hideDialog('#app-appearance');
}
function editDrawerApp(pkg){const a=drawerCatalog.find(a=>a.package===pkg);if(!a)return;appearanceDraft={...appPreference(pkg)};$('#appearance-name').value=drawerName(a);$('#appearance-section').value=appearanceDraft.section||'auto';$('#appearance-section-hidden').checked=!!appearanceDraft.hideFromSections;$('#appearance-pinned').checked=!!appearanceDraft.pinned;const pins=drawerPreferences.filter(a=>a.pinned).sort((a,b)=>(a.order||0)-(b.order||0));$('#appearance-order').value=appearanceDraft.pinned?pins.findIndex(a=>a.package===pkg)+1:pins.length+1;$('#appearance-image').src=drawerImage(a);$('#appearance-error').textContent='';refreshAppGameAction();$('#appearance-uninstall').hidden=!native?.canUninstallApp?.(pkg);showDialog('#app-appearance')}
// Shortcuts can share a host package without representing the app itself.
function drawerGameEntry(pkg){return games.find(g=>g.package===pkg&&g.kind!=='shortcut'&&!g.intentUri)}
function refreshAppGameAction(){
 $('#appearance-game').textContent=drawerGameEntry(appearanceDraft?.package)?'Edit game entry':'Add to game library';
}
function editDrawerGame(){
 const a=drawerCatalog.find(a=>a.package===appearanceDraft?.package);if(!a){$('#appearance-error').textContent='This app is no longer available. Close this editor to refresh the app list.';return;}
 const existing=drawerGameEntry(a.package);
 if(existing){editGame(existing);return}
 editGame({id:'new_'+Date.now()+'_'+Math.floor(Math.random()*100000),
  title:$('#appearance-name').value.trim()||drawerName(a),genre:'Uncategorized',kind:'app',
  package:a.package,action:'android.intent.action.MAIN',image:appearanceDraft.image||'icon/'+a.package,lastPlayed:0},true);
}
function renderPinnedApps(){const root=$('#seattle-apps');if(!root)return;const focusedPackage=document.activeElement?.closest('.pinned-app')?.dataset.package;const apps=drawerCatalog.filter(a=>appPreference(a.package).pinned).sort((a,b)=>(appPreference(a.package).order||0)-(appPreference(b.package).order||0));root.replaceChildren();if(!apps.length)return;root.append(el('p','eyebrow','PINNED APPS'));const row=el('div','pinned-apps-row');for(const a of apps){const b=el('button','pinned-app');b.dataset.package=a.package;const im=el('img');im.src=drawerImage(a);im.alt='';b.append(im,el('span','',drawerName(a)));b.onclick=e=>{if(e.detail===0||performance.now()>pinIgnoreClickUntil)openDrawerApp(a)};b.oncontextmenu=e=>{e.preventDefault();if(!pinDrag?.active&&performance.now()>pinIgnoreClickUntil)editDrawerApp(a.package)};row.append(b)}root.append(row);if(focusedPackage)[...root.querySelectorAll('.pinned-app')].find(b=>b.dataset.package===focusedPackage)?.focus({preventScroll:true});}
function appsEvent(event,data){
 if(event==='iconPackCatalog'){receivePackCatalog(data);return true;}
 if(event==='iconPacks'){availableIconPacks=data.packs||[];renderIconPackPicker();return true;}
 if(event==='drawerInstalled'){drawerLoading=false;drawerCatalog=[...new Map(data.apps.map(a=>[a.package,a])).values()];loadDrawerPreferences();if($('#apps-drawer').open)renderDrawer();renderPinnedApps();return true}
 if(event==='appLaunched'){loadDrawerPreferences();if($('#apps-drawer').open)renderDrawer();return true}
 if(event==='cover'&&appearanceDraft&&data.id==='app_'+appearanceDraft.package){appearanceDraft.image=data.image;$('#appearance-image').src=data.image;return true}
 if(event==='restored'){loadDrawerPreferences();renderPinnedApps();if($('#apps-drawer').open)renderDrawer()}
 return false;
}
function appsController(action){
 if(sectionController(action))return true;
 if(action==='back')return false;
 if(action==='search'){controllerFocus($('#drawer-search'));native?.showKeyboard?.();return true}
 if(action==='edit'){const pkg=document.activeElement?.closest('.drawer-item')?.querySelector('.drawer-app')?.dataset.package;if(pkg)editDrawerApp(pkg);return true}
 if(action==='pageDown'||action==='pageUp'){drawerChangePage(action==='pageDown'?1:-1);return true}
 if(action==='genreNext'||action==='genrePrev'){const list=['home','pinned','recent','other','all'];drawerView=list[(list.indexOf(drawerView)+(action==='genreNext'?1:list.length-1))%list.length];drawerPage=0;$('#drawer-search').value='';$('#drawer-letter').value='';renderDrawer();controllerFocus($('#drawer-grid .drawer-app')||$('#drawer-search'));return true}
 const active=document.activeElement;if(!active?.matches('.drawer-app')||!['left','right','up','down'].includes(action))return false;
 const cards=[...document.querySelectorAll('#drawer-grid .drawer-app')],i=cards.indexOf(active),top=cards[0].getBoundingClientRect().top,columns=cards.filter(c=>Math.abs(c.getBoundingClientRect().top-top)<2).length;
 let n=i+({left:-1,right:1,up:-columns,down:columns}[action]);if(n<0&&action==='up'){controllerFocus($('#drawer-search'));return true}if(n<0&&action==='left'&&drawerPage>0){drawerPage--;renderDrawer();controllerFocus([...$('#drawer-grid').querySelectorAll('.drawer-app')].at(-1));return true}if(n>=cards.length&&!$('#drawer-next').disabled){drawerChangePage(1);return true}controllerFocus(cards[Math.max(0,Math.min(cards.length-1,n))]);return true;
}
function initApps(){
 lastIconPack=typeof saved.lastIconPack==='string'?saved.lastIconPack:'';
 appIconPack=typeof saved.appIconPack==='string'?saved.appIconPack:'';
 $('#app-icon-pack').onchange=()=>{appIconPack=$('#app-icon-pack').value;persist();renderDrawer();renderPinnedApps();};
 $('#refresh-icon-packs').onclick=()=>{native?.iconPacks?.();};renderIconPackPicker();native?.iconPacks?.();
 window.addEventListener('librarychange',()=>{if($('#apps-drawer').open)renderDrawer();});
 initPinDrag();initAppHold();initManualPackPicker();
 $('#apps-drawer').addEventListener('close',syncSystemBarColor);
 $('#apps-drawer').addEventListener('cancel',e=>{e.preventDefault();if(!closeAppSection())hideDialog('#apps-drawer')});
 $('#open-apps').onclick=openApps;$('#close-apps').onclick=()=>hideDialog('#apps-drawer');$('#android-settings').onclick=()=>native?.androidSettings?.();
 $('#drawer-search').oninput=()=>{drawerPage=0;$('#drawer-letter').value='';renderDrawer()};$('#drawer-letter').replaceChildren(...['','#',...'ABCDEFGHIJKLMNOPQRSTUVWXYZ'].map(l=>{const o=el('option','',l||'All');o.value=l;return o}));$('#drawer-letter').onchange=()=>{drawerPage=0;renderDrawer()};
 $('#drawer-prev').onclick=()=>drawerChangePage(-1);$('#drawer-next').onclick=()=>drawerChangePage(1);
 $('#close-appearance').onclick=()=>hideDialog('#app-appearance');$('#app-appearance').addEventListener('close',()=>{if(!$('#app-appearance').open)appearanceDraft=null});
 $('#appearance-reset-name').onclick=()=>{const a=drawerCatalog.find(a=>a.package===appearanceDraft?.package);if(a){delete appearanceDraft.title;$('#appearance-name').value=a.title;}};
 $('#appearance-reset').onclick=()=>{const a=drawerCatalog.find(a=>a.package===appearanceDraft?.package);if(!a){$('#appearance-error').textContent='This app is no longer available. Close this editor to refresh the app list.';return}delete appearanceDraft.image;delete appearanceDraft.packIcon;$('#appearance-image').src=appImagePreference(appearanceDraft,a.package)};
 $('#appearance-game').onclick=editDrawerGame;
 $('#editor').addEventListener('close',()=>{if($('#app-appearance').open){refreshAppGameAction();if($('#apps-drawer').open)renderDrawer()}});
 $('#appearance-uninstall').onclick=()=>{const pkg=appearanceDraft?.package;if(pkg&&native?.canUninstallApp?.(pkg))native.uninstallApp(pkg);};
 $('#appearance-info').onclick=()=>native?.appInfo?.(appearanceDraft.package);
 $('#app-appearance-form').onsubmit=e=>{e.preventDefault();const a=drawerCatalog.find(a=>a.package===appearanceDraft?.package);if(!a){$('#appearance-error').textContent='This app is no longer available. Close this editor to refresh the app list.';return}const title=$('#appearance-name').value.trim();if(!title){$('#appearance-error').textContent='Enter a name.';return}const value={...appearanceDraft,title:title===a.title?'':title,pinned:$('#appearance-pinned').checked,section:$('#appearance-section').value,hideFromSections:$('#appearance-section-hidden').checked};
 delete value.classification;
 const pinned=drawerPreferences.filter(x=>x.pinned&&x.package!==a.package).sort((a,b)=>(a.order||0)-(b.order||0));const position=Math.max(0,Math.min(pinned.length,Number($('#appearance-order').value)-1||0));value.order=pinned.length===0?0:position===0?(pinned[0].order||0)-1:position>=pinned.length?(pinned[pinned.length-1].order||0)+1:((pinned[position-1].order||0)+(pinned[position].order||0))/2;
 if(storeDrawerPreference(value)){hideDialog('#app-appearance');renderDrawer();renderPinnedApps();toast('App appearance saved')}};
 loadDrawerPreferences();if(native?.drawerApps)native.drawerApps();
}

function renderIconPackPicker(){const options=[{package:"",title:"System icons"},...availableIconPacks];if(appIconPack&&!options.some(p=>p.package===appIconPack))options.push({package:appIconPack,title:"Unavailable pack (using system icons)"});$("#app-icon-pack").replaceChildren(...options.map(p=>{const o=el("option","",p.title);o.value=p.package;return o}));$("#app-icon-pack").value=appIconPack;$("#icon-pack-status").textContent=availableIconPacks.length?availableIconPacks.length+" installed icon packs found.":"Install an Android icon pack, then choose Refresh packs.";}

let appHold=null;
function cancelAppHold(){if(appHold)clearTimeout(appHold.timer);appHold=null;}
function startAppHold(e,button,pkg){
 cancelAppHold();if(e.button>0||e.isPrimary===false)return;
 const hold={id:e.pointerId,x:e.clientX,y:e.clientY,button,pkg};appHold=hold;
 hold.timer=setTimeout(()=>{if(appHold!==hold||!button.isConnected||pinDrag?.active)return;appHold=null;button._held=true;finishPinDrag(true);pinIgnoreClickUntil=performance.now()+700;editDrawerApp(pkg);},550);
}
function initAppHold(){
 document.addEventListener('pointermove',e=>{if(appHold&&e.pointerId===appHold.id&&Math.hypot(e.clientX-appHold.x,e.clientY-appHold.y)>8)cancelAppHold();},true);
 for(const event of ['pointerup','pointercancel'])document.addEventListener(event,e=>{if(appHold&&e.pointerId===appHold.id)cancelAppHold();},true);
 document.addEventListener('scroll',cancelAppHold,true);window.addEventListener('blur',cancelAppHold);document.addEventListener('visibilitychange',()=>{if(document.hidden)cancelAppHold()});$('#apps-drawer').addEventListener('close',cancelAppHold);
}
