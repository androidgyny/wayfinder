// A cinema lobby: one lit row of 2:3 poster cases under a marquee of changeable letters.
// Only cases near the view are mounted; the row moves with a single transform.
let cannesPitch=220,cannesCase=190,cannesEdge=28,cannesOffset=0,cannesMarqueeKey=null;
// Sizes are cached from resize callbacks so moving the selection never forces a layout read.
let cannesGridWidth=0,cannesBoardSize='',cannesMarqueeFrame=0;
const cannesDefaults={wall:'velvet',scale:'feature',plaques:'all'};
let cannesOptions={...cannesDefaults};
function setCannesOptions(value={},save=true){
 cannesOptions={
  wall:['midnight','noir'].includes(value?.wall)?value.wall:'velvet',
  scale:value?.scale==='compact'?'compact':'feature',
  plaques:value?.plaques==='selected'?'selected':'all'
 };
 for(const [key,option] of Object.entries(cannesOptions))$('#cannes-'+key).value=option;
 document.body.dataset.cannesWall=cannesOptions.wall;
 document.body.dataset.cannesPlaques=cannesOptions.plaques;
 if(presentation==='cannes'&&!restoring){sizeCannes();updateAppearancePreview();}
 if(save)persist();
}
function cannesFocus(){controllerFocus($('#grid .presentation-selected')||$('#grid .show-all-matches'),true);}
function cannesOpen(i){const list=sections(),s=list[(i+list.length)%list.length];if(!s)return;favoritesOnly=s.favorite;setGenre(s.genre,true);persist();}
function cannesSelect(i,focus=true){
 if(!filtered.length)return;
 const g=filtered[Math.max(0,Math.min(filtered.length-1,i))];
 presentationId=g.id;controllerGameId=presentationId;renderCannes();if(focus)cannesFocus();queueCarouselSave();
}
function cannesVisibleCount(){const grid=$('#grid');return Math.max(1,Math.floor((grid.clientWidth-cannesEdge*2+(cannesPitch-cannesCase))/cannesPitch));}
function cannesShown(t){
 if(!t)return 'Not yet screened';
 const days=Math.floor((Date.now()-t)/86400000);
 return days<1?'Shown today':days===1?'Shown yesterday':days<14?'Shown '+days+' days ago':'Shown '+Math.floor(days/7)+' weeks ago';
}
function cannesKicker(){
 const n=filtered.length,count=n.toLocaleString()+(searchSummary?(n===1?' match':' matches'):(n===1?' game':' games'));
 const lead=favoritesOnly?'Feature presentation':genre?'Now showing · Screen '+(genres.indexOf(genre)+1):'Now showing · All screens';
 return lead+' · '+count;
}
// Letters are set once per label; the size is found by a short binary search.
function cannesMarquee(force=false){
 const box=$('#cannes-letters'),board=$('#cannes-board');if(!box||!board)return;
 const label=sectionLabel().replace('★ ',''),kicker=cannesKicker(),key=label+'|'+kicker+'|'+cannesBoardSize;
 if(!force&&key===cannesMarqueeKey)return;
 $('#cannes-kicker').textContent=kicker;
 const list=sections(),i=sectionIndex();
 $('#cannes-prev-name').textContent=list[(i-1+list.length)%list.length].label.replace('★ ','');
 $('#cannes-next-name').textContent=list[(i+1)%list.length].label.replace('★ ','');
 const changed=!cannesMarqueeKey||cannesMarqueeKey.split('|')[0]!==label;cannesMarqueeKey=key;
 box.setAttribute('aria-label',label);
 box.replaceChildren(...label.toUpperCase().split(/\s+/).filter(Boolean).flatMap((word,wi)=>{
  const w=el('span','cannes-word');w.setAttribute('aria-hidden','true');
  [...word].forEach((ch,ci)=>{const l=el('span','cannes-letter',ch);l.style.setProperty('--lift',((((wi*7+ci*13)%5)-2)*.4)+'px');w.append(l);});
  return wi?[document.createTextNode(' '),w]:[w];
 }));
 const fit=()=>{
  const limit=board.clientHeight-$('#cannes-kicker').offsetHeight-8;
  let low=10,high=Math.max(10,Math.floor(limit*.86));
  while(low<high){const mid=Math.ceil((low+high)/2);box.style.fontSize=mid+'px';if(box.scrollHeight<=limit&&box.scrollWidth<=box.clientWidth)low=mid;else high=mid-1;}
  box.style.fontSize=low+'px';return low;
 };
 // On short boards the category name matters more than the screen number and count.
 board.classList.remove('cannes-tight');
 if(fit()<18){board.classList.add('cannes-tight');fit();}
 if(changed&&!matchMedia('(prefers-reduced-motion: reduce)').matches)board.animate([{filter:'brightness(.8)'},{filter:'none'}],{duration:160,easing:'steps(2)'});
}
function sizeCannes(){
 if(presentation!=='cannes')return;
 const grid=$('#grid'),w=grid.clientWidth,h=grid.clientHeight;if(!w||!h)return;
 cannesGridWidth=w;cannesEdge=w<640?16:28;
 const byHeight=(h-20-14-60)/1.5,byWidth=(w-cannesEdge*2)/2.4-14;
 const art=Math.max(40,Math.floor(Math.min(byHeight,byWidth)*(cannesOptions.scale==='compact'?.76:1)));
 const pitch=cannesPitch;cannesCase=art+14;cannesPitch=cannesCase+Math.max(16,Math.round(cannesCase*.14));
 grid.style.setProperty('--cannes-art',art+'px');grid.style.setProperty('--cannes-pitch',cannesPitch+'px');grid.style.setProperty('--cannes-edge',cannesEdge+'px');
 cannesMarquee();
 // A new pitch changes which cases are near the view; remount them without animating.
 if(pitch!==cannesPitch){const strip=grid.querySelector('.cannes-strip');if(strip)delete strip.dataset.context;renderCannes();}else cannesPlace(true);
}
// Centre the selection where possible; the ends of the row stay against the wall's edges.
function cannesTarget(index){
 const width=cannesGridWidth||$('#grid').clientWidth,total=filtered.length*cannesPitch-(cannesPitch-cannesCase)+cannesEdge*2;
 return Math.max(0,Math.min(Math.max(0,total-width),cannesEdge+index*cannesPitch+cannesCase/2-width/2));
}
function cannesPlace(instant){
 const strip=$('#grid .cannes-strip');if(!strip)return;
 const index=Math.max(0,filtered.findIndex(g=>g.id===presentationId));
 cannesOffset=cannesTarget(index);
 if(instant||matchMedia('(prefers-reduced-motion: reduce)').matches){strip.classList.add('cannes-instant');strip.style.transform=`translate3d(${-cannesOffset}px,0,0)`;void strip.offsetWidth;strip.classList.remove('cannes-instant');}
 else strip.style.transform=`translate3d(${-cannesOffset}px,0,0)`;
}
function renderCannes(){
 window.queueRecentPolish?.();
 const grid=$('#grid'),index=Math.max(0,filtered.findIndex(g=>g.id===presentationId)),current=filtered[index];
 presentationId=current?.id||null;controllerGameId=presentationId;
 const context=JSON.stringify([genre,favoritesOnly,query,sort,filtered.length]);
 let strip=grid.querySelector('.cannes-strip');
 if(!strip){grid.replaceChildren();strip=el('div','cannes-strip');grid.append(strip);}
 const fresh=strip.dataset.context!==context;strip.dataset.context=context;
 const previous=fresh?null:cannesOffset,target=cannesTarget(index);
 // Mount the cases between the old and new views, plus a margin for touch and held movement.
 const view=cannesGridWidth||grid.clientWidth,from=Math.min(previous??target,target)-view*.5,to=Math.max(previous??target,target)+view*1.5;
 const first=Math.max(0,Math.floor((from-cannesEdge)/cannesPitch)),last=Math.min(filtered.length-1,Math.ceil((to-cannesEdge)/cannesPitch));
 const existing=new Map([...strip.querySelectorAll('.game')].map(b=>[b.dataset.id,b])),keep=new Set();
 for(let i=first;i<=last&&current;i++){
  const g=filtered[i];let b=existing.get(g.id);
  if(!b){b=card(g);b.classList.add('cannes-case');const plate=el('span','cannes-plate');plate.append(el('span','cannes-plate-title'));b.append(plate);
   b.onfocus=()=>{if(presentation==='cannes'&&document.body.dataset.input==='controller'&&presentationId!==b.dataset.id)cannesSelect(filtered.findIndex(item=>item.id===b.dataset.id),false);};strip.append(b);}
  syncGameCard(b,g);b.title=g.title;b.style.setProperty('--cannes-i',i);
  const on=g.id===presentationId;b.classList.toggle('presentation-selected',on);b.classList.remove('controller-selected');b.tabIndex=on?0:-1;b.setAttribute('aria-current',String(on));
  const title=b.querySelector('.cannes-plate-title');if(title.textContent!==g.title)title.textContent=g.title;
  keep.add(b);
 }
 for(const b of existing.values())if(!keep.has(b))b.remove();
 strip.style.width=(filtered.length*cannesPitch-(cannesPitch-cannesCase)+cannesEdge*2)+'px';
 cannesPlace(fresh);
 grid.querySelector('.cannes-empty')?.remove();
 if(!current){const sign=el('div','cannes-empty');sign.append(el('b','','Dark tonight'),el('p','',query?'No matching titles.':favoritesOnly?'Press Select on any game to feature it here.':'Add a game to begin your collection.'));grid.append(sign);}
 $('#cannes-title').textContent=current?current.title:sectionLabel().replace('★ ','');
 $('#cannes-meta').textContent=current?current.genre:'Nothing scheduled';
 $('#cannes-shown').textContent=current?(current.favorite?'★ ':'')+cannesShown(current.lastPlayed):'No showings';
 $('#cannes-position').textContent=current?`${(index+1).toLocaleString()} of ${filtered.length.toLocaleString()}`:'';
 for(const b of document.querySelectorAll('[data-cannes-game]'))b.disabled=!current;
 document.body.classList.toggle('cannes-dark',!current);
 // Search feedback depends on the filtered set, not on which case is selected.
 cannesMarquee();$('#load').hidden=true;$('#empty').hidden=true;if(fresh||query)syncSearchFeedback();resetPresentationScroll();
}
function cannesBack(){
 if(document.activeElement===$('#search')){native?.hideKeyboard?.();$('#search').blur();}
 if(query){query='';$('#search').value='';update();cannesFocus();persist();return true;}
 return false;
}
function cannesController(action){
 if(['search','menu','apps'].includes(action))return false;
 if(action==='back')return cannesBack();
 const active=document.activeElement;
 if(active?.matches('input,textarea,select')){if(['down','activate'].includes(action)){active.blur();native?.hideKeyboard?.();cannesFocus();return true;}return false;}
 if(action==='activate'&&active?.matches('button')&&!active.closest('#grid')){active.click();return true;}
 // One row: the vertical axis and the bumpers both change screens.
 if(['genrePrev','genreNext','up','down'].includes(action)){cannesOpen(sectionIndex()+(['genreNext','down'].includes(action)?1:-1));cannesFocus();return true;}
 const index=Math.max(0,filtered.findIndex(g=>g.id===presentationId)),page=cannesVisibleCount();
 const delta={left:-1,right:1,pageUp:-page,pageDown:page}[action];
 if(delta!==undefined){if(filtered.length)cannesSelect(index+delta);else cannesFocus();return true;}
 const game=filtered.find(g=>g.id===presentationId);
 if(['activate','edit','favorite'].includes(action)){if(game){if(action==='activate')play(game.id,$('#grid .presentation-selected'));else if(action==='edit')editGame(game);else{toggleFavorite(game.id);cannesFocus();}}return true;}
 return false;
}
function initCannes(){
 for(const key of Object.keys(cannesDefaults)){
  $('#cannes-'+key).onchange=e=>setCannesOptions({...cannesOptions,[key]:e.target.value});
 }
 const marquee=el('header','cannes-part');marquee.id='cannes-marquee';
 const side=(direction)=>{const b=el('button','cannes-side cannes-'+direction),name=el('span','cannes-side-name'),bumper=el('b','',direction==='prev'?'LB':'RB');name.id='cannes-'+direction+'-name';
  b.setAttribute('aria-label',direction==='prev'?'Previous category':'Next category');if(direction==='prev')b.append(name,bumper);else b.append(bumper,name);
  b.onclick=()=>cannesController(direction==='prev'?'genrePrev':'genreNext');return b;};
 const frame=el('div','cannes-frame'),board=el('div','cannes-board'),kicker=el('p'),letters=el('h1');
 board.id='cannes-board';kicker.id='cannes-kicker';letters.id='cannes-letters';board.append(kicker,letters);frame.append(board);
 marquee.append(side('prev'),frame,side('next'));
 const footer=el('nav','cannes-part');footer.id='cannes-footer';footer.setAttribute('aria-label','Game controls');
 const now=el('div','cannes-now'),title=el('h2'),meta=el('p');title.id='cannes-title';meta.id='cannes-meta';now.append(title,meta);
 const ticket=el('div','cannes-ticket'),shown=el('span'),pos=el('small');shown.id='cannes-shown';pos.id='cannes-position';ticket.append(shown,pos);
 const hints=el('span','cannes-hints');
 for(const [key,label,action] of [['A','Play','activate'],['X','Edit','edit'],['Y','Search','search'],['SEL','Favorite','favorite']]){
  const b=el('button','cannes-hint');b.append(el('b','',key),el('span','',label));
  b.onclick=()=>{if(action==='search')controller(action);else{cannesFocus();cannesController(action);}};
  if(action!=='search')b.dataset.cannesGame='true';hints.append(b);
 }
 footer.append(now,ticket,hints);$('#main').append(marquee,footer);
 new ResizeObserver(entries=>{const r=entries[entries.length-1].contentRect,size=Math.round(r.width)+'x'+Math.round(r.height);if(size===cannesBoardSize)return;cannesBoardSize=size;cancelAnimationFrame(cannesMarqueeFrame);cannesMarqueeFrame=requestAnimationFrame(()=>{cannesMarqueeFrame=0;if(presentation==='cannes')cannesMarquee();});}).observe(board);
 document.fonts.ready.then(()=>{if(presentation==='cannes')cannesMarquee(true);});
 const grid=$('#grid');let drag=null,ignoreUntil=0,lastWheel=0,coastFrame=0;
 const indexAt=offset=>{
  if(offset<=0)return 0;
  if(offset>=cannesTarget(filtered.length-1))return filtered.length-1;
  return Math.round((offset+cannesGridWidth/2-cannesEdge-cannesCase/2)/cannesPitch);
 };
 const moveWall=(strip,offset)=>{
  const index=indexAt(offset);
  if(filtered[index]&&presentationId!==filtered[index].id){
   presentationId=filtered[index].id;renderCannes();
  }
  cannesOffset=offset;
  strip.style.transform=`translate3d(${-offset}px,0,0)`;
 };
 grid.addEventListener('pointerdown',e=>{
  if(presentation!=='cannes'||e.pointerType!=='touch'||!e.isPrimary||!filtered.length)return;
  const strip=grid.querySelector('.cannes-strip');
  if(!strip||!cannesTarget(filtered.length-1))return;
  const braking=Boolean(coastFrame);
  cancelAnimationFrame(coastFrame);coastFrame=0;
  ignoreUntil=0;
  const start=-new DOMMatrixReadOnly(getComputedStyle(strip).transform).m41;
  drag={id:e.pointerId,strip,x:e.clientX,y:e.clientY,start,lastX:e.clientX,time:e.timeStamp,speed:0,active:braking,
   index:filtered.findIndex(g=>g.id===presentationId)};
  if(braking)grid.setPointerCapture(e.pointerId);
 });
 grid.addEventListener('pointermove',e=>{
  if(!drag||e.pointerId!==drag.id)return;
  const dx=e.clientX-drag.x,dy=e.clientY-drag.y;
  if(!drag.active){
   if(Math.max(Math.abs(dx),Math.abs(dy))<6)return;
   if(Math.abs(dx)<=Math.abs(dy)||presentation!=='cannes'){drag=null;return;}
   drag.active=true;
   grid.setPointerCapture(e.pointerId);
   drag.strip.classList.add('cannes-dragging');
  }
  const offset=Math.max(0,Math.min(cannesTarget(filtered.length-1),drag.start-dx));
  const elapsed=Math.max(1,e.timeStamp-drag.time),velocity=(drag.lastX-e.clientX)/elapsed;
  const weight=Math.exp(-elapsed/35);
  drag.speed=drag.speed*weight+velocity*(1-weight);
  drag.lastX=e.clientX;drag.time=e.timeStamp;
  moveWall(drag.strip,offset);
 });
 const finishDrag=e=>{
  if(!drag||e.pointerId!==drag.id)return;
  if(e.type==='lostpointercapture'&&e.target!==grid)return;
  const gesture=drag;drag=null;
  if(!gesture.active)return;
  const strip=gesture.strip;
  if(presentation!=='cannes'||!strip.isConnected){strip.classList.remove('cannes-dragging');return;}
  ignoreUntil=performance.now()+400;
  const flick=e.type==='pointerup'&&e.timeStamp-gesture.time<90&&!matchMedia('(prefers-reduced-motion: reduce)').matches;
  const travel=gesture.x-gesture.lastX;
  const speed=Math.min(8,Math.abs(gesture.speed));
  const direction=Math.sign(travel);
  const fling=flick&&Math.abs(travel)>=Math.max(58,cannesPitch*.32)&&speed>=.65;
  const snap=index=>{strip.classList.remove('cannes-dragging');cannesSelect(index,false);};
  if(!fling){
   let index=indexAt(cannesOffset);
   if(Math.abs(travel)<cannesPitch*.7&&e.type==='pointerup'){
    index=gesture.index+(Math.abs(travel)>=Math.min(32,cannesPitch*.2)?direction:0);
   }
   snap(index);return;
  }
  // Constant deceleration: doubling release speed quadruples the coasting distance.
  const start=cannesOffset,duration=Math.min(2400,speed/.003);
  const distance=gesture.speed>0?speed*duration/2:-speed*duration/2;
  const limit=cannesTarget(filtered.length-1),begin=performance.now(),context=strip.dataset.context;
  let last=start;
  const advance=now=>{
   coastFrame=0;
   if(!strip.isConnected||presentation!=='cannes'||strip.dataset.context!==context||cannesOffset!==last||
      document.body.dataset.input==='controller'||document.querySelector('dialog[open]')){
    strip.classList.remove('cannes-dragging');return;
   }
   const t=Math.min(1,(now-begin)/duration);
   last=Math.max(0,Math.min(limit,start+distance*t*(2-t)));
   moveWall(strip,last);
   if(t===1||last===0||last===limit)snap(indexAt(last));
   else coastFrame=requestAnimationFrame(advance);
  };
  coastFrame=requestAnimationFrame(advance);
 };
 for(const event of ['pointerup','pointercancel','lostpointercapture'])grid.addEventListener(event,finishDrag);
 grid.addEventListener('click',e=>{if(presentation==='cannes'&&performance.now()<ignoreUntil&&e.detail){e.preventDefault();e.stopImmediatePropagation();}},true);
 grid.addEventListener('wheel',e=>{if(presentation!=='cannes'||e.ctrlKey||Math.abs(e.deltaY)+Math.abs(e.deltaX)<10)return;e.preventDefault();if(performance.now()-lastWheel<200)return;lastWheel=performance.now();cannesController((Math.abs(e.deltaX)>Math.abs(e.deltaY)?e.deltaX:e.deltaY)>0?'pageDown':'pageUp');},{passive:false});
}
