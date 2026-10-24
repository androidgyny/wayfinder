const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),http=require('node:http');
const {chromium}=require('playwright');
const root=path.resolve(__dirname,'../app/src/main/assets/www'),out=path.resolve(__dirname,'../output/sanfrancisco-audit');fs.mkdirSync(out,{recursive:true});
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
 await page.evaluate(()=>{applyAppearanceValues(builtinAppearancePresets.find(p=>p.name==='Final Frontier').values);sanfranciscoPane='games';sanfranciscoFocus()});
 assert.equal(await page.evaluate(()=>presentation),'sanfrancisco');
 assert.equal(await page.evaluate(()=>typography),'oswald');
 await page.evaluate(()=>setTypography('outfit'));assert.equal(await page.evaluate(()=>presentation),'sanfrancisco');
 assert.match(await page.locator('#grid .game-title').first().evaluate(n=>getComputedStyle(n).fontFamily),/Outfit/);
 await page.evaluate(()=>setTypography('oswald'));
 assert.equal(await page.locator('#grid .game').count(),1200);assert.equal(await page.locator('#grid img').count(),0);
 assert.equal(await page.locator('#settings-button').evaluate(n=>getComputedStyle(n).borderTopStyle),'solid');
 await page.evaluate(()=>{filtered.find(g=>g.id===presentationId).lastPlayed=Date.now();renderSanfrancisco()});
 for(const [width,height] of [[1097,592],[1920,1080],[640,592],[960,400]]){
  await page.setViewportSize({width,height});await page.waitForTimeout(120);
  const boxes=await page.evaluate(()=>['sf-sidebar','grid','sf-preview','sf-commands','sf-commands','sanfrancisco-cover'].map(id=>{const n=document.getElementById(id),r=n.getBoundingClientRect();return {id,w:r.width,h:r.height,inside:r.left>=0&&r.top>=0&&r.right<=innerWidth+1&&r.bottom<=innerHeight+1}}));
  assert.ok(boxes.every(b=>b.inside&&b.w>0&&b.h>0),JSON.stringify(boxes));await page.screenshot({path:path.join(out,'layout-'+width+'x'+height+'.png')});
 }
 await page.setViewportSize({width:1097,height:592});
 await page.evaluate(()=>{sanfranciscoPane='games';sanfranciscoSelect(filtered[0].id,true);controller('down')});assert.equal(await page.evaluate(()=>filtered.findIndex(g=>g.id===presentationId)),1);
 await page.evaluate(()=>controller('pageDown'));assert.ok(await page.evaluate(()=>filtered.findIndex(g=>g.id===presentationId)>1));
 await page.evaluate(()=>controller('left'));assert.equal(await page.evaluate(()=>document.activeElement.closest('#sanfrancisco-categories')!==null),true);
 await page.evaluate(()=>controller('down'));assert.equal(await page.evaluate(()=>favoritesOnly),true);
 for(const action of ['down','down','up','down']){const before=await page.evaluate(()=>sectionIndex());await page.evaluate(a=>controller(a),action);assert.equal(await page.evaluate(()=>sectionIndex()),before+(action==='up'?-1:1));assert.equal(await page.evaluate(()=>sanfranciscoPane),'categories');assert.equal(await page.evaluate(()=>document.activeElement.closest('#sanfrancisco-categories')!==null),true);}
 await page.evaluate(()=>sanfranciscoOpen(1,'categories'));
 await page.evaluate(()=>controller('right'));assert.equal(await page.evaluate(()=>document.activeElement.closest('#grid')!==null),true);
 await page.evaluate(()=>controller('favorite'));assert.equal(await page.evaluate(()=>filtered.length),2);
 await page.evaluate(()=>controller('right'));
 await page.evaluate(()=>{sanfranciscoPane='games';sanfranciscoFocus();controller('activate')});assert.equal(await page.evaluate(()=>window.launched),await page.evaluate(()=>presentationId));
 await page.evaluate(()=>{sanfranciscoOpen(sections().findIndex(s=>s.genre==='Puzzles'),'games');query='Tengami';$('#search').value=query;update();sanfranciscoFocus();controller('down')});assert.equal(await page.locator('#grid .show-all-matches').count(),1);await page.evaluate(()=>controller('activate'));assert.equal(await page.locator('#grid .game').count(),1);
 await page.evaluate(()=>{query='';$('#search').value='';update();sanfranciscoOpen(0,'games');sanfranciscoSelect(filtered[33].id);persist()});const id=await page.evaluate(()=>presentationId);await page.reload();await page.waitForFunction(()=>!restoring);assert.equal(await page.evaluate(()=>presentation),'sanfrancisco');assert.equal(await page.evaluate(()=>presentationId),id);assert.equal(await page.evaluate(()=>typography),'oswald');
 await page.evaluate(()=>{showDialog('#settings-dialog');selectSettingsSection('appearance')});for(const selector of ['#cover-glow','#cover-shadow','#backdrop','#selection-style','#menu-buttons'])assert.equal(await page.locator(selector).isVisible(),false);assert.equal(await page.locator('#typography').isVisible(),true);
 await page.evaluate(()=>updateAppearancePreview());await page.waitForTimeout(100);
 for(const id of ['settings-button','close-settings']){const delta=await page.locator('#'+id).evaluate(b=>{const a=b.getBoundingClientRect(),s=b.querySelector('svg').getBoundingClientRect();return Math.abs(a.x+a.width/2-s.x-s.width/2)+Math.abs(a.y+a.height/2-s.y-s.height/2)});assert.ok(delta<1,id+' centered');}
 const treatment=await page.locator('.appearance-sample').evaluate(n=>{const s=getComputedStyle(n);return [s.borderTopWidth,s.outlineStyle,s.boxShadow]});assert.deepEqual(treatment,['0px','none','none']);

 await page.evaluate(()=>nativeBack());
 // Controls retain their own action instead of launching the selected game.
 await page.evaluate(()=>{$('#settings-button').focus();controller('activate')});assert.equal(await page.locator('#settings-dialog').isVisible(),true);await page.evaluate(()=>nativeBack());
 await page.evaluate(()=>{sanfranciscoOpen(0,'games');controller('left')});assert.match(await page.locator('#sf-command-activate').innerText(),/Open/);
 await page.locator('#sf-command-activate').click();assert.equal(await page.evaluate(()=>sanfranciscoPane),'games');
 await page.evaluate(()=>controller('left'));await page.evaluate(()=>controller('edit'));assert.equal(await page.locator('#detail').isVisible(),true);await page.evaluate(()=>nativeBack());
 // Remember the actual reading position, not just the selected title.
 await page.evaluate(()=>{sanfranciscoOpen(0,'games');sanfranciscoSelect(filtered[60].id,true);$('#grid').scrollTop=2500;persist()});const scroll=await page.locator('#grid').evaluate(n=>n.scrollTop);
 await page.evaluate(()=>{sanfranciscoOpen(2,'categories');sanfranciscoOpen(0,'categories')});assert.ok(Math.abs(await page.locator('#grid').evaluate(n=>n.scrollTop)-scroll)<2);
 // A launch moves the title to the top of Recent and updates its date.
 await page.evaluate(()=>{sort='recent';update();sanfranciscoSelect('g1199');nativeEvent('launched',{id:'g1199'})});assert.equal(await page.locator('#grid .game').first().getAttribute('data-id'),'g1199');assert.match(await page.locator('#sf-metadata').innerText(),/TODAY/);
 for(const p of ['starship','daylight','parchment','platinum','luna','pearl']){await page.evaluate(p=>setPalette(p),p);const contrast=await page.evaluate(()=>{const lum=c=>{const a=c.match(/[\d.]+/g).slice(0,3).map(v=>{v=+v/255;return v<=.04045?v/12.92:((v+.055)/1.055)**2.4});return a[0]*.2126+a[1]*.7152+a[2]*.0722};const bg=lum(getComputedStyle(document.body).backgroundColor);return ['#sf-section','#sf-sort','#sf-metadata'].map(q=>{const fg=lum(getComputedStyle($(q)).color);return (Math.max(fg,bg)+.05)/(Math.min(fg,bg)+.05)})});assert.ok(contrast.every(c=>c>=4.5),p+': '+contrast);}
 await page.evaluate(()=>{setPalette('starship');setLightAppearance(coverBorder,interfaceContrast,'bold')});assert.equal(await page.locator('#sf-game-title').evaluate(n=>getComputedStyle(n).fontWeight),'700');

 await page.evaluate(()=>{setAtmosphere('fireflies',selectionStyle)});assert.equal(await page.locator('#custom-backdrop').getAttribute('src'),null);await page.evaluate(()=>setAtmosphere('gradient',selectionStyle));assert.equal(await page.locator('#soft-gradient').isVisible(),false);await page.evaluate(()=>setAtmosphere('fireflies',selectionStyle));
 await page.evaluate(()=>setPresentation('kyoto'));assert.match(await page.locator('#custom-backdrop').getAttribute('src'),/fireflies/);await page.evaluate(()=>setPresentation('sanfrancisco'));
 // Last favorite and completely empty libraries must leave no stale cover or live Play button.
 await page.evaluate(()=>{for(const g of games)g.favorite=false;games[0].favorite=true;update();sanfranciscoOpen(1,'games');toggleFavorite(games[0].id)});assert.equal(await page.locator('#sf-command-activate').isEnabled(),false);assert.equal(await page.locator('#sanfrancisco-cover').getAttribute('src'),null);
 await page.evaluate(()=>{games=[];update();sanfranciscoOpen(0,'games')});assert.equal(await page.locator('#sf-command-activate').isEnabled(),false);assert.match(await page.locator('.sanfrancisco-empty').innerText(),/library is empty/);
 await page.evaluate(()=>{games=JSON.parse(JSON.stringify(auditGames));sort='az';update();sanfranciscoOpen(0,'games');wayfinderKeyboardChanged(true)});await page.setViewportSize({width:1097,height:300});await page.waitForTimeout(100);assert.equal(await page.locator('#sf-preview').isVisible(),false);assert.ok(await page.locator('#grid').evaluate(n=>n.clientHeight>40));
 assert.deepEqual(errors,[]);console.log('PASS Sanfrancisco: 1200 titles, folder cycle, 4 viewports, controller navigation, favorite removal, details, launch, search recovery, persistence, settings and keyboard');
 }finally{await browser.close();await new Promise(r=>server.close(r));}
})().catch(e=>{console.error(e);process.exitCode=1});





