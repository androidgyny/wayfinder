// Shared portrait index for Milan and Bellevue; visual treatments stay in CSS.
function isShowcase(){return presentation==='milan'||presentation==='bellevue'}
let showcasePane='games',showcasePageKey='',showcaseStartupFocusPending=false;
const bladeBevelCache=new Map();
function showcaseFocus(){
 const target=showcasePane==='tabs'?$('#showcase-tabs .current'):$('#grid .presentation-selected')||$('#grid .show-all-matches')||$('#showcase-tabs .current');
 controllerFocus(target,true);if(presentation==='milan'&&showcasePane==='tabs'&&target)revealCategoryItem(target.parentElement,target,true);
 document.body.dataset.showcasePane=showcasePane;
}
function showcaseOpen(index){const s=sections()[index];if(!s)return;favoritesOnly=s.favorite;setGenre(s.genre,true);persist();}
function showcaseSelect(index,focus=true){const g=filtered[Math.max(0,Math.min(filtered.length-1,index))];presentationId=g?.id||null;controllerGameId=presentationId;renderShowcase(true);if(!g)syncSearchFeedback();if(focus)showcaseFocus();queueCarouselSave();}
function sizeShowcaseCover(){
 if(!isShowcase())return;const panel=$('#showcase-art'),pad=getComputedStyle(panel),width=Math.max(0,Math.min(panel.clientWidth-32,(panel.clientHeight-parseFloat(pad.paddingTop)-parseFloat(pad.paddingBottom)-8)/1.5))*(presentation==='bellevue'?.95:1);
 
 Object.assign($('#showcase-cover').style,{width:width+'px',height:width*1.5+'px'});
 fitShowcaseTabs();drawBladeSurfaces();
}
// Show whole category buttons; arrows expose categories outside this window.
function fitShowcaseTabs(){
 if(presentation!=='milan')return;
 const nav=$('#showcase-tabs'),buttons=[...nav.children],active=sectionIndex(),budget=nav.clientWidth;
 if(!budget||!buttons[active])return;
 for(const b of buttons){b.hidden=false;b.style.maxWidth=Math.max(1,budget)+'px'}
 const widths=buttons.map(b=>b.getBoundingClientRect().width);let first=active,last=active,used=widths[active];
 while(true){let added=false;if(last+1<buttons.length&&used+4+widths[last+1]<=budget){used+=4+widths[++last];added=true}if(first>0&&used+4+widths[first-1]<=budget){used+=4+widths[--first];added=true}if(!added)break}
 buttons.forEach((b,i)=>{b.hidden=i<first||i>last});nav.scrollLeft=0;
 $('#showcase-category-prev').disabled=active===0;$('#showcase-category-next').disabled=active===buttons.length-1;
}
// Adjacent surfaces use the same Bezier boundary, so the seams fit at every size.
function drawBladeSurfaces(){
 const svg=$('#blade-surfaces');if(!svg||presentation!=='bellevue')return;
 const main=$('#main'),nav=$('#showcase-tabs'),w=main.clientWidth,h=nav.clientHeight;
 if(!w||!h)return;
 // Measure outside animated tabs; their temporary widths are not layout geometry.
 const unit=$('#blade-unit').getBoundingClientRect().width,left=Number(document.body.style.getPropertyValue('--blade-left')),right=Number(document.body.style.getPropertyValue('--blade-right'));
 const x1=left*unit,x2=w-right*unit,style=getComputedStyle(main),panel=style.getPropertyValue('--panel').trim();
 const active=nav.querySelector('.current'),accent=active?.style.getPropertyValue('--blade-color')||'#436b49';
 const bend=Math.min(42,unit*.8),shoulder=Math.min(78,h*.22),foot=Math.min(65,h*.19);
 const boundary=x=>({top:x===0?0:x===w?w-25:Math.max(0,x-bend*.55),mid:x===0?0:x===w?w:Math.min(w,x+bend*.45)});
 let faceCursor=0;
 for(const button of [...nav.children].filter(b=>!b.hidden)){const current=button.classList.contains('current'),end=current?x2:faceCursor+unit;
  button.style.setProperty('--blade-face-left',boundary(faceCursor).mid+'px');button.style.setProperty('--blade-face-width',(boundary(end).mid-boundary(faceCursor).mid)+'px');faceCursor=end;
 }
 const signature=JSON.stringify([w,h,unit,left,right,panel,accent,[...nav.children].filter(b=>!b.hidden).map(b=>b.style.getPropertyValue('--blade-color'))]);
 if(svg.dataset.signature===signature)return;svg.dataset.signature=signature;
 const ns='http://www.w3.org/2000/svg',node=(name,attrs)=>{const e=document.createElementNS(ns,name);for(const [k,v]of Object.entries(attrs))e.setAttribute(k,v);return e};
 svg.replaceChildren();svg.setAttribute('viewBox',`0 0 ${w} ${h}`);
 const defs=node('defs',{});svg.append(defs);
 function gradient(id,stops,vertical=false){const g=node('linearGradient',{id,x1:'0',x2:vertical?'0':'1',y1:'0',y2:vertical?'1':'0'});for(const [offset,color,opacity]of stops)g.append(node('stop',{offset,'stop-color':color,'stop-opacity':opacity}));defs.append(g)}
 gradient('blade-metal',[['0','#000',.45],['.06','#fff',.08],['.4','#fff',.04],['.72','#000',.04],['.90','#000',.25],['1','#000',.55]]);
 gradient('blade-gloss',[['0','#fff',.04],['.18','#fff',.02],['.5','#000',.15],['1','#000',.62]],true);
 gradient('blade-paper',[['0','#000',.22],['.018','#fff',.6],['.08','#fff',.12],['.60','#fff',0],['.94','#000',.12],['.985','#000',.4],['1','#fff',.65]]);
 gradient('blade-header',[['0','#000',.62],['.25','#000',.32],['.63','#fff',.03],['.86','#000',.23],['1','#000',.55]]);
 function reflection(id,cx,cy,rx,ry,strength){const g=node('radialGradient',{id,cx,cy,r:'1',gradientTransform:`translate(${cx} ${cy}) scale(${rx} ${ry}) translate(${-cx} ${-cy})`});g.append(node('stop',{offset:'0','stop-color':'#fffde0','stop-opacity':strength}),node('stop',{offset:'.33','stop-color':'#fffde0','stop-opacity':strength*.38}),node('stop',{offset:'1','stop-color':'#fff','stop-opacity':'0'}));defs.append(g)}
 reflection('blade-reflection',.58,.16,.65,.38,.24);
 reflection('blade-satin',.3,.08,.8,.8,.48);
 gradient('blade-depth',[['0','#000',0],['.38','#000',.02],['.8','#000',.16],['1','#000',.35]],true);
 // A small, static grain tile adds a satin finish without an expensive SVG filter.
 const grain=node('pattern',{id:'blade-grain',width:'48',height:'48',patternUnits:'userSpaceOnUse'});let seed=73;
 for(let i=0;i<240;i++){seed=(seed*16807)%2147483647;const x=seed%48;seed=(seed*16807)%2147483647;grain.append(node('path',{d:`M ${x} ${seed%48} h ${i%3+1}`,stroke:i%2?'#fff':'#000','stroke-opacity':i%2?'.035':'.025','stroke-width':'.5'}))}defs.append(grain);
 // Shade the bevel from its local surface normal. Reflections turn with the
 // curve instead of tracing it with uniformly bright concentric outlines.
 function metalBevel(d,width,clip,closed=true){
  const cacheKey=JSON.stringify([d,width,clip,closed,w,h]);
  if(bladeBevelCache.has(cacheKey)){svg.append(bladeBevelCache.get(cacheKey).cloneNode(true));return}
  // These paths use only M/L/Q/C/Z. Sampling their Beziers directly avoids
  // thousands of synchronous SVG length lookups on every category change.
  const tokens=d.match(/[MLQCZ]|-?\d*\.?\d+(?:e[-+]?\d+)?/gi),raw=[];let at=0,x=0,y=0,sx=0,sy=0;
  const number=()=>Number(tokens[at++]);
  function curve(control){const start={x,y},all=[start,...control],length=all.slice(1).reduce((sum,p,i)=>sum+Math.hypot(p.x-all[i].x,p.y-all[i].y),0),n=Math.max(1,Math.ceil(length/3));
   for(let i=1;i<=n;i++){const t=i/n,pts=all.map(p=>({...p}));for(let k=pts.length-1;k>0;k--)for(let j=0;j<k;j++)pts[j]={x:pts[j].x*(1-t)+pts[j+1].x*t,y:pts[j].y*(1-t)+pts[j+1].y*t};raw.push(pts[0])}x=control.at(-1).x;y=control.at(-1).y;
  }
  while(at<tokens.length){const cmd=tokens[at++];if(cmd==='M'){x=number();y=number();sx=x;sy=y;raw.push({x,y})}else if(cmd==='Z')curve([{x:sx,y:sy}]);else{const n={L:1,Q:2,C:3}[cmd],control=[];for(let i=0;i<n;i++)control.push({x:number(),y:number()});curve(control)}}
  const count=raw.length-1,points=raw.map((p,i)=>{const a=raw[Math.max(0,i-1)],b=raw[Math.min(count,i+1)],mag=Math.hypot(b.x-a.x,b.y-a.y)||1;return {...p,nx:-(b.y-a.y)/mag,ny:(b.x-a.x)/mag}});
  const bands=new Map(),steps=12;
  for(let i=0;i<count;i++)for(let j=0;j<steps;j++){
   const a=points[i],b=points[i+1],v=(j+.5)/steps,turn=-(a.nx*.65+a.ny*.76),light=Math.max(0,turn),reflection=Math.exp(-Math.pow((v-(.27+.14*turn))/.16,2));
   // Let the bottom bevel recede, easing into the curved corners.
   const bottom=closed?Math.max(0,1-(h-a.y)/24):0,fade=bottom*bottom*(3-2*bottom),bottomLight=.27+.16*Math.sin(Math.PI*Math.max(0,Math.min(1,a.x/w)));
   const shade=Math.max(25,Math.min(242,(30+58*Math.sin(v*Math.PI)+reflection*(76+106*light)-24*v)*(1-fade*(1-bottomLight))));
   const taper=closed?1:Math.min(1,i*3/12,(count-i-1)*3/12),key=Math.round(shade/4)*4,o1=width*taper*(j/steps-(closed?0:.5)),o2=width*taper*((j+1)/steps-(closed?0:.5));
   const xy=(p,o)=>`${(p.x+p.nx*o).toFixed(2)} ${(p.y+p.ny*o).toFixed(2)}`;
   const q=`M ${xy(a,o1)} L ${xy(b,o1)} L ${xy(b,o2)} L ${xy(a,o2)} Z `;
   bands.set(key,(bands.get(key)||'')+q);
  }
  const group=node('g',clip?{'clip-path':clip}:{});
  for(const [shade,d]of bands)group.append(node('path',{d,fill:`rgb(${shade-4},${shade},${shade-2})`,stroke:`rgb(${shade-4},${shade},${shade-2})`,'stroke-width':'.18','stroke-linejoin':'round'}));svg.append(group);bladeBevelCache.set(cacheKey,group.cloneNode(true));if(bladeBevelCache.size>32)bladeBevelCache.delete(bladeBevelCache.keys().next().value);
 }
 function shape(a,b){const l=boundary(a),r=boundary(b);return `M ${l.top} 1 L ${r.top} 1 C ${r.mid} 1 ${r.mid} ${shoulder*.45} ${r.mid} ${shoulder} L ${r.mid} ${h-foot} Q ${r.mid} ${h-1} ${r.top} ${h-1} L ${l.top} ${h-1} Q ${l.mid} ${h-1} ${l.mid} ${h-foot} L ${l.mid} ${shoulder} C ${l.mid} ${shoulder*.45} ${l.mid} 1 ${l.top} 1 Z`}
 const visible=[...nav.children].filter(b=>!b.hidden);let cursor=0;
 for(const b of visible){
  const current=b.classList.contains('current'),end=current?x2:cursor+unit,d=shape(cursor,end);
  svg.append(node('path',{d,fill:current?panel:b.style.getPropertyValue('--blade-color')}));
  for(const fill of [current?'blade-paper':'blade-metal',current?'blade-satin':'blade-reflection',current?'blade-depth':'blade-gloss','blade-grain'])svg.append(node('path',{d,fill:`url(#${fill})`}));
  const clipId=current?'blade-clip-active':`blade-clip-${cursor}`,clip=node('clipPath',{id:clipId});clip.append(node('path',{d}));defs.append(clip);
  const rimClip=`url(#${clipId})`;
  svg.append(node('path',{d,fill:'none',stroke:'#07100e','stroke-opacity':'.9','stroke-width':'13','clip-path':rimClip}));
  metalBevel(d,4.5,rimClip);
  cursor=end;
 }
 const l=boundary(x1),r=boundary(x2),dip=Math.min(94,h*.26),rise=Math.min(35,h*.1),neck=Math.min(68,(x2-x1)*.14);
 const span=x2-x1,d=`M ${l.top} 1 L ${r.top} 1 Q ${r.mid} 1 ${r.mid} ${rise} C ${x1+span*.72} ${rise-8} ${x1+span*.5} ${dip} ${x1+span*.32} ${dip} L ${x1+neck+20} ${dip} C ${x1+neck-14} ${dip} ${x1+neck+8} 5 ${l.top} 1 Z`;
 svg.append(node('path',{d,fill:accent}));svg.append(node('path',{d,fill:'url(#blade-header)'}));
 svg.append(node('path',{d,fill:'url(#blade-grain)'}));
 // A fine reflected rim follows the curved lower lip instead of floating over it.
 const lip=`M ${r.mid} ${rise} C ${x1+span*.72} ${rise-8} ${x1+span*.5} ${dip} ${x1+span*.32} ${dip} L ${x1+neck+20} ${dip} C ${x1+neck-14} ${dip} ${x1+neck+8} 5 ${l.top} 1`;
 svg.append(node('path',{d:lip,fill:'none',stroke:'#0a1711','stroke-opacity':'.65','stroke-width':'4','clip-path':'url(#blade-clip-active)'}));
 metalBevel(lip,3,'url(#blade-clip-active)',false);
}
function syncShowcaseCover(){if(!isShowcase())return;const img=$('#showcase-cover');if(backdrop==='gradient')$('#soft-gradient').style.setProperty('--backdrop-rgb',coverColor(img)||'145,113,72');}
function renderShowcase(selectionOnly=false){
 const sectionKey=JSON.stringify([presentation,genre,favoritesOnly]),tabsBefore=$('#showcase-tabs');
 const animateBlades=!selectionOnly&&presentation==='bellevue'&&tabsBefore.dataset.openSection&&tabsBefore.dataset.openSection!==sectionKey&&!matchMedia('(prefers-reduced-motion: reduce)').matches;
 const tabs=$('#showcase-tabs');
 // Moving within a category does not change its tabs, metalwork or cover size.
 if(!selectionOnly){
 const list=sections(),signature=JSON.stringify(list.map(s=>[s.label,searchSummary?searchSectionCount(s.favorite?'favorites':s.genre?'genre:'+s.genre:'all',0):null]));
 if(tabs.dataset.signature!==signature){tabs.dataset.signature=signature;tabs.replaceChildren(...list.map((s,i)=>{
  const b=el('button','showcase-tab');b.append(el('span','showcase-tab-label',s.label.replace('★ ','')));b.title=s.label;b.style.setProperty('--blade-color',['#28555c','#756026','#803d2d','#34553c','#31516d','#5d3d68'][i%6]);
  if(searchSummary){const n=searchSectionCount(s.favorite?'favorites':s.genre?'genre:'+s.genre:'all',0);b.append(el('small','',String(n)));b.classList.toggle('search-no-match',!n);}
  b.onclick=()=>{showcasePane='tabs';showcaseOpen(i);showcaseFocus()};b.onfocus=()=>{showcasePane='tabs';document.body.dataset.showcasePane=showcasePane};return b;
 }));}
 [...tabs.children].forEach((b,i)=>{const on=i===sectionIndex();b.classList.toggle('current',on);b.setAttribute('aria-pressed',String(on));b.tabIndex=on?0:-1});if(presentation==='milan')revealCategoryItem(tabs,tabs.querySelector('.current'),true);
 const active=sectionIndex(),start=Math.max(0,Math.min(active-2,list.length-5));
 [...tabs.children].forEach((b,i)=>{b.hidden=presentation==='bellevue'&&(i<start||i>=start+5);if(presentation==='bellevue')b.style.removeProperty('max-width');b.dataset.side=i<active?'before':i>active?'after':'current';b.style.setProperty('--blade-slot',i<active?i-start:i-active-1);});
 document.body.style.setProperty('--blade-left',Math.min(4,active-start));document.body.style.setProperty('--blade-right',Math.max(0,Math.min(list.length,start+5)-active-1));
 $('#showcase-category').textContent=sectionLabel().replace('★ ','');$('#showcase-count').textContent=filtered.length.toLocaleString()+' '+(filtered.length===1?'game':'games')+(query?' found':'');
 }
 let index=Math.max(0,filtered.findIndex(g=>g.id===presentationId));const game=filtered[index];presentationId=game?.id||null;controllerGameId=presentationId;
 if(!selectionOnly){
 const currentTab=tabs.querySelector('.current');
 if(currentTab){let count=currentTab.querySelector('.showcase-tab-count');if(!count){count=el('span','showcase-tab-count');currentTab.append(count)}count.textContent=$('#showcase-count').textContent;}
 for(const b of tabs.querySelectorAll(':not(.current) > .showcase-tab-count'))b.remove();
 }
 const page=Math.floor(index/8),items=filtered.slice(page*8,page*8+8),grid=$('#grid'),key=JSON.stringify([page,query,items.map(g=>[g.id,g.title,!!g.favorite])]);
 if(key!==showcasePageKey||!grid.querySelector('.showcase-row')){showcasePageKey=key;grid.replaceChildren(...items.map((g,i)=>{
  const b=el('button','game showcase-row');b.dataset.id=g.id;b.append(el('span','showcase-number',String(page*8+i+1).padStart(2,'0')),el('span','game-title',g.title));syncFavoriteCard(b,g);if(!g.favorite){const star=el('span','showcase-unstar','☆');star.setAttribute('aria-hidden','true');b.append(star)}b.title=g.title;
  b.onclick=()=>{showcasePane='games';showcaseSelect(page*8+i)};
  b.onfocus=()=>{showcasePane='games';document.body.dataset.showcasePane=showcasePane;if(presentationId!==g.id)showcaseSelect(page*8+i,false)};
  b.ondblclick=()=>play(g.id,b);b.oncontextmenu=e=>{e.preventDefault();showcaseSelect(page*8+i,false);editGame(g)};return b;
 }));if(!game)grid.append(el('p','showcase-empty',query?'No matching titles.':!games.length?'Your library is empty. Choose Add game to begin.':favoritesOnly?'No favorites yet.':'No games in this category.'));}
 for(const row of grid.querySelectorAll('.game')){const on=row.dataset.id===presentationId;row.classList.toggle('presentation-selected',on);row.classList.remove('controller-selected');row.tabIndex=on?0:-1;row.setAttribute('aria-label','Select '+row.title+(on?' · Selected':''));}
 const img=$('#showcase-cover');img.hidden=!game;$('#showcase-print').hidden=!game;
 if(game){if(img.getAttribute('src')!==game.image)img.src=game.image;img.alt=game.title+' cover';}else{img.removeAttribute('src');img.alt='';}
 $('#showcase-title').textContent=game?.title||'';
 $('#showcase-position').textContent=game?`${index+1} / ${filtered.length}`:'0 / 0';
 $('#showcase-prev').disabled=!game||index===0;$('#showcase-next').disabled=!game||index===filtered.length-1;
 for(const b of document.querySelectorAll('[data-showcase-game]'))b.disabled=!game;
 if(animateBlades){
  for(const n of [grid,$('#showcase-art')]){n.getAnimations().forEach(a=>a.cancel());n.animate([{opacity:.35,transform:'translateX(12px)'},{opacity:1,transform:'none'}],{duration:170,easing:'ease-out'});}
 }
 if(!selectionOnly)tabs.dataset.openSection=sectionKey;
 $('#empty').hidden=true;$('#load').hidden=true;if(!selectionOnly)sizeShowcaseCover();syncShowcaseCover();document.body.dataset.showcasePane=showcasePane;
}
function showcaseBack(){if(document.activeElement===$('#search'))native?.hideKeyboard?.();if(document.activeElement===$('#search')&&!query){$('#search').blur();showcaseFocus();return true;}if(query){query='';$('#search').value='';$('#search').blur();update();showcaseFocus();persist();return true;}if(showcasePane==='games'){showcasePane='tabs';showcaseFocus();return true;}return false;}
function showcaseController(action){
 if(['search','menu','apps'].includes(action))return false;
 if(action==='back'){showcaseBack();return true;}
 const active=document.activeElement;
 if(active?.matches('input,textarea,select')){if(['down','activate'].includes(action)){active.blur();native?.hideKeyboard?.();showcasePane='games';showcaseFocus();return true;}return false;}
 if(action==='activate'&&active?.matches('.show-all-matches')){active.click();return true;}
 if(action==='activate'&&active?.matches('button')&&!active.closest('#grid,#showcase-tabs')){active.click();return true;}

 if(action==='genrePrev'||action==='genreNext'){showcaseOpen((sectionIndex()+(action==='genreNext'?1:-1)+sections().length)%sections().length);showcaseFocus();return true;}
 if(showcasePane==='tabs'){
  if(['left','right','up'].includes(action)){showcaseOpen((sectionIndex()+(action==='right'?1:-1)+sections().length)%sections().length);showcaseFocus();return true;}
  if(action==='down'||action==='activate'){showcasePane='games';showcaseFocus();return true;}
  
 }
 const index=Math.max(0,filtered.findIndex(g=>g.id===presentationId));
 if(action==='up'&&index===0){showcasePane='tabs';showcaseFocus();return true;}
 const delta={up:-1,down:1,left:-8,right:8,pageUp:-8,pageDown:8}[action];
 if(delta!==undefined){showcasePane='games';showcaseSelect(index+delta);return true;}
 const g=filtered.find(g=>g.id===presentationId);
 if(['activate','edit','favorite'].includes(action)){if(g){if(action==='activate')play(g.id,$('#grid .presentation-selected'));else if(action==='edit')editGame(g);else{toggleFavorite(g.id);showcaseFocus();}}return true;}return false;
}
function initShowcase(){
 const main=$('#main'),tabs=el('nav','showcase-part');tabs.id='showcase-tabs';tabs.setAttribute('aria-label','Categories');
 const surfaces=document.createElementNS('http://www.w3.org/2000/svg','svg');surfaces.id='blade-surfaces';surfaces.classList.add('showcase-part');surfaces.setAttribute('aria-hidden','true');main.append(surfaces);
 const measure=el('span','showcase-part');measure.id='blade-unit';measure.setAttribute('aria-hidden','true');main.append(measure);
 for(const [id,label,delta]of [['prev','Previous category',-1],['next','Next category',1]]){const arrow=el('button','showcase-part showcase-category-arrow',delta<0?'\u2039':'\u203a');arrow.id='showcase-category-'+id;arrow.setAttribute('aria-label',label);arrow.onclick=()=>{showcasePane='tabs';showcaseOpen(sectionIndex()+delta);showcaseFocus()};main.append(arrow)}
 const heading=el('header','showcase-part');heading.id='showcase-heading';const category=el('h1');category.id='showcase-category';const count=el('p');count.id='showcase-count';heading.append(category,count);
 const art=el('div','showcase-part');art.id='showcase-art';const print=el('div');print.id='showcase-print';const img=el('img');img.id='showcase-cover';print.append(img);art.append(print);img.onload=syncShowcaseCover;
 const caption=el('div','showcase-part');caption.id='showcase-caption';const title=el('h2');title.id='showcase-title';caption.append(title);
 const footer=el('nav','showcase-part');footer.id='showcase-footer';footer.setAttribute('aria-label','Game controls');
 for(const [key,label,action] of [['A','Open','activate'],['B','Back','back'],['X','Edit','edit'],['Y','Search','search']]){const b=el('button','showcase-hint');b.setAttribute('aria-label',label);b.append(el('b','showcase-key '+key.toLowerCase(),key),el('span','',label));b.onclick=()=>{showcaseFocus();showcaseController(action)||controller(action)};if(['activate','edit'].includes(action))b.dataset.showcaseGame='true';footer.append(b);}
 const help=el('small','showcase-page-help');for(const [keys,label]of [['LB / RB','Categories'],['LT / RT','Pages']]){const group=el('span','showcase-control-group');group.append(el('b','showcase-shoulder',keys),el('span','',label));help.append(group)}footer.append(help);
 for(const [id,label,delta] of [['prev','Previous page',-8],['next','Next page',8]]){const b=el('button','showcase-page',delta<0?'‹':'›');b.id='showcase-'+id;b.setAttribute('aria-label',label);b.onclick=()=>{showcasePane='games';showcaseSelect(Math.max(0,filtered.findIndex(g=>g.id===presentationId))+delta)};footer.append(b);}
 const pos=el('span');pos.id='showcase-position';footer.append(pos);main.append(tabs,heading,art,caption,footer);new ResizeObserver(sizeShowcaseCover).observe(art);new ResizeObserver(fitShowcaseTabs).observe(tabs);document.fonts?.addEventListener('loadingdone',fitShowcaseTabs);
}
