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
 for(const mode of modes){
  await page.evaluate(mode=>{setPresentation(mode);setUlmArtwork(true);setCambridgeArtwork(true);setCoverGlow(false);setCoverShadow('soft');$('#settings-dialog').showModal();refreshApplicableAppearanceControls()},mode);
  const expected=!['kyoto','cupertino','venice'].includes(mode);
  assert.equal(await page.locator('#cover-shadow').isVisible(),expected,mode+' visibility');
  if(expected){
   for(const border of ['none','hairline','matte'])for(const selection of ['outline','underline','glow'])for(const halo of [false,true]){
    const report=await page.evaluate(({border,selection,halo})=>{
     setLightAppearance(border,'soft','medium');setAtmosphere('flat',selection);setCoverGlow(halo);updateCoverGlow();
     const actual=['ulm','cambridge'].includes(presentation)?$('#'+presentation+'-cover'):['tokyo','oxford'].includes(presentation)?$('#tokyo-art'):$('#grid .game .cover');
     if(!actual)return null;
     const result={};for(const shadow of ['off','soft','crisp']){setCoverShadow(shadow);updateAppearancePreview();result[shadow]=getComputedStyle(actual).boxShadow;}
     result.border=getComputedStyle(actual).borderTopWidth;
     return result;
    },{border,selection,halo});
    assert.ok(report,mode+' artwork exists');
    assert.notEqual(report.off,report.soft,mode+' soft '+border+selection+halo);
    assert.notEqual(report.soft,report.crisp,mode+' crisp '+border+selection+halo);
    if(border!=='none')assert.equal(report.border,border==='matte'?'6px':'1px',mode+' border');
   }
  }
  await page.evaluate(()=>$('#settings-dialog').close());
 }
 for(const mode of ['ulm','cambridge']){
  await page.evaluate(mode=>{setPresentation(mode);if(mode==='ulm')setUlmArtwork(false);else setCambridgeArtwork(false);$('#settings-dialog').showModal();refreshApplicableAppearanceControls()},mode);
  assert.equal(await page.locator('#cover-shadow').isVisible(),false);
  await page.evaluate(()=>$('#settings-dialog').close());
 }
 const state=await page.evaluate(()=>{setCoverShadow('crisp');const saved=appearanceSnapshot();applyAppearanceValues({...saved,coverShadow:'soft'});const applied=coverShadow;applyAppearanceValues(saved);const restored=coverShadow;applyAppearanceValues({});return {saved:saved.coverShadow,applied,restored,legacy:coverShadow}});
 assert.deepEqual(state,{saved:'crisp',applied:'soft',restored:'crisp',legacy:'off'});
 assert.deepEqual(errors,[]);console.log('PASS: 13 layouts; 180 border/selection/halo combinations; artwork visibility; preset save/apply/revert and legacy defaults.');
 }finally{await browser.close();await new Promise(r=>server.close(r));}
})().catch(error=>{console.error(error);process.exitCode=1});


