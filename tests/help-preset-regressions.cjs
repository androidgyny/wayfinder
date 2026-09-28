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

 for(const viewport of [{width:1097,height:592},{width:480,height:600}]){
 await page.setViewportSize(viewport);
 await page.evaluate(()=>{$('#settings-button').click();$('#open-help').focus();$('#open-help').click();});
 assert.equal(await page.evaluate(()=>topDialog().id),'help-dialog');
 await page.evaluate(()=>controller('down'));assert.ok(await page.evaluate(()=>$('#help-dialog').scrollTop)>0);
 await page.evaluate(()=>controller('pageDown'));assert.ok(await page.evaluate(()=>$('#help-dialog').scrollWidth<=$('#help-dialog').clientWidth+1));
 await page.evaluate(()=>controller('back'));assert.equal(await page.evaluate(()=>topDialog().id),'settings-dialog');assert.equal(await page.evaluate(()=>document.activeElement.id),'open-help');
 await page.evaluate(()=>{$('#open-help').click();});assert.equal(await page.evaluate(()=>$('#help-dialog').scrollTop),0);
 await page.evaluate(()=>{$('#close-help').click();hideDialog('#settings-dialog');});
 }
 const before=await page.evaluate(()=>appearanceSnapshot());
 await page.evaluate(()=>{applyAppearanceValues(builtinAppearancePresets.find(p=>p.name==='After Hours').values);});
 assert.deepEqual(await page.evaluate(()=>[presentation,backdrop,backgroundDim,palette,selectionStyle,coverShadow]),['oxford','fireflies',75,'midnight','underline','off']);
 await page.evaluate(()=>{showDialog('#settings-dialog');$('#appearance-presets').value='After Hours';refreshPresetButtons();$('#preset-preview').click();});
 assert.equal(await page.evaluate(()=>topDialog().id),'preset-audition');
 await page.evaluate(()=>finishAppearanceAudition(false));
 assert.equal(await page.evaluate(()=>topDialog().id),'settings-dialog');
 await page.setViewportSize({width:1097,height:592});await page.evaluate(()=>$('#open-help').click());await page.screenshot({path:'output/after-hours-help-check.png'});
 assert.deepEqual(errors,[]);console.log('PASS: Help navigation, After Hours audition, and Oxford appearance');
 }finally{await browser.close();await new Promise(r=>server.close(r));}
})().catch(error=>{console.error(error);process.exitCode=1});
