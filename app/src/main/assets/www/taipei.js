
const taipeiPalettes={
 gameboy:['#8DB401','#1E4809','#43620A'],mono:['#111111','#F2F2F2','#B8B8B8'],
 amber:['#2A1C12','#FFE2A3','#EAA95C'],ice:['#D9ECF1','#173947','#3C7182'],
 indigo:["#202647", "#EDF0FF", "#ABB8FA"],
 seaglass:["#C7E5DA", "#153D35", "#387160"],
 mulberry:["#44243B", "#FFE7F3", "#E8ACCA"],
 terracotta:["#F1C6AE", "#47271E", "#854A35"],
 midnightteal:["#112F36", "#DEF8F2", "#80C9BE"],
 parchment:["#F0E4C8", "#413527", "#776347"]
};
const taipeiSurfaces={oled:'#000000',dark:'#121212'};
const taipeiAccents={
 yellow:["#FFB300", "#000000"],
 purple:["#9C27B0", "#FFFFFF"],
 red:["#D32F2F", "#FFFFFF"],
 blue:["#1E88E5", "#000000"],
 pink:["#C2185B", "#FFFFFF"],
 bluegrey:["#546E7A", "#FFFFFF"],
 grey:["#BDBDBD", "#000000"],
 green:["#00897B", "#000000"],
 supergreen:["#00FF00", "#000000"]
};
const taipeiFonts={space:'SpaceGrotesk',outfit:'Outfit',oswald:'Oswald',plex:'IBMPlexSans'};
let taipeiOptions={surface:'oled',accent:'yellow',palette:'gameboy',font:'space',gridBackdrop:'flat',gridColor:'original',gridDim:60},taipeiCategory='all',taipeiShelf=false,taipeiTrack=null;
const taipeiPlaces=new Map(),taipeiAssignments=new Map();
function setTaipeiOptions(value,save=true){
 const palette=Object.hasOwn(taipeiPalettes,value?.palette)?value.palette:'gameboy';
 const font=Object.hasOwn(taipeiFonts,value?.font)?value.font:'space';
 const gridSelect=$('#taipei-gridBackdrop');
 const gridBackdrop=Array.from(gridSelect.options).some(o=>o.value===value?.gridBackdrop)?value.gridBackdrop:'flat';
 gridSelect.value=gridBackdrop;
 const gridColor=['original','muted','palette'].includes(value?.gridColor)?value.gridColor:backgroundColor;
 const gridDim=Math.max(0,Math.min(100,Number.isFinite(value?.gridDim)?value.gridDim:backgroundDim));
 const surface=Object.hasOwn(taipeiSurfaces,value?.surface)?value.surface:'oled';
 const accent=Object.hasOwn(taipeiAccents,value?.accent)?value.accent:'yellow';
 taipeiOptions={palette,font,surface,accent,gridBackdrop,gridColor,gridDim};
 $('#taipei-surface').value=surface;
 $('#taipei-accent').value=accent;
 document.body.style.setProperty('--taipei-grid-surface',taipeiSurfaces[surface]);
 document.body.style.setProperty('--taipei-logo',taipeiAccents[accent][0]);
 document.body.style.setProperty('--taipei-logo-ink',taipeiAccents[accent][1]);
 $('#taipei-gridColor').value=gridColor;$('#taipei-gridDim').value=gridDim;
 $('#taipei-gridDim-value').textContent=gridDim+'%';
 const colors=taipeiPalettes[palette];
 document.body.style.setProperty('--taipei-toolbar-text',palette==='gameboy'||palette==='ice'?'#000000':colors[1]);
 for(const [i,key] of ['paper','title','ink'].entries())document.body.style.setProperty('--taipei-'+key,colors[i]);
 document.body.style.setProperty('--taipei-font',taipeiFonts[font]);
 const tint='Tint with '+$('#taipei-palette option[value='+palette+']').textContent+' colors';
 $('#taipei-gridColor option[value=palette]').textContent=tint;
 $('#taipei-font').value=font;$('#taipei-palette').value=palette;
 if(presentation==='taipei'){$('#background-color option[value=palette]').textContent=tint;updateBackgroundPalette();syncCustomBackground();syncSystemBarColor();}
 if(save)persist();
}
function taipeiNames(){return ['all','favorites',...genres.map(name=>'genre:'+name)];}
function taipeiLabel(key=taipeiCategory){return key==='all'?'All Games':key==='favorites'?'Favorites':key.slice(6);}
function taipeiKey(){return taipeiCategory;}
function taipeiState(){return {category:taipeiCategory,shelf:taipeiShelf,places:[...taipeiPlaces],art:[...taipeiAssignments]};}
function taipeiRestore(value){
 taipeiCategory=typeof value?.category==='string'?value.category:'all';taipeiShelf=value?.shelf===true;
 taipeiAssignments.clear();
 for(const pair of Array.isArray(value?.art)?value.art:[]){
  if(Array.isArray(pair)&&typeof pair[0]==='string'&&taipeiMasks.includes(pair[1]))taipeiAssignments.set(pair[0],pair[1]);
 }
 taipeiPlaces.clear();
 for(const pair of Array.isArray(value?.places)?value.places:[])if(Array.isArray(pair)&&pair.length===2&&pair.every(v=>typeof v==='string'))taipeiPlaces.set(...pair);
}
function taipeiFilters(){
 if(presentation!=='taipei')return;
 if(!taipeiNames().includes(taipeiCategory))taipeiCategory='all';
 if(query&&!taipeiShelf){taipeiCategory='all';taipeiShelf=true;}
 genre=taipeiShelf&&taipeiCategory.startsWith('genre:')?taipeiLabel():'';
 favoritesOnly=taipeiShelf&&taipeiCategory==='favorites';
}
function taipeiOpen(key){
 taipeiCategory=key;taipeiShelf=true;presentationId=taipeiPlaces.get(key)||null;
 update();taipeiFocus();persist();
}
function taipeiStep(delta){
 const names=taipeiNames();
 taipeiCategory=names[(names.indexOf(taipeiCategory)+names.length+delta)%names.length];
 renderTaipei();taipeiFocus();queueCarouselSave();
}
function taipeiBack(){
 if(query){query='';$('#search').value='';native?.hideKeyboard?.();}
 else if(taipeiShelf)taipeiShelf=false;
 else return false;
 update();taipeiFocus();persist();return true;
}

const taipeiMasks=["Action & adventure", "Action RPGs", "All Games", "Arcade & reflex", "Arena & twin-stick shooters", "Board games", "City builders", "Collections & game libraries", "Deckbuilders & card games", "Detective mysteries", "Farming & life sims", "Favorites", "Fighting & beat em ups", "First & third person shooters", "Flight & space combat", "Local multiplayer", "Metroidvanias", "Party games", "Pinball & brick breakers", "Platformers", "Point-and-click adventures", "Puzzle platformers", "Puzzles", "RPGs", "Racing", "Rhythm & music", "Roguelikes & dungeon crawlers", "Run & gun", "SHMUPS", "Simulation & sandbox", "Sports", "Stealth", "Story adventures", "Strategy & tactics", "Survival & crafting", "Survival horror", "Tower defense", "Visual novels & choices", "Word & matching puzzles"];
function taipeiFocus(){($('#grid .presentation-selected')||$('#grid .show-all-matches'))?.focus({preventScroll:true});}
const taipeiPlayDate=new Intl.DateTimeFormat(undefined,{month:'short',day:'numeric',year:'numeric'});
const taipeiTime=new Intl.DateTimeFormat(undefined,{hour:'2-digit',minute:'2-digit',hourCycle:'h23'});
function taipeiUpdateClock(){
 if(presentation!=='taipei'||!taipeiShelf||document.hidden)return;
 const now=new Date(),clock=$('#taipei-clock'),text=taipeiPlayDate.format(now)+' · '+taipeiTime.format(now);
 if(clock.textContent!==text)clock.textContent=text;
}
function taipeiFooter(game){
 const status=$('#taipei-game-status');
 const launched=new Date(Number(game?.lastPlayed));
 if(!game)status.textContent='';
 else if(game.lastPlayed>0&&Number.isFinite(launched.getTime()))
  status.textContent='Last played: '+taipeiPlayDate.format(launched)+' '+taipeiTime.format(launched);
 else status.textContent='No play history for this game';
 status.title=status.textContent;
 $('#taipei-play-hint').hidden=!game;
 taipeiUpdateClock();
}
function taipeiSelect(i,focus=false){
 if(!filtered.length)return;
 i=Math.max(0,Math.min(i,filtered.length-1));
 const game=filtered[i];
 taipeiFooter(game);
 presentationId=controllerGameId=game.id;taipeiPlaces.set(taipeiKey(),game.id);
 const grid=$('#grid'),{columns,rowHeight}=taipeiGridMetrics();
 if(taipeiTrack)taipeiTrack.style.height=(12+Math.ceil(filtered.length/columns)*rowHeight)+'px';
 const top=Math.floor(i/columns)*rowHeight;
 if(top<grid.scrollTop)grid.scrollTop=top;
 else if(top+rowHeight>grid.scrollTop+grid.clientHeight)grid.scrollTop=top+rowHeight-grid.clientHeight;
 taipeiPaint();
 const tile=grid.querySelector('.game.presentation-selected');
 if(tile){
  const viewport=grid.getBoundingClientRect(),frame=tile.getBoundingClientRect();
  if(frame.top<viewport.top+4)grid.scrollTop+=frame.top-viewport.top-4;
  else if(frame.bottom>viewport.bottom-4)grid.scrollTop+=frame.bottom-viewport.bottom+4;
 }
 if(focus)taipeiFocus();queueCarouselSave();
}
function taipeiGridMetrics(){
 const grid=$('#grid'),width=Math.max(1,grid.clientWidth-24),gap=12;
 const target={compact:120,comfortable:164,large:225}[size]||164;
 const columns=Math.max(1,Math.round((width+gap)/(target+gap)));
 const cellWidth=(width+gap)/columns;
 const cardWidth=Math.max(1,Math.floor(Math.min(cellWidth-gap,(grid.clientHeight-60)/1.5)));
 return {columns,cellWidth,cardWidth,rowHeight:Math.ceil((cardWidth-18)*1.5)+69};
}
function taipeiPaint(){
 const grid=$('#grid');if(!taipeiTrack||!taipeiTrack.isConnected)return;
 const {columns,cellWidth,cardWidth,rowHeight}=taipeiGridMetrics();
 const first=Math.max(0,Math.floor(grid.scrollTop/rowHeight)-1)*columns;
 const end=Math.min(filtered.length,(Math.ceil((grid.scrollTop+grid.clientHeight)/rowHeight)+1)*columns);
 const cards=new Map([...taipeiTrack.children].map(b=>[b.dataset.id,b]));
 for(let i=first;i<end;i++){
  const game=filtered[i];let b=cards.get(game.id);
  if(!b){b=card(game);b.onclick=null;
   b.addEventListener('click',e=>{e.stopImmediatePropagation();if(game.id===presentationId)play(game.id,b);else taipeiSelect(i);},true);
   taipeiTrack.append(b);}
  cards.delete(game.id);
  b.style.left=(12+(i%columns)*cellWidth+(cellWidth-12-cardWidth)/2)+'px';
  b.style.width=cardWidth+'px';b.style.top=(8+Math.floor(i/columns)*rowHeight)+'px';
  const on=game.id===presentationId;b.classList.toggle('presentation-selected',on);b.tabIndex=on?0:-1;b.setAttribute('aria-current',String(on));
 }
 for(const b of cards.values())b.remove();
}
function taipeiController(action){
 if(['menu','search','apps','controls'].includes(action)||document.activeElement?.matches('input,textarea,select'))return false;
 if(action==='back')return taipeiBack();
 const names=taipeiNames(),i=names.indexOf(taipeiCategory);
 if(document.activeElement?.closest('#taipei-bar')){
  if(action==='activate'){document.activeElement.click();return true;}
  if(action==='down'){taipeiFocus();return true;}
  if(action==='up'){openControllerHeader();return true;}
  if(action==='left'||action==='right'){
   const buttons=[...$('#taipei-bar').querySelectorAll('button')].filter(b=>!b.hidden),at=buttons.indexOf(document.activeElement);
   controllerFocus(buttons[Math.max(0,Math.min(buttons.length-1,at+(action==='left'?-1:1)))],true);return true;
  }
 }
 if(!taipeiShelf){
  if(action==='activate')taipeiOpen(taipeiCategory);
  else if(action==='edit')openTaipeiArtPicker();
  
  else if(['left','right','pageUp','pageDown','genrePrev','genreNext'].includes(action)){taipeiStep(['left','pageUp','genrePrev'].includes(action)?-1:1);}
  else if(action==='up'){controllerFocus($('#settings-button'));}else return false;
  return true;
 }
 if(action==='genrePrev'||action==='genreNext'){taipeiOpen(names[(i+names.length+(action==='genrePrev'?-1:1))%names.length]);return true;}

 const index=filtered.findIndex(g=>g.id===presentationId),game=filtered[index];
 const {columns,rowHeight}=taipeiGridMetrics(),column=index%columns;
 const pageRows=Math.max(1,Math.floor($('#grid').clientHeight/rowHeight));
 if(action==='up' && index<columns){controllerFocus($('#taipei-back'));return true;}
 const lastRow=Math.floor((filtered.length-1)/columns),row=Math.floor(index/columns);
 const steps={up:-1,down:1,pageUp:-pageRows,pageDown:pageRows};
 if(action in steps){
  const nextRow=Math.max(0,Math.min(lastRow,row+steps[action]));
  taipeiSelect(nextRow*columns+column,true);return true;
 }
 if(action==='left'||action==='right'){
  if(action==='left' && column>0)taipeiSelect(index-1,true);
  if(action==='right' && column<columns-1 && index+1<filtered.length)taipeiSelect(index+1,true);
  return true;
 }
 if(!game)return false;
 if(action==='activate')play(game.id,$('#grid .presentation-selected'));else if(action==='edit')editGame(game);else if(action==='favorite')toggleFavorite(game.id);else return false;return true;
}

function renderTaipei(){
 const grid=$('#grid');grid.replaceChildren();taipeiTrack=null;
 document.body.dataset.taipeiLevel=taipeiShelf?'games':'categories';
 syncCustomBackground();syncSystemBarColor();
 $('#taipei-heading').textContent=taipeiLabel();$('#empty').hidden=true;$('#load').hidden=true;
 if(taipeiShelf){
  if(!filtered.length)taipeiFooter(null);
  let total=filtered.length;
  const searching=Boolean(query.trim());
  if(searching)total=favoritesOnly?games.filter(g=>g.favorite===true).length:genre?(counts[genre]??0):games.length;
  const prefix=searching?filtered.length.toLocaleString()+' of ':'';
  $('#taipei-count span').textContent=prefix+total.toLocaleString()+(total===1?' item':' items');
  if(filtered.length){taipeiTrack=el('div','taipei-track');grid.append(taipeiTrack);taipeiSelect(Math.max(0,filtered.findIndex(g=>g.id===presentationId)));}
  else if(query)syncSearchFeedback();
  else grid.append(el('p','taipei-empty',taipeiCategory==='favorites'?'Your favorite games will appear here.':'No games in this category yet.'));
  return;
 }
 const stage=el('section','taipei-stage'),row=el('div','taipei-row');
 const arrow=(name,delta)=>{const b=el('button','taipei-arrow');b.setAttribute('aria-label',name);b.dataset.direction=String(delta);b.onclick=()=>taipeiStep(delta);return b;};
 const title=el('button','taipei-title presentation-selected',taipeiLabel());title.onclick=()=>taipeiOpen(taipeiCategory);
 const art=el('div','taipei-art');art.setAttribute('aria-hidden','true');
 art.style.webkitMaskImage=taipeiSceneUrl(taipeiArtFor(taipeiCategory));
 art.onclick=title.onclick;stage.oncontextmenu=e=>{e.preventDefault();openTaipeiArtPicker();};
 row.append(arrow('Previous category',-1),title,arrow('Next category',1));stage.append(row,art);grid.append(stage);
}
// Keep shared appearance controls and their handlers when changing layouts.
const taipeiSlots=new Map();
function arrangeTaipeiSettings(){
 $('#background-color option[value=palette]').textContent=presentation==='taipei'?$('#taipei-gridColor option[value=palette]').textContent:'Match palette';
 for(const [slot,id] of Object.entries({category:'backdrop',colors:'background-color',dim:'background-dim',fit:'art-fit',corners:'cover-corners',brightness:'cover-brightness',sort:'presentation-sort',file:'custom-background-controls'})){
  const node=id==='custom-background-controls'?$('#'+id):$('#'+id).closest('.settings-row');
  if(!taipeiSlots.has(slot)){const anchor=document.createComment('appearance '+id);node.before(anchor);taipeiSlots.set(slot,anchor);}
  const anchor=taipeiSlots.get(slot);
  if(presentation==='taipei'){const target=$('#taipei-slot-'+slot);if(node.parentNode!==target)target.append(node);}
  else if(node.previousSibling!==anchor)anchor.after(node);
 }
}
function syncTaipeiPreviews(){
 if(!$('#settings-dialog').open)return;
 for(const grid of [false,true]){
  const panel=$(grid?'#taipei-preview-grid':'#taipei-preview-category'),image=panel.querySelector('img'),content=panel.lastElementChild;
  const mode=grid?taipeiOptions.gridBackdrop:backdrop,color=grid?taipeiOptions.gridColor:backgroundColor,dim=grid?taipeiOptions.gridDim:backgroundDim;
  const file=builtinBackgrounds[mode]?.file,url=file?'backgrounds/'+file:mode==='custom'?backgroundInfo.url:'';
  if(url&&image.getAttribute('src')!==url)image.src=url;
  else if(!url&&image.hasAttribute('src'))image.removeAttribute('src');
  image.hidden=!url;image.style.opacity=String(1-dim/100);
  image.style.filter=color==='palette'?'url(#background-palette-filter)':color==='muted'?'saturate(.25)':'none';
  panel.style.backgroundImage=mode==='gradient'?getComputedStyle($('#soft-gradient')).backgroundImage:'none';
  if(!grid){
   const label=taipeiLabel(),file=taipeiArtFor(taipeiCategory);
   if(content.dataset.label!==label||content.dataset.file!==file){
    const art=el('span','tp-preview-icon');art.style.webkitMaskImage=taipeiSceneUrl(file);
    content.replaceChildren(el('strong','',label),art);content.dataset.label=label;content.dataset.file=file;
   }
   continue;
  }
  const list=taipeiShelf?filtered:games;
  const at=Math.max(0,list.findIndex(g=>g.id===presentationId)),start=Math.max(0,Math.min(at-1,list.length-3));
  const entries=list.slice(start,start+3),key=JSON.stringify(entries.map(g=>[g.id,g.title,g.image,g.id===list[at]?.id]));
  if(content.dataset.games===key)continue;
  content.dataset.games=key;content.replaceChildren();
  for(const g of entries){
   const tile=el('div','tp-preview-game'),cover=el('img');cover.alt='';cover.src=g.image;
   tile.classList.toggle('current',g.id===list[at]?.id);tile.append(cover,el('span','',g.title));content.append(tile);
  }
  if(!entries.length)content.append(el('span','','No games in this view'));
 }
}
function taipeiArtFor(key,automatic=false){
 if(!automatic&&taipeiAssignments.has(key))return taipeiAssignments.get(key);
 const label=taipeiLabel(key),normalized=portlandNormalize(label);
 const exact=taipeiMasks.find(name=>portlandNormalize(name)===normalized);
 if(exact)return exact;
 const aliases={'city building':'City builders','city builder':'City builders','detective':'Detective mysteries','mystery':'Detective mysteries','mysteries':'Detective mysteries','party':'Party games','party game':'Party games','point and click':'Point-and-click adventures','point and click adventure':'Point-and-click adventures','survival':'Survival & crafting','crafting':'Survival & crafting'};
 const match=Object.hasOwn(aliases,normalized)?aliases[normalized]:portlandScenes.find(s=>s[0]===portlandMatch(label))?.[1];
 return taipeiMasks.includes(match)?match:'Collections & game libraries';
}
function taipeiSceneUrl(file){return 'url("taipei/scenes/'+encodeURIComponent(file)+'.png")';}
function openTaipeiArtPicker(){
 const select=$('#taipei-art-category'),choices=$('#taipei-art-choices');
 select.replaceChildren(...taipeiNames().map(key=>new Option(taipeiLabel(key),key)));
 select.value=taipeiCategory;
 function refresh(){
  const key=select.value,automatic=taipeiArtFor(key,true),assigned=taipeiAssignments.get(key);
  choices.replaceChildren();
  for(const name of [null,...taipeiMasks]){
   const file=name??automatic,button=el('button','tp-art-choice'),icon=el('span','tp-art-thumbnail');
   icon.style.webkitMaskImage=taipeiSceneUrl(file);icon.setAttribute('aria-hidden','true');
   button.append(icon,el('span','',name??('Automatic · '+automatic)));
   button.setAttribute('aria-pressed',String((assigned??null)===name));
   button.onclick=()=>{
    if(name)taipeiAssignments.set(key,name);else taipeiAssignments.delete(key);
    persist();hideDialog('#taipei-art-picker');
    if(!taipeiShelf&&key===taipeiCategory)renderTaipei();
    syncTaipeiPreviews();if(!topDialog()&&!taipeiShelf)taipeiFocus();
   };
   choices.append(button);
  }
 }
 select.onchange=refresh;refresh();showDialog('#taipei-art-picker');select.focus();
}
function initTaipei(){
 setInterval(taipeiUpdateClock,1000);
 document.addEventListener('visibilitychange',taipeiUpdateClock);
 $('#taipei-edit-art').onclick=openTaipeiArtPicker;
 $('#taipei-close-art').onclick=()=>hideDialog('#taipei-art-picker');
 for(const key of Object.keys(taipeiOptions))$('#taipei-'+key).onchange=e=>setTaipeiOptions({...taipeiOptions,[key]:e.target.value});
 $('#taipei-gridDim').oninput=e=>setTaipeiOptions({...taipeiOptions,gridDim:Number(e.target.value)});
 $('#taipei-gridDim').onchange=$('#taipei-gridDim').oninput;
 $('#taipei-gridBackdrop').addEventListener('change',e=>{if(e.target.value==='custom'&&!backgroundInfo.url)native?.chooseBackground?.();});
 $('#taipei-back').onclick=taipeiBack;
 for(const button of document.querySelectorAll('.taipei-density button'))button.addEventListener('click',()=>{if(filtered.length)taipeiSelect(Math.max(0,filtered.findIndex(g=>g.id===presentationId)));persist();});
 const grid=$('#grid');
 grid.addEventListener('scroll',()=>{if(presentation==='taipei'&&taipeiShelf)taipeiPaint();},{passive:true});
 new ResizeObserver(()=>{if(presentation==='taipei'&&taipeiShelf&&filtered.length)taipeiSelect(Math.max(0,filtered.findIndex(g=>g.id===presentationId)));}).observe(grid);
}
