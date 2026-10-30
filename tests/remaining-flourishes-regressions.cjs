/* Deterministic mixed-interaction audit; synthetic data only, no device/network API calls. */
const assert=require('node:assert/strict'),fs=require('node:fs'),http=require('node:http'),path=require('node:path');
const {chromium}=require('playwright');
const root=path.resolve(__dirname,'../app/src/main/assets/www');
const fixture=Array.from({length:1200},(_,i)=>({id:'mix_'+i,title:(i%7?'Game ':'Retro ')+String(i).padStart(4,'0')+(i%11?'':' — 漢字 & "quoted"'),genre:['Action','Puzzles','RPGs','Kids\' games','A & B','日本語'][i%6],image:'icon/test.fixture',package:'test.fixture',kind:'app',favorite:i%13===0,lastPlayed:i%5?0:i+1}));
const svg='<svg xmlns="http://www.w3.org/2000/svg" width="80" height="120"><rect width="80" height="120" fill="#386a59"/></svg>';
(async()=>{
 const server=http.createServer((req,res)=>{const u=new URL(req.url,'http://localhost').pathname;
 if(u==='/games.js'){res.setHeader('Content-Type','text/javascript');return res.end('window.GAMES='+JSON.stringify(fixture));}
 if(u.startsWith('/icon/')){res.setHeader('Content-Type','image/svg+xml');return res.end(svg);}
 try{const file=path.join(root,u==='/'?'index.html':u);res.setHeader('Content-Type',u.endsWith('.js')?'text/javascript':u.endsWith('.css')?'text/css':u.endsWith('.ttf')?'font/ttf':'text/html');res.end(fs.readFileSync(file));}catch{res.statusCode=404;res.end();}});
 await new Promise(r=>server.listen(0,'127.0.0.1',r));const browser=await chromium.launch({channel:process.env.BROWSER_CHANNEL||'msedge',headless:true});
 try{
  const page=await browser.newPage({viewport:{width:1097,height:592}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.addInitScript(data=>{window.fixtureDb=data;window.Portal={library:()=>JSON.stringify(fixtureDb),view:()=>localStorage.view||'{}',saveView:v=>localStorage.view=v,sound:()=>{},setThemeColor:()=>{},appsPreferences:()=>'[]'};},fixture);
  await page.goto('http://127.0.0.1:'+server.address().port);await page.waitForFunction(()=>typeof restoring!=='undefined'&&!restoring);

  for(const [layout,selector,pseudo] of [['sanfrancisco','.sf-category.current','::after']]){
   await page.evaluate(l=>{setPresentation(l);if(l==='ulm'){ulmLevel='categories';update()}if(l==='cupertino')document.body.dataset.cupertinoReflections='classic'},layout);
   assert.equal(await page.locator(selector).first().evaluate((n,p)=>getComputedStyle(n,p).content,pseudo),'""',layout+' accent exists');
   for(const [width,height] of [[800,450],[1024,768],[1280,550]]){await page.setViewportSize({width,height});await page.waitForTimeout(70);const box=await page.locator(selector).first().boundingBox();assert.ok(box&&box.width>0&&box.height>0,layout+' target visible');}
   await page.screenshot({path:path.resolve(__dirname,'../output/polish-'+layout+'.png')});
  }
  await page.emulateMedia({reducedMotion:'reduce'});assert.equal(await page.locator('.sf-category.current').evaluate(n=>getComputedStyle(n,'::after').animationName),'none');await page.emulateMedia({reducedMotion:'no-preference'});
  await page.setViewportSize({width:1097,height:592});
  await page.evaluate(()=>showDialog('#settings-dialog'));
  assert.equal(await page.evaluate(()=>document.activeElement.id),'settings-nav-appearance');
  assert.equal(await page.evaluate(()=>{const backdrop=getComputedStyle($('#settings-dialog'),'::backdrop');return backdrop.backgroundColor===getComputedStyle(document.body).backgroundColor&&backdrop.backdropFilter==='none'}),true,'Settings fully obscures underlying glows');
  assert.deepEqual(await page.locator('#settings-content>.settings-group:visible').evaluateAll(n=>n.map(x=>x.id)),['settings-appearance']);
  assert.equal(await page.locator('#app-icon-pack').isVisible(),false);
  assert.equal(await page.locator('#settings-appearance #appearance-preview').count(),1);
  assert.equal(await page.evaluate(()=>{const ids=[...document.querySelectorAll('[id]')].map(n=>n.id);return ids.length===new Set(ids).size}),true);
  assert.equal(await page.locator('#preset-name').isVisible(),false);
  await page.evaluate(()=>controller('down'));
  assert.equal(await page.evaluate(()=>document.activeElement.id),'settings-nav-library');
  await page.evaluate(()=>controller('activate'));
  assert.equal(await page.evaluate(()=>document.activeElement.id),'presentation-sort');
  await page.evaluate(()=>controller('down'));
  const remembered=await page.evaluate(()=>document.activeElement.id);
  await page.evaluate(()=>controller('back'));
  assert.equal(await page.evaluate(()=>document.activeElement.id),'settings-nav-library');
  await page.evaluate(()=>controller('right'));
  assert.equal(await page.evaluate(()=>document.activeElement.id),remembered);
  await page.evaluate(()=>{controller('back');controller('back')});
  assert.equal(await page.locator('#settings-dialog').isVisible(),false);
  await page.evaluate(()=>showDialog('#settings-dialog'));
  assert.equal(await page.evaluate(()=>document.activeElement.id),'settings-nav-library');
  for(const key of ['appearance','library','apps','sound','system']){
   await page.evaluate(key=>selectSettingsSection(key,true),key);
   assert.equal(await page.locator('#settings-content>.settings-group:visible').count(),1);
   assert.equal(await page.evaluate(()=>dialogControls($('#settings-dialog')).every(n=>!n.closest('[hidden]'))),true);
  }
  await page.locator('#settings-open-ai').click();assert.equal(await page.locator('#gemini-key').isVisible(),true);
  await page.evaluate(()=>nativeBack());assert.equal(await page.evaluate(()=>document.activeElement.id),'settings-open-ai');
  await page.evaluate(()=>selectSettingsSection('sound',true));await page.locator('#settings-open-startup').click();assert.equal(await page.locator('#startup-enabled').isVisible(),true);
  await page.evaluate(()=>nativeBack());assert.equal(await page.evaluate(()=>document.activeElement.id),'settings-open-startup');
  await page.evaluate(()=>selectSettingsSection('appearance',true));
  await page.locator('#settings-save-look').click();await page.locator('#preset-name').fill('Audit saved look');await page.locator('#preset-save').click();
  assert.equal(await page.evaluate(()=>appearancePresets.some(p=>p.name==='Audit saved look')),true);
  await page.evaluate(()=>nativeBack());assert.equal(await page.evaluate(()=>document.activeElement.id),'settings-save-look');
  await page.locator('#settings-manage-presets').click();await page.locator('#settings-saved-presets').selectOption('Audit saved look');await page.locator('#preset-delete').click();
  assert.equal(await page.evaluate(()=>appearancePresets.some(p=>p.name==='Audit saved look')),false);
  await page.evaluate(()=>nativeBack());
  await page.locator('#appearance-presets').selectOption('Smitchish Dark');await page.locator('#preset-preview').click();
  assert.equal(await page.locator('#settings-dialog').isVisible(),false);await page.evaluate(()=>finishAppearanceAudition(false));
  assert.equal(await page.evaluate(()=>document.activeElement.id),'preset-preview');
  const sectionScroll=await page.evaluate(()=>{
   selectSettingsSection('sound',true);$('#settings-content').scrollTop=0;
   selectSettingsSection('appearance',true);$('#settings-content').scrollTop=500;const before=$('#settings-content').scrollTop;
   selectSettingsSection('sound',true);const sound=$('#settings-content').scrollTop;
   selectSettingsSection('appearance',true);return {before,sound,restored:$('#settings-content').scrollTop};
  });
  assert.equal(sectionScroll.sound,0,'A new section starts at its heading instead of inheriting another section scroll');
  assert.equal(sectionScroll.restored,sectionScroll.before,'Each section remembers its own scroll position');
  await page.evaluate(()=>$('#settings-nav-apps').focus());
  assert.equal(await page.evaluate(()=>settingsSection),'apps','Keyboard focus and active section agree');
  await page.evaluate(()=>controller('right'));
  assert.equal(await page.evaluate(()=>document.activeElement.id),'app-icon-pack','Right enters the focused section');
  await page.evaluate(()=>{selectSettingsSection('appearance',true);setPresentation('cambridge');setCambridgeArtwork(false);refreshApplicableAppearanceControls()});
  assert.equal(await page.evaluate(()=>[...document.querySelectorAll('#settings-appearance .settings-subheading')].find(n=>n.textContent==='Covers & selection').hidden),true,'No empty appearance subsection when artwork is disabled');
  await page.evaluate(()=>{setPresentation('library');refreshApplicableAppearanceControls()});
  for(const [section,button,dialog] of [['library','manage-categories','category-manager'],['library','open-library-info','library-info'],['system','open-help','help-dialog']]){
   await page.evaluate(k=>selectSettingsSection(k,true),section);
   await page.locator('#'+button).click();assert.equal(await page.evaluate(()=>topDialog().id),dialog);
   await page.evaluate(()=>nativeBack());assert.equal(await page.evaluate(()=>document.activeElement.id),button,'return focus from '+dialog);
   assert.equal(await page.evaluate(()=>topDialog().id),'settings-dialog');
  }
  await page.evaluate(()=>{selectSettingsSection('appearance',true);$('#palette').focus();controller('activate')});
  const paletteBefore=await page.evaluate(()=>palette);
  assert.equal(await page.evaluate(()=>topDialog().id),'controller-choice');
  await page.evaluate(()=>{controller('down');controller('back')});
  assert.equal(await page.evaluate(()=>palette),paletteBefore,'canceling a controller choice does not change appearance');
  assert.equal(await page.evaluate(()=>document.activeElement.id),'palette');
  await page.evaluate(()=>{nativeBack();nativeBack()});
  assert.equal(await page.evaluate(()=>!topDialog()),true);assert.equal(await page.evaluate(()=>document.body.style.overflow),'');
  assert.deepEqual(await page.evaluate(()=>games),fixture,'settings operations preserve all game records');
  await page.evaluate(()=>showDialog('#settings-dialog'));
  fs.mkdirSync(path.resolve(__dirname,'../output/settings-navigation'),{recursive:true});
  for(const width of [1097,640,390]){
   await page.setViewportSize({width,height:650});
   for(const section of ['appearance','library','apps','sound','system']){
    await page.evaluate(k=>selectSettingsSection(k,true),section);
    const geometry=await page.evaluate(()=>{const d=$('#settings-dialog'),c=$('#settings-content');return {outer:d.scrollWidth-d.clientWidth,inner:c.scrollWidth-c.clientWidth,height:c.clientHeight}});
    assert.ok(geometry.outer<=1&&geometry.inner<=1&&geometry.height>100,JSON.stringify({width,section,geometry}));
   }
   await page.evaluate(()=>selectSettingsSection('appearance',true));
   await page.screenshot({path:path.resolve(__dirname,'../output/settings-navigation/settings-'+width+'.png')});
  }
  assert.deepEqual(errors,[]);console.log('PASS settings sections, controller enter/back/focus memory, submenus, saved presets, preview/Revert and responsive geometry');

 }finally{await browser.close();await new Promise(r=>server.close(r));}
})().catch(e=>{console.error(e);process.exitCode=1});
