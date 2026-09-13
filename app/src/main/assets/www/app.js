'use strict';
const $=s=>document.querySelector(s);let games=window.GAMES;let genres=[...new Set(games.map(g=>g.genre))].sort();let favoritesOnly=false;let genre='',query='',sort='az',size='comfortable',visible=72,filtered=[],selected=-1,lastTrigger=null;
let counts=Object.fromEntries(genres.map(g=>[g,games.filter(x=>x.genre===g).length]));
function el(tag,className,text){const e=document.createElement(tag);if(className)e.className=className;if(text!==undefined)e.textContent=text;return e}
for(const g of genres){const b=el('button','genre');b.dataset.genre=g;b.append(el('span','',g),el('span','',counts[g]));$('#genres').append(b)}
function closeMenu(){$('body').classList.remove('menu-open');$('#scrim').hidden=true;$('#menu').setAttribute('aria-expanded','false')}
function setGenre(g,keepFavorites=false){if(presentation==='seattle')seattleBrowse=true;if(!keepFavorites)favoritesOnly=false;const focused=document.activeElement;if(focused?.matches('.genre')&&focused.dataset.genre!==g)focused.blur();genre=g;visible=72;closeMenu();update();window.scrollTo({top:0,behavior:'instant'})}
for(const b of document.querySelectorAll('[data-genre]'))b.addEventListener('click',()=>setGenre(b.dataset.genre));
function normalize(s){return s.normalize('NFKD').replace(/[\u0300-\u036f]/g,'').toLowerCase()}
function card(g){const b=el('button','game');b.dataset.id=g.id;b.setAttribute('aria-label','Play '+g.title);const cover=el('div','cover'),im=el('img');im.src=g.image;im.alt='';im.loading='lazy';im.decoding='async';im.width=480;im.height=720;cover.append(im);b.append(cover,el('span','game-title',g.title),el('span','game-genre',g.genre));b.addEventListener('click',()=>{if(presentation==='vienna'){viennaClick(g,b);return}if(presentation!=='library'&&presentation!=='seattle'&&presentationId!==g.id){selectPresentation(g.id);return}play(g.id,b)});b.addEventListener('contextmenu',e=>{e.preventDefault();openGame(g.id,b)});const edit=el('span','card-edit','•••');edit.setAttribute('role','button');edit.setAttribute('aria-label','Details for '+g.title);edit.tabIndex=0;edit.addEventListener('click',e=>{e.stopPropagation();openGame(g.id,b)});edit.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();e.stopPropagation();openGame(g.id,b)}});b.append(edit);syncFavoriteCard(b,g);return b}
function renderGrid(){if(presentation!=="library"){renderPresentation();return;}const fragment=document.createDocumentFragment();for(const g of filtered.slice(0,visible))fragment.append(card(g));$('#grid').replaceChildren(fragment);$('#load').hidden=visible>=filtered.length;$('#shown').textContent=filtered.length?'Showing '+Math.min(visible,filtered.length).toLocaleString()+' of '+filtered.length.toLocaleString()+' games':'';$('#empty').hidden=filtered.length!==0}
function stateURL(){const p=new URLSearchParams();if(genre)p.set('genre',genre);if(favoritesOnly)p.set('favorites','1');if(query)p.set('q',query);if(sort!=='az')p.set('sort',sort);if(size!=='comfortable')p.set('size',size);try{history.replaceState(null,'',location.pathname+(p.size?'?'+p:''))}catch{}}
function update(){stopCarouselMotion();const terms=normalize(query).trim().split(/\s+/).filter(Boolean);filtered=games.filter(g=>(!favoritesOnly||g.favorite===true)&&(!genre||g.genre===genre)&&terms.every(t=>normalize(g.title+' '+g.genre+' '+g.package).includes(t)));filtered.sort((a,b)=>presentation==='oxford'?a.title.localeCompare(b.title,undefined,{numeric:true,sensitivity:'base'}):sort==='recent'?((b.lastPlayed||0)-(a.lastPlayed||0)||a.title.localeCompare(b.title)):(sort==='az'?1:-1)*a.title.localeCompare(b.title,undefined,{numeric:true,sensitivity:'base'}));$('#title').replaceChildren(document.createTextNode(sectionLabel()),el('span','heading-dot','.'));$('#subline').textContent=genre?'Explore this category.':'Choose a game to play.';$('#total').textContent=filtered.length.toLocaleString();$('#result').textContent=filtered.length.toLocaleString()+' '+(filtered.length===1?'game':'games')+(query?' found':'');for(const b of document.querySelectorAll('[data-genre]')){const active=!favoritesOnly&&b.dataset.genre===genre;b.classList.toggle('active',active);b.setAttribute('aria-pressed',String(active))}$('#active-filter').hidden=!query&&!genre&&!favoritesOnly;$('#filter-text').textContent=[favoritesOnly?'Favorites':genre,query?'“'+query+'”':''].filter(Boolean).join(' / ');renderGrid();syncFavoritesUI();stateURL()}
$('#search').addEventListener('input',e=>{query=e.target.value;visible=72;update()});$('#sort').addEventListener('change',e=>{sort=e.target.value;visible=72;update()});
function reset(){favoritesOnly=false;genre='';query='';$('#search').value='';visible=72;update()};$('#clear').addEventListener('click',reset);$('#reset').addEventListener('click',reset);
$('#load').addEventListener('click',()=>{const start=visible;visible+=72;const fragment=document.createDocumentFragment();for(const g of filtered.slice(start,visible))fragment.append(card(g));$('#grid').append(fragment);$('#load').hidden=visible>=filtered.length;$('#shown').textContent='Showing '+Math.min(visible,filtered.length).toLocaleString()+' of '+filtered.length.toLocaleString()+' games';const first=$('#grid').children[start];if(first)first.focus({preventScroll:true})});
function setSize(s){size=s;const mobile=window.innerWidth<760;const w={compact:mobile?115:140,comfortable:mobile?145:180,large:mobile?190:235}[s];$('#grid').style.setProperty('--cover',w+'px');for(const b of document.querySelectorAll('[data-size]'))b.setAttribute('aria-pressed',String(b.dataset.size===s));stateURL()};for(const b of document.querySelectorAll('[data-size]'))b.addEventListener('click',()=>setSize(b.dataset.size));window.addEventListener('resize',()=>setSize(size));
function showGame(){const g=filtered[selected];if(!g)return;setFavoriteButton($('#favorite-detail'),g);$('#recent-control').hidden=!(g.lastPlayed>0);$('#detail-image').src=g.image;$('#detail-image').alt=g.title+' — cover artwork';$('#detail-genre').textContent=g.genre;$('#detail-title').textContent=g.title;$('#detail-category').textContent=g.genre;$('#detail-package').textContent=g.package;$('#art-note').textContent=g.image.startsWith('user/')?'Your selected cover image.':g.fallback?'App icon used as the cover.':'Default cover artwork.';$('#position').textContent=(selected+1)+' / '+filtered.length.toLocaleString();$('#previous').disabled=selected===0;$('#next').disabled=selected===filtered.length-1;$('.entry-details').open=false;$('#detail').scrollTop=0}
function openGame(id,trigger){effect('select');selected=filtered.findIndex(g=>g.id===id);lastTrigger=trigger;showGame();$('#detail').showModal();document.body.style.overflow='hidden';$('#close').focus()}
function closeGame(){$('#detail').close();document.body.style.overflow='';if(lastTrigger&&document.contains(lastTrigger))lastTrigger.focus({preventScroll:true})}
$('#close').addEventListener('click',closeGame);$('#detail').addEventListener('cancel',e=>{e.preventDefault();closeGame()});$('#detail').addEventListener('click',e=>{if(e.target===$('#detail')){const r=e.target.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)closeGame()}});$('#previous').addEventListener('click',()=>{if(selected>0){selected--;showGame()}});$('#next').addEventListener('click',()=>{if(selected<filtered.length-1){selected++;showGame()}});
$('#menu').addEventListener('click',()=>{const open=!document.body.classList.contains('menu-open');document.body.classList.toggle('menu-open',open);$('#scrim').hidden=!open;$('#menu').setAttribute('aria-expanded',String(open))});$('#scrim').addEventListener('click',closeMenu);
$('#about').addEventListener('click',()=>{$('#about-dialog').showModal();document.body.style.overflow='hidden'});$('#close-about').addEventListener('click',()=>$('#about-dialog').close());$('#about-dialog').addEventListener('close',()=>{document.body.style.overflow=''});
document.addEventListener('keydown',e=>{if($('#detail').open){if(e.key==='ArrowLeft'&&selected>0){selected--;showGame()}if(e.key==='ArrowRight'&&selected<filtered.length-1){selected++;showGame()}return}if(e.key==='/'&&!['INPUT','TEXTAREA','SELECT'].includes(document.activeElement.tagName)&&!$('#about-dialog').open){e.preventDefault();$('#search').focus()}if(e.key==='Escape')closeMenu()});

let presentation="library",presentationId=null,seattleBrowse=false;
let palette="portal",soundEnabled=true,artFit="contain",lastSoundAt=0;
let draft=null,draftIsNew=false,installedApps=[],toastTimer,restoring=false;
const defaultImages=new Map(window.GAMES.map(g=>[g.id,g.image.startsWith('art/')?g.image:(/^\d+$/.test(g.id)?'art/'+g.id+'.jpg':'icon/'+g.package)]));
const native=window.Portal;
function effect(name){const now=performance.now();if(!soundEnabled||restoring||!native?.sound||(now-lastSoundAt<65&&name!=='launch'))return;lastSoundAt=now;native.sound(name)}
const palettes=['portal','hacker','pink','amber','cyan','violet','parchment','midnight','seaglass','terracotta','graphite'];
function setPalette(value){palette=palettes.includes(value)?value:'portal';document.body.dataset.palette=palette;$('#palette').value=palette;if(native?.setThemeColor){const rgb=getComputedStyle(document.body).getPropertyValue('--bg').trim();native.setThemeColor(rgb)}persist()}
function setArtFit(value){artFit=value==='cover'?'cover':'contain';document.body.dataset.artFit=artFit;$('#art-fit').value=artFit;persist()}
function toast(message){$('#toast').textContent=message;$('#toast').hidden=false;clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('#toast').hidden=true,5000)}
function persist(){if(native&&!restoring)native.saveView(JSON.stringify({favoritesOnly,genre,query,sort,size,palette,presentation,presentationId,seattleBrowse,viennaKey,viennaPositions,soundEnabled,artFit,typography,coverGlow,cupertinoReflections,cupertinoSpacing,visible,scroll:window.scrollY,focus:presentation!=='library'?presentationId:document.activeElement?.closest('.game')?.dataset.id||lastTrigger?.dataset.id||null}))}
window.saveView=persist;
function rebuildGenres(){genres=[...new Set(games.map(g=>g.genre))].sort();counts=Object.fromEntries(genres.map(g=>[g,games.filter(x=>x.genre===g).length]));$('#genres').replaceChildren();for(const g of genres){const b=el('button','genre');b.dataset.genre=g;b.append(el('span','',g),el('span','',counts[g]));b.addEventListener('click',()=>setGenre(g));$('#genres').append(b)}$('.all>span:last-child').textContent=games.length.toLocaleString();$('.genre-label>span').textContent=genres.length;$('#category-options').replaceChildren(...['',...genres].map(g=>{const o=el('option');o.value=g;o.textContent=g||'All categories…';return o}));if(genre&&!genres.includes(genre))genre=''}
function reloadLibrary(){if(native)games=JSON.parse(native.library());rebuildGenres();update();persist()}
function play(id,trigger){if(presentation==='seattle')presentationId=id;if(!native){toast('Launching is available in the Android app');return}lastTrigger=trigger||lastTrigger;effect('launch');persist();native.launch(String(id))}
function showDialog(id){stopCarouselMotion();effect('select');$(id).showModal();document.body.style.overflow='hidden'}
function hideDialog(id){$(id).close();if(!document.querySelector('dialog[open]'))document.body.style.overflow=''}
function editGame(g,isNew=false){if($('#detail').open)closeGame();draft=JSON.parse(JSON.stringify(g));draftIsNew=isNew;$('#editor-heading').textContent=isNew?'Add game':'Edit game';$('#edit-title').value=g.title;$('#edit-genre').value=g.genre;$('#category-options').value=genres.includes(g.genre)?g.genre:'';$('#edit-image').src=g.image;$('#edit-error').textContent='';$('#edit-target').textContent='Launches '+g.package;$('#remove-game').hidden=isNew;$('#reset-cover').hidden=isNew;showDialog('#editor');$('#edit-title').focus()}
function cancelEditor(){hideDialog('#editor');draft=null}
$('#close-editor').onclick=cancelEditor;$('#cancel-editor').onclick=cancelEditor;$('#editor').addEventListener('cancel',e=>{e.preventDefault();cancelEditor()});
$('#edit-detail').onclick=()=>editGame(filtered[selected]);$('#play-detail').onclick=()=>play(filtered[selected].id,lastTrigger);
$('#choose-cover').onclick=()=>{if(native)native.chooseCover(String(draft.id));else toast('Image selection is available in the Android app')};
$('#reset-cover').onclick=()=>{draft.image=defaultImages.get(draft.id)||'icon/'+draft.package;draft.fallback=draft.id==='426';$('#edit-image').src=draft.image};
$('#edit-form').onsubmit=e=>{e.preventDefault();draft.title=$('#edit-title').value.trim();draft.genre=$('#edit-genre').value.trim();if(!draft.title||!draft.genre){$('#edit-error').textContent='Enter a title and category.';return}let response={ok:true};if(native)response=JSON.parse(native.save(JSON.stringify(draft)));if(!response.ok){$('#edit-error').textContent=response.message;return}if(!native){const i=games.findIndex(g=>g.id===draft.id);if(i<0)games.push(draft);else games[i]=draft}const saved=draft.title;hideDialog('#editor');draft=null;reloadLibrary();toast(saved+' saved')};
$('#remove-game').onclick=()=>{$('#remove-message').textContent=draft.title;showDialog('#remove-dialog')};$('#cancel-remove').onclick=()=>hideDialog('#remove-dialog');$('#confirm-remove').onclick=()=>{if(native)native.remove(String(draft.id));else games=games.filter(g=>g.id!==draft.id);hideDialog('#remove-dialog');cancelEditor();reloadLibrary();toast('Removed from library')};
function appPicker(){closeMenu();$('#app-search').value='';$('#app-list').replaceChildren();$('#app-results').textContent='Loading installed apps…';showDialog('#app-picker');if(native)native.installed();else nativeEvent('installed',{apps:[{title:'Sample installed game',package:'sample.game',component:'sample.game/.MainActivity',isGame:true}]})}
$('#add-game').onclick=appPicker;$('#close-picker').onclick=()=>hideDialog('#app-picker');$('#app-search').oninput=renderApps;
function renderApps(){const q=normalize($('#app-search').value);const found=installedApps.filter(g=>normalize(g.title+' '+g.package).includes(q));$('#app-results').textContent=found.length+' installed apps';$('#app-list').replaceChildren(...found.slice(0,150).map(g=>{const b=el('button','installed-app');const im=el('img');im.src='icon/'+g.package;im.alt='';im.loading='lazy';const t=el('span','',g.title);t.append(el('small','',g.package));b.append(im,t);const existing=games.find(x=>x.package===g.package&&x.kind!=='shortcut');if(existing)b.append(el('span','already','In library'));b.onclick=()=>{hideDialog('#app-picker');if(existing){editGame(existing);return}editGame({id:'new_'+Date.now()+'_'+Math.floor(Math.random()*100000),title:g.title,genre:'Uncategorized',kind:'app',package:g.package,component:g.component,action:'android.intent.action.MAIN',image:'icon/'+g.package,lastPlayed:0},true)};return b}))}
$('#settings-button').onclick=()=>showDialog('#settings-dialog');$('#close-settings').onclick=()=>hideDialog('#settings-dialog');$('#export').onclick=()=>{hideDialog('#settings-dialog');if(native)native.backup()};$('#import').onclick=()=>{hideDialog('#settings-dialog');if(native)native.restore()};$('#add-shortcut').onclick=()=>{hideDialog('#settings-dialog');if(native)native.createShortcut()};
for(const d of document.querySelectorAll('dialog'))d.addEventListener('close',()=>{if(!document.querySelector('dialog[open]'))document.body.style.overflow=''})
window.nativeEvent=(event,data)=>{if(event==='ambientChanged'){refreshAmbient();return;}if(event==='homeStatus'){refreshHome();return;}if(event==='startupChanged'){refreshStartup();return;}if(appsEvent(event,data))return;if(event==='notice')toast(data.message);if(event==='installed'){installedApps=data.apps.sort((a,b)=>a.title.localeCompare(b.title));renderApps()}if(event==='cover'&&draft&&String(draft.id)===data.id){draft.image=data.image;draft.fallback=false;$('#edit-image').src=data.image}if(event==='newShortcut')editGame(data.game,true);if(event==='restored'){reloadLibrary();toast('Library restored')}if(event==='launched'){const g=games.find(g=>String(g.id)===data.id);if(g)g.lastPlayed=Date.now();if(presentation==='seattle')update()}};
window.onNativeResume=()=>{if(native?.drawerApps)native.drawerApps();if(!document.querySelector('dialog[open]')&&!editingField()&&lastTrigger&&document.contains(lastTrigger))lastTrigger.focus({preventScroll:true})};
window.nativeBack=()=>{effect('back');const ds=[...document.querySelectorAll('dialog[open]')];if(ds.length){const d=ds[ds.length-1];if(d.id==='editor')cancelEditor();else if(d.id==='detail')closeGame();else hideDialog('#'+d.id);return true}if(document.body.classList.contains('menu-open')){closeMenu();return true}if(document.activeElement===document.querySelector('#search')){$('#search').blur();return true}if(query||genre||favoritesOnly||presentation==='seattle'&&seattleBrowse){if(presentation==='seattle')seattleBrowse=false;reset();return true}return false};
let controllerGameId=null;
function controllerFocus(node,silent=false){
 if(!node)return;
 if(!silent&&document.activeElement!==node)effect('move');
 document.body.dataset.input='controller';
 node.focus({preventScroll:true});
 document.querySelectorAll('.controller-selected').forEach(e=>e.classList.remove('controller-selected'));
 const card=node.closest('.game');
 if(card){controllerGameId=card.dataset.id;card.classList.add('controller-selected')}
 if(presentation==='seattle'&&card)presentationId=card.dataset.id;
 if(presentation==='library'||presentation==='seattle'||node.closest('dialog'))node.scrollIntoView({block:'nearest',inline:'nearest'});
 else resetPresentationScroll();
 persist();
}
document.addEventListener('pointerdown',e=>{
 document.body.dataset.input=e.pointerType==='touch'?'touch':'pointer';
 document.querySelectorAll('.controller-selected').forEach(n=>n.classList.remove('controller-selected'));
 const card=e.target.closest('.game');if(card){controllerGameId=card.dataset.id;card.focus({preventScroll:true})}
});
function currentGame(){const b=document.activeElement?.closest('.game');return games.find(g=>String(g.id)===(b?.dataset.id||controllerGameId))}
function gridMove(startCard,action){
 if(presentation==='seattle'){seattleMove(startCard,action);return;}
 if(presentation==='tokyo'||presentation==='oxford'){
  if(action==='left'||action==='right'){controller(action==='left'?'genrePrev':'genreNext');return}
  movePresentation(({up:-1,down:1,pageUp:-presentationPageSize(),pageDown:presentationPageSize()}[action]||0),true);return;
 }

 if(presentation!=="library"){if(action==="up"){controllerFocus($("#category-current"));return}movePresentation(({left:-1,right:1,pageUp:-presentationPageSize(),pageDown:presentationPageSize()}[action]||0),true);return;}
 let cards=[...document.querySelectorAll('#grid .game')];
 let index=cards.indexOf(startCard);if(index<0)return;
 const firstTop=cards[0].offsetTop;
 const columns=cards.filter(e=>Math.abs(e.offsetTop-firstTop)<2).length||1;
 const nextRow=cards[columns];
 const rowHeight=nextRow?nextRow.offsetTop-firstTop:cards[0].offsetHeight+24;
 const pageRows=Math.max(1,Math.floor((innerHeight-$('.topbar').offsetHeight-24)/rowHeight));
 let target=index+({left:-1,right:1,up:-columns,down:columns,pageUp:-columns*pageRows,pageDown:columns*pageRows}[action]||0);
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
window.controller=action=>{document.querySelector('.skip')?.classList.remove('keyboard-access');stopCarouselMotion();
 const modal=[...document.querySelectorAll('dialog[open]')].pop();
 if(action==='apps'){if(modal?.id==='apps-drawer')hideDialog('#apps-drawer');else if(!modal)openApps();return;}
 if(modal?.id==='artwork-dialog'&&window.artworkController?.(action))return;
 if(modal?.id==='apps-drawer'&&appsController(action))return;
 if(!modal&&presentation==='vienna'&&!document.activeElement?.matches('input,textarea,select')&&viennaController(action))return;
 const directions={up:[0,-1],down:[0,1],left:[-1,0],right:[1,0]};
 // Android delivers these commands through JavaScript, so :focus-visible alone
 // cannot identify controller input. Keep its selection explicit.
 const hovered=presentation==='library'&&!modal&&document.body.dataset.input!=='controller'?document.querySelector('.game:hover'):null;
 if(hovered&&(directions[action]||action==='activate'||action==='edit'))controllerFocus(hovered);
 document.body.dataset.input='controller';
 if(action==='pageUp'||action==='pageDown'){
  effect('page');
  if(modal){modal.scrollBy({top:(action==='pageDown'?1:-1)*modal.clientHeight*.85,behavior:'instant'});return}
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
  if(modal)return;effect('page');stepSection(action==='genreNext'?1:-1);controllerFocus($('#grid .presentation-selected')||$('#grid .game')||(presentation==='seattle'?$('#seattle-home'):presentation!=='library'?$('#category-current'):document.querySelector('.genre.active')),true);return;
 }
 if(!modal&&presentation!=='library'&&document.activeElement?.closest('#category-strip')){if(action==='left'||action==='right'){controller(action==='left'?'genrePrev':'genreNext');controllerFocus($('#category-current'),true);return}if(action==='down'){controllerFocus($('#grid .presentation-selected'));return}}
 if(action==='activate'){
  if(document.activeElement===document.body){controllerFocus($('#grid .presentation-selected')||$('#grid .game'));return}
  document.activeElement?.click();return;
 }
 if(!directions[action])return;
 const field=document.activeElement;
 if(field?.type==='range'&&(action==='left'||action==='right')){if(!field.disabled){const step=Number(field.step)||1;field.value=Number(field.value)+(action==='right'?step:-step);field.dispatchEvent(new Event('input',{bubbles:true}))}return;}
 if(['INPUT','TEXTAREA'].includes(field?.tagName)&&(action==='left'||action==='right')){
  const p=Math.max(0,Math.min(field.value.length,(field.selectionStart||0)+(action==='right'?1:-1)));
  try{field.setSelectionRange(p,p)}catch{}return;
 }
 if(field?.tagName==='SELECT'&&(action==='left'||action==='right')){
  field.selectedIndex=Math.max(0,Math.min(field.options.length-1,field.selectedIndex+(action==='right'?1:-1)));
  field.dispatchEvent(new Event('change',{bubbles:true}));return;
 }
 const activeCard=!modal&&field?.closest('.game');
 if(activeCard){gridMove(activeCard,action);return}
 const root=modal||document;
 const all=[...root.querySelectorAll('button,input,select,summary,#artwork-preview-image')].filter(e=>!e.disabled&&e.getClientRects().length);
 if(!all.includes(field)){controllerFocus(modal?all[0]:($('#grid .presentation-selected')||$('#grid .game')));return}
 const r=field.getBoundingClientRect(),[dx,dy]=directions[action];const ax=r.left+r.width/2,ay=r.top+r.height/2;
 let best=null,score=Infinity;
 for(const candidate of all){
  if(candidate===field)continue;const b=candidate.getBoundingClientRect(),x=b.left+b.width/2-ax,y=b.top+b.height/2-ay,forward=dx*x+dy*y,cross=Math.abs(dx?y:x);
  if(forward<5)continue;const value=forward+cross*3;if(value<score){score=value;best=candidate}
 }
 controllerFocus(best);
};
window.addEventListener('scroll',()=>{clearTimeout(window.scrollTimer);window.scrollTimer=setTimeout(persist,180)},{passive:true});
window.addEventListener('beforeunload',persist);
$('#sound-enabled').onchange=e=>{soundEnabled=e.target.checked;persist();if(soundEnabled)effect('select')};
$('#palette').onchange=e=>{setPalette(e.target.value);effect('select')};
$('#art-fit').onchange=e=>{setArtFit(e.target.value);effect('select')};
document.addEventListener('click',e=>{const b=e.target.closest('button,.card-edit');if(!b||b.disabled||b.matches('.game'))return;if(b.id==='play-detail'||b.closest('#category-strip'))return;effect(/close|cancel|clear|reset/.test(b.id)?'back':b.dataset.genre!==undefined?'page':'select')},true);

let saved={};try{saved=native?JSON.parse(native.view()):{}}catch{}restoring=true;viennaKey=typeof saved.viennaKey==='string'?saved.viennaKey:'favorites';viennaPositions=saved.viennaPositions&&typeof saved.viennaPositions==='object'?saved.viennaPositions:{};initApps();initFavorites();initPresentation();presentation=['kyoto','cupertino','tokyo','seattle','vienna','oxford'].includes(saved.presentation)?saved.presentation:'library';presentationId=saved.presentationId||saved.focus||null;seattleBrowse=saved.seattleBrowse===true;document.body.dataset.presentation=presentation;$('#presentation').value=presentation;setPalette(saved.palette);soundEnabled=saved.soundEnabled!==false;$('#sound-enabled').checked=soundEnabled;setArtFit(saved.artFit);initAppearance(saved);refreshOxfordControls();rebuildGenres();favoritesOnly=saved.favoritesOnly===true;genre=favoritesOnly?'':genres.includes(saved.genre)?saved.genre:'';if(presentation==='vienna'){genre='';favoritesOnly=false;}query=saved.query||'';sort=['az','za','recent'].includes(saved.sort)?saved.sort:'az';size=['compact','comfortable','large'].includes(saved.size)?saved.size:'comfortable';visible=Math.max(72,Math.min(saved.visible||72,games.length));$('#search').value=query;$('#sort').value=sort;setSize(size);update();setTimeout(()=>{window.scrollTo(0,saved.scroll||0);if(saved.focus&&!editingField()){const selectedCard=document.querySelector('.game[data-id="'+saved.focus+'"]');if(selectedCard){controllerGameId=saved.focus;document.body.dataset.input='controller';selectedCard.classList.add('controller-selected');selectedCard.focus({preventScroll:true})}}restoring=false;focusStartupGame()},200);

function refreshStartup(){let v={enabled:true,sound:true,custom:false};try{if(native?.startupSettings)v=JSON.parse(native.startupSettings())}catch{}$('#startup-enabled').checked=v.enabled;$('#startup-sound').checked=v.sound;$('#startup-name').textContent=v.custom?'Custom video':'Wayfinder default · 6 seconds';$('#startup-reset').disabled=!v.custom;}
$('#startup-enabled').onchange=$('#startup-sound').onchange=()=>native?.configureStartup?.($('#startup-enabled').checked,$('#startup-sound').checked);
$('#startup-choose').onclick=()=>native?.chooseStartup?.();$('#startup-preview').onclick=()=>native?.previewStartup?.();$('#startup-reset').onclick=()=>native?.resetStartup?.();refreshStartup();

function refreshHome(){const isHome=native?.isDefaultLauncher?.()===true;$('#home-status').textContent=isHome?'Wayfinder is your default home app.':'Use Wayfinder when you press Home.';$('#set-default-launcher').textContent=isHome?'Change default launcher':'Set as default launcher';}
$('#set-default-launcher').onclick=()=>native?.chooseDefaultLauncher?.();refreshHome();

window.addEventListener('keydown',e=>{if(e.key==='Tab')document.querySelector('.skip')?.classList.add('keyboard-access')},true);
window.addEventListener('pointerdown',()=>document.querySelector('.skip')?.classList.remove('keyboard-access'),true);

function editingField(){return document.activeElement?.matches('input,textarea,select,[contenteditable=true]')}
function focusStartupGame(){
 if(document.querySelector('dialog[open]')||editingField())return;
 const target=$('#grid .presentation-selected')||$('#grid .controller-selected')||document.activeElement?.closest('#grid .game')||$('#grid .game');
 if(!target&&presentation==='vienna'){$('.vienna-heading')?.focus({preventScroll:true});return;}
 if(!target){$('#search').focus({preventScroll:true});return;}
 document.querySelectorAll('.controller-selected').forEach(e=>e.classList.remove('controller-selected'));
 controllerGameId=target.dataset.id;document.body.dataset.input='controller';target.classList.add('controller-selected');target.focus({preventScroll:true});
}
window.focusStartupGame=focusStartupGame;

$('#category-options').onchange=e=>{if(e.target.value)$('#edit-genre').value=e.target.value;};
$('#edit-genre').oninput=e=>{$('#category-options').value=genres.includes(e.target.value)?e.target.value:'';};

function refreshAmbient(){let v={enabled:false,volume:20,custom:false,name:''};try{if(native?.ambientSettings)v=JSON.parse(native.ambientSettings())}catch{}$('#ambient-enabled').checked=v.enabled;$('#ambient-enabled').disabled=!v.custom;$('#ambient-name').textContent=v.custom?v.name:'No audio selected';$('#ambient-volume').value=v.volume;$('#ambient-volume-value').textContent=v.volume+'%';$('#ambient-clear').disabled=!v.custom;}
function configureAmbient(){const volume=Number($('#ambient-volume').value);$('#ambient-volume-value').textContent=volume+'%';native?.configureAmbient?.($('#ambient-enabled').checked,volume)}
$('#ambient-enabled').onchange=configureAmbient;$('#ambient-volume').oninput=configureAmbient;$('#ambient-volume').onchange=configureAmbient;
$('#ambient-choose').onclick=()=>native?.chooseAmbient?.();$('#ambient-clear').onclick=()=>native?.clearAmbient?.();refreshAmbient();
