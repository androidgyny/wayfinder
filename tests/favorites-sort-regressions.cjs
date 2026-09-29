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

 await page.evaluate(()=>{games=[['z','Zulu',true,1],['b','beta',true,2],['a','Alpha',false,4],['n','Name 10',false,3],['m','Name 2',false,5]].map(([id,title,favorite,lastPlayed])=>({id,title,favorite,lastPlayed,genre:'Alpha',image:'audit-image.svg'}));rebuildGenres();});
 for(const mode of ['library','kyoto','cupertino','berlin','venice','cambridge','ulm','seattle']){
  await page.evaluate(mode=>{setPresentation(mode);genre='';favoritesOnly=false;query='';if(mode==='ulm')ulmOpen('all');if(mode==='cambridge')cambridgeOpen('all');if(mode==='seattle')seattleBrowse=true;$('#presentation-sort').value='favorites';$('#presentation-sort').dispatchEvent(new Event('change'));},mode);
  assert.deepEqual(await page.evaluate(()=>filtered.map(g=>g.id)),['b','z','a','m','n'],mode);
 }
 await page.evaluate(()=>{setPresentation('library');toggleFavorite('a');});
 assert.deepEqual(await page.evaluate(()=>filtered.map(g=>g.id)),['a','b','z','m','n']);
 await page.evaluate(()=>{query='name';update();});
 assert.deepEqual(await page.evaluate(()=>filtered.map(g=>g.id)),['m','n']);
 await page.evaluate(()=>{query='';favoritesOnly=true;update();});
 assert.deepEqual(await page.evaluate(()=>filtered.map(g=>g.id)),['a','b','z']);
 await page.evaluate(()=>{favoritesOnly=false;setPresentation('oxford');});
 assert.deepEqual(await page.evaluate(()=>filtered.map(g=>g.id)),['a','b','m','n','z']);
 await page.evaluate(()=>{setPresentation('cambridge');cambridgeOpen('recent');});
 assert.deepEqual(await page.evaluate(()=>filtered.map(g=>g.id)),['m','a','n','b','z']);
 await page.addInitScript(()=>{window.Portal={view:()=>JSON.stringify({sort:'favorites'}),saveView:()=>{},sound:()=>{},setThemeColor:()=>{},appsPreferences:()=>'[]'};});
 await page.reload();
 assert.equal(await page.evaluate(()=>sort),'favorites');
 assert.equal(await page.locator('#presentation-sort').inputValue(),'favorites');
 await page.waitForTimeout(250);
 await page.evaluate(()=>{native.saveView=raw=>window.lastSavedView=JSON.parse(raw);$('#sort').value='az';$('#sort').dispatchEvent(new Event('change'));});
 assert.equal(await page.evaluate(()=>window.lastSavedView?.sort),'az','toolbar sorting persists immediately');
 assert.deepEqual(errors,[]);
 console.log('PASS: favorites first, alphabetic/numeric ordering, 8 layouts, live favorites, search, favorites filter, Oxford and Recent sections.');
 }finally{await browser.close();await new Promise(r=>server.close(r));}
})().catch(e=>{console.error(e);process.exitCode=1});
