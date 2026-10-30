const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),http=require('node:http');
const {chromium}=require('playwright');
const root=path.resolve(__dirname,'../app/src/main/assets/www'),out=path.resolve(__dirname,'../output/sedona-audit');fs.mkdirSync(out,{recursive:true});
const fixture=Array.from({length:1200},(_,i)=>({id:'g'+i,title:i===0?'Monument Valley':'Title '+String(i).padStart(4,'0'),genre:['Puzzles','Story adventures','Racing','A very long user category name that must remain usable'][i%4],image:'audit.svg',package:'test.app',kind:'app',favorite:i<3}));
(async()=>{
 const server=http.createServer((req,res)=>{const url=new URL(req.url,'http://localhost').pathname;
 if(url==='/audit.svg'){res.setHeader('Content-Type','image/svg+xml');return res.end('<svg xmlns="http://www.w3.org/2000/svg" width="600" height="900"><rect width="600" height="900" fill="#367c83"/><circle cx="300" cy="350" r="180" fill="#f4b5c2"/><text x="300" y="750" text-anchor="middle" font-size="50">MONUMENT VALLEY</text></svg>')}
 if(url==='/games.js'){res.setHeader('Content-Type','application/javascript');return res.end('window.GAMES='+JSON.stringify(fixture))}
 try{const file=path.join(root,url==='/'?'index.html':url);res.setHeader('Content-Type',file.endsWith('.js')?'application/javascript':file.endsWith('.css')?'text/css':file.endsWith('.ttf')?'font/ttf':file.endsWith('.svg')?'image/svg+xml':'text/html');res.end(fs.readFileSync(file))}catch{res.statusCode=404;res.end()}});
 await new Promise(r=>server.listen(0,'127.0.0.1',r));const browser=await chromium.launch({channel:'msedge',headless:true}),errors=[];
 try{const page=await browser.newPage({viewport:{width:1097,height:592},hasTouch:true});page.on('pageerror',e=>errors.push(e.message));
 await page.addInitScript(g=>{window.auditGames=g;window.Portal={view:()=>localStorage.getItem('view')||'{}',saveView:v=>localStorage.setItem('view',v),library:()=>JSON.stringify(auditGames),sound:()=>{},hideKeyboard:()=>window.keyboardDismissals=(window.keyboardDismissals||0)+1,setThemeColor:c=>window.themeColor=c,appsPreferences:()=>'[]',launch:id=>window.launched=id,favorite:(id,on)=>{auditGames.find(g=>g.id===id).favorite=on;return '{"ok":true}'}}},fixture);
 await page.goto('http://127.0.0.1:'+server.address().port);await page.waitForFunction(()=>typeof restoring!=='undefined'&&!restoring);
 await page.evaluate(()=>{applyAppearanceValues(builtinAppearancePresets.find(p=>p.name==='Full House').values);query='';genre='';update()});
 const check=()=>page.evaluate(()=>{const bounds=$('#grid').getBoundingClientRect();return [...document.querySelectorAll('#grid .game')].map(n=>{const r=n.getBoundingClientRect();return {id:n.dataset.id,inside:r.left>=bounds.left-1&&r.right<=bounds.right+1&&r.top>=bounds.top-1&&r.bottom<=bounds.bottom+1}})});
 for(const size of [{width:1097,height:592},{width:800,height:450},{width:1024,height:768}]){
  await page.setViewportSize(size);await page.waitForTimeout(200);
  for(let i=0;i<12;i++){await page.evaluate(i=>{presentationId=copenhagenIds[i];renderCopenhagen()},i);for(const delay of [0,45,80]){await page.waitForTimeout(delay);assert.ok((await check()).every(r=>r.inside),'selection stays inside table')}}
  const first=page.locator('#grid .game').first(),r=await first.boundingBox();
  await page.mouse.move(r.x+r.width/2,r.y+r.height/2);await page.mouse.down();await page.mouse.move(r.x+r.width/2+20,r.y+r.height/2+20);await page.waitForTimeout(30);
  await page.mouse.move(0,0);await page.waitForTimeout(30);assert.ok((await check()).every(r=>r.inside),'drag bounded at upper left');
  await page.mouse.move(size.width,size.height);await page.waitForTimeout(30);assert.ok((await check()).every(r=>r.inside),'drag bounded at lower right');
  await page.mouse.up();await page.waitForTimeout(220);assert.equal(await page.locator('.copenhagen-dragging').count(),0);
 }
 const before=await page.evaluate(()=>copenhagenIds.slice());
 const a=await page.locator('#grid .game').nth(0).boundingBox(),b=await page.locator('#grid .game').nth(1).boundingBox();
 await page.mouse.move(a.x+a.width/2,a.y+a.height/2);await page.mouse.down();await page.mouse.move(b.x+b.width/2,b.y+b.height/2,{steps:5});await page.mouse.up();await page.waitForTimeout(250);
 assert.deepEqual(await page.evaluate(()=>copenhagenIds.slice(0,2)),[before[1],before[0]],'drag swaps the two slots');
 await page.evaluate(()=>{copenhagenShuffle();controller('right');copenhagenShuffle();controller('left')});await page.waitForTimeout(250);assert.equal(await page.locator('#grid').evaluate(n=>n.getAnimations({subtree:true}).length),0,'deal animations settle');
 await page.emulateMedia({reducedMotion:'reduce'});await page.waitForTimeout(30);
 assert.ok(await page.locator('#grid .game').evaluateAll(ns=>ns.every(n=>getComputedStyle(n).transform==='none')),'reduced motion disables lift/tilt');
 await page.evaluate(()=>{setPresentation('bellevue');showcaseOpen(2)});assert.equal(await page.locator('#blade-glint').evaluate(n=>n.getAnimations().length),0,'reduced motion disables glint');
 await page.emulateMedia({reducedMotion:'no-preference'});
 await page.evaluate(()=>showcaseOpen(3));assert.equal(await page.locator('#blade-glint').evaluate(n=>n.getAnimations().length),1,'category switch plays glint');
 await page.evaluate(()=>{showcaseSelect(1);showcaseSelect(2)});assert.equal(await page.locator('#blade-glint').evaluate(n=>n.getAnimations().length),1,'game navigation does not stack glints');
 await page.evaluate(()=>{showcaseOpen(2);showcaseOpen(3);showcaseOpen(2)});assert.equal(await page.locator('#blade-glint').evaluate(n=>n.getAnimations().length),1);
 await page.waitForFunction(()=>$('#blade-glint').getAnimations().length===0,{},{timeout:2000});
 await page.evaluate(()=>{showcaseOpen(3);showDialog('#settings-dialog')});assert.equal(await page.locator('#blade-glint').evaluate(n=>n.getAnimations().length),0,'dialog cancels glint');await page.evaluate(()=>hideDialog('#settings-dialog'));
 await page.evaluate(()=>{showcaseOpen(2);window.auditGlint=$('#blade-glint').getAnimations()[0]});await page.emulateMedia({reducedMotion:'reduce'});await page.waitForFunction(()=>auditGlint.playState==='idle',{},{timeout:1500});
 await page.emulateMedia({reducedMotion:'no-preference'});await page.evaluate(()=>{setPresentation('copenhagen');copenhagenShuffle();onNativePause()});assert.equal(await page.locator('#grid').evaluate(n=>n.getAnimations({subtree:true}).length),0,'backgrounding cancels card movement');await page.evaluate(()=>onNativeResume());
 assert.deepEqual(errors,[]);console.log('PASS table/blades motion: in-flight bounds, dragging, rapid deal/navigation, reduced motion, single glint and cleanup');
 }finally{await browser.close();await new Promise(r=>server.close(r));}
})().catch(e=>{console.error(e);process.exitCode=1});
