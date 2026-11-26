const portlandScenes=[
 ['action-adventure','Action & adventure','action adventure|adventure games'],['action-rpg','Action RPGs','arpg|action rpg'],
 ['arcade','Arcade & reflex','arcade|reflex'],['arena','Arena & twin-stick shooters','twin stick|twin stick shooters|arena shooters'],
 ['collections','Collections & game libraries','compilations|collections'],['cards','Deckbuilders & card games','deckbuilders|card games'],
 ['fighting','Fighting & beat em ups','fighting|beat em ups|brawlers'],['shooters','First & third person shooters','fps|third person shooters'],
 ['flight','Flight & space combat','space combat|flight'],['metroidvania','Metroidvanias','metroidvania'],['pinball','Pinball & brick breakers','pinball|brick breakers'],
 ['platformers','Platformers','platform games'],['puzzle-platformers','Puzzle platformers','puzzle platforming'],['puzzles','Puzzles','puzzle games'],
 ['racing','Racing','driving'],['rhythm','Rhythm & music','rhythm games|music'],['roguelikes','Roguelikes & dungeon crawlers','roguelites|roguelikes|dungeon crawlers'],
 ['rpg','RPGs','rpg|role playing games|jrpgs'],['run-gun','Run & gun','run and gun'],['shmups','SHMUPS','shoot em ups|bullet hell'],
 ['sandbox','Simulation & sandbox','simulation|sandbox'],['sports','Sports','sports games'],['story','Story adventures','narrative adventures'],
 ['strategy','Strategy & tactics','strategy|tactics'],['tower','Tower defense','tower defence'],['visual-novels','Visual novels & choices','visual novels'],
 ['word','Word & matching puzzles','word games|match three'],['stealth','Stealth','stealth games'],['horror','Survival horror','horror'],
 ['stealth-platformers','Stealth platformers','stealth platforming'],['point-click','Point-and-click','point and click adventures'],
 ['arcade-ports','Arcade ports','arcade conversions'],['translations','Fan translations','translations'],['homebrew','Homebrew','home brew'],
 ['multiplayer','Local multiplayer','couch co op|local co op'],['backlog','Backlog','to play|unplayed'],
 ["adventure-text", "Text adventures", "interactive fiction|text adventure"],
 ["board", "Board games", "board game|tabletop games"],
 ["three-d-platformers", "3D platformers", "3d platforming|3d platform games"],
 ["survival", "Survival & crafting", "survival|survival games|crafting"],
 ["farming", "Farming & life sims", "farming|farming sims|life sims|cozy games"],
 ["fishing", "Fishing", "fishing games|angling"],
 ["rail", "Trains & railways", "trains|railways|train simulators"],
 ["mecha", "Mecha", "mechs|mech games"],
 ["kart", "Kart racers", "kart racing|kart racers"],
 ["walking", "Walking simulators", "walking sims|walking simulator"],
 ["open-world", "Open world", "open world games|open worlds"]
];
const portlandNormalize=s=>normalize(s).replace(/&/g,' and ').replace(/[^a-z0-9]+/g,' ').trim();
const portlandAssignments=new Map(),portlandPlaces=new Map();
let portlandCategory=null,portlandShelf=false,portlandTrack=null,portlandPickerName=null;
function portlandRestore(state){
 if(!state||typeof state!=='object')return;
 for(const [map,key] of [[portlandAssignments,'art'],[portlandPlaces,'places']]){
  map.clear();
  for(const pair of Array.isArray(state[key])?state[key]:[])if(Array.isArray(pair)&&pair.length===2&&pair.every(v=>typeof v==='string'))map.set(...pair);
 }
 portlandCategory=typeof state.category==='string'?state.category:null;portlandShelf=state.shelf===true;
}
function portlandState(){return {category:portlandCategory,shelf:portlandShelf,places:[...portlandPlaces],art:[...portlandAssignments]};}
function portlandMatch(name){
 const key=portlandNormalize(name);
 return portlandScenes.find(([,label,aliases])=>[label,...aliases.split('|')].some(s=>portlandNormalize(s)===key))?.[0];
}
function portlandAssign(){
 const used=new Set([...portlandAssignments].filter(([name])=>genres.includes(name)).map(([,art])=>art));
 for(const name of genres){
  if(portlandAssignments.has(name))continue;
  const match=portlandMatch(name),art=match&&!used.has(match)?match:'covers';
  portlandAssignments.set(name,art);used.add(art);
 }
}
function chicagoPosterPath(id){
 return 'portland/'+id+'.webp';
}
function portlandArt(name){
 const art=portlandAssignments.get(name);
 const frame=el('span','portland-art');
 let images;
 if(name===null)images=[chicagoPosterPath('library')];
 else if(portlandScenes.some(s=>s[0]===art))images=[chicagoPosterPath(art)];
 else if(/^user\/[a-zA-Z0-9-]+\.jpg$/.test(art))images=[art];
 else images=[...new Set(games.filter(g=>name===null||g.genre===name).map(g=>g.image).filter(Boolean))].slice(0,3);
 if(!images.length)images=[chicagoPosterPath('library')];
 for(const src of images){const img=el('img');img.alt='';img.decoding='async';img.src=src;frame.append(img);}
 return frame;
}
function portlandNames(){return [null,...genres];}
function portlandLabel(name){return name??'All games';}
function portlandKey(){return JSON.stringify(portlandCategory);}
function portlandFilters(){
 if(presentation!=='portland')return;
 if(portlandCategory!==null&&!genres.includes(portlandCategory))portlandCategory=null;
 if(query&&!portlandShelf){portlandCategory=null;portlandShelf=true;}
 genre=portlandShelf?(portlandCategory||''):'';favoritesOnly=false;
}
function portlandOpen(name){
 portlandCategory=name;portlandShelf=true;presentationId=portlandPlaces.get(portlandKey())||null;
 update();portlandFocus();persist();
}
function portlandBack(){
 if(query){query='';$('#search').value='';$('#search').blur();native?.hideKeyboard?.();update();}
 else if(portlandShelf){portlandShelf=false;update();}
 else return false;
 portlandFocus();persist();return true;
}
function portlandFocus(){($('#grid .presentation-selected')||$('#grid .show-all-matches'))?.focus({preventScroll:true});}
function portlandSelect(i,focus=false){
 if(!filtered.length)return;
 i=Math.max(0,Math.min(i,filtered.length-1));
 const game=filtered[i];
 presentationId=controllerGameId=game.id;portlandPlaces.set(portlandKey(),game.id);
 const grid=$('#grid'),{columns,rowHeight}=portlandGridMetrics();
 if(portlandTrack)portlandTrack.style.height=Math.ceil(filtered.length/columns)*rowHeight+'px';
 const top=Math.floor(i/columns)*rowHeight;
 if(top<grid.scrollTop)grid.scrollTop=top;
 else if(top+rowHeight>grid.scrollTop+grid.clientHeight)grid.scrollTop=top+rowHeight-grid.clientHeight;
 portlandPaint();if(focus)portlandFocus();queueCarouselSave();
}
function portlandGridMetrics(){
 const grid=$('#grid'),width=Math.max(1,grid.clientWidth-24),gap=12;
 const target=chicagoOptions.covers==='compact'?120:160;
 const columns=Math.max(1,Math.round((width+gap)/(target+gap)));
 const cellWidth=(width+gap)/columns;
 const cardWidth=Math.max(1,Math.floor(Math.min(cellWidth-gap,(grid.clientHeight-60)/1.5)));
 return {columns,cellWidth,cardWidth,rowHeight:Math.ceil(cardWidth*1.5)+56};
}
function portlandPaint(){
 const grid=$('#grid');if(!portlandTrack||!portlandTrack.isConnected)return;
 const {columns,cellWidth,cardWidth,rowHeight}=portlandGridMetrics();
 const first=Math.max(0,Math.floor(grid.scrollTop/rowHeight)-1)*columns;
 const end=Math.min(filtered.length,(Math.ceil((grid.scrollTop+grid.clientHeight)/rowHeight)+1)*columns);
 const cards=new Map([...portlandTrack.children].map(b=>[b.dataset.id,b]));
 for(let i=first;i<end;i++){
  const game=filtered[i];let b=cards.get(game.id);
  if(!b){b=card(game);b.onclick=null;
   b.addEventListener('click',e=>{e.stopImmediatePropagation();if(game.id===presentationId)play(game.id,b);else portlandSelect(i);},true);
   portlandTrack.append(b);}
  cards.delete(game.id);
  b.style.left=(12+(i%columns)*cellWidth+(cellWidth-12-cardWidth)/2)+'px';
  b.style.width=cardWidth+'px';b.style.top=(8+Math.floor(i/columns)*rowHeight)+'px';
  const on=game.id===presentationId;b.classList.toggle('presentation-selected',on);b.tabIndex=on?0:-1;b.setAttribute('aria-current',String(on));
 }
 for(const b of cards.values())b.remove();
}
function portlandChoose(name,focus=false){
 portlandCategory=name;
 $('#portland-art-button').hidden=name===null;
 const grid=$('#grid'),i=portlandNames().indexOf(name);
 [...grid.querySelectorAll('.portland-postcard')].forEach((b,j)=>{b.classList.toggle('presentation-selected',i===j);b.setAttribute('aria-current',String(i===j));b.tabIndex=i===j?0:-1;});
 const b=grid.children[i];if(b){grid.scrollLeft=b.offsetLeft-(grid.clientWidth-b.offsetWidth)/2;if(focus)portlandFocus();}
 queueCarouselSave();
}
function renderPortland(){
 portlandAssign();
 const grid=$('#grid');grid.replaceChildren();portlandTrack=null;
 document.body.dataset.portlandLevel=portlandShelf?'games':'categories';
 $('#portland-heading').textContent=portlandShelf?portlandLabel(portlandCategory):'Categories';
 $('#portland-back').hidden=!portlandShelf;
 $('#portland-art-button').hidden=portlandCategory===null;

 $('#empty').hidden=true;$('#load').hidden=true;
 if(!portlandShelf){
  const counts=new Map();for(const g of games)counts.set(g.genre,(counts.get(g.genre)||0)+1);
  for(const name of portlandNames()){
   const b=el('button','portland-postcard'),copy=el('span','portland-caption'),n=name===null?games.length:counts.get(name)||0;
   copy.append(el('strong','',portlandLabel(name)),el('small','',n+' '+(n===1?'game':'games')));
   b.append(portlandArt(name),copy);b.onclick=()=>portlandOpen(name);b.oncontextmenu=e=>{e.preventDefault();portlandChoose(name);portlandPick();};grid.append(b);
  }
  portlandChoose(portlandCategory);return;
 }
 if(filtered.length){portlandTrack=el('div','portland-track');grid.append(portlandTrack);const i=filtered.findIndex(g=>g.id===presentationId);portlandSelect(Math.max(0,i));}
 else if(query)syncSearchFeedback();
 else grid.append(el('p','portland-empty','No games in this category yet.'));
}
function portlandPick(){
 const name=portlandCategory;if(name===null)return;
 portlandPickerName=name;const list=$('#portland-options');list.replaceChildren();
 const used=new Set([...portlandAssignments].filter(([n])=>n!==name&&genres.includes(n)).map(([,a])=>a)),match=portlandMatch(name);
 const priority=id=>(used.has(id)?2:0)+(id===match?0:1);
 const choose=id=>{portlandAssignments.set(name,id);hideDialog('#portland-picker');renderPortland();persist();};
 for(const [id,label] of [...portlandScenes].sort((a,b)=>priority(a[0])-priority(b[0]))){
  const b=el('button'),img=el('img');img.src=chicagoPosterPath(id);img.alt='';img.loading='lazy';b.setAttribute('aria-pressed',String(portlandAssignments.get(name)===id));
  b.append(img,el('span','',label));b.onclick=()=>choose(id);list.append(b);
 }
 $('#portland-covers').onclick=()=>choose('covers');
 $('#portland-custom').onclick=()=>native?.chooseCover('portland:'+name);
 $('#portland-picker-title').textContent='Artwork for '+name;showDialog('#portland-picker');
}
function portlandController(action){
 if(['menu','search','apps','controls'].includes(action)||document.activeElement?.matches('input,textarea,select'))return false;
 if(action==='back')return portlandBack();
 const names=portlandNames(),i=names.indexOf(portlandCategory);
 if(document.activeElement?.closest('#portland-bar')){
  if(action==='activate'){document.activeElement.click();return true;}
  if(action==='down'){portlandFocus();return true;}
  if(action==='up'){openControllerHeader();return true;}
  if(action==='left'||action==='right'){
   const buttons=[...$('#portland-bar').querySelectorAll('button')].filter(b=>!b.hidden),at=buttons.indexOf(document.activeElement);
   controllerFocus(buttons[Math.max(0,Math.min(buttons.length-1,at+(action==='left'?-1:1)))],true);return true;
  }
 }
 if(!portlandShelf){
  if(action==='activate')portlandOpen(portlandCategory);
  else if(action==='edit')portlandPick();
  else if(['left','right','pageUp','pageDown','genrePrev','genreNext'].includes(action)){portlandChoose(names[Math.max(0,Math.min(names.length-1,i+(['left','pageUp','genrePrev'].includes(action)?-1:1)))],true);$('#portland-art-button').hidden=portlandCategory===null;}
  else if(action==='up'){controllerFocus($('#settings-button'));}else return false;
  return true;
 }
 if(action==='genrePrev'||action==='genreNext'){portlandOpen(names[(i+names.length+(action==='genrePrev'?-1:1))%names.length]);return true;}

 const index=filtered.findIndex(g=>g.id===presentationId),game=filtered[index];
 const {columns,rowHeight}=portlandGridMetrics(),column=index%columns;
 const pageRows=Math.max(1,Math.floor($('#grid').clientHeight/rowHeight));
 if(action==='up' && index<columns){controllerFocus($('#portland-back'));return true;}
 const lastRow=Math.floor((filtered.length-1)/columns),row=Math.floor(index/columns);
 const steps={up:-1,down:1,pageUp:-pageRows,pageDown:pageRows};
 if(action in steps){
  const nextRow=Math.max(0,Math.min(lastRow,row+steps[action]));
  portlandSelect(nextRow*columns+column,true);return true;
 }
 if(action==='left'||action==='right'){
  if(action==='left' && column>0)portlandSelect(index-1,true);
  if(action==='right' && column<columns-1 && index+1<filtered.length)portlandSelect(index+1,true);
  return true;
 }
 if(!game)return false;
 if(action==='activate')play(game.id,$('#grid .presentation-selected'));else if(action==='edit')editGame(game);else if(action==='favorite')toggleFavorite(game.id);else return false;return true;
}
const chicagoDefaults={width:'standard',counts:'all',paper:'grain',ground:'paper',covers:'large',dimming:'off'};
let chicagoOptions={...chicagoDefaults};
function setChicagoOptions(value,save=true){
 for(const [key,fallback] of Object.entries(chicagoDefaults)){
  const select=$('#chicago-'+key);
  const choice=value?.[key];
  select.value=Array.from(select.options).some(option=>option.value===choice)?choice:fallback;
  chicagoOptions[key]=select.value;
  document.body.setAttribute('data-chicago-'+key,select.value);
 }
 if(save){
  if(presentation==='portland'){renderPortland();syncSystemBarColor();}
  persist();
 }
}
function initPortland(){
 for(const key of Object.keys(chicagoDefaults)){
  $('#chicago-'+key).onchange=e=>setChicagoOptions({...chicagoOptions,[key]:e.target.value});
 }
 $('#portland-back').onclick=portlandBack;$('#portland-art-button').onclick=portlandPick;$('#portland-close').onclick=()=>hideDialog('#portland-picker');
 const grid=$('#grid');
 grid.addEventListener('scroll',()=>{if(presentation==='portland'&&portlandShelf)portlandPaint();},{passive:true});
 new ResizeObserver(()=>{if(presentation==='portland')requestAnimationFrame(()=>{
  if(presentation!=='portland')return;
  if(portlandShelf&&filtered.length)portlandSelect(Math.max(0,filtered.findIndex(g=>g.id===presentationId)));
  else if(!portlandShelf)portlandChoose(portlandCategory);
 });}).observe(grid);
}
function portlandRename(from,to){
 // Retain the old name's choice so Undo can recover it; merging keeps the destination's art.
 if(portlandAssignments.has(from)&&!portlandAssignments.has(to))portlandAssignments.set(to,portlandAssignments.get(from));
 const key=JSON.stringify(from);
 if(portlandPlaces.has(key)&&!portlandPlaces.has(JSON.stringify(to)))portlandPlaces.set(JSON.stringify(to),portlandPlaces.get(key));
 if(portlandCategory===from)portlandCategory=to;
}
