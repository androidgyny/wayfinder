let ithacaLevel='home',ithacaScope='all',ithacaIndex=0,ithacaGesture=null,ithacaFrame=0,ithacaPending=0,ithacaHold=0;
const ithacaHome=['All games','Categories','Favorites','Recently played','Shuffle'];
function ithacaItems(){return ithacaLevel==='home'?ithacaHome:ithacaLevel==='categories'?genres:filtered;}
function ithacaFilters(){
 if(presentation!=='ithaca')return;
 if(query&&ithacaLevel!=='games'){ithacaLevel='games';ithacaScope='all';ithacaIndex=0;}
 if(ithacaScope.startsWith('genre:')&&!genres.includes(ithacaScope.slice(6)))ithacaScope='all';
 genre=ithacaLevel==='games'&&ithacaScope.startsWith('genre:')?ithacaScope.slice(6):'';
 favoritesOnly=ithacaLevel==='games'&&ithacaScope==='favorites';
}
function ithacaArtwork(){
 if(ithacaLevel==='games')return filtered[ithacaIndex];
 const category=ithacaLevel==='categories'?genres[ithacaIndex]:null;
 return games.filter(g=>!category||g.genre===category).reduce((best,g)=>!best||(g.lastPlayed||0)>(best.lastPlayed||0)?g:best,null);
}
function ithacaStop(){
 ithacaGesture=null;ithacaPending=0;cancelAnimationFrame(ithacaFrame);ithacaFrame=0;clearTimeout(ithacaHold);
 $('#ithaca-wheel')?.classList.remove('turning');
}
function ithacaOpen(scope){ithacaStop();ithacaScope=scope;ithacaLevel='games';ithacaIndex=0;presentationId=null;update();ithacaFocus();refreshApplicableAppearanceControls();persist();}
function ithacaFocus(){($('#grid .presentation-selected')||$('#grid .show-all-matches')||$('#ithaca-menu'))?.focus({preventScroll:true});}
function ithacaBack(){
 ithacaStop();
 if(query||document.activeElement===$('#search')){query='';$('#search').value='';$('#search').blur();native?.hideKeyboard?.();update();}
 else if(ithacaLevel==='home')return false;
 else if(ithacaLevel==='games'&&ithacaScope.startsWith('genre:')){ithacaLevel='categories';ithacaIndex=Math.max(0,genres.indexOf(ithacaScope.slice(6)));update();}
 else{ithacaIndex=ithacaLevel==='categories'?1:Math.max(0,{all:0,favorites:2,recent:3}[ithacaScope]||0);ithacaLevel='home';update();}
 ithacaFocus();refreshApplicableAppearanceControls();persist();return true;
}
function ithacaPress(id){
 const button=$('#ithaca-'+id);
 if(!button||presentation!=='ithaca'||matchMedia('(prefers-reduced-motion: reduce)').matches)return;
 button.getAnimations().filter(a=>a.id==='ithaca-press').forEach(a=>a.cancel());
 const animation=button.animate([{opacity:.72},{opacity:1}],{duration:140,easing:'ease-out'});
 animation.id='ithaca-press';
}
function ithacaActivate(){
 if(topDialog()||presentation!=='ithaca')return;
 ithacaPress('play');
 if(ithacaLevel==='home'){
  if(ithacaIndex===1){ithacaLevel='categories';ithacaIndex=0;update();ithacaFocus();persist();}
  else if(ithacaIndex===4){ithacaOpen('all');if(filtered.length)ithacaSelect(Math.floor(Math.random()*filtered.length),true);}
  else ithacaOpen(['all','','favorites','recent'][ithacaIndex]);
 }else if(ithacaLevel==='categories'){if(genres[ithacaIndex])ithacaOpen('genre:'+genres[ithacaIndex]);}
 else if(filtered[ithacaIndex]){ithacaStop();play(filtered[ithacaIndex].id,$('#ithaca-play'));}
 else $('#grid .show-all-matches')?.click();
}
function ithacaSelect(index,focus=false){
 const items=ithacaItems();ithacaIndex=Math.max(0,Math.min(Math.max(0,items.length-1),index));
 if(ithacaLevel==='games'){presentationId=items[ithacaIndex]?.id||null;controllerGameId=presentationId;}
 ithacaDrawRows();ithacaSyncArt();if(focus)ithacaFocus();queueCarouselSave();
}
function ithacaMove(delta,focus=false){if(topDialog()||presentation!=='ithaca'||!ithacaItems().length)return;const next=Math.max(0,Math.min(ithacaItems().length-1,ithacaIndex+delta));if(next===ithacaIndex){if(focus)ithacaFocus();return;}ithacaSelect(next,focus);effect('select');}
function ithacaDrawRows(){
 const items=ithacaItems(),count=innerHeight<=420?4:5,start=Math.max(0,Math.min(ithacaIndex-2,items.length-count));
 const grid=$('#grid'),restoreFocus=grid.contains(document.activeElement);grid.replaceChildren();
 items.slice(start,start+count).forEach((item,j)=>{
  const index=start+j,name=ithacaLevel==='games'?item.title:item,row=el('button','ithaca-row'+(ithacaLevel==='games'?' game':'')+(index===ithacaIndex?' presentation-selected':''));
  row.dataset.index=index;if(ithacaLevel==='games')row.dataset.id=item.id;row.tabIndex=index===ithacaIndex?0:-1;row.setAttribute('aria-current',String(index===ithacaIndex));
  const clip=el('span','ithaca-clip'),label=el('span','ithaca-label',name);clip.append(label);row.append(clip);row.title=name;
  if(ithacaLevel!=='games')row.append(el('span','ithaca-arrow','›'));
  row.onclick=()=>{if(index!==ithacaIndex){ithacaSelect(index);return;}ithacaActivate();};
  row.oncontextmenu=e=>{e.preventDefault();if(ithacaLevel==='games'){ithacaSelect(index);ithacaStop();editGame(item);}};
  grid.append(row);
 });
 if(!items.length&&!query)grid.append(el('p','ithaca-empty',ithacaLevel==='categories'?'Add a game to create your first category.':ithacaScope==='recent'?'Play a game to see it here.':'No games here yet.'));
 if(query&&!items.length)syncSearchFeedback();
 if(restoreFocus)ithacaFocus();
 $('#ithaca-count').textContent=items.length?(ithacaIndex+1)+' / '+items.length:'0 / 0';
 const label=grid.querySelector('.presentation-selected .ithaca-label');
 if(label&&!matchMedia('(prefers-reduced-motion: reduce)').matches){const overflow=label.scrollWidth-label.parentElement.clientWidth;if(overflow>1){const travel=overflow/34*1000,total=travel*2+2800;label.animate([{transform:'translateX(0)',offset:0},{transform:'translateX(0)',offset:1600/total},{transform:`translateX(-${overflow}px)`,offset:(1600+travel)/total},{transform:`translateX(-${overflow}px)`,offset:(2800+travel)/total},{transform:'translateX(0)',offset:1}],{duration:total,iterations:Infinity});}}
}
function ithacaSyncArt(){
 const game=ithacaArtwork(),img=$('#ithaca-cover');img.hidden=!game;
 if(game){if(img.getAttribute('src')!==game.image)img.src=game.image;img.alt=game.title;}else img.removeAttribute('src');
 $('#ithaca-cover-empty').hidden=!!game;
 $('#ithaca-play-label').textContent=ithacaLevel==='games'?'PLAY':'OPEN';
}
function renderIthaca(){
 if(ithacaLevel==='games'){const index=filtered.findIndex(g=>g.id===presentationId);if(index>=0)ithacaIndex=index;}
 ithacaIndex=Math.max(0,Math.min(ithacaIndex,Math.max(0,ithacaItems().length-1)));
 if(ithacaLevel==='games'){presentationId=filtered[ithacaIndex]?.id||null;controllerGameId=presentationId;}
 $('#ithaca-heading').textContent=ithacaLevel==='home'?'Library':ithacaLevel==='categories'?'Categories':ithacaScope.startsWith('genre:')?ithacaScope.slice(6):{all:'All games',recent:'Recently played',favorites:'Favorites'}[ithacaScope]||'All games';
 ithacaDrawRows();ithacaSyncArt();$('#empty').hidden=true;$('#load').hidden=true;
}
function ithacaController(action){
 if(action==='back'){const handled=ithacaBack();ithacaPress('menu');return handled;}
 if(action==='search'){ithacaStop();if(ithacaLevel!=='games')ithacaOpen('all');return false;}
 if(document.activeElement===$('#search')){if(action==='down'||action==='activate'){$('#search').blur();native?.hideKeyboard?.();ithacaFocus();return true;}return false;}
 const delta={up:-1,down:1,left:-1,right:1,pageUp:-5,pageDown:5}[action];
 if(delta!==undefined){ithacaStop();ithacaMove(delta,true);ithacaPress(delta<0?'prev':'next');return true;}
 if(action==='genrePrev'||action==='genreNext'){const keys=['all',...genres.map(g=>'genre:'+g)],i=Math.max(0,keys.indexOf(ithacaScope));ithacaOpen(keys[(i+(action==='genreNext'?1:-1)+keys.length)%keys.length]);return true;}
 if(action==='activate'){const active=document.activeElement;if(active?.matches('button')&&!active.closest('#grid'))active.click();else ithacaActivate();return true;}
 if(action==='edit'||action==='favorite'){const g=ithacaLevel==='games'&&filtered[ithacaIndex];if(g){ithacaStop();if(action==='edit')editGame(g);else toggleFavorite(g.id);}return true;}
 return false;
}
function initIthaca(){
 const main=$('#main'),head=el('div','ithaca-part ithaca-head'),title=el('h2'),count=el('span');title.id='ithaca-heading';count.id='ithaca-count';head.append(title,count);
 const art=el('div','ithaca-part ithaca-art'),img=el('img'),empty=el('span','','Choose a game');img.id='ithaca-cover';empty.id='ithaca-cover-empty';art.append(img,empty);
 const wheel=el('div','ithaca-part');wheel.id='ithaca-wheel';wheel.oncontextmenu=e=>e.preventDefault();wheel.setAttribute('aria-label','Touch wheel. Trace clockwise or counterclockwise to browse.');
 const ring=el('div','ithaca-ring'),dot=el('span','ithaca-dot');ring.append(dot);ring.setAttribute('aria-hidden','true');
 const buttons=[['menu','MENU',()=>ithacaBack()],['prev','◀',()=>ithacaMove(-1)],['next','▶',()=>ithacaMove(1)],['play','Open',ithacaActivate]];
 for(const [id,label,fn] of buttons){const b=el('button','',label);b.id='ithaca-'+id;b.onclick=()=>{if(id!=='play')ithacaPress(id);fn();};if(id==='prev'||id==='next')b.setAttribute('aria-label',id==='prev'?'Previous title':'Next title');if(id==='play'){b.replaceChildren(el('span','ithaca-play-symbol'),el('span','','OPEN'));b.lastChild.id='ithaca-play-label';b.firstChild.setAttribute('aria-hidden','true');}else if(id==='prev'||id==='next'){b.textContent='';b.append(el('span','ithaca-skip'),el('span','ithaca-skip'));}wheel.append(b);}
 wheel.prepend(ring);const hints=el('div','ithaca-part ithaca-hints');
 for(const [label,action] of [['A Open','activate'],['B Back','back'],['X Edit','edit'],['Y Search','search']]){const b=el('button');b.append(el('b','ithaca-key',label[0]),el('span','',label.slice(2)));b.onclick=()=>action==='activate'?ithacaActivate():controller(action);hints.append(b);}
 main.append(head,art,wheel,hints);
 const location=e=>{const r=ring.getBoundingClientRect(),x=(e.clientX-r.left)/r.width*2-1,y=(e.clientY-r.top)/r.height*2-1;return {angle:Math.atan2(y,x),radius:Math.hypot(x,y)};};
 ring.onpointerdown=e=>{if(e.button!==0||presentation!=='ithaca'||topDialog()||ithacaGesture)return;const p=location(e);if(p.radius<.48||p.radius>1.04)return;e.preventDefault();ring.setPointerCapture(e.pointerId);ithacaGesture={id:e.pointerId,angle:p.angle,time:e.timeStamp,sum:0,started:false};wheel.style.setProperty('--wheel-radius',(ring.clientWidth*.40)+'px');wheel.classList.add('turning');wheel.style.setProperty('--wheel-angle',p.angle+'rad');};
 ring.onpointermove=e=>{
  const g=ithacaGesture;if(!g||g.id!==e.pointerId)return;
  if(presentation!=='ithaca'||topDialog()){ithacaStop();return;}e.preventDefault();const p=location(e);
  if(p.radius<.4||p.radius>1.3){g.angle=p.angle;g.time=e.timeStamp;g.sum=0;return;}
  let d=p.angle-g.angle;d=Math.atan2(Math.sin(d),Math.cos(d));const dt=Math.max(12,e.timeStamp-g.time);g.angle=p.angle;g.time=e.timeStamp;
  if(Math.abs(d)>1)return;wheel.style.setProperty('--wheel-angle',p.angle+'rad');
  if(!g.started){g.sum+=d;if(Math.abs(g.sum)<.12)return;g.started=true;g.sum=0;return;}
  const speed=Math.abs(d)/dt*1000,mult=speed>6?3:speed>3?2:1;g.sum+=d*mult;const n=Math.trunc(g.sum/.2);
  if(n){g.sum-=n*.2;ithacaPending+=n;if(!ithacaFrame)ithacaFrame=requestAnimationFrame(()=>{ithacaFrame=0;const step=ithacaPending;ithacaPending=0;if(ithacaGesture)ithacaMove(step);});}
 };
 const release=e=>{if(!ithacaGesture||e.pointerId!==ithacaGesture.id)return;if(ithacaPending)ithacaMove(ithacaPending);ithacaStop();persist();};
 ring.onpointerup=release;ring.onpointercancel=()=>ithacaStop();ring.onlostpointercapture=()=>ithacaStop();
 let longPress=false;const playButton=$('#ithaca-play');playButton.onpointerdown=e=>{if(e.button!==0)return;longPress=false;ithacaHold=setTimeout(()=>{const g=ithacaLevel==='games'&&filtered[ithacaIndex];if(g){longPress=true;ithacaStop();editGame(g);}},650);};
 for(const event of ['pointerup','pointercancel','pointerleave'])playButton.addEventListener(event,()=>clearTimeout(ithacaHold));
 playButton.onclick=()=>{if(!longPress)ithacaActivate();longPress=false;};
 let touchY=null;$('#grid').addEventListener('touchstart',e=>{if(presentation==='ithaca')touchY=e.touches[0]?.clientY;},{passive:true});
 $('#grid').addEventListener('touchmove',e=>{if(presentation!=='ithaca'||touchY===null)return;const y=e.touches[0].clientY,d=touchY-y;if(Math.abs(d)>28){e.preventDefault();touchY=y;ithacaMove(Math.trunc(d/28));}},{passive:false});
 for(const event of ['touchend','touchcancel'])$('#grid').addEventListener(event,()=>touchY=null);
 $('#grid').addEventListener('wheel',e=>{if(presentation==='ithaca'){e.preventDefault();ithacaMove(Math.sign(e.deltaY));}},{passive:false});
 window.addEventListener('blur',ithacaStop);document.addEventListener('visibilitychange',ithacaStop);
 new ResizeObserver(()=>{ithacaStop();if(presentation==='ithaca')ithacaDrawRows();}).observe($('#grid'));
 document.fonts.addEventListener('loadingdone',()=>{if(presentation==='ithaca')ithacaDrawRows();});
}
