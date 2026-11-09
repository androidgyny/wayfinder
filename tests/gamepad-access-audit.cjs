const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),http=require('node:http');

const {chromium}=require('playwright');

const root=path.resolve(__dirname,'../app/src/main/assets/www'),out=path.resolve(__dirname,'../output/hongkong-audit');fs.mkdirSync(out,{recursive:true});

const fixture=Array.from({length:60},(_,i)=>({id:'g'+i,title:i===0?'Monument Valley':'Title '+String(i).padStart(4,'0'),genre:['Puzzles','Story adventures','Racing','A very long user category name that must remain usable'][i%4],image:'audit.svg',package:'test.app',kind:'app',favorite:i<60,lastPlayed:Date.now()-i*1000}));

(async()=>{

 const server=http.createServer((req,res)=>{const url=new URL(req.url,'http://localhost').pathname;

 if(url==='/audit.svg'||url.startsWith('/icon/')||url.startsWith('/art-icon/')){res.setHeader('Content-Type','image/svg+xml');return res.end('<svg xmlns="http://www.w3.org/2000/svg" width="600" height="900"><rect width="600" height="900" fill="#367c83"/><circle cx="300" cy="350" r="180" fill="#f4b5c2"/><text x="300" y="750" text-anchor="middle" font-size="50">MONUMENT VALLEY</text></svg>')}

 if(url==='/games.js'){res.setHeader('Content-Type','application/javascript');return res.end('window.GAMES='+JSON.stringify(fixture))}

 try{const file=path.join(root,url==='/'?'index.html':url);res.setHeader('Content-Type',file.endsWith('.js')?'application/javascript':file.endsWith('.css')?'text/css':file.endsWith('.ttf')?'font/ttf':file.endsWith('.svg')?'image/svg+xml':'text/html');res.end(fs.readFileSync(file))}catch{res.statusCode=404;res.end()}});

 await new Promise(r=>server.listen(0,'127.0.0.1',r));const browser=await chromium.launch({channel:'msedge',headless:true}),errors=[];

 try{const page=await browser.newPage({viewport:{width:1097,height:592}});page.on('pageerror',e=>errors.push(e.message));

 await page.addInitScript(g=>{window.auditGames=g;window.Portal={view:()=>localStorage.getItem('view')||'{}',saveView:v=>localStorage.setItem('view',v),library:()=>JSON.stringify(auditGames),sound:()=>{},hideKeyboard:()=>window.keyboardDismissals=(window.keyboardDismissals||0)+1,setThemeColor:c=>window.themeColor=c,appsPreferences:()=>'[]',installed:()=>{},launch:id=>window.launched=id,favorite:(id,on)=>{auditGames.find(g=>g.id===id).favorite=on;return '{"ok":true}'}}},fixture);

 await page.goto('http://127.0.0.1:'+server.address().port);await page.waitForFunction(()=>typeof restoring!=='undefined'&&!restoring);






 const modes=await page.evaluate(()=>[...$('#presentation').options].map(o=>o.value));
 async function controlsTo(selector){
  await page.evaluate(()=>controller('controls'));
  for(let i=0;i<250;i++){
   if(await page.evaluate(s=>document.activeElement?.matches(s),selector))return;
   await page.evaluate(()=>controller('down'));
  }
  throw Error('Unreachable control '+selector+' in '+await page.evaluate(()=>presentation));
 }
 for(const mode of modes){
  await page.reload();await page.waitForFunction(()=>typeof restoring!=='undefined'&&!restoring);
  await page.evaluate(mode=>{setPresentation(mode);query='';genre='';favoritesOnly=false;update();focusStartupGame()},mode);
  if(mode==='ulm'){await page.evaluate(()=>controller('menu'));await controlsTo('#ulm-menu-add-game');}else await controlsTo('#add-game');
  await page.evaluate(()=>controller('activate'));
  assert.equal(await page.evaluate(()=>topDialog()?.id),'app-picker',mode+' add game');
  await page.evaluate(()=>nativeEvent('installed',{apps:[{title:'New audit game',package:'new.audit',component:'new.audit/.MainActivity',isGame:true}]}));
  await controlsTo('.installed-app');await page.evaluate(()=>controller('activate'));
  assert.equal(await page.evaluate(()=>topDialog()?.id),'editor',mode+' add editor');
  await controlsTo('#category-options');await page.evaluate(()=>controller('activate'));
  assert.ok(await page.evaluate(()=>!!controllerChoice),mode+' category dropdown');
  await page.evaluate(()=>{controller('down');controller('activate')});
  assert.equal(await page.evaluate(()=>!!controllerChoice),false);
  const editorControls=await page.evaluate(()=>dialogControls(topDialog()).map(n=>n.id).filter(Boolean));
  for(const target of ['edit-title','edit-genre','change-target','choose-cover','close-editor'])if(editorControls.includes(target)){
   await controlsTo('#'+target);await page.evaluate(()=>controller('controls'));
  }
  await page.evaluate(()=>controller('back'));
  // Closing editor returns to picker; close any remaining modal with B.
  for(let i=0;i<4&&await page.evaluate(()=>!!topDialog());i++)await page.evaluate(()=>controller('back'));
  await page.evaluate(()=>controller('menu'));
  if(await page.evaluate(()=>topDialog()?.id==='ulm-menu')){await controlsTo('#ulm-menu-settings');await page.evaluate(()=>controller('activate'));}
  assert.equal(await page.evaluate(()=>topDialog()?.id),'settings-dialog',mode+' settings');
  await controlsTo('#settings-nav-library');await page.evaluate(()=>controller('activate'));
  await controlsTo('#settings-add-game');await page.evaluate(()=>controller('activate'));
  assert.equal(await page.evaluate(()=>topDialog()?.id),'app-picker',mode+' settings add game');
  await page.evaluate(()=>controller('back'));
  await page.evaluate(()=>controller('apps'));
  assert.equal(await page.evaluate(()=>topDialog()?.id),'apps-drawer',mode+' apps');
  await controlsTo('#android-settings');await page.evaluate(()=>controller('controls'));await page.evaluate(()=>controller('apps'));
  assert.equal(await page.evaluate(()=>!!topDialog()),false);
  await page.evaluate(()=>controller('search'));
  assert.ok(await page.evaluate(()=>document.activeElement?.matches('input[type=search]')),mode+' search');
  await page.evaluate(()=>controller('back'));
  console.log('PASS gamepad access '+mode);
 }
 await page.evaluate(()=>{setPresentation('manhattan');genre='Puzzles';query='';update();manhattanSelect(0);controller('up');controller('up')});
 assert.equal(await page.evaluate(()=>document.activeElement.id),'open-apps','Up from categories reaches header');
 await page.evaluate(()=>controller('right'));assert.equal(await page.evaluate(()=>document.activeElement.id),'add-game');
 await page.evaluate(()=>controller('right'));assert.equal(await page.evaluate(()=>document.activeElement.id),'settings-button');
 await page.evaluate(()=>controller('down'));assert.ok(await page.evaluate(()=>!!document.activeElement.closest('#manhattan-tabs')),'Down returns to categories');

 await controlsTo('#manhattan-footer .manhattan-hint:nth-child(2)');
 assert.ok(await page.locator('#manhattan-footer .manhattan-hint:nth-child(2)').evaluate(e=>{const s=getComputedStyle(e);return parseFloat(s.paddingLeft)+parseFloat(s.outlineOffset)>=6&&parseFloat(s.paddingRight)+parseFloat(s.outlineOffset)>=6}),'compact hint outline leaves breathing room around its icon and text');
 await page.screenshot({path:'output/gamepad-focus-browser.png'});
 await page.evaluate(()=>controller('back'));
 // Nested artwork controls: reach crop sliders and apply/cancel without pointer events.
 await page.evaluate(()=>{controller('controls')});
 // Leave control navigation if the previous test did not enter it.
 await page.evaluate(()=>leaveControllerControls());
 await controlsTo('#add-game');await page.evaluate(()=>controller('activate'));
 await page.evaluate(()=>nativeEvent('installed',{apps:[{title:'New audit game',package:'new.audit',component:'new.audit/.MainActivity',isGame:true}]}));
 await controlsTo('.installed-app');await page.evaluate(()=>controller('activate'));
 await controlsTo('#choose-cover');await page.evaluate(()=>controller('activate'));
 assert.equal(await page.evaluate(()=>topDialog()?.id),'artwork-dialog');
 await controlsTo('[data-artwork-mode="fill"]');await page.evaluate(()=>controller('activate'));
 await controlsTo('#artwork-x');await page.evaluate(()=>controller('activate'));
 const cropBefore=await page.locator('#artwork-x').inputValue();await page.evaluate(()=>controller('right'));
 assert.notEqual(await page.locator('#artwork-x').inputValue(),cropBefore,'crop slider works with D-pad');
 await controlsTo('#artwork-y');await page.evaluate(()=>controller('activate'));
 await controlsTo('#artwork-use');await page.evaluate(()=>controller('controls'));
 await page.evaluate(()=>controller('back'));assert.equal(await page.evaluate(()=>topDialog()?.id),'editor');
 await controlsTo('#edit-form button[type=submit]');await page.evaluate(()=>controller('controls'));
 await page.evaluate(()=>controller('back'));

 await page.evaluate(()=>{for(const d of document.querySelectorAll('dialog[open]'))hideDialog('#'+d.id);drawerCatalog=[{package:'audit.tools',title:'Audit tool',image:'audit.svg',isGame:false}];controller('apps');controller('genrePrev')});
 await controlsTo('.drawer-edit');await page.evaluate(()=>controller('activate'));
 assert.equal(await page.evaluate(()=>topDialog()?.id),'app-appearance');
 for(const target of ['appearance-name','appearance-section','appearance-pinned','appearance-order','appearance-choose']){
  if(await page.locator('#'+target).isVisible()&&await page.locator('#'+target).isEnabled()){await controlsTo('#'+target);await page.evaluate(()=>controller('controls'));}
 }
 await page.evaluate(()=>controller('back'));await page.evaluate(()=>controller('apps'));
 // Every settings section retains a controller route into its current panel.
 await page.evaluate(()=>controller('menu'));
 for(const section of ['appearance','library','apps','sound','system']){
  await controlsTo('#settings-nav-'+section);await page.evaluate(()=>controller('activate'));
  const expected=await page.evaluate(()=>dialogControls(settingsActivePanel()).map(n=>n.id).filter(Boolean));
  await page.evaluate(()=>controller('controls'));
  const visited=new Set();
  for(let i=0;i<expected.length+4;i++){visited.add(await page.evaluate(()=>document.activeElement.id));await page.evaluate(()=>controller('down'));}
  assert.ok(expected.every(id=>visited.has(id)),section+' settings controls all reachable');
  await page.evaluate(()=>controller('controls'));
 }
 await page.evaluate(()=>{controller('back');controller('back')});
 // Root controls remain accessible with no library entries.
 for(const mode of modes){
  await page.evaluate(mode=>{games=[];rebuildGenres();query='';genre='';setPresentation(mode);update();focusStartupGame()},mode);
  if(mode==='ulm'){await page.evaluate(()=>controller('menu'));await controlsTo('#ulm-menu-add-game');}else await controlsTo('#add-game');
  await page.evaluate(()=>controller('activate'));assert.equal(await page.evaluate(()=>topDialog()?.id),'app-picker',mode+' empty library add');
  await page.evaluate(()=>controller('back'));
 }
 console.log('PASS nested artwork, Apps editing, all settings panels, and empty libraries');
 assert.deepEqual(errors,[]);
 }finally{await browser.close();server.close();}
})().catch(e=>{console.error(e);process.exitCode=1});
