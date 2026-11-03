const tacomaPages=['favorites','recently played','library'];
let tacomaPage=0,tacomaCategory='',tacomaInside=false;
const tacomaCategories=()=>['',...genres];
const tacomaDirectory=()=>tacomaPage===2&&!tacomaInside;
let tacomaPreviews=new Map();
function tacomaBuildPreviews(){
 const ranked=[...filtered].sort((a,b)=>
  Number(!!b.favorite)-Number(!!a.favorite)||
  (a.favorite?0:(b.lastPlayed||0)-(a.lastPlayed||0))||
  compareTitles(a.title,b.title)||String(a.id).localeCompare(String(b.id)));
 tacomaPreviews=new Map([['',ranked.slice(0,3)]]);
 for(const game of ranked){
  if(!game.genre)continue;
  if(!tacomaPreviews.has(game.genre))tacomaPreviews.set(game.genre,[]);
  const covers=tacomaPreviews.get(game.genre);
  if(covers.length<3)covers.push(game);
 }
}
function tacomaFilters(){
 if(presentation!=='tacoma')return;
 if(!genres.includes(tacomaCategory))tacomaCategory='';
 if(query&&tacomaDirectory()){tacomaCategory='';tacomaInside=true;}
 genre=tacomaInside?tacomaCategory:'';
 favoritesOnly=tacomaPage===0;
}
function tacomaPageTo(page){
 tacomaPage=(page+3)%3;tacomaInside=false;presentationId=null;
 update();refreshApplicableAppearanceControls();tacomaFocus();persist();
 const heading=$('#tacoma-heading');
 if(!matchMedia('(prefers-reduced-motion: reduce)').matches)heading.animate([{opacity:.35,transform:'translateX(18px)'},{opacity:1,transform:'none'}],{duration:150});
}
function tacomaFocus(){
 const row=$('#grid .presentation-selected')||$('#grid .show-all-matches');
 row?.focus({preventScroll:true});tacomaReveal(row);
}
function tacomaReveal(row){
 if(!row)return;
 if(tacomaPage<2||!row.classList.contains('tc-row')){
  row.scrollIntoView({block:'nearest',inline:'nearest',behavior:'instant'});return;
 }
 const grid=row.parentElement,index=Number(row.dataset.index),height=row.getBoundingClientRect().height;
 if(!height)return;
 const count=Math.max(1,Math.round(grid.clientHeight/height));
 const first=Math.max(index-count+1,Math.min(index,Math.round(grid.scrollTop/height)));
 grid.scrollTo({top:first*height,behavior:'instant'});
}
function tacomaOpenCategory(category){
 tacomaCategory=category;tacomaInside=true;presentationId=null;update();tacomaFocus();persist();
}
function tacomaBack(){
 if(query||document.activeElement===$('#search')){
  query='';$('#search').value='';$('#search').blur();native?.hideKeyboard?.();tacomaHeader(false);update();
 }else if(document.body.classList.contains('tc-header-open')){tacomaHeader(false);}
 else if(tacomaInside){tacomaInside=false;update();}
 else if(tacomaPage!==0){tacomaPageTo(0);return true;}
 else return false;
 tacomaFocus();persist();return true;
}
function tacomaSelect(index){
 const grid=$('#grid'),row=grid.children[index];if(!row||!row.classList.contains('tc-row'))return;
 const directory=tacomaDirectory(),shelf=tacomaPage<2;
 grid.querySelectorAll('.controller-selected').forEach(n=>n.classList.remove('controller-selected'));
 const old=grid.querySelector('.presentation-selected');
 if(old){old.querySelector('.tc-label')?.getAnimations().forEach(a=>a.cancel());old.classList.remove('presentation-selected');old.tabIndex=-1;old.removeAttribute('aria-current');}
 row.classList.add('presentation-selected');row.tabIndex=0;row.setAttribute('aria-current','true');
 const art=$('#tacoma-art'),caption=$('#tacoma-caption');
 tacomaMarquee();
 if(directory)tacomaCategory=row.dataset.category;
 else {presentationId=row.dataset.id;controllerGameId=presentationId;}
 const game=directory?null:filtered[index];
 const covers=directory?(tacomaPreviews.get(tacomaCategory)||[]):shelf?[]:[game];
 art.replaceChildren(...covers.map(g=>{const img=el('img');img.src=g.image;img.alt=g.title;return img;}));
 caption.textContent=shelf?game.title:directory?'':(index+1)+' / '+filtered.length;
}
function renderTacoma(){
 const directory=tacomaDirectory(),shelf=tacomaPage<2;
 document.body.dataset.tacomaMode=directory?'directory':shelf?'shelf':'titles';
 $('#tacoma-heading').textContent=tacomaInside?(tacomaCategory||'all games').toLowerCase():tacomaPages[tacomaPage];
 $('#tacoma-next').textContent=tacomaPages[(tacomaPage+1)%3];$('#tacoma-next').hidden=!shelf;
 const grid=$('#grid'),items=directory?tacomaCategories():filtered;
 if(directory)tacomaBuildPreviews();
 const selected=directory?items.indexOf(tacomaCategory):items.findIndex(g=>g.id===presentationId);
 const rows=items.map((item,i)=>{
  const label=directory?(item||'All games'):item.title;
  const row=el('button','tc-row'+(directory?'':' game'));row.dataset.index=i;row.tabIndex=-1;row.setAttribute('aria-label',label);
  if(directory)row.dataset.category=item;else row.dataset.id=item.id;
  if(shelf){const img=el('img');img.alt='';img.loading='lazy';img.src=item.image;row.append(img);}
  else {const clip=el('span','tc-clip');clip.append(el('span','tc-label',label));row.append(clip);row.title=label;}

  row.onfocus=()=>{if(!row.classList.contains('presentation-selected'))tacomaSelect(i);};
  row.onclick=()=>{if(directory)tacomaOpenCategory(item);else {tacomaSelect(i);play(item.id,row);}};
  if(!directory)row.oncontextmenu=e=>{e.preventDefault();tacomaSelect(i);editGame(item);};
  return row;
 });
 grid.replaceChildren(...rows);$('#tacoma-art').replaceChildren();$('#tacoma-caption').textContent='';
 if(rows.length){tacomaSelect(Math.max(0,selected));tacomaReveal(grid.querySelector('.presentation-selected'));}
 else if(!query)grid.append(el('p','tc-empty',shelf?(tacomaPage?'Play a game to see it here.':'Mark games as favorites to see them here.'):'No games in this category.'));
 $('#empty').hidden=true;$('#load').hidden=true;
}
function tacomaPress(button){
 if(!button||matchMedia('(prefers-reduced-motion: reduce)').matches)return;
 const face=button.querySelector('img,b,.tc-clip')||button;
 face.getAnimations().filter(a=>a.id==='tacoma-press').forEach(a=>a.cancel());
 const animation=face.animate([{transform:'scale(.97)',opacity:.82},{transform:'scale(1)',opacity:1}],{duration:140,easing:'ease-out'});
 animation.id='tacoma-press';
}
function tacomaController(action){
 if(action==='genrePrev'||action==='genreNext'){tacomaPageTo(tacomaPage+(action==='genreNext'?1:-1));return true;}
 if(action==='back')return tacomaBack();
 if(action==='search'){if(tacomaDirectory())tacomaOpenCategory('');tacomaHeader(true);}
 const active=document.activeElement;
 if(active===$('#search')){if(action==='down'||action==='activate'){active.blur();native?.hideKeyboard?.();tacomaFocus();return true;}return false;}
 if(action==='activate'&&active?.matches('button')&&!active.closest('#grid')){active.click();return true;}
 const row=$('#grid .presentation-selected');
 const delta={down:1,up:-1,left:-1,right:1,pageDown:6,pageUp:-6}[action];
 if(delta!==undefined){if(row){const next=row.parentElement.children[Math.min(row.parentElement.children.length-1,Math.max(0,Number(row.dataset.index)+delta))];next?.focus({preventScroll:true});tacomaFocus();queueCarouselSave();}else tacomaFocus();return true;}
 if(action==='activate'){tacomaPress(row);(row||$('#grid .show-all-matches'))?.click();return true;}
 if(['edit','favorite'].includes(action)){const game=!tacomaDirectory()&&filtered.find(g=>g.id===presentationId);if(game){if(action==='edit')editGame(game);else toggleFavorite(game.id);}return true;}
 return false;
}
function tacomaHeader(open){
 document.body.classList.toggle('tc-header-open',open);
 const button=$('#tc-header-toggle');
 button.setAttribute('aria-expanded',String(open));
 button.setAttribute('aria-label',open?'Hide library controls':'Show library controls');
}
function initTacoma(){
 const bar=$('.topbar'),toggle=el('button','','···');
 toggle.id='tc-header-toggle';toggle.title='Library controls';bar.append(toggle);
 toggle.onclick=()=>tacomaHeader(toggle.getAttribute('aria-expanded')!=='true');
 tacomaHeader(false);
 for(const event of ['pointerdown','focusin'])document.addEventListener(event,e=>{
  if(document.body.classList.contains('tc-header-open')&&!bar.contains(e.target))tacomaHeader(false);
 });
 const main=$('#main'),head=el('div','tc-part tc-heading'),heading=el('h1'),next=el('button');heading.id='tacoma-heading';next.id='tacoma-next';next.onclick=()=>tacomaPageTo(tacomaPage+1);head.append(heading,next);
 const art=el('div','tc-part'),caption=el('div','tc-part'),hints=el('nav','tc-part');art.id='tacoma-art';caption.id='tacoma-caption';hints.id='tacoma-hints';
 for(const [key,label,act] of [['A','Open','activate'],['B','Back','back'],['X','Edit','edit'],['Y','Search','search'],['LB','Previous page','genrePrev'],['RB','Next page','genreNext']]){
  const b=el('button');b.append(el('b','',key),el('span','',label));b.onclick=()=>{if(act==='activate')($('#grid .presentation-selected')||$('#grid .show-all-matches'))?.click();else controller(act);};hints.append(b);
 }
 main.append(head,art,caption,hints);
 new ResizeObserver(()=>{if(presentation==='tacoma')tacomaMarquee();}).observe($('#grid'));
 document.fonts.addEventListener('loadingdone',()=>{if(presentation==='tacoma')tacomaMarquee();});
}
function tacomaMarquee(){
 const label=$('#grid .presentation-selected .tc-label');
 if(!label)return;
 const clip=label.parentElement,overflow=label.offsetWidth-clip.clientWidth;
 label.getAnimations().forEach(animation=>animation.cancel());
 if(overflow<=1||matchMedia('(prefers-reduced-motion: reduce)').matches)return;
 const travel=overflow/34*1000,total=travel*2+2800;
 label.animate([{transform:'translateX(0)',offset:0},{transform:'translateX(0)',offset:1600/total},
  {transform:'translateX(-'+overflow+'px)',offset:(1600+travel)/total},
  {transform:'translateX(-'+overflow+'px)',offset:(2800+travel)/total},{transform:'translateX(0)',offset:1}],
  {duration:total,iterations:Infinity});
}


