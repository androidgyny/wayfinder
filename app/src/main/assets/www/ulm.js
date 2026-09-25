// Ulm uses text rows; only the optional selected cover is loaded.
let ulmArtwork=false,ulmLevel='categories',ulmSection='all',ulmPositions={},ulmCategoryKey='all',ulmSearchOpen=false;
let ulmRendered=null,ulmRows=new Map();
function ulmSections(){return [{key:'favorites',label:'Favorites',count:games.filter(g=>g.favorite).length},{key:'recent',label:'Recently played',count:games.filter(g=>g.lastPlayed>0).length},{key:'all',label:'All games',count:games.length},...genres.map(g=>({key:'genre:'+g,label:g,count:counts[g]||0}))].map(s=>({...s,count:searchSectionCount(s.key,s.count)}))}
function ulmApplyFilter(){
 if(presentation!=='ulm')return;
 if(!ulmSections().some(s=>s.key===ulmSection))ulmSection='all';
 genre=ulmLevel==='games'&&ulmSection.startsWith('genre:')?ulmSection.slice(6):'';favoritesOnly=ulmLevel==='games'&&ulmSection==='favorites';
}
function setUlmArtwork(value,save=true){ulmArtwork=value===true;document.body.dataset.ulmArtwork=String(ulmArtwork);$('#ulm-artwork').value=ulmArtwork?'on':'off';refreshApplicableAppearanceControls();if(presentation==='ulm')ulmPreview();if(save)persist();}
function ulmPreview(){
 const g=ulmLevel==='games'?filtered.find(g=>g.id===presentationId):null,img=$('#ulm-cover');
 $('#ulm-preview').hidden=!(ulmArtwork&&g);document.body.dataset.ulmPreview=String(!!(ulmArtwork&&g));
 if(ulmArtwork&&g){if(img.getAttribute('src')!==g.image)img.src=g.image;img.alt=g.title+' cover';}else{img.removeAttribute('src');img.alt='';}
 sizeUlmCover();syncUlmCoverAppearance();
}
function ulmFocus(buffer=false){
 const grid=$('#grid'),row=grid.querySelector('.ulm-selected');
 if(!row){($('#grid .show-all-matches')||$('#ulm-back')).focus({preventScroll:true});return;}
 row.focus({preventScroll:true});
 if(!buffer){row.scrollIntoView({block:'nearest',inline:'nearest',behavior:'instant'});return;}
 // Keep two neighboring rows visible during controller navigation. On short
 // screens reduce the buffer so the selected row always fits; never add space.
 const height=row.offsetHeight,margin=Math.max(0,Math.min(height*2,(grid.clientHeight-height)/2));
 const top=row.offsetTop,bottom=top+height;
 let target=grid.scrollTop;
 if(top<target+margin)target=top-margin;
 else if(bottom>target+grid.clientHeight-margin)target=bottom-grid.clientHeight+margin;
 grid.scrollTop=Math.max(0,Math.min(grid.scrollHeight-grid.clientHeight,target));
}
function ulmSelect(id,focus=false){
 const old=$('#grid .ulm-selected');const row=ulmRows.get(id);
 if(old!==row){old?.classList.remove('ulm-selected','presentation-selected');if(old)old.tabIndex=-1;row?.classList.add('ulm-selected');if(row)row.tabIndex=0;}
 if(ulmLevel==='games'){
  presentationId=id;controllerGameId=id;ulmPositions[ulmSection]=id;rememberCategoryIndex(filtered,id,'ulm:'+ulmSection);row?.classList.add('presentation-selected');
  const i=filtered.findIndex(g=>g.id===id);$('#ulm-position').textContent=filtered.length?`${i+1} / ${filtered.length.toLocaleString()}`:'0 / 0';
 }else{ulmCategoryKey=id;const list=ulmSections();$('#ulm-position').textContent=`${Math.max(0,list.findIndex(s=>s.key===id))+1} / ${list.length}`;}
 ulmPreview();if(focus)ulmFocus(true);queueCarouselSave();
}
function ulmOpen(key,focus=true){ulmSection=key;ulmCategoryKey=key;ulmLevel='games';ulmSearchOpen=!!query;presentationId=ulmPositions[key]||null;update();if(focus)ulmFocus();persist();}
function ulmBack(){
 if(query||ulmSearchOpen){query='';$('#search').value='';$('#ulm-search').value='';ulmSearchOpen=false;$('#ulm-search').blur();update();ulmFocus();persist();return true;}
 if(ulmLevel==='games'){ulmLevel='categories';update();ulmFocus();persist();return true;}
 return false;
}
function ulmSearch(){if(ulmLevel==='categories')ulmOpen('all',false);ulmSearchOpen=true;$('#ulm-search').hidden=false;$('#ulm-search').focus({preventScroll:true});native?.showKeyboard?.();}
function ulmMove(delta){const list=ulmLevel==='categories'?ulmSections().map(s=>s.key):filtered.map(g=>g.id);if(!list.length)return;const id=ulmLevel==='categories'?ulmCategoryKey:presentationId;const i=Math.max(0,list.indexOf(id)),n=Math.max(0,Math.min(list.length-1,i+delta));if(n!==i)effect(Math.abs(delta)>1?'page':'move');ulmSelect(list[n],true);}
function renderUlm(){
 const grid=$('#grid'),category=ulmLevel==='categories',list=ulmSections();
 $('#ulm-heading').textContent=category?'Categories':list.find(s=>s.key===ulmSection)?.label||'All games';
 $('#ulm-back').hidden=category&&!query&&!ulmSearchOpen;$('#ulm-search').hidden=!ulmSearchOpen&&!query;if(document.activeElement!==$('#ulm-search'))$('#ulm-search').value=query;
 renderUlmHints(category);
 const signature=category?JSON.stringify(list):filtered;
 if(ulmRendered!==signature||grid.firstElementChild?.dataset.ulmLevel!==ulmLevel){
  ulmRendered=signature;ulmRows=new Map();const frag=document.createDocumentFragment();
  if(category){for(const section of list){const b=el('button','ulm-row ulm-category');b.dataset.ulmLevel=ulmLevel;b.append(el('span','ulm-title',section.label),el('span','ulm-count',section.count.toLocaleString()));b.onclick=()=>ulmOpen(section.key);b.tabIndex=-1;ulmRows.set(section.key,b);frag.append(b);}}
  else for(const g of filtered){const b=el('button','game ulm-row');b.dataset.id=g.id;b.dataset.ulmLevel=ulmLevel;b.append(el('span','game-title',g.title));syncFavoriteCard(b,g);b.tabIndex=-1;
   b.onclick=()=>{ulmSelect(g.id);play(g.id,b)};
   b.oncontextmenu=e=>{e.preventDefault();ulmSelect(g.id);openGame(g.id,b)};
   b.onfocus=()=>{if(presentationId!==g.id)ulmSelect(g.id)};
   ulmRows.set(g.id,b);frag.append(b);
  }
  grid.replaceChildren(frag);
  if(!category&&!filtered.length){const msg=el('p','ulm-empty',query?'No matching titles.':ulmSection==='favorites'?'No favorites yet.':ulmSection==='recent'?'No recently played games.':'No games in this category.');grid.append(msg);}
 }
 const id=category?(list.some(s=>s.key===ulmCategoryKey)?ulmCategoryKey:'all'):(filtered.some(g=>g.id===presentationId)?presentationId:filtered.some(g=>g.id===ulmPositions[ulmSection])?ulmPositions[ulmSection]:rememberedCategoryGame(filtered,ulmPositions[ulmSection],'ulm:'+ulmSection)?.id||null);
 ulmSelect(id);revealCategoryItem(grid,ulmRows.get(id));$('#load').hidden=true;$('#empty').hidden=true;
}
function ulmController(action){
 document.body.dataset.input='controller';
 if(action==='back'){if(!ulmBack())toast('Press Android Back to leave the library');return true;}
 if(action==='search'){ulmSearch();return true;}
 if(action==='menu'){showDialog('#ulm-menu');return true;}
 if(document.activeElement===$('#ulm-search')){if(action==='down'||action==='activate'){$('#ulm-search').blur();ulmFocus();return true;}return false;}
 if(action==='up'||action==='down'){ulmMove(action==='down'?1:-1);return true;}
 if(action==='pageUp'||action==='pageDown'){const row=$('#grid .ulm-row'),page=Math.max(1,Math.floor($('#grid').clientHeight/(row?.offsetHeight||56))-1);ulmMove((action==='pageDown'?1:-1)*page);return true;}
 if(action==='left'){ulmBack();return true;}
 if(action==='genreNext'||action==='genrePrev'){const list=ulmSections(),i=Math.max(0,list.findIndex(s=>s.key===(ulmLevel==='games'?ulmSection:ulmCategoryKey)));const next=list[(i+(action==='genreNext'?1:-1)+list.length)%list.length];if(ulmLevel==='games')ulmOpen(next.key);else ulmSelect(next.key,true);effect('page');return true;}
 if(action==='activate'||action==='right'){if(ulmLevel==='categories')ulmOpen(ulmCategoryKey);else if(action==='activate'&&presentationId)play(presentationId,ulmRows.get(presentationId));return true;}
 if(action==='edit'){if(ulmLevel==='games'){const g=filtered.find(g=>g.id===presentationId);if(g)editGame(g);}return true;}
 if(action==='favorite'){if(ulmLevel==='games'&&presentationId){toggleFavorite(presentationId);ulmFocus();}return true;}
 return false;
}
function initUlm(){
 new ResizeObserver(sizeUlmCover).observe($('#ulm-preview'));

 $('#ulm-cover').addEventListener('load',syncUlmCoverAppearance);

 $('#ulm-back').onclick=()=>ulmBack();$('#ulm-search-button').onclick=ulmSearch;$('#ulm-menu-button').onclick=()=>showDialog('#ulm-menu');$('#ulm-apps-button').onclick=openApps;
 $('#ulm-search').oninput=e=>{query=e.target.value;$('#search').value=query;update();persist();};
 $('#ulm-artwork').onchange=e=>setUlmArtwork(e.target.value==='on');
 $('#ulm-menu-close').onclick=()=>hideDialog('#ulm-menu');$('#ulm-menu-settings').onclick=()=>{hideDialog('#ulm-menu');showDialog('#settings-dialog')};$('#ulm-menu-apps').onclick=()=>{hideDialog('#ulm-menu');openApps()};
}

function renderUlmHints(category){
 const hints=$('#ulm-hints'),level=category?'categories':'games';
 if(hints.dataset.level===level)return;
 hints.dataset.level=level;hints.setAttribute('aria-label','Controller shortcuts');
 const items=category?[['A','Open'],['B','Back'],['Y','Search'],['START','Menu']]:[['A','Play'],['B','Categories'],['X','Edit'],['SELECT','Favorite'],['LT / RT','Jump']];
 hints.replaceChildren(...items.map(([key,label])=>{
  const hint=el('span','ulm-hint'),badge=el('span','ulm-key'+(key.length===1?' ulm-key-round':''),key);
  hint.append(badge,el('span','ulm-hint-label',label));return hint;
 }));
}

function syncUlmCoverAppearance(){
 const img=$('#ulm-cover');
 const color=ulmArtwork&&img.hasAttribute('src')&&img.complete&&img.naturalWidth?coverColor(img):null;
 if(color)img.style.setProperty('--cover-glow-rgb',color);else img.style.removeProperty('--cover-glow-rgb');
 if(backdrop==='gradient'){const layer=$('#soft-gradient'),rgb=color||'128,128,128';if(layer.style.getPropertyValue('--backdrop-rgb')!==rgb)layer.style.setProperty('--backdrop-rgb',rgb);if($('#settings-dialog').open)$('#appearance-preview').style.setProperty('--backdrop-rgb',rgb);}

}

function sizeUlmCover(){
 if(presentation!=='ulm'||!ulmArtwork||$('#ulm-preview').hidden)return;
 const panel=$('#ulm-preview'),width=Math.max(0,Math.floor(Math.min(panel.clientWidth-24,(panel.clientHeight-24)/1.5)));
 $('#ulm-cover').style.width=width+'px';$('#ulm-cover').style.height=width*1.5+'px';
}
