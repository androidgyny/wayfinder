/* Run with Node and Playwright installed; BROWSER_CHANNEL defaults to msedge.
   Uses a synthetic library and images. No device or personal files are required. */
const assert=require('node:assert/strict');
const fs=require('node:fs');
const http=require('node:http');
const path=require('node:path');
const {chromium}=require('playwright');
const root=path.resolve(__dirname,'../app/src/main/assets/www');
const fixture={id:'audit',title:'Audit & Cover',genre:'Alpha',kind:'app',package:'test.audit',image:'audit-image.svg',lastPlayed:0};
const svg='<svg xmlns="http://www.w3.org/2000/svg" width="600" height="900"><rect width="600" height="900" fill="#357a62"/></svg>';
(async()=>{
 const server=http.createServer((req,res)=>{const pathname=new URL(req.url,'http://localhost').pathname;
 if(pathname.includes('audit-image')||pathname.startsWith('/icon/')||pathname.startsWith('/art-icon/')){res.setHeader('Content-Type','image/svg+xml');res.end(svg);return;}
 if(pathname==='/games.js'){res.setHeader('Content-Type','application/javascript');res.end('window.GAMES='+JSON.stringify([fixture]));return;}
 const file=path.join(root,pathname==='/'?'index.html':pathname);try{res.setHeader('Content-Type',file.endsWith('.js')?'application/javascript':file.endsWith('.css')?'text/css':file.endsWith('.ttf')?'font/ttf':'text/html');res.end(fs.readFileSync(file));}catch{res.statusCode=404;res.end();}});
 await new Promise(r=>server.listen(0,'127.0.0.1',r));
 const browser=await chromium.launch({channel:process.env.BROWSER_CHANNEL||'msedge',headless:true});

 const page=await browser.newPage({viewport:{width:1097,height:592},hasTouch:true}),errors=[];page.on('pageerror',e=>errors.push(e.message));
 try{
 await page.goto('http://127.0.0.1:'+server.address().port);


 await page.waitForTimeout(250);
 await page.evaluate(()=>{games=Array.from({length:1200},(_,i)=>({id:String(i),title:['Écho','Adventure','Puzzle','Retro'][i%4]+' '+((i*7919)%1200),genre:'Category '+i%24,image:'audit-image.svg',favorite:i%7===0}));rebuildGenres();drawerCatalog=Array.from({length:500},(_,i)=>({package:'test.app'+i,title:'Utility '+((i*197)%500)}));drawerPreferences=drawerCatalog.map((a,i)=>({package:a.package,title:a.title,pinned:i<8,order:i}));});

 await page.evaluate(()=>{setPresentation('cambridge');cambridgeOpen('all','games');setCambridgeArtwork(false,false);});
 const measurements=await page.evaluate(()=>{const samples=[],mutations=[];for(let i=1;i<21;i++){const observer=new MutationObserver(()=>{});observer.observe($('#grid'),{attributes:true,subtree:true});const start=performance.now();cambridgeSelect(filtered[i].id,true);document.body.offsetHeight;samples.push(performance.now()-start);mutations.push(observer.takeRecords().length);observer.disconnect();}return {medianMs:samples.sort((a,b)=>a-b)[10],rowMutations:mutations[10]};});console.log(JSON.stringify(measurements));
 assert.equal(await page.locator('#grid .presentation-selected').count(),1);
 assert.equal(await page.locator('#grid .game[tabindex="0"]').count(),1);
 assert.ok(measurements.rowMutations<20,'navigation touches only selected rows');
 await page.evaluate(()=>{cambridgeRows.get(filtered[4].id).focus();});
 assert.equal(await page.evaluate(()=>presentationId),await page.evaluate(()=>filtered[4].id),'focus selects correct row');
 for(const action of ['down','pageDown','pageUp','up']){
  await page.evaluate(action=>controller(action),action);
  assert.equal(await page.locator('#grid .presentation-selected').count(),1);
  assert.equal(await page.locator('#grid .game[tabindex="0"]').count(),1);
  assert.equal(await page.evaluate(()=>document.activeElement.dataset.id),await page.evaluate(()=>presentationId));
 }
 await page.evaluate(()=>{toggleFavorite(presentationId);});
 assert.equal(await page.locator('#grid .presentation-selected').count(),1,'favorite rebuild keeps one selection');
 await page.evaluate(()=>{query='no such title';update();});
 assert.equal(await page.locator('#grid .presentation-selected').count(),0);
 await page.evaluate(()=>{query='';update();cambridgeOpen('genre:Category 2','games');});
 assert.equal(await page.locator('#grid .presentation-selected').count(),1,'category rebuild restores selection');

 for(const mode of ['prague','vienna']){
  await page.evaluate(mode=>{query='';games.forEach(g=>g.genre='Large category');rebuildGenres();setPresentation(mode);if(mode==='prague')pragueOpen('genre:Large category',true);else viennaOpen('genre:Large category',true);},mode);
  const result=await page.evaluate(mode=>{const times=[],mutations=[];for(let i=1;i<21;i++){const observer=new MutationObserver(()=>{});observer.observe($('#grid'),{attributes:true,subtree:true});const start=performance.now();if(mode==='prague')pragueSelect(filtered[i].id,true);else viennaSelect(filtered[i].id,true);document.body.offsetHeight;times.push(performance.now()-start);mutations.push(observer.takeRecords().length);observer.disconnect();}return {medianMs:times.sort((a,b)=>a-b)[10],rowMutations:mutations[10]};},mode);
  console.log(mode,JSON.stringify(result));
  assert.ok(result.rowMutations<20,mode+' navigation only updates changed rows');
  assert.equal(await page.locator('#grid .presentation-selected').count(),1,mode);
  assert.equal(await page.locator('#grid .game[tabindex="0"]').count(),1,mode);
  await page.evaluate(mode=>{if(mode==='prague')pragueSelect(filtered[30].id,false,false);else viennaSelect(filtered[30].id,false,false);},mode);
  assert.equal(await page.evaluate(()=>document.activeElement.dataset.id),await page.evaluate(()=>presentationId),mode+' touch selection follows existing row focus');
  await page.evaluate(mode=>{games[0].id='quote" bracket] space\\slash';update();if(mode==='prague')pragueSelect(games[0].id,true);else viennaSelect(games[0].id,true);},mode);
  assert.equal(await page.evaluate(()=>document.activeElement.dataset.id),await page.evaluate(()=>games[0].id),mode+' arbitrary game IDs');
  await page.evaluate(()=>{toggleFavorite(presentationId);});
  assert.equal(await page.locator('#grid .presentation-selected').count(),1,mode+' favorite rebuild');
 }
 assert.deepEqual(errors,[]);
 }finally{await browser.close();await new Promise(r=>server.close(r));}
})().catch(e=>{console.error(e);process.exitCode=1});
