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
 await page.addInitScript(fixture=>{window.auditDb=[fixture];window.calls={search:[],download:[],save:[],browser:[],files:[]};window.Portal={view:()=>localStorage.getItem('auditView')||'{}',saveView:v=>{localStorage.setItem('auditView',v);window.savedView=JSON.parse(v)},library:()=>JSON.stringify(auditDb),sound:()=>{},setThemeColor:()=>{},appsPreferences:()=>'[]',showKeyboard:()=>{},artworkSearch:(...a)=>calls.search.push(a),artworkDownload:(...a)=>calls.download.push(a),artworkSave:(...a)=>calls.save.push(a),openArtworkBrowser:(...a)=>calls.browser.push(a),chooseCover:(...a)=>calls.files.push(a)};},fixture);
 await page.goto('http://127.0.0.1:'+server.address().port);await page.waitForFunction(()=>typeof editGame==='function');
 await page.waitForTimeout(250);
 const presetNames=await page.evaluate(()=>availableAppearancePresets().map(p=>p.name));
 assert.deepEqual(presetNames,[...presetNames].sort((a,b)=>a.localeCompare(b,undefined,{sensitivity:'base',numeric:true})));
 for(const name of presetNames){
  const result=await page.evaluate(name=>{applyAppearanceValues(builtinAppearancePresets.find(p=>p.name===name).values);return {shadow:coverShadow,hidden:$('#cover-shadow').closest('.settings-row').hidden}},name);
  const shadow=name==='Full House'?'crisp':['Folio Nova','Launchbiz','Niagaramond','Playrite'].includes(name)?'soft':'off';
  assert.equal(result.shadow,shadow,name);
 }
 passed.push('Every built-in preset applies its intended shadow; alphabetical ordering');
 await page.evaluate(()=>{applyAppearanceValues(builtinAppearancePresets.find(p=>p.name==='Full House').values);persist()});
 await page.reload();await page.waitForTimeout(300);
 assert.deepEqual(await page.evaluate(()=>({presentation,palette,coverShadow,coverCorners,coverGlow})),{presentation:'copenhagen',palette:'felt',coverShadow:'crisp',coverCorners:'soft',coverGlow:false});
 passed.push('Full House survives a full reload including Felt palette and shadows');
 await page.evaluate(()=>{setCoverShadow('soft');$('#preset-name').value='Audit custom';saveAppearancePreset();setCoverShadow('crisp');$('#appearance-presets').value='Audit custom';applyAppearancePreset()});
 assert.equal(await page.evaluate(()=>coverShadow),'soft');
 await page.evaluate(()=>{$('#settings-dialog').showModal();$('#appearance-presets').value='Full House';auditionAppearancePreset()});
 assert.equal(await page.evaluate(()=>coverShadow),'crisp');
 assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem('auditView')).coverShadow),'soft');
 await page.evaluate(()=>finishAppearanceAudition(false));
 assert.equal(await page.evaluate(()=>coverShadow),'soft');
 await page.evaluate(()=>{$('#appearance-presets').value='Full House';auditionAppearancePreset();finishAppearanceAudition(true);$('#settings-dialog').close()});
 assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem('auditView')).coverShadow),'crisp');
 passed.push('Custom preset save/apply; audition is not persisted; cancel restores and Keep saves');
 for(const width of [360,600,1097,1920]){
  await page.setViewportSize({width,height:800});
  for(const mode of ['library','berlin','seattle','vienna','prague','copenhagen','tokyo','oxford','ulm','cambridge','kyoto','cupertino','venice']){
   await page.evaluate(mode=>{setPresentation(mode);setUlmArtwork(true);setCambridgeArtwork(true);setCoverShadow('crisp');setCoverGlow(true);$('#settings-dialog').showModal();updateCoverGlow();updateAppearancePreview()},mode);
   await page.waitForFunction(()=>$('.appearance-sample img').complete&&$('.appearance-sample img').naturalWidth>0);
   const report=await page.evaluate(()=>{updateAppearancePreview();const sample=$('.appearance-sample img'),frame=sample.parentElement,space=$('.appearance-sample-space');const actual=['ulm','cambridge'].includes(presentation)?$('#'+presentation+'-cover'):['tokyo','oxford'].includes(presentation)?$('#tokyo-art'):$('#grid .presentation-selected .cover')||$('#grid .cover');const preview=['ulm','cambridge'].includes(presentation)?sample:frame;return {width:preview.getBoundingClientRect().width,height:preview.getBoundingClientRect().height,space:space.getBoundingClientRect().width,shadow:getComputedStyle(preview).boxShadow,actualShadow:getComputedStyle(actual).boxShadow,overflow:$('#settings-dialog').scrollWidth-$('#settings-dialog').clientWidth};});
   assert.ok(report.width>90&&report.width<=103,mode+' preview width @'+width+' '+JSON.stringify(report));
   if(mode==='oxford')assert.ok(Math.abs(report.width/report.height-2/3)<.01,'Oxford portrait aspect ratio @'+width);
   assert.ok(report.height>140&&report.height<=154,mode+' preview height @'+width);
   assert.equal(report.shadow,report.actualShadow,mode+' preview shadow @'+width);
   assert.ok(report.overflow<=1,mode+' dialog overflow @'+width+' '+report.overflow);
   await page.evaluate(()=>$('#settings-dialog').close());
  }
 }
 passed.push('52 layout/viewport checks: enlarged preview geometry, matching shadow, no horizontal settings overflow');
 for(const mode of ['kyoto','cupertino','venice']){
  const result=await page.evaluate(mode=>{setPresentation(mode);setCoverShadow('off');const e=$('#grid .cover'),off=getComputedStyle(e).boxShadow;setCoverShadow('crisp');return {off,on:getComputedStyle(e).boxShadow,hidden:$('#cover-shadow').closest('.settings-row').hidden}},mode);
  assert.equal(result.off,result.on);assert.equal(result.hidden,true);
 }
 passed.push('Hidden shadow settings have no effect on the three overlapping layouts');
 await page.evaluate(()=>{setPresentation('tokyo');setCoverShadow('crisp');setCoverGlow(true);updateCoverGlow()});
 const shadows=await page.evaluate(()=>({small:getComputedStyle($('#grid .cover')).boxShadow,large:getComputedStyle($('#tokyo-art')).boxShadow}));
 assert.ok(shadows.small.includes('1.2px 1.4px'));assert.ok(shadows.large.includes('6px 7px'));assert.ok(!shadows.small.includes('22px'));
 passed.push('Tokyo thumbnail offset stays small; large cover retains its shadow and halo');
 await page.setViewportSize({width:1097,height:700});
 await page.evaluate(()=>{setPresentation('library');setCoverShadow('off');showDialog('#settings-dialog');controllerFocus($('#cover-shadow'),true);controller('right')});
 assert.equal(await page.evaluate(()=>coverShadow),'soft');
 await page.evaluate(()=>{controller('activate');controller('down');controller('back')});
 assert.equal(await page.evaluate(()=>coverShadow),'soft');
 assert.equal(await page.evaluate(()=>document.activeElement.id),'cover-shadow');
 await page.evaluate(()=>{controller('activate');controller('down');controller('activate')});
 assert.equal(await page.evaluate(()=>coverShadow),'crisp');
 for(const mode of ['kyoto','cupertino','venice']){
  assert.equal(await page.evaluate(mode=>{setPresentation(mode);return dialogControls($('#settings-dialog')).some(e=>e.id==='cover-shadow')},mode),false);
 }
 passed.push('Controller adjusts shadows, cancels without changes, confirms and restores focus; hidden controls excluded');
 await page.evaluate(()=>{setPresentation('library');filtered=[];updateAppearancePreview()});
 assert.equal(await page.locator('.appearance-sample').isVisible(),false,'Empty library must not leave a floating frame/shadow');
 await page.evaluate(()=>{filtered=games;games[0].image='broken-cover.svg';updateAppearancePreview()});
 await page.waitForFunction(()=>$('.appearance-sample img').complete);
 assert.equal(await page.locator('.appearance-sample').isVisible(),false,'Failed artwork must not leave a floating frame/shadow');
 await page.evaluate(()=>{games[0].image='audit-image.svg';updateAppearancePreview()});
 await page.waitForFunction(()=>!$('.appearance-sample').hidden&&$('.appearance-sample img').naturalWidth>0);
 passed.push('Empty and missing artwork previews hide cleanly and recover');
 const prague=await page.evaluate(()=>{
  hideDialog('#settings-dialog');games=Array.from({length:1200},(_,i)=>({...games[0],id:'large'+i,title:'Game '+i,genre:'Category '+Math.floor(i/40),favorite:i<3}));rebuildGenres();setPresentation('prague');pragueOpen(pragueColumns[1].key,true);
  pragueController('down');const remembered=presentationId,originalRows=[...$('#grid').querySelectorAll('.game')];
  pragueController('right');pragueController('down');pragueController('left');
  const rowsUnchanged=originalRows.every(n=>n.isConnected);
  setCoverShadow('crisp');
  return {restored:presentationId===remembered,selected:$('#grid').querySelectorAll('.presentation-selected').length,focused:document.activeElement?.dataset.id===remembered,rowsUnchanged,smallShadow:getComputedStyle($('#grid .cover')).boxShadow.includes('1.2px 1.4px')};
 });
 assert.deepEqual(prague,{restored:true,selected:1,focused:true,rowsUnchanged:true,smallShadow:true});
 passed.push('Prague: 1,200-game category changes preserve remembered selection, unique focus, and scroll containers');
 assert.deepEqual(errors,[]);console.log(JSON.stringify({passed,errors},null,2));
 }finally{await browser.close();await new Promise(r=>server.close(r));}
})().catch(error=>{console.error(error);process.exitCode=1});
