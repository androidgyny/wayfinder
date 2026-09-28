/* Run with Node and Playwright installed; BROWSER_CHANNEL defaults to msedge.
   Uses a synthetic library and images. No device or personal files are required. */
const assert=require('node:assert/strict');
const fs=require('node:fs');
const http=require('node:http');
const path=require('node:path');
const {chromium}=require('playwright');
const root=path.resolve(__dirname,'../app/src/main/assets/www');
const fixture={id:'audit',title:'Audit & Cover',genre:'Puzzles',kind:'app',package:'test.audit',image:'audit-image.svg',favorite:true,lastPlayed:123};
const svg='<svg xmlns="http://www.w3.org/2000/svg" width="600" height="900"><rect width="600" height="900" fill="#357a62"/></svg>';
(async()=>{
 const server=http.createServer((req,res)=>{const pathname=new URL(req.url,'http://localhost').pathname;
 if(pathname.includes('audit-image')||pathname.startsWith('/icon/')||pathname.startsWith('/art-icon/')){res.setHeader('Content-Type','image/svg+xml');res.end(svg);return;}
 if(pathname==='/games.js'){res.setHeader('Content-Type','application/javascript');res.end('window.GAMES='+JSON.stringify([fixture]));return;}
 const file=path.join(root,pathname==='/'?'index.html':pathname);try{res.setHeader('Content-Type',file.endsWith('.js')?'application/javascript':file.endsWith('.css')?'text/css':file.endsWith('.ttf')?'font/ttf':'text/html');res.end(fs.readFileSync(file));}catch{res.statusCode=404;res.end();}});
 await new Promise(r=>server.listen(0,'127.0.0.1',r));
 const browser=await chromium.launch({channel:process.env.BROWSER_CHANNEL||'msedge',headless:true});
 const page=await browser.newPage({viewport:{width:1097,height:700}}),errors=[],passed=[];
 page.on('pageerror',e=>errors.push(e.message));
 try{
 await page.addInitScript(fixture=>{window.auditDb=[fixture];window.calls={search:[],download:[],save:[],browser:[],files:[]};window.Portal={view:()=>'{}',saveView:()=>{},library:()=>JSON.stringify(auditDb),sound:()=>{},setThemeColor:()=>{},appsPreferences:()=>'[]',showKeyboard:()=>{},artworkSearch:(...a)=>calls.search.push(a),artworkDownload:(...a)=>calls.download.push(a),artworkSave:(...a)=>calls.save.push(a),openArtworkBrowser:(...a)=>calls.browser.push(a),chooseCover:(...a)=>calls.files.push(a)};},fixture);
 await page.goto('http://127.0.0.1:'+server.address().port);await page.waitForFunction(()=>typeof editGame==='function');

 await page.evaluate(()=>{games=Array.from({length:60},(_,i)=>({id:'g'+i,title:'Game '+String(i).padStart(2,'0'),genre:'Puzzles',kind:'app',package:'test.game',image:'audit-image.svg'}));rebuildGenres();setPresentation('oxford');presentationId='g20';renderPresentation();});

 const box=await page.locator('#grid').boundingBox(),x=box.x+box.width/2,y=box.y+box.height/2;
 const start=await page.evaluate(()=>$('#grid').scrollTop);
 const touch=await page.context().newCDPSession(page);
 await touch.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x,y}]});
 for(let i=1;i<=5;i++){await touch.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x,y:y-i*20}]});await page.waitForTimeout(30);}
 await touch.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await page.waitForTimeout(600);
 assert.ok(await page.evaluate(()=>$('#grid').scrollTop)>start,'native touch scrolls');
 assert.equal(await page.evaluate(()=>presentationId),'g20','scrolling keeps selection');
 assert.equal(await page.evaluate(()=>carouselMotion),null,'no custom snap or momentum');
 assert.equal(await page.locator('#grid .game').count(),60,'entire list can be browsed');
 const position=await page.evaluate(()=>$('#grid').scrollTop);await page.waitForTimeout(400);assert.ok(Math.abs(await page.evaluate(()=>$('#grid').scrollTop)-position)<1,'released list stays put');
 await page.mouse.move(x,y);await page.mouse.wheel(0,150);await page.waitForTimeout(300);assert.ok(await page.evaluate(()=>$('#grid').scrollTop)>position,'wheel scrolls');
 await page.evaluate(()=>{gridMove($('#grid .presentation-selected'),'down');});assert.equal(await page.evaluate(()=>presentationId),'g21');
 const visible=await page.evaluate(()=>{const r=$('#grid .presentation-selected').getBoundingClientRect(),g=$('#grid').getBoundingClientRect();return r.top>=g.top&&r.bottom<=g.bottom;});assert.ok(visible,'controller reveals selected row');
 await page.evaluate(()=>{window.uninstallRequests=[];native.canUninstallApp=p=>p==='test.game';native.uninstallApp=p=>uninstallRequests.push(p);drawerCatalog=[{package:'test.game',title:'Test game'},{package:'test.system',title:'System'}];editDrawerApp('test.game');});
 assert.equal(await page.locator('#appearance-uninstall').isVisible(),true);await page.locator('#appearance-uninstall').click();assert.deepEqual(await page.evaluate(()=>uninstallRequests),['test.game']);
 assert.equal(await page.evaluate(()=>$('#app-appearance').open),true);
 await page.evaluate(()=>{hideDialog('#app-appearance');editDrawerApp('test.system');});assert.equal(await page.locator('#appearance-uninstall').isVisible(),false);
 await page.evaluate(()=>{hideDialog('#app-appearance');editDrawerApp('test.game');nativeEvent('appUninstalled',{package:'test.game'});});assert.equal(await page.evaluate(()=>$('#app-appearance').open),false);
 assert.deepEqual(errors,[]);console.log('PASS: Oxford native touch and wheel scrolling, stable selection, no snap, controller reveal; app uninstall request, protected app hiding, success cleanup');
 }finally{await browser.close();await new Promise(r=>server.close(r));}
})().catch(error=>{console.error(error);process.exitCode=1});
