// The carousel moves covers with transforms; browser scrolling must not move its stage.
function resetPresentationScroll(){
 if(presentation==='library'||presentation==='seattle'||presentation==='vienna'||presentation==='prague'||presentation==='copenhagen'||presentation==='oxford'||presentation==='berlin'||presentation==='ulm'||presentation==='cambridge')return;
 for(const node of [$('#grid'),$('#main'),$('.shell'),document.scrollingElement]){if(node){node.scrollLeft=0;node.scrollTop=0}}
}
function presentationPageSize(){return Math.max(12,Math.ceil(filtered.length/10))}
function sizePresentation(){
 if(['tokyo','oxford'].includes(presentation))sizeTokyoCover();
 if(presentation==='library'||presentation==='seattle'||presentation==='vienna'||presentation==='prague'||presentation==='copenhagen'||presentation==='oxford'||presentation==='berlin'||presentation==='ulm'||presentation==='cambridge')return;
 const height=$('#grid').clientHeight;
 const width=Math.max(32,Math.floor(Math.min(innerWidth*(presentation==='venice'?.23:.38),(height-(presentation==='venice'?60:presentation==='cupertino'?84:34))/1.5)));
 if($('#grid').style.getPropertyValue('--tile')!==width+'px')$('#grid').style.setProperty('--tile',width+'px');
}
function setPresentation(value){
 rememberCategoryPlace();renderedCategoryKey=null;
 finishCopenhagenDrag(true);stopCarouselMotion();
 if(value==='ulm'&&presentation!=='ulm'){ulmLevel='categories';query='';$('#search').value='';ulmSearchOpen=false;}
 if(value==='vienna'||value==='prague'||value==='copenhagen'){genre='';favoritesOnly=false;}
 if(value==='seattle'&&presentation!=='seattle'){genre='';favoritesOnly=false;query='';$('#search').value='';seattleBrowse=false;}
 const next=['kyoto','cupertino','tokyo','seattle','vienna','prague','copenhagen','oxford','berlin','ulm','venice','cambridge'].includes(value)?value:'library';
 // Reuse cards only within a layout; shelf containers belong to Seattle.
 if(next!==presentation)$('#grid').replaceChildren();
 presentation=next;
 document.body.dataset.presentation=presentation;$('#presentation').value=presentation;
 refreshLayoutControls();if(presentation!=='ulm'){$('#ulm-cover').removeAttribute('src');}if(presentation!=='cambridge')$('#cambridge-cover').removeAttribute('src');
 closeMenu();window.scrollTo(0,0);sizePresentation();update();refreshCupertinoControls();refreshOxfordControls();persist();
}
function selectPresentation(id){stopCarouselMotion();presentationId=id;renderPresentation();controllerFocus($('#grid .presentation-selected'));persist()}
function movePresentation(delta,focus=false){
 stopCarouselMotion();
 if(!filtered.length)return;
 let index=Math.max(0,filtered.findIndex(g=>g.id===presentationId));
 index=Math.max(0,Math.min(filtered.length-1,index+delta));
 presentationId=filtered[index].id;renderPresentation();
 if(focus)controllerFocus($('#grid .presentation-selected'));queueCarouselSave();
}
function renderPresentation(){if(presentation==='cambridge'){renderCambridge();return;}if(presentation==='copenhagen'){renderCopenhagen();return;}if(presentation==='prague'){renderPrague();return;}if(presentation==='ulm'){renderUlm();return;}if(presentation==='berlin'){renderBerlin();return;}if(presentation==='oxford'){renderOxford();return;}if(presentation==='vienna'){renderVienna();return;}if(presentation==='seattle'){renderSeattle();return;}
 let index=filtered.findIndex(g=>g.id===presentationId);if(index<0)index=0;
 const current=filtered[index];presentationId=current?.id||null;
 const options=sections(),gi=sectionIndex();
 const categoryLabel=sectionLabel(),changed=$('#category-current').textContent!==categoryLabel;
 $('#category-current').textContent=categoryLabel;
 if(changed&&!matchMedia('(prefers-reduced-motion: reduce)').matches)$('#category-current').animate([{opacity:.2,transform:'translateX(25px)'},{opacity:1,transform:'translateX(0)'}],{duration:200});
 $('#category-before').textContent=options[(gi-1+options.length)%options.length].label;
 $('#category-after').textContent=options[(gi+1)%options.length].label;
 $('#presentation-title').textContent=current?.title||(favoritesOnly&&!query?'No favorites yet':'No games found');setFavoriteButton($('#presentation-favorite'),current);
 const preview=$('#tokyo-art');preview.hidden=!current;
 if(presentation==='tokyo'&&current&&preview.getAttribute('src')!==current.image)preview.src=current.image;
 preview.alt=current?current.title+' cover':'';
 $('#presentation-prev').textContent=presentation==='tokyo'?'↑':'‹';$('#presentation-next').textContent=presentation==='tokyo'?'↓':'›';

 $('#presentation-position').textContent=current?`${index+1} / ${filtered.length.toLocaleString()} · ${current.genre}`:(favoritesOnly&&!query?'Choose a game and press its star or press Select.':'Try another search or category');
 $('#presentation-seek').max=Math.max(1,filtered.length);$('#presentation-seek').value=index+1;$('#presentation-seek').disabled=!current;$('#presentation-seek-position').textContent=current?`${index+1} / ${filtered.length}`:'0 / 0';$('#presentation-first').disabled=!current||index===0;$('#presentation-last').disabled=!current||index===filtered.length-1;
 $('#presentation-play').disabled=!current;$('#presentation-edit').disabled=!current;
 const existing=new Map([...document.querySelectorAll('#grid .game')].map(b=>[b.dataset.id,b]));
 const keep=new Set();
 const radius=presentation==='venice'?3:5;
 for(let i=Math.max(0,index-radius);i<=Math.min(filtered.length-1,index+radius);i++){
  const b=existing.get(filtered[i].id)||card(filtered[i]),offset=i-index;syncGameCard(b,filtered[i]);
  b.classList.toggle('presentation-selected',offset===0);b.classList.remove('controller-selected');b.style.setProperty('--offset',offset);
  b.style.setProperty('--distance',Math.abs(offset));b.style.setProperty('--side',Math.sign(offset));
  b.style.zIndex=String(10-Math.abs(offset));b.tabIndex=offset===0?0:-1;
  b.querySelector('img').loading='eager';keep.add(b);b.dataset.carouselIndex=i;if(b.parentElement!==$('#grid'))$('#grid').append(b);
 }
 for(const b of existing.values())if(!keep.has(b))b.remove();resetPresentationScroll();$('#load').hidden=true;$('#empty').hidden=true;
 $('#presentation-prev').disabled=!current||index===0;$('#presentation-next').disabled=!current||index===filtered.length-1;
}
function initPresentation(){
 initBerlin();initUlm();initCopenhagen();initCambridge();
 $('#presentation').onchange=e=>{setPresentation(e.target.value);effect('select')};
 $('#category-before').onclick=()=>controller('genrePrev');$('#category-after').onclick=()=>controller('genreNext');$('#category-current').onclick=()=>controller('genreNext');
 $('#presentation-prev').onclick=()=>movePresentation(-1,true);$('#presentation-next').onclick=()=>movePresentation(1,true);
 $('#presentation-play').onclick=()=>{if(presentationId)play(presentationId,$('#grid .presentation-selected'))};
 $('#presentation-edit').onclick=()=>{const g=filtered.find(g=>g.id===presentationId);if(g)editGame(g)};
 $('#presentation-seek').oninput=e=>{const index=Number(e.target.value)-1;if(filtered[index]){presentationId=filtered[index].id;renderPresentation();persist()}};
 $('#presentation-first').onclick=()=>movePresentation(-filtered.length,true);
 $('#presentation-last').onclick=()=>movePresentation(filtered.length,true);
 function swipeSurface(surface,category){
  let start=null,ignoreUntil=0;
  surface.addEventListener('pointerdown',e=>{if((category||presentation==='tokyo')&&presentation!=='library'&&presentation!=='seattle'&&(e.pointerType==='touch'||!e.pointerType)){start={x:e.clientX,y:e.clientY,time:performance.now()}}});
  surface.addEventListener('pointerup',e=>{
   if(!start)return;const dx=e.clientX-start.x,dy=e.clientY-start.y,elapsed=Math.max(1,performance.now()-start.time);start=null;
   if(!category&&presentation==='tokyo'&&Math.abs(dy)>35&&Math.abs(dy)>Math.abs(dx)){
    ignoreUntil=performance.now()+450;
    const steps=Math.min(presentationPageSize(),Math.max(1,Math.round(Math.abs(dy)/75*(elapsed<250?2:1))));
    movePresentation((dy<0?1:-1)*steps,true);
   }else if(Math.abs(dx)>35&&Math.abs(dx)>Math.abs(dy)){
    ignoreUntil=performance.now()+450;
    if(category||presentation==='tokyo')controller(dx<0?'genreNext':'genrePrev');
    else {const steps=Math.min(presentationPageSize(),Math.max(1,Math.round(Math.abs(dx)/90*(elapsed<250?2:1))));movePresentation((dx<0?1:-1)*steps,true)}
   }
  });
  surface.addEventListener('pointercancel',()=>start=null);
  surface.addEventListener('click',e=>{if(e.detail!==0&&performance.now()<ignoreUntil){e.stopImmediatePropagation();e.preventDefault()}},true);
 }
 initCarouselMotion();swipeSurface($('#grid'),false);swipeSurface($('#category-strip'),true);
 new ResizeObserver(sizeTokyoCover).observe($('#tokyo-preview'));
 new ResizeObserver(sizePresentation).observe($('#grid'));
 window.addEventListener('resize',sizePresentation);
}

let carouselMotion=null,carouselFrame=0,carouselSaveTimer=0;
function queueCarouselSave(){clearTimeout(carouselSaveTimer);carouselSaveTimer=setTimeout(persist,180)}
function stopCarouselMotion(){cancelAnimationFrame(carouselFrame);carouselFrame=0;if(!carouselMotion)return;carouselMotion=null;for(const b of $('#grid').querySelectorAll('.game')){b.style.removeProperty('transform');b.style.removeProperty('opacity');b.style.removeProperty('visibility')}$('#grid').classList.remove('fluid-motion');if(['kyoto','cupertino','venice'].includes(presentation)){renderPresentation();if(!document.querySelector('dialog[open]')&&!document.activeElement?.matches('input,textarea,select'))$('#grid .presentation-selected')?.focus({preventScroll:true});}}
function initCarouselMotion(){
 const grid=$('#grid');let drag=null,ignoreUntil=0;
 grid.addEventListener('dragstart',e=>{if(presentation==='venice')e.preventDefault()});
 const clamp=n=>Math.max(0,Math.min(filtered.length-1,n));
 function paint(position){
  if(!carouselMotion)return;position=clamp(position);carouselMotion.position=position;
  const index=Math.round(position);presentationId=filtered[index].id;
  // Recycle only the small visible window. No header rebuilding, layout reads,
  // focus changes, or hidden full-size preview requests while the row is moving.
  if(carouselMotion.windowIndex!==index){
   const existing=new Map([...grid.querySelectorAll('.game')].map(b=>[Number(b.dataset.carouselIndex),b]));
   const radius=presentation==='venice'?4:7;
   for(let i=Math.max(0,index-radius);i<=Math.min(filtered.length-1,index+radius);i++){
    if(!existing.has(i)){const b=card(filtered[i]);b.dataset.carouselIndex=i;b.tabIndex=-1;b.querySelector('img').loading='eager';grid.append(b);}
   }
   for(const [i,b] of existing)if(Math.abs(i-index)>radius)b.remove();carouselMotion.windowIndex=index;
   $('#presentation-title').textContent=filtered[index].title;
  }
  const tile=carouselMotion.tile;
  for(const b of grid.querySelectorAll('.game')){const offset=Number(b.dataset.carouselIndex)-position,distance=Math.abs(offset),side=Math.max(-1,Math.min(1,offset));
   b.style.transform=presentation==='venice'?veniceTransform(offset,tile):presentation==='cupertino'?`translate3d(${offset*tile*cupertinoPitch()+side*cupertinoGap()}px,0,${35*Math.max(0,1-distance)-48*distance}px) rotateY(${side*-48}deg)`:`translate3d(${offset*(tile+22)}px,0,0)`;
   if(presentation==='venice'){b.style.visibility=distance>3.5?'hidden':'visible';b.classList.toggle('presentation-selected',Math.round(Number(b.dataset.carouselIndex))===index);}
   b.style.opacity=String(coverBrightness==='even'?1:1-.35*Math.min(1,distance));b.style.zIndex=String(100-Math.round(distance*10));
  }
 }
 function settle(){if(!carouselMotion)return;const from=carouselMotion.position,to=Math.round(from),start=performance.now();function step(now){if(!carouselMotion)return;const t=Math.min(1,(now-start)/140);paint(from+(to-from)*(1-Math.pow(1-t,3)));if(t<1)carouselFrame=requestAnimationFrame(step);else{stopCarouselMotion();queueCarouselSave();}}carouselFrame=requestAnimationFrame(step);}
 function coast(velocity){let last=performance.now();function step(now){if(!carouselMotion)return;const dt=Math.min(40,now-last);last=now;const before=carouselMotion.position;paint(before+velocity*dt);velocity*=Math.exp(-dt/260);if(Math.abs(velocity)<.0003||carouselMotion.position===0||carouselMotion.position===filtered.length-1){settle();return}carouselFrame=requestAnimationFrame(step);}carouselFrame=requestAnimationFrame(step);}
 grid.addEventListener('pointerdown',e=>{if(!['kyoto','cupertino','venice'].includes(presentation)||!filtered.length||e.button>0)return;if(carouselMotion)ignoreUntil=performance.now()+500;const position=carouselMotion?.position??Math.max(0,filtered.findIndex(g=>g.id===presentationId));stopCarouselMotion();const tile=parseFloat(getComputedStyle(grid).getPropertyValue('--tile'));drag={id:e.pointerId,x:e.clientX,y:e.clientY,lastX:e.clientX,lastTime:performance.now(),velocity:0,position,tile,pitch:presentation==='venice'?tile*.57:presentation==='cupertino'?tile*cupertinoPitch():tile+22,moved:false};});
 grid.addEventListener('pointermove',e=>{if(!drag||drag.id!==e.pointerId)return;const dx=e.clientX-drag.x,dy=e.clientY-drag.y;if(!drag.moved){if(Math.abs(dx)<7)return;if(Math.abs(dy)>Math.abs(dx)){drag=null;return;}drag.moved=true;carouselMotion={position:drag.position,tile:drag.tile};grid.classList.add('fluid-motion');grid.setPointerCapture(e.pointerId);document.body.dataset.input='touch';}
  const now=performance.now(),dt=now-drag.lastTime;if(dt>0)drag.velocity=.55*drag.velocity+.45*(drag.lastX-e.clientX)/drag.pitch/dt;drag.lastX=e.clientX;drag.lastTime=now;drag.pending=drag.position-dx/drag.pitch;if(!carouselFrame)carouselFrame=requestAnimationFrame(()=>{carouselFrame=0;if(drag&&carouselMotion)paint(drag.pending)});e.preventDefault();
 });
 function end(e,cancel=false){if(!drag||drag.id!==e.pointerId)return;const d=drag;cancelAnimationFrame(carouselFrame);carouselFrame=0;if(d.moved&&d.pending!==undefined)paint(d.pending);drag=null;if(grid.hasPointerCapture(e.pointerId))grid.releasePointerCapture(e.pointerId);if(!d.moved)return;ignoreUntil=performance.now()+500;if(cancel||performance.now()-d.lastTime>110||matchMedia('(prefers-reduced-motion: reduce)').matches)settle();else coast(Math.max(-.05,Math.min(.05,d.velocity)));}
 grid.addEventListener('pointerup',e=>end(e));grid.addEventListener('pointercancel',e=>end(e,true));
 grid.addEventListener('click',e=>{if(e.detail!==0&&(performance.now()<ignoreUntil||carouselMotion)){e.preventDefault();e.stopImmediatePropagation();}},true);
 window.addEventListener('blur',()=>{drag=null;stopCarouselMotion();});
 document.addEventListener('visibilitychange',()=>{if(document.hidden){drag=null;stopCarouselMotion();}});
}

function syncGameCard(b,g){
 const image=b.querySelector('.cover img');if(image.getAttribute('src')!==g.image)image.src=g.image;
 const title=b.querySelector('.game-title'),category=b.querySelector('.game-genre');
 if(title.textContent!==g.title)title.textContent=g.title;if(category.textContent!==g.genre)category.textContent=g.genre;
 const edit=b.querySelector('.card-edit');if(edit.getAttribute('aria-label')!=='Details for '+g.title)edit.setAttribute('aria-label','Details for '+g.title);
 syncFavoriteCard(b,g);
}

// Flat fan: translation and a small in-plane tilt, shared by touch motion.
function veniceTransform(offset,tile){const d=Math.abs(offset);return `translate3d(${offset*tile*.57}px,${d*12}px,0) rotate(${offset*3}deg) scale(${1-Math.min(d,4)*.035})`;}

function sizeTokyoCover(){
 if(!['tokyo','oxford'].includes(presentation))return;
 const panel=$('#tokyo-preview'),caption=panel.querySelector('p');
 const captionSpace=presentation==='tokyo'?caption.offsetHeight+12:0;
 const width=Math.max(0,Math.floor(Math.min(panel.clientWidth,(panel.clientHeight-captionSpace)/1.5)));
 panel.style.setProperty('--tokyo-cover-width',width+'px');
}
