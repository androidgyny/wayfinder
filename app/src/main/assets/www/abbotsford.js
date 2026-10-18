// ANSI directory: normal library filters and history, with text rows and real cover details.
let abbotsfordPane='games',abbotsfordRows=new Map(),abbotsfordRendered=null;
let terminalPalette='ansi';
const terminalPalettes={ansi:'ANSI Classic',green:'Green Screen',amber:'Amber Terminal',ice:'Ice Blue',paper:'Paper Terminal',grayscale:'Grayscale'};
function setTerminalPalette(value,save=true){
 terminalPalette=Object.prototype.hasOwnProperty.call(terminalPalettes,value)?value:'ansi';
 document.body.dataset.terminalPalette=terminalPalette;$('#terminal-palette').value=terminalPalette;
 if(presentation==='abbotsford'){updateBackgroundPalette();syncSystemBarColor();}
 if(save)persist();
}
function abbotsfordSections(){return sections().map(s=>({...s,label:s.favorite?'Favorites':s.label,count:searchSectionCount(s.favorite?'favorites':s.genre?'genre:'+s.genre:'all',s.favorite?games.filter(g=>g.favorite).length:s.genre?counts[s.genre]:games.length)}));}
function abbotsfordFrame(label){
 const frame=el('div','bbs-frame');frame.dataset.label=label;frame.setAttribute('aria-hidden','true');
 for(const edge of ['top','bottom','left','right'])frame.append(el('span','bbs-edge bbs-'+edge));return frame;
}
function sizeAbbotsford(){
 if(presentation!=='abbotsford')return;
 for(const frame of document.querySelectorAll('.bbs-frame')){
  if(!frame.clientWidth||!frame.clientHeight)continue;
  const probe=el('span','bbs-probe','M');frame.append(probe);const cell=probe.getBoundingClientRect();probe.remove();if(!cell.width||!cell.height)continue;
  const cols=Math.max(4,Math.floor(frame.clientWidth/cell.width)),rows=Math.max(2,Math.floor(frame.clientHeight/cell.height));
  const label='[ '+frame.dataset.label+' ]',heading=label.length<=cols-4?'═'+label:'═'.repeat(cols-2);
  frame.querySelector('.bbs-top').textContent='╔'+heading+'═'.repeat(Math.max(0,cols-2-heading.length))+'╗';
  frame.querySelector('.bbs-bottom').textContent='╚'+'═'.repeat(cols-2)+'╝';
  for(const side of ['left','right'])frame.querySelector('.bbs-'+side).textContent=Array(rows-2).fill('║').join('\n');
  // Center the whole character grid, including any fractional-cell remainder.
  const x=(frame.clientWidth-cols*cell.width)/2,y=(frame.clientHeight-rows*cell.height)/2;
  frame.style.setProperty('--bbs-edge-x',x+'px');frame.style.setProperty('--bbs-edge-y',y+'px');
  frame.style.setProperty('--bbs-edge-right',(x+(cols-1)*cell.width)+'px');frame.style.setProperty('--bbs-edge-bottom',(y+(rows-1)*cell.height)+'px');
 }
}
function abbotsfordFocus(){
 const target=abbotsfordPane==='categories'?$('#abbotsford-categories .current'):abbotsfordRows.get(presentationId)||$('#grid .show-all-matches');
 const next=target||$('#abbotsford-categories .current');if(!target)abbotsfordPane='categories';
 document.body.dataset.abbotsfordPane=abbotsfordPane;next?.focus({preventScroll:true});revealCategoryItem(next?.closest('#grid,#abbotsford-categories'),next,abbotsfordPane==='categories'&&innerWidth<=520);
}
function abbotsfordSelect(id,focus=false){
 presentationId=id;controllerGameId=id;const target=abbotsfordRows.get(id);
 for(const row of $('#grid').querySelectorAll('.presentation-selected,.controller-selected,.game[tabindex="0"]')){row.classList.remove('presentation-selected','controller-selected');row.tabIndex=-1;}
 if(target){target.classList.add('presentation-selected');target.tabIndex=0;}
 const g=filtered.find(g=>g.id===id),i=filtered.indexOf(g);
 $('#abbotsford-status').textContent=g?`${i+1} / ${filtered.length.toLocaleString()} :: ${g.title}`:'0 / 0 :: No titles in this section';
 for(const b of document.querySelectorAll('#abbotsford-footer [data-game-action]'))b.disabled=!g;
 document.body.dataset.abbotsfordPane=abbotsfordPane;if(focus)abbotsfordFocus();queueCarouselSave();
}
function abbotsfordOpenSection(index,focus=true){const section=abbotsfordSections()[index];if(!section)return;favoritesOnly=section.favorite;setGenre(section.genre,true);if(focus)abbotsfordFocus();persist();}
function renderAbbotsford(){
 const cats=$('#abbotsford-categories'),list=abbotsfordSections(),signature=JSON.stringify(list);
 if(cats.dataset.signature!==signature){cats.dataset.signature=signature;cats.replaceChildren(...list.map((s,i)=>{const b=el('button','bbs-category');b.append(el('span','bbs-cursor','>'),el('span','bbs-name',s.label),el('small','',s.count.toLocaleString()));b.onclick=()=>{abbotsfordPane='categories';abbotsfordOpenSection(i)};b.onfocus=()=>{abbotsfordPane='categories';document.body.dataset.abbotsfordPane=abbotsfordPane;};return b;}));}
 for(const [i,b] of [...cats.children].entries()){const current=i===sectionIndex();b.classList.toggle('current',current);b.classList.toggle('search-no-match',!!query&&!list[i].count);b.setAttribute('aria-pressed',String(current));b.tabIndex=current?0:-1;}
 $('#abbotsford-list-frame').dataset.label=(favoritesOnly?'Favorites':genre||'All games').toUpperCase();
 const grid=$('#grid');if(abbotsfordRendered!==filtered||!grid.querySelector('.bbs-row')){
  abbotsfordRendered=filtered;abbotsfordRows=new Map();const fragment=document.createDocumentFragment();
  for(const g of filtered){const b=el('button','game bbs-row');b.dataset.id=g.id;b.tabIndex=-1;b.append(el('span','bbs-cursor','>'),el('span','game-title',g.title));syncFavoriteCard(b,g);b.setAttribute('aria-label','Details for '+g.title+(g.favorite?' · Favorite':''));
   b.onfocus=()=>{abbotsfordPane='games';if(presentationId!==g.id)abbotsfordSelect(g.id);document.body.dataset.abbotsfordPane=abbotsfordPane;};
   b.onclick=()=>{abbotsfordPane='games';abbotsfordSelect(g.id);openGame(g.id,b)};
   b.oncontextmenu=e=>{e.preventDefault();b.click()};abbotsfordRows.set(g.id,b);fragment.append(b);
  }
  grid.replaceChildren(fragment);if(!filtered.length)grid.append(el('p','bbs-empty',query?'No matching titles.':'No games in this section.'));
 }
 abbotsfordSelect(filtered.find(g=>g.id===presentationId)?.id||filtered[0]?.id||null);
 revealCategoryItem(grid,abbotsfordRows.get(presentationId));revealCategoryItem(cats,cats.querySelector('.current'),innerWidth<=520);
 $('#empty').hidden=true;$('#load').hidden=true;sizeAbbotsford();
}
function abbotsfordBack(){
 if(document.activeElement===$('#search')){$('#search').blur();native?.hideKeyboard?.();}
 if(query){query='';$('#search').value='';update();abbotsfordFocus();persist();return true;}
 if(abbotsfordPane==='games'){abbotsfordPane='categories';abbotsfordFocus();return true;}
 if(genre||favoritesOnly){abbotsfordOpenSection(0);return true;}return false;
}
function abbotsfordController(action){
 const active=document.activeElement;
 if(active?.matches('input,textarea,select')){if(action==='down'||action==='activate'){active.blur();native?.hideKeyboard?.();abbotsfordPane='games';abbotsfordFocus();return true;}return false;}
 if(action==='search'||action==='menu'||action==='apps')return false;
 // Top bar and footer buttons keep ordinary controller activation and geometric navigation.
 const inDirectory=active?.closest('#abbotsford-categories,#grid')||active===document.body;
 if(!inDirectory&&!['genrePrev','genreNext','pageUp','pageDown'].includes(action))return false;
 document.body.dataset.input='controller';
 if(action==='back'){abbotsfordBack();return true;}
 if(action==='left'){abbotsfordPane='categories';abbotsfordFocus();return true;}
 if(action==='right'||action==='activate'&&abbotsfordPane==='categories'){abbotsfordPane='games';abbotsfordFocus();return true;}
 if(action==='genrePrev'||action==='genreNext'){const list=abbotsfordSections();abbotsfordOpenSection((sectionIndex()+(action==='genreNext'?1:-1)+list.length)%list.length);effect('page');return true;}
 if(['up','down','pageUp','pageDown'].includes(action)){
  const categories=abbotsfordPane==='categories',panel=categories?$('#abbotsford-categories'):$('#grid'),items=categories?abbotsfordSections():filtered;
  const index=categories?sectionIndex():Math.max(0,filtered.findIndex(g=>g.id===presentationId)),row=panel.querySelector('button'),step=action.startsWith('page')?Math.max(1,Math.floor(panel.clientHeight/(row?.offsetHeight||36))-1):1;
  const next=Math.max(0,Math.min(items.length-1,index+(action==='up'||action==='pageUp'?-step:step)));
  if(items.length&&next!==index){if(categories)abbotsfordOpenSection(next);else abbotsfordSelect(items[next].id,true);effect(action.startsWith('page')?'page':'move');}return true;
 }
 if(action==='activate'){if(active?.matches('.show-all-matches'))active.click();else if(presentationId)openGame(presentationId,abbotsfordRows.get(presentationId));return true;}
 if(['edit','favorite'].includes(action)){if(abbotsfordPane==='games'){const g=filtered.find(g=>g.id===presentationId);if(g){if(action==='edit')editGame(g);else toggleFavorite(g.id);}}return true;}return false;
}
function initAbbotsford(){
 const paletteSelect=el('select');paletteSelect.id='terminal-palette';paletteSelect.setAttribute('aria-label','Terminal palette');
 for(const [value,label] of Object.entries(terminalPalettes))paletteSelect.add(new Option(label,value));
 const paletteRow=el('div','settings-row'),copy=el('div');copy.append(el('h3','','Terminal palette'),el('p','','Coordinated colors for aBBotSford.'));paletteRow.append(copy,paletteSelect);
 $('#palette').closest('.settings-row').before(paletteRow);paletteSelect.onchange=()=>{setTerminalPalette(paletteSelect.value);effect('select')};
 const banner=el('header');banner.id='abbotsford-banner';const art=el('pre');art.setAttribute('aria-label','Wayfinder');art.setAttribute('role','img');
 for(const [tone,text] of [['gold',' ▄     ▄  ▄▄▄  ▄   ▄ ▄▄▄▄▄ ▄▄▄ ▄   ▄ ▄▄▄▄  ▄▄▄▄▄ ▄▄▄▄\n █  ▄  █ █   █  █ █  █      █  ██  █ █   █ █     █   █\n'],['coral',' █ █ █ █ █▄▄▄█   █   █▄▄▄   █  █ █ █ █   █ █▄▄▄  █▄▄▄▀\n ██   ██ █   █   █   █      █  █  ██ █   █ █     █  ▀▄\n'],['pink',' ▀     ▀ ▀   ▀   ▀   ▀     ▀▀▀ ▀   ▀ ▀▀▀▀  ▀▀▀▀▀ ▀   ▀']]){const row=el('span','bbs-'+tone);for(const character of text){if(character==='\n')row.append(document.createTextNode('\n'));else row.append(el('span','bbs-cell',character));}art.append(row);}
 banner.append(art,el('strong','bbs-small-logo','░▒▓ WAYFINDER ▓▒░'));
 const directory=el('section');directory.id='abbotsford-directory';const cats=el('nav');cats.id='abbotsford-categories';cats.setAttribute('aria-label','Categories');directory.append(abbotsfordFrame('DIRECTORY'),cats);
 const frame=abbotsfordFrame('ALL GAMES');frame.id='abbotsford-list-frame';const status=el('div');status.id='abbotsford-status';
 const footer=el('nav');footer.id='abbotsford-footer';footer.setAttribute('aria-label','Library controls');
 for(const [letter,label,action] of [['A','Details','details'],['B','Back','back'],['X','Edit','edit'],['Y','Search','search'],['★','Favorite','favorite']]){const b=el('button');b.append(el('span','bbs-key bbs-key-'+action,'['+letter+']'),document.createTextNode(' '+label));if(['details','edit','favorite'].includes(action))b.dataset.gameAction=action;b.onclick=()=>{if(action==='details'&&presentationId)openGame(presentationId,abbotsfordRows.get(presentationId));else if(action==='favorite')toggleFavorite(presentationId);else if(action==='edit'){const g=filtered.find(g=>g.id===presentationId);if(g)editGame(g);}else if(action==='back')nativeBack();else if(action==='search')controller('search');};footer.append(b);}
 footer.append(el('span','bbs-page-hints','LB/RB Category · LT/RT Page'));
 $('#main').append(banner,directory,frame,status,footer);
 const detailFrame=abbotsfordFrame('GAME RECORD');detailFrame.id='abbotsford-detail-frame';$('#detail').append(detailFrame);
 const observer=new ResizeObserver(sizeAbbotsford);for(const n of [directory,frame,$('#detail')])observer.observe(n);
 document.fonts.ready.then(sizeAbbotsford);
}
