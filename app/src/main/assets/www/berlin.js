// Keep only visible rows plus a small buffer; native scrolling supplies touch inertia.
let berlinItems=null,berlinColumns=1,berlinPitch=1,berlinFrame=0,berlinTimer=0,berlinFocus=false;
function berlinIndex(){return Math.max(0,filtered.findIndex(g=>g.id===presentationId))}
function berlinHeader(){
 const current=filtered[berlinIndex()];presentationId=current?.id||null;
 const options=sections(),i=sectionIndex();$('#category-current').textContent=sectionLabel();$('#category-before').textContent=options[(i-1+options.length)%options.length].label;$('#category-after').textContent=options[(i+1)%options.length].label;
 $('#presentation-title').textContent=current?.title||(favoritesOnly?'No favorites yet':'No games found');
 $('#presentation-position').textContent=current?`${berlinIndex()+1} / ${filtered.length.toLocaleString()} · ${current.genre}`:(favoritesOnly?'Add a favorite from a game’s menu or with the right stick.':'Try another category or search.');
 setFavoriteButton($('#presentation-favorite'),current);$('#presentation-play').disabled=!current;$('#presentation-edit').disabled=!current;
}
function paintBerlin(){
 if(presentation!=='berlin')return;
 const grid=$('#grid'),rows=Math.ceil(filtered.length/berlinColumns),first=Math.max(0,Math.floor(grid.scrollTop/berlinPitch)-2),last=Math.min(rows,Math.ceil((grid.scrollTop+grid.clientHeight)/berlinPitch)+2),gap=parseFloat(getComputedStyle(grid).rowGap);
 const existing=new Map([...grid.querySelectorAll('.game')].map(b=>[b.dataset.id,b])),keep=new Set(),ordered=[];
 let top=grid.querySelector('.berlin-top'),bottom=grid.querySelector('.berlin-bottom');
 if(!top){top=el('div','berlin-spacer berlin-top');top.setAttribute('aria-hidden','true');grid.prepend(top)}
 if(!bottom){bottom=el('div','berlin-spacer berlin-bottom');bottom.setAttribute('aria-hidden','true');grid.append(bottom)}
 top.hidden=first===0;top.style.height=Math.max(0,first*berlinPitch-gap)+'px';bottom.hidden=last===rows;bottom.style.height=Math.max(0,(rows-last)*berlinPitch-gap)+'px';
 for(let i=first*berlinColumns;i<Math.min(filtered.length,last*berlinColumns);i++){
  const g=filtered[i],b=existing.get(g.id)||card(g);keep.add(b);ordered.push(b);b.dataset.berlin='true';b.classList.toggle('presentation-selected',g.id===presentationId);b.tabIndex=g.id===presentationId?0:-1;
  if(!existing.has(g.id))grid.insertBefore(b,bottom);
 }
 for(const b of existing.values())if(!keep.has(b)){if(b.contains(document.activeElement))berlinFocus=true;b.remove()}
 // Newly revealed rows may precede reused ones. Reorder only when necessary.
 let cursor=top.nextElementSibling;for(const b of ordered){if(b!==cursor)grid.insertBefore(b,cursor);cursor=b.nextElementSibling;}
 queueCoverGlow();
}
function renderBerlin(){
 const grid=$('#grid'),style=getComputedStyle(grid),gap=parseFloat(style.columnGap)||8,padding=parseFloat(style.paddingLeft)+parseFloat(style.paddingRight),width=grid.clientWidth-padding;
 if(width<=0||grid.clientHeight<=0)return;
 const columns=Math.max(2,Math.floor((width+gap)/(120+gap))),height=(width-(columns-1)*gap)/columns*1.5;
 const changed=berlinItems!==filtered||berlinColumns!==columns||Math.abs(berlinPitch-height-gap)>.5||!grid.querySelector('[data-berlin]');
 berlinColumns=columns;berlinPitch=height+gap;grid.style.setProperty('--berlin-columns',columns);grid.style.setProperty('--berlin-height',height+'px');
 if(berlinItems!==filtered){berlinItems=filtered;grid.replaceChildren();}
 berlinHeader();
 if(changed){grid.scrollTop=0;paintBerlin();grid.scrollTop=Math.floor(berlinIndex()/berlinColumns)*berlinPitch;}
 else{const top=Math.floor(berlinIndex()/berlinColumns)*berlinPitch;if(top<grid.scrollTop)grid.scrollTop=top;else if(top+berlinPitch>grid.scrollTop+grid.clientHeight)grid.scrollTop=top+berlinPitch-grid.clientHeight+14;}
 paintBerlin();$('#load').hidden=true;$('#empty').hidden=true;
}
function berlinMove(action){
 if(!filtered.length)return;
 const grid=$('#grid'),page=berlinColumns*Math.max(1,Math.floor(grid.clientHeight/berlinPitch));
 let index=berlinIndex();const row=Math.floor(index/berlinColumns),first=Math.floor(grid.scrollTop/berlinPitch),last=Math.ceil((grid.scrollTop+grid.clientHeight)/berlinPitch)-1;
 if(row<first||row>last)index=first*berlinColumns;
 const delta={left:-1,right:1,up:-berlinColumns,down:berlinColumns,pageUp:-page,pageDown:page}[action]||0;
 index=Math.max(0,Math.min(filtered.length-1,index+delta));presentationId=filtered[index].id;renderBerlin();controllerFocus($('#grid .presentation-selected'));queueCarouselSave();
}
function initBerlin(){
 const grid=$('#grid');let observedWidth=0,observedHeight=0;
 new ResizeObserver(()=>{if(presentation!=='berlin'||!grid.clientWidth||!grid.clientHeight)return;if(grid.clientWidth!==observedWidth||grid.clientHeight!==observedHeight){observedWidth=grid.clientWidth;observedHeight=grid.clientHeight;renderBerlin();}}).observe(grid);
 grid.addEventListener('scroll',()=>{
  if(presentation!=='berlin')return;if(!berlinFrame)berlinFrame=requestAnimationFrame(()=>{berlinFrame=0;paintBerlin()});
  clearTimeout(berlinTimer);berlinTimer=setTimeout(()=>{if(presentation!=='berlin')return;const row=Math.floor(berlinIndex()/berlinColumns),first=Math.floor(grid.scrollTop/berlinPitch),last=Math.ceil((grid.scrollTop+grid.clientHeight)/berlinPitch)-1;
   if(filtered.length&&(row<first||row>last)){presentationId=filtered[Math.min(filtered.length-1,first*berlinColumns)].id;berlinHeader();paintBerlin();}
   if(berlinFocus&&!editingField()&&!document.querySelector('dialog[open]'))$('#grid .presentation-selected')?.focus({preventScroll:true});berlinFocus=false;persist();
  },180);
 },{passive:true});
 window.addEventListener('resize',()=>{if(presentation==='berlin')renderBerlin()});
}
