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
 const modes=['library','berlin','seattle','vienna','prague','copenhagen','tokyo','oxford','ulm','cambridge','kyoto','cupertino','venice'];

 for(const viewport of [{width:1097,height:700},{width:640,height:600}]){
 await page.setViewportSize(viewport);
 for(const mode of modes){
 await page.evaluate(mode=>{setPresentation(mode);setUlmArtwork(true);setCambridgeArtwork(true);if(mode==='ulm')ulmOpen('all');$('#settings-dialog').showModal();updateAppearancePreview();},mode);
 await page.waitForFunction(()=>$('.appearance-sample img').complete&&$('.appearance-sample img').naturalWidth>0);
 for(const size of ['normal','small','large']){
 const report=await page.evaluate(size=>{
 const selected=$('#grid .presentation-selected')||$('#grid .controller-selected')||$('#grid .game');
 const actual=['ulm','cambridge'].includes(presentation)?$('#'+presentation+'-cover'):['tokyo','oxford'].includes(presentation)?$('#tokyo-art'):selected?.querySelector('.cover');
 if(actual&&size!=='normal'){actual.style.width=(size==='small'?38:300)+'px';actual.style.height=(size==='small'?57:450)+'px';}
 updateAppearancePreview();const frame=$('.appearance-sample'),image=$('.appearance-sample img'),caption=$('#appearance-preview>p'),space=$('.appearance-sample-space');
 const r=(['ulm','cambridge'].includes(presentation)?image:frame).getBoundingClientRect(),c=caption.getBoundingClientRect(),w=space.getBoundingClientRect();
 return {delta:Math.abs(r.x+r.width/2-c.x-c.width/2),inside:r.left>=w.left-1&&r.right<=w.right+1,width:r.width};
 },size);
 assert.ok(report.delta<1,mode+' '+size+' at '+viewport.width+': '+JSON.stringify(report));assert.equal(report.inside,true,mode+' fits reserved preview space');
 }
 await page.evaluate(()=>$('#settings-dialog').close());
 }
 }
 assert.deepEqual(errors,[]);console.log('PASS: centered appearance previews across 13 layouts, two viewport sizes, and small/normal/large source covers');
 }finally{await browser.close();await new Promise(r=>server.close(r));}
})().catch(error=>{console.error(error);process.exitCode=1});


