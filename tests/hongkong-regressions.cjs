const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),http=require('node:http');
const {chromium}=require('playwright');
const root=path.resolve(__dirname,'../app/src/main/assets/www'),out=path.resolve(__dirname,'../output/hongkong-audit');fs.mkdirSync(out,{recursive:true});
const fixture=Array.from({length:1200},(_,i)=>({id:'g'+i,title:i===0?'Monument Valley':'Title '+String(i).padStart(4,'0'),genre:['Puzzles','Story adventures','Racing','A very long user category name that must remain usable'][i%4],image:'audit.svg',package:'test.app',kind:'app',favorite:i<3}));
(async()=>{
 const server=http.createServer((req,res)=>{const url=new URL(req.url,'http://localhost').pathname;
 if(url==='/audit.svg'){res.setHeader('Content-Type','image/svg+xml');return res.end('<svg xmlns="http://www.w3.org/2000/svg" width="600" height="900"><rect width="600" height="900" fill="#367c83"/><circle cx="300" cy="350" r="180" fill="#f4b5c2"/><text x="300" y="750" text-anchor="middle" font-size="50">MONUMENT VALLEY</text></svg>')}
 if(url==='/games.js'){res.setHeader('Content-Type','application/javascript');return res.end('window.GAMES='+JSON.stringify(fixture))}
 try{const file=path.join(root,url==='/'?'index.html':url);res.setHeader('Content-Type',file.endsWith('.js')?'application/javascript':file.endsWith('.css')?'text/css':file.endsWith('.ttf')?'font/ttf':file.endsWith('.svg')?'image/svg+xml':'text/html');res.end(fs.readFileSync(file))}catch{res.statusCode=404;res.end()}});
 await new Promise(r=>server.listen(0,'127.0.0.1',r));const browser=await chromium.launch({channel:'msedge',headless:true}),errors=[];
 try{const page=await browser.newPage({viewport:{width:1097,height:592}});page.on('pageerror',e=>errors.push(e.message));
 await page.addInitScript(g=>{window.auditGames=g;window.Portal={view:()=>localStorage.getItem('view')||'{}',saveView:v=>localStorage.setItem('view',v),library:()=>JSON.stringify(auditGames),sound:()=>{},hideKeyboard:()=>window.keyboardDismissals=(window.keyboardDismissals||0)+1,setThemeColor:c=>window.themeColor=c,appsPreferences:()=>'[]',launch:id=>window.launched=id,favorite:(id,on)=>{auditGames.find(g=>g.id===id).favorite=on;return '{"ok":true}'}}},fixture);
 await page.goto('http://127.0.0.1:'+server.address().port);await page.waitForFunction(()=>typeof restoring!=='undefined'&&!restoring);
 await page.evaluate(()=>{applyAppearanceValues(builtinAppearancePresets.find(p=>p.name==='Cognate').values);hongkongPane='games';hongkongSelect(0)});await page.waitForTimeout(300);await page.evaluate(()=>document.fonts.ready);
 console.log('STATE',await page.evaluate(()=>({presentation,hongkongView,hongkongTone,typography,errors:0,grid:$('#grid').getBoundingClientRect().toJSON(),art:$('#hongkong-cover').getBoundingClientRect().toJSON()})));
 for(const tone of ['light','dark'])for(const view of ['list','carousel','grid']){await page.evaluate(([v,t])=>setHongKongOptions(v,t),[view,tone]);await page.waitForTimeout(100);await page.screenshot({path:path.join(out,tone+'-'+view+'.png')});}
 assert.equal(await page.evaluate(()=>typography),'gamepocket');
 await page.evaluate(()=>{setHongKongOptions('carousel','dark');hongkongSelect(12)});
 const geometry=await page.evaluate(()=>{const rows=[...$('#grid').children],r=$('#grid .presentation-selected').getBoundingClientRect(),g=$('#grid').getBoundingClientRect();return {width:r.width,other:rows[11].getBoundingClientRect().width,anchor:r.left-g.left,expected:g.width*.28,title:$('#hongkong-title').textContent,meta:$('#hongkong-meta').textContent}});
 assert.ok(Math.abs(geometry.width-geometry.other)<1,'carousel covers stay equal-sized');
 assert.ok(Math.abs(geometry.anchor-geometry.expected)<2,'selection follows the reading anchor');
 assert.ok(geometry.title&&geometry.meta,'selected title and existing category appear');
 await page.evaluate(()=>{query='nothing matches';$('#search').value=query;update()});
 assert.equal(await page.locator('#hongkong-title').textContent(),'','empty search clears stale title');
 assert.equal(await page.locator('#hongkong-meta').textContent(),'','empty search clears stale details');
 await page.evaluate(()=>{query='';$('#search').value='';update()});

 assert.ok(await page.evaluate(()=>document.fonts.check('22px GamePocket')));
 // All presentations retain the selected record and controller position.
 for(const view of ['list','carousel','grid']){
  await page.evaluate(v=>{setHongKongOptions(v,'light');hongkongPane='games';hongkongSelect(15)},view);
  const id=await page.evaluate(()=>presentationId);
  await page.evaluate(()=>setHongKongOptions(hongkongView,'dark'));assert.equal(await page.evaluate(()=>presentationId),id);
  await page.evaluate(()=>controller('right'));assert.notEqual(await page.evaluate(()=>presentationId),id);
  await page.evaluate(()=>{hongkongSelect(0);controller('up')});assert.equal(await page.evaluate(()=>hongkongPane),'tabs');
  await page.evaluate(()=>controller('right'));assert.equal(await page.evaluate(()=>favoritesOnly),true);
  await page.evaluate(()=>{controller('down');controller('activate')});assert.ok(await page.evaluate(()=>!!window.launched));
  await page.evaluate(()=>{hongkongOpen(0);hongkongPane='games';hongkongSelect(0)});
 }
 await page.evaluate(()=>{games[7].lastPlayed=100;games[8].lastPlayed=200;hongkongOpen(2)});
 assert.deepEqual(await page.evaluate(()=>filtered.map(g=>g.id)),['g8','g7']);
 await page.evaluate(()=>{query='Monument';$('#search').value=query;update()});assert.equal(await page.locator('#grid .search-empty').count(),1);assert.ok((await page.locator('#grid').textContent()).includes('Recently played'));
 await page.evaluate(()=>{hongkongPane='games';hongkongFocus();controller('activate')});assert.equal(await page.evaluate(()=>filtered.length),1);assert.equal(await page.evaluate(()=>hongkongRecent),false);
 await page.evaluate(()=>{query='';$('#search').value='';hongkongOpen(0);hongkongPane='games';hongkongSelect(25);setHongKongOptions('list','light')});
 const performanceResult=await page.evaluate(()=>{const start=performance.now();for(let i=26;i<76;i++)hongkongSelect(i,false);return (performance.now()-start)/50});console.log('Mean selection ms:',performanceResult);assert.ok(performanceResult<40);
 for(const [width,height] of [[1097,592],[960,720],[960,600],[960,640],[1260,540],[640,360],[1097,300]]){
  await page.setViewportSize({width,height});
  for(const view of ['list','carousel','grid']){await page.evaluate(v=>{setHongKongOptions(v,'light');query='not a real title';$('#search').value=query;update()},view);await page.waitForTimeout(70);
   const bounds=await page.evaluate(()=>{const r=$('#grid .search-empty').getBoundingClientRect(),g=$('#grid').getBoundingClientRect(),f=$('#hongkong-footer').getBoundingClientRect();return {r:r.toJSON(),g:g.toJSON(),f:f.toJSON(),overflow:document.documentElement.scrollWidth-innerWidth}});
   assert.ok(bounds.overflow<=1,'horizontal viewport overflow');assert.ok(bounds.r.top>=bounds.g.top-1&&bounds.r.bottom<=bounds.f.top+1,JSON.stringify({width,height,view,bounds}));
   await page.evaluate(()=>{query='';$('#search').value='';update()});
  }
 }
 await page.setViewportSize({width:1097,height:592});
 await page.evaluate(()=>{setHongKongOptions('grid','dark');hongkongSelect(3);showDialog('#settings-dialog');selectSettingsSection('appearance');updateAppearancePreview()});await page.waitForTimeout(150);
 assert.equal(await page.locator('#hongkong-options').isVisible(),true);
 await page.evaluate(()=>hideDialog('#settings-dialog'));
 for(const layout of ['bath','library','sedona','atlantis','hongkong']){await page.evaluate(l=>setPresentation(l),layout);assert.equal(await page.locator('#hongkong-tabs').isVisible(),layout==='hongkong')}
 await page.evaluate(()=>{setHongKongOptions('carousel','dark');persist()});await page.reload();await page.waitForFunction(()=>!restoring);assert.equal(await page.evaluate(()=>presentation),'hongkong');assert.equal(await page.evaluate(()=>hongkongView),'carousel');assert.equal(await page.evaluate(()=>hongkongTone),'dark');
 await page.evaluate(()=>{hongkongOpen(0);hongkongPane='games';hongkongSelect(12)});
 const preserved=await page.evaluate(()=>presentationId);
 await page.evaluate(()=>{const g=games.find(g=>g.id===presentationId);g.lastPlayed=0;renderHongKong(true)});
 assert.equal(await page.locator('#hongkong-meta').textContent(),'Not played yet');
 await page.evaluate(()=>nativeEvent('launched',{id:presentationId}));
 assert.equal(await page.locator('#hongkong-meta').textContent(),'Last played: Today','launch updates the visible history subtitle');

 for(const v of ['grid','list','carousel']){await page.evaluate(v=>setHongKongOptions(v,hongkongTone),v);assert.equal(await page.evaluate(()=>presentationId),preserved);assert.equal(await page.locator('#grid .game[tabindex="0"]').count(),1);}
 await page.waitForTimeout(250);await page.evaluate(()=>{$('#grid').scrollLeft+=($('#grid .game').offsetWidth+26)*3});await page.waitForTimeout(500);assert.notEqual(await page.evaluate(()=>presentationId),preserved,'scrolling carousel updates selected game');
 await page.evaluate(()=>{setHongKongOptions('list','light');hongkongSelect(0);window.launched=null});
 await page.locator('#grid .game').nth(2).click();assert.equal(await page.evaluate(()=>window.launched),null,'first touch selects');assert.equal(await page.evaluate(()=>presentationId),'g2');
 await page.locator('#grid .game').nth(2).click();assert.equal(await page.evaluate(()=>window.launched),'g2','second touch opens');
 for(const tone of ['light','dark'])for(const view of ['list','carousel','grid']){
  await page.setViewportSize({width:1097,height:592});await page.evaluate(([v,t])=>{setHongKongOptions(v,t);query='nothing here';$('#search').value=query;update();$('#search').focus();wayfinderKeyboardChanged(true)},[view,tone]);await page.setViewportSize({width:1097,height:220});await page.waitForTimeout(100);
  assert.equal(await page.locator('#hongkong-footer').isVisible(),false);
  assert.ok(await page.locator('#grid .search-empty').evaluate(n=>{const r=n.getBoundingClientRect();return r.top>=0&&r.bottom<=innerHeight+1}),'keyboard empty message fits');
  await page.evaluate(()=>{wayfinderKeyboardChanged(false);$('#search').blur();query='';$('#search').value='';update()});
 }
 await page.setViewportSize({width:1097,height:592});await page.evaluate(()=>{setHongKongOptions('list','light');openApps()});await page.waitForTimeout(100);
 assert.ok(!await page.locator('#apps-drawer').evaluate(n=>getComputedStyle(n).fontFamily.includes('GamePocket')),'Apps retains its independent font');await page.evaluate(()=>hideDialog('#apps-drawer'));
 
 await page.evaluate(()=>{setHongKongOptions('carousel','dark');hongkongOpen(0);hongkongSelect(0);games[0].lastPlayed='invalid';games[0].favorite=true;renderHongKong(true)});
 assert.equal(await page.locator('#hongkong-meta').textContent(),'Not played yet · ★ Favorite');
 await page.evaluate(()=>{const d=new Date();games[0].lastPlayed=new Date(d.getFullYear(),d.getMonth(),d.getDate()-1,12).getTime();renderHongKong(true)});
 assert.equal(await page.locator('#hongkong-meta').textContent(),'Last played: Yesterday · ★ Favorite');
 await page.evaluate(()=>{games=[];rebuildGenres();genre='';favoritesOnly=false;hongkongRecent=false;update()});
 for(const v of ['list','carousel','grid']){await page.evaluate(v=>setHongKongOptions(v,'light'),v);assert.equal(await page.locator('#hongkong-title').textContent(),'');assert.equal(await page.locator('#hongkong-meta').textContent(),'');assert.ok(await page.locator('#grid').innerText());}
 console.log('PASS Hong Kong: three views, two tones, category navigation, recents, search recovery, aspect ratios and keyboard sizes, settings, layout isolation, persistence, touch and carousel scroll');assert.deepEqual(errors,[]);
 }finally{await browser.close();server.close()}
})().catch(e=>{console.error(e);process.exit(1)});
