const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),http=require('node:http');
const {chromium}=require('playwright');
const root=path.resolve(__dirname,'../app/src/main/assets/www'),out=path.resolve(__dirname,'../output/hongkong-audit');fs.mkdirSync(out,{recursive:true});
const fixture=Array.from({length:60},(_,i)=>({id:'g'+i,title:i===0?'Monument Valley':i===1?'Arkanoid vs Space Invaders':i===2?'Masks of Glory (Atomic Pinball)':'Title '+String(i).padStart(4,'0'),genre:['Puzzles','Story adventures','Racing','A very long user category name that must remain usable'][i%4],image:'audit.svg',package:'test.app',kind:'app',favorite:i<60,lastPlayed:Date.now()-i*1000}));
(async()=>{
 const server=http.createServer((req,res)=>{const url=new URL(req.url,'http://localhost').pathname;
 if(url==='/audit.svg'){res.setHeader('Content-Type','image/svg+xml');return res.end('<svg xmlns="http://www.w3.org/2000/svg" width="600" height="900"><rect width="600" height="900" fill="#367c83"/><circle cx="300" cy="350" r="180" fill="#f4b5c2"/><text x="300" y="750" text-anchor="middle" font-size="50">MONUMENT VALLEY</text></svg>')}
 if(url==='/games.js'){res.setHeader('Content-Type','application/javascript');return res.end('window.GAMES='+JSON.stringify(fixture))}
 try{const file=path.join(root,url==='/'?'index.html':url);res.setHeader('Content-Type',file.endsWith('.js')?'application/javascript':file.endsWith('.css')?'text/css':file.endsWith('.ttf')?'font/ttf':file.endsWith('.svg')?'image/svg+xml':'text/html');res.end(fs.readFileSync(file))}catch{res.statusCode=404;res.end()}});
 await new Promise(r=>server.listen(0,'127.0.0.1',r));const browser=await chromium.launch({channel:'msedge',headless:true}),errors=[];
 try{const page=await browser.newPage({viewport:{width:1097,height:592}});page.on('pageerror',e=>errors.push(e.message));
 await page.addInitScript(g=>{window.auditGames=g;window.Portal={view:()=>localStorage.getItem('view')||'{}',saveView:v=>localStorage.setItem('view',v),library:()=>JSON.stringify(auditGames),sound:()=>{},hideKeyboard:()=>window.keyboardDismissals=(window.keyboardDismissals||0)+1,setThemeColor:c=>window.themeColor=c,appsPreferences:()=>'[]',launch:id=>window.launched=id,favorite:(id,on)=>{auditGames.find(g=>g.id===id).favorite=on;return '{"ok":true}'}}},fixture);
 await page.goto('http://127.0.0.1:'+server.address().port);await page.waitForFunction(()=>typeof restoring!=='undefined'&&!restoring);




 const modes=['manhattan','bend','florence','brussels','rochester'];
 for(const mode of modes){
  await page.evaluate(mode=>{leaveControllerControls();query='';genre='';favoritesOnly=false;applyAppearanceValues(builtinAppearancePresets.find(p=>p.values.presentation===mode).values);update();focusStartupGame()},mode);
  await page.waitForTimeout(150);
  const before=await page.evaluate(()=>presentationId);
  for(const action of ['menu','apps','edit']){
   await page.evaluate(action=>controller(action),action);assert.ok(await page.evaluate(()=>!!topDialog()),mode+' '+action);
   await page.evaluate(()=>window.nativeBack());
   assert.equal(await page.evaluate(()=>presentation),mode);assert.equal(await page.evaluate(()=>presentationId),before,mode+' selection restored after '+action);
   assert.ok(await page.evaluate(()=>!topDialog()));
  }
  await page.evaluate(()=>{showDialog('#settings-dialog');updateAppearancePreview()});await page.waitForTimeout(150);
  if(mode==='rochester'){
   const radii=await page.evaluate(()=>({actual:getComputedStyle($('#grid .presentation-selected .cover')).borderRadius,preview:getComputedStyle($('.appearance-sample')).borderRadius}));assert.equal(radii.preview,radii.actual,'preview preserves rounded mount');
  }
  await page.evaluate(()=>hideDialog('#settings-dialog'));
  await page.evaluate(()=>{controller('search');$('#search').value='zznoresults';query=$('#search').value;update()});
  assert.ok(await page.locator('.search-empty').isVisible(),mode+' empty search');
  await page.evaluate(()=>window.nativeBack());assert.equal(await page.evaluate(()=>query),'');
  for(const other of modes.filter(x=>x!==mode)){
   await page.evaluate(other=>setPresentation(other),other);
   assert.equal(await page.locator('#'+mode+'-tabs').isVisible(),false,mode+' tabs hidden in '+other);
   await page.evaluate(mode=>setPresentation(mode),mode);
   assert.ok(await page.locator('#'+mode+'-tabs').isVisible());
  }
  await page.evaluate(()=>{query='';genre='';favoritesOnly=false;update();focusStartupGame();controller('up');controller('down')});
  assert.ok(await page.evaluate(()=>document.activeElement.closest('#grid')),mode+' category-to-game focus');
  console.log('PASS interactions '+mode);
 }
 await page.evaluate(()=>{setPresentation('rochester');document.body.dataset.input='controller';controller('controls');focusControllerControl($('#rochester-tabs .current'))});
 assert.equal(await page.locator('#rochester-tabs .current').evaluate(e=>getComputedStyle(e).outlineStyle),'none','R3 uses shaped focus');
 assert.deepEqual(errors,[]);
 }finally{await browser.close();await new Promise(r=>server.close(r))}
})().catch(e=>{console.error(e);process.exit(1)});
