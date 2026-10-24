const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),http=require('node:http');
const {chromium}=require('playwright');
const root=path.resolve(__dirname,'../app/src/main/assets/www'),out=path.resolve(__dirname,'../output/redmond-audit');fs.mkdirSync(out,{recursive:true});
const fixture=Array.from({length:1200},(_,i)=>({id:'g'+i,title:i===0?'Tengami':'Title '+String(i).padStart(4,'0'),genre:['Story adventures','Puzzles','Racing','User named folder','Arcade','Strategy','Custom 7','Custom 8'][i%8],image:'audit.svg',package:'test.app',kind:'app',favorite:i<3}));
(async()=>{
 const server=http.createServer((req,res)=>{const url=new URL(req.url,'http://localhost').pathname;
  if(url==='/audit.svg'){res.setHeader('Content-Type','image/svg+xml');return res.end('<svg xmlns="http://www.w3.org/2000/svg" width="600" height="900"><rect width="600" height="900" fill="#367c83"/><circle cx="300" cy="350" r="180" fill="#f4b5c2"/><text x="300" y="750" text-anchor="middle" font-size="70">TENGAMI</text></svg>');}
  if(url==='/games.js'){res.setHeader('Content-Type','application/javascript');return res.end('window.GAMES='+JSON.stringify(fixture));}
  try{const file=path.join(root,url==='/'?'index.html':url);res.setHeader('Content-Type',file.endsWith('.js')?'application/javascript':file.endsWith('.css')?'text/css':file.endsWith('.ttf')?'font/ttf':'text/html');res.end(fs.readFileSync(file));}catch{res.statusCode=404;res.end();}
 });await new Promise(r=>server.listen(0,'127.0.0.1',r));
 const browser=await chromium.launch({channel:'msedge',headless:true});const errors=[];
 try{const page=await browser.newPage({viewport:{width:1097,height:592}});page.on('pageerror',e=>errors.push(e.message));
 await page.addInitScript(g=>{window.auditGames=g;window.Portal={view:()=>localStorage.getItem('view')||'{}',saveView:v=>localStorage.setItem('view',v),library:()=>JSON.stringify(auditGames),sound:()=>{},setThemeColor:c=>window.themeColor=c,appsPreferences:()=>'[]',launch:id=>window.launched=id,favorite:(id,on)=>{auditGames.find(g=>g.id===id).favorite=on;return '{"ok":true}'}}},fixture);
 await page.goto('http://127.0.0.1:'+server.address().port);await page.waitForFunction(()=>typeof restoring!=='undefined'&&!restoring);
 await page.evaluate(()=>{applyAppearanceValues(builtinAppearancePresets.find(p=>p.name==='Experience').values);redmondBrowser.state.pane='games';redmondFocus()});
 assert.equal(await page.evaluate(()=>presentation),'redmond');
 assert.equal(await page.evaluate(()=>typography),'winetahoma');
 for(const palette of await page.evaluate(()=>palettes)){
  const contrast=await page.evaluate(p=>{setPalette(p);const s=getComputedStyle($('#add-game'));const lum=c=>{const v=c.match(/[\d.]+/g).slice(0,3).map(x=>{x=+x/255;return x<=.04045?x/12.92:((x+.055)/1.055)**2.4});return v[0]*.2126+v[1]*.7152+v[2]*.0722};const a=lum(s.color),b=lum(s.backgroundColor);return (Math.max(a,b)+.05)/(Math.min(a,b)+.05)},palette);
  assert.ok(contrast>=4.5,'Redmond Add game contrast: '+palette+' '+contrast);
 }
 await page.evaluate(()=>setPalette('luna'));

 for(const selector of ['#redmond-window-title','#grid .game-title','#redmond-edit'])assert.match(await page.locator(selector).first().evaluate(n=>getComputedStyle(n).fontFeatureSettings),/"liga" 0/);
 await page.evaluate(async()=>{await document.fonts.load('400 14px WineTahoma');await document.fonts.load('700 14px WineTahoma');await document.fonts.ready});
 assert.deepEqual(await page.evaluate(()=>[...document.fonts].filter(f=>f.family==='WineTahoma').map(f=>[f.weight,f.status])),[['400','loaded'],['700','loaded']]);
 assert.match(await page.locator('#grid .game-title').first().evaluate(n=>getComputedStyle(n).fontFamily),/WineTahoma/);
 await page.evaluate(()=>setTypography('outfit'));assert.equal(await page.evaluate(()=>presentation),'redmond');
 assert.match(await page.locator('#grid .game-title').first().evaluate(n=>getComputedStyle(n).fontFamily),/Outfit/);
 await page.evaluate(()=>setTypography('winetahoma'));
 assert.equal(await page.locator('#grid .game').count(),1200);assert.equal(await page.locator('#grid img').count(),0);
 assert.equal(await page.locator('#redmond-categories .folder').count(),8);
 assert.equal(await page.locator('#settings-button').evaluate(n=>getComputedStyle(n).borderTopStyle),'solid');
 assert.equal(await page.locator('#redmond-favorite .star').count(),1);
 assert.equal(await page.locator('#redmond-favorite').getAttribute('aria-pressed'),'true');
 await page.evaluate(()=>{filtered.find(g=>g.id===presentationId).lastPlayed=Date.now();renderRedmond()});
 assert.equal(await page.locator('#grid .presentation-selected .redmond-date').textContent(),'Today');
 assert.equal(await page.locator('#redmond-played-value').count(),0);assert.equal(await page.locator('#redmond-type-value').textContent(),'Android app · test.app');assert.equal(await page.evaluate(()=>redmondTarget({kind:'shortcut',intentUri:'https://example.com/game'})),'Shortcut · https://example.com/game');
 const colors=await page.locator('#redmond-categories .folder').evaluateAll(nodes=>nodes.map(n=>n.style.getPropertyValue('--folder-color')));assert.equal(new Set(colors).size,6);assert.equal(colors[0],colors[6]);
 for(const [width,height] of [[1097,592],[1920,1080],[640,592],[960,400]]){
  await page.setViewportSize({width,height});await page.waitForTimeout(120);
  const boxes=await page.evaluate(()=>['redmond-sidebar','grid','redmond-preview','redmond-actions','redmond-footer','redmond-cover'].map(id=>{const n=document.getElementById(id),r=n.getBoundingClientRect();return {id,w:r.width,h:r.height,inside:r.left>=0&&r.top>=0&&r.right<=innerWidth+1&&r.bottom<=innerHeight+1}}));
  assert.ok(boxes.every(b=>b.inside&&b.w>0&&b.h>0),JSON.stringify(boxes));await page.screenshot({path:path.join(out,'layout-'+width+'x'+height+'.png')});
 }
 await page.setViewportSize({width:1097,height:592});
 await page.evaluate(()=>{redmondBrowser.state.pane='games';redmondSelect(filtered[0].id,true);controller('down')});assert.equal(await page.evaluate(()=>filtered.findIndex(g=>g.id===presentationId)),1);
 await page.evaluate(()=>controller('pageDown'));assert.ok(await page.evaluate(()=>filtered.findIndex(g=>g.id===presentationId)>1));
 await page.evaluate(()=>controller('left'));assert.equal(await page.evaluate(()=>document.activeElement.closest('#redmond-categories')!==null),true);
 await page.evaluate(()=>controller('down'));assert.equal(await page.evaluate(()=>favoritesOnly),true);
 for(const action of ['down','down','up','down']){const before=await page.evaluate(()=>sectionIndex());await page.evaluate(a=>controller(a),action);assert.equal(await page.evaluate(()=>sectionIndex()),before+(action==='up'?-1:1));assert.equal(await page.evaluate(()=>redmondBrowser.state.pane),'categories');assert.equal(await page.evaluate(()=>document.activeElement.closest('#redmond-categories')!==null),true);}
 await page.evaluate(()=>redmondOpen(1,'categories'));
 await page.evaluate(()=>controller('right'));assert.equal(await page.evaluate(()=>document.activeElement.closest('#grid')!==null),true);
 await page.evaluate(()=>controller('favorite'));assert.equal(await page.evaluate(()=>filtered.length),2);
 await page.locator('#redmond-toolbar button').first().click();assert.equal(await page.locator('#redmond-toolbar button').first().innerText(),'Categories');assert.equal(await page.evaluate(()=>redmondBrowser.state.pane),'categories');
 await page.evaluate(()=>controller('right'));
 assert.equal(await page.locator('#redmond-edit').evaluate(n=>getComputedStyle(n).webkitTapHighlightColor),'rgba(0, 0, 0, 0)');
 assert.equal(await page.locator('#redmond-titlebar').evaluate(n=>getComputedStyle(n).borderTopLeftRadius),'0px');
 await page.locator('#redmond-edit').click();assert.equal(await page.locator('#editor').isVisible(),true);await page.evaluate(()=>nativeBack());
 await page.evaluate(()=>{redmondBrowser.state.pane='games';redmondFocus();controller('activate')});assert.equal(await page.evaluate(()=>window.launched),await page.evaluate(()=>presentationId));
 await page.evaluate(()=>{redmondOpen(sections().findIndex(s=>s.genre==='Puzzles'),'games');query='Tengami';$('#search').value=query;update();redmondFocus();controller('down')});assert.equal(await page.locator('#grid .show-all-matches').count(),1);await page.evaluate(()=>controller('activate'));assert.equal(await page.locator('#grid .game').count(),1);
 await page.evaluate(()=>{query='';$('#search').value='';update();redmondOpen(0,'games');redmondSelect(filtered[33].id);persist()});const id=await page.evaluate(()=>presentationId);await page.reload();await page.waitForFunction(()=>!restoring);assert.equal(await page.evaluate(()=>presentation),'redmond');assert.equal(await page.evaluate(()=>presentationId),id);assert.equal(await page.evaluate(()=>typography),'winetahoma');
 await page.evaluate(()=>{showDialog('#settings-dialog');selectSettingsSection('appearance')});for(const selector of ['#cover-glow','#cover-shadow','#backdrop','#selection-style','#menu-buttons'])assert.equal(await page.locator(selector).isVisible(),false);assert.equal(await page.locator('#typography').isVisible(),true);
 await page.evaluate(()=>updateAppearancePreview());await page.waitForTimeout(100);
 for(const id of ['settings-button','close-settings']){const delta=await page.locator('#'+id).evaluate(b=>{const a=b.getBoundingClientRect(),s=b.querySelector('svg').getBoundingClientRect();return Math.abs(a.x+a.width/2-s.x-s.width/2)+Math.abs(a.y+a.height/2-s.y-s.height/2)});assert.ok(delta<1,id+' centered');}
 const treatment=await page.locator('.appearance-sample').evaluate(n=>{const s=getComputedStyle(n);return [s.borderTopWidth,s.outlineStyle,s.boxShadow]});assert.deepEqual(treatment,['0px','none','none']);

 await page.evaluate(()=>nativeBack());
 // Controls retain their own action instead of launching the selected game.
 await page.evaluate(()=>{$('#settings-button').focus();controller('activate')});assert.equal(await page.locator('#settings-dialog').isVisible(),true);await page.evaluate(()=>nativeBack());
 await page.evaluate(()=>{redmondOpen(0,'games');controller('left')});assert.match(await page.locator('#redmond-hint-activate').innerText(),/Open/);
 await page.locator('#redmond-hint-activate').click();assert.equal(await page.evaluate(()=>redmondBrowser.state.pane),'games');
 await page.evaluate(()=>controller('left'));await page.evaluate(()=>controller('edit'));assert.equal(await page.locator('#editor').isVisible(),true);await page.evaluate(()=>nativeBack());
 // Remember the actual reading position, not just the selected title.
 await page.evaluate(()=>{redmondOpen(0,'games');redmondSelect(filtered[60].id,true);$('#grid').scrollTop=2200;persist()});const scroll=await page.locator('#grid').evaluate(n=>n.scrollTop);
 await page.evaluate(()=>{redmondOpen(2,'categories');redmondOpen(0,'categories')});assert.ok(Math.abs(await page.locator('#grid').evaluate(n=>n.scrollTop)-scroll)<2);
 // A launch moves the title to the top of Recent and updates its date.
 await page.evaluate(()=>{sort='recent';update();nativeEvent('launched',{id:'g1199'})});assert.equal(await page.locator('#grid .game').first().getAttribute('data-id'),'g1199');assert.equal(await page.locator('#grid .game').first().locator('.redmond-date').textContent(),'Today');
 await page.evaluate(()=>{setAtmosphere('fireflies',selectionStyle)});assert.equal(await page.locator('#custom-backdrop').getAttribute('src'),null);
 await page.evaluate(()=>setPresentation('kyoto'));assert.match(await page.locator('#custom-backdrop').getAttribute('src'),/fireflies/);await page.evaluate(()=>setPresentation('redmond'));
 // Last favorite and completely empty libraries must leave no stale cover or live Play button.
 await page.evaluate(()=>{for(const g of games)g.favorite=false;games[0].favorite=true;update();redmondOpen(1,'games');toggleFavorite(games[0].id)});assert.equal(await page.locator('#redmond-play').isEnabled(),false);assert.equal(await page.locator('#redmond-cover').getAttribute('src'),null);
 await page.evaluate(()=>{games=[];update();redmondOpen(0,'games')});assert.equal(await page.locator('#redmond-play').isEnabled(),false);assert.match(await page.locator('.redmond-empty').innerText(),/library is empty/);
 await page.evaluate(()=>{games=JSON.parse(JSON.stringify(auditGames));sort='az';update();redmondOpen(0,'games');wayfinderKeyboardChanged(true)});await page.setViewportSize({width:1097,height:300});await page.waitForTimeout(100);assert.equal(await page.locator('#redmond-preview').isVisible(),false);assert.ok(await page.locator('#grid').evaluate(n=>n.clientHeight>40));
 await page.evaluate(()=>{wayfinderKeyboardChanged(false);setPresentation('kyoto')});assert.equal(await page.locator('#redmond-titlebar').isVisible(),false);assert.equal(await page.locator('#redmond-cover').getAttribute('src'),null);
 assert.deepEqual(errors,[]);console.log('PASS Redmond: 1200 titles, folder cycle, 4 viewports, controller navigation, favorite removal, details, launch, search recovery, persistence, settings and keyboard');
 }finally{await browser.close();await new Promise(r=>server.close(r));}
})().catch(e=>{console.error(e);process.exitCode=1});
