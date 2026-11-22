/* Cannes / Now Showing: synthetic 1,200-game library; no device, network or real library access. */
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),http=require('node:http');
const {chromium}=require('playwright');
const root=path.resolve(__dirname,'../app/src/main/assets/www'),out=path.resolve(__dirname,'../output/cannes-audit');fs.mkdirSync(out,{recursive:true});
const LONG='Games I keep meaning to finish before the end of the summer holidays';
const categories=[...Array.from({length:22},(_,i)=>'Category '+String.fromCharCode(65+i)),LONG,'Rhythm & music'];
const fixture=Array.from({length:1200},(_,i)=>({id:'c'+i,title:i%97===3?'An Extraordinarily Long Game Title: The Definitive Director’s Cut Edition '+i:'Feature '+String(i).padStart(4,'0'),
 genre:categories[i%categories.length],image:'cover/'+(i%9)+'.svg',package:'test.app',kind:'app',favorite:i%53===0,lastPlayed:i%31===0?Date.now()-(i%5)*86400000:0}));
const hues=[350,20,45,140,190,215,260,300,0];
const cover=n=>`<svg xmlns="http://www.w3.org/2000/svg" width="600" height="900"><rect width="600" height="900" fill="hsl(${hues[n]} 45% 32%)"/><circle cx="300" cy="360" r="170" fill="hsl(${hues[n]} 70% 70%)"/><text x="300" y="760" fill="#fff" text-anchor="middle" font-family="sans-serif" font-size="56">POSTER ${n}</text></svg>`;
(async()=>{
 const server=http.createServer((req,res)=>{const url=new URL(req.url,'http://localhost').pathname;
  const art=url.match(/^\/cover\/(\d)\.svg$/);if(art){res.setHeader('Content-Type','image/svg+xml');return res.end(cover(+art[1]))}
  if(url==='/games.js'){res.setHeader('Content-Type','application/javascript');return res.end('window.GAMES='+JSON.stringify(fixture))}
  try{const file=path.join(root,url==='/'?'index.html':url);res.setHeader('Content-Type',file.endsWith('.js')?'application/javascript':file.endsWith('.css')?'text/css':file.endsWith('.ttf')?'font/ttf':file.endsWith('.svg')?'image/svg+xml':'text/html');res.end(fs.readFileSync(file))}catch{res.statusCode=404;res.end()}});
 await new Promise(r=>server.listen(0,'127.0.0.1',r));
 const browser=await chromium.launch({channel:process.env.BROWSER_CHANNEL||'msedge',headless:true}),errors=[];
 try{
  const page=await browser.newPage({viewport:{width:1097,height:592}});page.on('pageerror',e=>errors.push(e.message));
  await page.addInitScript(g=>{if(!localStorage.getItem('auditGames'))localStorage.setItem('auditGames',JSON.stringify(g));const db=()=>JSON.parse(localStorage.getItem('auditGames'));
   window.Portal={view:()=>localStorage.getItem('view')||'{}',saveView:v=>localStorage.setItem('view',v),library:()=>localStorage.getItem('auditGames'),sound:()=>{},hideKeyboard:()=>{},setThemeColor:c=>window.themeColor=c,appsPreferences:()=>'[]',launch:id=>window.launched=id,
    favorite:(id,on)=>{const d=db();d.find(x=>x.id===id).favorite=on;localStorage.setItem('auditGames',JSON.stringify(d));return '{"ok":true}'}};},fixture);
  const origin='http://127.0.0.1:'+server.address().port;
  await page.goto(origin);await page.waitForFunction(()=>typeof restoring!=='undefined'&&!restoring);
  assert.ok(await page.evaluate(()=>[...$('#presentation').options].some(o=>o.value==='cannes'&&o.textContent==='Cannes')),'Cannes is offered');
  await page.evaluate(()=>{applyAppearanceValues(builtinAppearancePresets.find(p=>p.name==='Now Showing').values);genre='';favoritesOnly=false;query='';update();cannesSelect(0)});
  await page.evaluate(()=>document.fonts.ready);
  assert.equal(await page.evaluate(()=>document.body.dataset.presentation),'cannes');
  // Wait for the row's transform transition rather than a fixed time; first artwork decodes can delay frames.
  const settle=async()=>{await page.waitForTimeout(40);await page.waitForFunction(()=>!document.querySelector('#grid .cannes-strip')?.getAnimations().length,null,{timeout:4000});};
  const audit=()=>page.evaluate(()=>{
   const R=e=>e.getBoundingClientRect(),grid=R($('#grid')),footer=R($('#cannes-footer')),board=R($('#cannes-board')),letters=$('#cannes-letters');
   const cases=[...document.querySelectorAll('#grid .cannes-case')],sel=$('#grid .presentation-selected');
   const plates=[...document.querySelectorAll('.cannes-plate-title')].map(e=>e.scrollWidth<=e.clientWidth+1);
   const visible=e=>{const s=getComputedStyle(e);return s.display!=='none'&&s.visibility!=='hidden'&&R(e).width>0};
   const parts=['#cannes-title','.cannes-ticket','.cannes-hints'].map(s=>$('#cannes-footer '+s)).filter(e=>e&&visible(e)).map(R);
   const sides=[...document.querySelectorAll('.cannes-side')].map(R),frame=R($('.cannes-frame'));
   return{mounted:cases.length,total:filtered.length,ratios:cases.map(b=>{const r=R(b.querySelector('img'));return r.width/r.height}),
    sel:sel&&(()=>{const c=R(sel.querySelector('.cover')),p=R(sel.querySelector('.cannes-plate'));return{left:c.left,right:c.right,top:c.top,bottom:p.bottom}})(),
    grid:{left:grid.left,right:grid.right,top:grid.top,bottom:grid.bottom},footerTop:footer.top,
    letterFont:getComputedStyle(letters).fontFamily,
    lettersFit:letters.scrollWidth<=letters.clientWidth+1&&R(letters).bottom<=board.bottom+.5&&R(letters).top>=board.top-.5,letterSize:parseFloat(letters.style.fontSize),
    footerOverlap:parts.some((r,i)=>parts.slice(i+1).some(o=>r.right>o.left+1)),
    sidesOverlap:sides.some(s=>s.right>frame.left+1&&s.left<frame.right-1),
    plates:plates.every(Boolean),docOverflow:document.documentElement.scrollWidth>innerWidth+1,
    kicker:$('#cannes-kicker').textContent,ticket:$('.cannes-ticket').textContent,index:filtered.findIndex(g=>g.id===presentationId),
    strip:getComputedStyle($('#grid .cannes-strip')).transform,inline:$('#grid .cannes-strip').style.transform,strips:document.querySelectorAll('.cannes-strip').length,stripClass:$('#grid .cannes-strip').className,transition:getComputedStyle($('#grid .cannes-strip')).transition,anims:$('#grid .cannes-strip').getAnimations().length,offset:cannesOffset}});
  const visibleIn=(a,label)=>{assert.ok(a.sel,label+': selection exists');assert.ok(a.sel.left>=a.grid.left-1&&a.sel.right<=a.grid.right+1,label+': selected case horizontally visible '+JSON.stringify(a));
   assert.ok(a.sel.top>=a.grid.top-1&&a.sel.bottom<=a.grid.bottom+1&&a.sel.bottom<=a.footerTop+1,label+': selected case and plate above the box office '+JSON.stringify(a));};

  // Geometry at handheld ratios, including the Portal's CSS viewport and Pocket DMG.
  for(const [name,w,h] of [['portal',1097,592],['4x3',789,568],['16x10',947,592],['3x2',888,592],['21x9',1381,568],['pocket-dmg',551,432],['compact',640,360]]){
   await page.setViewportSize({width:w,height:h});await page.evaluate(()=>{genre=genres[0];favoritesOnly=false;update();cannesSelect(7)});await settle();
   const a=await audit();
   assert.ok(a.mounted>0&&a.mounted<=40,name+': only nearby cases are mounted '+a.mounted+' of '+a.total);
   for(const r of a.ratios)assert.ok(Math.abs(r-2/3)<.01,name+': portrait 2:3 art '+r);
   visibleIn(a,name);assert.ok(a.lettersFit,name+': marquee letters fit');assert.ok(a.letterSize>=16,name+': marquee stays legible '+a.letterSize);
   assert.match(a.letterFont,/^Anton/,name+': marquee uses Anton regardless of typography');assert.ok(!a.footerOverlap,name+': box office parts do not overlap');
   assert.ok(!a.sidesOverlap,name+': LB/RB labels stay beside the marquee');assert.ok(a.plates,name+': nameplates do not overflow');assert.ok(!a.docOverflow,name+': no page scroll');
   await page.evaluate(()=>document.body.classList.add('search-active'));
   assert.ok(await page.evaluate(()=>$('.topbar .search').getBoundingClientRect().right<=$('.app-actions').getBoundingClientRect().left+1),name+': search does not overlap actions');
   await page.evaluate(()=>document.body.classList.remove('search-active'));
   await page.screenshot({path:path.join(out,name+'.png')});
  }
  await page.setViewportSize({width:1097,height:592});await settle();

  // Navigation: steps, held repeats, reversal, paging and both boundaries.
  await page.evaluate(()=>{genre='';favoritesOnly=false;update();cannesSelect(0)});
  await page.evaluate(()=>{for(let i=0;i<30;i++)controller('right')});await settle();
  let a=await audit();assert.equal(a.index,30,'thirty held steps');visibleIn(a,'held right');
  await page.evaluate(()=>{for(let i=0;i<5;i++)controller('right');for(let i=0;i<2;i++)controller('left')});await settle();
  a=await audit();assert.equal(a.index,33,'direction reversal');visibleIn(a,'reversal');
  const page1=await page.evaluate(()=>{const before=filtered.findIndex(g=>g.id===presentationId);controller('pageDown');return filtered.findIndex(g=>g.id===presentationId)-before});
  assert.ok(page1>=2,'page down moves by the visible count '+page1);
  await page.evaluate(()=>{cannesSelect(filtered.length-1);controller('right')});await settle();a=await audit();assert.equal(a.index,a.total-1,'right boundary');visibleIn(a,'last case');
  await page.evaluate(()=>{cannesSelect(0);controller('left')});await settle();a=await audit();assert.equal(a.index,0,'left boundary');visibleIn(a,'first case');
  assert.ok(await page.evaluate(()=>document.activeElement===$('#grid .presentation-selected')),'focus follows the selection');

  // Screens: bumpers and the vertical axis both change category; labels name their neighbors.
  await page.evaluate(()=>{genre='';favoritesOnly=false;update();controller('genreNext')});
  assert.ok(await page.evaluate(()=>favoritesOnly),'RB opens Favorites');a=await audit();assert.match(a.kicker,/Feature presentation/);
  await page.evaluate(()=>controller('down'));assert.equal(await page.evaluate(()=>genre),await page.evaluate(()=>genres[0]));
  await page.evaluate(()=>controller('up'));assert.ok(await page.evaluate(()=>favoritesOnly),'Up returns to the previous screen');
  assert.equal(await page.evaluate(()=>$('#cannes-next-name').textContent),await page.evaluate(()=>genres[0]));
  await page.evaluate(long=>{cannesOpen(sections().findIndex(s=>s.genre===long))},LONG);await settle();a=await audit();
  assert.ok(a.lettersFit&&a.letterSize>=12,'long category name fits legibly '+a.letterSize);assert.match(a.kicker,/Screen \d+ · 50 games/);
  await page.screenshot({path:path.join(out,'long-category.png')});

  // Favorites keep the selection and position; the ticket reflects history.
  await page.evaluate(()=>{genre=genres[1];favoritesOnly=false;update();cannesSelect(9)});await settle();
  const before=await page.evaluate(()=>({id:presentationId,offset:cannesOffset}));
  await page.evaluate(()=>controller('favorite'));await settle();
  const after=await page.evaluate(()=>({id:presentationId,offset:cannesOffset,badge:!!$('#grid .presentation-selected .favorite-badge'),ticket:$('#cannes-shown').textContent}));
  assert.equal(after.id,before.id);assert.equal(after.offset,before.offset,'favorite toggle keeps the row still');assert.ok(after.badge&&after.ticket.startsWith('★'),'favorite medallion and ticket');
  assert.ok(await page.evaluate(()=>{const card=$('#grid .presentation-selected'),r=card.getBoundingClientRect(),b=card.querySelector('.favorite-badge').getBoundingClientRect();return Math.abs(b.right-r.right-6)<1&&b.width===22}), 'favorite medallion stays on the outer right corner');
  assert.match(await page.evaluate(()=>{cannesSelect(filtered.findIndex(g=>!g.lastPlayed));return $('#cannes-shown').textContent}),/Not yet screened/);

  // Empty screens, search recovery and Back.
  await page.evaluate(()=>{games.forEach(g=>g.favorite=false);genre='';favoritesOnly=true;update()});
  assert.ok(await page.locator('.cannes-empty').isVisible(),'empty Favorites shows a sign');
  assert.equal(await page.evaluate(()=>getComputedStyle($('.cannes-hint[data-cannes-game]')).visibility),'hidden','game hints hide on an empty screen');
  await page.screenshot({path:path.join(out,'empty-favorites.png')});
  await page.evaluate(()=>{favoritesOnly=false;genre=genres[2];query='Feature 0001';$('#search').value=query;update()});
  assert.ok(await page.locator('.search-empty .show-all-matches').isVisible(),'search offers matches elsewhere');
  assert.equal(await page.locator('.cannes-empty').count(),0,'search panel replaces the dark sign');
  assert.equal(await page.evaluate(()=>nativeBack()),true);assert.equal(await page.evaluate(()=>query),'','Back clears search');
  assert.ok(await page.evaluate(()=>!!$('#grid .presentation-selected')),'row returns after search');

  // Editing, layout switching, settings and preview.
  await page.evaluate(()=>{cannesSelect(3);controller('edit')});assert.ok(await page.locator('#editor').evaluate(d=>d.open));await page.evaluate(()=>cancelEditor());
  await page.evaluate(()=>setPresentation('florence'));assert.equal(await page.locator('#cannes-marquee').isVisible(),false);
  await page.evaluate(()=>setPresentation('cannes'));assert.equal(await page.locator('#cannes-marquee').isVisible(),true);
  await page.evaluate(()=>{showDialog('#settings-dialog');refreshApplicableAppearanceControls();updateAppearancePreview()});
  const rows=await page.evaluate(()=>Object.fromEntries(['palette','typography','cover-brightness','art-fit','cover-glow','backdrop','selection-style','title-weight'].map(id=>[id,!$('#'+id).closest('.settings-row').hidden])));
  assert.deepEqual(rows,{palette:false,typography:true,'cover-brightness':true,'art-fit':true,'cover-glow':false,backdrop:false,'selection-style':false,'title-weight':true});
  await page.waitForTimeout(300);
  const preview=await page.locator('.appearance-sample').evaluate(e=>getComputedStyle(e).backgroundImage);assert.ok(preview.includes('gradient'),'preview uses the brass case');
  await page.evaluate(()=>hideDialog('#settings-dialog'));

  // Persistence across reload.
  await page.evaluate(()=>{genre=genres[4];favoritesOnly=false;update();cannesSelect(12);persist()});
  const saved=await page.evaluate(()=>({id:presentationId,genre}));
  await page.reload();await page.waitForFunction(()=>typeof restoring!=='undefined'&&!restoring);await settle();
  assert.deepEqual(await page.evaluate(()=>({presentation,id:presentationId,genre})),{presentation:'cannes',...saved});
  a=await audit();visibleIn(a,'after reload');
  assert.deepEqual(errors,[]);
  console.log('Cannes: seven screen ratios, windowed 2:3 cases, marquee fitting, held/reversed/paged navigation, screens, favorites, empty and search states, editing, settings, preview and reload passed.');
 }finally{await browser.close();await new Promise(r=>server.close(r))}
})().catch(e=>{console.error(e);process.exit(1)});
