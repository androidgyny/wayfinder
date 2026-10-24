const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),http=require('node:http');
const {chromium}=require('playwright');
const root=path.resolve(__dirname,'../app/src/main/assets/www'),out=path.resolve(__dirname,'../output/showcase-audit');fs.mkdirSync(out,{recursive:true});
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
 for(const [preset,layout] of [['Homage','milan'],['Blades','bellevue']]){
 await page.evaluate(name=>{for(const d of document.querySelectorAll('dialog[open]'))hideDialog('#'+d.id);query='';$('#search').value='';genre='';favoritesOnly=false;applyAppearanceValues(builtinAppearancePresets.find(p=>p.name===name).values);showcasePane='games';showcaseSelect(0)},preset);
 await page.waitForTimeout(200);assert.equal(await page.evaluate(()=>presentation),layout);
 if(layout==='bellevue'){const cache=await page.evaluate(()=>{showcaseOpen(2);const svg=$('#blade-surfaces').innerHTML;showcaseOpen(3);showcaseOpen(2);const same=svg===$('#blade-surfaces').innerHTML;showcaseOpen(0);showcasePane='games';showcaseSelect(0);return {same,size:bladeBevelCache.size}});assert.ok(cache.same&&cache.size<=32,'Cached bevels preserve the rendered geometry')}

 if(layout==='bellevue'){
  const untouched=await page.evaluate(()=>{const observer=new MutationObserver(()=>{});for(const id of ['showcase-tabs','blade-surfaces'])observer.observe($('#'+id),{attributes:true,childList:true,subtree:true,characterData:true});showcaseSelect(1,false);showcaseSelect(8,false);showcaseSelect(0,false);const count=observer.takeRecords().length;observer.disconnect();return count});
  assert.equal(untouched,0,'Title navigation and paging leave category chrome untouched');
 }
 if(layout==='milan'){await page.locator('#showcase-category-next').click();assert.equal(await page.evaluate(()=>sectionIndex()),1);await page.locator('#showcase-category-prev').click();assert.equal(await page.evaluate(()=>sectionIndex()),0);assert.ok(await page.locator('#showcase-category-prev').isDisabled());await page.evaluate(()=>{showcasePane='games';showcaseFocus()})}
 assert.equal(await page.locator('#grid img').count(),0);assert.equal(await page.locator('#grid .game').count(),8);
 await page.evaluate(()=>controller('up'));assert.equal(await page.evaluate(()=>showcasePane),'tabs');await page.evaluate(()=>controller('right'));assert.equal(await page.evaluate(()=>favoritesOnly),true);assert.equal(await page.evaluate(()=>showcasePane),'tabs');await page.evaluate(()=>controller('down'));assert.equal(await page.evaluate(()=>showcasePane),'games');
 await page.evaluate(()=>{showcaseOpen(0);showcasePane='games';showcaseSelect(7);controller('down')});assert.equal(await page.evaluate(()=>presentationId),'g8');await page.evaluate(()=>controller('up'));assert.equal(await page.evaluate(()=>presentationId),'g7');await page.evaluate(()=>controller('pageDown'));assert.equal(await page.evaluate(()=>presentationId),'g15');
 await page.evaluate(()=>controller('activate'));assert.equal(await page.evaluate(()=>window.launched),'g15');await page.evaluate(()=>controller('edit'));assert.ok(await page.locator('#editor').isVisible());await page.evaluate(()=>nativeBack());assert.equal(await page.evaluate(()=>document.activeElement.dataset.id),'g15');
 await page.evaluate(()=>controller('favorite'));assert.ok(await page.locator('#grid .presentation-selected .favorite-badge').count());await page.evaluate(()=>controller('favorite'));
 await page.evaluate(()=>{showcaseOpen(sections().findIndex(s=>s.genre==='Story adventures'));query='Monument';$('#search').value=query;update();showcasePane='games';showcaseFocus()});assert.equal(await page.locator('#grid .show-all-matches').count(),1);await page.evaluate(()=>controller('activate'));assert.equal(await page.evaluate(()=>filtered.length),1);
 if(layout==='bellevue'){assert.equal(await page.locator('.showcase-tab.current .showcase-tab-count').textContent(),'1 game found');const hits=await page.evaluate(()=>[...document.querySelectorAll('#showcase-tabs .showcase-tab:not(.current):not([hidden])')].every(b=>{const label=b.querySelector('.showcase-tab-label').getBoundingClientRect(),count=b.querySelector('small').getBoundingClientRect();return label.bottom<count.top}));assert.ok(hits,'Search counts do not overlap blade labels')}
 await page.evaluate(()=>{showcaseBack();showcaseOpen(0);showcasePane='games';showcaseSelect(101);persist()});await page.reload();await page.waitForFunction(()=>!restoring);assert.equal(await page.evaluate(()=>presentation),layout);assert.equal(await page.evaluate(()=>presentationId),'g101');assert.equal(await page.evaluate(()=>document.activeElement.dataset.id),'g101');
 await page.evaluate(()=>{showcasePane='tabs';showcaseFocus();showDialog('#settings-dialog');$('#appearance-presets').value='Hyperstack';auditionAppearancePreset();finishAppearanceAudition(false)});assert.equal(await page.evaluate(()=>showcasePane),'tabs');assert.equal(await page.evaluate(()=>presentation),layout);await page.evaluate(()=>hideDialog('#settings-dialog'));
 await page.evaluate(()=>{showcaseOpen(2);showcasePane='games';showcaseSelect(0)});
 for(const [width,height] of [[1097,592],[1920,1080],[960,400],[640,592],[390,700]]){
 await page.setViewportSize({width,height});await page.waitForTimeout(150);
 const boxes=await page.evaluate(()=>['grid','showcase-footer'].map(id=>{const r=document.getElementById(id).getBoundingClientRect();return {id,w:r.width,h:r.height,inside:r.left>=0&&r.top>=0&&r.right<=innerWidth+1&&r.bottom<=innerHeight+1}}));assert.ok(boxes.every(b=>b.inside&&b.w>0&&b.h>0),JSON.stringify(boxes));
 if(width>600){const art=await page.locator('#showcase-cover').boundingBox();assert.ok(Math.abs(art.height/art.width-1.5)<.02,'Portrait proportion');}
 if(layout==='milan')assert.ok(await page.evaluate(()=>{const nav=$('#showcase-tabs').getBoundingClientRect();return [...$('#showcase-tabs').children].filter(b=>!b.hidden).every(b=>{const r=b.getBoundingClientRect();return r.left>=nav.left-1&&r.right<=nav.right+1})}),'Whole category buttons remain inside strip');
 if(layout==='bellevue')assert.ok(await page.evaluate(()=>[...document.querySelectorAll('#showcase-tabs .showcase-tab:not(.current):not([hidden])')].every(b=>{const r=b.getBoundingClientRect(),label=b.querySelector('.showcase-tab-label'),q=label.getBoundingClientRect(),cs=getComputedStyle(label);return q.top>=r.top+60&&q.bottom<=r.bottom-60&&q.left>=r.left&&q.right<=r.right+1&&Math.abs((q.left+q.right-r.left-r.right)/2)<1&&cs.overflow==='hidden'&&cs.textOverflow==='ellipsis'})),'Blade labels clear curved ends and clip safely');
 await page.screenshot({path:path.join(out,`${layout}-${width}.png`)});
 }
 await page.setViewportSize({width:1097,height:592});
 for(const fit of ['cover','contain'])for(const border of ['none','hairline','matte'])for(const corners of ['square','soft','rounded']){
 await page.evaluate(v=>{setArtFit(v.fit);setLightAppearance(v.border,interfaceContrast,titleWeight);setCoverOptions(v.corners,coverBrightness,menuButtons);showDialog('#settings-dialog');selectSettingsSection('appearance');updateAppearancePreview()}, {fit,border,corners});await page.waitForTimeout(120);
 const styles=await page.evaluate(()=>{const a=getComputedStyle($('#showcase-cover')),b=getComputedStyle($('.appearance-sample img'));return [a.objectFit,b.objectFit,a.borderWidth,b.borderWidth,a.borderRadius,b.borderRadius]});assert.equal(styles[0],styles[1]);assert.equal(styles[2],styles[3]);assert.equal(styles[4],styles[5]);await page.evaluate(()=>hideDialog('#settings-dialog'));
 }
 await page.evaluate(()=>controller('search'));assert.equal(await page.evaluate(()=>document.activeElement.id),'search');await page.evaluate(()=>nativeBack());assert.notEqual(await page.evaluate(()=>document.activeElement.id),'search');
 await page.evaluate(()=>{setTypography('ibmvga');openApps()});assert.ok(await page.locator('#apps-drawer').evaluate(n=>getComputedStyle(n).fontFamily.includes('WayfinderClean')));await page.evaluate(()=>hideDialog('#apps-drawer'));
 const layouts=await page.locator('#presentation option').evaluateAll(nodes=>nodes.map(n=>n.value));
 for(const other of layouts.filter(l=>!['milan','bellevue'].includes(l))){await page.evaluate(l=>setPresentation(l),other);assert.equal(await page.locator('#showcase-tabs').isVisible(),false);await page.evaluate(l=>setPresentation(l),layout);assert.equal(await page.locator('#showcase-tabs').isVisible(),true)}
 console.log('PASS '+preset+': controller panes, paging, launch/edit/favorite, search, persistence, preview cancellation, 5 sizes, 18 cover treatments, Apps isolation and all layout transitions');
 }
 await page.evaluate(()=>{games=[];rebuildGenres();update()});assert.equal(await page.locator('#showcase-cover').getAttribute('src'),null);assert.ok(await page.locator('.showcase-empty').isVisible());for(const action of ['up','down','activate','edit','favorite','pageDown'])await page.evaluate(a=>controller(a),action);
 assert.deepEqual(errors,[]);console.log('PASS empty library and no JavaScript errors');
 }finally{await browser.close();server.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
