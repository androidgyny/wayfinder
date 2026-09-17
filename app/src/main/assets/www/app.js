'use strict';
const $=s=>document.querySelector(s);let games=window.GAMES;let genres=[...new Set(games.map(g=>g.genre))].sort();let favoritesOnly=false;let genre='',query='',sort='az',size='comfortable',visible=72,filtered=[],selected=-1,lastTrigger=null;
let counts=Object.fromEntries(genres.map(g=>[g,games.filter(x=>x.genre===g).length]));
function el(tag,className,text){const e=document.createElement(tag);if(className)e.className=className;if(text!==undefined)e.textContent=text;return e}
for(const g of genres){const b=el('button','genre');b.dataset.genre=g;b.append(el('span','',g),el('span','',counts[g]));$('#genres').append(b)}
function closeMenu(){$('body').classList.remove('menu-open');$('#scrim').hidden=true;$('#menu').setAttribute('aria-expanded','false')}
function setGenre(g,keepFavorites=false){if(presentation==='seattle')seattleBrowse=true;if(!keepFavorites)favoritesOnly=false;const focused=document.activeElement;if(focused?.matches('.genre')&&focused.dataset.genre!==g)focused.blur();genre=g;visible=72;closeMenu();update()}
for(const b of document.querySelectorAll('[data-genre]'))b.addEventListener('click',()=>setGenre(b.dataset.genre));
function normalize(s){return s.normalize('NFKD').replace(/[\u0300-\u036f]/g,'').toLowerCase()}
function card(g){const b=el('button','game');b.dataset.id=g.id;b.setAttribute('aria-label','Play '+g.title);const cover=el('div','cover'),im=el('img');im.src=g.image;im.alt='';im.loading='lazy';im.decoding='async';im.width=480;im.height=720;cover.append(im);b.append(cover,el('span','game-title',g.title),el('span','game-genre',g.genre));b.addEventListener('click',()=>{if(menuButtons==='selected'&&document.body.dataset.input==='touch'&&['library','seattle'].includes(presentation)&&menuTouchId!==g.id){menuTouchId=g.id;controllerFocus(b,true);return}if(presentation==='prague'){pragueClick(g,b);return}if(presentation==='vienna'){viennaClick(g,b);return}if(presentation!=='library'&&presentation!=='seattle'&&presentationId!==g.id){selectPresentation(g.id);return}play(g.id,b)});b.addEventListener('contextmenu',e=>{e.preventDefault();openGame(g.id,b)});const edit=el('span','card-edit','•••');edit.setAttribute('role','button');edit.setAttribute('aria-label','Details for '+g.title);edit.tabIndex=0;edit.addEventListener('click',e=>{e.stopPropagation();openGame(g.id,b)});edit.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();e.stopPropagation();openGame(g.id,b)}});b.append(edit);syncFavoriteCard(b,g);return b}
function renderGrid(){if(presentation!=="library"){renderPresentation();return;}const fragment=document.createDocumentFragment();for(const g of filtered.slice(0,visible))fragment.append(card(g));$('#grid').replaceChildren(fragment);$('#load').hidden=visible>=filtered.length;$('#shown').textContent=filtered.length?'Showing '+Math.min(visible,filtered.length).toLocaleString()+' of '+filtered.length.toLocaleString()+' games':'';$('#empty').hidden=filtered.length!==0}
function stateURL(){const p=new URLSearchParams();if(genre)p.set('genre',genre);if(favoritesOnly)p.set('favorites','1');if(query)p.set('q',query);if(sort!=='az')p.set('sort',sort);if(size!=='comfortable')p.set('size',size);try{history.replaceState(null,'',location.pathname+(p.size?'?'+p:''))}catch{}}
function update(){stopCarouselMotion();rememberCategoryPlace();preserveListSearchPosition();ulmApplyFilter();cambridgeApplyFilter();const terms=normalize(query).trim().split(/\s+/).filter(Boolean);filtered=games.filter(g=>(presentation!=='cambridge'||cambridgeSection!=='recent'||g.lastPlayed>0)&&(presentation!=='ulm'||ulmLevel!=='games'||ulmSection!=='recent'||g.lastPlayed>0)&&(!favoritesOnly||g.favorite===true)&&(!genre||g.genre===genre)&&terms.every(t=>normalize(g.title).includes(t)));filtered.sort((a,b)=>presentation==='oxford'?a.title.localeCompare(b.title,undefined,{numeric:true,sensitivity:'base'}):(sort==='recent'||presentation==='cambridge'&&cambridgeSection==='recent'||presentation==='ulm'&&ulmLevel==='games'&&ulmSection==='recent')?((b.lastPlayed||0)-(a.lastPlayed||0)||a.title.localeCompare(b.title)):(sort==='az'?1:-1)*a.title.localeCompare(b.title,undefined,{numeric:true,sensitivity:'base'}));const restoredPlace=prepareCategoryPlace();$('#title').replaceChildren(document.createTextNode(sectionLabel()),el('span','heading-dot','.'));$('#subline').textContent=genre?'Explore this category.':'Choose a game to play.';$('#total').textContent=filtered.length.toLocaleString();$('#result').textContent=filtered.length.toLocaleString()+' '+(filtered.length===1?'game':'games')+(query?' found':'');for(const b of document.querySelectorAll('[data-genre]')){const active=!favoritesOnly&&b.dataset.genre===genre;b.classList.toggle('active',active);b.setAttribute('aria-pressed',String(active))}$('#active-filter').hidden=!query&&!genre&&!favoritesOnly;$('#filter-text').textContent=[favoritesOnly?'Favorites':genre,query?'“'+query+'”':''].filter(Boolean).join(' / ');renderGrid();restoreCategoryPlace(restoredPlace);syncFavoritesUI();revealActiveCategory();stateURL()}
$('#search').addEventListener('input',e=>{query=e.target.value;visible=72;update()});$('#sort').addEventListener('change',e=>{sort=e.target.value;visible=72;update()});
function reset(){favoritesOnly=false;genre='';query='';$('#search').value='';visible=72;update()};$('#clear').addEventListener('click',reset);$('#reset').addEventListener('click',reset);
$('#load').addEventListener('click',()=>{const start=visible;visible+=72;const fragment=document.createDocumentFragment();for(const g of filtered.slice(start,visible))fragment.append(card(g));$('#grid').append(fragment);$('#load').hidden=visible>=filtered.length;$('#shown').textContent='Showing '+Math.min(visible,filtered.length).toLocaleString()+' of '+filtered.length.toLocaleString()+' games';const first=$('#grid').children[start];if(first)first.focus({preventScroll:true})});
function setSize(s){size=s;const mobile=window.innerWidth<760;const w={compact:mobile?115:140,comfortable:mobile?145:180,large:mobile?190:235}[s];$('#grid').style.setProperty('--cover',w+'px');for(const b of document.querySelectorAll('[data-size]'))b.setAttribute('aria-pressed',String(b.dataset.size===s));stateURL()};for(const b of document.querySelectorAll('[data-size]'))b.addEventListener('click',()=>setSize(b.dataset.size));window.addEventListener('resize',()=>setSize(size));
function showGame(){const g=filtered[selected];if(!g)return;setFavoriteButton($('#favorite-detail'),g);$('#recent-control').hidden=!(g.lastPlayed>0);$('#detail-image').src=g.image;$('#detail-image').alt=g.title+' — cover artwork';$('#detail-genre').textContent=g.genre;$('#detail-title').textContent=g.title;$('#detail-category').textContent=g.genre;$('#detail-package').textContent=g.package||'Not available';$('#art-note').textContent=g.image.startsWith('user/')?'Your selected cover image.':g.fallback?'App icon used as the cover.':'Default cover artwork.';$('#position').textContent=(selected+1)+' / '+filtered.length.toLocaleString();$('#previous').disabled=selected===0;$('#next').disabled=selected===filtered.length-1;$('#detail').scrollTop=0}
function openGame(id,trigger){selected=filtered.findIndex(g=>g.id===id);lastTrigger=trigger;showGame();showDialog('#detail');$('#close').focus()}
function closeGame(){hideDialog('#detail')}
$('#close').addEventListener('click',closeGame);$('#detail').addEventListener('cancel',e=>{e.preventDefault();closeGame()});$('#detail').addEventListener('click',e=>{if(e.target===$('#detail')){const r=e.target.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)closeGame()}});$('#previous').addEventListener('click',()=>{if(selected>0){selected--;showGame()}});$('#next').addEventListener('click',()=>{if(selected<filtered.length-1){selected++;showGame()}});
$('#menu').addEventListener('click',()=>{const open=!document.body.classList.contains('menu-open');document.body.classList.toggle('menu-open',open);$('#scrim').hidden=!open;$('#menu').setAttribute('aria-expanded',String(open))});$('#scrim').addEventListener('click',closeMenu);
$('#about').addEventListener('click',()=>{showDialog('#about-dialog')});$('#close-about').addEventListener('click',()=>hideDialog('#about-dialog'));$('#about-dialog').addEventListener('close',()=>{document.body.style.overflow=''});
document.addEventListener('keydown',e=>{if(topDialog()?.id==='detail'){if(e.key==='ArrowLeft'&&selected>0){selected--;showGame()}if(e.key==='ArrowRight'&&selected<filtered.length-1){selected++;showGame()}return}if(e.key==='/'&&!topDialog()&&!['INPUT','TEXTAREA','SELECT'].includes(document.activeElement.tagName)&&!$('#about-dialog').open){e.preventDefault();$('#search').focus()}if(e.key==='Escape')closeMenu()});

let presentation="library",presentationId=null,seattleBrowse=false;
let palette="portal",soundEnabled=true,artFit="contain",lastSoundAt=0;
let draft=null,draftIsNew=false,installedApps=[],toastTimer,restoring=false;
const defaultImages=new Map(window.GAMES.map(g=>[g.id,g.image.startsWith('art/')?g.image:(/^\d+$/.test(g.id)?'art/'+g.id+'.jpg':'icon/'+g.package)]));
const native=window.Portal;
$('#app-version').textContent='WAYFINDER'+(native?.appVersion?' · '+native.appVersion():'');
function effect(name){const now=performance.now();if(!soundEnabled||restoring||!native?.sound||(now-lastSoundAt<65&&name!=='launch'))return;lastSoundAt=now;native.sound(name)}
const palettes=['portal','hacker','pink','amber','cyan','violet','parchment','midnight','seaglass','terracotta','graphite'];
function setPalette(value){palette=palettes.includes(value)?value:'portal';document.body.dataset.palette=palette;$('#palette').value=palette;updateInterfaceContrast();updateBackgroundPalette();if(native?.setThemeColor){const rgb=getComputedStyle(document.body).getPropertyValue('--bg').trim();native.setThemeColor(rgb)}persist()}
function setArtFit(value){artFit=value==='cover'?'cover':'contain';document.body.dataset.artFit=artFit;$('#art-fit').value=artFit;persist()}
function toast(message){$('#toast').textContent=message;$('#toast').hidden=false;clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('#toast').hidden=true,5000)}
function persist(){rememberCategoryPlace();trimCategoryHistory();clearTimeout(carouselSaveTimer);if(native&&!restoring&&!window.appearanceAudition)native.saveView(JSON.stringify({categoryPlaces,cambridgeArtwork,cambridgeSection,cambridgePane,cambridgePositions,ulmArtwork,ulmLevel,ulmSection,ulmPositions,ulmCategoryKey,coverBorder,interfaceContrast,titleWeight,favoritesOnly,genre,query,sort,size,palette,presentation,presentationId,seattleBrowse,copenhagenIds,copenhagenKept,pragueKey,praguePositions,viennaKey,viennaPositions,soundEnabled,artFit,typography,coverGlow,backdrop,backgroundDim,backgroundColor,selectionStyle,cupertinoReflections,cupertinoSpacing,berlinCoverSize,kyotoTitlePlacement,cupertinoTitlePlacement,viennaSeparators,coverCorners,coverBrightness,menuButtons,appearancePresets,visible,scroll:window.scrollY,focus:presentation!=='library'?presentationId:document.activeElement?.closest('.game')?.dataset.id||lastTrigger?.dataset.id||null}))}
window.saveView=persist;
function rebuildGenres(){genres=[...new Set(games.map(g=>g.genre))].sort();counts=Object.fromEntries(genres.map(g=>[g,games.filter(x=>x.genre===g).length]));$('#genres').replaceChildren();for(const g of genres){const b=el('button','genre');b.dataset.genre=g;b.append(el('span','',g),el('span','',counts[g]));b.addEventListener('click',()=>setGenre(g));$('#genres').append(b)}$('.all>span:last-child').textContent=games.length.toLocaleString();$('.genre-label>span').textContent=genres.length;$('#category-options').replaceChildren(...['',...genres].map(g=>{const o=el('option');o.value=g;o.textContent=g||'All categories…';return o}));if(genre&&!genres.includes(genre))genre=''}
function reloadLibrary(){const focusId=document.activeElement?.closest('#grid .game')?.dataset.id;if(native)games=JSON.parse(native.library());rebuildGenres();update();if(focusId)controllerFocus(libraryFocusTarget(focusId),true);persist()}
function play(id,trigger){if(presentation==='seattle')presentationId=id;if(!native){toast('Launching is available in the Android app');return}lastTrigger=trigger||lastTrigger;effect('launch');persist();native.launch(String(id))}
function topDialog(){return [...document.querySelectorAll('dialog[open]')].sort((a,b)=>(a._openedOrder||0)-(b._openedOrder||0)).pop()}
function focusableControl(node){return !!node&&node.isConnected&&!node.disabled&&node.getClientRects().length>0&&getComputedStyle(node).visibility!=='hidden'&&!node.closest('[inert]')}
function libraryFocusTarget(preferredId){
 const preferred=preferredId?[...document.querySelectorAll('#grid .game')].find(n=>n.dataset.id===preferredId):null;
 return [presentation==='cambridge'&&cambridgePane==='categories'?$('#cambridge-categories .current'):null,preferred,$('#grid .presentation-selected'),$('#grid .controller-selected'),$('#grid .ulm-selected'),$('#grid .expanded .vienna-heading'),$('#grid .expanded .prague-heading'),$('#grid .game'),$('#ulm-back'),$('#category-current'),$('#search')].find(focusableControl);
}
function dialogControls(dialog){return [...dialog.querySelectorAll('button,input,textarea,select,summary,#artwork-preview-image')].filter(focusableControl)}
function showDialog(id){
 finishCopenhagenDrag(true);stopCarouselMotion();effect('select');const dialog=$(id);if(dialog.open)return;
 dialog._returnFocus=document.activeElement;dialog._returnGame=document.activeElement?.closest('.game')?.dataset.id;
 dialog._returnApp=document.activeElement?.closest('.drawer-item')?.querySelector('.drawer-app')?.dataset.package;dialog._returnAppEdit=document.activeElement?.matches('.drawer-edit');dialog._returnPinned=document.activeElement?.closest('.pinned-app')?.dataset.package;
 dialog._openedOrder=window.dialogOrder=(window.dialogOrder||0)+1;
 dialog.showModal();document.body.style.overflow='hidden';
}
function hideDialog(id){
 const dialog=$(id);if(!dialog.open)return;dialog.close();const parent=topDialog();if(!parent)document.body.style.overflow='';
 let target=dialog._returnFocus;
 if(!focusableControl(target)&&!parent&&dialog._returnPinned)target=[...document.querySelectorAll('#seattle-apps .pinned-app')].find(n=>n.dataset.package===dialog._returnPinned);
 if(!focusableControl(target)&&parent?.id==='apps-drawer'&&dialog._returnApp){const app=[...parent.querySelectorAll('.drawer-app')].find(n=>n.dataset.package===dialog._returnApp);target=dialog._returnAppEdit?app?.parentElement.querySelector('.drawer-edit'):app;}
 if(!focusableControl(target)||(parent&&!parent.contains(target))){
  target=parent?dialogControls(parent)[0]:libraryFocusTarget(dialog._returnGame);
 }
 if(focusableControl(target))target.focus({preventScroll:true});
}
function editGame(g,isNew=false){if($('#detail').open)closeGame();draft=JSON.parse(JSON.stringify(g));draftIsNew=isNew;$('#editor-heading').textContent=isNew?'Add game':'Edit game';$('#edit-title').value=g.title;$('#edit-genre').value=g.genre;$('#category-options').value=genres.includes(g.genre)?g.genre:'';$('#edit-image').src=g.image;$('#edit-error').textContent='';$('#edit-target').textContent='Launches '+g.package;$('#remove-game').hidden=isNew;$('#uninstall-control').hidden=isNew||g.kind!=='app'||!!g.intentUri||!native?.canUninstall||!native.canUninstall(String(g.id));$('#reset-cover').hidden=isNew;showDialog('#editor');$('#edit-title').focus()}
function cancelEditor(){hideDialog('#editor');draft=null}
$('#close-editor').onclick=cancelEditor;$('#cancel-editor').onclick=cancelEditor;$('#editor').addEventListener('cancel',e=>{e.preventDefault();cancelEditor()});
$('#edit-detail').onclick=()=>editGame(filtered[selected]);$('#play-detail').onclick=()=>play(filtered[selected].id,lastTrigger);
$('#choose-cover').onclick=()=>{if(native)native.chooseCover(String(draft.id));else toast('Image selection is available in the Android app')};
$('#reset-cover').onclick=()=>{draft.image=defaultImages.get(draft.id)||'icon/'+draft.package;draft.fallback=draft.id==='426';$('#edit-image').src=draft.image};
$('#edit-form').onsubmit=e=>{e.preventDefault();draft.title=$('#edit-title').value.trim();draft.genre=$('#edit-genre').value.trim();if(!draft.title||!draft.genre){$('#edit-error').textContent='Enter a title and category.';return}let response={ok:true};if(native)response=JSON.parse(native.save(JSON.stringify(draft)));if(!response.ok){$('#edit-error').textContent=response.message;return}if(!native){const i=games.findIndex(g=>g.id===draft.id);if(i<0)games.push(draft);else games[i]=draft}const saved=draft.title;hideDialog('#editor');draft=null;reloadLibrary();toast(saved+' saved')};
$('#uninstall-game').onclick=()=>{if(draft&&!draftIsNew&&draft.kind==='app'&&!draft.intentUri&&native?.canUninstall?.(String(draft.id)))native.uninstallGame(String(draft.id));};
$('#remove-game').onclick=()=>{$('#remove-message').textContent=draft.title;showDialog('#remove-dialog')};$('#cancel-remove').onclick=()=>hideDialog('#remove-dialog');$('#confirm-remove').onclick=()=>{if(native){const response=JSON.parse(native.remove(String(draft.id)));if(!response.ok){toast(response.message);return}}else games=games.filter(g=>g.id!==draft.id);hideDialog('#remove-dialog');cancelEditor();reloadLibrary();toast('Removed from library')};
let replacingLaunchTarget=false;
function appPicker(replace=false){replacingLaunchTarget=replace===true;closeMenu();$('#app-search').value='';$('#app-list').replaceChildren();$('#app-results').textContent='Loading installed apps…';showDialog('#app-picker');if(native)native.installed();else nativeEvent('installed',{apps:[{title:'Sample installed game',package:'sample.game',component:'sample.game/.MainActivity',isGame:true}]})}
$('#add-game').onclick=()=>appPicker();$('#change-target').onclick=()=>appPicker(true);$('#close-picker').onclick=()=>hideDialog('#app-picker');$('#app-search').oninput=renderApps;
function renderApps(){const q=normalize($('#app-search').value);const found=installedApps.filter(g=>normalize(g.title+' '+g.package).includes(q));$('#app-results').textContent=found.length+' installed apps';$('#app-list').replaceChildren(...found.slice(0,150).map(g=>{const b=el('button','installed-app');const im=el('img');im.src='icon/'+g.package;im.alt='';im.loading='lazy';const t=el('span','',g.title);t.append(el('small','',g.package));b.append(im,t);const existing=games.find(x=>x.package===g.package&&x.kind!=='shortcut');if(existing)b.append(el('span','already','In library'));b.onclick=()=>{hideDialog('#app-picker');if(replacingLaunchTarget&&draft){draft.package=g.package;draft.component=g.component;draft.kind='app';draft.action='android.intent.action.MAIN';delete draft.intentUri;delete draft.extras;$('#edit-target').textContent='Launches '+g.package;$('#uninstall-control').hidden=true;replacingLaunchTarget=false;return}if(existing){editGame(existing);return}editGame({id:'new_'+Date.now()+'_'+Math.floor(Math.random()*100000),title:g.title,genre:'Uncategorized',kind:'app',package:g.package,component:g.component,action:'android.intent.action.MAIN',image:'icon/'+g.package,lastPlayed:0},true)};return b}))}
$('#settings-button').onclick=()=>showDialog('#settings-dialog');$('#close-settings').onclick=()=>hideDialog('#settings-dialog');$('#export').onclick=()=>{hideDialog('#settings-dialog');if(native)native.backup()};$('#import').onclick=()=>{hideDialog('#settings-dialog');if(native)native.restore()};$('#add-shortcut').onclick=()=>{hideDialog('#settings-dialog');if(native)native.createShortcut()};
for(const d of document.querySelectorAll('dialog'))d.addEventListener('close',()=>{if(!document.querySelector('dialog[open]'))document.body.style.overflow=''})
window.nativeEvent=(event,data)=>{if(event==='launchMissing'){showMissingTarget(data.id);return;}if(event==='customFontCandidate'){loadCustomFont(data,true);return;}if(event==='appUninstalled'){if(draft&&draft.package===data.package&&draft.kind==='app'&&!draft.intentUri)cancelEditor();reloadLibrary();if(native?.drawerApps)native.drawerApps();toast('App uninstalled and removed from library');return;}if(event==='backgroundChanged'){refreshCustomBackground();setAtmosphere('custom',selectionStyle);return;}if(event==='backgroundRemoved'){refreshCustomBackground();if(backdrop==='custom')setAtmosphere('flat',selectionStyle);return;}if(event==='ambientChanged'){refreshAmbient();return;}if(event==='homeStatus'){refreshHome();return;}if(event==='startupChanged'){refreshStartup();return;}if(appsEvent(event,data))return;if(event==='notice')toast(data.message);if(event==='installed'){installedApps=data.apps.sort((a,b)=>a.title.localeCompare(b.title));renderApps()}if(event==='cover'&&draft&&String(draft.id)===data.id){draft.image=data.image;draft.fallback=false;$('#edit-image').src=data.image}if(event==='newShortcut')editGame(data.game,true);if(event==='restored'){reloadLibrary();toast('Library restored')}if(event==='launched'){const g=games.find(g=>String(g.id)===data.id);if(g)g.lastPlayed=Date.now();if(presentation==='seattle'){const focused=document.activeElement?.closest('#grid .game')?.dataset.id;update();if(focused)controllerFocus(libraryFocusTarget(focused),true)}}};
window.onNativeResume=()=>{resumeCustomBackground();if(native?.drawerApps)native.drawerApps();if(!topDialog()&&!editingField()&&(document.activeElement===document.body||!focusableControl(document.activeElement)))libraryFocusTarget(controllerGameId||presentationId||lastTrigger?.dataset.id)?.focus({preventScroll:true})};
window.nativeBack=()=>{effect('back');if(copenhagenDrag?.active){finishCopenhagenDrag(true);return true;}if(window.controllerChoice){closeControllerChoice();return true;}if(window.appearanceAudition){finishAppearanceAudition(false);return true;}const d=topDialog();if(d){if(d.id==='editor')cancelEditor();else if(d.id==='detail')closeGame();else hideDialog('#'+d.id);return true}if(presentation==='cambridge')return cambridgeBack();if(presentation==='ulm')return ulmBack();if(document.body.classList.contains('menu-open')){closeMenu();return true}if(document.activeElement===document.querySelector('#search')){$('#search').blur();return true}if(presentation==='seattle'&&(seattleBrowse||query||genre||favoritesOnly)){seattleDashboard();return true}if(query||genre||favoritesOnly){reset();return true}return false};
let controllerGameId=null;
function controllerFocus(node,silent=false){
 if(!focusableControl(node))return;
 if(node.closest('dialog')){document.body.dataset.input='controller';node.focus({preventScroll:true});node.scrollIntoView({block:'nearest',inline:'nearest'});return;}
 const previousCard=document.activeElement?.closest('.game');
 if(!silent&&document.activeElement!==node)effect('move');
 document.body.dataset.input='controller';
 hoverGlowCard=null;
 const nextCard=node.closest('.game');
 if(presentation==='seattle'){
  document.querySelectorAll('#grid .presentation-selected').forEach(e=>{if(e!==nextCard)e.classList.remove('presentation-selected')});
  if(nextCard)nextCard.classList.add('presentation-selected');
 }
 if(glowCard!==nextCard){glowCard?.classList.remove('glow-selected');glowCard=nextCard;if(nextCard){const img=nextCard.querySelector('.cover img'),color=coverGlow&&img?coverColor(img):null;if(color)nextCard.style.setProperty('--cover-glow-rgb',color);nextCard.classList.add('glow-selected');}}
 node.focus({preventScroll:true});
 if(node.matches('.seattle-chip'))revealSeattleCategory(node);
 document.querySelectorAll('.controller-selected').forEach(e=>e.classList.remove('controller-selected'));
 const card=node.closest('.game');
 if(card){controllerGameId=card.dataset.id;card.classList.add('controller-selected')}
 if(presentation==='seattle'&&card)presentationId=card.dataset.id;
 if(presentation==='seattle'&&card&&!node.closest('dialog'))scrollSeattleSelection(card,previousCard);
 else if(presentation==='library'||node.closest('dialog'))node.scrollIntoView({block:'nearest',inline:'nearest'});
 else if(presentation==='vienna'){const r=node.getBoundingClientRect();if(r.top<$('.topbar').offsetHeight||r.bottom>innerHeight)node.closest('.vienna-section')?.scrollIntoView({block:'center',behavior:'instant'});}
 else if(presentation==='prague'){const column=node.closest('.prague-column'),grid=$('#grid');if(column&&(column.offsetLeft<grid.scrollLeft||column.offsetLeft+column.offsetWidth>grid.scrollLeft+grid.clientWidth))grid.scrollLeft=Math.max(0,column.offsetLeft-(grid.clientWidth-column.offsetWidth)/2);}
 else resetPresentationScroll();
 queueCarouselSave();
}
document.addEventListener('pointerdown',e=>{
 document.body.dataset.input=e.pointerType==='touch'?'touch':'pointer';
 document.querySelectorAll('.controller-selected').forEach(n=>n.classList.remove('controller-selected'));
 const card=e.target.closest('.game');if(card){controllerGameId=card.dataset.id;card.focus({preventScroll:true})}
});
function currentGame(){const b=document.activeElement?.closest('.game');return games.find(g=>String(g.id)===(b?.dataset.id||controllerGameId))}
function gridMove(startCard,action){
 if(presentation==='berlin'){berlinMove(action);return;}
 if(presentation==='seattle'){seattleMove(startCard,action);return;}
 if(presentation==='tokyo'||presentation==='oxford'){
  if(action==='left'||action==='right'){controller(action==='left'?'genrePrev':'genreNext');return}
  movePresentation(({up:-1,down:1,pageUp:-presentationPageSize(),pageDown:presentationPageSize()}[action]||0),true);return;
 }

 if(presentation!=="library"){if(action==="up"){controllerFocus($("#category-current"));return}movePresentation(({left:-1,right:1,pageUp:-presentationPageSize(),pageDown:presentationPageSize()}[action]||0),true);return;}
 let cards=[...document.querySelectorAll('#grid .game')];
 let index=cards.indexOf(startCard);if(index<0)return;
 let delta=action==='left'?-1:action==='right'?1:0;
 if(!delta){
  const firstTop=cards[0].offsetTop;let columns=1;
  while(columns<cards.length&&Math.abs(cards[columns].offsetTop-firstTop)<2)columns++;
  const nextRow=cards[columns],rowHeight=nextRow?nextRow.offsetTop-firstTop:cards[0].offsetHeight+24;
  const pageRows=Math.max(1,Math.floor((innerHeight-$('.topbar').offsetHeight-24)/rowHeight));
  delta=({up:-columns,down:columns,pageUp:-columns*pageRows,pageDown:columns*pageRows}[action]||0);
 }
 let target=index+delta;
 if(target>=cards.length&&cards.length<filtered.length){
  const start=cards.length;visible=Math.min(filtered.length,Math.max(visible+72,target+1));
  const fragment=document.createDocumentFragment();
  for(const g of filtered.slice(start,visible))fragment.append(card(g));
  $('#grid').append(fragment);$('#load').hidden=visible>=filtered.length;
  $('#shown').textContent='Showing '+Math.min(visible,filtered.length).toLocaleString()+' of '+filtered.length.toLocaleString()+' games';
  cards=[...document.querySelectorAll('#grid .game')];
 }
 target=Math.max(0,Math.min(cards.length-1,target));controllerFocus(cards[target]);
}
window.controller=action=>{document.querySelector('.skip')?.classList.remove('keyboard-access');if(pinDrag)finishPinDrag(true);if(copenhagenDrag?.active&&action==='back'){finishCopenhagenDrag(true);return;}finishCopenhagenDrag(true);stopCarouselMotion();
 const modal=topDialog();
 if(window.controllerChoice){controllerChoiceAction(action);return;}
 if(action==='apps'){if(modal?.id==='apps-drawer')hideDialog('#apps-drawer');else if(!modal)openApps();return;}
 if(modal?.id==='artwork-dialog'&&window.artworkController?.(action))return;
 if(modal?.id==='apps-drawer'&&appsController(action))return;
 if(!modal&&presentation==='seattle'&&seattleCategoryController(action))return;
 if(!modal&&presentation==='cambridge'&&cambridgeController(action))return;
 if(!modal&&presentation==='ulm'&&ulmController(action))return;
 if(!modal&&presentation==='copenhagen'&&!document.activeElement?.matches('input,textarea,select')&&copenhagenController(action))return;
 if(!modal&&presentation==='prague'&&!document.activeElement?.matches('input,textarea,select')&&pragueController(action))return;
 if(!modal&&presentation==='vienna'&&!document.activeElement?.matches('input,textarea,select')&&viennaController(action))return;
 if(!modal&&presentation==='berlin'&&(document.activeElement===document.body||document.activeElement?.closest('#grid'))&&['up','down','left','right','pageUp','pageDown'].includes(action)){berlinMove(action);return;}
 const directions={up:[0,-1],down:[0,1],left:[-1,0],right:[1,0]};
 // Android delivers these commands through JavaScript, so :focus-visible alone
 // cannot identify controller input. Keep its selection explicit.
 const hovered=presentation==='library'&&!modal&&document.body.dataset.input!=='controller'&&!document.activeElement?.closest('#grid .game')?document.querySelector('.game:hover'):null;
 if(hovered&&(directions[action]||action==='activate'||action==='edit'))controllerFocus(hovered);
 document.body.dataset.input='controller';
 if(action==='pageUp'||action==='pageDown'){
  effect('page');
  if(modal){const previousY=document.activeElement?.getBoundingClientRect().top||modal.getBoundingClientRect().top;modal.scrollBy({top:(action==='pageDown'?1:-1)*modal.clientHeight*.85,behavior:'instant'});const bounds=modal.getBoundingClientRect();const candidates=dialogControls(modal).filter(n=>{const r=n.getBoundingClientRect();return r.top>=bounds.top+8&&r.bottom<=bounds.bottom-8});candidates.sort((a,b)=>Math.abs(a.getBoundingClientRect().top-previousY)-Math.abs(b.getBoundingClientRect().top-previousY));controllerFocus(candidates[0],true);return}
  const current=document.activeElement?.closest('.game');
  const cards=[...document.querySelectorAll('#grid .game')];
  const start=current||cards.find(c=>{const r=c.getBoundingClientRect();return r.bottom>$('.topbar').offsetHeight&&r.top<innerHeight})||cards[0];
  if(start)gridMove(start,action);return;
 }
 if(action==='back'){if(!nativeBack())toast('Press Android Back to leave the library');return}
 if(action==='search'){if(!modal){controllerFocus($('#search'));native?.showKeyboard?.();}return}
 if(action==='menu'){if(!modal)showDialog('#settings-dialog');return}
 const current=currentGame();
 if(action==='favorite'){if(modal?.id==='detail')toggleFavorite(filtered[selected]?.id);else if(!modal)toggleFavorite(presentation!=='library'&&presentation!=='seattle'?presentationId:current?.id);return;}
 if(action==='edit'&&!modal&&current){editGame(current);return}
 if(action==='genreNext'||action==='genrePrev'){
  if(modal)return;effect('page');stepSection(action==='genreNext'?1:-1);controllerFocus($('#grid .presentation-selected')||$('#grid .game')||(presentation==='seattle'?$('#seattle-home'):presentation!=='library'?$('#category-current'):document.querySelector('.genre.active')),true);if(presentation==='seattle')revealSeattleCategory($('#seattle-categories .active'));return;
 }
 if(!modal&&presentation!=='library'&&document.activeElement?.closest('#category-strip')){if(action==='left'||action==='right'){controller(action==='left'?'genrePrev':'genreNext');controllerFocus($('#category-current'),true);return}if(action==='down'){controllerFocus($('#grid .presentation-selected'));return}}
 if(action==='activate'){
  if(document.activeElement?.tagName==='SELECT'){openControllerChoice(document.activeElement);return;}
  if(document.activeElement===document.body||(modal&&!modal.contains(document.activeElement))){controllerFocus(modal?dialogControls(modal)[0]:$('#grid .presentation-selected')||$('#grid .game'));return}
  document.activeElement?.click();return;
 }
 if(!directions[action])return;
 const field=document.activeElement;
 if(field?.type==='range'&&(action==='left'||action==='right')){if(!field.disabled){const step=Number(field.step)||1;field.value=Number(field.value)+(action==='right'?step:-step);field.dispatchEvent(new Event('input',{bubbles:true}))}return;}
 if(field?.matches('textarea,input:not([type=checkbox]):not([type=radio]):not([type=button]):not([type=submit])')&&(action==='left'||action==='right')){
  const p=Math.max(0,Math.min(field.value.length,(field.selectionStart||0)+(action==='right'?1:-1)));
  try{field.setSelectionRange(p,p)}catch{}return;
 }
 if(field?.tagName==='SELECT'&&(action==='left'||action==='right')){
  const options=[...field.options].filter(o=>!o.disabled&&!o.hidden&&!o.parentElement.disabled),index=options.indexOf(field.selectedOptions[0]),next=options[Math.max(0,Math.min(options.length-1,index+(action==='right'?1:-1)))];
  if(next&&next.index!==field.selectedIndex){field.selectedIndex=next.index;field.dispatchEvent(new Event('change',{bubbles:true}));}return;
 }
 const activeCard=!modal&&field?.closest('.game');
 if(activeCard){gridMove(activeCard,action);return}
 if(!modal&&presentation==='library'&&field?.matches('aside .genre')){
  const categories=[...document.querySelectorAll('aside .genre')].filter(focusableControl),index=categories.indexOf(field);
  if(action==='up'||action==='down'){controllerFocus(categories[Math.max(0,Math.min(categories.length-1,index+(action==='down'?1:-1)))]);return;}
  if(action==='left')return;
  if(action==='right'){controllerFocus(libraryFocusTarget(controllerGameId),true);return;}
 }
 const root=modal||document;
 const all=dialogControls(root);
 if(!all.includes(field)){controllerFocus(modal?all[0]:($('#grid .presentation-selected')||$('#grid .game')));return}
 const r=field.getBoundingClientRect(),[dx,dy]=directions[action];const ax=r.left+r.width/2,ay=r.top+r.height/2;
 if(modal){
  // Move to the adjacent row first, then the nearest control within it.
  // A strong horizontal penalty alone can skip wide sliders or left buttons.
  const candidates=all.filter(n=>n!==field).map(node=>{const box=node.getBoundingClientRect(),x=box.left+box.width/2-ax,y=box.top+box.height/2-ay;return {node,box,forward:dx*x+dy*y,cross:Math.abs(dx?y:x)}}).filter(n=>n.forward>Math.max(5,Math.min(r.height,n.box.height)*.25));
  let options=candidates;
  if(dx)options=candidates.filter(n=>Math.min(r.bottom,n.box.bottom)-Math.max(r.top,n.box.top)>4);
  else if(candidates.length){const nearest=Math.min(...candidates.map(n=>n.forward));options=candidates.filter(n=>n.forward<=nearest+Math.max(8,r.height*.4));}
  options.sort((a,b)=>dx?a.forward-b.forward:a.cross-b.cross||a.forward-b.forward);controllerFocus(options[0]?.node);return;
 }

 let best=null,score=Infinity;
 for(const candidate of all){
  if(candidate===field)continue;const b=candidate.getBoundingClientRect(),x=b.left+b.width/2-ax,y=b.top+b.height/2-ay,forward=dx*x+dy*y,cross=Math.abs(dx?y:x);
  if(forward<5||dx&&Math.min(r.bottom,b.bottom)-Math.max(r.top,b.top)<=4)continue;const value=forward+cross*3;if(value<score){score=value;best=candidate}
 }
 controllerFocus(best);
};
window.addEventListener('scroll',()=>{clearTimeout(window.scrollTimer);window.scrollTimer=setTimeout(persist,180)},{passive:true});
window.addEventListener('beforeunload',persist);
$('#sound-enabled').onchange=e=>{soundEnabled=e.target.checked;persist();if(soundEnabled)effect('select')};
$('#palette').onchange=e=>{setPalette(e.target.value);effect('select')};
$('#art-fit').onchange=e=>{setArtFit(e.target.value);effect('select')};
document.addEventListener('click',e=>{const b=e.target.closest('button,.card-edit');if(!b||b.disabled||b.matches('.game'))return;if(b.id==='play-detail'||b.closest('#category-strip'))return;effect(/close|cancel|clear|reset/.test(b.id)?'back':b.dataset.genre!==undefined?'page':'select')},true);

let saved={};try{saved=native?JSON.parse(native.view()):{}}catch{}categoryPlaces=saved.categoryPlaces&&typeof saved.categoryPlaces==='object'?saved.categoryPlaces:{};restoring=true;cambridgeSection=typeof saved.cambridgeSection==='string'?saved.cambridgeSection:'all';cambridgePane=saved.cambridgePane==='categories'?'categories':'games';cambridgePositions=saved.cambridgePositions&&typeof saved.cambridgePositions==='object'?saved.cambridgePositions:{};copenhagenIds=Array.isArray(saved.copenhagenIds)?saved.copenhagenIds.filter(id=>typeof id==='string').slice(0,12):[];copenhagenKept=Array.isArray(saved.copenhagenKept)?saved.copenhagenKept.filter(id=>typeof id==='string'):[];copenhagenFilter=JSON.stringify([saved.query||'',saved.genre||'',saved.favoritesOnly===true]);pragueKey=typeof saved.pragueKey==='string'?saved.pragueKey:'favorites';praguePositions=saved.praguePositions&&typeof saved.praguePositions==='object'?saved.praguePositions:{};ulmLevel=saved.ulmLevel==='games'?'games':'categories';ulmSection=typeof saved.ulmSection==='string'?saved.ulmSection:'all';ulmCategoryKey=typeof saved.ulmCategoryKey==='string'?saved.ulmCategoryKey:'all';ulmPositions=saved.ulmPositions&&typeof saved.ulmPositions==='object'?saved.ulmPositions:{};viennaKey=typeof saved.viennaKey==='string'?saved.viennaKey:'favorites';viennaPositions=saved.viennaPositions&&typeof saved.viennaPositions==='object'?saved.viennaPositions:{};initApps();initFavorites();initPresentation();presentation=['kyoto','cupertino','tokyo','seattle','vienna','prague','copenhagen','oxford','berlin','ulm','venice','cambridge'].includes(saved.presentation)?saved.presentation:'library';presentationId=saved.presentationId||saved.focus||null;seattleBrowse=saved.seattleBrowse===true;document.body.dataset.presentation=presentation;$('#presentation').value=presentation;setPalette(saved.palette);soundEnabled=saved.soundEnabled!==false;$('#sound-enabled').checked=soundEnabled;setArtFit(saved.artFit);initAppearance(saved);refreshOxfordControls();rebuildGenres();favoritesOnly=saved.favoritesOnly===true;genre=favoritesOnly?'':genres.includes(saved.genre)?saved.genre:'';if(presentation==='vienna'||presentation==='prague'||presentation==='copenhagen'){genre='';favoritesOnly=false;}query=saved.query||'';sort=['az','za','recent'].includes(saved.sort)?saved.sort:'az';size=['compact','comfortable','large'].includes(saved.size)?saved.size:'comfortable';visible=Math.max(72,Math.min(saved.visible||72,games.length));$('#search').value=query;$('#sort').value=sort;setSize(size);update();setTimeout(()=>{window.scrollTo(0,saved.scroll||0);if(saved.focus&&!editingField()){const selectedCard=document.querySelector('.game[data-id="'+saved.focus+'"]');if(selectedCard){controllerGameId=saved.focus;document.body.dataset.input='controller';selectedCard.classList.add('controller-selected');selectedCard.focus({preventScroll:true})}}restoring=false;focusStartupGame()},200);

function refreshStartup(){let v={enabled:true,sound:true,custom:false};try{if(native?.startupSettings)v=JSON.parse(native.startupSettings())}catch{}$('#startup-enabled').checked=v.enabled;$('#startup-sound').checked=v.sound;$('#startup-name').textContent=v.custom?'Custom video':'Wayfinder animation · 6 seconds';$('#startup-reset').disabled=!v.custom;}
$('#startup-enabled').onchange=$('#startup-sound').onchange=()=>native?.configureStartup?.($('#startup-enabled').checked,$('#startup-sound').checked);
$('#startup-choose').onclick=()=>native?.chooseStartup?.();$('#startup-preview').onclick=()=>native?.previewStartup?.();$('#startup-reset').onclick=()=>native?.resetStartup?.();refreshStartup();

function refreshHome(){const isHome=native?.isDefaultLauncher?.()===true;$('#home-status').textContent=isHome?'Wayfinder is your default home app.':'Use Wayfinder when you press Home.';$('#set-default-launcher').textContent=isHome?'Change default launcher':'Set as default launcher';}
$('#set-default-launcher').onclick=()=>native?.chooseDefaultLauncher?.();refreshHome();

window.addEventListener('keydown',e=>{if(e.key==='Tab')document.querySelector('.skip')?.classList.add('keyboard-access')},true);
window.addEventListener('pointerdown',()=>document.querySelector('.skip')?.classList.remove('keyboard-access'),true);

function editingField(){return document.activeElement?.matches('input,textarea,select,[contenteditable=true]')}
function focusStartupGame(){
 if(document.querySelector('dialog[open]')||editingField())return;
 if(presentation==='cambridge'){cambridgeFocus();return;}if(presentation==='ulm'){ulmFocus();return;}
 const target=$('#grid .presentation-selected')||$('#grid .controller-selected')||document.activeElement?.closest('#grid .game')||$('#grid .game');
 if(!target&&presentation==='prague'){$('.prague-heading')?.focus({preventScroll:true});return;}
 if(!target&&presentation==='vienna'){$('.vienna-heading')?.focus({preventScroll:true});return;}
 if(!target){$('#search').focus({preventScroll:true});return;}
 document.querySelectorAll('.controller-selected').forEach(e=>e.classList.remove('controller-selected'));
 controllerGameId=target.dataset.id;document.body.dataset.input='controller';target.classList.add('controller-selected');target.focus({preventScroll:true});
}
window.focusStartupGame=focusStartupGame;

$('#category-options').onchange=e=>{if(e.target.value)$('#edit-genre').value=e.target.value;};
$('#edit-genre').oninput=e=>{$('#category-options').value=genres.includes(e.target.value)?e.target.value:'';};

function refreshAmbient(){let v={enabled:false,volume:20,custom:false,name:'',source:'august',available:true};try{if(native?.ambientSettings)v={...v,...JSON.parse(native.ambientSettings())}}catch{}$('#ambient-enabled').checked=v.enabled;$('#ambient-enabled').disabled=!v.available;$('#ambient-source').value=v.source;$('#ambient-credit').hidden=v.source!=='august';$('#ambient-custom').hidden=v.source!=='custom';$('#ambient-name').textContent=v.custom?v.name:'No audio selected';$('#ambient-volume').value=v.volume;$('#ambient-volume-value').textContent=v.volume+'%';$('#ambient-clear').disabled=!v.custom;$('#ambient-clear-row').hidden=v.source!=='custom';}
$('#ambient-source').onchange=()=>{native?.selectAmbient?.($('#ambient-source').value);if(!native){$('#ambient-credit').hidden=$('#ambient-source').value!=='august';$('#ambient-custom').hidden=$('#ambient-source').value!=='custom';$('#ambient-clear-row').hidden=$('#ambient-source').value!=='custom';}};
function configureAmbient(){const volume=Number($('#ambient-volume').value);$('#ambient-volume-value').textContent=volume+'%';native?.configureAmbient?.($('#ambient-enabled').checked,volume)}
$('#ambient-enabled').onchange=configureAmbient;$('#ambient-volume').oninput=configureAmbient;$('#ambient-volume').onchange=configureAmbient;
$('#ambient-choose').onclick=()=>native?.chooseAmbient?.();$('#ambient-clear').onclick=()=>native?.clearAmbient?.();refreshAmbient();

// Android controller events cannot operate the browser's native select popup.
// Use an in-page chooser for controller activation; touch keeps native selects.
function openControllerChoice(select){
 if(select.disabled)return;
 let dialog=$('#controller-choice');
 if(!dialog){dialog=el('dialog');dialog.id='controller-choice';dialog.setAttribute('aria-labelledby','controller-choice-title');dialog.innerHTML='<h2 id="controller-choice-title"></h2><div id="controller-choice-options" role="listbox"></div><p class="muted">↑ ↓ Choose · A Confirm · B Cancel</p>';document.body.append(dialog);dialog.addEventListener('cancel',e=>{e.preventDefault();closeControllerChoice()});}
 const options=[...select.options].filter(o=>!o.disabled&&!o.hidden&&!o.parentElement.disabled);if(!options.length)return;
 window.controllerChoice={select,options,index:Math.max(0,options.indexOf(select.selectedOptions[0]))};
 $('#controller-choice-title').textContent=select.getAttribute('aria-label')||select.labels?.[0]?.textContent||select.closest('.settings-row')?.querySelector('h3')?.textContent||'Choose an option';
 const list=$('#controller-choice-options');list.replaceChildren();options.forEach((option,index)=>{const button=el('button','choice-option',option.textContent);button.setAttribute('role','option');button.setAttribute('aria-selected',String(option.selected));button.onclick=()=>{window.controllerChoice.index=index;closeControllerChoice(true)};list.append(button)});
 showDialog('#controller-choice');focusControllerChoice();
}
function focusControllerChoice(){const state=window.controllerChoice;if(!state)return;const buttons=[...$('#controller-choice-options').children];buttons.forEach((button,i)=>button.classList.toggle('choice-focused',i===state.index));buttons[state.index]?.focus({preventScroll:true});buttons[state.index]?.scrollIntoView({block:'nearest'});}
function closeControllerChoice(commit=false){
 const state=window.controllerChoice;if(!state)return;window.controllerChoice=null;hideDialog('#controller-choice');
 if(commit&&state.select.isConnected&&!state.select.disabled){const option=state.options[state.index];if(option&&option.index!==state.select.selectedIndex){state.select.selectedIndex=option.index;state.select.dispatchEvent(new Event('change',{bubbles:true}));}}
 if(state.select.isConnected&&state.select.getClientRects().length)state.select.focus({preventScroll:true});
}
function controllerChoiceAction(action){
 const state=window.controllerChoice;if(!state)return;
 if(action==='back'){closeControllerChoice();return;}if(action==='activate'){closeControllerChoice(true);return;}
 const delta={up:-1,down:1,left:-1,right:1,pageUp:-8,pageDown:8}[action];if(delta){state.index=Math.max(0,Math.min(state.options.length-1,state.index+delta));focusControllerChoice();}
}

let missingTargetId=null;
function showMissingTarget(id){
 const game=games.find(g=>String(g.id)===String(id));if(!game)return;
 missingTargetId=String(id);$('#missing-message').textContent='Wayfinder could not find the app or shortcut target for “'+game.title+'”.';
 showDialog('#missing-target');$('#missing-cancel').focus();
}
$('#missing-cancel').onclick=()=>hideDialog('#missing-target');
$('#missing-target').addEventListener('cancel',e=>{e.preventDefault();hideDialog('#missing-target')});
$('#missing-edit').onclick=()=>{const game=games.find(g=>String(g.id)===missingTargetId);hideDialog('#missing-target');if(game)editGame(game)};
$('#missing-remove').onclick=()=>{
 const id=missingTargetId;const response=native?JSON.parse(native.remove(id)):{ok:true};
 if(!response.ok){toast(response.message);return}
 hideDialog('#missing-target');if($('#detail').open)closeGame();
 if(!native)games=games.filter(g=>String(g.id)!==id);
 reloadLibrary();libraryFocusTarget()?.focus({preventScroll:true});toast('Removed from library');
};
