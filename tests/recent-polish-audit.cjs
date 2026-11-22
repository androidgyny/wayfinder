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
  await page.evaluate(mode=>{query='';genre='';favoritesOnly=false;applyAppearanceValues(builtinAppearancePresets.find(p=>p.values.presentation===mode).values);update()},mode);
  await page.waitForTimeout(350);
  await page.evaluate(mode=>{if(mode==='manhattan'){manhattanOpen(2)}else window[mode+'Select'](2)},mode);
  await page.waitForTimeout(155);
  const effect=await page.evaluate(()=>({layers:document.querySelectorAll('.recent-polish-layer').length,animations:document.getAnimations().filter(a=>a.id==='recent-layout-polish'||a.animationName==='comic-pointer-nudge').length}));
  if(mode==='rochester'){const light=await page.evaluate(()=>{const cover=document.querySelector('#grid .presentation-selected .cover'),light=cover.querySelector('.rochester-selection-light');return {transform:getComputedStyle(cover).transform,opacity:Number(getComputedStyle(light).opacity),pointer:getComputedStyle(light).pointerEvents,layers:cover.querySelectorAll('.rochester-selection-light').length}});assert.equal(light.transform,'none');assert.equal(light.layers,1);assert.equal(light.pointer,'none');assert.ok(light.opacity>.9);}
  if(mode==='bend'){
   const sheen=await page.evaluate(()=>{const n=document.querySelector('#grid .presentation-selected .bend-sleeve-reflection'),c=n.parentElement,a=n.getBoundingClientRect(),b=c.getBoundingClientRect();return {width:a.width,coverWidth:b.width,left:a.left-b.left,transform:getComputedStyle(n).transform,pointer:getComputedStyle(n).pointerEvents,count:c.querySelectorAll('.bend-sleeve-reflection').length}});
   assert.ok(sheen.width<=16.1&&sheen.width<sheen.coverWidth*.10);assert.equal(sheen.transform,'none');assert.equal(sheen.pointer,'none');assert.equal(sheen.count,1);
  }
  assert.ok(['florence','bend','rochester'].includes(mode)||effect.layers||effect.animations,mode+' effect appears '+JSON.stringify(effect));
  await page.waitForTimeout(350);
  assert.equal(await page.locator('.recent-polish-layer').count(),0,mode+' cleanup');
  await page.evaluate(mode=>{for(let i=0;i<18;i++)if(mode==='manhattan')manhattanOpen(i%3);else window[mode+'Select'](i)},mode);
  assert.equal(await page.locator('.recent-polish-layer').count(),0,mode+' held navigation does not flash');
  await page.evaluate(()=>showDialog('#settings-dialog'));await page.waitForTimeout(350);
  assert.equal(await page.locator('.recent-polish-layer').count(),0,mode+' dialog cancels');await page.evaluate(()=>nativeBack());
  if(mode==='bend'){await page.evaluate(()=>{window.launched=null;play(presentationId)});assert.equal(await page.evaluate(()=>window.launched),await page.evaluate(()=>presentationId),'Bend launches immediately');}
  if(mode==='brussels'){
   await page.evaluate(()=>{window.launched=null;play(presentationId);play(presentationId)});await page.waitForTimeout(240);
   assert.ok(await page.evaluate(()=>window.launched),'launch delivered '+mode);
   await page.evaluate(()=>{window.launched=null;play(presentationId);showDialog('#settings-dialog')});await page.waitForTimeout(240);
   assert.equal(await page.evaluate(()=>window.launched),null,'dialog cancels queued launch');await page.evaluate(()=>nativeBack());
  }
  await page.emulateMedia({reducedMotion:'reduce'});
  await page.evaluate(mode=>{if(mode==='manhattan')manhattanOpen(1);else window[mode+'Select'](1)},mode);await page.waitForTimeout(155);
  assert.equal(await page.locator('.recent-polish-layer').count(),0,mode+' reduced motion');await page.emulateMedia({reducedMotion:'no-preference'});
  await page.screenshot({path:path.resolve(out,'polish-'+mode+'.png')});
  console.log('PASS polish lifecycle '+mode);
 }
 assert.deepEqual(errors,[]);
 }finally{await browser.close();await new Promise(r=>server.close(r));}
})().catch(e=>{console.error(e);process.exitCode=1});
