const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),http=require('node:http');
const {chromium}=require('playwright');
const root=path.resolve(__dirname,'../app/src/main/assets/www'),out=path.resolve(__dirname,'../output/dashboard-audit');fs.mkdirSync(out,{recursive:true});
const fixture=Array.from({length:1200},(_,i)=>({id:'g'+i,title:i===0?'Tengami':'Title '+String(i).padStart(4,'0'),genre:['Story adventures','Puzzles','Racing','User named folder','Arcade','Strategy','Custom 7','Custom 8'][i%8],image:'audit.svg',package:'test.app',kind:'app',favorite:i<3,lastPlayed:i<25?Date.now()-i*60000:0}));
(async()=>{
 const server=http.createServer((req,res)=>{const url=new URL(req.url,'http://localhost').pathname;
  if(url==='/audit.svg'){res.setHeader('Content-Type','image/svg+xml');return res.end('<svg xmlns="http://www.w3.org/2000/svg" width="600" height="900"><rect width="600" height="900" fill="#367c83"/><circle cx="300" cy="350" r="180" fill="#f4b5c2"/><text x="300" y="750" text-anchor="middle" font-size="70">TENGAMI</text></svg>');}
  if(url==='/games.js'){res.setHeader('Content-Type','application/javascript');return res.end('window.GAMES='+JSON.stringify(fixture));}
  try{const file=path.join(root,url==='/'?'index.html':url);res.setHeader('Content-Type',file.endsWith('.js')?'application/javascript':file.endsWith('.css')?'text/css':file.endsWith('.ttf')?'font/ttf':file.endsWith('.svg')?'image/svg+xml':'text/html');res.end(fs.readFileSync(file));}catch{res.statusCode=404;res.end();}
 });await new Promise(r=>server.listen(0,'127.0.0.1',r));
 const browser=await chromium.launch({channel:'msedge',headless:true});const errors=[];
 try{const page=await browser.newPage({viewport:{width:1097,height:592}});page.on('pageerror',e=>errors.push(e.message));
 await page.addInitScript(g=>{window.auditGames=g;window.Portal={view:()=>localStorage.getItem('view')||'{}',saveView:v=>localStorage.setItem('view',v),library:()=>JSON.stringify(auditGames),sound:()=>{},setThemeColor:c=>window.themeColor=c,appsPreferences:()=>'[]',launch:id=>window.launched=id,favorite:(id,on)=>{auditGames.find(g=>g.id===id).favorite=on;return '{"ok":true}'}}},fixture);
 await page.goto('http://127.0.0.1:'+server.address().port);await page.waitForFunction(()=>typeof restoring!=='undefined'&&!restoring);


 await page.evaluate(()=>applyAppearanceValues(builtinAppearancePresets.find(p=>p.name==='Boxer').values));
 await page.waitForTimeout(200);
 assert.equal(await page.evaluate(()=>presentation),'dashboard');
 await page.selectOption('#dashboard-sort','za');assert.equal(await page.evaluate(()=>sort),'za');assert.equal(await page.locator('#sort').inputValue(),'za');
 await page.selectOption('#dashboard-sort','az');
 assert.equal(await page.locator('#dashboard-hints .key-lb').count(),1);assert.equal(await page.locator('#dashboard-hints .key-rb').count(),1);

 assert.equal(await page.locator('#presentation option[value=dashboard]').textContent(),'Durango');
 assert.deepEqual(await page.evaluate(()=>builtinAppearancePresets.filter(p=>p.values.presentation==='dashboard').map(p=>p.name)),['Boxer']);
 assert.equal(await page.evaluate(()=>builtinAppearancePresets.find(p=>p.name==='Launchbiz').values.presentation),'library');
 assert.equal(await page.locator('.dashboard-recent').count(),20);
 for(const density of ['compact','comfortable','large']){
 await page.evaluate(d=>{setSize(d);dashboardOpen(1,'games')},density);
 const overlaps=await page.locator('#grid .game').evaluateAll(cards=>cards.filter(c=>{const badge=c.querySelector('.favorite-badge'),title=c.querySelector('.game-title');if(!badge)return false;const b=badge.getBoundingClientRect(),t=title.getBoundingClientRect(),r=c.getBoundingClientRect(),padding=parseFloat(getComputedStyle(title).paddingRight);return b.left<t.right-padding||b.right>r.right||b.bottom>r.bottom} ).length);
 assert.equal(overlaps,0,'favorite stars occupy reserved right-hand space at '+density);
 }
 await page.evaluate(()=>{setSize('comfortable');dashboardOpen(0,'games')});

 await page.locator('#dashboard-rail-mode').selectOption('favorites');assert.equal(await page.locator('.dashboard-recent').count(),3);
 assert.ok(await page.locator('.dashboard-recent img').first().evaluate(n=>Math.abs(n.getBoundingClientRect().height/n.getBoundingClientRect().width-1.5)<.001),'sidebar artwork is exactly 2:3');
 await page.locator('#dashboard-rail-mode').selectOption('recent');
 await page.evaluate(()=>{controllerFocus($('#dashboard-library'));controller('down')});assert.equal(await page.evaluate(()=>document.activeElement.id),'dashboard-favorites');
 await page.evaluate(()=>controller('activate'));assert.equal(await page.evaluate(()=>favoritesOnly),true);
 await page.evaluate(()=>{controllerFocus($('#dashboard-apps'));controller('activate')});assert.ok(await page.locator('#apps-drawer').isVisible());await page.evaluate(()=>nativeBack());
 await page.evaluate(()=>dashboardOpen(0,'games'));

 assert.ok(await page.locator('#grid .game').count()<100,'virtualized 1200-game grid');
 await page.evaluate(()=>dashboardSelect(0));
 await page.evaluate(()=>controller('left'));assert.equal(await page.evaluate(()=>dashboard.pane),'recents');
 await page.evaluate(()=>controller('down'));assert.equal(await page.evaluate(()=>dashboard.recentId),'g1');
 await page.evaluate(()=>controller('activate'));assert.equal(await page.evaluate(()=>window.launched),'g1');
 await page.evaluate(()=>controller('edit'));assert.ok(await page.locator('#editor').isVisible());await page.evaluate(()=>nativeBack());
 await page.evaluate(()=>controller('right'));assert.equal(await page.evaluate(()=>presentationId),'g0');
 await page.evaluate(()=>controller('up'));assert.equal(await page.evaluate(()=>dashboard.pane),'categories');
 await page.evaluate(()=>controller('right'));assert.equal(await page.evaluate(()=>favoritesOnly),true);
 await page.evaluate(()=>controller('down'));assert.equal(await page.evaluate(()=>dashboard.pane),'games');
 await page.evaluate(()=>{dashboardOpen(0,'games');dashboardSelect(100)});assert.equal(await page.evaluate(()=>presentationId),'g100');
 await page.evaluate(()=>controller('down'));assert.equal(await page.evaluate(()=>presentationId),'g'+await page.evaluate(()=>100+dashboard.columns));
 await page.evaluate(()=>controller('pageDown'));assert.ok(await page.evaluate(()=>filtered.findIndex(g=>g.id===presentationId)>104));
 await page.evaluate(()=>{dashboardOpen(sections().findIndex(s=>s.genre==='Puzzles'),'games');query='Tengami';$('#search').value=query;update()});
 assert.equal(await page.locator('#grid .show-all-matches').count(),1);
 assert.match(await page.locator('#dashboard-categories').innerText(),/1/);
 // Recent games remain global while search and categories filter the main grid.
 assert.equal(await page.locator('.dashboard-recent').count(),20);
 await page.evaluate(()=>{dashboardFocus();controller('activate')});assert.equal(await page.evaluate(()=>filtered.length),1);
 await page.evaluate(()=>{query='';$('#search').value='';dashboardOpen(0,'games');dashboardSelect(0)});
 await page.locator('#dashboard-hints button').first().click();assert.equal(await page.evaluate(()=>window.launched),'g0');
 await page.evaluate(()=>{dashboardOpen(2,'games');controller('left');controller('favorite')});assert.equal(await page.evaluate(()=>dashboard.pane),'recents');assert.equal(await page.evaluate(()=>document.activeElement.closest('#dashboard-recents')!==null),true);
 for(const [width,height] of [[1097,592],[1920,1080],[640,592],[960,400],[390,700]]){
  await page.setViewportSize({width,height});await page.waitForTimeout(100);
  const boxes=await page.evaluate(()=>['dashboard-sidebar','grid','dashboard-categories','dashboard-hints'].map(id=>{const r=document.getElementById(id).getBoundingClientRect();return {id,w:r.width,h:r.height,inside:r.left>=0&&r.top>=0&&r.right<=innerWidth+1&&r.bottom<=innerHeight+1}}));assert.ok(boxes.every(b=>b.inside&&b.w>0&&b.h>0),JSON.stringify(boxes));
  const ratio=await page.locator('#grid .cover').first().evaluate(n=>n.clientHeight/n.clientWidth);assert.ok(Math.abs(ratio-1.5)<.02,ratio);
  await page.screenshot({path:path.join(out,'layout-'+width+'x'+height+'.png')});
 }
 await page.setViewportSize({width:1097,height:592});
 await page.evaluate(()=>{dashboardOpen(0,'games');dashboardSelect(200);persist()});const selectedId=await page.evaluate(()=>presentationId);
 await page.reload();await page.waitForFunction(()=>!restoring);assert.equal(await page.evaluate(()=>presentation),'dashboard');assert.equal(await page.evaluate(()=>presentationId),selectedId);
 await page.evaluate(()=>{dashboard.pane='recents';dashboard.recentId='g4';dashboardFocus();showDialog('#settings-dialog');$('#appearance-presets').value='Launchbiz';auditionAppearancePreset();finishAppearanceAudition(false)});assert.equal(await page.evaluate(()=>presentation),'dashboard');assert.equal(await page.evaluate(()=>dashboard.pane),'recents');assert.equal(await page.evaluate(()=>dashboard.recentId),'g4');await page.evaluate(()=>hideDialog('#settings-dialog'));


 await page.evaluate(()=>{dashboardOpen(0,'games');dashboardSelect(80)});const collapseId=await page.evaluate(()=>presentationId);
 const expandedWidth=await page.locator('#grid').evaluate(n=>n.clientWidth);
 await page.click('#dashboard-toggle');await page.waitForTimeout(150);
 assert.equal(await page.locator('#dashboard-toggle').getAttribute('aria-expanded'),'false');
 assert.ok(await page.locator('#grid').evaluate(n=>n.clientWidth)>expandedWidth);
 assert.equal(await page.locator('#dashboard-recents').isVisible(),false);
 assert.equal(await page.evaluate(()=>presentationId),collapseId);
 await page.evaluate(()=>{controllerFocus($('#dashboard-apps'));controller('down')});assert.ok(await page.evaluate(()=>document.activeElement.closest('#dashboard-categories')!==null));

 await page.evaluate(()=>{dashboardSelect(dashboard.columns);dashboardController('left')});
 assert.equal(await page.evaluate(()=>document.activeElement.id),'dashboard-library');
 await page.evaluate(()=>persist());await page.reload();await page.waitForFunction(()=>!restoring);
 assert.equal(await page.evaluate(()=>dashboardOptions.collapsed),true);
 await page.evaluate(()=>{controllerFocus($('#dashboard-toggle'));dashboardController('activate')});
 assert.equal(await page.locator('#dashboard-toggle').getAttribute('aria-expanded'),'true');
 assert.ok(await page.locator('#dashboard-recents').isVisible());

 for(const [width,height] of [[1097,592],[800,600],[960,640],[960,600],[1260,540],[640,360],[390,700]])for(const collapsed of [false,true]){
  await page.setViewportSize({width,height});await page.evaluate(collapsed=>{setDashboardOptions({...dashboardOptions,collapsed});dashboardOpen(0,'games');dashboardSelect(200)},collapsed);await page.waitForTimeout(120);
  const bad=await page.evaluate(()=>[...document.querySelectorAll('.topbar button,.topbar .search,#dashboard-sort,#dashboard-title')].filter(n=>n.getClientRects().length).map(n=>({id:n.id||n.className,r:n.getBoundingClientRect().toJSON()})).filter(({r})=>r.left<0||r.right>innerWidth+1||r.top<0));assert.deepEqual(bad,[],`header ${width} collapsed=${collapsed}`);
  const visible=await page.locator('#grid .presentation-selected').evaluate(n=>{const r=n.getBoundingClientRect(),g=n.closest('#grid').getBoundingClientRect();return r.bottom<=g.bottom-2&&r.top>=g.top+2});assert.ok(visible,`selected card ${width} collapsed=${collapsed}`);
 }
 await page.setViewportSize({width:1097,height:592});

 await page.evaluate(()=>{setDashboardOptions({...dashboardOptions,collapsed:false});dashboardOpen(0,'games');dashboardSelect(100)});
 const beforeFav=await page.locator('#grid').evaluate(n=>n.scrollTop);await page.evaluate(()=>controller('favorite'));assert.ok(Math.abs(await page.locator('#grid').evaluate(n=>n.scrollTop)-beforeFav)<2,'favoriting preserves scroll');
 await page.evaluate(()=>{controller('controls')});for(let i=0;i<15;i++){assert.ok(await page.evaluate(()=>{const n=document.activeElement;return !!n.getClientRects().length&&getComputedStyle(n).visibility!=='hidden'}));await page.evaluate(()=>controller('right'))}await page.evaluate(()=>controller('back'));
 await page.evaluate(()=>showDialog('#settings-dialog'));assert.equal(await page.locator('#dashboard-options').evaluate(n=>n.hidden),false);await page.evaluate(()=>hideDialog('#settings-dialog'));
 const densityCounts=[];
 for(const density of ['spacious','balanced','dense']){
  await page.evaluate(density=>{setDashboardOptions({density,colors:'cover'});dashboardOpen(0,'games');dashboardSelect(0)},density);
  await page.waitForTimeout(150);densityCounts.push(await page.evaluate(()=>dashboard.columns));
  const ratio=await page.locator('#grid .cover').first().evaluate(n=>n.clientWidth/n.clientHeight);assert.ok(Math.abs(ratio-2/3)<.01);
 }
 assert.ok(densityCounts[0]<densityCounts[1]&&densityCounts[1]<densityCounts[2]);
 assert.equal(await page.evaluate(()=>appearanceSnapshot().dashboardOptions.colors),'cover');
 await page.evaluate(()=>persist());await page.reload();await page.waitForFunction(()=>!restoring);
 assert.equal(await page.evaluate(()=>dashboardOptions.density),'dense');assert.equal(await page.evaluate(()=>dashboardOptions.colors),'cover');
 await page.evaluate(()=>setDashboardOptions({density:'balanced',colors:'fixed'}));
 // A previous row must not leave caption slivers in the top padding.
 await page.evaluate(()=>{dashboardOpen(0,'games');$('#grid').scrollTop=dashboard.pitch-12;paintDashboard()});
 assert.equal(await page.locator('#grid .game').first().evaluate(n=>getComputedStyle(n).visibility),'hidden');
 await page.evaluate(()=>{$('#grid').scrollTop=0;paintDashboard()});
 assert.equal(await page.locator('#grid .game').first().evaluate(n=>getComputedStyle(n).visibility),'visible');
 // Touch scrolling does not snap back to the old selected row.
 await page.evaluate(()=>{$('#grid').scrollTop=13000});await page.waitForTimeout(200);assert.ok(await page.locator('#grid').evaluate(n=>n.scrollTop)>12900);
 assert.ok(await page.locator('#grid .game').count()<100);
 await page.evaluate(()=>{dashboard.pane='games';controller('down')});assert.ok(await page.evaluate(()=>filtered.findIndex(g=>g.id===presentationId)>100));
 for(const layout of ['library','berlin','seattle','atlantis','redmond','kyoto','dashboard']){await page.evaluate(l=>setPresentation(l),layout);assert.equal(await page.evaluate(()=>presentation),layout);assert.equal(await page.locator('#dashboard-sidebar').isVisible(),layout==='dashboard');assert.equal(await page.locator('#dashboard-toggle').isVisible(),layout==='dashboard');assert.equal(await page.locator('#dashboard-sort').isVisible(),layout==='dashboard');assert.equal(await page.locator('#dashboard-options').evaluate(n=>n.hidden),layout!=='dashboard');}
 await page.evaluate(()=>{games=[];rebuildGenres();update()});assert.equal(await page.locator('.dashboard-recent').count(),0);assert.ok(await page.locator('.dashboard-empty').isVisible());await page.evaluate(()=>{dashboardFocus();controller('left');controller('down');controller('activate')});
 assert.deepEqual(errors,[]);console.log('Dashboard regression checks passed: windowing, controller panes, recents, search, favorites, presets, persistence, five viewport sizes, empty library.');
 }finally{await browser.close();server.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
