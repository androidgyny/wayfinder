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
 if(pathname.includes('audit-image')||pathname.startsWith('/icon/')||pathname.startsWith('/app-icon/')||pathname.startsWith('/art-icon/')){res.setHeader('Content-Type','image/svg+xml');res.end(svg);return;}
 if(pathname==='/games.js'){res.setHeader('Content-Type','application/javascript');res.end('window.GAMES='+JSON.stringify([fixture]));return;}
 const file=path.join(root,pathname==='/'?'index.html':pathname);try{res.setHeader('Content-Type',file.endsWith('.js')?'application/javascript':file.endsWith('.css')?'text/css':file.endsWith('.ttf')?'font/ttf':'text/html');res.end(fs.readFileSync(file));}catch{res.statusCode=404;res.end();}});
 await new Promise(r=>server.listen(0,'127.0.0.1',r));
 const browser=await chromium.launch({channel:process.env.BROWSER_CHANNEL||'msedge',headless:true});
 const page=await browser.newPage({viewport:{width:1097,height:700}}),errors=[],passed=[];
 page.on('pageerror',e=>errors.push(e.message));
 try{
 await page.addInitScript(fixture=>{window.auditDb=[fixture];window.calls={search:[],download:[],save:[],browser:[],files:[]};window.Portal={view:()=>'{}',saveView:()=>{},library:()=>JSON.stringify(auditDb),sound:()=>{},setThemeColor:()=>{},appsPreferences:()=>'[]',showKeyboard:()=>{},artworkSearch:(...a)=>calls.search.push(a),artworkDownload:(...a)=>calls.download.push(a),artworkSave:(...a)=>calls.save.push(a),openArtworkBrowser:(...a)=>calls.browser.push(a),chooseCover:(...a)=>calls.files.push(a)};},fixture);
 await page.goto('http://127.0.0.1:'+server.address().port);await page.waitForFunction(()=>typeof editGame==='function');


 await page.evaluate(()=>{window.appSaved=[];native.saveApp=raw=>{window.appSaved.push(JSON.parse(raw));return '{"ok":true}'};native.launchApp=p=>window.launched=p;drawerCatalog=Array.from({length:65},(_,i)=>({package:'test.app'+i,title:'Utility '+i}));drawerPreferences=drawerCatalog.slice(0,8).map((a,i)=>({package:a.package,pinned:true,order:i}));native.appsPreferences=()=>JSON.stringify(drawerPreferences);openApps()});
 assert.equal(await page.locator('.app-section').count(),5);
 assert.equal(await page.locator('#drawer-status').isVisible(),false,'overview has no explanatory line');
 for(const viewport of [{width:1097,height:592},{width:640,height:360}]){
  await page.setViewportSize(viewport);
  const fit=await page.evaluate(()=>{const cards=$('#app-sections').getBoundingClientRect(),dock=$('#app-dock').getBoundingClientRect(),hints=$('.apps-controller-hints').getBoundingClientRect();return {cards:cards.bottom<=dock.top,hints:dock.bottom<=hints.top,overflow:$('#apps-drawer').scrollWidth>$('#apps-drawer').clientWidth+1};});
  assert.deepEqual(fit,{cards:true,hints:true,overflow:false},JSON.stringify(viewport));
 }
 await page.setViewportSize({width:1097,height:592});
 const bars=await page.evaluate(async()=>{const results=[];native.setThemeColor=color=>window.barColor=color;const hex=node=>'#'+getComputedStyle(node,node.id==='apps-drawer'?'::backdrop':null).backgroundColor.match(/\d+/g).slice(0,3).map(v=>Number(v).toString(16).padStart(2,'0')).join('');for(const p of ['parchment','midnight']){setPalette(p);results.push(barColor===hex($('#apps-drawer')));showDialog('#app-appearance');hideDialog('#app-appearance');results.push(barColor===hex($('#apps-drawer')));hideDialog('#apps-drawer');results.push(barColor===hex(document.body));openApps();results.push(barColor===hex($('#apps-drawer')));$('#apps-drawer').close();await new Promise(r=>setTimeout(r,30));results.push(barColor===hex(document.body));openApps();}hideDialog('#apps-drawer');openApps();await new Promise(r=>setTimeout(r,30));results.push(barColor===hex($('#apps-drawer')));setPalette('portal');return results});
 assert.ok(bars.every(Boolean),'system bars follow Apps surface, palette changes, nested dialogs, close and immediate reopen');
 assert.deepEqual(await page.evaluate(()=>['Beeper','Reddit','Telegram','WhatsApp','Signal','Discord'].map(title=>appSection({title,package:'test.social'}))),Array(6).fill('social'));
 assert.equal(await page.evaluate(()=>{drawerPreferences.push({package:'test.manual',section:'news'});return appSection({title:'Reddit',package:'test.manual'})}),'news');
 assert.equal(await page.locator('#app-dock .drawer-app').count(),8);
 await page.locator('[data-section="tools"]').click();
 assert.equal(await page.locator('#drawer-grid .drawer-app').count(),65,'category has every app');
 assert.equal(await page.locator('#drawer-status').isVisible(),true,'expanded section retains status');
 await page.evaluate(()=>{appsController('down');appsController('pageDown');nativeBack()});
 assert.equal(await page.evaluate(()=>drawerSection),'');assert.equal(await page.evaluate(()=>document.activeElement.dataset.section),'tools');
 await page.evaluate(()=>appsController('down'));assert.ok(await page.evaluate(()=>!!document.activeElement.closest('#app-dock')));
 await page.evaluate(()=>appsController('up'));assert.equal(await page.evaluate(()=>document.activeElement.dataset.section),'tools');
 await page.locator('#app-dock .drawer-app').first().click();assert.equal(await page.evaluate(()=>launched),'test.app0');
 await page.evaluate(()=>editDrawerApp('test.app0'));await page.locator('#appearance-section').selectOption('news');await page.locator('#appearance-section-hidden').check();await page.locator('#app-appearance-form').evaluate(f=>f.requestSubmit());
 assert.equal(await page.evaluate(()=>window.appSaved.at(-1).section),'news');assert.equal(await page.evaluate(()=>window.appSaved.at(-1).hideFromSections),true);
 await page.locator('#drawer-search').fill('Utility 0');assert.equal(await page.locator('#drawer-grid .drawer-app').count(),1,'hidden section app remains searchable');
 await page.locator('#drawer-search').fill('');await page.locator('[data-drawer-view="all"]').click();assert.equal(await page.locator('#drawer-grid .drawer-app').count(),48);await page.locator('#drawer-next').click();assert.equal(await page.locator('#drawer-grid .drawer-app').count(),17);
 await page.locator('[data-drawer-view="home"]').click();await page.screenshot({path:'C:/Codex2/apps-first-version.png'});
 const before=await page.evaluate(()=>[...$('#app-dock').querySelectorAll('.drawer-app')].map(b=>b.dataset.package));
 await page.evaluate(()=>{native.reorderApps=ids=>{window.reordered=JSON.parse(ids);return '{"ok":true}'}});
 const first=await page.locator('#app-dock .drawer-app').nth(0).boundingBox(),second=await page.locator('#app-dock .drawer-app').nth(1).boundingBox();
 await page.mouse.move(first.x+20,first.y+20);await page.mouse.down();await page.mouse.move(second.x+20,second.y+20,{steps:8});await page.mouse.up();
 assert.equal(await page.evaluate(()=>window.reordered[1]),before[0],'dock drag order persists');
 for(const size of [{width:960,height:540},{width:600,height:800}]){await page.setViewportSize(size);assert.ok(await page.evaluate(()=>$('#apps-drawer').scrollWidth<=$('#apps-drawer').clientWidth+1),'no horizontal overflow');}

  await page.evaluate(()=>{drawerCatalog.push({package:'test.game.android',title:'Utility game',isGame:true},{package:'test.game.manual',title:'Utility manual'});drawerPreferences.push({package:'test.game.manual',classification:'game'});games.push({package:'test.game.manual',kind:'app'});drawerView='other';drawerPage=0;renderDrawer()});
 assert.equal(await page.evaluate(()=>drawerFiltered.length),66,'only library members are games');
 await page.locator('#drawer-search').fill('Utility');assert.equal(await page.evaluate(()=>drawerFiltered.length),66,'non-game search keeps filter');
 await page.evaluate(()=>{appsController('genreNext')});assert.equal(await page.evaluate(()=>drawerView),'all');assert.equal(await page.evaluate(()=>drawerFiltered.length),67);
 await page.evaluate(()=>appsController('genrePrev'));assert.equal(await page.evaluate(()=>drawerView),'other');
 assert.deepEqual(await page.evaluate(()=>{games.push({package:'test.host',kind:'shortcut'},{package:'test.intent',kind:'app',intentUri:'intent:test'});drawerPreferences.push({package:'test.override',classification:'game'},{package:'test.game.manual',classification:'app'});return ['test.host','test.intent','test.override','test.game.manual'].map(package=>drawerIsGame({package}))}),[false,false,false,true]);
 assert.equal(await page.locator('#appearance-class').count(),0);
 await page.evaluate(()=>{appsEvent('iconPacks',{packs:[{package:'test.pack',title:'Test pack'}]});appIconPack='test.pack';renderIconPackPicker()});
 assert.equal(await page.evaluate(()=>drawerImage({package:'test.unmatched'})),'app-icon/test.unmatched?pack=test.pack');
 assert.equal(await page.evaluate(()=>{drawerPreferences.push({package:'test.custom',image:'user/custom.jpg'});return drawerImage({package:'test.custom'})}),'user/custom.jpg');
 await page.evaluate(()=>{appIconPack='';renderIconPackPicker()});assert.equal(await page.evaluate(()=>drawerImage({package:'test.unmatched'})),'icon/test.unmatched');
 await page.evaluate(()=>{native.iconPackCatalog=(pack,token)=>receivePackCatalog({token,icons:Array.from({length:60},(_,i)=>'alternate_'+i)});editDrawerApp('test.app1')});
 await page.locator('#appearance-choose').click();assert.equal(await page.locator('.pack-icon-choice').count(),48);await page.locator('#pack-picker-next').click();assert.equal(await page.locator('.pack-icon-choice').count(),12);
 await page.locator('#pack-picker-search').fill('alternate 59');assert.equal(await page.locator('.pack-icon-choice').count(),1);await page.locator('.pack-icon-choice').click();assert.equal(await page.evaluate(()=>appearanceDraft.packIcon.name),'alternate_59');
 await page.locator('#app-appearance-form').evaluate(f=>f.requestSubmit());assert.equal(await page.evaluate(()=>appPreference('test.app1').packIcon.name),'alternate_59');
 assert.ok(await page.evaluate(()=>drawerImage({package:'test.app1'}).includes('drawable=alternate_59')));
 await page.evaluate(()=>{editDrawerApp('test.app1');appearanceDraft.title='Custom name';$('#appearance-name').value='Custom name';$('#appearance-reset').click()});
 assert.deepEqual(await page.evaluate(()=>[$('#appearance-name').value,appearanceDraft.title,!!appearanceDraft.packIcon]),['Custom name','Custom name',false]);
 await page.evaluate(()=>{appearanceDraft.packIcon={pack:'test.pack',name:'alternate_59'};$('#appearance-reset-name').click()});
 assert.equal(await page.evaluate(()=>appearanceDraft.packIcon.name),'alternate_59','resetting name preserves icon');
 await page.evaluate(()=>{availableIconPacks.push({package:'second.pack',title:'Second pack'});$('#appearance-choose').click();$('#pack-picker-source').value='second.pack';$('#pack-picker-source').dispatchEvent(new Event('change'));hideDialog('#pack-icon-picker');$('#appearance-choose').click()});
 assert.equal(await page.locator('#pack-picker-source').inputValue(),'second.pack','last browsed pack is remembered');
 await page.evaluate(()=>{window.originalChooseAppImage=window.chooseAppImage;window.fileRequests=0;window.chooseAppImage=()=>window.fileRequests++;$('#pack-picker-file').click()});
 assert.equal(await page.evaluate(()=>window.fileRequests),1);assert.equal(await page.evaluate(()=>$('#pack-icon-picker').open),false);
 await page.evaluate(()=>{window.savedPacks=availableIconPacks;availableIconPacks=[];$('#appearance-choose').click();availableIconPacks=window.savedPacks;window.chooseAppImage=window.originalChooseAppImage;hideDialog('#app-appearance')});
 assert.equal(await page.evaluate(()=>window.fileRequests),2,'no packs routes directly to image chooser');
 assert.equal(await page.evaluate(()=>appPreference('test.app1').packIcon.name),'alternate_59','canceling editor preserves saved icon');
 await page.evaluate(()=>{openApps();$('#app-dock .drawer-app').focus();window.focusedDock=document.activeElement.dataset.package;renderDrawer()});
 assert.equal(await page.evaluate(()=>document.activeElement.closest('#app-dock')?.id),'app-dock','refresh retains dock focus');
 assert.equal(await page.evaluate(()=>document.activeElement.dataset.package),await page.evaluate(()=>window.focusedDock));
 await page.evaluate(()=>{editDrawerApp('test.app1');$('#appearance-choose').click();hideDialog('#pack-icon-picker');$('#appearance-choose').click()});await page.waitForTimeout(50);
 assert.equal(await page.evaluate(()=>packPickerIcons.length),60,'queued close must not clear reopened picker');
 await page.evaluate(()=>{const before=packPickerIcons;receivePackCatalog({token:String(packPickerToken-1),icons:['stale']});window.staleIgnored=packPickerIcons===before});assert.equal(await page.evaluate(()=>window.staleIgnored),true);
 await page.evaluate(()=>{hideDialog('#pack-icon-picker');hideDialog('#app-appearance')});
 await page.evaluate(()=>{drawerView='other';$('#drawer-search').value='';renderDrawer();games.push({package:'test.app2',kind:'app'});window.dispatchEvent(new Event('librarychange'))});assert.equal(await page.evaluate(()=>drawerFiltered.some(a=>a.package==='test.app2')),false,'library membership refreshes open Apps view');
 await page.evaluate(()=>{editDrawerApp('test.app1');$('#appearance-choose').click();controller('pageDown')});assert.equal(await page.evaluate(()=>packPickerPage),1);await page.evaluate(()=>controller('search'));assert.equal(await page.evaluate(()=>document.activeElement.id),'pack-picker-search');
 await page.evaluate(()=>{const im=$('#pack-picker-grid img');im.dispatchEvent(new Event('error'))});assert.equal(await page.locator('#pack-picker-grid button').first().isDisabled(),true);
 await page.evaluate(()=>{while(topDialog())hideDialog('#'+topDialog().id);openApps();drawerView='other';renderDrawer();window.launched=null;});
 const editTarget=await page.locator('#drawer-grid .drawer-edit').first().boundingBox(),launchTarget=await page.locator('#drawer-grid .drawer-app').first().boundingBox();assert.ok(editTarget.width>=48&&editTarget.height>=48);assert.ok(editTarget.y+editTarget.height<=launchTarget.y+1,'edit and launch touch areas do not overlap');
 await page.mouse.click(editTarget.x+2,editTarget.y+2);assert.equal(await page.evaluate(()=>$('#app-appearance').open),true);assert.equal(await page.evaluate(()=>window.launched),null);
 await page.evaluate(()=>hideDialog('#app-appearance'));const target=await page.locator('#drawer-grid .drawer-app').first().boundingBox();await page.mouse.move(target.x+30,target.y+30);await page.mouse.down();await page.waitForTimeout(650);await page.mouse.up();assert.equal(await page.evaluate(()=>$('#app-appearance').open),true,'hold opens editor');assert.equal(await page.evaluate(()=>window.launched),null,'hold never launches');
 await page.evaluate(()=>{hideDialog('#app-appearance');const b=$('#drawer-grid .drawer-app');b.dispatchEvent(new PointerEvent('pointerdown',{bubbles:true,pointerId:101,clientX:50,clientY:50,button:0,isPrimary:true}));b.dispatchEvent(new PointerEvent('pointermove',{bubbles:true,pointerId:101,clientX:50,clientY:80}));});await page.waitForTimeout(650);assert.equal(await page.evaluate(()=>$('#app-appearance').open),false,'movement cancels hold');
 await page.evaluate(()=>{openApps();const b=$('#app-dock .drawer-app');b.dispatchEvent(new PointerEvent('pointerdown',{bubbles:true,pointerId:202,button:0,isPrimary:true}));document.body.dispatchEvent(new PointerEvent('pointerup',{bubbles:true,pointerId:202}));});
 assert.equal(await page.evaluate(()=>pinDrag),null,'release outside panel clears pending pin drag');
 await page.evaluate(()=>{const b=$('#app-dock .drawer-app');b.dispatchEvent(new PointerEvent('pointerdown',{bubbles:true,pointerId:203,button:0,isPrimary:true}));document.body.dispatchEvent(new PointerEvent('pointercancel',{bubbles:true,pointerId:203}));});
 assert.equal(await page.evaluate(()=>pinDrag),null,'outside pointer cancellation clears pending pin drag');
 await page.evaluate(()=>{editDrawerApp('test.app1');$('#appearance-choose').click();window.pendingCatalogToken=String(packPickerToken);nativeEvent('appUninstalled',{package:'test.app1'})});await page.waitForTimeout(30);
 assert.equal(await page.evaluate(()=>$('#pack-icon-picker').open),false,'uninstall closes icon chooser with its parent editor');
 await page.evaluate(()=>receivePackCatalog({token:window.pendingCatalogToken,icons:['late_icon']}));
 assert.deepEqual(errors,[]);console.log('PASS: categories, full contents, controller Back/dock navigation, launch, saved assignments, hidden app search and All apps pagination');
 }finally{await browser.close();await new Promise(r=>server.close(r));}
})().catch(error=>{console.error(error);process.exitCode=1});
