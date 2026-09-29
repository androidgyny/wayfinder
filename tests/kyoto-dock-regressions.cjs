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


 await page.waitForTimeout(250);
 await page.evaluate(()=>{games=Array.from({length:20},(_,i)=>({...games[0],id:String(i),title:'Beautiful game '+i}));rebuildGenres();applyAppearanceValues(builtinAppearancePresets.find(p=>p.name==='Smitchish').values);});
 for(const viewport of [{width:1097,height:592},{width:1280,height:720},{width:640,height:360}]){
  await page.setViewportSize(viewport);await page.waitForTimeout(200);
  const bounds=await page.evaluate(()=>{const r=s=>{const b=$(s).getBoundingClientRect();return {top:b.top,bottom:b.bottom,left:b.left,right:b.right}};return {dock:r('#kyoto-dock'),cover:r('#grid .presentation-selected .cover'),title:r('#presentation-info'),height:innerHeight};});
  assert.ok(bounds.cover.bottom<=bounds.title.top+1,JSON.stringify(bounds));
  assert.ok(bounds.title.bottom<=bounds.dock.top+1,JSON.stringify(bounds));
  assert.ok(bounds.dock.bottom<=bounds.height,JSON.stringify(bounds));
 }
 await page.setViewportSize({width:1097,height:592});await page.waitForTimeout(200);
 await page.locator('#kyoto-dock button').filter({hasText:'Search'}).click();assert.equal(await page.evaluate(()=>document.activeElement.id),'search');assert.equal(await page.locator('.topbar .search').evaluate(e=>getComputedStyle(e).opacity),'1');
 await page.locator('#search').fill('does not exist');await page.waitForTimeout(200);assert.equal(await page.locator('#kyoto-dock [data-game-action=play]').isDisabled(),true);
 await page.locator('#search').fill('');await page.waitForTimeout(200);await page.locator('#kyoto-dock [data-game-action=edit]').click();assert.equal(await page.evaluate(()=>topDialog().id),'editor');await page.evaluate(()=>hideDialog('#editor'));
 await page.evaluate(()=>{controllerFocus($('#grid .presentation-selected'));controller('right');});assert.ok(await page.evaluate(()=>!!presentationId));
 assert.equal(await page.locator('#presentation-favorite').isVisible(),true);
 for(const style of ['above','below']){await page.evaluate(style=>{kyotoTitlePlacement=style;setPalette('midnight');refreshLayoutControls();sizePresentation();},style);await page.waitForTimeout(100);const overlap=await page.evaluate(()=>$('#grid .presentation-selected .cover').getBoundingClientRect().bottom>$('#kyoto-dock').getBoundingClientRect().top);assert.equal(overlap,false);}
 await page.evaluate(()=>{setPalette('daylight');});
 await page.screenshot({path:'output/kyoto-daylight-check.png'});
 await page.evaluate(()=>{controllerFocus($('#grid .presentation-selected'));$('#presentation-seek').focus();$('#presentation-seek').value='8';$('#presentation-seek').dispatchEvent(new Event('input'));window.expectedEdit=presentationId;controller('edit');});
 assert.equal(await page.evaluate(()=>draft?.id),await page.evaluate(()=>expectedEdit),'controller Edit follows scrubbed cover');
 await page.evaluate(()=>hideDialog('#editor'));
 await page.evaluate(()=>{games.forEach(g=>{g.title='A remarkably long adventure title that should never collide with the favorite button';g.genre='An exceptionally long category name for testing text containment and wrapping';});rebuildGenres();genre='';kyotoTitlePlacement='below';refreshLayoutControls();update();});
 for(const width of [480,640,1097]){
  await page.setViewportSize({width,height:592});await page.waitForTimeout(100);
  const bounds=await page.evaluate(()=>{const p=$('#presentation-position').getBoundingClientRect(),dock=$('#kyoto-dock').getBoundingClientRect(),info=$('#presentation-info').getBoundingClientRect();return {textBottom:p.bottom,infoBottom:info.bottom,dockTop:dock.top};});
  assert.ok(bounds.textBottom<=bounds.infoBottom+1,JSON.stringify(bounds));
 }
 await page.screenshot({path:'output/kyoto-audit-long-title.png'});
 await page.evaluate(()=>setPresentation('cupertino'));assert.equal(await page.locator('#kyoto-dock').isVisible(),false);
 assert.deepEqual(errors,[]);console.log('PASS Kyoto dock, search, empty results, edit, navigation, responsive geometry, other layout isolation');
 }finally{await browser.close();await new Promise(r=>server.close(r));}
})().catch(error=>{console.error(error);process.exitCode=1});
