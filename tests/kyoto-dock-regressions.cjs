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
 // Compare frame-to-frame motion at both native held-D-pad repeat rates.
 for(const mode of ['kyoto','cupertino','venice'])for(const direction of ['right','left'])for(const interval of [110,65]){
  await page.evaluate(mode=>setPresentation(mode),mode);
  const measure=async legacy=>page.evaluate(async({interval,legacy,direction,mode})=>{
   const override=document.createElement('style');
   if(legacy)override.textContent=`body[data-presentation=${mode}] #grid .game{transition:transform ${mode==='venice'?160:100}ms ease-out,opacity 100ms ease-out}`;
   document.head.append(override);
   presentationId=filtered[direction==='right'?5:10].id;renderPresentation();controllerFocus($('#grid .presentation-selected'));
   await new Promise(r=>setTimeout(r,220));
   const tracked=$('#grid .game[data-carousel-index="'+(direction==='right'?6:9)+'"]'),samples=[];
   let previous=null,steps=0,next=0,start;
   await new Promise(resolve=>{
    function frame(now){
     if(start===undefined){start=now;next=now;}
     if(now>=next&&steps<5){controller(direction);steps++;next+=interval;}
     const x=new DOMMatrix(getComputedStyle(tracked).transform).m41;
     if(previous&&now-start>interval*2&&steps<5)samples.push(Math.abs(x-previous.x)/(now-previous.time));
     previous={x,time:now};
     if(now-start<interval*5+200)requestAnimationFrame(frame);else resolve();
    }
    requestAnimationFrame(frame);
   });
   const mean=samples.reduce((a,b)=>a+b,0)/samples.length;
   const variation=Math.sqrt(samples.reduce((sum,v)=>sum+(v-mean)**2,0)/samples.length)/mean;
   const index=filtered.findIndex(g=>g.id===presentationId);
   override.remove();return {variation,index,samples:samples.length};
  },{interval,legacy,direction,mode});
  const before=await measure(true),after=await measure(false);
  console.log(mode,'held navigation',direction,interval,{before,after});
  assert.equal(after.index,direction==='right'?10:5,'held navigation advances exactly five games');
  assert.ok(after.samples>=4,'sample several rendered frames');
  assert.ok(after.variation<before.variation,'held motion has less speed variation');
 }
 for(const mode of ['kyoto','cupertino','venice']){
  await page.evaluate(mode=>{setPresentation(mode);presentationId=filtered[5].id;renderPresentation();},mode);
  await page.waitForTimeout(200);
  const box=await page.locator('#grid .presentation-selected').boundingBox();
  await page.mouse.move(box.x+box.width/2,box.y+box.height/2);
  await page.mouse.down();await page.mouse.move(box.x+box.width/2-60,box.y+box.height/2,{steps:4});
  assert.equal(await page.locator('#grid').evaluate(e=>e.classList.contains('fluid-motion')),true,mode+' drag remains fluid');
  assert.equal(await page.locator('#grid .game').first().evaluate(e=>getComputedStyle(e).transitionDuration),'0s',mode+' drag bypasses transitions');
  await page.waitForTimeout(130);await page.mouse.up();await page.waitForTimeout(250);
  assert.equal(await page.evaluate(()=>carouselMotion),null,mode+' drag settles');
  await page.emulateMedia({reducedMotion:'reduce'});
  assert.equal(await page.locator('#grid .presentation-selected').evaluate(e=>getComputedStyle(e).transitionDuration),'0s',mode+' reduced motion');
  await page.emulateMedia({reducedMotion:'no-preference'});
 }
 await page.evaluate(()=>setPresentation('kyoto'));
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
