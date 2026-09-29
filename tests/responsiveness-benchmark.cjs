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
 const metrics={};
 for(const mode of ['library','kyoto','oxford','prague','apps']){
  await page.evaluate(mode=>{if(mode==='apps'){openApps();return;}setPresentation(mode);genre='';favoritesOnly=false;query='';sort='az';update();},mode);
  metrics[mode]=await page.evaluate(mode=>{const times=[];for(let i=0;i<9;i++){const start=performance.now();if(mode==='apps')renderDrawer();else update();document.body.offsetHeight;times.push(performance.now()-start);}return times.sort((a,b)=>a-b)[4];},mode);
 }
 await page.evaluate(()=>{hideDialog('#apps-drawer');setPresentation('library');});
 metrics.search=await page.evaluate(()=>{const times=[];for(let i=0;i<9;i++){query=i%2?'retro':'retro 1';const start=performance.now();update();document.body.offsetHeight;times.push(performance.now()-start);}return times.sort((a,b)=>a-b)[4];});
 console.log(JSON.stringify(metrics));
 assert.equal(await page.evaluate(()=>{const titles=['Écho 2','echo 10','Alpha','alpha','Zebra','日本語','Özil',''];return titles.every(a=>titles.every(b=>Math.sign(compareTitles(a,b))===Math.sign(a.localeCompare(b,undefined,{numeric:true,sensitivity:'base'}))))}),true,'same locale ordering');
 assert.deepEqual(await page.evaluate(()=>{const g={title:'Café Retro'};const first=searchableTitle(g);g.title='Renamed';return [first,searchableTitle(g),searchableTitle({title:'Replacement'})]}),['cafe retro','renamed','replacement'],'search cache follows edits and replacements');
 assert.equal(await page.evaluate(()=>{openApps();return drawerRenderPreferences===null&&drawerRenderGames===null}),true,'render lookups released');
 assert.deepEqual(errors,[]);
 }finally{await browser.close();await new Promise(r=>server.close(r));}
})().catch(e=>{console.error(e);process.exitCode=1});
