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

 await page.waitForFunction(()=>!restoring);let checks=0;
 for(const mode of ['bath','redmond','sanfrancisco','atlantis']){
  await page.evaluate(mode=>{setPresentation(mode);showDialog('#settings-dialog');selectSettingsSection('appearance')},mode);
  await page.waitForFunction(()=>document.querySelector('.appearance-sample img').naturalWidth>0);
  for(const aspect of [[600,900],[900,600],[600,600]]){
   await page.evaluate(([w,h])=>{games[0].image='data:image/svg+xml,'+encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="'+w+'" height="'+h+'"><rect width="100%" height="100%" fill="teal"/><circle cx="50%" cy="50%" r="100" fill="gold"/></svg>');update();updateAppearancePreview()},aspect);
   await page.waitForFunction(()=>{const a=document.querySelector('#'+presentation+'-cover'),p=document.querySelector('.appearance-sample img');return a.complete&&p.complete&&a.naturalWidth>0&&a.naturalWidth===p.naturalWidth});
  for(const fit of ['cover','contain'])for(const border of ['none','hairline','matte'])for(const corners of ['square','soft','rounded']){
   await page.evaluate(({fit,border,corners})=>{setArtFit(fit);setLightAppearance(border,'soft','regular');setCoverOptions(corners,'even','all');updateAppearancePreview()}, {fit,border,corners});
   const r=await page.evaluate(()=>{const a=document.querySelector('#'+presentation+'-cover'),p=document.querySelector('.appearance-sample img'),f=p.parentElement,sa=getComputedStyle(a),sp=getComputedStyle(p),sf=getComputedStyle(f);return {actual:[sa.objectFit,sa.objectPosition,sa.borderTopWidth,sa.borderRadius,sa.backgroundColor,sa.boxShadow],preview:[sp.objectFit,sp.objectPosition,sp.borderTopWidth,sp.borderRadius,sp.backgroundColor,sp.boxShadow],frame:[sf.borderTopWidth,sf.outlineStyle,sf.boxShadow],ratio:a.getBoundingClientRect().width/a.getBoundingClientRect().height,previewRatio:p.getBoundingClientRect().width/p.getBoundingClientRect().height}});
   assert.deepEqual(r.actual,r.preview,mode+' '+fit+' '+border+' '+corners);assert.deepEqual(r.frame,['0px','none','none']);assert.ok(Math.abs(r.ratio-r.previewRatio)<.005);checks++;
  }
  }
  await page.setViewportSize({width:960,height:450});await page.waitForTimeout(100);
  assert.ok(await page.evaluate(()=>Math.abs(parseFloat(document.querySelector('.appearance-sample img').style.width)-document.querySelector('#'+presentation+'-cover').getBoundingClientRect().width)<1),'preview refreshes after resizing '+mode);
  await page.evaluate(()=>hideDialog('#settings-dialog'));await page.setViewportSize({width:1097,height:700});
 }
 assert.deepEqual(errors,[]);console.log('PASS '+checks+' actual-cover/preview comparisons: Fill/Fit, borders, corners, backgrounds, shadows, and proportions across three recent layouts');
 }finally{await browser.close();await new Promise(r=>server.close(r));}
})().catch(error=>{console.error(error);process.exitCode=1});


