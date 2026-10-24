const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),http=require('node:http');
const {chromium}=require('playwright');
const root=path.resolve(__dirname,'../app/src/main/assets/www'),out=path.resolve(__dirname,'../output/bath-audit');fs.mkdirSync(out,{recursive:true});
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
 await page.evaluate(()=>{applyAppearanceValues(builtinAppearancePresets.find(p=>p.name==='Field Notes').values);bathPane='games';bathSelect(0)});await page.waitForTimeout(200);
 assert.equal(await page.evaluate(()=>presentation),'bath');assert.equal(await page.locator('#palette').inputValue(),'notebook');assert.equal(await page.locator('#grid img').count(),0);assert.equal(await page.locator('#grid .game').count(),8);
 assert.ok(await page.locator('#bath-category').evaluate(n=>getComputedStyle(n).fontFamily.includes('WayfinderHand')),'Notebook heading uses handwriting despite global heading font rules');
 assert.ok(await page.evaluate(()=>$('#bath-tabs').parentElement.matches('.topbar')),'Colored tabs share the top bar');
 const gap=await page.evaluate(()=>$('#bath-tabs').getBoundingClientRect().left-$('.brand').getBoundingClientRect().right);assert.ok(gap>=3,'Tabs never overlap the brand');
 const colors=await page.locator('.bath-tab').evaluateAll(nodes=>nodes.slice(0,6).map(n=>getComputedStyle(n).backgroundColor));assert.equal(new Set(colors).size,6,'Tabs keep distinct pastel colors');
 await page.locator('#bath-footer .bath-hint').filter({hasText:'Search'}).click();assert.equal(await page.evaluate(()=>document.activeElement.id),'search');assert.equal(await page.locator('.search').evaluate(n=>getComputedStyle(n).opacity),'1');
 await page.evaluate(()=>controller('down'));assert.equal(await page.locator('.search').evaluate(n=>getComputedStyle(n).opacity),'0');
 await page.evaluate(()=>controller('search'));assert.equal(await page.evaluate(()=>document.activeElement.id),'search');await page.evaluate(()=>controller('down'));
 await page.screenshot({path:path.join(out,'initial.png')});
 await page.evaluate(()=>controller('up'));assert.equal(await page.evaluate(()=>bathPane),'tabs');
 await page.evaluate(()=>controller('right'));assert.equal(await page.evaluate(()=>favoritesOnly),true);assert.equal(await page.evaluate(()=>bathPane),'tabs');
 await page.evaluate(()=>controller('down'));assert.equal(await page.evaluate(()=>bathPane),'games');
 await page.evaluate(()=>{bathOpen(0);bathPane='games';bathSelect(7);controller('down')});assert.equal(await page.evaluate(()=>presentationId),'g8');assert.equal(await page.locator('#grid .game').count(),8);
 await page.evaluate(()=>controller('up'));assert.equal(await page.evaluate(()=>presentationId),'g7');
 await page.evaluate(()=>controller('pageDown'));assert.equal(await page.evaluate(()=>presentationId),'g15');
 await page.evaluate(()=>controller('activate'));assert.equal(await page.evaluate(()=>window.launched),'g15');
 await page.evaluate(()=>controller('edit'));assert.ok(await page.locator('#editor').isVisible());await page.evaluate(()=>nativeBack());assert.equal(await page.evaluate(()=>document.activeElement.dataset.id),'g15');
 await page.evaluate(()=>controller('favorite'));assert.ok(await page.locator('#grid .presentation-selected .favorite-badge').count());assert.equal(await page.locator('#grid .presentation-selected .bath-unstar').count(),0,'Favorite never shows both star styles');
 await page.evaluate(()=>{bathPane='tabs';bathOpen(sections().findIndex(s=>s.genre==='Story adventures'));query='Monument';$('#search').value=query;update();bathPane='games';bathFocus()});
 assert.equal(await page.locator('#grid .show-all-matches').count(),1);await page.evaluate(()=>controller('activate'));assert.equal(await page.evaluate(()=>filtered.length),1);
 await page.evaluate(()=>{bathBack();bathOpen(0);bathPane='games';bathSelect(101);persist()});await page.reload();await page.waitForFunction(()=>!restoring);assert.equal(await page.evaluate(()=>presentation),'bath');assert.equal(await page.evaluate(()=>presentationId),'g101');assert.equal(await page.evaluate(()=>document.activeElement.dataset.id),'g101','restart focuses the saved game instead of the first search input');
 await page.evaluate(()=>{bathPane='tabs';bathFocus();showDialog('#settings-dialog');$('#appearance-presets').value='Hyperstack';auditionAppearancePreset();finishAppearanceAudition(false)});assert.equal(await page.evaluate(()=>bathPane),'tabs');assert.equal(await page.evaluate(()=>presentation),'bath');await page.evaluate(()=>hideDialog('#settings-dialog'));
 for(const [width,height] of [[1097,592],[1920,1080],[960,400],[640,592],[390,700]]){
  await page.setViewportSize({width,height});await page.waitForTimeout(100);
  const boxes=await page.evaluate(()=>['bath-tabs','grid','bath-footer'].map(id=>{const r=document.getElementById(id).getBoundingClientRect();return {id,w:r.width,h:r.height,inside:r.left>=0&&r.top>=0&&r.right<=innerWidth+1&&r.bottom<=innerHeight+1}}));assert.ok(boxes.every(b=>b.inside&&b.w>0&&b.h>0),JSON.stringify(boxes));
  assert.ok(await page.locator('.brand>span:last-child').isVisible(),'Name tab stays readable at '+width);
  const join=await page.evaluate(()=>{const tab=$('#bath-tabs .current').getBoundingClientRect(),main=$('#main').getBoundingClientRect();return Math.abs(tab.bottom-main.top)});assert.ok(join<1.5,'Selected tab joins the notebook at '+width);
  await page.screenshot({path:path.join(out,`layout-${width}x${height}.png`)});
 }
 await page.setViewportSize({width:1097,height:592});
 for(const palette of ['notebook','graphite','daylight']){await page.evaluate(p=>setPalette(p),palette);assert.equal(await page.locator('#grid img').count(),0);await page.screenshot({path:path.join(out,'palette-'+palette+'.png')})}
 await page.evaluate(()=>{setPalette('notebook');showDialog('#settings-dialog');selectSettingsSection('appearance');updateAppearancePreview()});await page.waitForTimeout(200);
 assert.equal(await page.locator('#selection-style').isVisible(),false);assert.equal(await page.locator('#art-fit').isVisible(),true);
 const art=await page.evaluate(()=>{const a=getComputedStyle($('#bath-cover')),b=getComputedStyle($('.appearance-sample img'));return [a.objectFit,b.objectFit,a.borderWidth,b.borderWidth]});assert.equal(art[0],art[1]);assert.equal(art[2],art[3]);
 assert.equal(await page.locator('.appearance-sample').evaluate(n=>getComputedStyle(n,'::after').display),'block','Notebook preview includes its masking tape');
 assert.equal(await page.locator('#settings-dialog').evaluate(n=>getComputedStyle(n).getPropertyValue('--bg').trim()),'#f4eddf','Notebook dialogs inherit readable paper surfaces rather than the desk');
 await page.screenshot({path:path.join(out,'settings.png')});await page.evaluate(()=>hideDialog('#settings-dialog'));
 for(const layout of ['library','paloalto','atlantis','redmond','dashboard','bath']){await page.evaluate(l=>setPresentation(l),layout);assert.equal(await page.locator('#bath-tabs').isVisible(),layout==='bath')}

 await page.evaluate(()=>{setPresentation('bath');bathPane='tabs';bathFocus();controller('search')});
 assert.equal(await page.evaluate(()=>document.activeElement.id),'search');
 assert.equal(await page.evaluate(()=>nativeBack()),true,'Back handles an empty notebook search');
 assert.notEqual(await page.evaluate(()=>document.activeElement.id),'search','Back dismisses an empty notebook search');assert.ok(await page.evaluate(()=>keyboardDismissals>0),'Search dismissal also hides the Android keyboard');
 await page.evaluate(()=>controller('search'));await page.evaluate(()=>controller('back'));assert.notEqual(await page.evaluate(()=>document.activeElement.id),'search','Controller Back also dismisses search');
 await page.evaluate(()=>{setPresentation('library');setPalette('notebook')});
 assert.equal(await page.evaluate(()=>getComputedStyle(document.body).getPropertyValue('--bg').trim()),'#f4eddf','Notebook palette uses paper outside the notebook desk');
 await page.evaluate(()=>{setPresentation('bath');setTypography('ibmvga');openApps()});
 for(const selector of ['#apps-drawer','#app-appearance','#pack-icon-picker']){
  if(selector!=='#apps-drawer')await page.evaluate(id=>showDialog(id),selector);
  assert.ok(await page.locator(selector).evaluate(n=>getComputedStyle(n).fontFamily.includes('WayfinderClean')),'Apps font remains independent: '+selector);
  assert.equal(await page.locator(selector).evaluate(n=>getComputedStyle(n).getPropertyValue('--bg').trim()),'#f4eddf','Apps uses paper surfaces: '+selector);
  if(selector!=='#apps-drawer')await page.evaluate(id=>hideDialog(id),selector);
 }
 await page.evaluate(()=>{hideDialog('#apps-drawer');setTypography('clean')});
 const layouts=await page.locator('#presentation option').evaluateAll(nodes=>nodes.map(n=>n.value));
 const sharedSnapshot=()=>['.topbar','.brand','.search','#settings-button','#open-apps','#main','#grid'].map(selector=>{const n=document.querySelector(selector),s=getComputedStyle(n),r=n.getBoundingClientRect();return [selector,s.display,s.position,s.fontFamily,s.backgroundImage,s.margin,s.padding,s.borderRadius,s.transform,Math.round(r.width),Math.round(r.height)]});
 for(const layout of layouts.filter(l=>l!=='bath')){
  await page.evaluate(l=>{setPalette('graphite');setPresentation(l)},layout);await page.waitForTimeout(30);const before=await page.evaluate(sharedSnapshot);
  await page.evaluate(()=>setPresentation('bath'));await page.evaluate(l=>setPresentation(l),layout);await page.waitForTimeout(30);
  assert.deepEqual(await page.evaluate(sharedSnapshot),before,'Notebook styling is removed on returning to '+layout);
  assert.equal(await page.locator('#bath-tabs').isVisible(),false);
 }
 await page.evaluate(()=>{setPresentation('bath');setPalette('notebook');bathPane='games';bathSelect(0)});
 await page.evaluate(()=>{games=[];rebuildGenres();update()});assert.equal(await page.locator('#bath-cover').getAttribute('src'),null);assert.ok(await page.locator('.bath-empty').isVisible());for(const action of ['up','down','activate','edit','favorite','pageDown'])await page.evaluate(a=>controller(a),action);
 assert.deepEqual(errors,[]);console.log('Bath checks passed: paging, text-only rows, search across categories, controller panes, edit/favorite, persistence, preset cancellation, cover preview, five viewports, all 19 layout transitions, palette/dialog isolation, Apps fonts, search dismissal, tape preview and empty library.');
 }finally{await browser.close();server.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
