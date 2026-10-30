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
 const targets={sedona:'#sedona-track-next',atlantis:'#atlantis-favorite',redmond:'#redmond-favorite',paloalto:'#paloalto-next'};
 for(const [layout,selector] of Object.entries(targets)){
  await page.evaluate(layout=>{applyAppearanceValues(builtinAppearancePresets.find(p=>p.values.presentation===layout).values);query='';genre='';favoritesOnly=false;update()},layout);
  const result=await page.evaluate(selector=>{
   const b=$(selector);if(!b)throw Error('Missing button '+selector);
   const face=b.closest('#sedona-transport')?b.querySelector('b'):b;
   window.pressTestFace=face;window.pressTestButton=b;window.pressActionCount=0;b.onclick=()=>window.pressActionCount++;
   b.dispatchEvent(new PointerEvent('pointerdown',{bubbles:true,button:0,isPrimary:true,pointerType:'touch'}));
   const first=face.getAnimations()[0];b.dispatchEvent(new MouseEvent('click',{bubbles:true,detail:1}));
   return {count:face.getAnimations().length,same:face.getAnimations()[0]===first,action:window.pressActionCount,duration:first?.effect.getTiming().duration};
  },selector);
  assert.deepEqual(result,{count:1,same:true,action:1,duration:130},layout+' one pulse, immediate action');
  await page.waitForFunction(()=>pressTestFace.getAnimations().length===0,null,{timeout:1000});
  assert.equal(await page.evaluate(()=>pressTestFace.getAnimations().length),0,layout+' effect clears');
  assert.equal(await page.evaluate(()=>{pressTestButton.focus();controller('activate');return pressTestFace.getAnimations().length}),1,layout+' controller activation');
  await page.waitForFunction(()=>pressTestFace.getAnimations().length===0,null,{timeout:1000});
  assert.equal(await page.evaluate(()=>{pressTestButton.disabled=true;pressTestButton.dispatchEvent(new MouseEvent('click',{bubbles:true}));return pressTestFace.getAnimations().length}),0,layout+' disabled control');
  await page.evaluate(()=>pressTestButton.disabled=false);
 }
 for(const layout of ['sedona','atlantis']){
  await page.evaluate(layout=>{
   setPresentation(layout);const b=$(layout==='sedona'?'#sedona-track-next':'#atlantis-favorite');b.onclick=()=>{};
   const face=layout==='sedona'?b.querySelector('b'):b;window.glowFace=face;window.glowPosition=face.style.position;
   for(let i=0;i<8;i++)b.dispatchEvent(new PointerEvent('pointerdown',{bubbles:true,button:0,isPrimary:true}));
   if(face.querySelectorAll('.button-lamp').length!==1)throw Error('Repeated presses stack glows');
   b.dispatchEvent(new PointerEvent('pointercancel',{bubbles:true}));
  },layout);
  await page.waitForTimeout(30);
  assert.equal(await page.evaluate(()=>glowFace.querySelectorAll('.button-lamp').length),0,'cancel clears glow');
  assert.equal(await page.evaluate(()=>glowFace.style.position===glowPosition),true,'press restores inline positioning');
 }
 await page.evaluate(()=>setPresentation('paloalto'));
 await page.emulateMedia({reducedMotion:'reduce'});
 assert.equal(await page.evaluate(()=>{pressTestButton.click();const keys=pressTestFace.getAnimations()[0].effect.getKeyframes();return keys.every(k=>k.transform===keys[0].transform)}),true,'reduced motion avoids displacement');
 await page.waitForTimeout(160);
 await page.emulateMedia({reducedMotion:'no-preference'});
 assert.equal(await page.evaluate(()=>{pressTestButton.dispatchEvent(new PointerEvent('pointerdown',{bubbles:true,button:0,isPrimary:true}));pressTestButton.dispatchEvent(new PointerEvent('pointercancel',{bubbles:true}));return pressTestFace.getAnimations().length}),0,'cancelled gesture clears feedback');
 const layouts=await page.evaluate(()=>[...$('#presentation').options].map(o=>o.value));
 for(const layout of layouts){
  const count=await page.evaluate(layout=>{setPresentation(layout);const row=$('#grid .game');if(!row)return 0;row.dispatchEvent(new PointerEvent('pointerdown',{bubbles:true,button:0,isPrimary:true}));return row.getAnimations().filter(a=>a.effect.getTiming().duration===130).length},layout);
  assert.equal(count,0,layout+' game rows unchanged');
  assert.equal(await page.locator('#settings-button').evaluate(b=>getComputedStyle(b).webkitTapHighlightColor),'rgba(0, 0, 0, 0)',layout+' no native tap rectangle');
  if(await page.locator('#settings-button').isVisible())await page.locator('#settings-button').tap();
  else await page.evaluate(()=>showDialog('#settings-dialog'));
  assert.equal(await page.locator('#settings-dialog').evaluate(d=>d.open),true,layout+' opens settings');
  assert.equal(await page.locator('#settings-button').evaluate(b=>b.getAnimations().length),0,layout+' press does not linger behind dialog');
  await page.evaluate(()=>hideDialog('#settings-dialog'));
 }
 await page.evaluate(()=>{setPresentation('sedona');$('#sedona-track-next').click();window.blurPressFace=$('#sedona-track-next b');window.dispatchEvent(new Event('blur'))});
 assert.equal(await page.evaluate(()=>blurPressFace.getAnimations().length),0,'losing window focus clears feedback');
 await page.evaluate(()=>{$('#sedona-track-next').click();setPresentation('kyoto')});
 assert.equal(await page.evaluate(()=>blurPressFace.getAnimations().length),0,'layout switch clears feedback');
 await page.evaluate(()=>{setPresentation('sedona');showDialog('#settings-dialog')});
 assert.equal(await page.evaluate(()=>{const b=$('#close-settings');b.dispatchEvent(new PointerEvent('pointerdown',{bubbles:true,button:0,isPrimary:true}));return b.getAnimations().length}),0,'dialog controls do not inherit layout feedback');
 await page.evaluate(()=>{hideDialog('#settings-dialog');$('#sedona-track-next').onclick=()=>{}});
 await page.locator('#sedona-track-next').tap();
 await page.waitForTimeout(180);
 assert.equal(await page.locator('#sedona-track-next').evaluate(b=>getComputedStyle(b).outlineStyle),'none','touch does not leave a green transport focus rectangle');
 await page.evaluate(()=>controllerFocus($('#sedona-track-next'),true));
 assert.equal(await page.locator('#sedona-track-next').evaluate(b=>getComputedStyle(b).outlineStyle),'solid','controller focus remains visible');
 await page.locator('#sedona-tabs button').nth(1).tap();
 await page.waitForTimeout(180);
 assert.equal(await page.evaluate(()=>favoritesOnly),true,'actual Favorites tab action runs');
 assert.equal(await page.evaluate(()=>document.body.dataset.input),'touch','Favorites tap does not switch into controller mode');
 assert.equal(await page.locator('#sedona-tabs .current').evaluate(b=>getComputedStyle(b).outlineStyle),'none','Favorites tab has no green rectangle after touch');
 await page.evaluate(()=>controller('right'));
 assert.equal(await page.locator('#sedona-tabs .current').evaluate(b=>getComputedStyle(b).outlineStyle),'solid','category navigation retains controller focus');
 await page.evaluate(()=>{favoritesOnly=false;genre='';update();sedonaSelect(0,false);window.beforeStar=games.find(g=>g.id===presentationId).favorite===true});
 await page.locator('#sedona-favorite').tap();
 await page.waitForTimeout(180);
 assert.equal(await page.evaluate(()=>games.find(g=>g.id===presentationId).favorite===true),await page.evaluate(()=>!beforeStar),'real star button toggles favorite');
 assert.equal(await page.evaluate(()=>document.body.dataset.input),'touch','saving favorite preserves touch input');
 assert.equal(await page.locator('#sedona-favorite').evaluate(b=>getComputedStyle(b).outlineStyle),'none','real star button leaves no green focus rectangle');
 await page.evaluate(()=>controller('activate'));
 assert.equal(await page.evaluate(()=>document.body.dataset.input),'controller','controller activation takes over from a touched Favorite button');
 const starColor=await page.locator('#sedona-favorite b').evaluate(b=>getComputedStyle(b).color);
 await page.locator('#sedona-favorite').tap();await page.waitForTimeout(180);
 assert.notEqual(await page.locator('#sedona-favorite b').evaluate(b=>getComputedStyle(b).color),starColor,'Favorite star visually distinguishes on and off');
 assert.deepEqual(errors,[]);console.log('PASS raised-button feedback: touch, controller, no double pulse, immediate actions, cleanup, disabled controls, reduced motion, cancellation and 22-layout row isolation');
 }finally{await browser.close();await new Promise(r=>server.close(r));}
})().catch(e=>{console.error(e);process.exitCode=1});
