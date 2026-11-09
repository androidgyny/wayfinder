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



 await page.evaluate(()=>{applyAppearanceValues(builtinAppearancePresets.find(p=>p.name==='Exposure').values);genre='';favoritesOnly=false;query='';update();rochesterSelect(1)});
 await page.evaluate(()=>document.fonts.ready);
 for(const [w,h] of [[1097,592],[800,600],[960,600],[900,600],[1260,540],[640,360]]){
  await page.setViewportSize({width:w,height:h});await page.waitForTimeout(200);
  for(const end of [0,1]){
   const clearance=await page.evaluate(end=>{const tabs=$('#rochester-tabs'),grid=$('#grid');tabs.scrollLeft=end?tabs.scrollWidth:0;const t=tabs.getBoundingClientRect(),g=grid.getBoundingClientRect(),radius=parseFloat(getComputedStyle(grid).borderTopLeftRadius);return {safe:t.left>=g.left+radius&&t.right<=g.right-radius&&Math.abs(t.bottom-g.top)<1,t:{left:t.left,right:t.right,bottom:t.bottom},g:{left:g.left,right:g.right,top:g.top}}},end);
   assert.ok(clearance.safe,'tabs meet rim and clear both frame corners: '+JSON.stringify({w,h,end,clearance}));
  }
  const geometry=await page.evaluate(()=>[...$('#grid').querySelectorAll('.game')].map(b=>{const r=b.querySelector('img').getBoundingClientRect(),f=b.querySelector('.cover').getBoundingClientRect(),l=b.querySelector('.rochester-label').getBoundingClientRect(),g=$('#grid').getBoundingClientRect();return {ratio:r.width/r.height,inside:f.left>=g.left&&f.right<=g.right&&f.top>=g.top&&l.bottom<=g.bottom,frame:{x:f.x,y:f.y,w:f.width,h:f.height},labelBottom:l.bottom,gridBottom:g.bottom}}));
  const labels=await page.locator('.lighttable-title').evaluateAll(nodes=>nodes.map(e=>({text:e.textContent,w:e.clientWidth,scroll:e.scrollWidth,space:getComputedStyle(e).whiteSpace,display:getComputedStyle(e).display,parent:e.parentElement.getBoundingClientRect().width})));assert.ok(labels.every(e=>e.w>0&&e.space==='nowrap'),JSON.stringify({w,h,labels}));assert.ok(geometry.length);for(const r of geometry){assert.ok(Math.abs(r.ratio-2/3)<.002,JSON.stringify(r));assert.ok(r.inside,JSON.stringify({w,h,r}));}
  await page.evaluate(()=>{rochesterPane='games';rochesterSelect(0);controller('right')});assert.ok(await page.evaluate(()=>presentationId===filtered[1].id));
  await page.evaluate(()=>controller('pageDown'));assert.ok(await page.evaluate(()=>filtered.findIndex(g=>g.id===presentationId)>1));
  await page.evaluate(()=>rochesterSelect(filtered.length-1));assert.equal(await page.locator('#rochester-next').isDisabled(),true);
  await page.evaluate(()=>{query='unfindable';$('#search').value=query;update()});assert.ok(await page.locator('.search-empty').isVisible());
  await page.evaluate(()=>{query='';$('#search').value='';update();rochesterSelect(1)});
  await page.evaluate(()=>document.body.classList.add('search-active'));
  assert.ok(await page.locator('.topbar .search').evaluate(e=>e.getBoundingClientRect().right+1<=$('.app-actions').getBoundingClientRect().left),'search does not overlap actions');
  await page.evaluate(()=>document.body.classList.remove('search-active'));
 }
 await page.setViewportSize({width:1097,height:592});await page.waitForTimeout(200);await page.screenshot({path:'output/rochester-browser.png'});
 await page.evaluate(()=>{rochesterPane='tabs';rochesterFocus();controller('right')});assert.equal(await page.evaluate(()=>rochesterPane),'tabs');
 const tabFocus=await page.locator('#rochester-tabs .current').evaluate(e=>({outline:getComputedStyle(e).outlineStyle,rim:getComputedStyle(e,'::before').backgroundImage,mask:getComputedStyle(e,'::before').webkitMaskImage}));
 assert.equal(tabFocus.outline,'none');assert.ok(tabFocus.rim.includes('lighttable-tab-focus.svg'));assert.ok(tabFocus.mask.includes('lighttable-tab-mask.svg'));
 await page.screenshot({path:'output/rochester-tab-focus.png'});
 await page.evaluate(()=>{controller('down');controller('favorite');controller('edit')});assert.ok(await page.locator('#editor').evaluate(d=>d.open));await page.evaluate(()=>cancelEditor());
 await page.evaluate(()=>setPresentation('bend'));assert.equal(await page.locator('#rochester-tabs').isVisible(),false);
 await page.evaluate(()=>setPresentation('rochester'));assert.equal(await page.locator('#rochester-tabs').isVisible(),true);
 await page.setViewportSize({width:1097,height:270});await page.evaluate(()=>{document.body.classList.add('input-compact','search-active');query='unfindable';$('#search').value=query;update();sizePresentation()});await page.waitForTimeout(150);
 await page.screenshot({path:'output/rochester-keyboard-debug.png'});
 assert.ok(await page.locator('.search-empty').evaluate(e=>{const r=e.getBoundingClientRect();return r.top>=0&&r.bottom<=innerHeight}),'empty search stays in keyboard viewport');
 await page.evaluate(()=>{query='';$('#search').value='';document.body.classList.remove('input-compact','search-active');update()});await page.setViewportSize({width:1097,height:592});await page.waitForTimeout(200);
 await page.evaluate(()=>{showDialog('#settings-dialog');updateAppearancePreview()});
 const preview=await page.locator('.appearance-sample').evaluate(e=>({image:getComputedStyle(e).borderImageSource,shadow:getComputedStyle(e).boxShadow}));assert.equal(preview.image,'none');assert.notEqual(preview.shadow,'none');
 await page.evaluate(()=>hideDialog('#settings-dialog'));
 assert.equal(await page.locator('.lighttable-kind').count(),0);
 await page.evaluate(()=>{genre='A very long user category name that must remain usable';favoritesOnly=false;update()});
 await page.waitForTimeout(100);
 assert.equal(await page.locator('#rochester-tabs .current.marquee').count(),1,'overflowing active tab scrolls');
 assert.equal(await page.locator('#rochester-tabs .marquee:not(.current)').count(),0,'inactive tabs stay still');
 const moving=await page.locator('#rochester-tabs .current .rochester-tab-text').evaluate(e=>getComputedStyle(e).animationName);assert.equal(moving,'rochester-tab-scroll');
 await page.evaluate(()=>{genre='Puzzles';update()});
 assert.equal(await page.locator('#rochester-tabs .marquee').count(),0,'short active tab and inactive long tab stay still');
 assert.equal(await page.locator('#rochester-tabs .rochester-tab:not(.marquee) .rochester-tab-text').first().evaluate(e=>getComputedStyle(e).textOverflow),'ellipsis');
 for(const w of [640,800,1097,1260]){
  await page.setViewportSize({width:w,height:592});await page.waitForTimeout(200);
  for(let i=0;i<6;i++){
   await page.evaluate(i=>rochesterOpen(i),i);
   assert.ok(await page.locator('#rochester-tabs').evaluate(e=>{const r=e.getBoundingClientRect();return [...e.querySelectorAll('.rochester-tab:not([hidden])')].every(b=>{const t=b.getBoundingClientRect();return t.left>=r.left&&t.right<=r.right})}),'complete tabs at every category');
   assert.ok(await page.locator('#rochester-tabs .current').isVisible());
  }
 }
 await page.evaluate(()=>rochesterOpen(0));
 await page.locator('[data-tab-page="1"]').click();assert.ok(await page.evaluate(()=>sectionIndex()>0));
 await page.locator('[data-tab-page="-1"]').click();assert.equal(await page.evaluate(()=>sectionIndex()),0);
 assert.deepEqual(errors,[]);console.log('Rochester: six aspect ratios, frames/labels, 2:3 art, paging, empty search, header overlap, gamepad, favorites, editor and layout switching passed.');
 }finally{await browser.close();await new Promise(r=>server.close(r))}
})().catch(e=>{console.error(e);process.exit(1)});
