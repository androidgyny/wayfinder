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
 await page.evaluate(()=>{window.savedSections=[];native.appSections=()=>JSON.stringify(savedSections);native.saveAppSections=raw=>{savedSections=JSON.parse(raw);const allowed=new Set(['auto','news','media','social','tools','system',...savedSections.map(s=>s.id)]);drawerPreferences=drawerPreferences.map(a=>allowed.has(a.section||'auto')?a:{...a,section:'auto'});return '{"ok":true}'};loadAppSections()});

 await page.evaluate(()=>openAppSectionEditor(appSections.find(s=>s.id==='media')));
 assert.equal(await page.locator('#app-section-color').inputValue(),'#b29aed');
 assert.equal(await page.locator('#app-section-name').isVisible(),false);assert.equal(await page.evaluate(()=>document.activeElement.closest('#app-section-color-picker')?.id),'app-section-color-picker','built-in editor focuses selected color');
 await page.locator('#app-section-color-picker [aria-label=Coral]').click();await page.locator('#app-section-editor-form').evaluate(f=>f.requestSubmit());
 assert.equal(await page.evaluate(()=>savedSections.find(s=>s.id==='media').color),'#e7978c');
 await page.evaluate(()=>{loadAppSections();openAppSectionEditor(appSections.find(s=>s.id==='media'))});
 assert.equal(await page.locator('#app-section-color').inputValue(),'#e7978c');
 await page.locator('#app-section-reset-color').click();await page.locator('#app-section-editor-form').evaluate(f=>f.requestSubmit());
 assert.equal(await page.evaluate(()=>appSections.find(s=>s.id==='media').color),'#b29aed');
 assert.equal(await page.evaluate(()=>savedSections.some(s=>s.id==='media')),false,'reset removes override');
 await page.evaluate(()=>{$('#manage-app-sections').click()});await page.locator('[data-manager-section=news] [data-section-action=down]').click();
 assert.deepEqual(await page.evaluate(()=>appSections.slice(0,2).map(s=>s.id)),['media','news']);
 await page.evaluate(()=>{loadAppSections();renderDrawer()});assert.equal(await page.locator('#app-sections button').first().getAttribute('data-section'),'media','built-in order survives reload');
 await page.evaluate(()=>{openAppSectionEditor(appSections.find(s=>s.id==='news'))});await page.locator('#app-section-color-picker [aria-label=Mint]').click();await page.locator('#app-section-editor-form').evaluate(f=>f.requestSubmit());
 assert.equal(await page.evaluate(()=>appSections[0].id),'media','color editing retains category order');

 await page.evaluate(()=>{window.goodSaveSections=native.saveAppSections;native.saveAppSections=()=>JSON.stringify({ok:false,message:'Simulated storage failure'});openAppSectionEditor(appSections.find(s=>s.id==='news'))});
 await page.locator('#app-section-color-picker [aria-label=Coral]').click();await page.locator('#app-section-editor-form').evaluate(f=>f.requestSubmit());
 assert.equal(await page.evaluate(()=>appSections.find(s=>s.id==='news').color),'#7cbfa3','failed save rolls back in-memory color');
 assert.ok(await page.locator('#app-section-error').textContent().then(s=>s.includes('Simulated')));
 await page.evaluate(()=>{native.saveAppSections=goodSaveSections;hideDialog('#app-section-editor')});
 await page.evaluate(()=>{hideDialog('#app-section-manager');savedSections=[];loadAppSections();renderDrawer()});

 for(const viewport of [{width:1097,height:592},{width:640,height:360},{width:800,height:600}]){
  await page.setViewportSize(viewport);
  await page.evaluate(()=>{setTypography('editorial');$('#manage-app-sections').click()});
  for(const id of ['app-section-manager','app-section-editor']){
   if(id==='app-section-editor')await page.locator('#add-app-section').click();
   const frame=await page.locator('#'+id).evaluate(d=>{const r=d.getBoundingClientRect(),h=d.querySelector('header').getBoundingClientRect(),f=d.querySelector('footer').getBoundingClientRect(),b=d.querySelector('.app-section-dialog-body');return {font:getComputedStyle(d.querySelector('h2')).fontFamily,fit:r.top>=0&&r.bottom<=innerHeight+1&&f.bottom<=r.bottom&&h.bottom<=f.top,overflow:d.scrollWidth>d.clientWidth+1,padding:parseFloat(getComputedStyle(b).paddingLeft)}});
   assert.ok(frame.font.includes('WayfinderClean'));assert.ok(frame.fit,JSON.stringify({viewport,id,frame}));assert.equal(frame.overflow,false);assert.ok(frame.padding>=18);
  }
  await page.locator('[data-icon="joystick"]').click();
  assert.equal(await page.evaluate(()=>document.activeElement.dataset.icon),'joystick','icon selection preserves controller focus');
  await page.evaluate(()=>{hideDialog('#app-section-editor');hideDialog('#app-section-manager')});
 }
 await page.setViewportSize({width:640,height:360});
 await page.evaluate(()=>{savedSections=Array.from({length:20},(_,i)=>({id:'custom_test'+i,name:'Long section '+i+' with a descriptive name',note:'A description that must wrap without pushing controls outside the frame',icon:'joystick'}));loadAppSections();renderDrawer();$('#manage-app-sections').click()});
 await page.locator('[data-manager-section="custom_test1"] [data-section-action="up"]').click();
 assert.equal(await page.evaluate(()=>document.activeElement.closest('[data-manager-section]')?.dataset.managerSection),'custom_test1','reorder retains focus on moved section');await page.locator('[data-manager-section=custom_test1] [data-section-action=up]').click({clickCount:1});assert.ok(await page.evaluate(()=>appSections.findIndex(s=>s.id==='custom_test1')<appSections.findIndex(s=>s.id==='system')),'custom sections can move before built-ins');
 await page.evaluate(()=>hideDialog('#app-section-manager'));
 const strip=await page.evaluate(()=>{const cards=[...$('#app-sections').children],root=$('#app-sections');cards[0].focus();for(let i=0;i<24;i++)sectionController('right');const last=cards.at(-1).getBoundingClientRect(),r=root.getBoundingClientRect(),dock=$('#app-dock').getBoundingClientRect();return {single:cards.every(c=>Math.abs(c.getBoundingClientRect().top-last.top)<2),scrolled:root.scrollLeft>0,visible:last.right<=r.right+1,dock:dock.bottom<=innerHeight&&dock.top>=r.bottom};});assert.deepEqual(strip,{single:true,scrolled:true,visible:true,dock:true});
 await page.evaluate(()=>sectionController('down'));assert.equal(await page.evaluate(()=>document.activeElement.closest('#app-dock')?.id),'app-dock','Down reaches pinned apps');
 await page.setViewportSize({width:1097,height:592});const subtitle=await page.locator('[data-section=custom_test1] .section-note').evaluate(n=>({height:n.getBoundingClientRect().height,line:parseFloat(getComputedStyle(n).lineHeight)}));assert.ok(subtitle.height>=subtitle.line*2-1,'two-line description retains complete line boxes');
 for(const viewport of [{width:1097,height:592},{width:640,height:360}]){
  await page.setViewportSize(viewport);await page.evaluate(()=>{drawerSection='custom_test1';renderDrawer()});
  const compact=await page.locator('[data-section=custom_test1]').evaluate(c=>{const r=c.getBoundingClientRect(),n=c.querySelector('strong').getBoundingClientRect(),a=c.querySelector('.section-art').getBoundingClientRect();return {note:getComputedStyle(c.querySelector('.section-note')).display,icons:getComputedStyle(c.querySelector('.section-icons')).display,fit:a.left>=r.left&&n.right<=r.right&&n.width>0}});
  assert.deepEqual(compact,{note:'none',icons:'none',fit:true},'compact category contents stay inside their tab');
 }
 await page.evaluate(()=>{drawerSection='';renderDrawer()});
 for(const view of ['home','pinned','recent','other','all']){assert.equal(await page.evaluate(view=>{drawerView=view;renderDrawer();$('#drawer-search').focus();appsController('up');return document.activeElement.id},view),'manage-app-sections','top actions reachable from '+view)}
 await page.evaluate(()=>{savedSections=[];customAppSections=[];loadAppSections();drawerView='home';renderDrawer()});
 await page.setViewportSize({width:1097,height:700});
 await page.evaluate(()=>{savedSections=[{id:'custom_restart',name:'Emulation',note:'Saved before restart',icon:'puzzle-piece'}];customAppSections=[];appSections=[...builtInAppSections];hideDialog('#apps-drawer');openApps()});assert.equal(await page.locator('[data-section=custom_restart]').count(),1,'opening Apps reloads persisted native sections after startup');await page.evaluate(()=>{savedSections=[];loadAppSections();renderDrawer()});
 await page.locator('#manage-app-sections').click();await page.locator('#add-app-section').click();await page.locator('#app-section-name').fill('Reading');await page.locator('#app-section-note').fill('Books and articles');await page.locator('[data-icon="newspaper"]').click();await page.locator('#app-section-color-picker [aria-label=Coral]').click();assert.equal(await page.evaluate(()=>document.activeElement.getAttribute('aria-label')),'Coral');await page.locator('#app-section-editor-form').evaluate(f=>f.requestSubmit());
 const customId=await page.evaluate(()=>customAppSections[0].id);assert.equal(await page.evaluate(()=>savedSections[0].color),'#e7978c');await page.evaluate(()=>{loadAppSections();openAppSectionEditor(customAppSections[0])});assert.equal(await page.locator('#app-section-color').inputValue(),'#e7978c');await page.locator('#app-section-color-picker [aria-label=Mint]').click();await page.evaluate(()=>hideDialog('#app-section-editor'));assert.equal(await page.evaluate(()=>customAppSections[0].color),'#e7978c','cancel preserves saved color');assert.equal(await page.locator('.app-section').count(),6,'custom section joins Apps overview');
 await page.evaluate(id=>editDrawerApp('test.app0'),customId);assert.ok(await page.locator('#appearance-section option').allTextContents().then(items=>items.includes('Reading')),'custom section joins app editor');
 const aiSections=await page.evaluate(()=>{native.geminiHasKey=()=>true;native.aiSuggest=(request,raw)=>window.aiSuggestionPayload=JSON.parse(raw);aiSuggest(true);return window.aiSuggestionPayload.categories;});assert.ok(aiSections.some(s=>s.id===customId&&s.name==='Reading'&&s.note==='Books and articles'),'custom section joins AI suggestion choices');
 await page.evaluate(id=>{aiStopSuggestion();hideDialog('#app-appearance');drawerPreferences[0].section=id;drawerSection=id;customAppSections=[];saveAppSections()},customId);assert.equal(await page.locator('.app-section').count(),5,'deleting custom section restores built-in overview');assert.equal(await page.evaluate(()=>drawerPreferences[0].section),'auto','apps from a deleted section return to automatic sorting');assert.equal(await page.evaluate(()=>drawerSection),'','deleting open category returns to overview');
 await page.evaluate(()=>hideDialog('#app-section-manager'));
 for(const font of ['computer','ibmvga','editorial','outfit','clean','spacegrotesk','oxanium','spacemono','ibmplexsans','nunito','winetahoma','oswald','go']){
  const styles=await page.evaluate(font=>{setTypography(font);const h=getComputedStyle($('.apps-heading h2')),category=getComputedStyle($('.app-section strong'));return {font:h.fontFamily,category:category.fontFamily,weight:h.fontWeight,spacing:h.letterSpacing};},font);
  assert.equal(styles.font,styles.category,'Apps heading matches category font regardless of '+font);
  assert.ok(styles.font.includes('WayfinderClean'));assert.equal(styles.weight,'400');assert.equal(styles.spacing,'normal');
  const editorStyles=await page.evaluate(()=>{
   editDrawerApp(drawerCatalog[0].package);openControllerChoice($('#appearance-section'));
   const values=['#app-appearance h2','#appearance-name','#pack-picker-title','#controller-choice-title'].map(selector=>{const s=getComputedStyle($(selector));return {font:s.fontFamily,weight:s.fontWeight,spacing:s.letterSpacing};});
   closeControllerChoice();hideDialog('#app-appearance');return values;
  });
  assert.ok(editorStyles.every(s=>s.font.includes('WayfinderClean')),'App editor and pickers remain independent of '+font);
  for(const i of [0,2,3]){assert.equal(editorStyles[i].weight,'600');assert.equal(editorStyles[i].spacing,'normal');}
  const gameChooser=await page.evaluate(()=>{
   openControllerChoice($('#typography'));
   const result={appStyle:$('#controller-choice').classList.contains('apps-ui'),font:getComputedStyle($('#controller-choice-title')).fontFamily,gameFont:getComputedStyle($('#editor-heading')).fontFamily};
   closeControllerChoice();return result;
  });
  assert.equal(gameChooser.appStyle,false,'shared chooser clears Apps styling on return to Games');
  assert.equal(gameChooser.font,gameChooser.gameFont,'Games chooser retains selected font');
 }
 for(const mode of await page.evaluate(()=>[...$('#presentation').options].map(o=>o.value))){
  await page.evaluate(mode=>{setPresentation(mode);setTypography('ibmvga')},mode);
  assert.ok((await page.locator('.apps-heading h2').evaluate(n=>getComputedStyle(n).fontFamily)).includes('WayfinderClean'),'Apps header isolated in '+mode);
 }
 await page.evaluate(()=>{setPresentation('library');setTypography('clean')});
 assert.equal(await page.locator('#drawer-status').isVisible(),false,'overview has no explanatory line');
 for(const viewport of [{width:1097,height:592},{width:640,height:360}]){
  await page.setViewportSize(viewport);
  const fit=await page.evaluate(()=>{const cards=$('#app-sections').getBoundingClientRect(),dock=$('#app-dock').getBoundingClientRect(),hints=$('.apps-controller-hints').getBoundingClientRect();return {cards:cards.bottom<=dock.top,hints:dock.bottom<=hints.top,overflow:$('#apps-drawer').scrollWidth>$('#apps-drawer').clientWidth+1};});
  assert.deepEqual(fit,{cards:true,hints:true,overflow:false},JSON.stringify(viewport));
 }
 await page.setViewportSize({width:1097,height:592});
 const bars=await page.evaluate(async()=>{const results=[];native.setThemeColor=color=>window.barColor=color;const hex=node=>'#'+getComputedStyle(node,node.id==='apps-drawer'?'::backdrop':null).backgroundColor.match(/\d+/g).slice(0,3).map(v=>Number(v).toString(16).padStart(2,'0')).join('');for(const p of ['parchment','midnight','pearl']){setPalette(p);results.push(barColor===hex($('#apps-drawer')));showDialog('#app-appearance');hideDialog('#app-appearance');results.push(barColor===hex($('#apps-drawer')));hideDialog('#apps-drawer');results.push(barColor===hex(document.body));openApps();results.push(barColor===hex($('#apps-drawer')));$('#apps-drawer').close();await new Promise(r=>setTimeout(r,30));results.push(barColor===hex(document.body));openApps();}hideDialog('#apps-drawer');openApps();await new Promise(r=>setTimeout(r,30));results.push(barColor===hex($('#apps-drawer')));setPalette('portal');return results});
 await page.evaluate(()=>{setPalette('pearl');openApps()});
 assert.equal(await page.locator('#apps-drawer').evaluate(n=>getComputedStyle(n).backgroundColor),'rgb(237, 243, 250)');
 for(const selector of ['#app-appearance','#pack-icon-picker'])assert.equal(await page.locator(selector).evaluate(n=>getComputedStyle(n).getPropertyValue('--bg').trim()),'#edf3fa');
 await page.evaluate(()=>setPalette('portal'));
 assert.ok(bars.every(Boolean),'system bars follow Apps surface, palette changes, nested dialogs, close and immediate reopen');
 assert.deepEqual(await page.evaluate(()=>['Beeper','Reddit','Telegram','WhatsApp','Signal','Discord'].map(title=>appSection({title,package:'test.social'}))),Array(6).fill('social'));
 assert.equal(await page.evaluate(()=>{drawerPreferences.push({package:'test.manual',section:'news'});return appSection({title:'Reddit',package:'test.manual'})}),'news');
 assert.equal(await page.locator('#app-dock .drawer-app').count(),8);
 await page.locator('[data-section="tools"]').click();
 assert.equal(await page.locator('#drawer-grid .drawer-app').count(),65,'category has every app');
 assert.equal(await page.locator('#drawer-status').isVisible(),true,'expanded section retains status');
 await page.evaluate(()=>{window.categoryFocusEvents=[];document.addEventListener('focusin',e=>categoryFocusEvents.push(e.target.id));appsController('down');appsController('pageDown');nativeBack()});
 assert.ok(!(await page.evaluate(()=>categoryFocusEvents)).includes('drawer-search'),'Back must not briefly focus Search and open the keyboard');
 await page.evaluate(()=>{categoryFocusEvents=[];for(let i=0;i<5;i++){document.querySelector('[data-section=tools]').click();nativeBack()}});
 assert.ok(!(await page.evaluate(()=>categoryFocusEvents)).includes('drawer-search'),'repeated enter/back avoids transient search focus');
 assert.equal(await page.evaluate(()=>drawerSection),'');assert.equal(await page.evaluate(()=>document.activeElement.dataset.section),'tools');
 await page.evaluate(()=>appsController('down'));assert.ok(await page.evaluate(()=>!!document.activeElement.closest('#app-dock')));
 await page.evaluate(()=>appsController('up'));assert.equal(await page.evaluate(()=>document.activeElement.dataset.section),'tools');
 await page.locator('#app-dock .drawer-app').first().click();assert.equal(await page.evaluate(()=>launched),'test.app0');
 await page.evaluate(()=>editDrawerApp('test.app0'));await page.locator('#appearance-section').selectOption('news');await page.locator('#appearance-section-hidden').check();await page.locator('#app-appearance-form').evaluate(f=>f.requestSubmit());
 assert.equal(await page.evaluate(()=>window.appSaved.at(-1).section),'news');assert.equal(await page.evaluate(()=>window.appSaved.at(-1).hideFromSections),true);
 await page.locator('#drawer-search').fill('Utility 0');assert.equal(await page.locator('#drawer-grid .drawer-app').count(),1,'hidden section app remains searchable');
 await page.locator('#drawer-search').fill('');await page.locator('[data-drawer-view="all"]').click();assert.equal(await page.locator('#drawer-grid .drawer-app').count(),48);await page.locator('#drawer-next').click();assert.equal(await page.locator('#drawer-grid .drawer-app').count(),17);
 await page.locator('[data-drawer-view="home"]').click();if(process.env.APPS_SCREENSHOT)await page.screenshot({path:process.env.APPS_SCREENSHOT});
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

 // Installed labels may be abbreviations; library names are search aliases.
 await page.evaluate(()=>{drawerCatalog=[{package:'test.mc3',title:'MC3'},{package:'test.mc4',title:'MC4'},{package:'test.tool',title:'Modern tool'}];games=[{id:'mc3',package:'test.mc3',kind:'app',title:'Modern Combat 3'},{id:'mc4',package:'test.mc4',kind:'app',title:'Modern Combat 4'}];drawerPreferences=[];drawerView='all';$('#drawer-letter').value='';$('#drawer-search').value='Modern';renderDrawer()});
 assert.equal(await page.evaluate(()=>drawerFiltered.length),3);
 assert.equal(await page.evaluate(()=>drawerName(drawerCatalog[0])),'MC3','alias does not rename installed apps');
 await page.evaluate(()=>{drawerView='other';renderDrawer()});assert.deepEqual(await page.evaluate(()=>drawerFiltered.map(a=>a.package)),['test.tool']);
 await page.evaluate(()=>{drawerView='all';$('#drawer-search').value='MC4';renderDrawer()});assert.deepEqual(await page.evaluate(()=>drawerFiltered.map(a=>a.package)),['test.mc4']);
 await page.evaluate(()=>{$('#drawer-search').value='Modern Combat 4';games[1].title='Renamed game';renderDrawer()});assert.equal(await page.evaluate(()=>drawerFiltered.length),0,'aliases refresh after library edits');
 assert.deepEqual(errors,[]);console.log('PASS: categories, full contents, controller Back/dock navigation, launch, saved assignments, hidden app search and All apps pagination');
 }finally{await browser.close();await new Promise(r=>server.close(r));}
})().catch(error=>{console.error(error);process.exitCode=1});
