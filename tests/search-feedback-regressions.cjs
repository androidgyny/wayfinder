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
 await page.evaluate(()=>{games=[{id:'a',title:'Ordinary',genre:'Alpha',image:'audit-image.svg'},{id:'b',title:'Retro One',genre:'Beta',favorite:true,image:'audit-image.svg'},{id:'c',title:'Retro Two',genre:'Gamma',lastPlayed:42,image:'audit-image.svg'}];rebuildGenres();setPresentation('cambridge');cambridgeOpen('genre:Alpha');query='retro';$('#search').value=query;update();});
 assert.equal(await page.evaluate(()=>cambridgeSection),'genre:Alpha');
 assert.match(await page.locator('.search-empty').innerText(),/2 matches elsewhere/);
 assert.equal(await page.locator('.cambridge-category[data-key="genre:Beta"] small').innerText(),'1');
 await page.evaluate(()=>{cambridgePane='categories';cambridgeFocus();controller('right');});
 assert.equal(await page.evaluate(()=>document.activeElement.classList.contains('show-all-matches')),true);
 await page.evaluate(()=>controller('activate'));
 assert.deepEqual(await page.evaluate(()=>[query,filtered.length,cambridgeSection]),['retro',2,'all']);
 await page.evaluate(()=>{query='no such game';update();});assert.equal(await page.locator('.show-all-matches').count(),0);
 await page.evaluate(()=>{query='';update();});assert.equal(await page.locator('.search-no-match').count(),0);
 for(const mode of ['library','seattle','oxford','berlin','kyoto','cupertino','tokyo','venice','ulm']){
 await page.evaluate(mode=>{query='';setPresentation(mode);if(mode==='ulm')ulmOpen('genre:Alpha');else {genre='Alpha';favoritesOnly=false;if(mode==='seattle')seattleBrowse=true;}query='retro';$('#search').value=query;update();},mode);
 assert.equal(await page.locator('.show-all-matches').count(),1,mode);assert.equal(await page.locator('.show-all-matches').isVisible(),true,mode);
 for(const width of [480,640,1097,1440]){
 await page.setViewportSize({width,height:700});
 const bounds=await page.evaluate(()=>{const p=$('.search-empty').getBoundingClientRect(),b=$('.show-all-matches').getBoundingClientRect();return {panel:p.left>=-1&&p.right<=innerWidth+1,button:b.left>=-1&&b.right<=innerWidth+1};});
 assert.deepEqual(bounds,{panel:true,button:true},mode+' at '+width);
 const contained=await page.evaluate(()=>{const p=$('.search-empty').getBoundingClientRect();return [...$('.search-empty').children].every(e=>{const r=e.getBoundingClientRect();return r.left>=p.left-1&&r.right<=p.right+1&&r.top>=p.top-1&&r.bottom<=p.bottom+1;});});assert.equal(contained,true,mode+' content fits at '+width);
 }
 await page.setViewportSize({width:1097,height:592});
 if(mode==='seattle'){
 assert.equal(await page.locator('.seattle-empty').count(),0);
 assert.match(await page.locator('#seattle-categories').innerText(),/Beta · 1/);
 const bounds=await page.evaluate(()=>{const panel=$('.search-empty').getBoundingClientRect(),heading=$('.seattle-shelf-heading').getBoundingClientRect(),button=$('.show-all-matches').getBoundingClientRect();return {below:panel.top>=heading.bottom,contained:button.bottom<=panel.bottom&&button.top>=panel.top};});
 assert.deepEqual(bounds,{below:true,contained:true});
 }
 await page.locator('.show-all-matches').click();assert.deepEqual(await page.evaluate(()=>[query,filtered.length]),['retro',2],mode);
 }
 await page.evaluate(()=>{setPresentation('ulm');query='retro';update();ulmOpen('genre:Beta');});assert.deepEqual(await page.evaluate(()=>[query,filtered.length]),['retro',1]);

 for(const mode of ['library','seattle','cambridge','ulm','oxford','berlin','kyoto','cupertino','tokyo','venice']){
 await page.evaluate(mode=>{query='';setPresentation('library');genre='Beta';favoritesOnly=false;update();setPresentation(mode);query='retro';update();controllerFocus($('#grid .presentation-selected')||$('#grid .game'));controller('back');},mode);
 assert.deepEqual(await page.evaluate(()=>[genre,query]),['Beta',''],mode+' Back clears search without exiting category');
 }
 // Searching must not silently select another category or clear the query on layout changes.
 for(const mode of ['library','seattle','cambridge','ulm','oxford','berlin','kyoto','cupertino','tokyo','venice']){
 await page.evaluate(()=>{query='';setPresentation('library');genre='Beta';favoritesOnly=false;update();$('#search').value='retro';$('#search').dispatchEvent(new Event('input'));});
 await page.evaluate(mode=>setPresentation(mode),mode);
 assert.deepEqual(await page.evaluate(()=>[query,genre,filtered.length]),['retro','Beta',1],mode+' preserves scope');
 }
 for(const mode of ['vienna','prague']){
 await page.evaluate(mode=>{query='';setPresentation(mode);if(mode==='vienna')viennaOpen('genre:Alpha');else pragueOpen('genre:Alpha');$('#search').value='retro';$('#search').dispatchEvent(new Event('input'));},mode);
 assert.equal(await page.evaluate(mode=>mode==='vienna'?viennaKey:pragueKey,mode),'genre:Alpha');
 assert.match(await page.locator('.search-empty').innerText(),/2 matches elsewhere/);
 await page.evaluate(mode=>{controllerFocus(document.querySelector(mode==='vienna'?'.expanded .vienna-heading':'.expanded .prague-heading'));controller(mode==='vienna'?'right':'down');},mode);
 assert.equal(await page.evaluate(()=>document.activeElement.matches('.show-all-matches')),true,mode+' empty action reachable');
 await page.evaluate(()=>controller('activate'));assert.equal(await page.locator('.search-empty').count(),0,mode+' action removed after matching category');
 }
 await page.evaluate(()=>{setPresentation('berlin');genre='Alpha';query='retro';update();controllerFocus($('#category-current'));controller('down');controller('up');});
 assert.equal(await page.evaluate(()=>document.activeElement.id),'category-current','Berlin can leave empty action');
 for(const mode of ['library','seattle','cambridge','ulm','oxford','berlin','kyoto','cupertino','tokyo','venice','vienna','prague','copenhagen']){
 await page.evaluate(mode=>{query='';setPresentation(mode);if(mode==='ulm')ulmOpen('all');query='zz nonexistent';update();},mode);
 assert.equal(await page.locator('.show-all-matches').count(),0,mode+' global empty has no false escape');
 const count=await page.locator('.search-empty').count();assert.equal(count,1,mode+' single feedback');
 await page.evaluate(()=>{query='';update();});assert.equal(await page.locator('.search-empty').count(),0);assert.equal(await page.evaluate(()=>document.body.classList.contains('search-no-results')),false);
 }
 await page.evaluate(()=>{query='';setPresentation('copenhagen');copenhagenKept=[];copenhagenIds=[];update();presentationId='a';copenhagenKeep();presentationId='b';copenhagenKeep();query='Retro';update();});
 assert.deepEqual(await page.evaluate(()=>copenhagenIds.every(id=>filtered.some(g=>g.id===id))),true);
 await page.evaluate(()=>{query='no such title';update();});assert.equal(await page.evaluate(()=>copenhagenIds.length),0);
 await page.evaluate(()=>{query='';update();});assert.equal(await page.evaluate(()=>['a','b'].every(id=>copenhagenIds.includes(id))),true,'Hidden kept cards return when search clears');
 assert.deepEqual(errors,[]);console.log('PASS 13 layouts: empty/cleared searches, category and query preservation, overview selection, controller escape/action, counts, and four viewport widths');
 }finally{await browser.close();await new Promise(r=>server.close(r));}
})().catch(error=>{console.error(error);process.exitCode=1});
