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
 for(const layout of ['redmond','hongkong','abbotsford','kyoto','bath','sedona']){
  await page.evaluate(l=>{applyAppearanceValues(builtinAppearancePresets.find(p=>p.values.presentation===l).values);genre='';query='';favoritesOnly=false;update()},layout);
  if(layout==='redmond')await page.evaluate(()=>setGenre('Puzzles'));
  if(layout==='redmond')assert.notEqual(await page.locator('#redmond-categories .current .folder').evaluate(n=>getComputedStyle(n,'::after').content),'none');
  if(layout==='hongkong'){
   assert.equal(await page.locator('#grid .presentation-selected').evaluate(n=>getComputedStyle(n,'::before').display),'block');
   for(const w of [640,800,1280]){await page.setViewportSize({width:w,height:480});assert.ok(await page.locator('#grid .presentation-selected .game-title').evaluate(n=>n.clientWidth>80));}
   await page.setViewportSize({width:1097,height:592});
  }
  if(layout==='abbotsford'){
   await page.evaluate(()=>{abbotsfordPane='games';abbotsfordFocus()});
   assert.equal(await page.locator('#grid .presentation-selected .bbs-cursor').evaluate(n=>getComputedStyle(n).animationName),'terminal-cursor');
   await page.evaluate(()=>showDialog('#settings-dialog'));await page.waitForTimeout(30);
   assert.equal(await page.locator('#grid .presentation-selected .bbs-cursor').evaluate(n=>getComputedStyle(n).animationPlayState),'paused');
   await page.evaluate(()=>hideDialog('#settings-dialog'));
  }
  if(layout==='kyoto'){
   await page.evaluate(()=>{document.body.dataset.selectionStyle='outline'});
   assert.equal(await page.locator('#grid .presentation-selected .cover').evaluate(n=>getComputedStyle(n,'::before').animationName),'kyoto-arrive');
  }
  if(layout==='bath'){
   const angles=await page.evaluate(()=>games.slice(0,100).map(g=>parseFloat(bathTapeAngle(g.id))));assert.ok(angles.every(a=>a>=-12&&a<=12));assert.ok(new Set(angles).size>20);
   const first=await page.evaluate(()=>{bathSelect(0);return document.querySelector('#bath-print').style.getPropertyValue('--bath-tape-angle')});
   assert.equal(await page.evaluate(()=>{bathSelect(1);bathSelect(0);return document.querySelector('#bath-print').style.getPropertyValue('--bath-tape-angle')}),first);
   await page.evaluate(()=>showDialog('#settings-dialog'));await page.evaluate(()=>updateAppearancePreview());
   const transforms=await page.evaluate(()=>[getComputedStyle($('#bath-print'),'::after').transform,getComputedStyle($('.appearance-sample'),'::after').transform]);assert.equal(transforms[0],transforms[1]);await page.evaluate(()=>hideDialog('#settings-dialog'));
  }
  if(layout==='sedona'){
   await page.evaluate(()=>{games[0].title='A radio title far too long to fit in the display '.repeat(5);update();sedonaSelect(0)});await page.waitForTimeout(100);
   assert.equal(await page.evaluate(()=>sedonaMarqueeAnimation.playState),'running');
   await page.evaluate(()=>showDialog('#settings-dialog'));await page.waitForTimeout(30);assert.equal(await page.evaluate(()=>sedonaMarqueeAnimation.playState),'paused');
   await page.evaluate(()=>hideDialog('#settings-dialog'));await page.waitForTimeout(30);assert.equal(await page.evaluate(()=>sedonaMarqueeAnimation.playState),'running');
   await page.evaluate(()=>onNativePause());assert.equal(await page.evaluate(()=>sedonaMarqueeAnimation.playState),'paused');
   await page.evaluate(()=>onNativeResume());assert.equal(await page.evaluate(()=>sedonaMarqueeAnimation.playState),'running');
   await page.evaluate(()=>setPresentation('library'));await page.waitForTimeout(100);assert.equal(await page.evaluate(()=>sedonaMarqueeAnimation),null);
   await page.evaluate(()=>setPresentation('sedona'));
  }
  await page.screenshot({path:path.resolve(__dirname,'../output/flourish-'+layout+'.png')});
 }
 await page.evaluate(()=>{setPresentation('copenhagen');query='';genre='';favoritesOnly=false;update()});
 for(const [width,height] of [[1920,1080],[1280,720],[1024,768],[1280,800],[960,640],[1280,550],[800,450]]){
  await page.setViewportSize({width,height});await page.waitForTimeout(180);
  for(let i=0;i<12;i++){
   await page.evaluate(i=>{presentationId=copenhagenIds[i];renderCopenhagen()},i);await page.waitForTimeout(160);
   const issues=await page.evaluate(()=>{
    const grid=$('#grid').getBoundingClientRect(),rows=[...document.querySelectorAll('#grid .game')].map(n=>n.getBoundingClientRect()),issues=[];
    rows.forEach((r,i)=>{if(r.left<grid.left||r.right>grid.right||r.top<grid.top||r.bottom>grid.bottom)issues.push('outside table '+i);if(r.top<0||r.bottom>innerHeight)issues.push('outside screen '+i);rows.slice(i+1).forEach(s=>{if(Math.min(r.right,s.right)>Math.max(r.left,s.left)&&Math.min(r.bottom,s.bottom)>Math.max(r.top,s.top))issues.push('overlap')})});return issues;
   });assert.deepEqual(issues,[],`${width}x${height} card ${i}`);
  }
 }
 await page.evaluate(()=>{copenhagenShuffle();copenhagenKeep();copenhagenReplace()});
 await page.setViewportSize({width:1097,height:592});await page.screenshot({path:path.resolve(__dirname,'../output/flourish-full-house.png')});
 await page.evaluate(()=>{setPresentation('bellevue');showcaseOpen(2)});await page.waitForTimeout(20);
 assert.ok(await page.locator('#blade-glint').count());
 assert.equal(await page.locator('#blade-glint').evaluate(n=>n.getAttribute('clip-path')),'url(#blade-clip-active)');
 await page.waitForTimeout(500);assert.equal(await page.locator('#blade-glint').evaluate(n=>n.getAnimations().length),0);
 await page.emulateMedia({reducedMotion:'reduce'});
 for(const layout of ['abbotsford','hongkong','kyoto']){
  await page.evaluate(l=>setPresentation(l),layout);
  assert.equal(await page.evaluate(()=>document.getAnimations().filter(a=>['terminal-cursor','pixel-arrive','kyoto-arrive'].includes(a.animationName)).length),0,'reduced motion '+layout);
 }
 assert.deepEqual(errors,[]);console.log('PASS flourishes: folder, arrow, cursor, outline, stable tape, matching preview, marquee lifecycle and reduced motion');
 }finally{await browser.close();await new Promise(r=>server.close(r));}
})().catch(e=>{console.error(e);process.exitCode=1});
