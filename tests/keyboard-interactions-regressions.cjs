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
 const findings=[];
 async function check(name,condition){if(!condition)findings.push(name);}
 await page.setViewportSize({width:1097,height:700});
 await page.evaluate(()=>{setPresentation('kyoto');$('#search').focus();});
 await page.setViewportSize({width:1097,height:260});await page.waitForTimeout(80);
 await page.evaluate(()=>$('#category-current').focus());await page.waitForTimeout(80);
 await check('Moving focus to a controller/category button must not expand beneath an open keyboard',await page.locator('body').evaluate(e=>e.classList.contains('input-compact')));
 await page.setViewportSize({width:640,height:360});
 await page.evaluate(()=>$('#search').focus());await page.waitForTimeout(80);
 await page.setViewportSize({width:640,height:200});await page.waitForTimeout(80);
 await page.setViewportSize({width:640,height:360});await page.waitForTimeout(80);
 await check('Closing the keyboard on a short display must restore its controller controls',!await page.locator('body').evaluate(e=>e.classList.contains('input-compact')));
 await page.setViewportSize({width:1097,height:700});
 await page.evaluate(()=>{document.activeElement.blur();setPresentation('library');editGame(games[0]);$('#edit-title').focus();});
 await page.setViewportSize({width:1097,height:260});await page.waitForTimeout(80);
 // Controller moves off an input while the IME takes another frame to dismiss.
 await page.evaluate(()=>$('#cancel-editor').focus());await page.waitForTimeout(80);
 await check('Dialog keyboard state must survive focus moving to Cancel',await page.locator('body').evaluate(e=>e.classList.contains('input-compact')));
 // A native keyboard signal is authoritative even without focused text, and
 // opening a new dialog must not cancel it or alter saved appearance settings.
 await page.evaluate(()=>{document.querySelectorAll('dialog[open]').forEach(d=>d.close());window.wayfinderKeyboardChanged(true);});await page.waitForTimeout(80);
 await check('Native visible signal works without text focus',await page.locator('body').evaluate(e=>e.classList.contains('input-compact')));
 await page.evaluate(()=>window.wayfinderKeyboardChanged(false));await page.waitForTimeout(80);
 await check('Native hidden signal restores controls in a short window',!await page.locator('body').evaluate(e=>e.classList.contains('input-compact')));
 // Simulate launching with an already-open keyboard: there is no tall baseline.
 const nativePage=await browser.newPage({viewport:{width:1097,height:260}});
 await nativePage.addInitScript(()=>{window.Portal={keyboardVisible:()=>true};});
 await nativePage.goto('http://127.0.0.1:'+server.address().port);await nativePage.waitForTimeout(150);
 await check('Initial native IME state is applied after page load',await nativePage.locator('body').evaluate(e=>e.classList.contains('input-compact')));
 await nativePage.close();
 // Keep a selection deep in a populated list while the keyboard changes its
 // visible rows. This exercises virtualized Berlin and the text/artwork panes.
 for(const layout of ['kyoto','cupertino','venice','berlin','oxford','cambridge','ulm']){
  await page.setViewportSize({width:1097,height:700});
  await page.evaluate(layout=>{
   window.wayfinderKeyboardChanged(false);document.activeElement.blur();
   games=Array.from({length:100},(_,i)=>({id:'g'+i,title:'Game '+String(i).padStart(3,'0'),genre:'Alpha',image:'audit-image.svg'}));rebuildGenres();query='';genre='';setPresentation(layout);
   if(layout==='cambridge')cambridgeOpen('all');if(layout==='ulm')ulmOpen('all');
   presentationId='g50';renderGrid();
  },layout);await page.waitForTimeout(250);
  const before=await page.evaluate(()=>JSON.stringify({presentationId,query,genre,palette,placement:document.body.dataset.titlePlacement}));
  await page.evaluate(()=>{const input=presentation==='ulm'?$('#ulm-search'):$('#search');input.hidden=false;input.focus();window.wayfinderKeyboardChanged(true);});
  await page.setViewportSize({width:1097,height:260});await page.waitForTimeout(250);
  await page.setViewportSize({width:1097,height:700});await page.evaluate(()=>window.wayfinderKeyboardChanged(false));await page.waitForTimeout(300);
  const after=await page.evaluate(()=>JSON.stringify({presentationId,query,genre,palette,placement:document.body.dataset.titlePlacement}));
  await check(layout+' retains selection, filters and appearance across keyboard transitions',before===after);
 }
 assert.deepEqual(errors,[]);assert.deepEqual(findings,[]);
 console.log('PASS keyboard focus transfers, short-display dismissal, native state, reload initialization and populated-list selection preservation');
 }finally{await browser.close();await new Promise(r=>server.close(r));}
})().catch(error=>{console.error(error);process.exitCode=1});

