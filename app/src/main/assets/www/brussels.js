// A notebook index: eight text rows and a single portrait cover, regardless of library size.
let brusselsOptions={strength:58,background:'rotate',density:6,sceneryColor:'original',coverColor:'original'};
let brusselsPane='games',brusselsPageKey='',brusselsStartupFocusPending=false;
// A repeatable angle per game keeps the tape from jumping on redraw or restart.
function brusselsTapeAngle(id){
 let hash=2166136261;for(const c of String(id||''))hash=Math.imul(hash^c.charCodeAt(0),16777619);
 return ((hash>>>0)%241/10-12).toFixed(1)+'deg';
}
function brusselsFocus(){
 const target=brusselsPane==='tabs'?$('#brussels-tabs .current'):$('#grid .presentation-selected')||$('#grid .show-all-matches')||$('#brussels-tabs .current');
 controllerFocus(target,true);if(brusselsPane==='tabs'&&target)revealCategoryItem(target.parentElement,target,true);
 document.body.dataset.brusselsPane=brusselsPane;
}
function brusselsOpen(index){const s=sections()[index];if(!s)return;favoritesOnly=s.favorite;setGenre(s.genre,true);persist();}
function brusselsSelect(index,focus=true){const g=filtered[Math.max(0,Math.min(filtered.length-1,index))];presentationId=g?.id||null;controllerGameId=presentationId;renderBrussels();syncSearchFeedback();if(focus)brusselsFocus();queueCarouselSave();}
function sizeBrusselsCover(){
 if(presentation!=='brussels')return;const panel=$('#brussels-art'),width=Math.max(0,Math.min(panel.clientWidth-32,(panel.clientHeight-42)/1.5));
 const grid=$('#grid'),main=$('#main');main.style.setProperty('--brussels-rule-step',Math.max(1,(grid.clientHeight-12)/8)+'px');main.style.setProperty('--brussels-rule-start',(grid.offsetTop)+'px');
 Object.assign($('#brussels-cover').style,{width:width+'px',height:width*1.5+'px'});syncBrusselsMarquee();
}
function syncBrusselsCover(){if(presentation!=='brussels')return;const img=$('#brussels-cover');if(backdrop==='gradient')$('#soft-gradient').style.setProperty('--backdrop-rgb',coverColor(img)||'145,113,72');}
let brusselsSceneKey=null,brusselsScene=-1;
function renderBrussels(){
 const sceneKey=JSON.stringify([genre,favoritesOnly]);if(sceneKey!==brusselsSceneKey){brusselsSceneKey=sceneKey;brusselsScene=(brusselsScene+1)%15;}
 syncBrusselsOptions();const tabs=$('#brussels-tabs'),list=sections(),signature=JSON.stringify(list.map(s=>[s.label,searchSummary?searchSectionCount(s.favorite?'favorites':s.genre?'genre:'+s.genre:'all',0):null]));
 if(tabs.dataset.signature!==signature){tabs.dataset.signature=signature;tabs.replaceChildren(...list.map((s,i)=>{
  const b=el('button','brussels-tab'),clip=el('span','brussels-tab-clip'),label=el('span','brussels-tab-label',s.label.replace('★ ',''));clip.append(label);b.append(clip);b.title=s.label;
  if(searchSummary){const n=searchSectionCount(s.favorite?'favorites':s.genre?'genre:'+s.genre:'all',0);b.append(el('small','',String(n)));b.classList.toggle('search-no-match',!n);}
  b.onclick=()=>{brusselsPane='tabs';brusselsOpen(i);brusselsFocus()};b.onfocus=()=>{brusselsPane='tabs';document.body.dataset.brusselsPane=brusselsPane};return b;
 }));}
 [...tabs.children].forEach((b,i)=>{const on=i===sectionIndex();b.classList.toggle('current',on);b.setAttribute('aria-pressed',String(on));b.tabIndex=on?0:-1});revealCategoryItem(tabs,tabs.querySelector('.current'),true);
 $('#brussels-category').textContent=sectionLabel().replace('★ ','');$('#brussels-count').textContent=filtered.length.toLocaleString()+' '+(filtered.length===1?'game':'games')+(query?' found':'');
 let index=Math.max(0,filtered.findIndex(g=>g.id===presentationId));const game=filtered[index];presentationId=game?.id||null;controllerGameId=presentationId;
 const page=Math.floor(index/brusselsOptions.density),items=filtered.slice(page*brusselsOptions.density,page*brusselsOptions.density+brusselsOptions.density),grid=$('#grid'),key=JSON.stringify([page,query,items.map(g=>[g.id,g.title,!!g.favorite])]);
 if(key!==brusselsPageKey||!grid.querySelector('.brussels-row')){brusselsPageKey=key;grid.replaceChildren(...items.map((g,i)=>{
  const b=el('button','game brussels-row');b.dataset.id=g.id;b.append(el('span','game-title',g.title));syncFavoriteCard(b,g);if(!g.favorite){const star=el('span','brussels-unstar','☆');star.setAttribute('aria-hidden','true');b.append(star)}b.title=g.title;
  b.onclick=()=>{brusselsPane='games';brusselsSelect(page*brusselsOptions.density+i)};
  b.onfocus=()=>{brusselsPane='games';document.body.dataset.brusselsPane=brusselsPane;if(presentationId!==g.id)brusselsSelect(page*brusselsOptions.density+i,false)};
  b.ondblclick=()=>play(g.id,b);b.oncontextmenu=e=>{e.preventDefault();brusselsSelect(page*brusselsOptions.density+i,false);editGame(g)};return b;
 }));if(!game)grid.append(el('p','brussels-empty',query?'No matching titles.':!games.length?'Your notebook is empty. Choose Add game to begin.':favoritesOnly?'No favorites yet.':'No games in this category.'));}
 for(const row of grid.querySelectorAll('.game')){const on=row.dataset.id===presentationId;row.classList.toggle('presentation-selected',on);row.classList.remove('controller-selected');row.tabIndex=on?0:-1;row.setAttribute('aria-label','Select '+row.title+(on?' · Selected':''));}
 const img=$('#brussels-cover');img.hidden=!game;$('#brussels-print').hidden=!game;
 $('#brussels-print').style.setProperty('--brussels-tape-angle',brusselsTapeAngle(game?.id));
 if(game){if(img.getAttribute('src')!==game.image)img.src=game.image;img.alt=game.title+' cover';}else{img.removeAttribute('src');img.alt='';}
 $('#brussels-title').textContent=game?.title||'';$('#brussels-type').textContent=game?(game.intentUri?'Shortcut':game.kind==='app'?'Android game':'Game'):'';
 $('#brussels-position').textContent=game?`${index+1} / ${filtered.length}`:'0 / 0';
 $('#brussels-prev').disabled=!game||index===0;$('#brussels-next').disabled=!game||index===filtered.length-1;
 for(const b of document.querySelectorAll('[data-brussels-game]'))b.disabled=!game;
 $('#empty').hidden=true;$('#load').hidden=true;sizeBrusselsCover();syncBrusselsCover();document.body.dataset.brusselsPane=brusselsPane;
}
function brusselsBack(){if(document.activeElement===$('#search'))native?.hideKeyboard?.();if(document.activeElement===$('#search')&&!query){$('#search').blur();brusselsFocus();return true;}if(query){query='';$('#search').value='';$('#search').blur();update();brusselsFocus();persist();return true;}if(brusselsPane==='games'){brusselsPane='tabs';brusselsFocus();return true;}return false;}
function brusselsController(action){
 if(['search','menu','apps'].includes(action))return false;
 if(action==='back'){brusselsBack();return true;}
 const active=document.activeElement;
 if(active?.matches('input,textarea,select')){if(['down','activate'].includes(action)){active.blur();native?.hideKeyboard?.();brusselsPane='games';brusselsFocus();return true;}return false;}
 if(action==='activate'&&active?.matches('.show-all-matches')){active.click();return true;}
 if(action==='activate'&&active?.matches('button')&&!active.closest('#grid,#brussels-tabs')){active.click();return true;}

 if(action==='genrePrev'||action==='genreNext'){brusselsOpen((sectionIndex()+(action==='genreNext'?1:-1)+sections().length)%sections().length);brusselsFocus();return true;}
 if(brusselsPane==='tabs'){
  if(action==='left'||action==='right'){brusselsOpen((sectionIndex()+(action==='right'?1:-1)+sections().length)%sections().length);brusselsFocus();return true;}
  if(action==='down'||action==='activate'){brusselsPane='games';brusselsFocus();return true;}
  if(action==='up'){openControllerHeader();return true;}
 }
 const index=Math.max(0,filtered.findIndex(g=>g.id===presentationId));
 if(action==='up'&&index===0){brusselsPane='tabs';brusselsFocus();return true;}
 const delta={up:-1,down:1,left:-brusselsOptions.density,right:brusselsOptions.density,pageUp:-brusselsOptions.density,pageDown:brusselsOptions.density}[action];
 if(delta!==undefined){brusselsPane='games';brusselsSelect(index+delta);return true;}
 const g=filtered.find(g=>g.id===presentationId);
 if(['activate','edit','favorite'].includes(action)){if(g){if(action==='activate')play(g.id,$('#grid .presentation-selected'));else if(action==='edit')editGame(g);else{toggleFavorite(g.id);brusselsFocus();}}return true;}return false;
}
function initBrussels(){
 initBrusselsOptions();
 const main=$('#main'),tabs=el('nav','brussels-part');tabs.id='brussels-tabs';tabs.setAttribute('aria-label','Categories');
 const heading=el('header','brussels-part');heading.id='brussels-heading';const category=el('h1');category.id='brussels-category';const count=el('p');count.id='brussels-count';heading.append(category,count);
 const art=el('div','brussels-part');art.id='brussels-art';const print=el('div');print.id='brussels-print';const img=el('img');img.id='brussels-cover';print.append(img);art.append(print);img.onload=syncBrusselsCover;
 const caption=el('div','brussels-part');caption.id='brussels-caption';const title=el('h2');title.id='brussels-title';const type=el('p');type.id='brussels-type';caption.append(title,type);
 const footer=el('nav','brussels-part');footer.id='brussels-footer';footer.setAttribute('aria-label','Game controls');
 for(const [key,label,action] of [['A','Open','activate'],['B','Back','back'],['X','Edit','edit'],['Y','Search','search']]){const b=el('button','brussels-hint');b.setAttribute('aria-label',label);b.append(el('b','brussels-key '+key.toLowerCase(),key),el('span','',label));b.onclick=()=>{brusselsFocus();brusselsController(action)||controller(action)};if(['activate','edit'].includes(action))b.dataset.brusselsGame='true';footer.append(b);}
 footer.append(el('small','brussels-page-help','LB/RB Categories · LT/RT Pages'));
 for(const [id,label,delta] of [['prev','Previous page',-8],['next','Next page',8]]){const b=el('button','brussels-page',delta<0?'‹':'›');b.id='brussels-'+id;b.setAttribute('aria-label',label);b.onclick=()=>{brusselsPane='games';brusselsSelect(Math.max(0,filtered.findIndex(g=>g.id===presentationId))+delta)};footer.append(b);}
 const pos=el('span');pos.id='brussels-position';footer.append(pos);main.append(tabs,heading,art,caption,footer);const group=el('div','brussels-shoulders');for(const [label,delta] of [['LB',-1],['Categories',0],['RB',1]]){const b=el(delta?'button':'span','',label);if(delta){b.setAttribute('aria-label',delta<0?'Previous category':'Next category');b.onclick=()=>{brusselsOpen((sectionIndex()+delta+sections().length)%sections().length);brusselsFocus()}}group.append(b)}footer.append(group);new ResizeObserver(sizeBrusselsCover).observe(art);new ResizeObserver(syncBrusselsMarquee).observe(tabs);document.fonts.ready.then(syncBrusselsMarquee);
}

function syncBrusselsMarquee(){
 for(const b of document.querySelectorAll('#brussels-tabs .brussels-tab')){
 const clip=b.querySelector('.brussels-tab-clip'),label=b.querySelector('.brussels-tab-label');if(!clip||!label)continue;
 const distance=Math.max(0,label.scrollWidth-clip.clientWidth),active=presentation==='brussels'&&b.classList.contains('current')&&distance>1;
 b.classList.toggle('marquee',active);b.style.setProperty('--marquee-distance',(-distance)+'px');b.style.setProperty('--marquee-duration',Math.max(6,distance/24+3)+'s');
 }
}

const brusselsSceneNames=['City rooftops','Forest ruins','Desert highway','Harbor','Snowy village','Spaceport','Tropical coast','Industrial district','Crystal cavern','Alpine pass','Rainy street','Jungle temple','Lighthouse','Farmland','Science complex'];
function brusselsColorFilter(value){return {original:'none',muted:'saturate(.4)',grayscale:'grayscale(1)',sepia:'sepia(.85)'}[value]||'none'}
function setBrusselsOptions(value={},save=true){
 const v=value&&typeof value==='object'?value:{};
 brusselsOptions={strength:Number.isFinite(Number(v.strength))?Math.max(0,Math.min(100,Number(v.strength))):58,background:['rotate','halftone',...brusselsSceneNames.map((_,i)=>String(i))].includes(v.background)?v.background:'rotate',density:[5,6,8].includes(Number(v.density))?Number(v.density):6,sceneryColor:['original','muted','grayscale','sepia'].includes(v.sceneryColor)?v.sceneryColor:'original',coverColor:['original','muted','grayscale','sepia'].includes(v.coverColor)?v.coverColor:'original'};
 for(const key of Object.keys(brusselsOptions)){const input=$('#brussels-'+key);if(input)input.value=String(brusselsOptions[key]);}
 $('#brussels-strength-value').textContent=brusselsOptions.strength+'%';syncBrusselsOptions();
 if(presentation==='brussels'){brusselsPageKey='';renderBrussels();updateAppearancePreview();}if(save)persist();
}
function syncBrusselsOptions(){
 const art=$('#brussels-art');if(!art)return;
 const n=brusselsOptions.background==='rotate'?Math.max(0,brusselsScene):Number(brusselsOptions.background);
 art.style.backgroundImage='none';art.style.setProperty('--comic-scene',brusselsOptions.background==='halftone'?"radial-gradient(#236a9a 1px,transparent 1.5px)":"url('comic-scenes/"+String(n+1).padStart(2,'0')+".webp')");
 art.style.setProperty('--comic-scene-size',brusselsOptions.background==='halftone'?'6px 6px':'cover');
 art.style.setProperty('--comic-strength',brusselsOptions.strength/100);art.style.setProperty('--comic-scene-filter',brusselsColorFilter(brusselsOptions.sceneryColor));
 $('#brussels-cover').style.filter=brusselsColorFilter(brusselsOptions.coverColor);$('#grid').style.setProperty('--comic-rows',brusselsOptions.density);
}
function initBrusselsOptions(){
 const group=el('div');group.id='brussels-options';group.hidden=true;
 for(const [key,title,choices] of [['strength','Scenery strength',null],['background','Background selection',[['rotate','Rotate on category change'],['halftone','Plain halftone'],...brusselsSceneNames.map((s,i)=>[String(i),s])]],['density','List density',[['5','5 games'],['6','6 games'],['8','8 games']]],['sceneryColor','Scenery colors',[['original','Original'],['muted','Muted'],['grayscale','Grayscale'],['sepia','Sepia']]],['coverColor','Cover colors',[['original','Original'],['muted','Muted'],['grayscale','Grayscale'],['sepia','Sepia']]]]){
 const row=el('div','settings-row'),label=el('label','',title);label.htmlFor='brussels-'+key;const input=el(choices?'select':'input');input.id='brussels-'+key;input.setAttribute('aria-label',title);
 if(choices)for(const [value,text] of choices){const option=el('option','',text);option.value=value;input.append(option)}else{input.type='range';input.min='0';input.max='100';input.step='1';const out=el('span');out.id='brussels-strength-value';label.append(out)}
 input.value=String(brusselsOptions[key]);input[choices?'onchange':'oninput']=()=>setBrusselsOptions({...brusselsOptions,[key]:input.value});row.append(label,input);group.append(row);
 }
 $('#bend-options').after(group);
}

