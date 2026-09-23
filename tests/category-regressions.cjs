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
 await page.addInitScript(fixture=>{
 window.auditDb=Array.from({length:60},(_,i)=>({...fixture,id:'g'+i,title:'Game '+String(i).padStart(2,'0'),genre:i<20?'Alpha':i<40?'Beta':'Uncategorized'}));window.auditOrder=[];window.failWrite=false;
 window.Portal={view:()=>'{}',saveView:()=>{},sound:()=>{},setThemeColor:()=>{},appsPreferences:()=>'[]',library:()=>JSON.stringify(auditDb),categoryOrder:()=>JSON.stringify(auditOrder),changeCategories:raw=>{
 const {moves,order}=JSON.parse(raw);if(failWrite||moves.some(m=>!auditDb.some(g=>String(g.id)===m.id&&g.genre===m.from)))return JSON.stringify({ok:false,message:'Conflict or write failure'});
 for(const m of moves)auditDb.find(g=>String(g.id)===m.id).genre=m.to;auditOrder=[...order];return '{"ok":true}';}};
 },fixture);
 await page.goto('http://127.0.0.1:'+server.address().port);await page.waitForFunction(()=>typeof categoryApply==='function');
 await page.evaluate(()=>{showDialog('#settings-dialog');$('#manage-categories').click();const b=$('[data-category-action="open"]');b.focus();b.click();$('#category-name').value='Beta';$('#category-rename-form').requestSubmit();undoCategoryChange();});
 assert.equal(await page.evaluate(()=>categorySource),'Alpha');await page.click('#category-members-close');assert.equal(await page.evaluate(()=>document.activeElement.closest('.category-manager-row')?.dataset.category),'Alpha');
 // Deterministic mixed moves, renames/merges and reorders, with exact reversal of every step.
 await page.evaluate(()=>{let seed=5921;const rnd=n=>{seed=(seed*1664525+1013904223)>>>0;return seed%n;};for(let round=0;round<5;round++){
 const snapshots=[];categoryUndo=[];
 for(let i=0;i<15;i++){snapshots.push({db:JSON.stringify(auditDb),order:JSON.stringify(auditOrder)});const from=genres[rnd(genres.length)],to=['Alpha','Beta','Gamma','Uncategorized','RPG & action'][rnd(5)];const members=games.filter(g=>g.genre===from),moves=i%3?members.slice(0,i%2?members.length:1).map(g=>({id:g.id,from,to})):[];if(!categoryApply(moves,[...genres].reverse(),'audit'))throw Error('Move failed');}
 for(const before of snapshots.reverse()){undoCategoryChange();if(JSON.stringify(auditDb)!==before.db||JSON.stringify(auditOrder)!==before.order)throw Error('Undo mismatch');}
 }});
 await page.evaluate(()=>{categoryUndo=[];openCategoryMembers('Alpha');$('#category-game-search').value='Game 01';$('#category-game-search').dispatchEvent(new Event('input'));$('#category-select-all').click();$('#category-game-search').value='';$('#category-game-search').dispatchEvent(new Event('input'));});assert.equal(await page.evaluate(()=>categorySelection.size),1);
 const before=await page.evaluate(()=>JSON.stringify(auditDb));await page.evaluate(()=>{failWrite=true;$('#category-new-destination').value='Failed';$('#category-move').click();});assert.equal(await page.evaluate(()=>JSON.stringify(auditDb)),before);assert.equal(await page.evaluate(()=>categorySelection.size),1);await page.evaluate(()=>{failWrite=false;$('#category-move').click();auditDb.find(g=>g.id==='g1').title='Later edit';undoCategoryChange();});assert.equal(await page.evaluate(()=>games.find(g=>g.id==='g1').title),'Later edit');
 // Enable every action before checking reachability at narrow and wide sizes.
 await page.evaluate(()=>{categoryApply([],['Beta','Alpha','Uncategorized'],'order');openCategoryMembers('Alpha');$('#category-name').value='Gamma';categoryRenameNote();$('.category-game').click();});
 for(const width of [480,640,800,1097]){await page.setViewportSize({width,height:592});const report=await page.evaluate(()=>{const root=$('#category-members'),all=dialogControls(root),queue=[all[0]],seen=new Set(queue);while(queue.length){const from=queue.shift();for(const action of ['up','down','left','right']){controllerFocus(from,true);controller(action);const next=document.activeElement;if(root.contains(next)&&!seen.has(next)){seen.add(next);queue.push(next)}}}return {missing:all.filter(n=>!seen.has(n)).map(n=>n.id||n.textContent),overflow:root.scrollWidth-root.clientWidth};});assert.deepEqual(report,{missing:[],overflow:0});}
 await page.evaluate(()=>{auditOrder=['Alpha','Beta'];nativeEvent('restored',{});});assert.equal(await page.evaluate(()=>categoryUndo.length),0);assert.deepEqual(await page.evaluate(()=>categoryOrder),['Alpha','Beta']);

 await page.evaluate(()=>{openCategoryMembers('Alpha');$('.category-game').click();controllerFocus($('#category-clear-selection'));controller('activate');});assert.equal(await page.evaluate(()=>document.activeElement.id),'category-select-all');
 await page.evaluate(()=>{hideDialog('#category-members');categoryUndo=[];window.dragOriginal=[...genres];$('#category-manager').scrollTop=0;});await page.setViewportSize({width:1097,height:592});
 const c=await page.context().newCDPSession(page);const touch=(type,x,y)=>c.send('Input.dispatchTouchEvent',{type,touchPoints:type==='touchEnd'||type==='touchCancel'?[]:[{x,y}]});
 async function drag(cancel){await page.evaluate(()=>$('#category-manager').scrollTop=0);const a=await page.locator('.category-drag-handle').first().boundingBox(),b=await page.locator('.category-manager-row').nth(2).boundingBox(),x=a.x+a.width/2;await touch('touchStart',x,a.y+a.height/2);await touch('touchMove',x,b.y+b.height-2);if(cancel==='back')await page.evaluate(()=>controller('back'));if(cancel==='outside')await touch('touchMove',5,b.y);await touch(cancel==='touch'?'touchCancel':'touchEnd');}
 await drag();assert.deepEqual(await page.evaluate(()=>genres.slice(0,3)),await page.evaluate(()=>[dragOriginal[1],dragOriginal[2],dragOriginal[0]]));await page.evaluate(()=>undoCategoryChange());
 for(const reason of ['back','touch','outside']){await drag(reason);assert.deepEqual(await page.evaluate(()=>genres),await page.evaluate(()=>dragOriginal));assert.equal(await page.locator('.category-drag-ghost').count(),0);}
 await page.evaluate(()=>{categoryUndo=[];for(let i=0;i<25;i++)categoryApply([],[...genres].reverse(),'order');});assert.equal(await page.evaluate(()=>categoryUndo.length),20);
 await page.evaluate(()=>{auditDb=[];reloadLibrary();renderCategoryManager();$('#category-uncategorized').click();});assert.equal(await page.locator('.category-game').count(),0);assert.equal(await page.isDisabled('#category-move'),true);
 console.log('PASS clear-selection focus, touch drag and Undo, controller/touch/outside cancellation, 20-change Undo limit, empty library');
 assert.deepEqual(errors,[]);console.log('PASS merge/undo context and focus, 75 mixed operations reversed, filtered selection, failed write preservation, unrelated-edit preservation, all controller controls at 4 widths, restore clears Undo/reloads order');
 }finally{await browser.close();await new Promise(r=>server.close(r));}
})().catch(error=>{console.error(error);process.exitCode=1});
