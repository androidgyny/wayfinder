const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),http=require('node:http');
const {chromium}=require('playwright');
const root=path.resolve(__dirname,'../app/src/main/assets/www'),out=path.resolve(__dirname,'../output/sedona-audit');fs.mkdirSync(out,{recursive:true});
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
 await page.evaluate(()=>{applyAppearanceValues(builtinAppearancePresets.find(p=>p.name==='Amped Up').values);sedonaPane='games';sedonaSelect(0)});await page.waitForTimeout(200);
 assert.equal(await page.evaluate(()=>presentation),'sedona');
 await page.evaluate(async()=>{await document.fonts.ready;games[0].title='A very long game title that continues well beyond the stereo display and must scroll smoothly';update();sedonaSelect(0)});
 await page.waitForTimeout(100);
 assert.equal(await page.locator('#sedona-title.marquee').count(),1,'long title scrolls');
 assert.equal(await page.locator('.sedona-title-track').evaluate(n=>n.getAnimations().length),1);
 const motion=await page.locator('.sedona-title-track').evaluate(n=>{const a=n.getAnimations()[0];a.pause();a.currentTime=2000;return a.effect.getKeyframes().at(-1).transform});assert.ok(motion.includes('translateX(-'),'motion travels left');
 await page.evaluate(()=>{games[0].title='Short';update();sedonaSelect(0)});await page.waitForTimeout(100);
 assert.equal(await page.locator('#sedona-title.marquee').count(),0,'short title remains stationary');
 await page.evaluate(()=>{games[0].title='An extremely long title '.repeat(8);update();sedonaSelect(0)});await page.waitForTimeout(100);
 await page.emulateMedia({reducedMotion:'reduce'});await page.waitForTimeout(100);assert.equal(await page.locator('#sedona-title.marquee').count(),0,'respects reduced motion');
 await page.emulateMedia({reducedMotion:'no-preference'});await page.waitForTimeout(100);assert.equal(await page.locator('#sedona-title.marquee').count(),1);
 await page.evaluate(()=>{games[0].title='Monument Valley';update();sedonaSelect(0)});
assert.equal(await page.locator('#palette').inputValue(),'ampere');assert.equal(await page.locator('#grid img').count(),0);assert.equal(await page.locator('#grid .game').count(),8);
 const chromeMutations=await page.evaluate(()=>{const observer=new MutationObserver(()=>{});for(const id of ['sedona-tabs','sedona-category','sedona-count','genres'])observer.observe($('#'+id),{subtree:true,childList:true,attributes:true,characterData:true});sedonaSelect(1,false);sedonaSelect(8,false);sedonaSelect(0,false);const count=observer.takeRecords().length;observer.disconnect();return count});
 assert.equal(chromeMutations,0,'selection and paging do not rewrite category or search chrome');

 await page.evaluate(()=>{sedonaSelect(7);controller('down')});assert.equal(await page.evaluate(()=>filtered.findIndex(g=>g.id===presentationId)),8);
 await page.evaluate(()=>controller('up'));assert.equal(await page.evaluate(()=>filtered.findIndex(g=>g.id===presentationId)),7);
 await page.evaluate(()=>{sedonaSelect(0);controller('up')});assert.equal(await page.evaluate(()=>sedonaPane),'tabs');
 await page.evaluate(()=>controller('right'));assert.equal(await page.evaluate(()=>favoritesOnly),true);
 await page.evaluate(()=>controller('down'));assert.equal(await page.evaluate(()=>sedonaPane),'games');
 await page.locator('#sedona-shuffle').click();assert.ok(await page.evaluate(()=>!!presentationId));
 await page.locator('#sedona-play').click();assert.ok(await page.evaluate(()=>!!window.launched));
 await page.evaluate(()=>{favoritesOnly=false;genre='Puzzles';query='';update();sedonaSelect(0);});
 // Saving into the open category refreshes its rows and count without leaving it.
 await page.evaluate(()=>{
  window.Portal.save=raw=>{window.auditGames.push(JSON.parse(raw));return '{"ok":true}'};
  editGame({id:'added-game',title:'A newly added game',genre:'Puzzles',image:'audit.svg',kind:'app',package:'test.new'},true);
  $('#edit-form').requestSubmit();
 });
 assert.equal(await page.evaluate(()=>genre),'Puzzles','save preserves the open category');
 assert.equal(await page.evaluate(()=>filtered.length),301,'save immediately refreshes the category count');
 assert.equal(await page.locator('#grid [data-id="added-game"]').count(),1,'new game appears immediately in sorted list');
 assert.equal(await page.locator('#editor').evaluate(n=>n.open),false);
 await page.evaluate(()=>{window.auditGames=window.auditGames.filter(g=>g.id!=='added-game');reloadLibrary();sedonaSelect(0)});
 await page.evaluate(()=>document.fonts.ready);assert.ok(await page.locator('#sedona-title').evaluate(n=>getComputedStyle(n).fontFamily.includes('WayfinderDoto')));assert.ok(await page.evaluate(()=>document.fonts.check('800 34px WayfinderDoto')));assert.deepEqual(await page.locator('#sedona-transport b').allTextContents(),['\u25c0\u25c0','\u25b6','\u25b6\u25b6','\u2928','\u2605']);assert.equal(await page.locator('#sedona-count').evaluate(n=>getComputedStyle(n,'::before').content),'\" \u00b7 \"');assert.ok(!await page.locator('#sedona-footer').evaluate(n=>/[\u00c2\u00c3\u00e2\ufffd]/.test(n.textContent)));await page.screenshot({path:path.join(out,'library.png')});
 await page.locator('#sedona-scroll').focus();await page.keyboard.press('End');assert.equal(await page.evaluate(()=>filtered.findIndex(g=>g.id===presentationId)),await page.evaluate(()=>filtered.length-1));await page.keyboard.press('Home');assert.equal(await page.evaluate(()=>filtered.findIndex(g=>g.id===presentationId)),0);const rail=await page.locator('#sedona-scroll').boundingBox();await page.mouse.move(rail.x+rail.width/2,rail.y+10);await page.mouse.down();await page.mouse.move(rail.x+rail.width/2,rail.y+rail.height-2);await page.mouse.up();assert.equal(await page.evaluate(()=>filtered.findIndex(g=>g.id===presentationId)),await page.evaluate(()=>filtered.length-1));
 await page.evaluate(()=>{controller('search')});assert.equal(await page.evaluate(()=>document.activeElement.id),'search');
 await page.locator('#search').fill('no such game');await page.locator('#search').dispatchEvent('input');await page.waitForTimeout(250);assert.equal(await page.locator('#sedona-play').isDisabled(),true);
 await page.evaluate(()=>nativeBack());assert.equal(await page.evaluate(()=>query),'');
 await page.evaluate(()=>{showDialog('#settings-dialog');updateAppearancePreview()});await page.waitForTimeout(200);
 const art=await page.evaluate(()=>{const a=getComputedStyle($('#sedona-cover')),b=getComputedStyle($('.appearance-sample img'));return [a.objectFit,b.objectFit,a.borderWidth,b.borderWidth]});assert.equal(art[0],art[1]);assert.equal(art[2],art[3]);
 await page.evaluate(()=>hideDialog('#settings-dialog'));
 for(const layout of ['bath','redmond','library','sedona','bellevue','sedona']){await page.evaluate(l=>setPresentation(l),layout);assert.equal(await page.locator('#sedona-tabs').isVisible(),layout==='sedona')}
 for(const size of [{width:1097,height:592},{width:960,height:450},{width:800,height:500}]){await page.setViewportSize(size);await page.waitForTimeout(100);assert.ok(await page.locator('#grid').evaluate(n=>n.clientHeight>100));}
 await page.evaluate(()=>{applyAppearanceValues(builtinAppearancePresets.find(p=>p.name==='Amped Up').values);persist()});await page.reload();await page.waitForFunction(()=>!restoring);assert.equal(await page.evaluate(()=>presentation),'sedona');
 assert.deepEqual(errors,[]);console.log('PASS Sedona: paging, category focus, shuffle, launch, search, empty controls, preview, layout switches, sizes, persistence');
 }finally{await browser.close();server.close()}
})().catch(e=>{console.error(e);process.exit(1)});
