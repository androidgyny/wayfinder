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
 const layouts=['library','kyoto','cupertino','venice','oxford','berlin','seattle','vienna','prague','copenhagen','cambridge','ulm'];
 for(const layout of layouts)for(const width of [640,1097])for(const height of [320,260,220])for(const placement of (['kyoto','cupertino'].includes(layout)?['above','below']:['above'])){
  await page.setViewportSize({width,height:700});
  await page.evaluate(({layout,placement})=>{
   document.activeElement.blur();query='';setPresentation(layout);
   games=[{id:'a',title:'Ordinary',genre:'Alpha',image:'audit-image.svg'},{id:'b',title:'Retro title',genre:'Beta',image:'audit-image.svg'}];rebuildGenres();
   if(layout==='ulm')ulmOpen('genre:Alpha');else if(layout==='cambridge')cambridgeOpen('genre:Alpha');else if(layout==='vienna')viennaOpen('genre:Alpha');else if(layout==='prague')pragueOpen('genre:Alpha');else {genre='Alpha';if(layout==='seattle')seattleBrowse=true;}
   document.body.dataset.titlePlacement=placement;query='retro';$('#search').value=query;update();
   const field=layout==='ulm'?$('#ulm-search'):$('#search');field.hidden=false;field.focus({preventScroll:true});
  },{layout,placement});
  await page.setViewportSize({width,height});await page.waitForTimeout(80);
  assert.equal(await page.locator('body').evaluate(e=>e.classList.contains('input-compact')),true,layout);
  if(layout==='kyoto'&&height===260&&width===1097){fs.mkdirSync(path.join(__dirname,'../output/keyboard-audit'),{recursive:true});await page.screenshot({path:path.join(__dirname,'../output/keyboard-audit/kyoto-search.png')});}
  if(await page.locator('.search-empty').count()){
   const result=await page.evaluate(()=>{
    const p=$('.search-empty'),r=p.getBoundingClientRect(),first=p.firstElementChild.getBoundingClientRect();
    const heading=$('#category-strip'),hr=heading.getBoundingClientRect();
    return {positive:r.height>0,noUpwardOverflow:first.top>=r.top-1,belowHeading:!hr.height||r.top>=hr.bottom-1};
   });
   assert.deepEqual(result,{positive:true,noUpwardOverflow:true,belowHeading:true},layout+' '+height+' '+JSON.stringify(result));
   await page.locator('.show-all-matches').click();
   assert.equal(await page.evaluate(()=>filtered.length),1);
  }
  // Dismissing the IME while the field remains focused restores the full layout.
  await page.setViewportSize({width,height:700});await page.waitForTimeout(80);
  assert.equal(await page.locator('body').evaluate(e=>e.classList.contains('input-compact')),false,layout+' restored');
 }
 // Every text field in a dialog must remain reachable in the shrunken viewport,
 // including dialogs opened while the keyboard is already visible.
 await page.evaluate(()=>{document.activeElement.blur();setPresentation('library');});
 const fields=await page.evaluate(()=>[...document.querySelectorAll('dialog input:not([type=range]):not([type=checkbox]):not([type=radio]):not([type=hidden]),dialog textarea')].map(e=>({id:e.id,dialog:e.closest('dialog').id})).filter(e=>e.id));
 let tested=0;
 for(const {id,dialog} of fields){
  await page.setViewportSize({width:1097,height:700});
  await page.evaluate(({id,dialog})=>{document.querySelectorAll('dialog[open]').forEach(d=>d.close());const d=document.getElementById(dialog);d.showModal();const f=document.getElementById(id);let e=f;while(e&&e!==d){e.hidden=false;e=e.parentElement;}f.focus();},{id,dialog});
  if(!await page.locator('#'+id).isVisible())continue;
  await page.setViewportSize({width:1097,height:260});await page.waitForTimeout(80);
  const bounds=await page.locator('#'+id).evaluate(f=>{const r=f.getBoundingClientRect(),d=f.closest('dialog').getBoundingClientRect();return {field:r.top>=d.top-1&&r.bottom<=d.bottom+1,dialog:d.top>=-1&&d.bottom<=innerHeight+1};});
  assert.deepEqual(bounds,{field:true,dialog:true},id+' '+JSON.stringify(bounds));tested++;
  if(id==='edit-title')await page.screenshot({path:path.join(__dirname,'../output/keyboard-audit/edit-title.png')});
 }
 assert.ok(tested>=10,'Dialog field coverage');assert.deepEqual(errors,[]);
 console.log('PASS 12 layouts at 3 keyboard heights and 2 widths, both title placements, keyboard dismissal, and '+tested+' dialog fields');
 }finally{await browser.close();await new Promise(r=>server.close(r));}
})().catch(error=>{console.error(error);process.exitCode=1});
